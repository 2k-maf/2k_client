import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BrandPage from './BrandPage';
import { brandFonts, eyebrowSx } from '../../theme/brand';

type Props = {
  /** Моно-напис над заголовком, напр. «Вхід до клубу». */
  eyebrow?: string;
  /** Текст під великим лого-заголовком. */
  subtitle?: string;
  /** Права колонка — картка форми. */
  children: React.ReactNode;
};

/**
 * Каркас сторінок автентифікації: бренд-блок ліворуч, картка форми праворуч.
 * Хедер, фон і футер бере з `BrandPage`, тому відступи збігаються з рештою сайту.
 */
export default function BrandPageLayout({ eyebrow, subtitle, children }: Props) {
  return (
    <BrandPage centered>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) minmax(360px,500px)' },
          alignItems: 'center',
          gap: { xs: 4, md: 7 },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {eyebrow && (
            <Box component="span" sx={eyebrowSx}>
              {eyebrow}
            </Box>
          )}
          <Typography
            variant="h1"
            sx={{
              m: 0,
              fontFamily: brandFonts.display,
              fontWeight: 900,
              fontSize: 'clamp(40px, 6vw, 88px)',
              lineHeight: 0.96,
              letterSpacing: '-0.045em',
              textTransform: 'uppercase',
              color: 'transparent',
              WebkitTextStroke: '1.5px rgba(255,255,255,0.55)',
            }}
          >
            Два
            <br />
            Кольори
          </Typography>
          {subtitle && (
            <Typography
              sx={{ m: 0, maxWidth: '42ch', fontSize: 16, lineHeight: 1.6, color: 'rgba(242,243,247,0.6)' }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {children}
      </Box>
    </BrandPage>
  );
}
