import * as React from 'react';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import SystemModeIcon from '@mui/icons-material/SettingsBrightnessRounded';
import IconButton, { IconButtonOwnProps } from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useColorScheme } from '@mui/material/styles';

type Mode = 'system' | 'light' | 'dark';

/**
 * Порядок перемикання. Темна перша: це режим за замовчуванням, і перший клік
 * має дати видиму зміну — світлу тему.
 */
const modes: { value: Mode; label: string; Icon: typeof DarkModeIcon }[] = [
  { value: 'dark', label: 'Темна', Icon: DarkModeIcon },
  { value: 'light', label: 'Світла', Icon: LightModeIcon },
  { value: 'system', label: 'Системна', Icon: SystemModeIcon },
];

/** Перемикач теми: кожен клік вмикає наступний режим. Іконка показує поточний. */
export default function ColorModeToggle(props: IconButtonOwnProps) {
  const { mode, setMode } = useColorScheme();

  // AppTheme вмикає noSsr, тож `mode` відомий з першого рендеру.
  const index = Math.max(0, modes.findIndex((m) => m.value === mode));
  const current = modes[index];
  const next = modes[(index + 1) % modes.length];
  const hint = `Тема: ${current.label.toLowerCase()}. Натисніть, щоб увімкнути: ${next.label.toLowerCase()}`;

  return (
    <Tooltip title={hint}>
      <IconButton
        data-screenshot="toggle-mode"
        onClick={() => setMode(next.value)}
        size="small"
        aria-label={hint}
        {...props}
      >
        <current.Icon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
