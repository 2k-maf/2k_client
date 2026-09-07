import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AppAppBar from '../AppAppBar';
import Footer from '../Footer';
import { brandColors, brandFonts, eyebrowSx } from '../../theme/brand';

type Props = {
  /** Моно-напис над заголовком, напр. «Правила». */
  eyebrow?: string;
  /** Великий заголовок сторінки. Без нього шапка не рендериться. */
  title?: string;
  /** Праворуч від заголовка: пошук, бейдж сезону. Не для навігації. */
  actions?: React.ReactNode;
  /** Навігація розділу — завжди окремим рядком під заголовком, щоб не стрибала. */
  subnav?: React.ReactNode;
  /** Вертикально центрувати вміст — для коротких сторінок з формою. */
  centered?: boolean;
  children: React.ReactNode;
};

/**
 * Єдиний каркас публічних сторінок: темне тло, фіксований хедер, колонка
 * контенту 1280px, шапка з надзаголовком і футер.
 *
 * Усі внутрішні сторінки мають будуватись на ньому — інакше відступи й фон
 * розходяться, як це було на «Учасниках» і «Клубах».
 */
export default function BrandPage({ eyebrow, title, actions, subnav, centered = false, children }: Props) {
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
        component="main"
        sx={{
          flex: 1,
          ...(centered && { display: 'flex', flexDirection: 'column', justifyContent: 'center' }),
          px: { xs: 2.5, md: 6 },
          pt: { xs: 11, md: 13 },
          pb: 8,
          maxWidth: 1280,
          width: '100%',
          mx: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {title && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 4,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
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
                    fontSize: 'clamp(40px,5vw,64px)',
                    lineHeight: 0.95,
                    letterSpacing: '-0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {title}
                </Typography>
              </Box>
              {actions}
            </Box>
            {subnav}
          </Box>
        )}
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
