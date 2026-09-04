import * as React from 'react';
import {styled, alpha, keyframes} from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import StarIcon from '@mui/icons-material/Star';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Avatar from '@mui/material/Avatar';
import ColorModeIconDropdown from '../theme/ColorModeIconDropdown';
import Sitemark from './SitemarkIcon';
import UpcomingTournamentBanner from './UpcomingTournamentBanner';
import { OutlinedActionIconButton } from './OutlinedActionIconButton';
import {useAuth} from "../AuthProvider";
import {useNavigate, useLocation, Link as RouterLink} from "react-router-dom";
import axios from "../axios";
import { brand } from '../theme/themePrimitives';
import { brandColors, brandFonts } from '../theme/brand';
import Typography from "@mui/material/Typography";
import {useEffect, useMemo} from "react";

/** Світла смуга хедера з макета: пісочне тло, чорнильний текст. */
const StyledToolbar = styled(Toolbar)(({theme}) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  minHeight: 'auto',
  backgroundColor: 'transparent',
  color: brandColors.ink,
  padding: '8px 0',
  // Лише текстові/контурні кнопки — червона CTA має власні кольори.
  '& .MuiButton-text, & .MuiButton-outlined': {
    color: brandColors.ink,
    fontWeight: 600,
    '&:hover': { color: brandColors.accent, backgroundColor: 'transparent' },
  },
  '& .MuiButton-outlined': {
    borderColor: alpha(brandColors.ink, 0.25),
  },
  '& .MuiIconButton-root': { color: brandColors.ink },
}));

let stopWatchInterval: NodeJS.Timeout;
let stopWatchStart = false;

const liveDotPulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.88); }
`;

/** У селекторі «Інше»: Учасники, $$$, Події (Правила — окремо в хедері) */
const EXTRA_NAV_ITEMS: { label: string; path: string; isActive: (pathname: string) => boolean }[] = [
  { label: 'Учасники', path: '/members', isActive: (p) => p.includes('members') },
  { label: '$$$', path: '/$', isActive: (p) => p.includes('$') },
  { label: 'Події', path: '/calendar', isActive: (p) => p.includes('calendar') },
];

/** Збігаються з `BudgetRedirect` / `CalendarRedirect` */
const BUDGET_SHEET_EXTERNAL_URL =
  'https://docs.google.com/spreadsheets/d/1Rmp0EHC4pm5u8frgDozMUt7s3XSLwUTJyH2Okys4aqs/';
const EVENTS_SITE_EXTERNAL_URL = 'https://sites.google.com/view/9or10mafia/home';

/** Спільний вигляд випадаючих меню в хедері (як «Рейтингова / Фанова») */
function appBarNavMenuPaperSx(theme: Theme) {
  return {
    mt: 1,
    borderRadius: 2,
    minWidth: 168,
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    boxShadow: theme.shadows[10],
    bgcolor: 'background.paper',
    '& .MuiMenuItem-root': {
      py: 1.35,
      px: 2,
      typography: 'body2',
    },
  };
}

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);
  const [gameMenuAnchor, setGameMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [extraNavMenuAnchor, setExtraNavMenuAnchor] = React.useState<null | HTMLElement>(null);
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [stopWatch, setStopWatch] = React.useState(60);
  const [liveTournament, setLiveTournament] = React.useState<{ id: string; name: string } | null>(null);
  // const [stopWatchStart, setStopWatchStart] = React.useState(false);
  // const [stopWatchInterval, setStopWatchInterval] = React.useState(null as NodeJS.Timeout | null);

  const stopWatchFmt= useMemo(() => {
    const minutes = Math.floor((stopWatch % 3600) / 61);
    const seconds = Math.floor(stopWatch % 61);
    return seconds.toString().padStart(2, '0');
  }, [stopWatch]);

  useEffect(() => {
    stopWatchInterval = setInterval(() => {
      if (!stopWatchStart) return;
      setStopWatch((prev) => Math.max(prev - 1, 0))
    }, 1000);
    return () => clearInterval(stopWatchInterval);
  }, []);

  const fetchLiveTournament = React.useCallback(async () => {
    if (!user || typeof localStorage === 'undefined' || !localStorage.getItem('jwt_token')) {
      setLiveTournament(null);
      return;
    }
    try {
      const { data } = await axios.get<{ items: { id: string; name: string; status: string }[] }>('/tournaments');
      const items = data.items || [];
      const live = items.find((t) => t.status === 'in_progress');
      setLiveTournament(live ? { id: live.id, name: live.name } : null);
    } catch {
      setLiveTournament(null);
    }
  }, [user]);

  useEffect(() => {
    void fetchLiveTournament();
  }, [fetchLiveTournament]);

  useEffect(() => {
    if (!user) return;
    const t = window.setInterval(() => fetchLiveTournament(), 90_000);
    return () => window.clearInterval(t);
  }, [user, fetchLiveTournament]);

  const startStopWatch = () => {
    setStopWatch(60);
    stopWatchStart = true;
  }

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const navigateWithConfirm = (path: string)=>  {
    if (path === '/new-game-rating' && window.location.pathname.endsWith('new-game-rating')) {
      if (!confirm("Ви починаєте нову гру. Дані діючої рейтингової гри не будуть збережені.")) return;
      localStorage.removeItem('ratingGameState');
      window.location.reload();
      return;
    }
    navigate(path);
  }

  function openExtraNavPath(path: string, closeUi?: () => void) {
    const done = () => closeUi?.();
    if (path === '/$') {
      window.open(BUDGET_SHEET_EXTERNAL_URL, '_blank', 'noopener,noreferrer');
      done();
      return;
    }
    if (path === '/calendar') {
      window.open(EVENTS_SITE_EXTERNAL_URL, '_blank', 'noopener,noreferrer');
      done();
      return;
    }
    navigateWithConfirm(path);
    done();
  }

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: brandColors.band,
        backgroundImage: 'none',
        color: brandColors.ink,
        mt: 'var(--template-frame-height, 0px)',
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
        <StyledToolbar variant="dense" disableGutters>
          <Box sx={{flexGrow: 1, display: 'flex', alignItems: 'center', px: 0, gap: 3}}>
            <Sitemark variant="navy" size={30}/>
            <Box sx={{display: 'none', '@media (min-width: 940px)': {display: 'flex'}, gap: 0.5, overflow: 'hidden', '& .MuiButton-root': {whiteSpace: 'nowrap', minWidth: 'auto', flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}}>
              <Button startIcon={<StarIcon/>} variant="text"
                      onClick={() => navigateWithConfirm('/clubs-rating')}
                      size="small" color="secondary">
                Рейтинг клубу
              </Button>
              {user?.authType === 'Клуб' ? <>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                  <Button
                    variant={window.location.pathname.includes('new-game') ? 'outlined' : 'text'}
                    onClick={() => navigateWithConfirm('/new-game-rating')}
                    size="small"
                    sx={{borderTopRightRadius: 0, borderBottomRightRadius: 0, pr: 1}}>
                    {window.location.pathname.endsWith('new-game-rating') ? 'Рейтингова гра' : window.location.pathname.endsWith('new-game') ? 'Фан гра' : 'Рейтингова гра'}
                  </Button>
                  <Button
                    variant={window.location.pathname.includes('new-game') ? 'outlined' : 'text'}
                    onClick={(e) => setGameMenuAnchor(e.currentTarget)}
                    size="small"
                    sx={{borderTopLeftRadius: 0, borderBottomLeftRadius: 0, minWidth: 'auto', px: 0.3}}>
                    <ArrowDropDownIcon sx={{fontSize: 20}}/>
                  </Button>
                </Box>
                <Menu
                  anchorEl={gameMenuAnchor}
                  open={Boolean(gameMenuAnchor)}
                  onClose={() => setGameMenuAnchor(null)}
                  PaperProps={{ sx: appBarNavMenuPaperSx }}
                >
                  <MenuItem onClick={() => { setGameMenuAnchor(null); navigateWithConfirm('/new-game-rating'); }}>Рейтингова</MenuItem>
                  <MenuItem onClick={() => { setGameMenuAnchor(null); navigateWithConfirm('/new-game'); }}>Фанова</MenuItem>
                </Menu>
              </> : <Button variant={window.location.pathname.endsWith('new-game') ? 'outlined' : 'text'}
                      onClick={() => navigateWithConfirm('/new-game')}
                      size="small">
                Фан гра
              </Button>}
              <Button onClick={() => navigateWithConfirm('/rules')} variant="text" size="small">
                Правила
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => openExtraNavPath(EXTRA_NAV_ITEMS[0].path)}
                  sx={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, pr: 1 }}
                >
                  Інше
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={(e) => setExtraNavMenuAnchor(e.currentTarget)}
                  aria-label="Меню: учасники, бюджет, події"
                  sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, minWidth: 'auto', px: 0.3 }}
                >
                  <ArrowDropDownIcon sx={{ fontSize: 20 }} />
                </Button>
              </Box>
              <Menu
                anchorEl={extraNavMenuAnchor}
                open={Boolean(extraNavMenuAnchor)}
                onClose={() => setExtraNavMenuAnchor(null)}
                PaperProps={{ sx: appBarNavMenuPaperSx }}
              >
                {EXTRA_NAV_ITEMS.map((item) => (
                  <MenuItem
                    key={item.path}
                    selected={item.isActive(pathname)}
                    onClick={() => openExtraNavPath(item.path, () => setExtraNavMenuAnchor(null))}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
              {liveTournament ? (
                <Button
                  component={RouterLink}
                  to={`/tournaments/${liveTournament.id}`}
                  size="small"
                  variant="outlined"
                  sx={(theme) => {
                    const isDark = theme.palette.mode === 'dark';
                    return {
                      ml: 0.5,
                      maxWidth: 220,
                      flexShrink: 0,
                      color: isDark ? brand[100] : brand[700],
                      borderColor: alpha(brand[300], isDark ? 0.45 : 0.55),
                      bgcolor: isDark ? alpha(brand[900], 0.5) : alpha(brand[100], 0.5),
                      '&:hover': {
                        borderColor: isDark ? brand[600] : brand[400],
                        bgcolor: isDark ? alpha(brand[900], 0.65) : alpha(brand[200], 0.7),
                        color: isDark ? brand[100] : brand[700],
                      },
                    };
                  }}
                  startIcon={
                    <Box
                      aria-hidden
                      sx={(theme) => {
                        const isDark = theme.palette.mode === 'dark';
                        const dot = isDark ? brand[300] : brand[500];
                        return {
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          bgcolor: dot,
                          boxShadow: `0 0 10px ${alpha(brand[400], isDark ? 0.55 : 0.45)}`,
                          animation: `${liveDotPulse} 1.15s ease-in-out infinite`,
                        };
                      }}
                    />
                  }
                >
                  <Typography component="span" variant="caption" noWrap sx={{ fontWeight: 700 }}>
                    {liveTournament.name}
                  </Typography>
                </Button>
              ) : null}
            </Box>
          </Box>
          {
            window.location.pathname.includes('new-game') &&
              <Typography color={stopWatch <= 0 ? 'error' :  stopWatch <= 10 ? 'warning': 'default' } onClick={startStopWatch} sx={{ mr: 3, cursor: 'pointer' }} variant='h2'>
                {stopWatchFmt}
              </Typography>
          }
          <Box
            sx={{
              display: 'none',
              '@media (min-width: 940px)': {display: 'flex'},
              gap: 1,
              alignItems: 'center',
            }}
          >
            {
              user && <Button onClick={() => navigateWithConfirm('/profile')} color="primary" variant="text" size="small" sx={{gap: 1, lineHeight: 1.2, py: 0.5, maxWidth: 180, overflow: 'hidden'}}>
                    {user.avatarUrl && <Avatar src={user.avatarUrl} sx={{width: 28, height: 28}}/>}
                    <Box sx={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                      Мій Профіль
                      <span style={{fontSize: '0.7em', opacity: 0.7, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>({user?.name})</span>
                    </Box>
                </Button>
            }
            {
              user && <Button onClick={() => {
                logout()
                navigateWithConfirm('/')
              }} color="primary" variant="text" size="small">
                    Вийти
                </Button>
            }
            {
              !user && <Button href="/login" color="primary" variant="text" size="small">
                    Увійти
                </Button>
            }
            {
              !user && <Button
                    href="/register"
                    variant="contained"
                    size="small"
                    sx={{ px: 2, borderRadius: '12px' }}
                >
                    Зареєструватися
                </Button>
            }
            {/*<ColorModeIconDropdown/>*/}
          </Box>
          <Box sx={{display: 'flex', '@media (min-width: 940px)': {display: 'none'}, gap: 1}}>
            {/*<ColorModeIconDropdown size="medium"/>*/}
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon/>
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: {
                  top: 'var(--template-frame-height, 0px)',
                },
              }}
            >
              <Box sx={{p: 2, backgroundColor: 'background.default'}}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <OutlinedActionIconButton aria-label="Закрити меню" onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </OutlinedActionIconButton>
                </Box>
                <MenuItem selected={window.location.pathname.endsWith('clubs-rating')}
                          onClick={() => navigateWithConfirm('/clubs-rating')}><StarIcon sx={{ mr: .5 }}/>Рейтинг клубу</MenuItem>
                {user?.authType === 'Клуб' ? <>
                  <MenuItem selected={window.location.pathname.endsWith('new-game-rating')}
                            onClick={() => { setOpen(false); navigateWithConfirm('/new-game-rating'); }}>Рейтингова гра</MenuItem>
                  <MenuItem selected={window.location.pathname.endsWith('new-game')}
                            onClick={() => { setOpen(false); navigateWithConfirm('/new-game'); }}>Фан гра</MenuItem>
                </> : <MenuItem selected={window.location.pathname.endsWith('new-game')}
                          onClick={() => { setOpen(false); navigateWithConfirm('/new-game'); }}>Фан гра</MenuItem>}
                <MenuItem
                  selected={window.location.pathname.includes('scoring')}
                  onClick={() => {
                    setOpen(false);
                    navigateWithConfirm('/rules');
                  }}
                >
                  Правила
                </MenuItem>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block', fontWeight: 700 }}
                >
                  Інше
                </Typography>
                {EXTRA_NAV_ITEMS.map((item) => (
                  <MenuItem
                    key={item.path}
                    selected={item.isActive(pathname)}
                    onClick={() => openExtraNavPath(item.path, () => setOpen(false))}
                    sx={{ pl: 3 }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
                {liveTournament ? (
                  <MenuItem
                    component={RouterLink}
                    to={`/tournaments/${liveTournament.id}`}
                    onClick={() => setOpen(false)}
                    sx={(theme) => {
                      const isDark = theme.palette.mode === 'dark';
                      return {
                        color: isDark ? brand[100] : brand[700],
                        fontWeight: 700,
                        bgcolor: isDark ? alpha(brand[900], 0.5) : alpha(brand[100], 0.5),
                        '&:hover': {
                          bgcolor: isDark ? alpha(brand[900], 0.65) : alpha(brand[200], 0.7),
                        },
                      };
                    }}
                  >
                    <Box
                      aria-hidden
                      sx={(theme) => {
                        const isDark = theme.palette.mode === 'dark';
                        const dot = isDark ? brand[300] : brand[500];
                        return {
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          bgcolor: dot,
                          boxShadow: `0 0 8px ${alpha(brand[400], isDark ? 0.55 : 0.45)}`,
                          mr: 1,
                          flexShrink: 0,
                          animation: `${liveDotPulse} 1.15s ease-in-out infinite`,
                        };
                      }}
                    />
                    <Typography component="span" variant="body2" noWrap sx={{ fontWeight: 700 }}>
                      {liveTournament.name}
                    </Typography>
                  </MenuItem>
                ) : null}
                <Divider sx={{my: 3}}/>
                {
                  !user && <>
                        <MenuItem>
                            <Button href="/register" color="primary" variant="outlined" fullWidth>
                                Зареєструватися
                            </Button>
                        </MenuItem>
                        <MenuItem>
                            <Button href="/login" color="primary" variant="outlined" fullWidth>
                                Увійти
                            </Button>
                        </MenuItem>
                    </>
                }
                {
                  user && <>
                        <MenuItem>
                            <Button href="/profile" color="primary" variant="outlined" fullWidth sx={{gap: 1, lineHeight: 1.2, py: 0.5}}>
                                {user.avatarUrl && <Avatar src={user.avatarUrl} sx={{width: 28, height: 28}}/>}
                                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                  Мій Профіль
                                  <span style={{fontSize: '0.7em', opacity: 0.7}}>({user?.name})</span>
                                </Box>
                            </Button>
                        </MenuItem>
                        <MenuItem>
                            <Button onClick={() => {
                                logout()
                              navigateWithConfirm('/')
                            }} color="primary" variant="outlined" fullWidth>
                                Вийти
                            </Button>
                        </MenuItem>
                    </>
                }
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
        {pathname === '/' ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', px: 0.5 }}>
            <UpcomingTournamentBanner />
          </Box>
        ) : null}
      </Container>
    </AppBar>
  );
}
