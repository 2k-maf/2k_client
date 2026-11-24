import {
  daysInMonth,
  EMPTY_MONTH_DAY,
  formatBirthDate,
  monthDayValue,
  parseMonthDay,
  withClubBirthDate,
} from './birthDate';

test('MM-DD з сервера розбирається на день і місяць, інший формат дає порожню чернетку', () => {
  expect(parseMonthDay('05-17')).toEqual({ month: '05', day: '17' });
  expect(parseMonthDay(null)).toEqual(EMPTY_MONTH_DAY);
  expect(parseMonthDay('1990-05-17')).toEqual(EMPTY_MONTH_DAY);
});

test('чернетка стає MM-DD лише повною і справжньою', () => {
  expect(monthDayValue({ month: '05', day: '17' })).toBe('05-17');
  expect(monthDayValue({ month: '02', day: '29' })).toBe('02-29');
  expect(monthDayValue(EMPTY_MONTH_DAY)).toBe('');
  expect(monthDayValue({ month: '05', day: '' })).toBeNull();
  expect(monthDayValue({ month: '', day: '17' })).toBeNull();
  expect(monthDayValue({ month: '04', day: '31' })).toBeNull();
});

test('у лютому 29 днів, без місяця — 31', () => {
  expect(daysInMonth('02')).toBe(29);
  expect(daysInMonth('04')).toBe(30);
  expect(daysInMonth('12')).toBe(31);
  expect(daysInMonth('')).toBe(31);
});

test('у таблиці дата має вигляд «17 травня» або прочерк', () => {
  expect(formatBirthDate('05-17')).toBe('17 травня');
  expect(formatBirthDate('01-01')).toBe('1 січня');
  expect(formatBirthDate(null)).toBe('—');
  expect(formatBirthDate(undefined)).toBe('—');
});

test('дата учасника лишається головною після зміни дати клубу', () => {
  const member = { birthDate: '05-01', birthDateSource: 'self' as const, clubBirthDate: null };
  expect(withClubBirthDate(member, '01-02')).toEqual({
    birthDate: '05-01',
    birthDateSource: 'self',
    clubBirthDate: '01-02',
  });
});

test('без дати учасника показуємо дату клубу, а очищення прибирає її', () => {
  const member = { birthDate: null, birthDateSource: null, clubBirthDate: null };
  const set = withClubBirthDate(member, '01-02');
  expect(set).toEqual({ birthDate: '01-02', birthDateSource: 'club', clubBirthDate: '01-02' });
  expect(withClubBirthDate(set, null)).toEqual({ birthDate: null, birthDateSource: null, clubBirthDate: null });
});
