import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from '../theme/AppTheme';
import ProfilePage from '../components/brand/ProfilePage';
import BrandTable, { BrandColumn } from '../components/brand/BrandTable';
import { Pill } from '../components/brand/DocTable';
import axios from '../axios';
import { monoSx } from '../theme/brand';

type Game = {
  id: number;
  createdAt?: string;
  role?: string;
  winner?: string;
  supportFivePoints?: number;
  bonus?: number;
  points?: number;
};

/** Ролі мафії позначені акцентом, мирні — світлою пігулкою, як у правилах. */
const MAFIA_ROLES = ['Маф', 'Дон'];

const signed = (value?: number) => {
  if (!value) return '—';
  return value > 0 ? `+${value}` : String(value);
};

const COLUMNS: BrandColumn<Game>[] = [
  {
    key: 'createdAt',
    header: 'ДАТА',
    width: 'minmax(0,1.2fr)',
    render: (game) => (
      <Box component="span" sx={monoSx(13)}>
        {game.createdAt || '—'}
      </Box>
    ),
  },
  {
    key: 'role',
    header: 'РОЛЬ',
    width: '110px',
    render: (game) => (
      <Pill tone={MAFIA_ROLES.includes(game.role || '') ? 'accent' : 'light'}>{game.role}</Pill>
    ),
  },
  {
    key: 'winner',
    header: 'ПЕРЕМОГА',
    width: '120px',
    render: (game) => (
      <Pill tone={game.winner === 'Маф' ? 'accent' : 'light'}>{game.winner}</Pill>
    ),
  },
  {
    key: 'supportFivePoints',
    header: 'ОП5',
    width: '84px',
    align: 'right',
    render: (game) => (
      <Box component="span" sx={monoSx(13)}>
        {signed(game.supportFivePoints)}
      </Box>
    ),
  },
  {
    key: 'bonus',
    header: 'БОНУС',
    width: '84px',
    align: 'right',
    render: (game) => (
      <Box component="span" sx={monoSx(13)}>
        {signed(game.bonus)}
      </Box>
    ),
  },
  {
    key: 'points',
    header: 'БАЛИ',
    width: '90px',
    align: 'right',
    render: (game) => (
      <Box component="span" sx={{ ...monoSx(14), fontWeight: 700 }}>
        {game.points ?? 0}
      </Box>
    ),
  },
];

export default function DashboardGames(props: { disableCustomTheme?: boolean }) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/user/games');
        setGames((data.items || []).map((item: any, i: number) => ({ ...item, id: i + 1 })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ProfilePage title="Мої ігри">
        <BrandTable
          columns={COLUMNS}
          rows={games}
          getRowKey={(game) => game.id}
          pageSize={20}
          loading={loading}
          emptyText="Зіграних ігор поки немає."
          minWidth={820}
        />
      </ProfilePage>
    </AppTheme>
  );
}
