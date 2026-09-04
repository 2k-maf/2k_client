import { CLUB_ID } from '../constants/club';
import type { RatingPlayer, RatingStats } from './podium';

export type ClubRatingPayload = {
  players: RatingPlayer[];
  stats: RatingStats;
};

const storageKey = (clubId: string) => `club-rating:v1:${clubId}`;

function canUseStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

/** Читає останній збережений рейтинг (stale) для миттєвого показу на лендінгу. */
export function readClubRatingCache(clubId: string = CLUB_ID): ClubRatingPayload | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(clubId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.players)) return null;
    return {
      players: parsed.players,
      stats: parsed.stats && typeof parsed.stats === 'object' ? parsed.stats : {},
    };
  } catch {
    return null;
  }
}

export function writeClubRatingCache(
  payload: ClubRatingPayload,
  clubId: string = CLUB_ID,
): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(
      storageKey(clubId),
      JSON.stringify({
        players: payload.players,
        stats: payload.stats || {},
        savedAt: Date.now(),
      }),
    );
  } catch {
    // Quota / private mode — ігноруємо, мережевий фетч усе одно працює.
  }
}

/** Після мутацій рейтингу (нова гра, період) — прибрати stale, щоб наступний показ не брехав довго. */
export function invalidateClubRatingCache(clubId: string = CLUB_ID): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(storageKey(clubId));
  } catch {
    // ignore
  }
}
