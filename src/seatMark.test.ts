import { nextSeatMark, seatMark } from './seatMark';

test('перше порожнє місце стає першим вбитим', () => {
  expect(nextSeatMark(0, false)).toBe(1);
  expect(nextSeatMark(1, false)).toBe(0);
});

test('після першого вбитого колонка лишається відкритою: вбитий, потім пішов, потім чисто', () => {
  expect(nextSeatMark(0, true)).toBe(2);
  expect(nextSeatMark(2, true)).toBe(3);
  expect(nextSeatMark(3, true)).toBe(0);
});

test('у форму повертаються лише відомі позначки', () => {
  expect(seatMark(2)).toBe(2);
  expect(seatMark(3)).toBe(3);
  expect(seatMark(1)).toBe(1);
  expect(seatMark(4)).toBe(0);
  expect(seatMark(undefined)).toBe(0);
});
