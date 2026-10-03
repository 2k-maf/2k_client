import * as React from 'react';
import Box from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { brandColors, brandFonts, brandPalettes } from '../../theme/brand';
import { publicStaticUrl } from '../../utils/mediaUrl';

const marks = {
  navy: publicStaticUrl('/brand/dk-mark-navy.png'),
  red: publicStaticUrl('/brand/dk-mark-red.png'),
};

/**
 * Смуга хедера контрастує зі сторінкою: пісочна в темній схемі, чорнильна в
 * світлій. Тож знак на ній теж залежить від схеми. Варіант `band` рендерить
 * обидва знаки й ховає зайвий через CSS — так знак правильний з першого кадру.
 */
const markSx = (size: number, hiddenIn?: 'light' | 'dark') => (theme: Theme) => ({
  height: size,
  width: 'auto',
  display: 'block',
  ...(hiddenIn && theme.applyStyles(hiddenIn, { display: 'none' })),
});

/** Колір напису: navy-знак стоїть лише на світлому, red — на тлі сторінки. */
const wordmarkColor = {
  navy: brandPalettes.light.text,
  red: brandColors.text,
  band: brandColors.ink,
};

type Props = {
  /** navy — на світлому тлі, red — на темному, band — на смузі хедера. */
  variant?: keyof typeof marks | 'band';
  /** Висота знака в пікселях. */
  size?: number;
  /** Показувати текстовий логотип поруч зі знаком. */
  withWordmark?: boolean;
  onClick?: () => void;
};

export default function DvaKoloryLogo({
  variant = 'navy',
  size = 30,
  withWordmark = true,
  onClick,
}: Props) {
  const navigate = useNavigate();
  const handleClick = onClick ?? (() => navigate('/'));

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {variant === 'band' ? (
        <>
          <Box component="img" src={marks.navy} alt="Dva Kol'ory" sx={markSx(size, 'light')} />
          <Box component="img" src={marks.red} alt="Dva Kol'ory" sx={markSx(size, 'dark')} />
        </>
      ) : (
        <Box component="img" src={marks[variant]} alt="Dva Kol'ory" sx={markSx(size)} />
      )}
      {withWordmark && (
        <Box
          component="span"
          sx={{
            fontFamily: brandFonts.display,
            fontWeight: 900,
            fontSize: Math.max(13, Math.round(size * 0.53)),
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            color: wordmarkColor[variant],
          }}
        >
          DVA KOL'ORY
        </Box>
      )}
    </Box>
  );
}
