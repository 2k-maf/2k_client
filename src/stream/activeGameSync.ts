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
  fouls: number;
  killed: 0 | 1;
};

export type LivePayload = { players: LiveSeat[]; nominated: number[] };

export type ActiveGameBody = LivePayload & { seatingId: string };

const UI_ROLE: Record<number, LiveRole> = {
  1: 'maf',
  2: 'maf',
  3: 'don',
  4: 'sher',
};

export function uiRoleToLive(role: unknown): LiveRole | null {
  return typeof role === 'number' && UI_ROLE[role] ? UI_ROLE[role] : null;
}

type FormPlayer = { title?: string; id?: string; role?: number; warnings?: number; killed?: number };
type FormVoting = { candidates?: unknown[] } | null | undefined;

function seatsFrom(rows: unknown[] | undefined): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const row of rows || []) {
    const seat = Array.isArray(row) ? Number(row[0]) : Number(row);
    if (!Number.isInteger(seat) || seat < 1 || seat > 10 || seen.has(seat)) continue;
    seen.add(seat);
    out.push(seat);
  }
  return out;
}

export function activeGamePayload(
  players: Record<number, FormPlayer | undefined>,
  activeVoting: FormVoting,
): LivePayload {
  const list: LiveSeat[] = [];
  for (let seat = 1; seat <= 10; seat += 1) {
    const player = players[seat] || {};
    const fouls = Number(player.warnings);
    list.push({
      seat,
      nickname: String(player.title || '').trim() || `Гість ${seat}`,
      id: player.id ? String(player.id) : '',
      role: uiRoleToLive(player.role),
      fouls: Number.isInteger(fouls) && fouls >= 0 && fouls <= 4 ? fouls : 0,
      killed: player.killed === 1 ? 1 : 0,
    });
  }
  return { players: list, nominated: seatsFrom(activeVoting?.candidates) };
}

export function shouldSyncActiveGame(payload: LivePayload): boolean {
  if (payload.nominated.length > 0) return true;
  return payload.players.some((player) => {
    if (player.role || player.fouls || player.killed) return true;
    if (player.id) return true;
    return !player.nickname.startsWith('Гість');
  });
}

/** Поточне голосування оверлею → рядок кандидатів у формі. Кількість голосів ще не відома. */
export function votingFromNominated(nominated: unknown): { c: number; candidates: Array<[number, number]> } | null {
  const seats = seatsFrom(Array.isArray(nominated) ? nominated : []);
  return seats.length ? { c: 1, candidates: seats.map((seat) => [seat, 0] as [number, number]) } : null;
}

/**
 * Що відправити зараз. Перший зліпок після завантаження стає точкою відліку і не
 * йде на сервер: інакше чужа відкрита форма затре ролі, які вже роздав інший ведучий.
 * Точку відліку рухає лише успішний запис, тож скасований чи невдалий не губиться.
 */
export function planActiveSync(
  baseline: string | null,
  payload: LivePayload,
  seatingId: string,
): { key: string; body: ActiveGameBody | null } {
  const key = JSON.stringify({ ...payload, seatingId });
  if (baseline === null || baseline === key || !shouldSyncActiveGame(payload)) {
    return { key, body: null };
  }
  return { key, body: { ...payload, seatingId } };
}
