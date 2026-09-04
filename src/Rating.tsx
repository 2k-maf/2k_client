import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import PeopleIcon from '@mui/icons-material/People';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import Face5Icon from '@mui/icons-material/Face5';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import AppTheme from './theme/AppTheme';
import AppAppBar from './components/AppAppBar';
import Footer from './components/Footer';
import { brandColors, brandFonts } from './theme/brand';
import { useClubRating } from './hooks/useClubRating';
import { RatingPlayer } from './utils/podium';

const PAGE_SIZE = 15;

/** Сітка колонок таблиці — однакова для шапки і рядків. */
const GRID_COLUMNS = '56px minmax(0,1fr) 148px 128px 72px 84px 84px';

const HEADERS = ['№', 'ГРАВЕЦЬ', 'РЕЙТ', 'ІГРИ', 'ПВ', 'ОП5', 'ДБ'];

/** Перші три місця виділені кольором, решта — приглушені. */
function rankAccent(rank: number) {
  if (rank === 1) return { ring: brandColors.accent, rankColor: brandColors.accent, bg: brandColors.panelAlt };
  if (rank <= 3) return { ring: brandColors.ember, rankColor: brandColors.ember, bg: brandColors.panelAlt };
  return { ring: 'rgba(255,255,255,0.28)', rankColor: 'rgba(242,243,247,0.35)', bg: 'transparent' };
}

const formatSupportFive = (p: RatingPlayer) =>
  p.supportFiveCount > 0 ? `${p.supportFivePoints > 0 ? '+' : ''}${p.supportFivePoints}` : '—';

const formatBonus = (p: RatingPlayer) => (p.bonusPoints ? `+${p.bonusPoints}` : '—');

const roleStatLine = (icon: React.ReactNode, wins: number, games: number, rate: number) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3 }}>
    {icon}
    <Typography variant="body2">{wins}/{games} ({rate}%)</Typography>
  </Box>
);

const mono = (size: number, color = 'rgba(242,243,247,0.75)') => ({
  fontFamily: brandFonts.mono,
  fontSize: size,
  color,
});

export default function Rating(props: { disableCustomTheme?: boolean }) {
  const { players, podium } = useClubRating();
  const [infoAnchor, setInfoAnchor] = useState<null | HTMLElement>(null);
  const [infoPlayer, setInfoPlayer] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const openInfo = useCallback((e: React.MouseEvent<HTMLElement>, row: any) => {
    e.stopPropagation();
    setInfoAnchor(e.currentTarget);
    setInfoPlayer(row);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.nickname?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q));
  }, [players, query]);

  const maxRating = useMemo(
    () => filtered.reduce((max, p) => Math.max(max, p.rating || 0), 0),
    [filtered],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const firstShown = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const lastShown = safePage * PAGE_SIZE + pageRows.length;

  /** Підпис під ніком: чемпіон і MVP сезону підписані окремо. */
  const titleFor = (player: RatingPlayer) => {
    if (player.rank === 1) return 'Чемпіон сезону';
    if (podium.mvp && podium.mvp.nickname === player.nickname) return 'MVP сезону';
    return '';
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
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
            px: { xs: 2, md: 6 },
            pt: { xs: 11, md: 13 },
            pb: 8,
            maxWidth: 1280,
            width: '100%',
            mx: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 4,
              pb: 4.5,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
              <Box component="span" sx={{ ...mono(11, brandColors.accentHover), letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                Клуб мафії · Ванкувер
              </Box>
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
                Рейтинг клубу
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <InputBase
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                placeholder="Пошук гравця"
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: '12px',
                  background: brandColors.panel,
                  border: '1px solid rgba(255,255,255,0.10)',
                  fontSize: 14,
                  minWidth: 220,
                  color: brandColors.text,
                }}
              />
              <Box
                component="span"
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.10)',
                  ...mono(12, brandColors.text),
                  letterSpacing: '0.12em',
                  whiteSpace: 'nowrap',
                }}
              >
                СЕЗОН {new Date().getFullYear()}
              </Box>
            </Box>
          </Box>

          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.14)', overflowX: 'auto' }}>
            <Box sx={{ minWidth: 860 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: GRID_COLUMNS,
                  gap: 2,
                  px: 1.5,
                  py: 1.75,
                  ...mono(11, 'rgba(242,243,247,0.45)'),
                  letterSpacing: '0.14em',
                  borderBottom: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                {HEADERS.map((h, i) => (
                  <Box key={h} component="span" sx={{ textAlign: i >= 4 ? 'right' : 'left' }}>
                    {h}
                  </Box>
                ))}
              </Box>

              {pageRows.map((player) => {
                const accent = rankAccent(player.rank);
                const title = titleFor(player);
                return (
                  <Box
                    key={player.id}
                    onClick={(e) => openInfo(e, player)}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: GRID_COLUMNS,
                      gap: 2,
                      alignItems: 'center',
                      px: 1.5,
                      py: 2,
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      background: accent.bg,
                      '&:hover': { background: '#141a2e' },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontFamily: brandFonts.display,
                        fontWeight: 900,
                        fontSize: 22,
                        color: accent.rankColor,
                      }}
                    >
                      {player.rank}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
                      <Avatar
                        src={player.avatarUrl || undefined}
                        sx={{
                          width: 40,
                          height: 40,
                          flex: 'none',
                          bgcolor: brandColors.border,
                          boxShadow: `inset 0 0 0 2px ${accent.ring}`,
                          fontFamily: brandFonts.display,
                          fontWeight: 900,
                          fontSize: 15,
                          color: '#fff',
                        }}
                      >
                        {player.nickname?.trim()?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
                        <Box
                          component="span"
                          sx={{
                            fontFamily: brandFonts.display,
                            fontWeight: 900,
                            fontSize: 20,
                            lineHeight: 1,
                            letterSpacing: '-0.01em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {player.nickname?.trim()}
                        </Box>
                        {title && (
                          <Box component="span" sx={mono(11, 'rgba(242,243,247,0.4)')}>
                            {title}
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box component="span" sx={{ ...mono(16, brandColors.text), fontWeight: 700 }}>
                        {player.rating}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          height: 3,
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.08)',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: 'block',
                            height: 3,
                            width: maxRating ? `${Math.max(0, (player.rating / maxRating) * 100)}%` : 0,
                            background: accent.ring,
                          }}
                        />
                      </Box>
                    </Box>
                    <Box component="span" sx={mono(13)}>
                      {player.totalWins}/{player.totalGames} ({player.totalWinsRate}%)
                    </Box>
                    <Box component="span" sx={{ ...mono(13), textAlign: 'right' }}>
                      {player.firsDie}
                    </Box>
                    <Box component="span" sx={{ ...mono(13), textAlign: 'right' }}>
                      {formatSupportFive(player)}
                    </Box>
                    <Box component="span" sx={{ ...mono(13), textAlign: 'right' }}>
                      {formatBonus(player)}
                    </Box>
                  </Box>
                );
              })}

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: 2.5,
                }}
              >
                <Box component="span" sx={mono(12, 'rgba(242,243,247,0.45)')}>
                  {firstShown}—{lastShown} З {filtered.length}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {[
                    { label: '‹', disabled: safePage === 0, go: () => setPage(safePage - 1) },
                    { label: '›', disabled: safePage >= pageCount - 1, go: () => setPage(safePage + 1) },
                  ].map((btn) => (
                    <IconButton
                      key={btn.label}
                      onClick={btn.go}
                      disabled={btn.disabled}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: brandColors.text,
                        '&.Mui-disabled': { color: 'rgba(242,243,247,0.25)' },
                      }}
                    >
                      {btn.label}
                    </IconButton>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

          <Popover
            open={Boolean(infoAnchor)}
            anchorEl={infoAnchor}
            onClose={() => setInfoAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            {infoPlayer && <Box sx={{ p: 2, minWidth: 180 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{infoPlayer.nickname}</Typography>
              {roleStatLine(<PeopleIcon sx={{ fontSize: 18, color: brandColors.positive }} />, infoPlayer.citizenWins, infoPlayer.citizenGames, infoPlayer.citizenWinsRate)}
              {roleStatLine(<GpsFixedIcon sx={{ fontSize: 18, color: 'rgba(242,243,247,0.6)' }} />, infoPlayer.mafiaWins, infoPlayer.mafiaGames, infoPlayer.mafiaWinsRate)}
              {roleStatLine(<LocalPoliceIcon sx={{ fontSize: 18, color: brandColors.accent }} />, infoPlayer.sheriffWins, infoPlayer.sheriffGames, infoPlayer.sheriffWinsRate)}
              {roleStatLine(<Face5Icon sx={{ fontSize: 18, color: brandColors.ember }} />, infoPlayer.donWins, infoPlayer.donGames, infoPlayer.donWinsRate)}
            </Box>}
          </Popover>
        </Box>
        <Footer />
      </Box>
    </AppTheme>
  );
}
