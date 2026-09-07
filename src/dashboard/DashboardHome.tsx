import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import AddchartIcon from '@mui/icons-material/Addchart';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import { useNavigate } from 'react-router-dom';
import AppTheme from '../theme/AppTheme';
import ProfilePage from '../components/brand/ProfilePage';
import ProfileCard, { ProfileCardGrid } from '../components/brand/ProfileCard';
import { useAuth } from '../AuthProvider';
import axios from '../axios';
import { invalidateClubRatingCache } from '../utils/clubRatingCache';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { brandColors } from '../theme/brand';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

type Club = { _id: string; name: string };

export default function DashboardHome(props: { disableCustomTheme?: boolean }) {
  const { user, setToken } = useAuth();
  const navigate = useNavigate();
  const isClub = user?.authType === 'Клуб';

  const [clubs, setClubs] = useState<Club[]>([]);
  // Порожній рядок, а не null — інакше Select стартує неконтрольованим і React лається.
  const [clubSelectId, setClubSelectId] = useState('');
  const [periodName, setPeriodName] = useState('');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/clubs');
        const items: Club[] = data.items || [];
        setClubs(items);
        setClubSelectId(items[0]?._id || '');
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, []);

  const handleJoinClub = async () => {
    if (!clubSelectId) return;
    try {
      await axios.post('/club/join', { clubId: clubSelectId });
      alert('Ви успішно додані до клубу');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Помилка при додаванні до клубу');
    }
  };

  const handleCreateRatingPeriod = async () => {
    if (!periodName.trim()) {
      alert('Необхідно вказати назву рейтингового періоду');
      return;
    }
    try {
      await axios.post('/club/rating-period', { name: periodName.trim() });
      invalidateClubRatingCache();
      setPeriodName('');
      alert('Ви успішно створили рейтинговий період');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Помилка при створенні рейтингового періоду');
    }
  };

  const handleChangeNickname = async () => {
    if (!nickname.trim()) {
      alert('Необхідно вказати новий нікнейм');
      return;
    }
    try {
      const { data } = await axios.put('/user', { nickname: nickname.trim() });
      data?.token && setToken(data.token);
      invalidateClubRatingCache();
      setNickname('');
      alert('Оновлено');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Помилка при оновлені нікнейму');
    }
  };

  const handleUploadAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      alert('Файл занадто великий (макс. 2MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { data } = await axios.post('/user/avatar', { image: reader.result });
        data?.token && setToken(data.token);
        invalidateClubRatingCache();
        alert(isClub ? 'Логотип клубу збережено' : 'Аватар оновлено');
      } catch (e: any) {
        alert(e?.response?.data?.error || 'Помилка при завантаженні');
      }
    };
    reader.readAsDataURL(file);
  };

  const avatarSrc = resolveMediaUrl(user?.avatarUrl);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ProfilePage title={isClub ? user?.name || 'Профіль клубу' : user?.nickname || 'Профіль'}>
        <ProfileCardGrid>
          <ProfileCard
            icon={<AccountBoxIcon />}
            label="ПРОФІЛЬ"
            title={isClub ? 'Логотип клубу' : 'Аватар'}
            hint={
              isClub
                ? 'Зображення відображатиметься в інтерфейсі та на сторінках турнірів.'
                : 'JPG або PNG, до 2 МБ.'
            }
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {avatarSrc && (
                <Box
                  component="img"
                  src={avatarSrc}
                  alt=""
                  sx={{
                    width: 56,
                    height: 56,
                    flex: 'none',
                    borderRadius: isClub ? '10px' : '50%',
                    objectFit: 'cover',
                    border: `1px solid ${brandColors.border}`,
                  }}
                />
              )}
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                Завантажити
                <VisuallyHiddenInput
                  type="file"
                  accept=".jpg, .jpeg, .png"
                  onChange={handleUploadAvatar}
                />
              </Button>
            </Box>
          </ProfileCard>

          {isClub && (
            <ProfileCard
              icon={<EmojiEventsIcon />}
              label="ГРА"
              title="Нова гра"
              hint="Рейтингова гра клубу — результат потрапить у сезонний рейтинг."
            >
              <Button
                variant="contained"
                endIcon={<ChevronRightRoundedIcon />}
                onClick={() => navigate('/new-game-rating')}
              >
                Почати
              </Button>
            </ProfileCard>
          )}

          {isClub && (
            <ProfileCard
              icon={<AddchartIcon />}
              label="СЕЗОН"
              title="Рейтинговий період"
              hint="Новий період стає активним; попередні бали в нього не переносяться."
            >
              <TextField
                fullWidth
                label="Назва періоду"
                placeholder="Сезон Зима 2025"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
              />
              <Button
                variant="contained"
                endIcon={<ChevronRightRoundedIcon />}
                onClick={handleCreateRatingPeriod}
              >
                Створити
              </Button>
            </ProfileCard>
          )}

          {!isClub && (
            <ProfileCard
              icon={<Diversity3Icon />}
              label="КЛУБ"
              title="Стати учасником"
              hint="Після приєднання ваші ігри рахуються в рейтингу цього клубу."
            >
              <Select
                value={clubSelectId}
                onChange={(e: SelectChangeEvent) => setClubSelectId(e.target.value)}
                displayEmpty
                fullWidth
                inputProps={{ 'aria-label': 'Оберіть клуб' }}
              >
                <MenuItem value="" disabled>
                  Оберіть клуб
                </MenuItem>
                {clubs.map((club) => (
                  <MenuItem key={club._id} value={club._id}>
                    {club.name}
                  </MenuItem>
                ))}
              </Select>
              <Button
                variant="contained"
                endIcon={<ChevronRightRoundedIcon />}
                disabled={!clubSelectId}
                onClick={handleJoinClub}
              >
                Приєднатися
              </Button>
            </ProfileCard>
          )}

          <ProfileCard
            icon={<FormatPaintIcon />}
            label="АКАУНТ"
            title="Змінити нікнейм"
            hint="Нікнейм видно в рейтингу, протоколах ігор і на сторінках турнірів."
          >
            <TextField
              fullWidth
              label="Новий нікнейм"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Button
              variant="contained"
              endIcon={<ChevronRightRoundedIcon />}
              onClick={handleChangeNickname}
            >
              Змінити
            </Button>
          </ProfileCard>
        </ProfileCardGrid>
      </ProfilePage>
    </AppTheme>
  );
}
