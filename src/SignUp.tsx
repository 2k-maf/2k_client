import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import BrandPageLayout from './components/brand/BrandPageLayout';
import BrandFormCard from './components/brand/BrandFormCard';
import { brandColors, fg } from './theme/brand';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import axios from "./axios";
import { useAuth } from './AuthProvider';
import GoogleSignUpBlock, { GoogleSignUpData, signUpErrorMessage } from './components/GoogleSignUp';
import {useEffect} from "react";
import InputLabel from "@mui/material/InputLabel";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export default function SignUp(props: { disableCustomTheme?: boolean }) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [nickNameError, setNickNameError] = React.useState(false);
  const [nickNameErrorMessage, setNickNameErrorMessage] = React.useState('');
  const [clubSelectId, setClubSelectId] = React.useState(null);
  const [clubs, setClubs] = React.useState([]);
  const [google, setGoogle] = React.useState<GoogleSignUpData | null>(null);
  const [submitError, setSubmitError] = React.useState('');
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const handleGoogle = (value: GoogleSignUpData | null) => {
    setGoogle(value);
    setSubmitError('');
    // Поля форми некеровані, тому ім'я з Google підставляємо прямо в DOM.
    const name = document.getElementById('name') as HTMLInputElement | null;
    if (value && name && !name.value) name.value = value.name;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/clubs');
        const array = (data.items || []).map((item: any, i: number) => {
          return { ...item, id: i + 1 };
        })
        setClubs(array || []);
        setClubSelectId(array[0]?._id || null);
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, [])

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;
    const name = document.getElementById('name') as HTMLInputElement;
    const nickname = document.getElementById('nickname') as HTMLInputElement;

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
      setNameErrorMessage("Потрібно вказати ім'я" );
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!nickname.value || nickname.value.length < 1) {
      setNickNameError(true);
      setNickNameErrorMessage('Без нікнейму в "мафії" - нікуди');
      isValid = false;
    } else {
      setNickNameError(false);
      setNickNameErrorMessage('');
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
    const nickname = document.getElementById('nickname') as HTMLInputElement;
    const body = google
      ? {
          name: name.value,
          nickname: nickname.value,
          clubs: [clubSelectId],
          googleCredential: google.credential,
          ...(password.value ? { password: password.value } : {}),
        }
      : {
          name: name.value,
          nickname: nickname.value,
          email: email.value,
          password: password.value,
          clubs: [clubSelectId],
        };
    setSubmitError('');
    try {
      // 401 тут означає застарілий credential Google, а не сесію.
      const { data } = await axios.post('/user', body, { skipAuthRedirect: true });
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
      <BrandPageLayout
        eyebrow="Реєстрація"
        subtitle="Рейтингова платформа інтелектуально-психологічної гри «Мафія»."
      >
        <BrandFormCard title="Зареєструватися">
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <GoogleSignUpBlock value={google} onChange={handleGoogle} />
            <FormControl>
              <FormLabel htmlFor="nickname">Ігровий нік</FormLabel>
              <TextField
                autoComplete="nickname"
                name="nickname"
                required
                fullWidth
                id="nickname"
                placeholder="Jon Snow"
                error={nickNameError}
                helperText={nickNameErrorMessage}
                color={nickNameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="name">Імя</FormLabel>
              <TextField
                autoComplete="name"
                name="name"
                required
                fullWidth
                id="name"
                placeholder="Іван Шевченко"
                error={nameError}
                helperText={nameErrorMessage}
                color={nameError ? 'error' : 'primary'}
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
            <FormControl>
              <FormLabel id="club-name-label">Клуб</FormLabel>
              <Select
                labelId="club-name-label"
                id="club-name"
                value={clubSelectId}
                sx={{ mb: 3, width: '100%' }}
                onChange={(e: SelectChangeEvent<any>) => setClubSelectId(e.target.value)}
              >
                { clubs?.map((c: { name: string, _id: string }) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem> )}
                {/*<MenuItem value={'users'}>Гравець</MenuItem>*/}
                {/*<MenuItem value={'clubs'}>Клуб</MenuItem>*/}
              </Select>
            </FormControl>
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
          <Box
            component="span"
            sx={{ fontSize: 13, color: fg(0.6), textAlign: 'center' }}
          >
            Вже маєте акаунт?{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{ fontWeight: 600, color: brandColors.accentHover }}
            >
              Увійти
            </Link>
          </Box>
        </BrandFormCard>
      </BrandPageLayout>
    </AppTheme>
  );
}
