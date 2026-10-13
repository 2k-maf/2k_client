import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import PeopleIcon from '@mui/icons-material/People';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import Face5Icon from '@mui/icons-material/Face5';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import AppTheme from './theme/AppTheme';
import BrandPage from './components/brand/BrandPage';
import BrandSearchField from './components/brand/BrandSearchField';
import { brandColors, brandFonts, monoSx, fg } from './theme/brand';
import { useClubRating } from './hooks/useClubRating';
import { formatFloat1, formatSeasonLabel, RatingPlayer } from './utils/podium';

const PAGE_SIZE = 15;

/** Сітка колонок таблиці — однакова для шапки і рядків. */
const GRID_COLUMNS = '56px minmax(0,1fr) 148px 128px 72px 84px 84px';

const HEADERS = ['№', 'ГРАВЕЦЬ', 'РЕЙТ', 'ІГРИ', 'ПВ', 'ОП5', 'ДБ'];

/**
 * Нижче md рядок — картка у два яруси: зверху гравець і рейтинг, знизу статистика.
 * Раніше таблиця 860px гортала вбік, і на телефоні було видно 3 колонки із 7.
 */
const MOBILE_COLUMNS = '28px minmax(0,1.6fr) repeat(3, minmax(0,1fr))';

/** Місце комірки в картці на телефоні. Від md комірка стоїть у своїй колонці таблиці. */
const mobileCell = (column: string, row: string) => ({
  gridColumn: { xs: column, md: 'auto' },
  gridRow: { xs: row, md: 'auto' },
});

/** Комірка статистики: на телефоні підписи стоять в один рядок, навіть коли значення переноситься. */
const mobileStatCell = (column: string) => ({ ...mobileCell(column, '2'), alignSelf: { xs: 'start', md: 'auto' } });

/** Підпис статистики на телефоні, де рядка заголовків немає. Читач екрана теж його чує. */
function MobileLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box component="span" sx={{ display: { xs: 'block', md: 'none' }, ...monoSx(10, fg(0.6)), letterSpacing: '0.14em' }}>
      {children}
    </Box>
  );
}

/** Перші три місця виділені кольором, решта — приглушені. */
function rankAccent(rank: number) {
  if (rank === 1) return { ring: brandColors.accent, rankColor: brandColors.accent, bg: brandColors.panelAlt };
  if (rank <= 3) return { ring: brandColors.ember, rankColor: brandColors.ember, bg: brandColors.panelAlt };
  return { ring: fg(0.28), rankColor: fg(0.5), bg: 'transparent' };
}

const formatSupportFive = (p: RatingPlayer) =>
  p.supportFiveCount > 0
    ? `${p.supportFivePoints > 0 ? '+' : ''}${formatFloat1(p.supportFivePoints)}`
    : '—';

const formatBonus = (p: RatingPlayer) => (p.bonusPoints ? `+${formatFloat1(p.bonusPoints)}` : '—');

const roleStatLine = (icon: React.ReactNode, wins: number, games: number, rate: number) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3 }}>
    {icon}
    <Typography variant="body2">{wins}/{games} ({formatFloat1(rate)}%)</Typography>
  </Box>
);

export default function Rating(props: { disableCustomTheme?: boolean }) {
  const { players, podium, stats, loading } = useClubRating();
  const seasonLabel = formatSeasonLabel(stats.periodName).toUpperCase();
  const [infoAnchor, setInfoAnchor] = useState<null | HTMLElement>(null);
  const [infoPlayer, setInfoPlayer] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const openInfo = useCallback((anchor: HTMLElement, row: any) => {
    setInfoAnchor(anchor);
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
      <BrandPage
        eyebrow="Клуб мафії · Ванкувер"
        title="Рейтинг клубу"
        actions={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <BrandSearchField
              value={query}
              onChange={(next) => { setQuery(next); setPage(0); }}
              placeholder="Пошук гравця"
              label="Пошук гравця"
            />
            <Box
              component="span"
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: '12px',
                border: `1px solid ${fg(0.1)}`,
                ...monoSx(12, brandColors.text),
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              {seasonLabel}
            </Box>
          </Box>
        }
      >
        <Box sx={{ borderTop: `1px solid ${fg(0.14)}`, overflowX: 'auto' }}>
          <Box sx={{ minWidth: { xs: 0, md: 860 } }}>
            {/* Сітка з div: ролі ARIA повертають читачу екрана рядки й колонки таблиці. */}
            <Box role="table" aria-label="Рейтинг гравців клубу">
            <Box
              role="row"
              sx={{
                display: { xs: 'none', md: 'grid' },
                gridTemplateColumns: GRID_COLUMNS,
                gap: 2,
                px: 1.5,
                py: 1.75,
                ...monoSx(11, fg(0.6)),
                letterSpacing: '0.14em',
                borderBottom: `1px solid ${fg(0.1)}`,
              }}
            >
              {HEADERS.map((h, i) => (
                <Box key={h} component="span" role="columnheader" sx={{ textAlign: i >= 4 ? 'right' : 'left' }}>
                  {h}
                </Box>
              ))}
            </Box>

            {!loading && pageRows.map((player) => {
              const accent = rankAccent(player.rank);
              const title = titleFor(player);
              return (
                <Box
                  key={player.id}
                  role="row"
                  // Рядок відкриває статистику за ролями — і мишею, і з клавіатури.
                  tabIndex={0}
                  onClick={(e) => openInfo(e.currentTarget, player)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    openInfo(e.currentTarget, player);
                  }}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: MOBILE_COLUMNS, md: GRID_COLUMNS },
                    gap: { xs: 1, md: 2 },
                    alignItems: 'center',
                    px: 1.5,
                    py: 2,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${fg(0.07)}`,
                    background: accent.bg,
                    '&:hover': { background: brandColors.rowHover },
                    '&:focus-visible': {
                      outline: `2px solid ${brandColors.accentHover}`,
                      outlineOffset: '-2px',
                    },
                  }}
                >
                  <Box
                    component="span"
                    role="cell"
                    sx={{
                      ...mobileCell('1', '1 / span 2'),
                      fontFamily: brandFonts.display,
                      fontWeight: 900,
                      fontSize: 22,
                      color: accent.rankColor,
                    }}
                  >
                    {player.rank}
                  </Box>
                  <Box role="cell" sx={{ ...mobileCell('2 / span 3', '1'), display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
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
                        color: brandColors.text,
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
                        <Box component="span" sx={monoSx(11, fg(0.6))}>
                          {title}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box role="cell" sx={{ ...mobileCell('5', '1'), display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Box component="span" sx={{ ...monoSx(16, brandColors.text), fontWeight: 700 }}>
                      {formatFloat1(player.rating)}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        height: 3,
                        borderRadius: 999,
                        background: fg(0.08),
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
                  <Box component="span" role="cell" sx={{ ...mobileStatCell('2'), ...monoSx(13) }}>
                    <MobileLabel>{HEADERS[3]}</MobileLabel>
                    {player.totalWins}/{player.totalGames} ({formatFloat1(player.totalWinsRate)}%)
                  </Box>
                  <Box component="span" role="cell" sx={{ ...mobileStatCell('3'), ...monoSx(13), textAlign: { xs: 'left', md: 'right' } }}>
                    <MobileLabel>{HEADERS[4]}</MobileLabel>
                    {player.firsDie}
                  </Box>
                  <Box component="span" role="cell" sx={{ ...mobileStatCell('4'), ...monoSx(13), textAlign: { xs: 'left', md: 'right' } }}>
                    <MobileLabel>{HEADERS[5]}</MobileLabel>
                    {formatSupportFive(player)}
                  </Box>
                  <Box component="span" role="cell" sx={{ ...mobileStatCell('5'), ...monoSx(13), textAlign: { xs: 'left', md: 'right' } }}>
                    <MobileLabel>{HEADERS[6]}</MobileLabel>
                    {formatBonus(player)}
                  </Box>
                </Box>
              );
            })}
            </Box>

            {/* Той самий стан, що й у BrandTable: без нього під час завантаження сторінка показувала «0—0 З 0». */}
            {(loading || filtered.length === 0) && (
              <Box role="status" sx={{ px: 1.5, py: 5, textAlign: 'center', ...monoSx(13, fg(0.6)) }}>
                {loading ? 'Завантаження…' : query ? 'Гравця не знайдено.' : 'Рейтинг поки порожній.'}
              </Box>
            )}

            {!loading && filtered.length > 0 && <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 2.5,
              }}
            >
              <Box component="span" sx={monoSx(12, fg(0.6))}>
                {firstShown}–{lastShown} із {filtered.length}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[
                  { label: '‹', name: 'Попередня сторінка', disabled: safePage === 0, go: () => setPage(safePage - 1) },
                  { label: '›', name: 'Наступна сторінка', disabled: safePage >= pageCount - 1, go: () => setPage(safePage + 1) },
                ].map((btn) => (
                  <IconButton
                    key={btn.label}
                    onClick={btn.go}
                    disabled={btn.disabled}
                    aria-label={btn.name}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '12px',
                      border: `1px solid ${fg(0.12)}`,
                      color: brandColors.text,
                      '&.Mui-disabled': { color: fg(0.25) },
                    }}
                  >
                    {btn.label}
                  </IconButton>
                ))}
              </Box>
            </Box>}
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
            {roleStatLine(<GpsFixedIcon sx={{ fontSize: 18, color: fg(0.6) }} />, infoPlayer.mafiaWins, infoPlayer.mafiaGames, infoPlayer.mafiaWinsRate)}
            {roleStatLine(<LocalPoliceIcon sx={{ fontSize: 18, color: brandColors.accent }} />, infoPlayer.sheriffWins, infoPlayer.sheriffGames, infoPlayer.sheriffWinsRate)}
            {roleStatLine(<Face5Icon sx={{ fontSize: 18, color: brandColors.ember }} />, infoPlayer.donWins, infoPlayer.donGames, infoPlayer.donWinsRate)}
          </Box>}
        </Popover>
      </BrandPage>
    </AppTheme>
  );
}
