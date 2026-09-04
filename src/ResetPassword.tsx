import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import {styled} from '@mui/material/styles';
import AppTheme from './theme/AppTheme';
import BrandPageLayout from './components/brand/BrandPageLayout';
import BrandFormCard from './components/brand/BrandFormCard';
import {useNavigate, useSearchParams} from 'react-router-dom';
import axios from './axios';

export default function ResetPassword(props: {disableCustomTheme?: boolean}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;

    if (!password || password.length < 6) {
      setPasswordError('Пароль має бути не менше 6 символів');
      return;
    }
    if (password !== confirm) {
      setPasswordError('Паролі не співпадають');
      return;
    }
    setPasswordError('');
    setError('');
    setLoading(true);

    try {
      await axios.post('/auth/reset-password', {token, password});
      setSuccess(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Помилка сервера');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AppTheme {...props}>
        <CssBaseline enableColorScheme/>
        <BrandPageLayout eyebrow="Відновлення паролю">
          <BrandFormCard title="Невірне посилання">
            <Alert severity="error">Невірне посилання для відновлення паролю.</Alert>
            <Button variant="contained" onClick={() => navigate('/login')}>На сторінку входу</Button>
          </BrandFormCard>
        </BrandPageLayout>
      </AppTheme>
    );
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme/>
      <BrandPageLayout
        eyebrow="Відновлення паролю"
        subtitle="Введіть новий пароль для вашого облікового запису."
      >
        <BrandFormCard title="Новий пароль">
          {success ? (
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
              <Alert severity="success">Пароль успішно змінено!</Alert>
              <Button variant="contained" fullWidth onClick={() => navigate('/login')}>
                Увійти
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{display: 'flex', flexDirection: 'column', width: '100%', gap: 2}}>
              <FormControl>
                <FormLabel htmlFor="password">Новий пароль</FormLabel>
                <TextField
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••"
                  required
                  fullWidth
                  variant="outlined"
                  error={!!passwordError}
                  helperText={passwordError}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="confirm">Підтвердити пароль</FormLabel>
                <TextField
                  id="confirm"
                  name="confirm"
                  type="password"
                  placeholder="••••••"
                  required
                  fullWidth
                  variant="outlined"
                />
              </FormControl>
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" fullWidth variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20}/> : 'Зберегти пароль'}
              </Button>
            </Box>
          )}
        </BrandFormCard>
      </BrandPageLayout>
    </AppTheme>
  );
}
