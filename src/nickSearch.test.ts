import { nickMatches } from './nickSearch';

test('латиниця знаходиться кирилицею', () => {
  expect(nickMatches('Rock', 'рок')).toBe(true);
  expect(nickMatches('Rockstar', 'рок')).toBe(true);
});

test('кирилиця знаходиться латиницею', () => {
  expect(nickMatches('Рок', 'rock')).toBe(true);
  expect(nickMatches('Рок', 'rok')).toBe(true);
});

test('звичайний підрядок і регістр лишаються', () => {
  expect(nickMatches('Аліса', 'алі')).toBe(true);
  expect(nickMatches('Rock', 'ROC')).toBe(true);
  expect(nickMatches('Rock', '')).toBe(true);
});

test('чужий запит не збігається', () => {
  expect(nickMatches('Rock', 'макс')).toBe(false);
  expect(nickMatches('Аліса', 'rock')).toBe(false);
});

test('Rabbit знаходиться як ребіт', () => {
  expect(nickMatches('Rabbit', 'ребіт')).toBe(true);
  expect(nickMatches('Rabbit', 'рабіт')).toBe(true);
  expect(nickMatches('Ребіт', 'rabbit')).toBe(true);
});

test('українські диграфи сходяться з латиницею', () => {
  expect(nickMatches('Гриша', 'grisha')).toBe(true);
  expect(nickMatches('Щука', 'schuka')).toBe(true);
  expect(nickMatches('Cherry', 'черрі')).toBe(true);
});
