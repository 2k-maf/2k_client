import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import GoogleIcon from '@mui/icons-material/Google';
import ProfileCard from './brand/ProfileCard';
import ForgotPassword from './ForgotPassword';
import GoogleButton, { googleEnabled } from './GoogleButton';
import { useAuth } from '../AuthProvider';
import axios from '../axios';

/** Тексти для кодів 409 з POST і DELETE /auth/google/link. */
const LINK_ERRORS: Record<string, string> = {
  GOOGLE_ALREADY_LINKED: "Цей Google-акаунт уже прив'язано до іншого облікового запису.",
  ALREADY_HAS_GOOGLE: "До облікового запису вже прив'язано інший Google-акаунт. Спершу відв'яжіть його.",
  NO_OTHER_LOGIN_METHOD:
    "Обліковий запис не має пароля. Задайте пароль через «Забули пароль», а потім відв'яжіть Google.",
  UNKNOWN: "Не вдалося змінити прив'язку Google. Спробуйте пізніше.",
};

/**
 * Панель кабінету «Вхід через Google» для гравця і для клубу.
 * Стан прив'язки береться з токена: кожна успішна відповідь повертає новий токен.
 */
export default function GoogleLinkCard() {
  const { user, setToken } = useAuth();
  // Ключ LINK_ERRORS або порожній рядок.
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [forgotOpen, setForgotOpen] = React.useState(false);

  if (!googleEnabled) return null;

  const handleError = (e: any) => {
    console.error(e);
    const code = e?.response?.data?.code;
    setError(Object.keys(LINK_ERRORS).includes(code) ? code : 'UNKNOWN');
  };

  // 401 у цих запитах означає завершену сесію: інтерцептор axios переводить на вхід.
  const handleLink = async (credential: string) => {
    setError('');
    try {
      const { data } = await axios.post('/auth/google/link', { credential });
      data?.token && setToken(data.token);
    } catch (e: any) {
      handleError(e);
    }
  };

  const handleUnlink = async () => {
    setError('');
    setBusy(true);
    try {
      const { data } = await axios.delete('/auth/google/link');
      data?.token && setToken(data.token);
    } catch (e: any) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  };

  const linkedEmail = user?.googleEmail;

  return (
    <ProfileCard
      icon={<GoogleIcon />}
      label="АКАУНТ"
      title="Вхід через Google"
      hint={
        linkedEmail
          ? 'Ви можете входити через Google без пароля.'
          : "Прив'яжіть Google, щоб входити без пароля."
      }
    >
      {linkedEmail ? (
        <>
          <Box component="span" sx={{ fontSize: 14, wordBreak: 'break-all' }}>
            Прив'язано: {linkedEmail}
          </Box>
          <Button variant="outlined" disabled={busy} onClick={handleUnlink}>
            Відв'язати
          </Button>
        </>
      ) : (
        <GoogleButton text="continue_with" onCredential={handleLink} />
      )}
      {error && <Alert severity="error">{LINK_ERRORS[error]}</Alert>}
      {error === 'NO_OTHER_LOGIN_METHOD' && (
        <Button variant="outlined" onClick={() => setForgotOpen(true)}>
          Задати пароль
        </Button>
      )}
      <ForgotPassword open={forgotOpen} handleClose={() => setForgotOpen(false)} />
    </ProfileCard>
  );
}
