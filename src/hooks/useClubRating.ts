import { useEffect, useState } from 'react';
import axios from '../axios';
import { CLUB_ID } from '../constants/club';
import { derivePodium, EMPTY_PODIUM, Podium, RatingPlayer, RatingStats } from '../utils/podium';

/** Рейтинг клубу: таблиця гравців, статистика сезону і похідний п'єдестал. */
export function useClubRating() {
  const [players, setPlayers] = useState<RatingPlayer[]>([]);
  const [stats, setStats] = useState<RatingStats>({});
  const [podium, setPodium] = useState<Podium>(EMPTY_PODIUM);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const { data } = await axios.post('/club/rating', { clubId: CLUB_ID });
        if (cancelled) return;
        const list: RatingPlayer[] = data.players || [];
        setPlayers(list);
        setStats(data.stats || {});
        setPodium(derivePodium(list, data.stats || {}));
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  return { players, stats, podium };
}
