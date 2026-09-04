#!/usr/bin/env bash
#
# Піднімає локально обидві половини Dva Kol'ory (2K) — API і фронтенд — і зупиняє
# обидві при Ctrl+C або будь-якому виході зі скрипта.
#
# Розраховує, що репозиторії лежать поруч і названі так само, як на GitHub:
#
#   2k/
#   ├── 2k_api/
#   └── 2k_client/
#
# Скрипт однаковий в обох репозиторіях — запускайте той, що під рукою.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
API_DIR="$ROOT/2k_api"
CLIENT_DIR="$ROOT/2k_client"
LOG_DIR="$SCRIPT_DIR/.dev-logs"

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

kill_port() {
    local pid; pid="$(port_pid "$1")"
    [[ -z "$pid" ]] && return 0
    if is_windows; then
        taskkill //PID "$pid" //T //F >/dev/null 2>&1
    else
        kill -TERM "$pid" 2>/dev/null
    fi
    return 0
}

cleanup() {
    trap '' INT TERM EXIT
    STOPPING=1
    printf '\n'
    info 'Зупиняю…'
    kill_tree "$CLIENT_PID"
    kill_tree "$API_PID"
    # Підстраховка: react-scripts і mongodb-memory-server іноді переживають смерть
    # батька, а живий процес тримає .mongo-local і наступний запуск падає.
    sleep 1
    kill_port "$CLIENT_PORT"
    kill_port "$API_PORT"
    print_new "$LOG_DIR/api.log"    "${C_API}[api]${C_RESET}"
    print_new "$LOG_DIR/client.log" "${C_WEB}[web]${C_RESET}"
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

# Значення змінної з .env (без експорту в поточну оболонку).
env_value() {
    local file="$1" key="$2"
    [[ -f "$file" ]] || return 0
    grep -E "^[[:space:]]*$key=" "$file" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r"'"'"' '
}

ensure_env() {
    local dir="$1"
    [[ -f "$dir/.env" ]] && return 0
    # 2k_api тримає зразок як .env.example, 2k_client — як env.example.
    local src=""
    for cand in "$dir/.env.example" "$dir/env.example"; do
        [[ -f "$cand" ]] && { src="$cand"; break; }
    done
    [[ -n "$src" ]] || die "Немає ні .env, ні зразка (.env.example / env.example) у $dir"
    cp "$src" "$dir/.env"
    warn "Створив $(basename "$dir")/.env з $(basename "$src")"
}

# ── Перевірки ────────────────────────────────────────────────────────────────
[[ -d "$API_DIR"    ]] || die "Не знайшов $API_DIR. Репозиторії мають лежати поруч: 2k_api та 2k_client."
[[ -d "$CLIENT_DIR" ]] || die "Не знайшов $CLIENT_DIR. Репозиторії мають лежати поруч: 2k_api та 2k_client."

command -v node >/dev/null || die 'Немає node. Потрібен Node.js 22+.'
command -v npm  >/dev/null || die 'Немає npm.'
command -v pnpm >/dev/null || die 'Немає pnpm. Встановіть: npm i -g pnpm'

ensure_env "$API_DIR"
ensure_env "$CLIENT_DIR"

_api_port="$(env_value "$API_DIR/.env" PORT)";          [[ -n "$_api_port"    ]] && API_PORT="$_api_port"
_client_port="$(env_value "$CLIENT_DIR/.env" PORT)";    [[ -n "$_client_port" ]] && CLIENT_PORT="$_client_port"

for spec in "API:$API_PORT" "фронтенду:$CLIENT_PORT"; do
    name="${spec%%:*}"; port="${spec##*:}"
    busy="$(port_pid "$port")"
    [[ -n "$busy" ]] && die "Порт $port ($name) вже зайнятий процесом $busy. Зупиніть його й повторіть."
done

[[ -d "$API_DIR/node_modules"    ]] || { info 'Ставлю залежності API…';       (cd "$API_DIR"    && npm install --legacy-peer-deps) || die 'npm install впав'; }
[[ -d "$CLIENT_DIR/node_modules" ]] || { info 'Ставлю залежності фронтенду…'; (cd "$CLIENT_DIR" && pnpm install)                   || die 'pnpm install впав'; }

# ── Запуск ───────────────────────────────────────────────────────────────────
mkdir -p "$LOG_DIR"
: >"$LOG_DIR/api.log"
: >"$LOG_DIR/client.log"

trap 'cleanup; exit 0' INT TERM
trap cleanup EXIT

info "API      → http://localhost:$API_PORT"
info "Фронтенд → http://localhost:$CLIENT_PORT"
info 'Ctrl+C зупиняє обидва.'
printf '\n'

# Логи йдуть у файли, а в термінал — з префіксами: react-scripts інакше чистить
# екран і затирає вивід API.
( cd "$API_DIR"    && npm run start:local ) >"$LOG_DIR/api.log"    2>&1 &
API_PID=$!
( cd "$CLIENT_DIR" && pnpm start          ) >"$LOG_DIR/client.log" 2>&1 &
CLIENT_PID=$!

# Живемо, доки живі обидва.
while kill -0 "$API_PID" 2>/dev/null && kill -0 "$CLIENT_PID" 2>/dev/null; do
    print_new "$LOG_DIR/api.log"    "${C_API}[api]${C_RESET}"
    print_new "$LOG_DIR/client.log" "${C_WEB}[web]${C_RESET}"
    sleep 1
done

# Один із процесів впав сам — скажемо, який саме; другий прибере trap EXIT.
if [[ "$STOPPING" -eq 0 ]]; then
    kill -0 "$API_PID"    2>/dev/null || warn 'API завершився сам — дивіться .dev-logs/api.log'
    kill -0 "$CLIENT_PID" 2>/dev/null || warn 'Фронтенд завершився сам — дивіться .dev-logs/client.log'
fi
