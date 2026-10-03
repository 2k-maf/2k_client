/**
 * Dva Kol'ory brand tokens, transcribed from the Claude Design artboards
 * ("Ребрендинг DVA KOL'ORY для сайту мафії", 2026-09-03).
 *
 * Темна схема — оригінал з макетів. Світла схема виведена з тих самих
 * кольорів: пісочне тло смуги хедера стає тлом сторінки, чорнило — текстом,
 * а смуга хедера інвертується в чорнильну. Червоний акцент спільний.
 *
 * Значення живуть у палітрі MUI (themePrimitives.ts), тож MUI сам видає їх
 * як CSS-змінні для активної схеми. Екрани беруть лише `brandColors` —
 * посилання на ці змінні, — і перемикання теми не потребує перерендеру.
 */

const darkPalette = {
  /** Page / app shell */
  bg: '#12162a',
  /** Panels and cards */
  panel: '#1a1f36',
  /** Alternate panel: highlighted row, podium leader */
  panelAlt: '#161b32',
  /** Table row under the pointer */
  rowHover: '#141a2e',
  /** Hairlines and card borders */
  border: '#262c45',
  /** Contrast band used by the top nav */
  band: '#f4f1ea',
  /** Ink on the band */
  ink: '#0d1129',
  /** Primary copy on the page */
  text: '#f2f3f7',
  /** Brand accent: fills, rings, CTA */
  accent: '#fa2b1e',
  /** Accent hover; accent as link text */
  accentHover: '#ff6a5e',
  /** Secondary accent, warnings */
  ember: '#ff8a5e',
  /** Positive figures */
  positive: '#8ef0bd',
  /** Negative figures, soft error */
  negative: '#ff8a8a',
  /** Base colour for drop shadows; `withAlpha` sets the strength */
  shadow: '#000000',
};

export type BrandPalette = typeof darkPalette;

const lightPalette: BrandPalette = {
  bg: '#f4f1ea',
  panel: '#fffdf8',
  panelAlt: '#ebe6db',
  rowHover: '#ede8de',
  border: '#d9d2c3',
  band: '#0d1129',
  ink: '#f4f1ea',
  text: '#0d1129',
  accent: '#fa2b1e',
  // Тексти посилань на пісочному тлі: #ff6a5e дає контраст 2.4:1, цей — 5.2:1.
  accentHover: '#c8180c',
  ember: '#b4461a',
  positive: '#0f7a4a',
  negative: '#c0262d',
  // Напівпрозора основа: та сама сила тіні в коді дає м'якшу тінь на світлому.
  shadow: 'rgba(13,17,41,0.4)',
};

/** Raw values per colour scheme. Only the MUI theme reads them. */
export const brandPalettes = { dark: darkPalette, light: lightPalette } as const;

/**
 * Brand colours for `sx` and styles. Each value is a CSS variable that follows
 * the active colour scheme. The variable names come from the `dk` palette key
 * and the `template` prefix in AppTheme.tsx.
 */
export const brandColors = Object.fromEntries(
  Object.keys(darkPalette).map((key) => [key, `var(--template-palette-dk-${key})`]),
) as { readonly [K in keyof BrandPalette]: string };

/**
 * Колір із прозорістю. Працює і з CSS-змінними, на відміну від `alpha()` з MUI,
 * яка вміє лише в літеральні кольори.
 */
export function withAlpha(color: string, opacity: number) {
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}

/** Основний колір тексту з прозорістю: другорядний текст, лінії, підкладки. */
export const fg = (opacity: number) => withAlpha(brandColors.text, opacity);

export const brandFonts = {
  // Satoshi НЕ має кирилиці, тож «ДВА КОЛЬОРИ» завжди падає у фолбек. У макеті це
  // системний sans-serif (на macOS — Helvetica), тому Inter тут навмисно немає:
  // з ним заголовок виглядав вужчим, ніж в оригіналі. Arial — метричний двійник
  // Helvetica для Windows.
  display: "'Satoshi', Helvetica, Arial, sans-serif",
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

/**
 * Моно-напис бренду: техноблок, лейбл колонки, службова цифра.
 * Одна функція замість повторення трьох властивостей у кожній сторінці.
 */
export function monoSx(fontSize: number, color = fg(0.75)) {
  return {
    fontFamily: brandFonts.mono,
    fontSize,
    color,
  } as const;
}

/** Напис-«надзаголовок» над великим заголовком сторінки. */
export const eyebrowSx = {
  ...monoSx(11, brandColors.accentHover),
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
} as const;
