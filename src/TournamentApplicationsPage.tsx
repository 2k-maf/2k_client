import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useParams } from 'react-router-dom';
import AppTheme from './theme/AppTheme';
import BrandPage from './components/brand/BrandPage';
import TournamentApplicationsTable from './components/TournamentApplicationsTable';
import axios from './axios';
import { useAuth } from './AuthProvider';
import { notify } from './components/feedback/feedback';
import {
  APPLICATION_ACTION_UA,
  applicationActions,
  applicationErrorMessage,
  createLatestGuard,
  isAuthSettled,
  tournamentHeaderUrl,
  type ApplicationRow,
  type ApplicationStatus,
} from './utils/tournamentApplications';

type TournamentInfo = { name: string; status: string; clubId: string | null };
type ApplicationsPayload = { items: ApplicationRow[]; capacity: number; approvedCount: number };

export default function TournamentApplicationsPage(props: { disableCustomTheme?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tournament, setTournament] = React.useState<TournamentInfo | null>(null);
  const [list, setList] = React.useState<ApplicationsPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busyUserId, setBusyUserId] = React.useState<string | null>(null);

  const isOwner =
    user?.authType === 'Клуб' && tournament != null && String(user._id) === String(tournament.clubId);

  const isClubUser = user?.authType === 'Клуб';
  const authSettled = isAuthSettled(Boolean(user), localStorage.getItem('jwt_token'));
  const headerGuard = React.useRef(createLatestGuard()).current;

  React.useEffect(() => {
    // Поки auth не усталився, не вантажимо: інакше клуб-власник побачить 404 публічного ендпоінта.
    if (!id || !authSettled) return;
    const requestId = headerGuard.next();
    (async () => {
      try {
        let data: TournamentInfo;
        try {
          ({ data } = await axios.get<TournamentInfo>(tournamentHeaderUrl(id, isClubUser)));
        } catch (e: any) {
          // Клуб не власник цього турніру: авторизований запит дає 404, читаємо публічний.
          if (!isClubUser || e?.response?.status !== 404) throw e;
          ({ data } = await axios.get<TournamentInfo>(tournamentHeaderUrl(id, false)));
        }
        if (!headerGuard.isLatest(requestId)) return;
        setTournament(data);
        setError(null);
      } catch (e: any) {
        if (!headerGuard.isLatest(requestId)) return;
        setTournament(null);
        setError(e?.response?.status === 404 ? 'Турнір не знайдено або сторінка недоступна.' : 'Не вдалося завантажити.');
      }
    })();
    return () => headerGuard.invalidate();
  }, [id, isClubUser, authSettled, headerGuard]);

  const loadList = React.useCallback(async () => {
    if (!id || !tournament) return;
    const url = isOwner ? `/club/tournament/${id}/applications` : `/public/tournament/${id}/applications`;
    try {
      const { data } = await axios.get<ApplicationsPayload>(url);
      setList(data);
      setError(null);
    } catch {
      setError('Не вдалося завантажити заявки.');
    }
  }, [id, tournament, isOwner]);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  const changeStatus = async (row: ApplicationRow, status: ApplicationStatus) => {
    setBusyUserId(row.userId);
    try {
      await axios.put(`/club/tournament/${id}/applications/${row.userId}`, { status });
      notify.success('Заявку оновлено');
      await loadList();
    } catch (e: any) {
      notify.error(applicationErrorMessage(e?.response?.data?.error));
    } finally {
      setBusyUserId(null);
    }
  };

  const renderActions = (row: ApplicationRow) => (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {applicationActions(row.status).map((status) => (
        <Button
          key={status}
          size="small"
          variant="outlined"
          color={status === 'rejected' ? 'error' : 'primary'}
          disabled={busyUserId === row.userId}
          onClick={() => void changeStatus(row, status)}
        >
          {APPLICATION_ACTION_UA[status]}
        </Button>
      ))}
    </Stack>
  );

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <BrandPage eyebrow="Заявки на участь" title={tournament?.name}>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : !tournament || !list ? (
          <Typography variant="body2">Завантаження…</Typography>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Typography variant="h6" fontWeight={700}>
                Схвалено {list.approvedCount} з {list.capacity}
              </Typography>
              {tournament.status === 'draft' && !isOwner ? (
                <Button component={RouterLink} to={`/tournaments/${id}/apply`} variant="contained">
                  Податись
                </Button>
              ) : null}
            </Stack>
            <TournamentApplicationsTable rows={list.items} actions={isOwner ? renderActions : undefined} />
          </Stack>
        )}
      </BrandPage>
    </AppTheme>
  );
}
