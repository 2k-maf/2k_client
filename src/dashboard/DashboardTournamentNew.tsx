import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppTheme from '../theme/AppTheme';
import ProfilePage from '../components/brand/ProfilePage';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import { useAuth } from '../AuthProvider';
import { DEFAULT_TOURNAMENT_YOUTUBE_URL } from '../constants/youtube';
import { brandColors } from '../theme/brand';

export default function DashboardTournamentNew(props: { disableCustomTheme?: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = React.useState('');
  const [numGames, setNumGames] = React.useState(3);
  const [scheduledDate, setScheduledDate] = React.useState('');
  const [publicDescription, setPublicDescription] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [hideHalf, setHideHalf] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (user?.authType !== 'Клуб') {
      navigate('/profile/tournaments', { replace: true });
    }
  }, [user, navigate]);

  const submit = async () => {
    if (!name.trim()) {
      alert('Вкажіть назву');
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.post('/club/tournament', {
        name: name.trim(),
        numGames: Number(numGames) || 1,
        scheduledDate: scheduledDate || null,
        publicDescription: publicDescription.trim(),
        youtubeUrl: youtubeUrl.trim(),
        participants: [],
        hideResultsAfterHalf: hideHalf,
      });
      const id = data.id;
      if (id) navigate(`/profile/tournaments/${id}`);
      else navigate('/profile/tournaments');
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.error || 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ProfilePage title="Новий турнір">
            <Box
              sx={{
                width: '100%',
                maxWidth: 520,
                p: { xs: 2.5, sm: 3 },
                background: brandColors.panel,
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '16px',
                boxSizing: 'border-box',
              }}
            >
              <Typography sx={{ mb: 2.5, fontSize: 15, color: 'rgba(242,243,247,0.6)' }}>
                Заповніть основні дані. Учасників можна додати пізніше на сторінці турніру.
              </Typography>
              <Stack
                component="form"
                spacing={0}
                sx={{ '& .MuiTextField-root': { mt: 0 } }}
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <TextField
                  label="Назва турніру"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: Boolean(name) }}
                />
                <TextField
                  label="Кількість ігор"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={numGames}
                  onChange={(e) => setNumGames(Number(e.target.value))}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Дата турніру"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  fullWidth
                  margin="normal"
                  helperText="Необовʼязково"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    'aria-label': 'Дата турніру',
                  }}
                />
                <TextField
                  label="Публічний опис"
                  value={publicDescription}
                  onChange={(e) => setPublicDescription(e.target.value)}
                  fullWidth
                  margin="normal"
                  multiline
                  minRows={3}
                  helperText="Показується на публічній сторінці турніру (посилання з головної)"
                  InputLabelProps={{ shrink: Boolean(publicDescription) }}
                />
                <TextField
                  label="Посилання на YouTube (необовʼязково)"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  fullWidth
                  margin="normal"
                  placeholder="https://www.youtube.com/@..."
                  helperText={`Якщо порожньо — на публічній сторінці кнопка веде на ${DEFAULT_TOURNAMENT_YOUTUBE_URL}`}
                  InputLabelProps={{ shrink: Boolean(youtubeUrl) }}
                />
                <FormControlLabel
                  sx={{
                    mt: 2,
                    mb: 0.5,
                    ml: 0,
                    mr: 0,
                    alignItems: 'flex-start',
                    gap: 1,
                    '& .MuiCheckbox-root': { pt: 0.25 },
                    '& .MuiFormControlLabel-label': {
                      typography: 'body2',
                      lineHeight: 1.45,
                    },
                  }}
                  control={
                    <Checkbox
                      checked={hideHalf}
                      onChange={(e) => setHideHalf(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Не показувати результати ігор після 50% турніру до його завершення"
                />
                <Stack
                  direction="row"
                  spacing={1.5}
                  flexWrap="wrap"
                  justifyContent="center"
                  sx={{ mt: 3, pt: 1 }}
                >
                  <Button type="submit" variant="contained" disabled={saving} sx={{ minWidth: 120 }}>
                    Створити
                  </Button>
                  <Button variant="outlined" type="button" onClick={() => navigate('/profile/tournaments')}>
                    Скасувати
                  </Button>
                </Stack>
              </Stack>
            </Box>
      </ProfilePage>
    </AppTheme>
  );
}
