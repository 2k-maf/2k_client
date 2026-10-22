/**
 * Форма ведучого → діюча гра на бекенді.
 * Роль 0 у таблиці ще не роздана: на стрім ідуть лише дон, шериф і мафія.
 */

export type LiveRole = 'maf' | 'don' | 'sher';

export type LiveSeat = {
  seat: number;
  nickname: string;
  id: string;
  role: LiveRole | null;
};

export type ActiveGameBody = {
  seatingId: string;
  players: LiveSeat[];
  nominated: number[];
};

const UI_ROLE: Record<number, LiveRole> = {
  1: 'maf',
  2: 'maf',
  3: 'don',
  4: 'sher',
};

export function uiRoleToLive(role: unknown): LiveRole | null {
  return typeof role === 'number' && UI_ROLE[role] ? UI_ROLE[role] : null;
}

type FormPlayer = { title?: string; id?: string; role?: number };
type FormVoting = { candidates?: unknown[] } | null | undefined;

export function activeGamePayload(
  players: Record<number, FormPlayer | undefined>,
  activeVoting: FormVoting,
): { players: LiveSeat[]; nominated: number[] } {
  const list: LiveSeat[] = [];
  for (let seat = 1; seat <= 10; seat += 1) {
    const player = players[seat] || {};
    list.push({
      seat,
      nickname: String(player.title || '').trim(),
      id: player.id ? String(player.id) : '',
      role: uiRoleToLive(player.role),
    });
  }
  const nominated: number[] = [];
  const seen = new Set<number>();
  for (const row of activeVoting?.candidates || []) {
    const seat = Array.isArray(row) ? Number(row[0]) : Number(row);
    if (!Number.isInteger(seat) || seat < 1 || seat > 10 || seen.has(seat)) continue;
    seen.add(seat);
    nominated.push(seat);
  }
  return { players: list, nominated };
}

export function shouldSyncActiveGame(payload: { players: LiveSeat[]; nominated: number[] }): boolean {
  if (payload.nominated.length > 0) return true;
  return payload.players.some((player) => {
    if (player.role) return true;
    if (player.id) return true;
    return Boolean(player.nickname && !player.nickname.startsWith('Гість'));
  });
}

/** Поточне голосування оверлею → рядок кандидатів у формі. Кількість голосів ще не відома. */
export function votingFromNominated(nominated: unknown): { c: number; candidates: Array<[number, number]> } | null {
  if (!Array.isArray(nominated) || !nominated.length) return null;
  const candidates: Array<[number, number]> = [];
  const seen = new Set<number>();
  for (const seat of nominated) {
    const n = Number(seat);
    if (!Number.isInteger(n) || n < 1 || n > 10 || seen.has(n)) continue;
    seen.add(n);
    candidates.push([n, 0]);
  }
  return candidates.length ? { c: 1, candidates } : null;
}

/**
 * Перший зліпок після завантаження не відправляємо: інакше чужа відкрита форма
 * затре ролі, які вже роздав інший ведучий. Далі — лише коли стіл змінився.
 */
export function planActiveSync(
  baseline: string | null,
  payload: { players: LiveSeat[]; nominated: number[] },
  seatingId: string,
): { baseline: string; body: ActiveGameBody | null } {
  const key = JSON.stringify({ ...payload, seatingId });
  if (baseline === null || baseline === key || !shouldSyncActiveGame(payload)) {
    return { baseline: key, body: null };
  }
  return { baseline: key, body: { ...payload, seatingId } };
}
