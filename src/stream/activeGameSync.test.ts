import { activeGamePayload, planActiveSync, shouldSyncActiveGame, uiRoleToLive, votingFromNominated } from './activeGameSync';

const guests = () => {
  const players: Record<number, { title: string; id: string; role: number; warnings?: number; killed?: number }> = {};
  for (let seat = 1; seat <= 10; seat += 1) {
    players[seat] = { title: `Гість ${seat}`, id: '', role: 0 };
  }
  return players;
};

test('нуль у формі ще не роль, дон і шериф їдуть на бекенд', () => {
  expect(uiRoleToLive(0)).toBeNull();
  expect(uiRoleToLive(3)).toBe('don');
  expect(uiRoleToLive(4)).toBe('sher');
  expect(uiRoleToLive(1)).toBe('maf');
});

test('голосування бере місця кандидатів, порожні гості не синхронізуються', () => {
  const players = guests();
  const empty = activeGamePayload(players, null);
  expect(shouldSyncActiveGame(empty)).toBe(false);

  players[4] = { title: 'Rabbit', id: 'abc', role: 3, warnings: 2, killed: 1 };
  const live = activeGamePayload(players, { candidates: [[4, 2], [4, 2], [0, 1], [8, 0]] });
  expect(live.players[3]).toEqual({ seat: 4, nickname: 'Rabbit', id: 'abc', role: 'don', fouls: 2, killed: 1 });
  expect(live.nominated).toEqual([4, 8]);
  expect(shouldSyncActiveGame(live)).toBe(true);
});

test('очищений нік стає гостем, а фол сам по собі вже зміна', () => {
  const players = guests();
  players[2] = { title: '   ', id: '', role: 0, warnings: 1 };
  const payload = activeGamePayload(players, null);
  expect(payload.players[1].nickname).toBe('Гість 2');
  expect(shouldSyncActiveGame(payload)).toBe(true);
});

test('перший зліпок не відправляється, зміна ролі відправляється, точку відліку рухає лише виклик', () => {
  const players = guests();
  players[1] = { title: 'Rabbit', id: 'abc', role: 0 };
  const loaded = planActiveSync(null, activeGamePayload(players, null), 'seat-1');
  expect(loaded.body).toBeNull();

  players[1] = { title: 'Rabbit', id: 'abc', role: 4 };
  const dealt = planActiveSync(loaded.key, activeGamePayload(players, null), 'seat-1');
  expect(dealt.body?.players[0].role).toBe('sher');
  expect(dealt.body?.seatingId).toBe('seat-1');

  const again = planActiveSync(loaded.key, activeGamePayload(players, null), 'seat-1');
  expect(again.body).not.toBeNull();
  expect(planActiveSync(dealt.key, activeGamePayload(players, null), 'seat-1').body).toBeNull();
});

test('номіновані місця стають поточним голосуванням без лічильника', () => {
  expect(votingFromNominated([2, 2, 11, 5])).toEqual({ c: 1, candidates: [[2, 0], [5, 0]] });
  expect(votingFromNominated([])).toBeNull();
});
