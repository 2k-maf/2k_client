import { nickMatches } from './nickSearch';

test('латиниця і кирилиця в обидва боки', () => {
  expect(nickMatches('Rock', 'рок')).toBe(true);
  expect(nickMatches('Rockstar', 'рок')).toBe(true);
  expect(nickMatches('Рок', 'rock')).toBe(true);
  expect(nickMatches('Рок', 'rok')).toBe(true);
});

test('Rabbit знаходиться як ребіт і рабіт', () => {
  expect(nickMatches('Rabbit', 'ребіт')).toBe(true);
  expect(nickMatches('Rabbit', 'рабіт')).toBe(true);
  expect(nickMatches('Ребіт', 'rabbit')).toBe(true);
});

test('подвійні літери згортаються', () => {
  expect(nickMatches('Molly', 'молі')).toBe(true);
  expect(nickMatches('Bunny', 'бані')).toBe(true);
});

test('голосні варіанти імен', () => {
  expect(nickMatches('Harry', 'гарі')).toBe(true);
  expect(nickMatches('Harry', 'гері')).toBe(true);
  expect(nickMatches('Jack', 'джек')).toBe(true);
});

test('th, j, ch, sh', () => {
  expect(nickMatches('Smith', 'сміт')).toBe(true);
  expect(nickMatches('Smith', 'сміс')).toBe(true);
  expect(nickMatches('Cherry', 'черрі')).toBe(true);
  expect(nickMatches('Гриша', 'grisha')).toBe(true);
  expect(nickMatches('Щука', 'schuka')).toBe(true);
});

test('g/h, w/v, y/i і закінчення', () => {
  expect(nickMatches('Ghost', 'гост')).toBe(true);
  expect(nickMatches('Wolf', 'вулф')).toBe(true);
  expect(nickMatches('Wolf', 'волф')).toBe(true);
  expect(nickMatches('Billy', 'білі')).toBe(true);
  expect(nickMatches('Lucky', 'лакі')).toBe(true);
});

test('Yulia і Julia сходяться з юлія', () => {
  expect(nickMatches('Yulia', 'юлія')).toBe(true);
  expect(nickMatches('Julia', 'юлія')).toBe(true);
  expect(nickMatches('Юлія', 'yulia')).toBe(true);
});

test('чужа розкладка', () => {
  expect(nickMatches('Rock', 'кщсл')).toBe(true);
  expect(nickMatches('Рок', 'hjr')).toBe(true);
});

test('пробіли, дефіси і крапки не заважають', () => {
  expect(nickMatches('Mr.Rock', 'mr rock')).toBe(true);
  expect(nickMatches('Mr.Rock', 'mr-rock')).toBe(true);
  expect(nickMatches('mr-rock', 'rock')).toBe(true);
});

test('звичайний підрядок лишається, чужі ніки не збігаються', () => {
  expect(nickMatches('Аліса', 'алі')).toBe(true);
  expect(nickMatches('Rock', 'ROC')).toBe(true);
  expect(nickMatches('Rock', '')).toBe(true);
  expect(nickMatches('Rock', 'макс')).toBe(false);
  expect(nickMatches('Rock', 'рек')).toBe(false);
  expect(nickMatches('Аліса', 'rock')).toBe(false);
  expect(nickMatches('Меле', 'мала')).toBe(false);
});
