import { useEffect, useState } from 'react';
import axios from '../axios';
import { CLUB_ID } from '../constants/club';
import {
  readClubRatingCache,
  writeClubRatingCache,
} from '../utils/clubRatingCache';
import { derivePodium, EMPTY_PODIUM, Podium, RatingPlayer, RatingStats } from '../utils/podium';

function applyPayload(
  data: { players?: RatingPlayer[]; stats?: RatingStats },
  setters: {
    setPlayers: (p: RatingPlayer[]) => void;
    setStats: (s: RatingStats) => void;
    setPodium: (p: Podium) => void;
  },
) {
  const list: RatingPlayer[] = data.players || [];
  const stats = data.stats || {};
  setters.setPlayers(list);
  setters.setStats(stats);
  setters.setPodium(derivePodium(list, stats));
}

/** Рейтинг клубу: таблиця гравців, статистика сезону і похідний п'єдестал.
 *  Stale-while-revalidate: спочатку localStorage, потім свіжий /club/rating. */
export function useClubRating() {
  const cached = readClubRatingCache(CLUB_ID);
  const [players, setPlayers] = useState<RatingPlayer[]>(() => cached?.players || []);
  const [stats, setStats] = useState<RatingStats>(() => cached?.stats || {});
  const [podium, setPodium] = useState<Podium>(() =>
    cached ? derivePodium(cached.players, cached.stats || {}) : EMPTY_PODIUM,
  );
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const { data } = await axios.post('/club/rating', { clubId: CLUB_ID });
        if (cancelled) return;
        applyPayload(data, { setPlayers, setStats, setPodium });
        writeClubRatingCache({
          players: data.players || [],
          stats: data.stats || {},
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  return { players, stats, podium, loading };
}
