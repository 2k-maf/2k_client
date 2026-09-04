import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';
import AppTheme from './theme/AppTheme';
import BrandPageLayout from './components/brand/BrandPageLayout';
import BrandFormCard from './components/brand/BrandFormCard';
import { brandColors } from './theme/brand';
import axios from './axios';
import { normalizeAuthEmail } from './utils/email';
import { useAuth } from './AuthProvider';

export default function SignIn(props: { disableCustomTheme?: boolean }) {
  const [authType, setAuthType] = React.useState('users');
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
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

    await axios.post('/auth/login', {
      email: normalizeAuthEmail(email.value),
      password: password.value,
      authType,
    }).then(({ data }) => {
      const token = data?.token;
      token && setToken(token)
      navigate('/')
    }).catch((e) => {
      console.error(e);
      alert('Некоректний логін або пароль');
    });
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
            <FormControl>
              <FormLabel id="auth-type-label">Тип облікового запису</FormLabel>
              <Select
                labelId="auth-type-label"
                id="auth-type"
                value={authType}
                label="Auth Type"
                onChange={(e) => setAuthType(e.target.value)}
              >
                <MenuItem value={'users'}>Гравець</MenuItem>
                <MenuItem value={'clubs'}>Клуб</MenuItem>
              </Select>
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              fontSize: 13,
              color: 'rgba(242,243,247,0.6)',
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
