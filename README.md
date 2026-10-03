# Dva Kol'ory (2K) — фронтенд

Веб-клієнт рейтингової платформи для клубів гри «Мафія» (Vancouver): клуби, учасники,
ігри, турніри та підрахунок рейтингу.

React 19 · TypeScript · MUI 6 · Create React App · Cloudflare Pages

## Повний локальний запуск

Цей застосунок сам по собі не працює: усі дані він бере з API, тож без піднятого
бекенду ви отримаєте порожні екрани й помилки мережі. Продукт складається з двох
репозиторіїв, і локально треба запускати обидва.

Очікувана розкладка на диску:

```text
2k/
├── 2k_api/
└── 2k_client/   ← ви тут
```

Потрібні Node.js 22+ і pnpm (бекенд ставиться через npm). Ані AWS, ані Docker,
ані зовнішня MongoDB не потрібні.

### Швидко: одним скриптом

`dev.sh` і `dev.ps1` піднімають обидві половини одразу. Скрипти лежать в обох
репозиторіях і однакові — запускайте той, що під рукою.

```bash
./dev.sh            # у цьому терміналі; Ctrl+C гасить обидва
./dev.sh start      # у фоні; повертає керування, коли порти слухають
./dev.sh status     # хто слухає порти API і фронтенду
./dev.sh logs 100   # останні рядки логів
./dev.sh stop       # гасить обидва, хоч би як їх запустили
```

```powershell
pwsh -File .\dev.ps1                 # у цьому вікні; Ctrl+C гасить обидва
pwsh -File .\dev.ps1 start           # у фоні
pwsh -File .\dev.ps1 status
pwsh -File .\dev.ps1 logs -Lines 100
pwsh -File .\dev.ps1 stop
```

Скрипт сам перевіряє, що обидві теки на місці й потрібні порти вільні, за потреби
створює `.env` зі зразка (`env.example` у клієнті, `.env.example` в API) і ставить залежності, а тоді запускає обидва процеси.
У режимі за замовчуванням він зводить їхні логи в один потік із префіксами `[api]` і `[web]`.
Повний вивід пишеться у `.dev-logs/` (у git не потрапляє).

Половину з того репозиторію, звідки запущено скрипт, він бере з цього ж checkout —
зокрема з git worktree у `.claude/worktrees/`. Другу половину бере з головного
checkout сусіднього репозиторію. Так фронтенд з гілки-worktree працює з API з `2k_api`.

`stop` зупиняє лише процеси node на портах стека. Якщо порт тримає інша програма,
скрипт її не чіпає й пише, що саме тримає порт.

Далі — те саме вручну, якщо потрібен контроль над кожним кроком.

### 1. Бекенд — термінал 1

Спершу API, бо фронтенд без нього марний:

```bash
cd ../2k_api
cp .env.example .env
npm install --legacy-peer-deps
npm run start:local
```

Слухає `http://localhost:3000` і піднімає власну локальну MongoDB — `MONGO_URL` у `.env`
лишають порожнім навмисно. Перевірка: `curl http://localhost:3000/hello`.
Подробиці — у [README бекенду](../2k_api/README.md).

### 2. Фронтенд — термінал 2

```bash
cd 2k_client
cp env.example .env
pnpm install
pnpm start
```

Відкриється `http://localhost:3005`.

### Як половинки знаходять одна одну

| Змінна | Файл | Локальне значення | Якщо не задати |
|---|---|---|---|
| `REACT_APP_API_URL` | `2k_client/.env` | `http://localhost:3000` | фолбек — порожній рядок, тобто **той самий origin**. Локально це дев-сервер CRA на 3005: він API не обслуговує, тож запити повернуть HTML замість JSON |
| `PORT` | `2k_client/.env` | `3005` | CRA стане на 3000 і зіткнеться з API за той самий порт |
| `FRONTEND_URL` | `2k_api/.env` | `http://localhost:3005` | посилання у листах відновлення пароля вестимуть на прод |

Базова адреса API читається один раз у [`src/axios.tsx`](src/axios.tsx); фолбек там —
порожній рядок, тобто той самий origin. У продакшн це правильно: Cloudflare Pages направляє
кореневі шляхи Express у Lambda, тому змінну в продакшн-збірці **не задають**.
Локально порожній фолбек означає, що запити підуть у дев-сервер CRA на 3005 і повернуть
HTML замість JSON. CRA підхоплює `.env` лише при старті: після правки перезапустіть `pnpm start`.

CORS на API відкритий для всіх джерел, тож проксі налаштовувати не треба.

### Перший запуск: база порожня

Локальна MongoDB стартує без жодного запису, і увійти нема ким:

1. Зареєструйте клуб на `/register-club` — це обліковий запис із правами створювати ігри,
   турніри та рейтингові періоди.
2. Увійдіть на `/login` під ним.
3. Гравців додавайте вже зсередини: реєстрація на `/register` або додавання учасників у клуб.

Публічні сторінки (`/`, `/clubs`, `/clubs-rating`, `/scoring`) відкриваються без входу,
але на порожній базі показують порожні списки — це нормально.

### Що локально не працює

Обидва обмеження на боці API, обидва впираються у зовнішні сервіси:

- **Відновлення пароля** (`/reset-password`) — лист іде через Mailtrap, якого локально
  зазвичай не налаштовують.
- **Завантаження аватарів** — пише в S3; без бакета запит повертає 500. Решта UI працює.

## Команди

| Команда | Що робить |
|---|---|
| `pnpm start` | дев-сервер на порту з `.env` (3005) |
| `pnpm build` | продакшн-збірка в `build/` |
| `pnpm test` | тести react-scripts |
| `node --test edge/*.test.mjs` | тести Pages Function (проксі API й аватарів) |
| `./dev.sh` · `pwsh -File .\dev.ps1` | піднімає бекенд + фронтенд разом, Ctrl+C гасить обидва |
| `./dev.sh start\|stop\|status\|logs` · `dev.ps1 start\|stop\|status\|logs` | те саме у фоні: запуск, зупинка, стан, логи |

## Продакшн: Cloudflare Pages

Сайт живе на Cloudflare Pages за адресою `https://2kmaf.ca`. CloudFront у новому акаунті AWS
недоступний — див. ADR 0006 у `2k_api`. В AWS лишилися Lambda (API), приватний S3 з аватарами
й секрети в SSM.

Домен `2kmaf.ca` зареєстровано в **Porkbun**; nameserver-и вказують на **Cloudflare**, тож усі
DNS-записи живуть у Cloudflare. Повна схема з C4-діаграмами —
[`2k_api/docs/architecture/aws-deployment.md`](../2k_api/docs/architecture/aws-deployment.md).

```text
браузер → Cloudflare Pages
          ├─ статика з build/                      (безкоштовно, без ліміту)
          └─ functions/[[path]].js → edge/proxy.mjs (лише шляхи з public/_routes.json)
               ├─ API      → Lambda Function URL + x-origin-secret
               └─ /avatars → приватний S3, підписаний GET, кеш Cloudflare
```

| Файл | Що робить |
|---|---|
| `public/_routes.json` | які шляхи викликають функцію. **Новий кореневий маршрут в API без рядка тут віддаватиме `index.html`** |
| `edge/proxy.mjs` | проксі API й аватарів; браузерна навігація на `/clubs` отримує `index.html`, а не JSON |
| `public/_headers` | security headers і річний кеш для `/static/*` |
| `.github/workflows/deploy.yml` | збірка → `wrangler pages deploy` → перевірка бандла й `/hello` (повтори до 60 с) |

Безкоштовний ліміт — 100 000 викликів функції на добу. Статика його не витрачає.

### Одноразове налаштування

1. Створити проєкт (один раз, локально):
   ```bash
   pnpm exec wrangler login
   pnpm exec wrangler pages project create 2k-client --production-branch main
   ```
2. GitHub `2k_client` → Settings → Secrets and variables → Actions:
   - **Secrets:** `CLOUDFLARE_API_TOKEN` (шаблон «Edit Cloudflare Workers» + Pages:Edit),
     `CLOUDFLARE_ACCOUNT_ID`.
   - **Variables:** `CF_PAGES_PROJECT=2k-client`, `SITE_URL=https://2kmaf.ca`.
     Старі `AWS_REGION`, `AWS_DEPLOY_ROLE`, `S3_BUCKET`, `CF_DISTRIBUTION_ID` видалити.
3. Змінні функції — Pages → 2k-client → Settings → Variables and Secrets (Production),
   усі як **Secret**. Значення дає `terraform output pages_settings` у `2k_api`:

   | Змінна | Звідки |
   |---|---|
   | `API_ORIGIN` | Function URL Lambda |
   | `ORIGIN_SECRET` | `terraform output -raw origin_secret` |
   | `AVATARS_BUCKET`, `AVATARS_REGION` | ім'я бакета аватарів і регіон |
   | `AVATARS_READER_KEY_ID`, `AVATARS_READER_SECRET` | ключ IAM-користувача `2k-prod-avatars-reader` (README Terraform) |

   Або з терміналу: `pnpm exec wrangler pages secret put ORIGIN_SECRET --project-name 2k-client`.

   > **Змінні діють лише на нові деплої.** Після зміни змінних перезапустіть
   > Actions → **Deploy client** → **Run workflow**. Інакше функція відповідає
   > `500 {"message":"Server misconfigured"}`.
4. Pages → 2k-client → Custom domains → додати домен і `www`. DNS і сертифікат Cloudflare
   створить сам. `www.2kmaf.ca` відповідає 301 на корінь `https://2kmaf.ca/`.
5. Записи Mailtrap (DKIM `rwmt1`/`rwmt2._domainkey`, `_dmarc`, `mt-link` та інші зі списку
   Mailtrap → Sending Domains → `2kmaf.ca`) — у DNS зони, режим **DNS only**. Через проксі
   Cloudflare DKIM не проходить перевірку.

### Локальна перевірка функції

```bash
pnpm build
printf 'API_ORIGIN=http://127.0.0.1:3000\nORIGIN_SECRET=local\n' > .dev.vars   # локальний API секрет не перевіряє
pnpm exec wrangler pages dev build
```

## Документація

Архітектура, ADR та інфраструктура **обох** застосунків описані в репозиторії бекенду —
цей репозиторій власної інфраструктурної документації не має і Terraform не містить:

- [`2k_api/docs/`](../2k_api/docs/README.md) — архітектура та архітектурні рішення
- [`2k_api/docs/architecture/repo-topology.md`](../2k_api/docs/architecture/repo-topology.md) — чому інфраструктура фронтенду живе там, як влаштований CI/CD
- [`2k_api/SCORING.md`](../2k_api/SCORING.md) — правила нарахування балів
