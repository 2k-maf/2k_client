import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import AppTheme from '../theme/AppTheme';
import ProfilePage from '../components/brand/ProfilePage';
import BrandTable, { BrandColumn } from '../components/brand/BrandTable';
import { Pill, PillTone } from '../components/brand/DocTable';
import { useAuth } from '../AuthProvider';
import axios from '../axios';
import { formatDateUkVancouver } from '../utils/vancouverDate';
import { brandFonts, monoSx } from '../theme/brand';

type Tournament = {
  id: string;
  name?: string;
  numGames?: number;
  scheduledDate?: string;
  status?: string;
  gamesSaved?: number;
  winnerNickname?: string;
};

const STATUS_UA: Record<string, { label: string; tone: PillTone }> = {
  draft: { label: 'Чернетка', tone: 'neutral' },
  in_progress: { label: 'Йде', tone: 'accent' },
  completed: { label: 'Завершено', tone: 'positive' },
};

const COLUMNS: BrandColumn<Tournament>[] = [
  {
    key: 'name',
    header: 'НАЗВА',
    width: 'minmax(0,1.4fr)',
    render: (t) => (
      <Box
        component="span"
        sx={{ fontFamily: brandFonts.display, fontWeight: 900, fontSize: 18, letterSpacing: '-0.01em' }}
      >
        {t.name}
      </Box>
    ),
  },
  {
    key: 'scheduledDate',
    header: 'ДАТА',
    width: '128px',
    render: (t) => (
      <Box component="span" sx={monoSx(13)}>
        {formatDateUkVancouver(t.scheduledDate) || '—'}
      </Box>
    ),
  },
  {
    key: 'status',
    header: 'СТАТУС',
    width: '128px',
    render: (t) => {
      const status = STATUS_UA[String(t.status)];
      return <Pill tone={status?.tone ?? 'neutral'}>{status?.label ?? t.status}</Pill>;
    },
  },
  {
    key: 'gamesSaved',
    header: 'ІГРИ',
    width: '84px',
    align: 'right',
    render: (t) => (
      <Box component="span" sx={monoSx(13)}>
        {t.gamesSaved ?? 0}/{t.numGames ?? 0}
      </Box>
    ),
  },
  {
    key: 'winnerNickname',
    header: 'ПЕРЕМОЖЕЦЬ',
    width: 'minmax(0,1fr)',
    align: 'right',
    render: (t) => (
      <Box component="span" sx={monoSx(13)}>
        {t.winnerNickname || '—'}
      </Box>
    ),
  },
];

export default function DashboardTournaments(props: { disableCustomTheme?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/tournaments');
        setTournaments(data.items || []);
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
      <ProfilePage title="Турніри">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            pb: 2,
          }}
        >
          <Typography sx={{ m: 0, fontSize: 15, color: 'rgba(242,243,247,0.6)' }}>
            {user?.authType === 'Клуб'
              ? 'Турніри вашого клубу. Натисніть рядок, щоб відкрити турнір.'
              : 'Турніри, де ви в списку учасників або в розсадці.'}
          </Typography>
          {user?.authType === 'Клуб' && (
            <Button variant="contained" onClick={() => navigate('/profile/tournaments/new')}>
              Новий турнір
            </Button>
          )}
        </Box>
        <BrandTable
          columns={COLUMNS}
          rows={tournaments}
          getRowKey={(t) => t.id}
          pageSize={20}
          loading={loading}
          emptyText="Турнірів поки немає."
          minWidth={860}
          onRowClick={(t) => navigate(`/profile/tournaments/${t.id}`)}
        />
      </ProfilePage>
    </AppTheme>
  );
}
