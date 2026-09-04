import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { brandColors, brandFonts } from '../theme/brand';
import { useClubRating } from '../hooks/useClubRating';
import PodiumStack from './brand/PodiumStack';

export default function Hero() {
  const { user } = useAuth();
  const { podium } = useClubRating();

  return (
    <Box
      id="hero"
      sx={{
        width: '100%',
        background: brandColors.bg,
        color: brandColors.text,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: '36px minmax(0,1fr)' },
          gap: { xs: 0, md: 4 },
          px: { xs: 2.5, md: 6 },
          pt: { xs: 12, md: 14 },
          pb: { xs: 6, md: 9 },
          maxWidth: 1280,
          width: '100%',
          mx: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: brandFonts.mono,
              fontSize: 11,
              letterSpacing: '0.3em',
              color: 'rgba(242,243,247,0.45)',
              writingMode: 'vertical-rl',
              textTransform: 'uppercase',
            }}
          >
            Клуб мафії · Ванкувер
          </Box>
          <Box
            aria-hidden
            sx={{
              width: '1px',
              flex: 1,
              background: 'linear-gradient(rgba(250,43,30,0.7), rgba(250,43,30,0))',
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,1fr) minmax(320px, 480px)' },
            gap: { xs: 5, lg: 7 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <Typography
              variant="h1"
              sx={{
                m: 0,
                fontFamily: brandFonts.display,
                fontWeight: 900,
                fontSize: 'clamp(52px, 6.5vw, 104px)',
                lineHeight: 0.98,
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

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                borderTop: '1px solid rgba(255,255,255,0.10)',
                pt: 3.5,
                maxWidth: '56ch',
              }}
            >
              <Typography
                sx={{
                  m: 0,
                  fontSize: 17,
                  lineHeight: 1.6,
                  color: 'rgba(242,243,247,0.7)',
                  textWrap: 'pretty',
                }}
              >
                Рейтингова платформа інтелектуально-психологічної гри «Мафія». Сезонний рейтинг,
                статистика гравців, судейські протоколи.
              </Typography>

              {user ? (
                <Typography
                  sx={{ fontFamily: brandFonts.display, fontWeight: 700, fontSize: 22 }}
                >
                  Привіт, {user.authType === 'Клуб' ? user.name : user.nickname}!
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button
                    component={RouterLink}
                    to="/register"
                    variant="contained"
                    sx={{ px: 3.25, py: 1.75, borderRadius: '12px', fontSize: 14 }}
                  >
                    Зареєструватися
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="outlined"
                    sx={{
                      px: 3.25,
                      py: 1.75,
                      borderRadius: '12px',
                      borderColor: 'rgba(255,255,255,0.20)',
                      color: brandColors.text,
                      fontWeight: 600,
                      fontSize: 14,
                      '&:hover': { borderColor: brandColors.accent, bgcolor: 'transparent' },
                    }}
                  >
                    Увійти
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                pb: 3,
              }}
            >
              <Box
                component="span"
                sx={{
                  fontFamily: brandFonts.mono,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  color: 'rgba(242,243,247,0.5)',
                }}
              >
                П'ЄДЕСТАЛ СЕЗОНУ {new Date().getFullYear()}
              </Box>
              <Box
                component={RouterLink}
                to="/clubs-rating"
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: brandColors.accentHover,
                  textDecoration: 'none',
                }}
              >
                Весь рейтинг →
              </Box>
            </Box>
            <PodiumStack podium={podium} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
