---
slug: first-step
date: 2026-09-07
triage: no-spec
acs: []
commit: <sha>
recurrence_of: none
---

# Fix: деплой падає на кроці «Креденшели AWS» з Not authorized to perform sts:AssumeRoleWithWebIdentity

## Symptom

Пуш у `main` (мердж PR #4, run 34170011169) мав залити збірку в S3 і інвалідувати
CloudFront. Кроки 1–6 пройшли, збірка зібралась. Крок 7 «Креденшели AWS» упав:

```
##[error]Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

Крок ретраїв близько двох хвилин, потім деплой став `failure`. Кроки заливки й
інвалідації пропущені. Це перший запуск воркфлову `deploy.yml`; отже, деплой не
працював жодного разу. Впливає на всі пуші в `main`.

## Root cause

GitHub з 2026-07-15 віддає незмінний (immutable) claim `sub` в OIDC-токені: після
імені власника й імені репозиторію він додає їхні постійні числові ID. Репозиторій
створений 2026-08-21, тому форма для нього обов'язкова, без опції відмови.
Фактичний claim — `repo:2k-maf@319206025/2k_client@1342281852:ref:refs/heads/main`.
Політика довіри ролі `2k-prod-gha-deploy-client` містила стару форму
`repo:2k-maf/2k_client:ref:refs/heads/main` в умові `StringEquals`. STS не знайшов
збігу і відмовив. Тести це не ловили: перевірки в репозиторії покривають типи й
збірку, а звірку токена з політикою довіри не робив ніхто.

Джерела: [Immutable subject claims for GitHub Actions OIDC tokens](https://github.blog/changelog/2026-04-23-immutable-subject-claims-for-github-actions-oidc-tokens/),
[Configuring OpenID Connect in AWS](https://docs.github.com/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services).

## The pinning test

`tools/check_oidc_trust.ps1` (рівень: інтеграційний, звіряє два зовнішні джерела —
`gh api repos/{repo}/actions/oidc/customization/sub` і `aws iam get-role`).

Перший прогін, до виправлення:

```
Токен GitHub несе sub : repo:2k-maf@319206025/2k_client@1342281852:ref:refs/heads/main
Роль приймає sub      : repo:2k-maf/2k_client:ref:refs/heads/main
ПОМИЛКА: політика довіри ролі 2k-prod-gha-deploy-client не містить sub = repo:2k-maf@319206025/2k_client@1342281852:ref:refs/heads/main
```

Це коректний RED: скрипт падає саме на розбіжності claim `sub`, тобто на тій
умові, яку відхиляє STS.

## Spec patch

Немає специфікації для патчу — brownfield-репозиторій без `docs/features/*/spec.md`.
Рекомендація: запустити `/sdd:survey`.

## Виправлення

Політику довіри тримає Terraform у сусідньому репозиторії `2k_api`. Правка руками
в консолі AWS створила б дрейф, тож зміни пішли в код:

| Файл | Зміна |
| --- | --- |
| `2k_api/terraform/variables.tf` | Три нові змінні: `github_org_id`, `api_repo_id`, `client_repo_id`. |
| `2k_api/terraform/oidc.tf` | `local.api_repo_sub` і `local.client_repo_sub` будують незмінну форму префікса. Усі чотири subject-и використовують їх. |
| `2k_api/.github/workflows/terraform.yml` | Коментар цитував стару форму `sub`. |
| `2k_client/.github/workflows/deploy.yml` | Те саме в коментарі про `environment`. |

`terraform plan` показує рівно чотири зміни `sub` і нічого більше:

```
Plan: 0 to add, 4 to change, 0 to destroy.
```

Прогін скрипта після локального `terraform apply` (GREEN):

```
Токен GitHub несе sub : repo:2k-maf@319206025/2k_client@1342281852:ref:refs/heads/main
Роль приймає sub      : repo:2k-maf@319206025/2k_client@1342281852:ref:refs/heads/main
OK: політика довіри приймає токен цього репозиторію.
```

Решта трьох ролей звірена через `aws iam get-role`: усі чотири тримають незмінну
форму `sub`.

УВАГА: перший `apply` треба було зробити локально. Воркфлов `terraform.yml` бере роль
`2k-prod-gha-infra` через OIDC, а її політика довіри зламана так само. Поки вона не
оновлена, CI не може виправити сам себе.

## Follow-ups

- Репозиторій `2k_api` теж віддає незмінний `sub`
  (`repo:2k-maf@319206025/2k_api@1342282009`), тому ролі `deploy-api`, `infra` і
  `plan` були зламані так само. Зміна покриває всі чотири ролі одразу.
- Скрипт `tools/check_oidc_trust.ps1` запускається лише вручну. Розглянь виклик у
  `pr-checks.yml`; для цього потрібні креденшели AWS з правом `iam:GetRole`, а зараз
  PR-перевірки навмисно працюють без креденшелів.
- Локальний користувач `aws_cli` не має права `cloudtrail:LookupEvents`. Через це
  діагностика відмов STS спирається лише на лог Actions.
