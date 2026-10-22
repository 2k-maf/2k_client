/**
 * Стан оверлею діючої рейтингової гри.
 *
 * Зараз сторінка показує тестовий знімок. Події нижче — той самий контракт,
 * яким пізніше вебсокет бекенду оновлюватиме плашки, гравців і ролі:
 * хук лише диспатчить OverlayEvent у reduceOverlay.
 */

export type OverlayRole = 'cit' | 'maf' | 'don' | 'sher';

export type OverlayPlayer = {
  seat: number;
  nickname: string;
  avatarUrl: string | null;
  /** null — роль ще не відкрита на стрімі. */
  role: OverlayRole | null;
  starred: boolean;
  speaking: boolean;
  eliminated: boolean;
};

export type OverlayGame = {
  table: number;
  game: number;
  nominated: number[];
  referee: { name: string; category: number };
  players: OverlayPlayer[];
};

export type OverlayEvent =
  | { type: 'snapshot'; game: OverlayGame }
  | { type: 'players'; players: Array<{ seat: number; nickname: string; avatarUrl: string | null }> }
  | { type: 'roles'; roles: Array<{ seat: number; role: OverlayRole | null }> }
  | { type: 'nominated'; seats: number[] }
  | { type: 'speaker'; seat: number | null }
  | { type: 'player'; seat: number; patch: Partial<Omit<OverlayPlayer, 'seat'>> }
  | { type: 'referee'; name: string; category: number }
  | { type: 'table'; table: number; game: number };

const SEATS = 10;
const ROLES: ReadonlySet<string> = new Set(['cit', 'maf', 'don', 'sher']);

export function isSeat(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= SEATS;
}

function isRole(value: unknown): value is OverlayRole | null {
  return value === null || (typeof value === 'string' && ROLES.has(value));
}

function seat(n: number, role: OverlayRole, extra: Partial<OverlayPlayer> = {}): OverlayPlayer {
  return {
    seat: n,
    nickname: '',
    avatarUrl: null,
    role,
    starred: false,
    speaking: false,
    eliminated: false,
    ...extra,
  };
}

/**
 * Порожній стіл: ніки й аватарки підставить рейтинг клубу.
 * Ролі лишаються на місцях, доки сокет не пришле свої.
 */
export const TEST_OVERLAY: OverlayGame = {
  table: 1,
  game: 1,
  nominated: [1, 2],
  referee: { name: 'Точка', category: 1 },
  players: [
    seat(1, 'sher'),
    seat(2, 'maf'),
    seat(3, 'cit'),
    seat(4, 'don'),
    seat(5, 'cit'),
    seat(6, 'cit'),
    seat(7, 'maf'),
    seat(8, 'cit', { speaking: true }),
    seat(9, 'cit'),
    seat(10, 'cit'),
  ],
};

/**
 * Аватарки віддає сайт, не локальний API. На localhost шлях /avatars/*
 * інакше впирається в 404, тож фото беремо з публічного сайту клубу.
 */
const PUBLIC_SITE = 'https://2kmaf.ca';

export function avatarOnPublicSite(resolved: string, site = PUBLIC_SITE): string {
  try {
    const url = new URL(resolved);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (local && url.pathname.startsWith('/avatars/')) {
      return `${site}${url.pathname}${url.search}`;
    }
  } catch {
    return resolved;
  }
  return resolved;
}

/** Перші десять гравців рейтингу клубу стають місцями 1–10. Без фото — null, і плашка бере лого. */
export function playersFromClub(rows: Array<{ nickname?: unknown; avatarUrl?: unknown }>) {
  return rows.slice(0, SEATS).map((row, index) => ({
    seat: index + 1,
    nickname: typeof row.nickname === 'string' ? row.nickname : '',
    avatarUrl: typeof row.avatarUrl === 'string' && row.avatarUrl.trim() ? row.avatarUrl.trim() : null,
  }));
}

function withPlayer(game: OverlayGame, seat: number, patch: Partial<OverlayPlayer>): OverlayGame {
  if (!isSeat(seat)) return game;
  return {
    ...game,
    players: game.players.map((item) => (item.seat === seat ? { ...item, ...patch, seat: item.seat } : item)),
  };
}

function cleanSeats(seats: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const seat of seats) {
    if (!isSeat(seat) || seen.has(seat)) continue;
    seen.add(seat);
    out.push(seat);
  }
  return out;
}

function isGame(game: OverlayGame): boolean {
  return Array.isArray(game?.players)
    && game.players.length === SEATS
    && game.players.every((item, index) => item.seat === index + 1);
}

export function reduceOverlay(state: OverlayGame, event: OverlayEvent): OverlayGame {
  switch (event.type) {
    case 'snapshot':
      return isGame(event.game) ? event.game : state;
    case 'players': {
      let next = state;
      for (const item of event.players) {
        if (!isSeat(item.seat) || typeof item.nickname !== 'string') continue;
        next = withPlayer(next, item.seat, {
          nickname: item.nickname.trim().slice(0, 64),
          avatarUrl: typeof item.avatarUrl === 'string' && item.avatarUrl ? item.avatarUrl : null,
        });
      }
      return next;
    }
    case 'roles': {
      let next = state;
      for (const item of event.roles) {
        if (!isSeat(item.seat) || !isRole(item.role)) continue;
        next = withPlayer(next, item.seat, { role: item.role });
      }
      return next;
    }
    case 'nominated':
      return { ...state, nominated: cleanSeats(event.seats) };
    case 'speaker': {
      if (event.seat !== null && !isSeat(event.seat)) return state;
      return {
        ...state,
        players: state.players.map((item) => ({ ...item, speaking: item.seat === event.seat })),
      };
    }
    case 'player':
      return withPlayer(state, event.seat, event.patch);
    case 'referee':
      return {
        ...state,
        referee: {
          name: typeof event.name === 'string' ? event.name.trim().slice(0, 64) : state.referee.name,
          category: Number.isInteger(event.category) && event.category > 0 ? event.category : state.referee.category,
        },
      };
    case 'table':
      return {
        ...state,
        table: Number.isInteger(event.table) && event.table > 0 ? event.table : state.table,
        game: Number.isInteger(event.game) && event.game > 0 ? event.game : state.game,
      };
    default:
      return state;
  }
}
