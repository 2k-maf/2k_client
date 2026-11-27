import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useParams } from 'react-router-dom';
import AppTheme from './theme/AppTheme';
import BrandPage from './components/brand/BrandPage';
import AvatarUploadButton from './components/AvatarUploadButton';
import GuestApplyForm, { type GuestApplyInput } from './components/GuestApplyForm';
import TournamentAnnouncement from './components/TournamentAnnouncement';
import axios from './axios';
import { useAuth } from './AuthProvider';
import { notify } from './components/feedback/feedback';
import { formatDateUkVancouver } from './utils/vancouverDate';
import {
  adoptGuestToken,
  clearGuestToken,
  guestApplicationLink,
  guestApplyErrorMessage,
  saveGuestToken,
} from './utils/guestApplication';
import {
  APPLICATION_STATUS_UA,
  applyInfoUrl,
  createLatestGuard,
  isAuthSettled,
  resolveApplyView,
  type ApplicationStatus,
} from './utils/tournamentApplications';

type TournamentInfo = {
  name: string;
  status: string;
  scheduledDate: string | null;
  clubName: string;
  posterUrl: string | null;
  publicDescription: string;
};

type LoadState = 'loading' | 'ready' | 'notFound' | 'error';

const guestApplicationUrl = (id: string) => `/public/tournament/${id}/guest-application`;
const guestTokenHeaders = (token: string) => ({ 'x-guest-token': token });

export default function TournamentApplyPage(props: { disableCustomTheme?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const authType = user?.authType;
  const [tournament, setTournament] = React.useState<TournamentInfo | null>(null);
  const [myStatus, setMyStatus] = React.useState<ApplicationStatus | null>(null);
  const [loadState, setLoadState] = React.useState<LoadState>('loading');
  const [avatarMissing, setAvatarMissing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  // Токен гостя живе в стані: `adoptGuestToken` прибирає `#g=` з URL, навіть якщо localStorage недоступний.
  const [guestToken, setGuestToken] = React.useState<string | null>(null);
  const [guestStatus, setGuestStatus] = React.useState<ApplicationStatus | null>(null);
  const guestSession = React.useRef<{ id: string; token: string | null } | null>(null);

  const authSettled = isAuthSettled(Boolean(user), localStorage.getItem('jwt_token'));
  const loadGuard = React.useRef(createLatestGuard()).current;

  /** Токен більше не діє (заявку відкликано або її не знайдено): прибираємо зі сховища й зі стану. */
  const forgetGuestToken = React.useCallback((tournamentId: string) => {
    clearGuestToken(tournamentId);
    guestSession.current = { id: tournamentId, token: null };
    setGuestToken(null);
  }, []);

  /** Токен гостя для `id`: фрагмент URL забираємо один раз на `id`, далі беремо із сесії сторінки. */
  const resolveGuestToken = React.useCallback(
    (tournamentId: string): string | null => {
      if (authType) {
        guestSession.current = null;
        return null;
      }
      if (guestSession.current?.id !== tournamentId) {
        guestSession.current = { id: tournamentId, token: adoptGuestToken(tournamentId) };
      }
      return guestSession.current.token;
    },
    [authType],
  );

  /** Єдиний завантажувач: турнір + власна заявка (гравець) або статус за токеном (гість). Стан пише лише останній запуск. */
  const load = React.useCallback(async () => {
    if (!id || !authSettled) return;
    const requestId = loadGuard.next();
    const token = resolveGuestToken(id);
    try {
      const [tournamentRes, myRes, guestRes] = await Promise.all([
        axios.get<TournamentInfo>(applyInfoUrl(id)),
        authType === 'Учасник'
          ? axios.get<{ status: ApplicationStatus | null }>(`/tournament/${id}/my-application`)
          : Promise.resolve(null),
        token
          ? axios.get<{ status: ApplicationStatus | null }>(guestApplicationUrl(id), {
              headers: guestTokenHeaders(token),
            })
          : Promise.resolve(null),
      ]);
      if (!loadGuard.isLatest(requestId)) return;
      const nextGuestStatus = guestRes?.data.status ?? null;
      if (token && !nextGuestStatus) forgetGuestToken(id);
      setTournament(tournamentRes.data);
      setMyStatus(myRes?.data.status ?? null);
      setGuestToken(nextGuestStatus ? token : null);
      setGuestStatus(nextGuestStatus);
      setLoadState('ready');
    } catch (e: any) {
      if (!loadGuard.isLatest(requestId)) return;
      setLoadState(e?.response?.status === 404 ? 'notFound' : 'error');
    }
  }, [id, authType, authSettled, loadGuard, resolveGuestToken, forgetGuestToken]);

  React.useEffect(() => {
    // Змінилися id або auth: скидаємо стан, щоб не показувати чужий вид, і скасовуємо запити в польоті.
    setLoadState('loading');
    setTournament(null);
    setMyStatus(null);
    setGuestToken(null);
    setGuestStatus(null);
    void load();
    return () => loadGuard.invalidate();
  }, [load, loadGuard]);

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

  const guestApply = (input: GuestApplyInput) =>
    runAction(
      async () => {
        const { data } = await axios.post<{ token: string }>(`/public/tournament/${id}/guest-apply`, input);
        saveGuestToken(id!, data.token);
        guestSession.current = { id: id!, token: data.token };
        setGuestToken(data.token);
      },
      () => setGuestStatus('pending'),
      async (code) => {
        notify.error(guestApplyErrorMessage(code));
        if (code === 'TOURNAMENT_NOT_OPEN') await load();
      },
    );

  const guestWithdraw = (token: string) =>
    runAction(
      () => axios.delete(guestApplicationUrl(id!), { headers: guestTokenHeaders(token) }),
      async () => {
        forgetGuestToken(id!);
        await load();
      },
      async (code) => {
        notify.error(code === 'TOURNAMENT_NOT_OPEN' ? guestApplyErrorMessage(code) : 'Не вдалося відкликати заявку');
        if (code === 'TOURNAMENT_NOT_OPEN') await load();
      },
    );

  const copyGuestLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      notify.success('Посилання скопійовано');
    } catch {
      notify.error('Не вдалося скопіювати посилання');
    }
  };

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
      guestStatus,
    });

    switch (view) {
      case 'guest':
        return <GuestApplyForm busy={busy} onSubmit={guestApply} />;
      case 'guestSubmitted': {
        const link = guestToken ? guestApplicationLink(window.location.origin, id!, guestToken) : null;
        return (
          <Stack spacing={2}>
            <Typography>Вашу заявку подано.</Typography>
            {guestStatus ? <Typography>Статус: {APPLICATION_STATUS_UA[guestStatus]}</Typography> : null}
            {link ? (
              <Stack spacing={1}>
                <Typography variant="body2">
                  Збережіть це приватне посилання: за ним можна переглянути статус заявки або відкликати її.
                </Typography>
                <Stack direction="row" gap={1} alignItems="center">
                  <TextField
                    value={link}
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { readOnly: true, 'aria-label': 'Приватне посилання на заявку' } }}
                  />
                  <Button variant="outlined" onClick={() => void copyGuestLink(link)}>
                    Скопіювати
                  </Button>
                </Stack>
              </Stack>
            ) : null}
            {guestToken && tournament.status === 'draft' && guestStatus !== 'rejected' ? (
              <Button
                variant="outlined"
                color="error"
                disabled={busy}
                onClick={() => void guestWithdraw(guestToken)}
                sx={{ alignSelf: 'flex-start' }}
              >
                Відкликати заявку
              </Button>
            ) : null}
          </Stack>
        );
      }
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
        <Stack spacing={2}>
          {tournament ? (
            <TournamentAnnouncement posterUrl={tournament.posterUrl} description={tournament.publicDescription} />
          ) : null}
          {renderBody()}
        </Stack>
      </BrandPage>
    </AppTheme>
  );
}
