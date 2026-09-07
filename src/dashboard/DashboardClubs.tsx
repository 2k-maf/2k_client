import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from '../theme/AppTheme';
import ProfilePage from '../components/brand/ProfilePage';
import BrandTable, { BrandColumn } from '../components/brand/BrandTable';
import axios from '../axios';
import { brandFonts, monoSx } from '../theme/brand';

type Club = {
  id: number;
  name?: string;
  address?: string;
  email?: string;
  users?: number;
};

const COLUMNS: BrandColumn<Club>[] = [
  {
    key: 'name',
    header: 'НАЗВА КЛУБУ',
    width: 'minmax(0,1.2fr)',
    render: (club) => (
      <Box
        component="span"
        sx={{ fontFamily: brandFonts.display, fontWeight: 900, fontSize: 18, letterSpacing: '-0.01em' }}
      >
        {club.name?.trim()}
      </Box>
    ),
  },
  { key: 'address', header: 'АДРЕСА', width: 'minmax(0,1fr)' },
  {
    key: 'email',
    header: 'EMAIL',
    width: 'minmax(0,1fr)',
    render: (club) => (
      <Box component="span" sx={monoSx(13)}>
        {club.email || '—'}
      </Box>
    ),
  },
  {
    key: 'users',
    header: 'УЧАСНИКИ',
    width: '110px',
    align: 'right',
    render: (club) => (
      <Box component="span" sx={monoSx(13)}>
        {club.users ?? 0}
      </Box>
    ),
  },
];

export default function DashboardClubs(props: { disableCustomTheme?: boolean }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/user/clubs');
        setClubs((data.items || []).map((item: any, i: number) => ({ ...item, id: i + 1 })));
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
      <ProfilePage title="Мої клуби">
        <BrandTable
          columns={COLUMNS}
          rows={clubs}
          getRowKey={(club) => club.id}
          pageSize={20}
          loading={loading}
          emptyText="Ви поки не приєдналися до жодного клубу."
          minWidth={720}
        />
      </ProfilePage>
    </AppTheme>
  );
}
