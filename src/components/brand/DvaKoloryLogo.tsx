import * as React from 'react';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import { brandColors, brandFonts } from '../../theme/brand';
import { publicStaticUrl } from '../../utils/mediaUrl';

const marks = {
  navy: publicStaticUrl('/brand/dk-mark-navy.png'),
  red: publicStaticUrl('/brand/dk-mark-red.png'),
};

type Props = {
  /** navy — на світлій смузі хедера, red — на темному тлі. */
  variant?: keyof typeof marks;
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
      <Box
        component="img"
        src={marks[variant]}
        alt="Dva Kol'ory"
        sx={{ height: size, width: 'auto', display: 'block' }}
      />
      {withWordmark && (
        <Box
          component="span"
          sx={{
            fontFamily: brandFonts.display,
            fontWeight: 900,
            fontSize: Math.max(13, Math.round(size * 0.53)),
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            color: variant === 'navy' ? brandColors.ink : brandColors.text,
          }}
        >
          DVA KOL'ORY
        </Box>
      )}
    </Box>
  );
}
