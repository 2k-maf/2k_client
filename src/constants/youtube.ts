/** Канал за замовчуванням, якщо для турніру не вказано своє посилання. Коротке посилання з public/_redirects */
export const DEFAULT_TOURNAMENT_YOUTUBE_URL = 'https://2kmaf.ca/youtube';

/** URL для кнопки на публічній сторінці: кастомне з БД або дефолтний канал */
export function resolveTournamentYoutubeHref(stored: string | null | undefined): string {
  const t = typeof stored === 'string' ? stored.trim() : '';
  if (!t) return DEFAULT_TOURNAMENT_YOUTUBE_URL;
  return t;
}
