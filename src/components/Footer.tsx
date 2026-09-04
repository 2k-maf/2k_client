import * as React from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { brandColors, brandFonts } from '../theme/brand';
import { publicStaticUrl } from '../utils/mediaUrl';

const INSTAGRAM_URL = 'https://www.instagram.com/mafia_vancouver_9or10_club/';
const YOUTUBE_URL = 'https://www.youtube.com/@9or10MafiaVancouver';
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

function SocialSquare({ href, label }: { href: string; label: string }) {
  return (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label === 'IG' ? 'Instagram' : 'YouTube'}
      sx={{
        width: 44,
        height: 44,
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(242,243,247,0.7)',
        textDecoration: 'none',
        '&:hover': { borderColor: brandColors.accent, color: brandColors.accentHover },
      }}
    >
      {label}
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
        px: { xs: 2.5, md: 6 },
        pt: 3,
        pb: 3.5,
        borderTop: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {/* Той самий контентний стовпчик, що й у решти сторінки, — інакше на широких
          екранах футер «розповзається» до країв, а блок вище лишається по центру. */}
      <Box
        sx={{
          maxWidth: 1280,
          width: '100%',
          mx: 'auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          flexWrap: 'wrap',
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
          <SocialSquare href={INSTAGRAM_URL} label="IG" />
          <SocialSquare href={YOUTUBE_URL} label="YT" />
        </Box>
      </Box>
      <Box component="span" sx={{ fontSize: 12, color: 'rgba(242,243,247,0.45)' }}>
        © Dva Kol'ory Vancouver Mafia Club {new Date().getFullYear()}
      </Box>
      </Box>
    </Box>
  );
}
