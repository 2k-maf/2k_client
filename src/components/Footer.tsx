import * as React from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TelegramIcon from '@mui/icons-material/Telegram';
import { SvgIconProps } from '@mui/material/SvgIcon';
import { brandColors, brandFonts } from '../theme/brand';
import { publicStaticUrl } from '../utils/mediaUrl';

const INSTAGRAM_URL = 'https://www.instagram.com/theukrainianmafia.vancouver/';
const YOUTUBE_URL = 'https://www.youtube.com/@2kMafiaVan';
const TELEGRAM_URL = 'https://t.me/-P_yQy5-Xfc0YWYy';
const PHONE = '+1 (403) 390-1484';

export function Copyright() {
  return (
    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
      {'© '}
      <Link color="text.secondary" href={INSTAGRAM_URL}>
        Dva Kol'ory Vancouver Mafia Club
      </Link>
      &nbsp;
      {new Date().getFullYear()}
    </Typography>
  );
}

function SocialSquare({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<SvgIconProps>;
}) {
  return (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      sx={{
        width: 44,
        height: 44,
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(242,243,247,0.7)',
        textDecoration: 'none',
        '&:hover': { borderColor: brandColors.accent, color: brandColors.accentHover },
      }}
    >
      <Icon sx={{ fontSize: 22 }} />
    </Box>
  );
}

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        background: brandColors.bg,
        color: brandColors.text,
        pt: { xs: 5, md: 7 },
        pb: 3.5,
      }}
    >
      {/* Той самий контентний стовпчик, що й у решти сторінки, — інакше на широких
          екранах футер «розповзається» до країв, а блок вище лишається по центру. */}
      <Box
        sx={{
          // Дзеркалить контейнер героя: та сама максимальна ширина І ті самі
          // внутрішні відступи, інакше футер зсунуто рівно на величину padding.
          maxWidth: 1280,
          width: '100%',
          mx: 'auto',
          px: { xs: 2.5, md: 6 },
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: 1,
          rowGap: 0.75,
          textAlign: 'center',
          pb: { xs: 4, md: 5 },
          fontFamily: brandFonts.display,
          fontWeight: 700,
          fontSize: { xs: 22, sm: 28, md: 34 },
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
        }}
      >
        <Box component="span" sx={{ color: brandColors.accent }}>
          Червоне то любов,
        </Box>
        <Box component="span" sx={{ color: brandColors.text }}>
          а чорне то .... також любов
        </Box>
        <Box
          component="img"
          src={publicStaticUrl('/brand/dk-mark-red.png')}
          alt=""
          sx={{
            height: { xs: 36, md: 44 },
            width: 'auto',
            display: 'block',
            ml: 0.5,
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          flexWrap: 'wrap',
          pt: 3,
          borderTop: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box
            component="img"
            src={publicStaticUrl('/brand/dk-mark-red.png')}
            alt=""
            sx={{ height: 56, width: 'auto', display: 'block' }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box component="span" sx={{ fontSize: 14, fontWeight: 600 }}>
              Контакти
            </Box>
            <Box
              component="a"
              href={`tel:${PHONE.replace(/[^+\d]/g, '')}`}
              sx={{
                fontFamily: brandFonts.mono,
                fontSize: 14,
                color: 'rgba(242,243,247,0.65)',
                textDecoration: 'none',
                '&:hover': { color: brandColors.accentHover },
              }}
            >
              {PHONE}
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <SocialSquare href={INSTAGRAM_URL} label="Instagram" Icon={InstagramIcon} />
          <SocialSquare href={YOUTUBE_URL} label="YouTube" Icon={YouTubeIcon} />
          <SocialSquare href={TELEGRAM_URL} label="Telegram" Icon={TelegramIcon} />
        </Box>
      </Box>
      <Box component="span" sx={{ fontSize: 12, color: 'rgba(242,243,247,0.45)' }}>
        © Dva Kol'ory Vancouver Mafia Club {new Date().getFullYear()}
      </Box>
      </Box>
    </Box>
  );
}
