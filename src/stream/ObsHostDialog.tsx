import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useEffect, useRef, useState } from 'react';
import { brandFonts } from '../theme/brand';
import {
  clampOctetInput,
  hostFromOctets,
  octetComplete,
  octetsFromHost,
  octetsFromText,
  Octets,
} from './obsHost';

type Props = {
  open: boolean;
  initialHost: string;
  needsPassword: boolean;
  onClose: () => void;
  onSubmit: (host: string, password?: string) => void;
};

/**
 * Чотири числа і крапки між ними. Крапку вводити не треба:
 * повний октет сам переходить у наступне поле.
 */
export default function ObsHostDialog({ open, initialHost, needsPassword, onClose, onSubmit }: Props) {
  const [octets, setOctets] = useState<Octets>(['', '', '', '']);
  const [password, setPassword] = useState('');
  const inputs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);
  const host = hostFromOctets(octets);

  useEffect(() => {
    if (!open) return undefined;
    const next = octetsFromHost(initialHost);
    setOctets(next);
    setPassword('');
    const index = next.every(Boolean) ? 3 : Math.max(0, next.findIndex((part) => !part));
    const timer = window.setTimeout(() => {
      const field = inputs.current[index];
      field?.focus();
      field?.select();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [open, initialHost]);

  const focusAt = (index: number) => {
    const field = inputs.current[index];
    field?.focus();
    field?.select();
  };

  const changeOctet = (index: number, raw: string) => {
    const pasted = octetsFromText(raw);
    if (pasted && (raw.includes('.') || raw.replace(/\D/g, '').length > 3)) {
      setOctets(pasted);
      window.setTimeout(() => focusAt(3), 0);
      return;
    }
    const digits = clampOctetInput(raw);
    setOctets((current) => {
      const next = [...current] as Octets;
      next[index] = digits;
      return next;
    });
    if (index < 3 && octetComplete(digits)) window.setTimeout(() => focusAt(index + 1), 0);
  };

  const onKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === '.' || event.key === ' ' || event.key === 'ArrowRight') && octets[index] && index < 3) {
      event.preventDefault();
      focusAt(index + 1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === 'Backspace' && octets[index] === '' && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === 'Enter' && host && (!needsPassword || password)) {
      onSubmit(host, needsPassword ? password : undefined);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth sx={{ zIndex: 1600 }}>
      <DialogTitle>Інший OBS</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Крапки вже стоять. Вводьте лише числа — повне поле саме перейде далі.
        </Typography>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          {octets.map((value, index) => (
            <React.Fragment key={index}>
              {index > 0 ? (
                <Typography component="span" aria-hidden sx={{ fontFamily: brandFonts.mono, fontWeight: 700, fontSize: 22 }}>
                  .
                </Typography>
              ) : null}
              <TextField
                value={value}
                inputRef={(node: HTMLInputElement | null) => { inputs.current[index] = node; }}
                onChange={(event) => changeOctet(index, event.target.value)}
                onKeyDown={(event) => onKeyDown(index, event as React.KeyboardEvent<HTMLInputElement>)}
                onFocus={(event) => event.target.select()}
                slotProps={{
                  htmlInput: {
                    inputMode: 'numeric',
                    autoComplete: 'off',
                    'aria-label': `Частина адреси ${index + 1}`,
                    style: {
                      textAlign: 'center',
                      fontFamily: brandFonts.mono,
                      fontSize: 18,
                      fontWeight: 700,
                      padding: '8px 0',
                    },
                  },
                }}
                sx={{ width: 68, flex: '0 0 68px' }}
              />
            </React.Fragment>
          ))}
        </div>
        {needsPassword ? (
          <TextField
            label="Пароль OBS"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Скасувати</Button>
        <Button
          variant="contained"
          disabled={!host || (needsPassword && !password)}
          onClick={() => host && onSubmit(host, needsPassword ? password : undefined)}
        >
          Підключити
        </Button>
      </DialogActions>
    </Dialog>
  );
}
