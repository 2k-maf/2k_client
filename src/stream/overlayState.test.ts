import { avatarOnPublicSite, playersFromClub, reduceOverlay, TEST_OVERLAY } from './overlayState';

const roleAt = (seat: number, game = TEST_OVERLAY) => game.players.find((player) => player.seat === seat)?.role;

test('ролі міняють лише вказані місця', () => {
  const next = reduceOverlay(TEST_OVERLAY, {
    type: 'roles',
    roles: [
      { seat: 1, role: 'don' },
      { seat: 4, role: 'sher' },
      { seat: 11, role: 'maf' },
    ],
  });

  expect(roleAt(1, next)).toBe('don');
  expect(roleAt(4, next)).toBe('sher');
  expect(roleAt(2, next)).toBe(roleAt(2));
  expect(next.players).toHaveLength(10);
});

test('ніки й аватари не стирають роль і позначки', () => {
  const next = reduceOverlay(TEST_OVERLAY, {
    type: 'players',
    players: [{ seat: 8, nickname: '  Нова кнопка  ', avatarUrl: null }],
  });
  const player = next.players.find((item) => item.seat === 8);

  expect(player?.nickname).toBe('Нова кнопка');
  expect(player?.avatarUrl).toBeNull();
  expect(player?.role).toBe('cit');
  expect(player?.speaking).toBe(true);
});

test('слово за столом лишається в одного', () => {
  const speaking = reduceOverlay(TEST_OVERLAY, { type: 'speaker', seat: 3 });
  expect(speaking.players.filter((player) => player.speaking).map((player) => player.seat)).toEqual([3]);

  const silent = reduceOverlay(speaking, { type: 'speaker', seat: null });
  expect(silent.players.some((player) => player.speaking)).toBe(false);
});

test('номінація відсіює чужі й повторні місця', () => {
  const next = reduceOverlay(TEST_OVERLAY, { type: 'nominated', seats: [10, 10, 0, 4] });
  expect(next.nominated).toEqual([10, 4]);
});

test('битий знімок не замінює стіл', () => {
  const next = reduceOverlay(TEST_OVERLAY, {
    type: 'snapshot',
    game: { ...TEST_OVERLAY, players: [] },
  });
  expect(next).toBe(TEST_OVERLAY);
});

test('плашка столу й ведучого оновлюється окремо', () => {
  const table = reduceOverlay(TEST_OVERLAY, { type: 'table', table: 2, game: 5 });
  const referee = reduceOverlay(table, { type: 'referee', name: 'Кіт', category: 2 });

  expect(referee.table).toBe(2);
  expect(referee.game).toBe(5);
  expect(referee.referee).toEqual({ name: 'Кіт', category: 2 });
  expect(referee.players[0].nickname).toBe('');
});

test('рейтинг клубу сідає на перші десять місць і не затирає ролі', () => {
  const rows = [
    { nickname: '  Rabbit ', avatarUrl: '/avatars/rabbit.webp' },
    { nickname: 'Василіса', avatarUrl: '  ' },
    ...Array.from({ length: 9 }, (_, i) => ({ nickname: `Гравець ${i + 3}`, avatarUrl: '' })),
  ];
  const next = reduceOverlay(TEST_OVERLAY, { type: 'players', players: playersFromClub(rows) });

  expect(next.players[0].nickname).toBe('Rabbit');
  expect(next.players[0].avatarUrl).toBe('/avatars/rabbit.webp');
  expect(next.players[0].role).toBe('sher');
  expect(next.players[1].avatarUrl).toBeNull();
  expect(next.players[1].role).toBe('maf');
  expect(next.players).toHaveLength(10);
  expect(next.players[9].nickname).toBe('Гравець 10');
});

test('локальна аватарка відкривається з сайту клубу', () => {
  const local = 'http://localhost:3000/avatars/rabbit.webp?t=1';
  expect(avatarOnPublicSite(local)).toBe('https://2kmaf.ca/avatars/rabbit.webp?t=1');
  expect(avatarOnPublicSite('https://2kmaf.ca/avatars/rabbit.webp?t=1')).toBe('https://2kmaf.ca/avatars/rabbit.webp?t=1');
});
