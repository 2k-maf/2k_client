import { useEffect, useReducer } from 'react';
import axios from '../axios';
import { CLUB_ID } from '../constants/club';
import { playersFromClub, reduceOverlay, TEST_OVERLAY } from './overlayState';

/**
 * Стан плашок діючої гри.
 *
 * Ніки й аватарки беруться з рейтингу клубу. Ролі, номінація і ведучий
 * поки тестові: коли з'явиться сокет, його повідомлення підуть у той самий dispatch.
 */
export function useStreamOverlay() {
  const [game, dispatch] = useReducer(reduceOverlay, TEST_OVERLAY);

  useEffect(() => {
    let cancelled = false;
    axios.post('/club/rating', { clubId: CLUB_ID })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.players) ? data.players : [];
        if (!rows.length) return;
        dispatch({ type: 'players', players: playersFromClub(rows) });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return game;
}
