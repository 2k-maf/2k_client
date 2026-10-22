import { useEffect, useReducer } from 'react';
import axios from '../axios';
import { CLUB_ID } from '../constants/club';
import { emptyOverlay, overlayFromActive, reduceOverlay } from './overlayState';

const POLL_MS = 3000;

/**
 * Діюча гра клубу. Сторінка оверлею питає її кожні три секунди і підміняє плашки цілком:
 * розсадка, ролі, фоли, вибуття, номер гри й поточне голосування.
 */
export function useStreamOverlay() {
  const [game, dispatch] = useReducer(reduceOverlay, undefined, emptyOverlay);

  useEffect(() => {
    let cancelled = false;
    let inflight = false;

    const pull = async () => {
      if (inflight) return;
      inflight = true;
      try {
        const { data } = await axios.get('/public/active-rating-game', {
          params: { clubId: CLUB_ID },
        });
        if (cancelled) return;
        dispatch({ type: 'snapshot', game: overlayFromActive(data) ?? emptyOverlay() });
      } catch {
        // Мережа впала — лишаємо останній стіл, щоб OBS не блимав порожнім.
      } finally {
        inflight = false;
      }
    };

    pull();
    const timer = window.setInterval(pull, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return game;
}
