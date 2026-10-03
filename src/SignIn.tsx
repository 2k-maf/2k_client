import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';
import GoogleButton, { googleEnabled } from './components/GoogleButton';
import AppTheme from './theme/AppTheme';
import BrandPageLayout from './components/brand/BrandPageLayout';
import BrandFormCard from './components/brand/BrandFormCard';
import { brandColors, fg } from './theme/brand';
import axios from './axios';
import { normalizeAuthEmail } from './utils/email';
import { useAuth } from './AuthProvider';

/** Текст, коли старий дубль: один логін належить і гравцю, і клубу. */
const ACCOUNT_CONFLICT_MESSAGE =
  'Ця адреса належить двом обліковим записам: гравця і клубу. Зверніться до адміністратора.';

/** Чи відповів сервер 409 ACCOUNT_CONFLICT. */
function isAccountConflict(e: any): boolean {
  return e?.response?.status === 409 && e?.response?.data?.code === 'ACCOUNT_CONFLICT';
}

export default function SignIn(props: { disableCustomTheme?: boolean }) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  // Код GOOGLE_NOT_LINKED або готовий текст помилки входу через Google.
  const [googleError, setGoogleError] = React.useState('');
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    // Тип акаунта (гравець чи клуб) сервер визначає сам за email.
    await axios.post('/auth/login', {
      email: normalizeAuthEmail(email.value),
      password: password.value,
    }).then(({ data }) => {
      const token = data?.token;
      token && setToken(token)
      navigate('/')
    }).catch((e) => {
      console.error(e);
      alert(isAccountConflict(e) ? ACCOUNT_CONFLICT_MESSAGE : 'Некоректний логін або пароль');
    });
  };

  const handleGoogleCredential = async (credential: string) => {
    setGoogleError('');
    try {
      // 401 тут означає, що сервер не прийняв credential Google, а не завершену сесію.
      const { data } = await axios.post(
        '/auth/google',
        { credential },
        { skipAuthRedirect: true },
      );
      const token = data?.token;
      token && setToken(token)
      navigate('/')
    } catch (e: any) {
      console.error(e);
      const status = e?.response?.status;
      if (status === 404 && e?.response?.data?.code === 'GOOGLE_NOT_LINKED') {
        setGoogleError('GOOGLE_NOT_LINKED');
      } else if (isAccountConflict(e)) {
        setGoogleError(ACCOUNT_CONFLICT_MESSAGE);
      } else if (status === 401) {
        setGoogleError('Сервер не прийняв підтвердження Google. Натисніть кнопку Google ще раз.');
      } else {
        setGoogleError('Не вдалося увійти через Google. Спробуйте пізніше.');
      }
    }
  };

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    const emailNorm = normalizeAuthEmail(email.value);
    if (!emailNorm || !/\S+@\S+\.\S+/.test(emailNorm)) {
      setEmailError(true);
      setEmailErrorMessage('Введіть коректну електронну адресу');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <BrandPageLayout
        eyebrow="Вхід до клубу"
        subtitle="Рейтингова платформа інтелектуально-психологічної гри «Мафія»."
      >
        <BrandFormCard title="Увійти">
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2.25 }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Електронна адреса</FormLabel>
              <TextField
                error={emailError}
                helperText={emailErrorMessage}
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={emailError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Пароль</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={validateInputs}
              sx={{ py: 1.75, fontSize: 15 }}
            >
              Увійти
            </Button>
          </Box>
          {googleEnabled && (
            <>
              <Divider sx={{ fontSize: 13, color: fg(0.6) }}>або</Divider>
              <GoogleButton onCredential={handleGoogleCredential} />
              {googleError === 'GOOGLE_NOT_LINKED' ? (
                <Alert severity="warning">
                  Цей Google-акаунт не прив'язано до жодного облікового запису.
                  Увійдіть з паролем і прив'яжіть Google у кабінеті або зареєструйтеся{' '}
                  <Link component={RouterLink} to="/register" sx={{ fontWeight: 600 }}>
                    як гравець
                  </Link>
                  {' '}чи{' '}
                  <Link component={RouterLink} to="/register-club" sx={{ fontWeight: 600 }}>
                    як клуб
                  </Link>
                  .
                </Alert>
              ) : (
                googleError && <Alert severity="error">{googleError}</Alert>
              )}
            </>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              fontSize: 13,
              color: fg(0.6),
            }}
          >
            <Link
              component="button"
              type="button"
              onClick={handleClickOpen}
              sx={{ fontSize: 13, fontWeight: 600, color: brandColors.accentHover }}
            >
              Забули пароль?
            </Link>
            <Box component="span">
              Немає акаунта?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{ fontWeight: 600, color: brandColors.text }}
              >
                Зареєструватися
              </Link>
            </Box>
          </Box>
        </BrandFormCard>
      </BrandPageLayout>
      <ForgotPassword open={open} handleClose={handleClose} />
    </AppTheme>
  );
}
