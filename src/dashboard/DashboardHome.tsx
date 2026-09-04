import * as React from 'react';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import type {} from '@mui/x-charts/themeAugmentation';
import type {} from '@mui/x-data-grid-pro/themeAugmentation';
import type {} from '@mui/x-tree-view/themeAugmentation';
import {alpha, styled, useTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppNavbar from '../components/dashboard/AppNavbar';
import Header from '../components/dashboard/Header';
import MainGrid from '../components/dashboard/MainGrid';
import SideMenu from '../components/dashboard/SideMenu';
import AppTheme from '../theme/AppTheme';
import {chartsCustomizations} from "../theme/customizations/charts";
import {dataGridCustomizations} from "../theme/customizations/dataGrid";
import {datePickersCustomizations} from "../theme/customizations/datePickers";
import {treeViewCustomizations} from "../theme/customizations/treeView";
import AppAppBar from "../components/AppAppBar";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";
import StatCard, {StatCardProps} from "../components/dashboard/StatCard";
import HighlightedCard from "../components/dashboard/HighlightedCard";
import SessionsChart from "../components/dashboard/SessionsChart";
import PageViewsBarChart from "../components/dashboard/PageViewsBarChart";
import CustomizedDataGrid from "../components/dashboard/CustomizedDataGrid";
import CustomizedTreeView from "../components/dashboard/CustomizedTreeView";
import ChartUserByCountry from "../components/dashboard/ChartUserByCountry";
import {Copyright} from "../components/Footer";
import CardContent from "@mui/material/CardContent";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import FormatPaintIcon from "@mui/icons-material/FormatPaint";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { invalidateClubRatingCache } from "../utils/clubRatingCache";
import Button from "@mui/material/Button";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Card from "@mui/material/Card";
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuItem from "@mui/material/MenuItem";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import {useEffect} from "react";
import axios from "../axios";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import {useAuth} from "../AuthProvider";
import TextField from "@mui/material/TextField";
import {useNavigate} from "react-router-dom";
import { resolveMediaUrl } from '../utils/mediaUrl';


const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

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
export default function DashboardHome(props: { disableCustomTheme?: boolean }) {
  const { user, setToken } = useAuth();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [clubs, setClubs] = React.useState([]);
  const [clubSelectId, setClubSelectId] = React.useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/clubs');
        const array = (data.items || []).map((item: any, i: number) => {
          return { ...item, id: i + 1 };
        })
        setClubs(array || []);
        setClubSelectId(array[0]?._id);
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, [])

  const handleJoinClub = async () => {
    try {
      if (!clubSelectId) return;
      await axios.post('/club/join', {
        clubId: clubSelectId,
      });
      setClubSelectId(null)
      alert('Ви успішно додані до клубу');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      alert(msg || 'Помилка при додаванні до клубу');
    }
  }

  const handleCreateRatingPeriod = async () => {
    try {
      const name = document.getElementById('rank-period') as HTMLInputElement;
      if (!name?.value) {
        alert('Необхідно вказати назву рейтингового періоду');
        return;
      }
      await axios.post('/club/rating-period', {
        name: name.value,
      });
      invalidateClubRatingCache();
      setClubSelectId(null)
      alert('Ви успішно створили рейтинговий період');
      name.value = '';
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      alert(msg || 'Помилка при створенні рейтингового періоду');
    }
  }

  const handleChangeNickname = async () => {
    try {
      const nickname = document.getElementById('nickname') as HTMLInputElement;
      if (!nickname?.value) {
        alert('Необхідно вказати новий нікнейм');
        return;
      }
      const { data } = await axios.put('/user', {
        nickname: nickname.value,
      });
      const token = data?.token;
      console.log(`--->`, token, 'DashboardHome.tsx:137')
      token && setToken(token)
      invalidateClubRatingCache();
      alert('Оновлено');
      nickname.value = '';
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      alert(msg || 'Помилка при оновлені нікнейму');
    }
  }

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Файл занадто великий (макс. 2MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { data } = await axios.post('/user/avatar', { image: reader.result });
        data?.token && setToken(data.token);
        invalidateClubRatingCache();
        alert(user?.authType === 'Клуб' ? 'Логотип клубу збережено' : 'Аватар оновлено');
      } catch (e: any) {
        alert(e?.response?.data?.error || 'Помилка при завантаженні');
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      {/*<AppAppBar />*/}
      <Box sx={{ display: 'flex' }}>
        <SideMenu />
        <AppNavbar />
        {/* Main content */}

        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            {/*<Header />*/}
            <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
              {/* cards */}
              {/*<Typography component="h2" variant="h6" sx={{ mb: 2 }}>*/}
              {/*  Overview*/}
              {/*</Typography>*/}
              <Grid
                container
                spacing={2}
                columns={12}
                sx={{ mt: '2rem', mb: (theme) => theme.spacing(2) }}
              >
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack direction={'row'} spacing={1} alignItems="center">
                        <AccountBoxIcon />
                        <InputLabel>
                          {user?.authType === 'Клуб' ? 'Логотип клубу' : 'Встановити аватар'}
                        </InputLabel>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {user?.authType === 'Клуб'
                          ? 'Зображення збережеться в профілі клубу й відображатиметься в інтерфейсі.'
                          : 'JPG або PNG, до 2 МБ.'}
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                        <img
                          src={resolveMediaUrl(user?.avatarUrl) || ''}
                          alt=""
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: user?.authType === 'Клуб' ? 10 : '50%',
                            objectFit: 'cover',
                            display: resolveMediaUrl(user?.avatarUrl) ? 'block' : 'none',
                          }}
                        />
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                        >
                          Завантажити
                          <VisuallyHiddenInput
                            multiple={false}
                            accept=".jpg, .jpeg, .png"
                            type="file"
                            onChange={handleUploadAvatar}
                          />
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                { user?.authType === 'Клуб' && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Stack direction={'row'} spacing={1}>
                          <EmojiEventsIcon />
                          <InputLabel id="new-game">Нова гра</InputLabel>
                        </Stack>
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            endIcon={<ChevronRightRoundedIcon />}
                            fullWidth={isSmallScreen}
                            onClick={() => navigate('/new-game-rating')}
                          >
                            Почати
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                {/*{data.map((card, index) => (*/}
                {/*  <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>*/}
                {/*    <StatCard {...card} />*/}
                {/*  </Grid>*/}
                {/*))}*/}
                <Grid size={{ xs: 12, md: 4 }}>
                  { user?.authType === 'Учасник' && (
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Diversity3Icon />
                        {/*<Typography*/}
                        {/*  component="h2"*/}
                        {/*  variant="subtitle2"*/}
                        {/*  gutterBottom*/}
                        {/*  sx={{ fontWeight: '600' }}*/}
                        {/*>*/}
                        {/*  Стати учасником клубу*/}
                        {/*</Typography>*/}
                        {/*<Typography sx={{ color: 'text.secondary', mb: '8px' }}>*/}
                        {/*  Uncover performance and visitor insights with our data wizardry.*/}
                        {/*</Typography>*/}
                        <Box>
                          <InputLabel  id="club-name-label">Стати учасником клубу</InputLabel>
                          <Select
                            labelId="club-name-label"
                            id="club-name"
                            input={<OutlinedInput label="Оберіть клуб" />}
                            value={clubSelectId}
                            label="Club Select"
                            sx={{ mb: 3, width: '100%' }}
                            onChange={(e: SelectChangeEvent<any>) => setClubSelectId(e.target.value)}
                          >
                            { clubs?.map((c: { name: string, _id: string }) => <MenuItem value={c._id}>{c.name}</MenuItem> )}
                            {/*<MenuItem value={'users'}>Гравець</MenuItem>*/}
                            {/*<MenuItem value={'clubs'}>Клуб</MenuItem>*/}
                          </Select>
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            endIcon={<ChevronRightRoundedIcon />}
                            fullWidth={isSmallScreen}
                            onClick={handleJoinClub}
                          >
                            Приєднатися
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                  { user?.authType === 'Клуб' && (
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Stack direction={'row'} spacing={1}>
                          <EmojiEventsIcon />
                          <InputLabel id="rank-period-label">Створити рейтинговий період</InputLabel>
                        </Stack>
                        <Box sx={{ mt: 2 }}>
                          <TextField
                            autoComplete="rank-period"
                            name="rank-period"
                            required
                            fullWidth
                            id="rank-period"
                            placeholder="Сезон Зима 2025"
                            sx={{ mb: 3 }}
                          />
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            endIcon={<ChevronRightRoundedIcon />}
                            fullWidth={isSmallScreen}
                            onClick={handleCreateRatingPeriod}
                          >
                            Створити
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Grid>
                {/*<Grid size={{ xs: 12, md: 6 }}>*/}
                {/*  <SessionsChart />*/}
                {/*</Grid>*/}
                {/*<Grid size={{ xs: 12, md: 6 }}>*/}
                {/*  <PageViewsBarChart />*/}
                {/*</Grid>*/}
              </Grid>
              <Grid
                container
                spacing={2}
                columns={12}
                sx={{ mt: '2rem', mb: (theme) => theme.spacing(2) }}
              >
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack direction={'row'} spacing={1}>
                        <FormatPaintIcon />
                        <InputLabel id="nickname-label">Змінити нікнейм</InputLabel>
                      </Stack>
                      <Box sx={{ mt: 2 }}>
                        <TextField
                          autoComplete="nickname"
                          name="nickname"
                          required
                          fullWidth
                          id="nickname"
                          placeholder="Новий нікнейм"
                          sx={{ mb: 3 }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          endIcon={<ChevronRightRoundedIcon />}
                          fullWidth={isSmallScreen}
                          onClick={handleChangeNickname}
                        >
                          Змінити
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Copyright/>
            </Box>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
