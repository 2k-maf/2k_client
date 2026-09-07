import * as React from 'react';
import { alpha } from '@mui/material/styles';
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

function bannerShellSx(t: import('@mui/material/styles').Theme) {
  const dark = t.palette.mode === 'dark';
  const primary = t.palette.primary.main;
  return {
    mt: 1,
    mb: 0.25,
    width: 'fit-content',
    maxWidth: 'min(100%, calc(100vw - 20px))',
    borderRadius: 999,
    px: 0,
    py: 0,
    border: dark
      ? `1px solid ${alpha('#93c5fd', 0.55)}`
      : `1px solid ${alpha(primary, 0.45)}`,
    background: dark
      ? `linear-gradient(125deg, ${alpha(primary, 0.55)} 0%, #1e40af 42%, #172554 100%)`
      : `linear-gradient(125deg, ${alpha(primary, 0.14)} 0%, ${alpha('#dbeafe', 0.95)} 55%, ${alpha('#eff6ff', 1)} 100%)`,
    backdropFilter: 'blur(10px)',
    boxShadow: dark
      ? `0 4px 22px ${alpha('#1e3a8a', 0.55)}, 0 0 0 1px ${alpha('#60a5fa', 0.12)} inset`
      : `0 4px 16px ${alpha(primary, 0.12)}`,
  };
}

const stackPaddingSx = {
  flexWrap: 'wrap' as const,
  px: { xs: 1.25, sm: 1.5 },
  py: { xs: 0.65, sm: 0.6 },
};

const linkSx = (t: import('@mui/material/styles').Theme) => ({
  flexShrink: 0,
  fontWeight: 700,
  whiteSpace: 'nowrap' as const,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  textDecorationColor: t.palette.mode === 'dark' ? alpha('#fef08a', 0.85) : alpha(t.palette.primary.main, 0.55),
  color: t.palette.mode === 'dark' ? '#fef9c3' : t.palette.primary.dark,
  '&:hover': {
    color: t.palette.mode === 'dark' ? '#fffbeb' : t.palette.primary.main,
    textDecorationColor: t.palette.mode === 'dark' ? '#fff' : alpha(t.palette.primary.main, 0.8),
  },
});

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
      sx={(t) => ({
        flexShrink: 0,
        p: 0.25,
        color: t.palette.mode === 'dark' ? alpha('#ffffff', 0.75) : alpha(t.palette.text.primary, 0.6),
        '&:hover': {
          color: t.palette.mode === 'dark' ? '#ffffff' : t.palette.text.primary,
          backgroundColor: alpha(t.palette.mode === 'dark' ? '#ffffff' : t.palette.primary.main, 0.12),
        },
      })}
    >
      <CloseRoundedIcon sx={{ fontSize: 16 }} />
    </IconButton>
  );
}

/**
 * Compact centered pill under AppAppBar on the home page; width fits content (not full header).
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
          <EmojiEventsOutlinedIcon
            sx={(t) => ({
              fontSize: 18,
              flexShrink: 0,
              color: t.palette.mode === 'dark' ? '#e0f2fe' : t.palette.primary.dark,
            })}
          />
          <Typography
            component="div"
            variant="body2"
            sx={(t) => ({
              lineHeight: 1.35,
              minWidth: 0,
              flex: 1,
              color: t.palette.mode === 'dark' ? '#ffffff' : t.palette.text.primary,
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: 0.5,
              rowGap: 0.35,
            })}
          >
            <Box component="span" sx={{ fontWeight: 800 }}>
              {recentCompleted.name}
            </Box>
            <Box
              component="span"
              sx={(th) => ({
                fontWeight: 500,
                color: th.palette.mode === 'dark' ? '#e0e7ff' : alpha(th.palette.text.primary, 0.78),
              })}
            >
              закінчено! Вітаємо переможця
            </Box>
            <Avatar
              src={avatarSrc || undefined}
              alt=""
              sx={(th) => ({
                width: 22,
                height: 22,
                fontSize: '0.7rem',
                flexShrink: 0,
                border: `1px solid ${th.palette.mode === 'dark' ? alpha('#fff', 0.35) : alpha(th.palette.primary.main, 0.35)}`,
              })}
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
        <EmojiEventsOutlinedIcon
          sx={(t) => ({
            fontSize: 18,
            flexShrink: 0,
            color: t.palette.mode === 'dark' ? '#e0f2fe' : t.palette.primary.dark,
          })}
        />
        <Typography
          component="span"
          variant="body2"
          sx={(t) => ({
            lineHeight: 1.35,
            minWidth: 0,
            color: t.palette.mode === 'dark' ? '#ffffff' : t.palette.text.primary,
            fontWeight: 600,
          })}
        >
          <Box component="span" sx={{ fontWeight: 800 }}>
            {tournament.name}
          </Box>{' '}
          <Box
            component="span"
            sx={(th) => ({
              fontWeight: 500,
              color: th.palette.mode === 'dark' ? '#e0e7ff' : alpha(th.palette.text.primary, 0.78),
            })}
          >
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
