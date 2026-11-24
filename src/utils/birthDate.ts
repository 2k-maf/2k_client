import { vancouverTodayYmd } from './vancouverDate';

/** Межі як на сервері: рік від 1900, не в майбутньому. Сервер усе одно перевіряє сам. */
export const BIRTH_DATE_MIN = '1900-01-01';

/** Сьогодні у Ванкувері — верхня межа для <input type="date" />. */
export function birthDateMax(): string {
  return vancouverTodayYmd();
}

/** YYYY-MM-DD з відповіді сервера; без часового поясу, щоб дата не з'їхала на день. */
export function birthDateInputValue(value: string | null | undefined): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value ?? '');
  return m ? m[1] : '';
}

/** dd.mm.yyyy для таблиці або «—». */
export function formatBirthDate(value: string | null | undefined): string {
  const ymd = birthDateInputValue(value);
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-');
  return `${d}.${m}.${y}`;
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
