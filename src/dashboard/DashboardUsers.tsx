import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonIcon from '@mui/icons-material/Person';
import AppTheme from '../theme/AppTheme';
import ProfilePage from '../components/brand/ProfilePage';
import BrandTable, { BrandColumn } from '../components/brand/BrandTable';
import BrandSearchField from '../components/brand/BrandSearchField';
import axios from '../axios';
import { brandColors, brandFonts, monoSx } from '../theme/brand';
import { notify } from '../components/feedback/feedback';
import { useAuth } from '../AuthProvider';
import {
  BIRTH_DATE_MIN,
  birthDateInputValue,
  birthDateMax,
  formatBirthDate,
  MemberBirthDate,
  withClubBirthDate,
} from '../utils/birthDate';

type ClubMember = {
  id: number;
  _id: string;
  nickname?: string;
  name?: string;
  email?: string;
  /** Значок ведучого: учасник може проводити рейтингові ігри клубу. */
  isHost?: boolean;
} & MemberBirthDate;

export default function DashboardUsers(props: { disableCustomTheme?: boolean }) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  /** Учасник, чий значок зараз зберігається: перемикач блокується до відповіді сервера. */
  const [savingId, setSavingId] = useState<string | null>(null);
  /** Дати народження бачить лише адміністратор клубу; ведучому сервер їх не віддає. */
  const isClub = useAuth().user?.authType === 'Клуб';
  /** Учасник, чию дату від клубу зараз редагують, і чернетка дати. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

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
        notify.error(e?.response?.data?.error || 'Значок не змінено');
      } finally {
        setSavingId(null);
      }
    };

    const saveBirthDate = async (member: ClubMember) => {
      setSavingId(member._id);
      try {
        const { data } = await axios.put(`/club/users/${member._id}/birth-date`, { birthDate: draft || null });
        const clubBirthDate = birthDateInputValue(data?.clubBirthDate) || null;
        setMembers((prev) => prev.map((m) => (m._id === member._id ? withClubBirthDate(m, clubBirthDate) : m)));
        setEditingId(null);
      } catch (e: any) {
        notify.error(
          e?.response?.data?.error === 'Invalid birth date'
            ? 'Некоректна дата народження'
            : e?.response?.data?.error || 'Дату не змінено',
        );
      } finally {
        setSavingId(null);
      }
    };

    const birthDateColumn: BrandColumn<ClubMember> = {
      key: 'birthDate',
      header: 'НАРОДЖЕННЯ',
      width: '220px',
      render: (member) =>
        editingId === member._id ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
              size="small"
              type="date"
              value={draft}
              disabled={savingId === member._id}
              onChange={(e) => setDraft(e.target.value)}
              slotProps={{
                htmlInput: {
                  min: BIRTH_DATE_MIN,
                  max: birthDateMax(),
                  'aria-label': `Дата народження від клубу: ${member.nickname || member.name || ''}`,
                },
              }}
            />
            <IconButton
              size="small"
              aria-label="Зберегти"
              disabled={savingId === member._id}
              onClick={() => void saveBirthDate(member)}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Скасувати"
              disabled={savingId === member._id}
              onClick={() => setEditingId(null)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box component="span" sx={monoSx(13)}>
              {formatBirthDate(member.birthDate)}
            </Box>
            {member.birthDateSource === 'self' && (
              <Tooltip title="Вказав сам">
                <PersonIcon role="img" aria-hidden={false} sx={{ fontSize: 16, color: brandColors.accent }} />
              </Tooltip>
            )}
            <IconButton
              size="small"
              aria-label={`Змінити дату народження від клубу: ${member.nickname || member.name || ''}`}
              disabled={savingId !== null}
              onClick={() => {
                setDraft(birthDateInputValue(member.clubBirthDate));
                setEditingId(member._id);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
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
      ...(isClub ? [birthDateColumn] : []),
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
  }, [savingId, isClub, editingId, draft]);

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
          minWidth={isClub ? 960 : 740}
        />
      </ProfilePage>
    </AppTheme>
  );
}
