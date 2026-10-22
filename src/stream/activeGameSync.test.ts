import { activeGamePayload, planActiveSync, shouldSyncActiveGame, uiRoleToLive, votingFromNominated } from './activeGameSync';

const guests = () => {
  const players: Record<number, { title: string; id: string; role: number }> = {};
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

  players[4] = { title: 'Rabbit', id: 'abc', role: 3 };
  const live = activeGamePayload(players, { candidates: [[4, 2], [4, 2], [0, 1], [8, 0]] });
  expect(live.players[3]).toEqual({ seat: 4, nickname: 'Rabbit', id: 'abc', role: 'don' });
  expect(live.nominated).toEqual([4, 8]);
  expect(shouldSyncActiveGame(live)).toBe(true);
});

test('перший зліпок не відправляється, зміна ролі відправляється', () => {
  const players = guests();
  players[1] = { title: 'Rabbit', id: 'abc', role: 0 };
  const loaded = activeGamePayload(players, null);
  const first = planActiveSync(null, loaded, 'seat-1');
  expect(first.body).toBeNull();

  players[1] = { title: 'Rabbit', id: 'abc', role: 4 };
  const dealt = activeGamePayload(players, null);
  const next = planActiveSync(first.baseline, dealt, 'seat-1');
  expect(next.body?.players[0].role).toBe('sher');
  expect(next.body?.seatingId).toBe('seat-1');

  const same = planActiveSync(next.baseline, dealt, 'seat-1');
  expect(same.body).toBeNull();
});

test('номіновані місця стають поточним голосуванням без лічильника', () => {
  expect(votingFromNominated([2, 2, 11, 5])).toEqual({ c: 1, candidates: [[2, 0], [5, 0]] });
  expect(votingFromNominated([])).toBeNull();
});
