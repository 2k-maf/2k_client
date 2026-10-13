import * as React from 'react';
import Alert, { AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Snackbar from '@mui/material/Snackbar';

/**
 * Повідомлення і підтвердження замість `alert()` / `confirm()`.
 *
 * Стан живе в модулі, а не в контексті: кожна сторінка має власний `AppTheme`,
 * і `FeedbackHost` монтується всередині нього, щоб діалог мав тему бренду.
 * Повідомлення, показане перед `navigate()`, переживає зміну сторінки:
 * хост нової сторінки читає той самий стан.
 */

type Toast = { id: number; message: string; severity: AlertColor; open: boolean };
type ConfirmRequest = { message: string; confirmLabel: string; resolve: (ok: boolean) => void };
type State = { toast: Toast | null; confirm: ConfirmRequest | null };

let state: State = { toast: null, confirm: null };
let nextToastId = 1;
let mountedHosts = 0;
const listeners = new Set<() => void>();

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function show(message: string, severity: AlertColor) {
  setState({ toast: { id: nextToastId++, message, severity, open: true } });
}

export const notify = {
  success: (message: string) => show(message, 'success'),
  info: (message: string) => show(message, 'info'),
  error: (message: string) => show(message, 'error'),
};

/** Асинхронна заміна `window.confirm`. Повертає `true`, якщо користувач підтвердив. */
export function confirmAction(message: string, confirmLabel = 'Так'): Promise<boolean> {
  // Без хоста діалог нікому показати — тоді лишаємо нативне вікно, а не вічне очікування.
  if (mountedHosts === 0) return Promise.resolve(window.confirm(message));
  state.confirm?.resolve(false);
  return new Promise((resolve) => setState({ confirm: { message, confirmLabel, resolve } }));
}

/** Помилки показуємо довше: їх треба встигнути прочитати. */
const AUTO_HIDE_MS: Record<AlertColor, number> = { success: 4000, info: 4000, warning: 6000, error: 6000 };

export function FeedbackHost() {
  const { toast, confirm } = React.useSyncExternalStore(subscribe, () => state);

  React.useEffect(() => {
    mountedHosts += 1;
    return () => {
      mountedHosts -= 1;
    };
  }, []);

  const closeToast = (_?: unknown, reason?: string) => {
    if (reason === 'clickaway' || !state.toast) return;
    // Текст лишається до кінця анімації закриття, тому toast не обнуляємо.
    setState({ toast: { ...state.toast, open: false } });
  };

  const answer = (ok: boolean) => {
    confirm?.resolve(ok);
    setState({ confirm: null });
  };

  return (
    <>
      <Snackbar
        key={toast?.id}
        open={Boolean(toast?.open)}
        autoHideDuration={toast ? AUTO_HIDE_MS[toast.severity] : null}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} onClose={closeToast} variant="outlined" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
      <Dialog open={Boolean(confirm)} onClose={() => answer(false)} maxWidth="xs" fullWidth>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary' }}>{confirm?.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => answer(false)}>Скасувати</Button>
          <Button onClick={() => answer(true)} variant="contained" autoFocus>
            {confirm?.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
