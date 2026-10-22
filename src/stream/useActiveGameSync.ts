import { useCallback, useEffect, useRef, useState } from 'react';
import axios from '../axios';
import { notify } from '../components/feedback/feedback';
import { activeGamePayload, planActiveSync, type ActiveGameBody } from './activeGameSync';

const DEBOUNCE_MS = 300;
const RETRY_MS = 3000;

/**
 * Пише стан форми ведучого в діючу гру клубу: пересадку, ролі, фоли, вибуття, голосування.
 * `adopt` викликається щоразу, коли форма підтягнула гру з сервера: поточний стан стає
 * точкою відліку, і далі на сервер іде лише те, що ведучий змінив.
 */
export function useActiveGameSync(enabled: boolean, players: Record<number, any>, activeVoting: any) {
  const [seatingId, setSeatingId] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);
  const baseline = useRef<string | null>(null);
  const latest = useRef<string | null>(null);
  const retry = useRef<number | undefined>(undefined);

  const adopt = useCallback((id: string | null) => {
    baseline.current = null;
    setSeatingId(id);
    setEpoch((n) => n + 1);
  }, []);

  const push = useCallback(async (body: ActiveGameBody, key: string) => {
    window.clearTimeout(retry.current);
    try {
      await axios.put('/club/active-rating-game', body);
      baseline.current = key;
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) {
        setSeatingId(null);
        notify.error('Діюча гра вже інша. Натисніть «Скинути», щоб підтягнути нову розсадку.');
        return;
      }
      if (status && status < 500) {
        notify.error(e?.response?.data?.error || 'Сервер не прийняв зміни діючої гри');
        baseline.current = key;
        return;
      }
      retry.current = window.setTimeout(() => {
        if (latest.current === key) push(body, key);
      }, RETRY_MS);
    }
  }, []);

  useEffect(() => () => window.clearTimeout(retry.current), []);

  useEffect(() => {
    if (!enabled || !seatingId) return;
    const plan = planActiveSync(baseline.current, activeGamePayload(players, activeVoting), seatingId);
    latest.current = plan.key;
    if (baseline.current === null) {
      baseline.current = plan.key;
      return;
    }
    if (!plan.body) return;
    const body = plan.body;
    const timer = window.setTimeout(() => push(body, plan.key), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, seatingId, epoch, players, activeVoting, push]);

  return adopt;
}
