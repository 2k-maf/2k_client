#!/usr/bin/env bash
#
# Керує локальним запуском обох половин Dva Kol'ory (2K): API і фронтенду.
#
# Розраховує, що репозиторії лежать поруч і названі так само, як на GitHub:
#
#   2k/
#   ├── 2k_api/
#   └── 2k_client/
#
# Скрипт однаковий в обох репозиторіях — запускайте той, що під рукою.
# Половину з того репозиторію, звідки запущено скрипт, він бере з цього ж
# checkout (зокрема з git worktree), а другу — з головного checkout сусіда.
#
# Команди:
#   ./dev.sh [up]       запускає обидва в цьому терміналі; Ctrl+C зупиняє обидва.
#   ./dev.sh start      запускає обидва у фоні й повертає керування, коли порти слухають.
#   ./dev.sh stop       зупиняє обидва, хоч би як їх запустили.
#   ./dev.sh status     показує, хто слухає порти API і фронтенду.
#   ./dev.sh logs [N]   друкує останні N рядків логів (типово 40).

set -uo pipefail

COMMAND="${1:-up}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# У git worktree скрипт лежить у <repo>/.claude/worktrees/<name>, тож сусідній
# репозиторій шукаємо поруч із головним checkout, а не поруч зі скриптом.
MAIN_DIR="$SCRIPT_DIR"
_common="$(git -C "$SCRIPT_DIR" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" \
    && [[ -n "$_common" ]] && MAIN_DIR="$(dirname "$_common")"
ROOT="$(dirname "$MAIN_DIR")"

if [[ -f "$SCRIPT_DIR/local.server.js" ]]; then
    API_DIR="$SCRIPT_DIR";    CLIENT_DIR="$ROOT/2k_client"
else
    API_DIR="$ROOT/2k_api";   CLIENT_DIR="$SCRIPT_DIR"
fi
LOG_DIR="$SCRIPT_DIR/.dev-logs"
STATE_FILE="$LOG_DIR/state"

API_PID=""; CLIENT_PID=""; STOPPING=0
API_PORT=3000; CLIENT_PORT=3005

C_RESET=$'\033[0m'; C_API=$'\033[36m'; C_WEB=$'\033[35m'
C_INFO=$'\033[32m'; C_WARN=$'\033[33m'; C_ERR=$'\033[31m'

info() { printf '%s\n' "${C_INFO}▸ $*${C_RESET}"; }
warn() { printf '%s\n' "${C_WARN}! $*${C_RESET}"; }
die()  { printf '%s\n' "${C_ERR}✗ $*${C_RESET}" >&2; exit 1; }

is_windows() { [[ "${OSTYPE:-}" == msys* || "${OSTYPE:-}" == cygwin* ]]; }

# PID процесу, що слухає порт (Windows PID на msys, звичайний — на Unix).
port_pid() {
    local port="$1"
    if is_windows; then
        netstat -ano 2>/dev/null \
            | tr -d '\r' \
            | awk -v p=":$port" '$1=="TCP" && $4=="LISTENING" && $2 ~ p"$" {print $5; exit}'
    else
        lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null | head -1
    fi
}

# Ім'я процесу за PID з port_pid.
process_name() {
    local pid="$1"
    if is_windows; then
        tasklist //FI "PID eq $pid" //FO CSV //NH 2>/dev/null | tr -d '\r' | head -1 | cut -d, -f1 | tr -d '"'
    else
        ps -p "$pid" -o comm= 2>/dev/null | xargs basename 2>/dev/null
    fi
}

# Зупиняє процес разом з усім деревом нащадків: npm/pnpm породжують node, і без
# цього дочірній процес переживає батька та тримає порт.
kill_tree() {
    local pid="$1"
    [[ -z "$pid" ]] && return 0
    if is_windows; then
        # bash-PID → Windows-PID; без відповідності нічого не робимо, бо чужий
        # Windows-PID з таким номером убивати не можна.
        local winpid
        winpid="$(ps -W 2>/dev/null | tr -d '\r' | awk -v p="$pid" '$1==p {print $4; exit}')"
        [[ -n "$winpid" ]] && taskkill //PID "$winpid" //T //F >/dev/null 2>&1
    else
        pkill -TERM -P "$pid" 2>/dev/null
        kill -TERM "$pid" 2>/dev/null
    fi
    return 0
}

# Звільняє порт. Зупиняє лише node: порт стека може зайняти чужа програма, і
# вбивати її мовчки не можна.
kill_port() {
    local port="$1" pid name
    pid="$(port_pid "$port")"
    [[ -z "$pid" ]] && return 0
    name="$(process_name "$pid")"
    if [[ "$name" != node && "$name" != node.exe ]]; then
        warn "Порт $port тримає ${name:-невідомий процес} (PID $pid), а не node. Не зупиняю його."
        return 0
    fi
    if is_windows; then
        taskkill //PID "$pid" //T //F >/dev/null 2>&1
    else
        pkill -TERM -P "$pid" 2>/dev/null
        kill -TERM "$pid" 2>/dev/null
    fi
    return 0
}

# Зупиняє стек: спершу PID цього запуску й записані PID фонового запуску,
# потім усе, що лишилося на портах.
cleanup() {
    trap '' INT TERM EXIT
    STOPPING=1
    info 'Зупиняю…'
    kill_tree "$CLIENT_PID"
    kill_tree "$API_PID"
    if [[ -f "$STATE_FILE" ]]; then
        local saved_api saved_client
        read -r saved_api saved_client < "$STATE_FILE"
        kill_tree "$saved_client"
        kill_tree "$saved_api"
        rm -f "$STATE_FILE"
    fi
    # Підстраховка: react-scripts і mongodb-memory-server іноді переживають смерть
    # батька, а живий процес тримає .mongo-local і наступний запуск падає.
    sleep 1
    kill_port "$CLIENT_PORT"
    kill_port "$API_PORT"
    info 'Зупинено.'
}

# Друкує рядки, що з'явилися у файлі з минулого виклику.
#
# Свідомо без «tail -F | sed» у фоні: у такому конвеєрі $! вказує на хвіст, tail
# лишається сиротою після зупинки і тримає лог-файл відкритим. Опитування з
# основного циклу не залишає по собі жодного зайвого процесу.
declare -A LOG_POS
print_new() {
    local file="$1" pfx="$2" size pos
    [[ -f "$file" ]] || return 0
    size="$(wc -c < "$file" 2>/dev/null | tr -d ' ')"
    pos="${LOG_POS[$file]:-0}"
    [[ -z "$size" ]] && return 0
    (( size <= pos )) && return 0
    while IFS= read -r line || [[ -n "$line" ]]; do
        printf '%s %s\n' "$pfx" "$line"
    done < <(tail -c "+$((pos + 1))" "$file" 2>/dev/null)
    LOG_POS[$file]="$size"
    return 0
}

show_log_tail() {
    local lines="$1" file
    for file in "$LOG_DIR/api.log" "$LOG_DIR/client.log"; do
        [[ -s "$file" ]] || continue
        printf '%s\n' "${C_API}--- $file${C_RESET}"
        tail -n "$lines" "$file"
    done
}

# Значення змінної з .env (без експорту в поточну оболонку).
env_value() {
    local file="$1" key="$2"
    [[ -f "$file" ]] || return 0
    grep -E "^[[:space:]]*$key=" "$file" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r"'"'"' '
}

# Порти з .env; без .env лишаються типові 3000 і 3005.
read_ports() {
    local p
    p="$(env_value "$API_DIR/.env" PORT)";    [[ -n "$p" ]] && API_PORT="$p"
    p="$(env_value "$CLIENT_DIR/.env" PORT)"; [[ -n "$p" ]] && CLIENT_PORT="$p"
    return 0
}

ensure_env() {
    local dir="$1"
    # 2k_api тримає зразок як .env.example, 2k_client — як env.example.
    local src=""
    for cand in "$dir/.env.example" "$dir/env.example"; do
        [[ -f "$cand" ]] && { src="$cand"; break; }
    done

    if [[ ! -f "$dir/.env" ]]; then
        [[ -n "$src" ]] || die "Немає ні .env, ні зразка (.env.example / env.example) у $dir"
        cp "$src" "$dir/.env"
        warn "Створив $(basename "$dir")/.env з $(basename "$src")"
        return 0
    fi

    # Ключ, що з'явився у зразку після створення .env, інакше тихо вимикає функцію
    # (так зник вхід через Google). Порожні у зразку ключі — це секрети на ваш
    # вибір, про них не попереджаємо. .env не дописуємо: це ваш файл.
    [[ -n "$src" ]] || return 0
    local key missing=""
    while IFS= read -r key; do
        grep -qE "^[[:space:]]*$key[[:space:]]*=" "$dir/.env" || missing="${missing:+$missing, }$key"
    done < <(tr -d '\r' < "$src" | sed -nE 's/^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=[[:space:]]*[^[:space:]].*/\1/p')
    [[ -n "$missing" ]] && warn "$(basename "$dir")/.env не має ключів зі зразка $(basename "$src"): $missing. Скопіюйте потрібні рядки зі зразка."
    return 0
}

# Перевірки, .env, залежності й порожні логи — спільна підготовка для up і start.
prepare() {
    [[ -d "$API_DIR"    ]] || die "Не знайшов $API_DIR. Репозиторії мають лежати поруч: 2k_api та 2k_client."
    [[ -d "$CLIENT_DIR" ]] || die "Не знайшов $CLIENT_DIR. Репозиторії мають лежати поруч: 2k_api та 2k_client."

    command -v node >/dev/null || die 'Немає node. Потрібен Node.js 22+.'
    command -v npm  >/dev/null || die 'Немає npm.'
    command -v pnpm >/dev/null || die 'Немає pnpm. Встановіть: npm i -g pnpm'

    ensure_env "$API_DIR"
    ensure_env "$CLIENT_DIR"
    read_ports

    local spec name port busy
    for spec in "API:$API_PORT" "фронтенду:$CLIENT_PORT"; do
        name="${spec%%:*}"; port="${spec##*:}"
        busy="$(port_pid "$port")"
        [[ -n "$busy" ]] && die "Порт $port ($name) вже зайнятий процесом $busy. Зупиніть його (./dev.sh stop) й повторіть."
    done

    [[ -d "$API_DIR/node_modules"    ]] || { info 'Ставлю залежності API…';       (cd "$API_DIR"    && npm install)  || die 'npm install впав'; }
    [[ -d "$CLIENT_DIR/node_modules" ]] || { info 'Ставлю залежності фронтенду…'; (cd "$CLIENT_DIR" && pnpm install) || die 'pnpm install впав'; }

    mkdir -p "$LOG_DIR"
    : >"$LOG_DIR/api.log"
    : >"$LOG_DIR/client.log"

    info "API      → http://localhost:$API_PORT  ($API_DIR)"
    info "Фронтенд → http://localhost:$CLIENT_PORT  ($CLIENT_DIR)"
}

# Логи йдуть у файли, а в термінал — з префіксами: react-scripts інакше чистить
# екран і затирає вивід API. nohup тримає процеси живими після закриття
# терміналу у фоновому режимі; у режимі up їх однаково зупиняє trap.
launch() {
    ( cd "$API_DIR"    && exec nohup npm run start:local ) >"$LOG_DIR/api.log"    2>&1 </dev/null &
    API_PID=$!
    ( cd "$CLIENT_DIR" && exec nohup pnpm start          ) >"$LOG_DIR/client.log" 2>&1 </dev/null &
    CLIENT_PID=$!
}

cmd_up() {
    prepare
    trap 'cleanup; exit 0' INT TERM
    trap cleanup EXIT
    info 'Ctrl+C зупиняє обидва.'
    printf '\n'
    launch

    # Живемо, доки живі обидва.
    while kill -0 "$API_PID" 2>/dev/null && kill -0 "$CLIENT_PID" 2>/dev/null; do
        print_new "$LOG_DIR/api.log"    "${C_API}[api]${C_RESET}"
        print_new "$LOG_DIR/client.log" "${C_WEB}[web]${C_RESET}"
        sleep 1
    done
    print_new "$LOG_DIR/api.log"    "${C_API}[api]${C_RESET}"
    print_new "$LOG_DIR/client.log" "${C_WEB}[web]${C_RESET}"

    # Один із процесів впав сам — скажемо, який саме; другий прибере trap EXIT.
    if [[ "$STOPPING" -eq 0 ]]; then
        kill -0 "$API_PID"    2>/dev/null || warn 'API завершився сам — дивіться .dev-logs/api.log'
        kill -0 "$CLIENT_PID" 2>/dev/null || warn 'Фронтенд завершився сам — дивіться .dev-logs/client.log'
    fi
}

cmd_start() {
    prepare
    launch
    disown -a
    printf '%s %s\n' "$API_PID" "$CLIENT_PID" > "$STATE_FILE"

    # Порт відкривається раніше за першу компіляцію CRA, тож чекати недовго.
    local waited=0 failed=""
    until [[ -n "$(port_pid "$API_PORT")" && -n "$(port_pid "$CLIENT_PORT")" ]]; do
        kill -0 "$API_PID"    2>/dev/null || failed='API'
        kill -0 "$CLIENT_PID" 2>/dev/null || failed='Фронтенд'
        if [[ -n "$failed" || "$waited" -ge 180 ]]; then
            warn "${failed:+$failed завершився сам}${failed:-Порти не відкрилися за 180 с}. Останні рядки логів:"
            show_log_tail 40
            cleanup
            exit 1
        fi
        sleep 1; waited=$((waited + 1))
    done
    info "Працює у фоні. Логи: $LOG_DIR"
    info 'Зупинка: ./dev.sh stop. Стан: ./dev.sh status.'
}

cmd_status() {
    read_ports
    local spec name port pid
    # Назви вирівняні вручну: printf рахує ширину в байтах, а кирилиця двобайтова.
    for spec in "API     :$API_PORT" "Фронтенд:$CLIENT_PORT"; do
        name="${spec%%:*}"; port="${spec##*:}"
        pid="$(port_pid "$port")"
        if [[ -n "$pid" ]]; then
            printf '%s :%s  працює  PID %s (%s)\n' "$name" "$port" "$pid" "$(process_name "$pid")"
        else
            printf '%s :%s  не запущено\n' "$name" "$port"
        fi
    done
    if [[ -n "$(port_pid "$API_PORT")" ]]; then
        if curl -fsS --max-time 3 "http://localhost:$API_PORT/hello" >/dev/null 2>&1; then
            info 'API /hello відповідає.'
        else
            warn 'API слухає порт, але /hello не відповідає.'
        fi
    fi
}

case "$COMMAND" in
    up)     cmd_up ;;
    start)  cmd_start ;;
    stop)   read_ports; cleanup ;;
    status) cmd_status ;;
    logs)   show_log_tail "${2:-40}" ;;
    *)      die "Невідома команда: $COMMAND. Доступні: up, start, stop, status, logs." ;;
esac
