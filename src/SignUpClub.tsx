import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import axios from './axios';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from './theme/AppTheme';
import { GoogleIcon, FacebookIcon } from './components/CustomIcons';
import SitemarkIcon from "./components/SitemarkIcon";
import { brandColors, withAlpha } from "./theme/brand";
import Alert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import GoogleSignUpBlock, { GoogleSignUpData, signUpErrorMessage } from './components/GoogleSignUp';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(20, 30%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        `radial-gradient(ellipse 80% 60% at 50% -10%, ${withAlpha(brandColors.accent, 0.1)}, ${brandColors.bg})`,
    }),
  },
}));

export default function SignUpClub(props: { disableCustomTheme?: boolean }) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [contactError, setContactError] = React.useState(false);
  const [contactErrorMessage, setContactErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [nickNameError, setNickNameError] = React.useState(false);
  const [nickNameErrorMessage, setNickNameErrorMessage] = React.useState('');
  const [addressError, setAddressError] = React.useState(false);
  const [addressErrorMessage, setAddressErrorMessage] = React.useState('');
  const [google, setGoogle] = React.useState<GoogleSignUpData | null>(null);
  const [submitError, setSubmitError] = React.useState('');
  const { setToken } = useAuth();
  const navigate = useNavigate();

  // Ім'я з Google — це ім'я людини, а не назва клубу, тому у форму його не підставляємо.
  const handleGoogle = (value: GoogleSignUpData | null) => {
    setGoogle(value);
    setSubmitError('');
  };

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;
    const name = document.getElementById('name') as HTMLInputElement;
    const contact = document.getElementById('contact') as HTMLInputElement;
    const nickname = document.getElementById('nickname') as HTMLInputElement;
    const address = document.getElementById('address') as HTMLInputElement;

    let isValid = true;

    // Адресу для реєстрації через Google бере сервер з credential.
    if (!google && (!email.value || !/\S+@\S+\.\S+/.test(email.value))) {
      setEmailError(true);
      setEmailErrorMessage('Введіть коректну електронну адресу');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!contact.value || contact.value.length < 1) {
      setContactError(true);
      setContactErrorMessage("Потрібно вказати контактні дані з керівництвом клубу" );
      isValid = false;
    } else {
      setContactError(false);
      setContactErrorMessage('');
    }

    // З Google пароль необов'язковий, але введений перевіряємо так само.
    if ((!google || password.value) && password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Пароль повинен бути більше 6ти символів');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!name.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage("Потрібно вказати назву клуба" );
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!nickname.value || nickname.value.length < 1) {
      setNickNameError(true);
      setNickNameErrorMessage('Потрібно вказати логін');
      isValid = false;
    } else {
      setNickNameError(false);
      setNickNameErrorMessage('');
    }

    if (!address.value || address.value.length < 1) {
      setAddressError(true);
      setAddressErrorMessage('Потрібно вказати логін');
      isValid = false;
    } else {
      setAddressError(false);
      setAddressErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Перевіряємо поля напряму: стан помилок з onClick може бути ще не застосований.
    if (!validateInputs()) {
      return;
    }
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;
    const name = document.getElementById('name') as HTMLInputElement;
    const contact = document.getElementById('contact') as HTMLInputElement;
    const nickname = document.getElementById('nickname') as HTMLInputElement;
    const address = document.getElementById('address') as HTMLInputElement;
    const fields = {
      name: name.value,
      nickname: nickname.value,
      address: address.value,
      contact: contact.value,
    };
    const body = google
      ? {
          ...fields,
          googleCredential: google.credential,
          ...(password.value ? { password: password.value } : {}),
        }
      : { ...fields, email: email.value, password: password.value };
    setSubmitError('');
    try {
      // 401 тут означає застарілий credential Google, а не сесію.
      const { data } = await axios.post('/club', body, { skipAuthRedirect: true });
      // Реєстрація через Google одразу повертає токен і входить в акаунт.
      if (data?.token) {
        setToken(data.token);
        navigate('/profile');
        return;
      }
      document.location.href = '/login';
    } catch (e: any) {
      console.error(e);
      setSubmitError(signUpErrorMessage(e, Boolean(google)));
      if (google && e?.response?.status === 401) setGoogle(null);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Button
          href={'/'}
          variant="outlined"
          color="primary"
          size="small"
          // sx={{minWidth: 'fit-content'}}
          sx={{ position: 'fixed', top: '1rem', left: '1rem' }}
        >
          Головна
        </Button>
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(1.5rem, 10vw, 2rem)' }}
          >
            <SitemarkIcon />&nbsp;&nbsp;Зареєструвати клуб
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <GoogleSignUpBlock value={google} onChange={handleGoogle} />
            <FormControl>
              <FormLabel htmlFor="name">Назва клубу</FormLabel>
              <TextField
                autoComplete="name"
                name="name"
                required
                fullWidth
                id="name"
                placeholder="9 or 10 Vancouver Mafia Club"
                error={nameError}
                helperText={nameErrorMessage}
                color={nameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="nickname">Логін (буде використовуватись для авторизації)</FormLabel>
              <TextField
                autoComplete="nickname"
                name="nickname"
                required
                fullWidth
                id="nickname"
                placeholder="9or10van"
                error={nickNameError}
                helperText={nickNameErrorMessage}
                color={nickNameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="email">Електронна адреса</FormLabel>
              {google ? (
                <TextField
                  key="google-email"
                  fullWidth
                  id="email"
                  name="email"
                  value={google.email}
                  helperText="Адреса з Google"
                  slotProps={{ input: { readOnly: true } }}
                />
              ) : (
                <TextField
                  key="email"
                  required
                  fullWidth
                  id="email"
                  placeholder="your@email.com"
                  name="email"
                  autoComplete="email"
                  variant="outlined"
                  error={emailError}
                  helperText={emailErrorMessage}
                  color={passwordError ? 'error' : 'primary'}
                />
              )}
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="contact">Контактні дані (у випадку надання некоректних контактних даних клуб може бути заблоковано без попередження)</FormLabel>
              <TextField
                required
                fullWidth
                id="contact"
                placeholder="telegram: +38(050)123-45-67, viber: +38(050)123-45-67"
                name="contact"
                autoComplete="contact"
                variant="outlined"
                error={contactError}
                helperText={contactErrorMessage}
                color={contactError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="address">Адреса</FormLabel>
              <TextField
                required
                fullWidth
                id="address"
                placeholder="Канада. м.Ванкувер"
                name="address"
                autoComplete="address"
                variant="outlined"
                error={contactError}
                helperText={contactErrorMessage}
                color={contactError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">{google ? "Пароль (необов'язково)" : 'Пароль'}</FormLabel>
              <TextField
                required={!google}
                fullWidth
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="new-password"
                variant="outlined"
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>

            {/*<FormControlLabel*/}
            {/*  control={<Checkbox value="allowExtraEmails" color="primary" />}*/}
            {/*  label="I want to receive updates via email."*/}
            {/*/>*/}
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={validateInputs}
            >
              Зареєструвати
            </Button>
          </Box>
          {/*<Divider>*/}
          {/*  <Typography sx={{ color: 'text.secondary' }}>or</Typography>*/}
          {/*</Divider>*/}
          {/*<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>*/}
          {/*  <Button*/}
          {/*    fullWidth*/}
          {/*    variant="outlined"*/}
          {/*    onClick={() => alert('Sign up with Google')}*/}
          {/*    startIcon={<GoogleIcon />}*/}
          {/*  >*/}
          {/*    Sign up with Google*/}
          {/*  </Button>*/}
          {/*  <Button*/}
          {/*    fullWidth*/}
          {/*    variant="outlined"*/}
          {/*    onClick={() => alert('Sign up with Facebook')}*/}
          {/*    startIcon={<FacebookIcon />}*/}
          {/*  >*/}
          {/*    Sign up with Facebook*/}
          {/*  </Button>*/}
          {/*  <Typography sx={{ textAlign: 'center' }}>*/}
          {/*    Already have an account?{' '}*/}
          {/*    <Link*/}
          {/*      href="/material-ui/getting-started/templates/sign-in/"*/}
          {/*      variant="body2"*/}
          {/*      sx={{ alignSelf: 'center' }}*/}
          {/*    >*/}
          {/*      Sign in*/}
          {/*    </Link>*/}
          {/*  </Typography>*/}
          {/*</Box>*/}
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
