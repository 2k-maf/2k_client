import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Link as RouterLink } from 'react-router-dom';
import axios from '../axios';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { brandColors } from '../theme/brand';

type UpcomingItem = {
  id: string;
  name: string;
  status?: string;
};

type RecentCompletedBanner = {
  id: string;
  name: string;
  winnerNickname: string;
  winnerAvatarUrl: string | null;
};

/** Pill-плашка: brand-кольори, fixed по центру під хедером. */
const bannerShellSx = {
  position: 'fixed' as const,
  zIndex: (t: { zIndex: { appBar: number } }) => t.zIndex.appBar + 1,
  top: { xs: 72, md: 80 },
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'fit-content',
  maxWidth: 'min(100%, calc(100vw - 24px))',
  borderRadius: 999,
  border: '1px solid rgba(250,43,30,0.45)',
  background: `linear-gradient(125deg, rgba(250,43,30,0.28) 0%, ${brandColors.panel} 42%, ${brandColors.panelAlt} 100%)`,
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(250,43,30,0.12) inset',
  color: brandColors.text,
};

const stackPaddingSx = {
  flexWrap: 'wrap' as const,
  px: { xs: 1.25, sm: 1.5 },
  py: { xs: 0.65, sm: 0.6 },
};

const linkSx = {
  flexShrink: 0,
  fontWeight: 700,
  whiteSpace: 'nowrap' as const,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  textDecorationColor: 'rgba(255,106,94,0.85)',
  color: brandColors.accentHover,
  '&:hover': {
    color: '#fff',
    textDecorationColor: '#fff',
  },
};

const DISMISSED_KEY = 'dismissedTournamentBanner';

/** Читає id закритої плашки. Приватний режим браузера може заборонити localStorage. */
function readDismissedBannerId(): string | null {
  try {
    return localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

function writeDismissedBannerId(id: string) {
  try {
    localStorage.setItem(DISMISSED_KEY, id);
  } catch {
    /* storage is unavailable: the banner comes back on the next load */
  }
}

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      size="small"
      aria-label="Закрити"
      onClick={onClick}
      sx={{
        flexShrink: 0,
        p: 0.25,
        color: 'rgba(242,243,247,0.55)',
        '&:hover': {
          color: brandColors.text,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
      }}
    >
      <CloseRoundedIcon sx={{ fontSize: 16 }} />
    </IconButton>
  );
}

/**
 * Compact centered floating pill under AppAppBar on the home page.
 * Після завершення турніру (до 7 днів) показує плашку з переможцем замість «вже скоро».
 */
export default function UpcomingTournamentBanner() {
  const [recentCompleted, setRecentCompleted] = React.useState<RecentCompletedBanner | null>(null);
  const [tournament, setTournament] = React.useState<UpcomingItem | null>(null);
  const [dismissedId, setDismissedId] = React.useState<string | null>(() => readDismissedBannerId());

  const dismiss = React.useCallback((bannerId: string) => {
    writeDismissedBannerId(bannerId);
    setDismissedId(bannerId);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<{
          items: UpcomingItem[];
          recentCompleted?: RecentCompletedBanner | null;
        }>('/public/upcoming-tournaments');
        if (cancelled) return;
        const rc = data.recentCompleted;
        if (rc && rc.id && rc.name) {
          setRecentCompleted(rc);
          setTournament(null);
          return;
        }
        setRecentCompleted(null);
        const list = (data.items || []).filter(
          (x) => x.status !== 'in_progress' && x.status !== 'completed'
        );
        setTournament(list.length > 0 ? list[0] : null);
      } catch {
        if (!cancelled) {
          setRecentCompleted(null);
          setTournament(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedBannerId = recentCompleted ? `completed:${recentCompleted.id}` : null;
  const upcomingBannerId = tournament ? `upcoming:${tournament.id}` : null;

  if (recentCompleted && completedBannerId !== dismissedId) {
    const initial =
      recentCompleted.winnerNickname.trim().charAt(0).toUpperCase() || '?';
    const avatarSrc = resolveMediaUrl(recentCompleted.winnerAvatarUrl ?? null);
    return (
      <Box role="status" aria-live="polite" sx={bannerShellSx}>
        <Stack direction="row" alignItems="center" spacing={1} sx={stackPaddingSx}>
          <EmojiEventsOutlinedIcon sx={{ fontSize: 18, flexShrink: 0, color: brandColors.accentHover }} />
          <Typography
            component="div"
            variant="body2"
            sx={{
              lineHeight: 1.35,
              minWidth: 0,
              flex: 1,
              color: brandColors.text,
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: 0.5,
              rowGap: 0.35,
            }}
          >
            <Box component="span" sx={{ fontWeight: 800 }}>
              {recentCompleted.name}
            </Box>
            <Box component="span" sx={{ fontWeight: 500, color: 'rgba(242,243,247,0.72)' }}>
              закінчено! Вітаємо переможця
            </Box>
            <Avatar
              src={avatarSrc || undefined}
              alt=""
              sx={{
                width: 22,
                height: 22,
                fontSize: '0.7rem',
                flexShrink: 0,
                border: '1px solid rgba(250,43,30,0.5)',
                bgcolor: brandColors.border,
              }}
            >
              {initial}
            </Avatar>
            <Box component="span" sx={{ fontWeight: 700 }}>
              {recentCompleted.winnerNickname}
            </Box>
            <Box component="span" sx={{ fontWeight: 600 }}>
              !
            </Box>
          </Typography>
          <Link
            component={RouterLink}
            to={`/tournaments/${recentCompleted.id}`}
            underline="always"
            variant="body2"
            sx={linkSx}
          >
            Перейти
          </Link>
          <DismissButton onClick={() => dismiss(`completed:${recentCompleted.id}`)} />
        </Stack>
      </Box>
    );
  }

  if (!tournament || upcomingBannerId === dismissedId) return null;

  return (
    <Box role="status" aria-live="polite" sx={bannerShellSx}>
      <Stack direction="row" alignItems="center" spacing={1} sx={stackPaddingSx}>
        <EmojiEventsOutlinedIcon sx={{ fontSize: 18, flexShrink: 0, color: brandColors.accentHover }} />
        <Typography
          component="span"
          variant="body2"
          sx={{
            lineHeight: 1.35,
            minWidth: 0,
            color: brandColors.text,
            fontWeight: 600,
          }}
        >
          <Box component="span" sx={{ fontWeight: 800 }}>
            {tournament.name}
          </Box>{' '}
          <Box component="span" sx={{ fontWeight: 500, color: 'rgba(242,243,247,0.72)' }}>
            — вже скоро!
          </Box>
        </Typography>
        <Link
          component={RouterLink}
          to={`/tournaments/${tournament.id}`}
          underline="always"
          variant="body2"
          sx={linkSx}
        >
          Перейти
        </Link>
        <DismissButton onClick={() => dismiss(`upcoming:${tournament.id}`)} />
      </Stack>
    </Box>
  );
}
