import LinkOffIcon from '@mui/icons-material/LinkOff';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { keyframes } from '@mui/material/styles';
import React, { useState } from 'react';
import { brandColors } from '../theme/brand';
import { obsConfigFromEnv } from './obsAudio';
import ObsHostDialog from './ObsHostDialog';
import {
  hostFromObsUrl,
  readStoredObsHost,
  resolveObsUrl,
  writeStoredObsHost,
} from './obsHost';
import { useObsAudio } from './useObsAudio';

/** Той самий поріг, що й компактна шапка в AppAppBar. */
export const compactHeaderQuery = '(max-width: 939.95px)';

/** Ближня хвиля спалахує раніше, дальня — із затримкою, ніби звук іде від динаміка. */
const soundWave = keyframes`
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
`;

const waveSx = (delay: string) => ({
  transformOrigin: '9px 12px',
  animation: `${soundWave} 1.15s ease-in-out ${delay} infinite`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    opacity: 1,
  },
});

/** Динамік зі стандартної іконки, але дуги гучності пульсують, поки звук чутно. */
function ActiveSoundIcon() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      sx={{ width: 24, height: 24, display: 'inline-block', fill: 'currentColor', flexShrink: 0 }}
    >
      <path d="M3 9v6h4l5 5V4L7 9z" />
      <Box component="path" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" sx={waveSx('0s')} />
      <Box component="path" d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" sx={waveSx('0.35s')} />
    </Box>
  );
}

type ObsConfig = { url: string; password: string };

type Props = {
  /** floating — кут екрана з підписом. toolbar — іконка на місці перемикача теми. */
  variant?: 'floating' | 'toolbar';
};

function withStoredHost(config: ObsConfig): ObsConfig {
  return { ...config, url: resolveObsUrl(config.url, readStoredObsHost()) };
}

function useObsConfig(): {
  config: ObsConfig;
  ready: boolean;
  setHost: (host: string) => void;
} {
  const [config, setConfig] = useState<ObsConfig>(() => {
    const fromEnv = obsConfigFromEnv({ url: process.env.REACT_APP_OBS_WS_URL });
    return withStoredHost(fromEnv ?? { url: '', password: '' });
  });

  const setHost = (host: string) => {
    writeStoredObsHost(host);
    setConfig(withStoredHost({ url: process.env.REACT_APP_OBS_WS_URL ?? '', password: '' }));
  };

  return { config, ready: true, setHost };
}

const labelSx = { display: 'none', '@media (min-width: 940px)': { display: 'inline' } } as const;

const floatingSx = (audible: boolean, muted: boolean, live: boolean) => ({
  position: 'fixed',
  right: 16,
  // Смуга хедера 60px. Кнопка стоїть одразу під нею, з тим самим відступом, що й справа.
  top: 76,
  zIndex: 1400,
  minHeight: 48,
  minWidth: 48,
  px: 1.25,
  textTransform: 'none',
  fontWeight: 700,
  '& .MuiButton-startIcon': { mr: 0 },
  '@media (min-width: 940px)': {
    px: 2,
    '& .MuiButton-startIcon': { mr: 1 },
  },
  color: muted || !live ? brandColors.negative : '#fff',
  bgcolor: live && audible ? brandColors.cta : brandColors.panel,
  border: '1px solid',
  borderColor: muted || !live ? brandColors.negative : brandColors.cta,
  '&:hover': {
    bgcolor: live && audible ? brandColors.ctaHover : brandColors.panelAlt,
  },
  '&.Mui-disabled': {
    color: brandColors.text,
    bgcolor: brandColors.panel,
    borderColor: brandColors.border,
  },
});

/** Кнопка ведучого: глушить звук OBS або, без звʼязку, просить адресу іншого сервера. */
export default function ObsMuteButton({ variant = 'floating' }: Props) {
  const { config, ready, setHost } = useObsConfig();
  const { snapshot, toggle } = useObsAudio(config.url, '', true);
  const [hostOpen, setHostOpen] = useState(false);
  const disconnected = ready && snapshot.phase !== 'live';
  const disconnectLabel = 'OBS немає звʼязку. Змінити адресу';

  const dialog = (
    <ObsHostDialog
      open={hostOpen}
      initialHost={hostFromObsUrl(config?.url ?? '') || '127.0.0.1'}
      onClose={() => setHostOpen(false)}
      onSubmit={(host) => {
        setHost(host);
        setHostOpen(false);
      }}
    />
  );

  if (!ready) {
    if (variant !== 'toolbar') return null;
    return (
      <IconButton disabled size="medium" aria-label={disconnectLabel}>
        <LinkOffIcon />
      </IconButton>
    );
  }

  if (!config || disconnected) {
    if (variant === 'toolbar') {
      return (
        <>
          <IconButton onClick={() => setHostOpen(true)} size="medium" aria-label={disconnectLabel} sx={{ color: brandColors.negative }}>
            <LinkOffIcon />
          </IconButton>
          {dialog}
        </>
      );
    }
    return (
      <>
        <Button
          onClick={() => setHostOpen(true)}
          aria-label={disconnectLabel}
          startIcon={<LinkOffIcon />}
          sx={floatingSx(false, false, false)}
        >
          <Box component="span" sx={labelSx}>Немає звʼязку</Box>
        </Button>
        {dialog}
      </>
    );
  }

  const audible = snapshot.inputs.some((input) => !input.muted);
  const live = snapshot.inputs.length > 0;
  const label = live ? (audible ? 'Вимкнути звук' : 'Увімкнути звук') : 'OBS без звуку';
  const muted = live && !audible;
  const icon = muted ? <VolumeOffIcon /> : audible ? <ActiveSoundIcon /> : <VolumeUpIcon />;

  if (variant === 'toolbar') {
    return (
      <>
        <IconButton
          onClick={toggle}
          disabled={!live}
          size="medium"
          aria-label={label}
          aria-pressed={muted}
          sx={muted ? { color: brandColors.negative } : undefined}
        >
          {icon}
        </IconButton>
        {dialog}
      </>
    );
  }

  return (
    <>
      <Button
        onClick={toggle}
        disabled={!live}
        aria-label={label}
        aria-pressed={muted}
        startIcon={icon}
        sx={floatingSx(audible, muted, live)}
      >
        <Box component="span" sx={labelSx}>{label}</Box>
      </Button>
      {dialog}
    </>
  );
}
