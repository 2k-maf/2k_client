import * as React from 'react';
import type {} from '@mui/x-data-grid/themeAugmentation';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate, useParams } from 'react-router-dom';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AppTheme from './theme/AppTheme';
import BrandPage from './components/brand/BrandPage';
import axios from './axios';
import { formatDateUkVancouver } from './utils/vancouverDate';
import { resolveMediaUrl } from './utils/mediaUrl';
import TournamentSeatingTiles from './components/TournamentSeatingTiles';
import TournamentCheerTab from './components/TournamentCheerTab';
import { useAuth } from './AuthProvider';
import DownloadIcon from '@mui/icons-material/Download';
import YouTubeIcon from '@mui/icons-material/YouTube';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EventSeatOutlinedIcon from '@mui/icons-material/EventSeatOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { downloadSeatingAsPng } from './utils/seatingPngExport';
import { resolveTournamentYoutubeHref } from './constants/youtube';

type PublicPlayer = { id: string; nickname: string; avatarUrl: string | null };
type PublicSlot = { seatIndex: number; players: PublicPlayer[] };

type SeatingByGame = Record<string, Record<string, { userIds: string[] }>>;

type PublicStandingRow = {
  rank: number;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  pointsSum: number;
  supportFiveSum: number;
  bonusSum: number;
  total: number;
  gamesPlayed: number;
};

type PublicPayload = {
  id: string;
  name: string;
  numGames: number;
  scheduledDate: string | null;
  status: string;
  /** Доки турнір не завершено — у рейтингу лише перші floor(numGames/2) ігор */
  hideResultsAfterHalf?: boolean;
  clubId: string | null;
  nextGameIndex: number | null;
  clubName: string;
  clubAvatarUrl: string | null;
  publicDescription: string;
  /** Кастомне посилання на YouTube; порожнє → на публічній сторінці використовується канал за замовчуванням */
  youtubeUrl?: string;
  participantSlots: PublicSlot[];
  seatingByGame: SeatingByGame | null;
  standingsRows: PublicStandingRow[];
};

const statusUa: Record<string, string> = {
  draft: 'Анонс',
  in_progress: 'Триває',
  completed: 'Завершено',
};

function nickMapFromData(data: PublicPayload | null) {
  const m = new Map<string, string>();
  if (!data) return m;
  for (const row of data.participantSlots) {
    for (const p of row.players) m.set(p.id, p.nickname);
  }
  for (const r of data.standingsRows) {
    if (!m.has(r.userId)) m.set(r.userId, r.nickname);
  }
  return m;
}

function formatSeatingCell(userIds: string[] | undefined, nick: Map<string, string>) {
  if (!userIds?.length) return '—';
  return userIds.map((id) => nick.get(id) || `…${id.slice(-4)}`).join(' / ');
}

function PublicTournamentYoutubeButton({
  youtubeUrl,
  sx,
}: {
  youtubeUrl?: string;
  sx?: React.ComponentProps<typeof Button>['sx'];
}) {
  return (
    <Button
      component="a"
      href={resolveTournamentYoutubeHref(youtubeUrl)}
      target="_blank"
      rel="noopener noreferrer"
      variant="outlined"
      color="error"
      size="small"
      startIcon={<YouTubeIcon />}
      sx={[{ borderColor: 'error.main' }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      YouTube
    </Button>
  );
}

function RemoteAvatar({
  avatarUrl,
  nickname,
  sx,
}: {
  avatarUrl: string | null | undefined;
  nickname: string;
  sx?: React.ComponentProps<typeof Avatar>['sx'];
}) {
  const [failed, setFailed] = React.useState(false);
  const src = !failed ? resolveMediaUrl(avatarUrl ?? null) : undefined;
  const initial = nickname.trim().charAt(0).toUpperCase() || '?';
  return (
    <Avatar src={src || undefined} alt={nickname} onError={() => setFailed(true)} sx={sx}>
      {initial}
    </Avatar>
  );
}

function PlayerCell({ players }: { players: PublicPlayer[] }) {
  if (!players.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }
  return (
    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75} sx={{ rowGap: 0.5 }}>
      {players.map((p, i) => (
        <React.Fragment key={p.id}>
          {i > 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, px: 0.25 }}>
              /
            </Typography>
          ) : null}
          <Stack direction="row" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
            <RemoteAvatar
              avatarUrl={p.avatarUrl}
              nickname={p.nickname}
              sx={{
                width: { xs: 52, sm: 60 },
                height: { xs: 52, sm: 60 },
                fontSize: { xs: '1.15rem', sm: '1.3rem' },
                flexShrink: 0,
                border: (t) => `2px solid ${alpha(t.palette.primary.main, 0.4)}`,
              }}
            />
            <Typography
              variant="body1"
              component="span"
              fontWeight={600}
              sx={{
                lineHeight: 1.35,
                fontSize: { xs: '0.95rem', sm: '1rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {p.nickname}
            </Typography>
          </Stack>
        </React.Fragment>
      ))}
    </Stack>
  );
}

const participantsHeadSx = {
  background: (t: Theme) =>
    `linear-gradient(90deg, ${alpha(t.palette.primary.main, 0.88)} 0%, ${alpha(t.palette.primary.dark, 0.82)} 100%)`,
  '& .MuiTableCell-head': {
    color: 'primary.contrastText',
    fontWeight: 800,
    fontSize: { xs: '0.98rem', sm: '1.08rem' },
    letterSpacing: 0.02,
    borderBottom: 'none',
    py: { xs: 1.25, sm: 1.4 },
    px: { xs: 0.75, sm: 1.25 },
  },
};

const participantsTableBodySx = {
  '& .MuiTableCell-body': {
    py: { xs: 1.5, sm: 1.75 },
    px: { xs: 0.75, sm: 1.25 },
    verticalAlign: 'middle',
  },
};

/** Номер місця в таблиці учасників — узгоджено з більшими аватарами */
const participantSeatNumberSx = {
  fontWeight: 800,
  color: 'primary.main',
  fontSize: { xs: '1.35rem', sm: '1.55rem' },
  lineHeight: 1.15,
  fontVariantNumeric: 'tabular-nums' as const,
};

function PublicParticipantsTable({ slots }: { slots: PublicSlot[] }) {
  const twoColumnLayout = useMediaQuery('(min-width:800px)');

  const containerSx = {
    borderRadius: 2,
    border: (t: Theme) => `1px solid ${t.palette.divider}`,
    boxShadow: (t: Theme) => t.shadows[2],
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflowX: 'auto',
  } as const;

  if (!twoColumnLayout) {
    return (
      <TableContainer component={Paper} elevation={0} sx={containerSx}>
        <Table
          size="medium"
          sx={{
            width: '100%',
            minWidth: 0,
            maxWidth: '100%',
            tableLayout: 'fixed',
            ...participantsTableBodySx,
          }}
        >
          <colgroup>
            <col style={{ width: '56px' }} />
            <col style={{ width: 'auto' }} />
          </colgroup>
          <TableHead>
            <TableRow sx={participantsHeadSx}>
              <TableCell align="center" sx={{ width: '56px', maxWidth: '56px', boxSizing: 'border-box' }}>
                №
              </TableCell>
              <TableCell sx={{ minWidth: 0 }}>Гравці</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slots.map((slot) => (
              <TableRow
                key={slot.seatIndex}
                sx={{
                  '&:nth-of-type(even)': { bgcolor: (t) => alpha(t.palette.action.hover, 0.2) },
                  '&:last-child td': { borderBottom: 0 },
                }}
              >
                <TableCell align="center" sx={{ width: '56px', maxWidth: '56px', boxSizing: 'border-box' }}>
                  <Typography component="span" variant="body1" sx={participantSeatNumberSx}>
                    {slot.seatIndex}
                  </Typography>
                </TableCell>
                <TableCell sx={{ minWidth: 0, width: '100%' }}>
                  <PlayerCell players={slot.players} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  const half = Math.ceil(slots.length / 2);
  const leftCol = slots.slice(0, half);
  const rightCol = slots.slice(half);
  const rowCount = leftCol.length;

  return (
    <TableContainer component={Paper} elevation={0} sx={containerSx}>
      <Table
        size="medium"
        sx={{
          width: '100%',
          minWidth: { sm: '640px' },
          tableLayout: 'fixed',
          ...participantsTableBodySx,
        }}
      >
        <TableHead>
          <TableRow sx={participantsHeadSx}>
            <TableCell align="center" sx={{ width: '64px', maxWidth: '64px' }}>
              №
            </TableCell>
            <TableCell sx={{ width: '42%' }}>Гравці</TableCell>
            <TableCell
              align="center"
              sx={{
                width: '64px',
                maxWidth: '64px',
                borderLeft: (t) => `1px solid ${alpha(t.palette.primary.contrastText, 0.22)}`,
              }}
            >
              №
            </TableCell>
            <TableCell sx={{ width: '42%' }}>Гравці</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rowCount }, (_, i) => {
            const L = leftCol[i];
            const R = rightCol[i];
            return (
              <TableRow
                key={`${L.seatIndex}-${R?.seatIndex ?? i}`}
                sx={{
                  '&:nth-of-type(even)': { bgcolor: (t) => alpha(t.palette.action.hover, 0.2) },
                  '&:last-child td': { borderBottom: 0 },
                }}
              >
                <TableCell align="center">
                  <Typography component="span" variant="body1" sx={participantSeatNumberSx}>
                    {L.seatIndex}
                  </Typography>
                </TableCell>
                <TableCell sx={{ minWidth: 0 }}>
                  <PlayerCell players={L.players} />
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    borderLeft: (t) => `1px solid ${alpha(t.palette.divider, 0.85)}`,
                  }}
                >
                  {R ? (
                    <Typography component="span" variant="body1" sx={participantSeatNumberSx}>
                      {R.seatIndex}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ minWidth: 0 }}>
                  <PlayerCell players={R?.players ?? []} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const standingsColumns: GridColDef<PublicStandingRow>[] = [
  { field: 'rank', headerName: '№', width: 52, align: 'center', headerAlign: 'center' },
  {
    field: 'nickname',
    headerName: 'Гравець',
    flex: 1.2,
    minWidth: 160,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
        <RemoteAvatar
          avatarUrl={params.row.avatarUrl}
          nickname={params.row.nickname || ''}
          sx={{ width: 28, height: 28, fontSize: 12 }}
        />
        <Typography variant="body2" noWrap fontWeight={600}>
          {params.row.nickname}
        </Typography>
      </Box>
    ),
  },
  {
    field: 'pointsSum',
    headerName: 'Бали гри',
    type: 'number',
    width: 88,
    headerAlign: 'right',
    align: 'right',
  },
  {
    field: 'supportFiveSum',
    headerName: 'ОП5',
    type: 'number',
    width: 72,
    headerAlign: 'right',
    align: 'right',
  },
  {
    field: 'bonusSum',
    headerName: 'ДБ',
    type: 'number',
    width: 64,
    headerAlign: 'right',
    align: 'right',
  },
  {
    field: 'total',
    headerName: 'Всього',
    type: 'number',
    width: 78,
    headerAlign: 'right',
    align: 'right',
  },
  {
    field: 'gamesPlayed',
    headerName: 'Ігор',
    type: 'number',
    width: 64,
    headerAlign: 'right',
    align: 'right',
  },
];

export default function PublicTournamentPage(props: { disableCustomTheme?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = React.useState<PublicPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [, startTabContentTransition] = React.useTransition();
  /** Відразу для MUI Tabs (`value`); контент рендериться з `contentTab` після transition. */
  const [tab, setTab] = React.useState(0);
  const [contentTab, setContentTab] = React.useState(0);
  const [liveGameLoading, setLiveGameLoading] = React.useState(false);
  const publicSeatingExportRef = React.useRef<HTMLDivElement>(null);
  const [seatingDownloadBusy, setSeatingDownloadBusy] = React.useState(false);
  /** На широких екранах — підписи + scrollable; на вузьких — лише іконки + fullWidth без горизонтального скролу. */
  const showTabLabels = useMediaQuery('(min-width:600px)');

  const handleDownloadSeatingPng = async () => {
    const el = publicSeatingExportRef.current;
    if (!el || !id) return;
    setSeatingDownloadBusy(true);
    try {
      await downloadSeatingAsPng(el, `rozasadka-${id}.png`);
    } catch (e) {
      console.error(e);
      alert('Не вдалося зберегти картинку розсадки');
    } finally {
      setSeatingDownloadBusy(false);
    }
  };

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: body } = await axios.get<PublicPayload>(`/public/tournament/${id}`);
        if (!cancelled) {
          setData({
            ...body,
            clubId: body.clubId ?? null,
            nextGameIndex: body.nextGameIndex ?? null,
            clubAvatarUrl: body.clubAvatarUrl ?? null,
            seatingByGame: body.seatingByGame ?? null,
            standingsRows: body.standingsRows ?? [],
            hideResultsAfterHalf: Boolean(body.hideResultsAfterHalf),
            youtubeUrl: body.youtubeUrl != null ? String(body.youtubeUrl) : '',
          });
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setData(null);
          setError(e?.response?.status === 404 ? 'Турнір не знайдено або сторінка недоступна.' : 'Не вдалося завантажити.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const nickLookup = React.useMemo(() => nickMapFromData(data), [data]);

  const isClubOwnerPublic = React.useMemo(() => {
    if (user?.authType !== 'Клуб' || !data?.clubId || user._id == null) return false;
    return String(user._id) === String(data.clubId);
  }, [user, data?.clubId]);

  const goToLiveTournamentGame = React.useCallback(async () => {
    if (!id) return;
    setLiveGameLoading(true);
    try {
      const { data: body } = await axios.get<PublicPayload>(`/public/tournament/${id}`);
      setData((prev) =>
        prev
          ? {
              ...prev,
              nextGameIndex: body.nextGameIndex ?? null,
              status: body.status,
              hideResultsAfterHalf: Boolean(body.hideResultsAfterHalf),
            }
          : prev
      );
      const next = body.nextGameIndex;
      if (next != null && body.status === 'in_progress') {
        navigate(`/profile/tournament/${id}/game/${next}`);
      } else {
        alert('Немає гри без збереженого результату (перевірте статус турніру).');
      }
    } catch {
      alert('Не вдалося отримати актуальні дані турніру.');
    } finally {
      setLiveGameLoading(false);
    }
  }, [id, navigate]);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <BrandPage eyebrow="Турнір" title={data?.name}>
        {error ? (
            <Stack spacing={2} alignItems="flex-start">
              <Typography color="error">{error}</Typography>
              <Button variant="outlined" onClick={() => navigate('/')}>
                На головну
              </Button>
            </Stack>
          ) : !data ? (
            <Typography variant="body2">Завантаження…</Typography>
          ) : (
            <Stack spacing={1.5}>
              <Stack spacing={0.75}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={2}
                  flexWrap="wrap"
                  sx={{ rowGap: 1.25, columnGap: 2 }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={1.25}
                    sx={{ flex: '1 1 200px', minWidth: 0 }}
                  >
                    {isClubOwnerPublic && data.status === 'in_progress' && id && (
                      <Button
                        type="button"
                        variant="outlined"
                        color="secondary"
                        size="small"
                        disabled={liveGameLoading}
                        onClick={() => void goToLiveTournamentGame()}
                        sx={{
                          py: 0.25,
                          px: 1,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          minWidth: 'auto',
                          flexShrink: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {liveGameLoading ? '…' : 'Діюча гра'}
                      </Button>
                    )}
                  </Stack>
                  {data.clubName?.trim() ? (
                    <Stack
                      direction="row"
                      alignItems="center"
                      gap={{ xs: 1, sm: 1.25 }}
                      sx={{
                        flexShrink: 0,
                        ml: { xs: 0, sm: 'auto' },
                        maxWidth: { xs: '100%', sm: 400 },
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                      }}
                    >
                      <RemoteAvatar
                        avatarUrl={data.clubAvatarUrl}
                        nickname={data.clubName}
                        sx={{
                          width: { xs: 44, sm: 52 },
                          height: { xs: 44, sm: 52 },
                          fontSize: { xs: '1rem', sm: '1.2rem' },
                          flexShrink: 0,
                          border: (t) => `2px solid ${alpha(t.palette.primary.main, 0.35)}`,
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          letterSpacing: 0.4,
                          lineHeight: 1.35,
                          textAlign: { xs: 'left', sm: 'right' },
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        Клуб: {data.clubName}
                      </Typography>
                      <PublicTournamentYoutubeButton
                        youtubeUrl={data.youtubeUrl}
                        sx={{
                          flexShrink: 0,
                          alignSelf: 'center',
                          minWidth: 'auto',
                          py: { xs: 0.25, sm: 0.5 },
                          px: { xs: 0.65, sm: 1 },
                          fontSize: { xs: '0.68rem', sm: undefined },
                          fontWeight: 700,
                          lineHeight: 1.2,
                          '& .MuiButton-startIcon': {
                            marginRight: { xs: '4px', sm: '8px' },
                            marginLeft: { xs: '-2px', sm: 0 },
                          },
                          '& .MuiButton-startIcon .MuiSvgIcon-root': {
                            fontSize: { xs: 16, sm: 20 },
                          },
                        }}
                      />
                    </Stack>
                  ) : null}
                </Stack>
                <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center">
                  <Chip
                    label={statusUa[data.status] || data.status}
                    color={data.status === 'in_progress' ? 'success' : data.status === 'completed' ? 'default' : 'primary'}
                    size="small"
                    sx={{ height: 24, '& .MuiChip-label': { px: 1, typography: 'caption' } }}
                  />
                  {data.scheduledDate ? (
                    <Typography variant="caption" color="text.secondary">
                      {formatDateUkVancouver(data.scheduledDate)}
                    </Typography>
                  ) : null}
                  <Typography variant="caption" color="text.secondary">
                    Ігор: {data.numGames}
                  </Typography>
                </Stack>
              </Stack>

              {data.publicDescription?.trim() ? (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Про турнір
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {data.publicDescription.trim()}
                  </Typography>
                </Paper>
              ) : null}

              <Divider sx={{ my: 0.5 }} />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                gap={1}
                sx={{ flexWrap: 'wrap' }}
              >
                <Tabs
                  value={tab}
                  onChange={(_, v) => {
                    setTab(v);
                    startTabContentTransition(() => {
                      setContentTab(v);
                    });
                  }}
                  variant={showTabLabels ? 'scrollable' : 'fullWidth'}
                  scrollButtons={showTabLabels ? 'auto' : false}
                  allowScrollButtonsMobile={false}
                  sx={{
                    flex: { sm: '1 1 auto' },
                    minWidth: 0,
                    minHeight: showTabLabels ? { xs: 36, sm: 38 } : { xs: 40, sm: 48 },
                    ...(showTabLabels
                      ? {}
                      : { '& .MuiTabs-flexContainer': { alignItems: 'center', minHeight: 40 } }),
                    '& .MuiTab-root': {
                      minHeight: showTabLabels ? { xs: 36, sm: 38 } : { xs: 40, sm: 48 },
                      py: showTabLabels ? 0.35 : 0.25,
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      lineHeight: 1.2,
                      textTransform: 'none',
                      letterSpacing: 0.01,
                      justifyContent: 'center',
                      minWidth: { xs: 0, sm: showTabLabels ? 72 : 0 },
                      px: showTabLabels ? { xs: 0.65, sm: 0.85 } : { xs: 0.5, sm: 1 },
                    },
                    '& .MuiTab-iconWrapper': {
                      ...(showTabLabels ? { mr: 0.5, mb: 0 } : { mr: 0, mb: 0 }),
                    },
                    '& .MuiTab-iconWrapper .MuiSvgIcon-root': {
                      fontSize: showTabLabels ? '1rem' : '2.125rem',
                      width: '1em',
                      height: '1em',
                    },
                  }}
                >
                  <Tab
                    icon={<GroupsOutlinedIcon />}
                    label={showTabLabels ? 'Учасники' : undefined}
                    iconPosition={showTabLabels ? 'start' : 'top'}
                    aria-label="Учасники"
                  />
                  <Tab
                    icon={<EventSeatOutlinedIcon />}
                    label={showTabLabels ? 'Розсадка' : undefined}
                    iconPosition={showTabLabels ? 'start' : 'top'}
                    aria-label="Розсадка"
                  />
                  <Tab
                    icon={<LeaderboardOutlinedIcon />}
                    label={showTabLabels ? 'Результати' : undefined}
                    iconPosition={showTabLabels ? 'start' : 'top'}
                    aria-label="Результати"
                  />
                  <Tab
                    icon={<VolunteerActivismOutlinedIcon />}
                    label={showTabLabels ? 'Підтримати учасника' : undefined}
                    iconPosition={showTabLabels ? 'start' : 'top'}
                    aria-label="Підтримати учасника"
                  />
                </Tabs>
                {!data.clubName?.trim() ? (
                  <PublicTournamentYoutubeButton
                    youtubeUrl={data.youtubeUrl}
                    sx={{
                      flexShrink: 0,
                      alignSelf: { xs: 'flex-start', sm: 'center' },
                    }}
                  />
                ) : null}
              </Stack>

              {tab !== contentTab ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 6,
                    minHeight: 200,
                  }}
                  aria-busy="true"
                  aria-live="polite"
                >
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {contentTab === 0 ? (
                    <Box sx={{ pt: 1, width: '100%', minWidth: 0, alignSelf: 'stretch' }}>
                      {data.participantSlots.length === 0 ? (
                        <TableContainer
                          component={Paper}
                          elevation={0}
                          sx={{
                            borderRadius: 2,
                            border: (t) => `1px solid ${t.palette.divider}`,
                            boxShadow: (t) => t.shadows[2],
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                          }}
                        >
                          <Table size="medium">
                            <TableBody>
                              <TableRow>
                                <TableCell align="center" sx={{ py: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Список учасників ще формується.
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <PublicParticipantsTable slots={data.participantSlots} />
                      )}
                    </Box>
                  ) : null}

                  {contentTab === 1 ? (
                    <Box sx={{ pt: 1 }}>
                      {!data.seatingByGame ? (
                        <Typography variant="body2" color="text.secondary">
                          Розсадку ще не згенеровано.
                        </Typography>
                      ) : (
                        <Paper
                          ref={publicSeatingExportRef}
                          elevation={0}
                          className="mafia-seating-png-export"
                          sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}
                        >
                          <TournamentSeatingTiles
                            numGames={data.numGames}
                            seatingByGame={data.seatingByGame}
                            formatSeat={(userIds) => formatSeatingCell(userIds, nickLookup)}
                            title="Розсадка"
                            titleAction={
                              <Button
                                type="button"
                                variant="outlined"
                                size="small"
                                startIcon={<DownloadIcon />}
                                disabled={seatingDownloadBusy}
                                onClick={() => void handleDownloadSeatingPng()}
                              >
                                {seatingDownloadBusy ? 'Зберігаємо…' : 'Завантажити'}
                              </Button>
                            }
                          />
                        </Paper>
                      )}
                    </Box>
                  ) : null}

                  {contentTab === 2 ? (
                    <Box sx={{ pt: 1, width: '100%' }}>
                      {data.hideResultsAfterHalf && data.status !== 'completed' ? (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2" component="span" sx={{ lineHeight: 1.5 }}>
                            {(() => {
                              const n = Number(data.numGames) || 0;
                              const firstBlock = Math.floor(n / 2);
                              if (firstBlock > 0 && n > 0) {
                                return (
                                  <>
                                    До завершення турніру тут показано рейтинг лише за{' '}
                                    <strong>
                                      іграми 1–{firstBlock} з {n}
                                    </strong>
                                    . Результати наступних ігор у публічну таблицю не входять; після завершення турніру
                                    з’явиться повний залік.
                                  </>
                                );
                              }
                              return (
                                <>
                                  За налаштуванням організатора частина ігор не відображається в публічному рейтингу, доки
                                  турнір не завершено. Після завершення тут з’явиться повна таблиця результатів.
                                </>
                              );
                            })()}
                          </Typography>
                        </Alert>
                      ) : null}
                      {data.standingsRows.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Таблиця результатів з’явиться після збережених ігор турніру.
                        </Typography>
                      ) : (
                        <DataGrid
                          rows={data.standingsRows}
                          columns={standingsColumns}
                          getRowId={(r) => r.userId}
                          disableColumnMenu
                          disableColumnResize
                          disableColumnSorting
                          density="compact"
                          initialState={{
                            pagination: { paginationModel: { pageSize: 15 } },
                          }}
                          pageSizeOptions={[15]}
                          getRowClassName={(params) =>
                            params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
                          }
                          sx={{
                            border: (t) => `1px solid ${t.palette.divider}`,
                            borderRadius: 2,
                            '& .MuiDataGrid-columnHeaders': {
                              background: (t) =>
                                `linear-gradient(90deg, ${alpha(t.palette.primary.main, 0.88)} 0%, ${alpha(t.palette.primary.dark, 0.82)} 100%)`,
                            },
                            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, fontSize: '0.75rem' },
                          }}
                        />
                      )}
                    </Box>
                  ) : null}

                  {contentTab === 3 && id ? (
                    <TournamentCheerTab
                      tournamentId={id}
                      slots={data.participantSlots}
                      currentUserId={user?._id != null ? String(user._id) : null}
                      isLoggedIn={Boolean(user)}
                    />
                  ) : null}
                </>
              )}
          </Stack>
        )}
      </BrandPage>
    </AppTheme>
  );
}
