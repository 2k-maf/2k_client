# Dva Kol'ory rebrand — design

Date: 2026-09-03
Repo: `2k_web/fe` (CRA + React 19 + MUI 6, MUI marketing-page + dashboard templates)
Source: Claude Design export `~/Downloads/Ребрендинг DVA KOL'ORY для сайту мафії/`

## Goal

Replace the stock MUI-template look with the Dva Kol'ory brand across the whole app, and
rebuild the eight designed screens to match their artboards.

## Source material

Eight `.dc.html` artboards, pure inline styles, no external classes. The bundled
`_ds/snipe-design-system-*/` is a leftover Vybe Trade design system: the artboards link
it but use **none** of its classes. It is ignored. `uploads/` is reference imagery, also
ignored. Only `assets/dk-mark-red.png` and `assets/dk-mark-navy.png` are referenced.

## Tokens (extracted from the artboards)

| Role | Value |
|---|---|
| Page background | `#0a0c18` |
| Panel / card | `#121629`, `#101427` |
| Border | `#1c2138` |
| Light band (nav) | `#f4f1ea` on ink `#0d1129` |
| Primary text | `#f2f3f7` |
| Accent | `#fa2b1e`, hover `#ff6a5e` |
| Warning / accent alt | `#ff8a5e` |
| Success | `#8ef0bd` |
| Error soft | `#ff8a8a` |

Fonts: Satoshi (display/brand, Fontshare), Inter (UI), JetBrains Mono (numerics).

## Approach

Hybrid, decided with the user:

- **Theme-first.** A new `src/theme/brand.ts` holds the tokens; `themePrimitives.ts` is
  rewritten around them so every MUI surface — including the dashboard, DataGrid and
  pickers — inherits the brand without being redesigned.
- **Port the static screens 1:1** from their artboards, rewiring existing handlers.
- **Reskin the logic-heavy screen.** `NewGame.tsx` (975 lines) keeps its logic and JSX
  structure; only theme and targeted `sx` change. The Game Form artboard is a simplified
  mock and is not a safe blueprint for the real form.

The design is dark-only, so the app pins the dark color scheme and the
`ColorModeSelect` / `ColorModeIconDropdown` toggles are removed.

## Screen mapping

| Artboard | Route | Treatment |
|---|---|---|
| Головна | `/` | port |
| Увійти | `/login` | port |
| Реєстрація | `/register` | port |
| Відновлення паролю | `/reset-password` | port |
| Рейтинг клубу | `/clubs-rating` | port |
| Як рахуються бали | `/scoring` | port |
| Правила гри | `/rules` (**new route + nav entry**) | port |
| Фан гра | `/new-game` | reskin only |

`AppAppBar` and `Footer` are rebuilt to the artboard's light `#f4f1ea` band and shared by
every public screen.

## Assets

The two referenced marks are copied to `public/brand/`, downscaled from ~340 KB to the
30 px they render at. `SitemarkIcon` is replaced by a `DvaKoloryLogo` component that picks
the red or navy mark by surface. The favicon is regenerated from the red mark, and the
document title becomes Dva Kol'ory.

## Data contracts

Rating and Scoring keep their current API shapes; only presentation changes. No backend
work is in scope.

## Verification

The repo has **no tests** — that is the main risk, and the reason `NewGame` is reskinned
rather than ported. Verification is therefore: dev server in the browser pane, every route
screenshotted against its artboard, browser console clean, and `pnpm build` green.

## Backup

`backup/pre-rebrand-2026-09-03` pins pre-rebrand `main` at 935fa4b. Work happens on
`rebrand/dva-kolory`. The untracked `.env` is never committed.
