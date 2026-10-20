import * as React from 'react';
import Box from '@mui/material/Box';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TelegramIcon from '@mui/icons-material/Telegram';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

/** Поточний знак Threads (Meta), шлях із Simple Icons, CC0. */
function ThreadsIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z" />
    </SvgIcon>
  );
}
import { brandColors, fg } from '../theme/brand';

// Короткі посилання з public/_redirects: справжні адреси соцмереж живуть лише там.
// Адреса абсолютна, бо dev-сервер CRA не виконує _redirects і на /telegram дав би 404 SPA.
export const INSTAGRAM_URL = 'https://2kmaf.ca/instagram';
export const YOUTUBE_URL = 'https://2kmaf.ca/youtube';
export const TELEGRAM_URL = 'https://2kmaf.ca/telegram';
export const THREADS_URL = 'https://2kmaf.ca/threads';

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
        border: `1px solid ${fg(0.1)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: fg(0.7),
        textDecoration: 'none',
        '&:hover': { borderColor: brandColors.accent, color: brandColors.accentHover },
      }}
    >
      <Icon sx={{ fontSize: 22 }} />
    </Box>
  );
}

/** Instagram, YouTube, Telegram, Threads — той самий ряд у футері й на лендінгу. */
export default function SocialLinks() {
  return (
    <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
      <SocialSquare href={INSTAGRAM_URL} label="Instagram" Icon={InstagramIcon} />
      <SocialSquare href={YOUTUBE_URL} label="YouTube" Icon={YouTubeIcon} />
      <SocialSquare href={TELEGRAM_URL} label="Telegram" Icon={TelegramIcon} />
      <SocialSquare href={THREADS_URL} label="Threads" Icon={ThreadsIcon} />
    </Box>
  );
}
