import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Switch from '@mui/material/Switch';
import GavelIcon from '@mui/icons-material/Gavel';
import AppTheme from '../theme/AppTheme';
import ProfilePage from '../components/brand/ProfilePage';
import BrandTable, { BrandColumn } from '../components/brand/BrandTable';
import BrandSearchField from '../components/brand/BrandSearchField';
import axios from '../axios';
import { brandColors, brandFonts, monoSx } from '../theme/brand';

type ClubMember = {
  id: number;
  _id: string;
  nickname?: string;
  name?: string;
  email?: string;
  /** Значок ведучого: учасник може проводити рейтингові ігри клубу. */
  isHost?: boolean;
};

export default function DashboardUsers(props: { disableCustomTheme?: boolean }) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  /** Учасник, чий значок зараз зберігається: перемикач блокується до відповіді сервера. */
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const columns = useMemo<BrandColumn<ClubMember>[]>(() => {
    const toggleHost = async (member: ClubMember, host: boolean) => {
      setSavingId(member._id);
      try {
        await axios.put(`/club/users/${member._id}/host`, { host });
        setMembers((prev) => prev.map((m) => (m._id === member._id ? { ...m, isHost: host } : m)));
      } catch (e: any) {
        alert(e?.response?.data?.error || 'Значок не змінено');
      } finally {
        setSavingId(null);
      }
    };

    return [
      {
        key: 'nickname',
        header: 'НІК',
        width: 'minmax(0,1fr)',
        render: (member) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <Box
              component="span"
              sx={{ fontFamily: brandFonts.display, fontWeight: 900, fontSize: 18, letterSpacing: '-0.01em' }}
            >
              {member.nickname?.trim()}
            </Box>
            {member.isHost && (
              <GavelIcon titleAccess="Ведучий" sx={{ fontSize: 16, color: brandColors.accent }} />
            )}
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
      {
        key: 'isHost',
        header: 'ВЕДУЧИЙ',
        width: '96px',
        align: 'right',
        render: (member) => (
          <Switch
            size="small"
            checked={Boolean(member.isHost)}
            disabled={savingId === member._id}
            onChange={(e) => void toggleHost(member, e.target.checked)}
            inputProps={{ 'aria-label': `Значок ведучого: ${member.nickname || member.name || ''}` }}
          />
        ),
      },
    ];
  }, [savingId]);

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
          columns={columns}
          rows={filtered}
          getRowKey={(member) => member.id}
          pageSize={20}
          loading={loading}
          emptyText={query ? 'Учасника не знайдено.' : 'У клубі поки немає учасників.'}
          minWidth={740}
        />
      </ProfilePage>
    </AppTheme>
  );
}
