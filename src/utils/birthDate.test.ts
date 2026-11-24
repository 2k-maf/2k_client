import { birthDateInputValue, formatBirthDate, withClubBirthDate } from './birthDate';

test('дата з сервера йде в поле без зсуву часового поясу', () => {
  expect(birthDateInputValue('1990-05-01')).toBe('1990-05-01');
  expect(birthDateInputValue('1990-05-01T00:00:00.000Z')).toBe('1990-05-01');
  expect(birthDateInputValue(null)).toBe('');
  expect(birthDateInputValue('01.05.1990')).toBe('');
});

test('у таблиці дата має вигляд dd.mm.yyyy або прочерк', () => {
  expect(formatBirthDate('1990-05-01')).toBe('01.05.1990');
  expect(formatBirthDate(null)).toBe('—');
  expect(formatBirthDate(undefined)).toBe('—');
});

test('дата учасника лишається головною після зміни дати клубу', () => {
  const member = { birthDate: '1990-05-01', birthDateSource: 'self' as const, clubBirthDate: null };
  expect(withClubBirthDate(member, '1991-01-02')).toEqual({
    birthDate: '1990-05-01',
    birthDateSource: 'self',
    clubBirthDate: '1991-01-02',
  });
});

test('без дати учасника показуємо дату клубу, а очищення прибирає її', () => {
  const member = { birthDate: null, birthDateSource: null, clubBirthDate: null };
  const set = withClubBirthDate(member, '1991-01-02');
  expect(set).toEqual({ birthDate: '1991-01-02', birthDateSource: 'club', clubBirthDate: '1991-01-02' });
  expect(withClubBirthDate(set, null)).toEqual({ birthDate: null, birthDateSource: null, clubBirthDate: null });
});
