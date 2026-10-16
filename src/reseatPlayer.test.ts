import { reseatPlayer } from './reseatPlayer';

function seats() {
  return {
    1: { n: 1, title: 'Аліса', id: 'a', role: 3, warnings: 2, pendingTeamIds: undefined },
    2: { n: 2, title: 'Боб', id: 'b', role: 0, warnings: 0, pendingTeamIds: undefined },
    3: { n: 3, title: 'Гість 3', id: '', role: 1, warnings: 1, pendingTeamIds: undefined },
    4: { n: 4, title: 'Петро', id: '', role: 4, warnings: 0, pendingTeamIds: undefined },
  };
}

test('двоє гравців міняються місцями, роль і фоли лишаються на стільцях', () => {
  const next = reseatPlayer(seats(), 2, 'Аліса', 'a');
  expect(next[2].title).toBe('Аліса');
  expect(next[2].id).toBe('a');
  expect(next[2].role).toBe(0);
  expect(next[2].warnings).toBe(0);
  expect(next[1].title).toBe('Боб');
  expect(next[1].id).toBe('b');
  expect(next[1].role).toBe(3);
  expect(next[1].warnings).toBe(2);
});

test('посадка на порожнє місце лишає там гостя', () => {
  const next = reseatPlayer(seats(), 3, 'Аліса', 'a');
  expect(next[3].title).toBe('Аліса');
  expect(next[3].id).toBe('a');
  expect(next[3].role).toBe(1);
  expect(next[1].title).toBe('Гість 1');
  expect(next[1].id).toBe('');
  expect(next[1].role).toBe(3);
});

test('іменний гість теж міняється з гравцем', () => {
  const next = reseatPlayer(seats(), 2, 'Петро', '');
  expect(next[2].title).toBe('Петро');
  expect(next[2].id).toBe('');
  expect(next[1].title).toBe('Аліса');
  expect(next[4].title).toBe('Боб');
  expect(next[4].id).toBe('b');
  expect(next[4].role).toBe(4);
});

test('очищення місця ставить гостя цього стільця і лишає роль', () => {
  const src = seats();
  src[1] = { ...src[1], id: '', title: 'А / Б', pendingTeamIds: ['a', 'b'] };
  const next = reseatPlayer(src, 1, 'Гість 1', '');
  expect(next[1].title).toBe('Гість 1');
  expect(next[1].id).toBe('');
  expect(next[1].role).toBe(3);
  expect(next[1].pendingTeamIds).toBeUndefined();
  expect(next[2].title).toBe('Боб');
});

test('новий гравець просто замінює нік на місці', () => {
  const next = reseatPlayer(seats(), 2, 'Чарлі', 'c');
  expect(next[2].title).toBe('Чарлі');
  expect(next[2].id).toBe('c');
  expect(next[2].role).toBe(0);
  expect(next[1].title).toBe('Аліса');
});
