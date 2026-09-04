/**
 * Dva Kol'ory brand tokens, transcribed from the Claude Design artboards
 * ("Ребрендинг DVA KOL'ORY для сайту мафії", 2026-09-03).
 *
 * The artboards are inline-styled, so these values are the single source of
 * truth for both the MUI theme (themePrimitives.ts) and any screen that needs
 * a raw colour.
 */

export const brandColors = {
  /** Page / app shell */
  bg: '#12162a',
  /** Panels and cards */
  panel: '#1a1f36',
  /** Alternate panel, slightly darker */
  panelAlt: '#161b32',
  /** Hairlines and card borders */
  border: '#262c45',
  /** Light band used by the top nav */
  band: '#f4f1ea',
  /** Ink on the light band */
  ink: '#0d1129',
  /** Primary copy on dark */
  text: '#f2f3f7',
  /** Brand accent */
  accent: '#fa2b1e',
  /** Accent hover / link hover */
  accentHover: '#ff6a5e',
  /** Secondary accent, warnings */
  ember: '#ff8a5e',
  /** Positive figures */
  positive: '#8ef0bd',
  /** Negative figures, soft error */
  negative: '#ff8a8a',
} as const;

export const brandFonts = {
  // Satoshi НЕ має кирилиці, тож «ДВА КОЛЬОРИ» завжди падає у фолбек. У макеті це
  // системний sans-serif (на macOS — Helvetica), тому Inter тут навмисно немає:
  // з ним заголовок виглядав вужчим, ніж в оригіналі. Arial — метричний двійник
  // Helvetica для Windows.
  display: "'Satoshi', Helvetica, Arial, sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;
