import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AppAppBar from '../AppAppBar';
import Footer from '../Footer';
import { brandColors, brandFonts } from '../../theme/brand';

type Props = {
  /** Моно-напис над заголовком, напр. «Вхід до клубу». */
  eyebrow?: string;
  /** Текст під великим лого-заголовком. */
  subtitle?: string;
  /** Права колонка — картка форми. */
  children: React.ReactNode;
};

/**
 * Каркас внутрішніх сторінок з макета: світла смуга хедера, дві колонки
 * (бренд-блок + картка) і футер.
 */
export default function BrandPageLayout({ eyebrow, subtitle, children }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: brandColors.bg,
        color: brandColors.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppAppBar />
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1fr) minmax(360px,500px)' },
          alignItems: 'center',
          gap: { xs: 4, md: 7 },
          px: { xs: 2.5, md: 6 },
          pt: { xs: 12, md: 14 },
          pb: { xs: 6, md: 8 },
          maxWidth: 1280,
          width: '100%',
          mx: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {eyebrow && (
            <Box
              component="span"
              sx={{
                fontFamily: brandFonts.mono,
                fontSize: 11,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: brandColors.accentHover,
              }}
            >
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
      <Footer />
    </Box>
  );
}
