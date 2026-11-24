/**
 * День народження: лише день і місяць, без року. Сервер зберігає рядок `MM-DD`.
 * Клуб може привітати людину, але не знає її віку.
 */

/** Чернетка з двох списків. Порожній рядок — значення ще не вибрано. */
export type MonthDay = { month: string; day: string };

export const EMPTY_MONTH_DAY: MonthDay = { month: '', day: '' };

/** Назви місяців у родовому відмінку: «17 травня». */
export const MONTHS_GENITIVE = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

/** Назви місяців для списку вибору. */
export const MONTHS_NOMINATIVE = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
];

const MONTH_DAY = /^(\d{2})-(\d{2})$/;

/** Днів у місяці без року: у лютому 29, щоб 29 лютого можна було вказати. */
export function daysInMonth(month: string): number {
  const m = Number(month);
  if (!m) return 31;
  return new Date(Date.UTC(2000, m, 0)).getUTCDate();
}

/** `MM-DD` з сервера → чернетка. Інший формат дає порожню чернетку. */
export function parseMonthDay(value: string | null | undefined): MonthDay {
  const m = MONTH_DAY.exec(value ?? '');
  return m ? { month: m[1], day: m[2] } : EMPTY_MONTH_DAY;
}

/**
 * Чернетка → значення для сервера.
 * '' — нічого не вибрано (очистити), `MM-DD` — повна дата, null — вибрано лише щось одне.
 */
export function monthDayValue({ month, day }: MonthDay): string | null {
  if (!month && !day) return '';
  if (!month || !day || Number(day) > daysInMonth(month)) return null;
  return `${month}-${day}`;
}

/** «17 травня» для таблиці або «—». */
export function formatBirthDate(value: string | null | undefined): string {
  const { month, day } = parseMonthDay(value);
  if (!month) return '—';
  return `${Number(day)} ${MONTHS_GENITIVE[Number(month) - 1]}`;
}

export type BirthDateSource = 'self' | 'club' | null;

export type MemberBirthDate = {
  birthDate?: string | null;
  birthDateSource?: BirthDateSource;
  clubBirthDate?: string | null;
};

/** Нова дата від клубу. Дата, яку учасник вказав сам, лишається головною. */
export function withClubBirthDate<T extends MemberBirthDate>(member: T, clubBirthDate: string | null): T {
  if (member.birthDateSource === 'self') return { ...member, clubBirthDate };
  return {
    ...member,
    clubBirthDate,
    birthDate: clubBirthDate,
    birthDateSource: clubBirthDate ? 'club' : null,
  };
}
