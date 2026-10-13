import * as React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import GavelIcon from '@mui/icons-material/Gavel';
import AppTheme from '../theme/AppTheme';
import ProfilePage from '../components/brand/ProfilePage';
import BrandTable, { BrandColumn } from '../components/brand/BrandTable';
import { Pill } from '../components/brand/DocTable';
import axios from '../axios';
import { useAuth } from '../AuthProvider';
import { brandColors, brandFonts, monoSx } from '../theme/brand';

type HostRow = {
  id: string;
  nickname: string;
  /** Рядок клубного акаунта: ігри, записані клубом, зокрема до появи значків. */
  isClub: boolean;
  isHost: boolean;
  totalGames: number;
  periodGames: number;
  mafiaWins: number;
  citizensWins: number;
  lastGameAt: string | null;
};

type HostGame = {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  winState: 'mafia' | 'citizens';
  recordedBy: string;
  players: string[];
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('uk-UA', { timeZone: 'America/Los_Angeles', dateStyle: 'short', timeStyle: 'short' }) : '—';

const HOST_COLUMNS: BrandColumn<HostRow>[] = [
  {
    key: 'nickname',
    header: 'ВЕДУЧИЙ',
    width: 'minmax(0,1.4fr)',
    render: (row) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <Box
          component="span"
          sx={{ fontFamily: brandFonts.display, fontWeight: 900, fontSize: 18, letterSpacing: '-0.01em' }}
        >
          {row.nickname}
        </Box>
        {row.isHost && <GavelIcon titleAccess="Ведучий" sx={{ fontSize: 16, color: brandColors.accent }} />}
        {row.isClub && <Pill tone="light">Клуб</Pill>}
        {!row.isClub && !row.isHost && <Pill tone="neutral">Без значка</Pill>}
      </Box>
    ),
  },
  {
    key: 'periodGames',
    header: 'У ПЕРІОДІ',
    width: '110px',
    align: 'right',
    render: (row) => <Box component="span" sx={{ ...monoSx(14), fontWeight: 700 }}>{row.periodGames}</Box>,
  },
  {
    key: 'totalGames',
    header: 'УСЬОГО',
    width: '90px',
    align: 'right',
    render: (row) => <Box component="span" sx={monoSx(13)}>{row.totalGames}</Box>,
  },
  {
    key: 'wins',
    header: 'МАФ / МИР',
    width: '110px',
    align: 'right',
    render: (row) => <Box component="span" sx={monoSx(13)}>{row.mafiaWins} / {row.citizensWins}</Box>,
  },
  {
    key: 'lastGameAt',
    header: 'ОСТАННЯ ГРА',
    width: 'minmax(0,1fr)',
    align: 'right',
    render: (row) => <Box component="span" sx={monoSx(13)}>{formatDate(row.lastGameAt)}</Box>,
  },
];

function gameColumns(showRecordedBy: boolean): BrandColumn<HostGame>[] {
  const columns: BrandColumn<HostGame>[] = [
    {
      key: 'createdAt',
      header: 'ДАТА',
      width: '150px',
      render: (game) => (
        <Box component="span" sx={monoSx(13)}>
          {formatDate(game.createdAt)}
          {game.updatedAt && (
            <Box component="span" title={`Змінено ${formatDate(game.updatedAt)}`} sx={{ ml: 0.5 }}>✎</Box>
          )}
        </Box>
      ),
    },
    {
      key: 'winState',
      header: 'ПЕРЕМОГА',
      width: '110px',
      render: (game) => (
        <Pill tone={game.winState === 'mafia' ? 'accent' : 'light'}>
          {game.winState === 'mafia' ? 'Маф' : 'Мир'}
        </Pill>
      ),
    },
    {
      key: 'players',
      header: 'ГРАВЦІ',
      width: 'minmax(0,2fr)',
      render: (game) => (
        <Box
          component="span"
          sx={{ ...monoSx(12), display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={game.players.join(', ')}
        >
          {game.players.join(', ')}
        </Box>
      ),
    },
  ];
  if (showRecordedBy) {
    columns.push({ key: 'recordedBy', header: 'ЗАПИСАВ', width: 'minmax(0,0.8fr)' });
  }
  columns.push({
    key: 'edit',
    header: '',
    width: '110px',
    align: 'right',
    render: () => (
      <Box component="span" sx={{ ...monoSx(12), color: brandColors.accent, fontWeight: 700 }}>
        РЕДАГУВАТИ
      </Box>
    ),
  });
  return columns;
}

/**
 * Статистика ведучих рейтингових ігор.
 *
 * Клуб бачить усіх ведучих і всі ігри поточного періоду. Ведучий бачить себе
 * і свої ігри. Клік на гру відкриває форму редагування.
 */
export default function DashboardHosts(props: { disableCustomTheme?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isClub = user?.authType === 'Клуб';
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [games, setGames] = useState<HostGame[]>([]);
  const [periodName, setPeriodName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/club/host-stats');
        setHosts(data.hosts || []);
        setGames(data.games || []);
        setPeriodName(data.periodName);
      } catch (e: any) {
        setError(e?.response?.status === 403 ? 'Цей розділ доступний клубу і ведучим.' : 'Не вдалося завантажити статистику.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ProfilePage title={isClub ? 'Ведучі' : 'Мої ігри ведучого'}>
        {error ? (
          <Typography sx={{ py: 4, textAlign: 'center' }}>{error}</Typography>
        ) : (
          <>
            <BrandTable
              columns={HOST_COLUMNS}
              rows={hosts}
              getRowKey={(row) => row.id}
              pageSize={0}
              loading={loading}
              emptyText={isClub ? 'Ще немає ведучих. Видайте значок на вкладці «Учасники».' : 'Ви ще не провели жодної гри.'}
              minWidth={640}
            />
            <Typography component="h2" sx={{ ...monoSx(13), mt: 5, mb: 1.5, letterSpacing: '0.08em' }}>
              ІГРИ ПЕРІОДУ{periodName ? ` «${periodName}»` : ''}
            </Typography>
            <BrandTable
              columns={gameColumns(isClub)}
              rows={games}
              getRowKey={(game) => game.id}
              pageSize={20}
              loading={loading}
              emptyText="У поточному періоді ігор ще немає."
              minWidth={isClub ? 860 : 740}
              onRowClick={(game) => navigate(`/profile/rating-game/${game.id}`)}
            />
          </>
        )}
      </ProfilePage>
    </AppTheme>
  );
}
