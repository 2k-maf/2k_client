import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useParams } from 'react-router-dom';
import AppTheme from './theme/AppTheme';
import BrandPage from './components/brand/BrandPage';
import AvatarUploadButton from './components/AvatarUploadButton';
import axios from './axios';
import { useAuth } from './AuthProvider';
import { notify } from './components/feedback/feedback';
import { formatDateUkVancouver } from './utils/vancouverDate';
import { APPLICATION_STATUS_UA, resolveApplyView, type ApplicationStatus } from './utils/tournamentApplications';

type TournamentInfo = {
  name: string;
  status: string;
  scheduledDate: string | null;
  clubName: string;
};

type LoadState = 'loading' | 'ready' | 'notFound' | 'error';

export default function TournamentApplyPage(props: { disableCustomTheme?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const authType = user?.authType;
  const [tournament, setTournament] = React.useState<TournamentInfo | null>(null);
  const [myStatus, setMyStatus] = React.useState<ApplicationStatus | null>(null);
  const [loadState, setLoadState] = React.useState<LoadState>('loading');
  const [avatarMissing, setAvatarMissing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  /** Єдиний завантажувач: турнір + (лише для гравця) власна заявка. */
  const load = React.useCallback(async () => {
    if (!id) return;
    try {
      const [tournamentRes, myRes] = await Promise.all([
        axios.get<TournamentInfo>(`/public/tournament/${id}`),
        authType === 'Учасник'
          ? axios.get<{ status: ApplicationStatus | null }>(`/tournament/${id}/my-application`)
          : Promise.resolve(null),
      ]);
      setTournament(tournamentRes.data);
      setMyStatus(myRes?.data.status ?? null);
      setLoadState('ready');
    } catch (e: any) {
      setLoadState(e?.response?.status === 404 ? 'notFound' : 'error');
    }
  }, [id, authType]);

  React.useEffect(() => {
    void load();
  }, [load]);

  /** Виконує запит заявки, а помилку віддає в `onError` за кодом сервера. */
  const runAction = async (
    request: () => Promise<unknown>,
    onSuccess: () => Promise<void> | void,
    onError: (code: unknown) => Promise<void> | void,
  ) => {
    setBusy(true);
    try {
      await request();
      await onSuccess();
    } catch (e: any) {
      await onError(e?.response?.data?.error);
    } finally {
      setBusy(false);
    }
  };

  const apply = () =>
    runAction(
      () => axios.post(`/tournament/${id}/apply`),
      () => setMyStatus('pending'),
      async (code) => {
        if (code === 'AVATAR_REQUIRED') {
          notify.error('Спершу додайте аватарку');
          setAvatarMissing(true);
        } else if (code === 'Already applied') {
          await load();
        } else if (code === 'TOURNAMENT_NOT_OPEN') {
          notify.error('Набір закрито: турнір вже почався');
          await load();
        } else {
          notify.error('Не вдалося подати заявку');
        }
      },
    );

  const withdraw = () =>
    runAction(
      () => axios.delete(`/tournament/${id}/apply`),
      () => load(),
      async (code) => {
        if (code === 'TOURNAMENT_NOT_OPEN') {
          notify.error('Набір закрито: турнір вже почався');
          await load();
        } else {
          notify.error('Не вдалося відкликати заявку');
        }
      },
    );

  const backToTournament = (
    <Button component={RouterLink} to={`/tournaments/${id}`} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
      До сторінки турніру
    </Button>
  );

  const renderBody = () => {
    if (loadState === 'loading') return <Typography variant="body2">Завантаження…</Typography>;
    if (loadState === 'error') return <Typography color="error">Не вдалося завантажити.</Typography>;
    if (loadState === 'notFound' || !tournament) {
      return (
        <Stack spacing={2}>
          <Typography>Турнір не знайдено.</Typography>
          {backToTournament}
        </Stack>
      );
    }

    const view = resolveApplyView({
      authType,
      hasAvatar: Boolean(user?.avatarUrl) && !avatarMissing,
      tournamentStatus: tournament.status,
      myStatus,
    });

    switch (view) {
      case 'login':
        return (
          <Stack spacing={2}>
            <Typography>Щоб подати заявку, увійдіть як гравець.</Typography>
            <Button component={RouterLink} to="/login" variant="contained" sx={{ alignSelf: 'flex-start' }}>
              Увійти
            </Button>
          </Stack>
        );
      case 'club':
        return (
          <Stack spacing={2}>
            <Typography>Заявки подають гравці. Клуб схвалює заявки у своєму кабінеті.</Typography>
            <Button
              component={RouterLink}
              to={`/tournaments/${id}/applications`}
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            >
              Заявки турніру
            </Button>
          </Stack>
        );
      case 'closed':
        return (
          <Stack spacing={2}>
            <Typography>Набір закрито.</Typography>
            {backToTournament}
          </Stack>
        );
      case 'avatar':
        return (
          <Stack spacing={2} alignItems="flex-start">
            <Typography>Додайте аватарку, щоб подати заявку.</Typography>
            <AvatarUploadButton isClub={false} onUploaded={() => setAvatarMissing(false)} />
          </Stack>
        );
      case 'form':
        return (
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight={700}>
                  {tournament.name}
                </Typography>
                <Typography variant="body2">Дата: {formatDateUkVancouver(tournament.scheduledDate)}</Typography>
                <Typography variant="body2">Клуб: {tournament.clubName}</Typography>
              </Stack>
            </Paper>
            <Button variant="contained" disabled={busy} onClick={() => void apply()} sx={{ alignSelf: 'flex-start' }}>
              Податись на участь
            </Button>
          </Stack>
        );
      case 'submitted':
        return (
          <Stack spacing={2}>
            <Typography>Вашу заявку подано.</Typography>
            {myStatus ? <Typography>Статус: {APPLICATION_STATUS_UA[myStatus]}</Typography> : null}
            <Stack direction="row" gap={1} flexWrap="wrap">
              {tournament.status === 'draft' ? (
                <Button variant="outlined" color="error" disabled={busy} onClick={() => void withdraw()}>
                  Відкликати заявку
                </Button>
              ) : null}
              <Button component={RouterLink} to={`/tournaments/${id}/applications`} variant="text">
                Список заявок
              </Button>
            </Stack>
          </Stack>
        );
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <BrandPage eyebrow="Заявки на участь" title={tournament?.name ?? 'Податись на участь'}>
        {renderBody()}
      </BrandPage>
    </AppTheme>
  );
}
