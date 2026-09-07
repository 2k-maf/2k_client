import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from '../theme/AppTheme';
import ProfilePage from '../components/brand/ProfilePage';
import BrandTable, { BrandColumn } from '../components/brand/BrandTable';
import BrandSearchField from '../components/brand/BrandSearchField';
import axios from '../axios';
import { brandFonts, monoSx } from '../theme/brand';

type ClubMember = {
  id: number;
  nickname?: string;
  name?: string;
  email?: string;
};

const COLUMNS: BrandColumn<ClubMember>[] = [
  {
    key: 'nickname',
    header: 'НІК',
    width: 'minmax(0,1fr)',
    render: (member) => (
      <Box
        component="span"
        sx={{ fontFamily: brandFonts.display, fontWeight: 900, fontSize: 18, letterSpacing: '-0.01em' }}
      >
        {member.nickname?.trim()}
      </Box>
    ),
  },
  { key: 'name', header: "ІМ'Я", width: 'minmax(0,1fr)' },
  {
    key: 'email',
    header: 'EMAIL',
    width: 'minmax(0,1.2fr)',
    render: (member) => (
      <Box component="span" sx={monoSx(13)}>
        {member.email || '—'}
      </Box>
    ),
  },
];

export default function DashboardUsers(props: { disableCustomTheme?: boolean }) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/club/users');
        setMembers((data.items || []).map((item: any, i: number) => ({ ...item, id: i + 1 })));
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
    if (!q) return members;
    return members.filter(
      (m) => m.nickname?.toLowerCase().includes(q) || m.name?.toLowerCase().includes(q),
    );
  }, [members, query]);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ProfilePage title="Учасники клубу">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pb: 2 }}>
          <BrandSearchField
            value={query}
            onChange={setQuery}
            placeholder="Пошук учасника"
            label="Пошук учасника"
          />
        </Box>
        <BrandTable
          columns={COLUMNS}
          rows={filtered}
          getRowKey={(member) => member.id}
          pageSize={20}
          loading={loading}
          emptyText={query ? 'Учасника не знайдено.' : 'У клубі поки немає учасників.'}
          minWidth={640}
        />
      </ProfilePage>
    </AppTheme>
  );
}
