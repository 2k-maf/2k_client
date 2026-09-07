import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './theme/AppTheme';
import BrandPage from './components/brand/BrandPage';
import BrandTable, { BrandColumn } from './components/brand/BrandTable';
import BrandSearchField from './components/brand/BrandSearchField';
import axios from './axios';
import { brandFonts, monoSx } from './theme/brand';

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

export default function ClubsList(props: { disableCustomTheme?: boolean }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/clubs');
        setClubs((data.items || []).map((item: any, i: number) => ({ ...item, id: i + 1 })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.address?.toLowerCase().includes(q),
    );
  }, [clubs, query]);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <BrandPage
        eyebrow="Клуб мафії · Ванкувер"
        title="Клуби"
        actions={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <BrandSearchField
              value={query}
              onChange={setQuery}
              placeholder="Пошук клубу"
              label="Пошук клубу"
            />
            <Box
              component="span"
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.10)',
                ...monoSx(12),
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              УСЬОГО {clubs.length}
            </Box>
          </Box>
        }
      >
        <BrandTable
          columns={COLUMNS}
          rows={filtered}
          getRowKey={(club) => club.id}
          loading={loading}
          emptyText={query ? 'Клуб не знайдено.' : 'Клубів поки немає.'}
          minWidth={720}
        />
      </BrandPage>
    </AppTheme>
  );
}
