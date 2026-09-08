import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './theme/AppTheme';
import BrandPage from './components/brand/BrandPage';
import BrandTable, { BrandColumn } from './components/brand/BrandTable';
import BrandSearchField from './components/brand/BrandSearchField';
import RemoteAvatar from './components/brand/RemoteAvatar';
import axios from './axios';
import { brandFonts, monoSx } from './theme/brand';

type Member = {
  id: number;
  nickname?: string;
  name?: string;
  clubs?: string;
  avatarUrl?: string;
};

/** Сторона аватара в пікселях. Трек сітки має збігатися з цим числом. */
const AVATAR_SIZE = 40;

const COLUMNS: BrandColumn<Member>[] = [
  {
    key: 'avatar',
    // Колонка з картинками заголовка не має: підпис до неї нічого не додає.
    header: '',
    width: `${AVATAR_SIZE}px`,
    render: (member) => (
      <RemoteAvatar
        avatarUrl={member.avatarUrl}
        nickname={member.nickname || member.name || ''}
        sx={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          fontFamily: brandFonts.display,
          fontWeight: 900,
          fontSize: 16,
        }}
      />
    ),
  },
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
    key: 'clubs',
    header: 'КЛУБИ',
    width: 'minmax(0,1.2fr)',
    render: (member) => (
      <Box component="span" sx={monoSx(13)}>
        {member.clubs || '—'}
      </Box>
    ),
  },
];

export default function MembersList(props: { disableCustomTheme?: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/users');
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
      <BrandPage
        eyebrow="Клуб мафії · Ванкувер"
        title="Учасники клубу"
        actions={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <BrandSearchField
              value={query}
              onChange={setQuery}
              placeholder="Пошук учасника"
              label="Пошук учасника"
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
              УСЬОГО {members.length}
            </Box>
          </Box>
        }
      >
        <BrandTable
          columns={COLUMNS}
          rows={filtered}
          getRowKey={(member) => member.id}
          loading={loading}
          emptyText={query ? 'Учасника не знайдено.' : 'Учасників поки немає.'}
          // Колонка аватара додала 40 пікселів і проміжок сітки.
          minWidth={700}
        />
      </BrandPage>
    </AppTheme>
  );
}
