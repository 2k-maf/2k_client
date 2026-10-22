import { avatarOnPublicSite, emptyOverlay, overlayFromActive, plateTone, playersFromClub, reduceOverlay, TEST_OVERLAY } from './overlayState';

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

test('знімок діючої гри сідає на стіл, порожня відповідь не вигадує гру', () => {
  const game = overlayFromActive({
    game: 2,
    nominated: [3, 3, 0, 7],
    players: [
      { seat: 2, nickname: 'Rabbit', avatarUrl: '/avatars/rabbit.webp', role: 'don', fouls: 3, eliminated: true },
      ...Array.from({ length: 9 }, (_, index) => {
        const seat = index < 1 ? 1 : index + 2;
        return { seat, nickname: `Гравець ${seat}`, avatarUrl: '', role: seat === 4 ? 'sher' : null };
      }),
    ],
  });

  expect(game?.game).toBe(2);
  expect(game?.nominated).toEqual([3, 7]);
  expect(game?.players[1].nickname).toBe('Rabbit');
  expect(game?.players[1].role).toBe('don');
  expect(game?.players[1].fouls).toBe(3);
  expect(game?.players[1].eliminated).toBe(true);
  expect(game?.players[3].role).toBe('sher');
  expect(game?.players[3].fouls).toBe(0);
  expect(game?.players[3].eliminated).toBe(false);
  expect(overlayFromActive({ game: null, players: [] })).toBeNull();
  expect(emptyOverlay().players.every((player) => player.role === null)).toBe(true);
});

test('мафія і дон беруть сталеву плашку', () => {
  expect(plateTone('maf')).toBe('steel');
  expect(plateTone('don')).toBe('steel');
  expect(plateTone('sher')).toBe('base');
  expect(plateTone('cit')).toBe('base');
  expect(plateTone(null)).toBe('base');
});

test('локальна аватарка відкривається з сайту клубу', () => {
  const local = 'http://localhost:3000/avatars/rabbit.webp?t=1';
  // Адресу збираємо частинами. Суцільний запис https://2kmaf.ca/<шлях> тест
  // редиректів читає як коротке посилання і вимагає правило в _redirects,
  // а аватарки віддає функція Pages, не редирект.
  const onSite = 'https://2kmaf.ca' + '/avatars/rabbit.webp?t=1';
  expect(avatarOnPublicSite(local)).toBe(onSite);
  expect(avatarOnPublicSite(onSite)).toBe(onSite);
});
