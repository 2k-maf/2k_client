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
import RemoteAvatar from './brand/RemoteAvatar';
import ColorModeToggle from '../theme/ColorModeToggle';
import ObsMuteButton, { compactHeaderQuery } from '../stream/ObsMuteButton';
import Sitemark from './SitemarkIcon';
import { OutlinedActionIconButton } from './OutlinedActionIconButton';
import GoogleSignIn from './GoogleSignIn';
import { googleEnabled } from './GoogleButton';
import {useAuth} from "../AuthProvider";
import {useNavigate, useLocation, Link as RouterLink} from "react-router-dom";
import axios from "../axios";
import { brand } from '../theme/themePrimitives';
import { brandColors, brandFonts, withAlpha } from '../theme/brand';
import Typography from "@mui/material/Typography";
import useMediaQuery from '@mui/material/useMediaQuery';
import {useEffect} from "react";
import { confirmAction } from './feedback/feedback';

/** Кільце навколо аватара — інакше фото зливається зі смугою хедера. Літера-заглушка — кольору тексту смуги. */
const headerAvatarSx = {
  width: 28,
  height: 28,
  border: `1px solid ${brandColors.ink}`,
  bgcolor: brandColors.band,
  color: brandColors.ink,
  fontSize: 14,
  fontWeight: 700,
} as const;

/**
 * Висота світлої смуги. Фіксована, інакше секундомір «Фан гри» робить хедер
 * вищим, ніж на «Правилах» чи «Учасниках», і шапка скаче між вкладками.
 */
const HEADER_HEIGHT = 60;

/** Контрастна смуга хедера: пісочна в темній схемі, чорнильна в світлій. */
const StyledToolbar = styled(Toolbar)(({theme}) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  minHeight: HEADER_HEIGHT,
  height: HEADER_HEIGHT,
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
    borderColor: withAlpha(brandColors.ink, 0.25),
    backgroundColor: withAlpha(brandColors.ink, 0.06),
    backgroundImage: 'none',
    '&:hover': { backgroundColor: withAlpha(brandColors.ink, 0.1) },
  },
  // Тема дає іконковим кнопкам тло сторінки, а смуга хедера має протилежний
  // тон. Фарбуємо їх так само, як контурні кнопки поруч.
  '& .MuiIconButton-root': {
    color: brandColors.ink,
    borderColor: withAlpha(brandColors.ink, 0.25),
    backgroundColor: withAlpha(brandColors.ink, 0.06),
    backgroundImage: 'none',
    '&:hover': {
      backgroundColor: withAlpha(brandColors.ink, 0.12),
      borderColor: withAlpha(brandColors.ink, 0.4),
    },
  },
}));

/** Тривалість промови гравця на таймері ведучого, секунди. */
const SPEECH_SECONDS = 60;
/** Коротка промова: виправдання на голосуванні. Запускає окрема кнопка «30». */
const SHORT_SPEECH_SECONDS = 30;

const liveDotPulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.88); }
`;

/** Рядок з кнопкою акаунта в мобільному меню. Відступи — як у MenuItem теми, щоб вигляд не змінився. */
const drawerActionSx = { display: 'flex', alignItems: 'center', padding: '6px 8px' } as const;

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
  const {user, logout, canRecordRatingGame} = useAuth();
  /** Ім'я для літери-заглушки аватара: клуб — назва, гравець — нік. */
  const avatarName = (user?.authType === 'Клуб' ? user?.name : user?.nickname || user?.name) || '';
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [stopWatch, setStopWatch] = React.useState(SPEECH_SECONDS);
  // Таймер стоїть, доки ведучий його не торкнеться. Стан компонента, а не модуля:
  // інакше після першого запуску таймер сам біг на кожній новій сторінці гри.
  const [stopWatchRunning, setStopWatchRunning] = React.useState(false);
  const [liveTournament, setLiveTournament] = React.useState<{ id: string; name: string } | null>(null);

  const stopWatchFmt = stopWatch.toString().padStart(2, '0');

  useEffect(() => {
    if (!stopWatchRunning) return;
    const t = window.setInterval(() => setStopWatch((prev) => Math.max(prev - 1, 0)), 1000);
    return () => window.clearInterval(t);
  }, [stopWatchRunning]);

  useEffect(() => {
    if (!stopWatchRunning || stopWatch > 0) return;
    setStopWatchRunning(false);
    // Час вийшов: телефон ведучого вібрує, щоб не дивитися на екран. iOS вібрацію не підтримує.
    navigator.vibrate?.(400);
  }, [stopWatch, stopWatchRunning]);

  // Плашку «наживо» бачать усі відвідувачі, тому endpoint публічний.
  const fetchLiveTournament = React.useCallback(async () => {
    try {
      const { data } = await axios.get<{ item: { id: string; name: string } | null }>('/public/live-tournament');
      setLiveTournament(data.item ?? null);
    } catch {
      setLiveTournament(null);
    }
  }, []);

  useEffect(() => {
    void fetchLiveTournament();
  }, [fetchLiveTournament]);

  useEffect(() => {
    // Прихована вкладка не опитує API: кожен запит витрачає добовий ліміт функції Cloudflare.
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void fetchLiveTournament();
    }, 90_000);
    return () => window.clearInterval(t);
  }, [fetchLiveTournament]);

  const startStopWatch = (seconds = SPEECH_SECONDS) => {
    setStopWatch(seconds);
    setStopWatchRunning(true);
  }

  /**
   * Вкладка активна, коли відкритий її маршрут. Одна функція на всі кнопки —
   * інакше «Правила» і «Рейтинг клубу» лишаються без контуру, а решта його має.
   */
  const isActive = (route: string) => pathname === route || pathname.startsWith(`${route}/`);
  const navVariant = (route: string) => (isActive(route) ? 'outlined' : 'text');
  const isGameRoute = isActive('/new-game') || isActive('/new-game-rating');
  // На сторінці гри шапка вміщує таймер і кнопку «30». На вузькому екрані для них
  // бракує місця, тож текстова назва поруч зі знаком ховається.
  const isNarrow = useMediaQuery('(max-width:599.95px)', { noSsr: true });
  const isCompactHeader = useMediaQuery(compactHeaderQuery, { noSsr: true });
  // Кнопка звуку є на кожній сторінці протоколу. На вузькій шапці вона займає місце теми.
  const soundInHeader = isCompactHeader && (
    pathname === '/new-game'
    || pathname.endsWith('new-game-rating')
    || pathname.startsWith('/profile/rating-game/')
    || /^\/profile\/tournament\/[^/]+\/game\//.test(pathname)
  );

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  /** Повторний перехід на рейтингову гру з неї самої скидає гру — тоді потрібне підтвердження. */
  const needsNewGameConfirm = (path: string) => path === '/new-game-rating' && pathname.endsWith('new-game-rating');

  const navigateWithConfirm = async (path: string) => {
    if (needsNewGameConfirm(path)) {
      if (!(await confirmAction('Ви починаєте нову гру. Дані діючої рейтингової гри не будуть збережені.', 'Почати нову'))) return;
      localStorage.removeItem('ratingGameState');
      window.location.reload();
      return;
    }
    navigate(path);
  }

  /**
   * Пропси пункту навігації. Пункт рендериться як посилання (`component={RouterLink}`):
   * так працюють «відкрити в новій вкладці» і `aria-current` для читачів екрана.
   */
  const navLink = (path: string, onNavigate?: () => void) => ({
    to: path,
    'aria-current': isActive(path) ? ('page' as const) : undefined,
    onClick: (e: React.MouseEvent) => {
      onNavigate?.();
      if (!needsNewGameConfirm(path)) return;
      e.preventDefault();
      void navigateWithConfirm(path);
    },
  });

  const closeDrawer = () => setOpen(false);

  const logoutAndGoHome = () => {
    logout();
    navigate('/');
  };

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
      <Container maxWidth={false} sx={{ px: isGameRoute ? { xs: 1, md: 2 } : { xs: 2, md: 3 } }}>
        <StyledToolbar
          variant="dense"
          disableGutters
          sx={isGameRoute ? { py: 0, paddingTop: 0, paddingBottom: 0 } : undefined}
        >
          <Box
            sx={{
              flexGrow: isGameRoute ? 0 : 1,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              px: 0,
              gap: isGameRoute ? 1 : 3,
            }}
          >
            <Sitemark variant="band" size={isGameRoute ? 26 : 30} withWordmark={!(isGameRoute && isNarrow)}/>
            <Box component="nav" aria-label="Головна навігація" sx={{display: 'none', '@media (min-width: 940px)': {display: 'flex'}, gap: 0.5, overflow: 'hidden', '& .MuiButton-root': {whiteSpace: 'nowrap', minWidth: 'auto', flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}}>
              <Button startIcon={<StarIcon/>} variant={navVariant('/clubs-rating')}
                      component={RouterLink} {...navLink('/clubs-rating')}
                      size="small" color="secondary">
                Рейтинг клубу
              </Button>
              {canRecordRatingGame ? <>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                  <Button
                    variant={isGameRoute ? 'outlined' : 'text'}
                    component={RouterLink} {...navLink('/new-game-rating')}
                    size="small"
                    sx={{borderTopRightRadius: 0, borderBottomRightRadius: 0, pr: 1}}>
                    {isActive('/new-game') ? 'Фан гра' : 'Рейтингова гра'}
                  </Button>
                  <Button
                    variant={isGameRoute ? 'outlined' : 'text'}
                    onClick={(e) => setGameMenuAnchor(e.currentTarget)}
                    aria-label="Обрати тип гри"
                    aria-haspopup="menu"
                    aria-expanded={Boolean(gameMenuAnchor)}
                    aria-controls={gameMenuAnchor ? 'game-type-menu' : undefined}
                    size="small"
                    sx={{borderTopLeftRadius: 0, borderBottomLeftRadius: 0, minWidth: 'auto', px: 0.3}}>
                    <ArrowDropDownIcon sx={{fontSize: 20}}/>
                  </Button>
                </Box>
                <Menu
                  id="game-type-menu"
                  anchorEl={gameMenuAnchor}
                  open={Boolean(gameMenuAnchor)}
                  onClose={() => setGameMenuAnchor(null)}
                  PaperProps={{ sx: appBarNavMenuPaperSx }}
                >
                  <MenuItem component={RouterLink} {...navLink('/new-game-rating', () => setGameMenuAnchor(null))}>Рейтингова</MenuItem>
                  <MenuItem component={RouterLink} {...navLink('/new-game', () => setGameMenuAnchor(null))}>Фанова</MenuItem>
                </Menu>
              </> : <Button variant={navVariant('/new-game')}
                      component={RouterLink} {...navLink('/new-game')}
                      size="small">
                Фан гра
              </Button>}
              <Button component={RouterLink} {...navLink('/rules')} variant={navVariant('/rules')} size="small">
                Правила
              </Button>
              <Button
                component={RouterLink} {...navLink('/members')}
                variant={navVariant('/members')}
                size="small"
              >
                Учасники
              </Button>
              {liveTournament ? (
                <Button
                  component={RouterLink}
                  to={`/tournaments/${liveTournament.id}`}
                  size="small"
                  variant="outlined"
                  // Кнопка стоїть на смузі хедера, а не на тлі сторінки, тож її
                  // вигляд не залежить від схеми: власне темне тло дає контраст
                  // і на пісочній, і на чорнильній смузі.
                  sx={{
                    ml: 0.5,
                    maxWidth: 220,
                    flexShrink: 0,
                    color: brand[100],
                    borderColor: alpha(brand[300], 0.45),
                    bgcolor: alpha(brand[900], 0.5),
                    '&:hover': {
                      borderColor: brand[600],
                      bgcolor: alpha(brand[900], 0.65),
                      color: brand[100],
                    },
                  }}
                  startIcon={
                    <Box
                      aria-hidden
                      sx={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        bgcolor: brand[300],
                        boxShadow: `0 0 10px ${alpha(brand[400], 0.55)}`,
                        animation: `${liveDotPulse} 1.15s ease-in-out infinite`,
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
          {isGameRoute ? (
            <Box sx={{ flex: 1, alignSelf: 'stretch', display: 'flex', alignItems: 'center', minWidth: 0 }}>
            {/* Велике число — 60 с, як і раніше. Зона дотику — уся вільна ширина шапки. */}
            <Box
              role="button"
              tabIndex={0}
              aria-label={`Запустити таймер на ${SPEECH_SECONDS} секунд`}
              onClick={() => startStopWatch()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  startStopWatch();
                }
              }}
              sx={{
                flex: 1,
                alignSelf: 'stretch',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0,
                cursor: 'pointer',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Typography
                component="span"
                color={stopWatch <= 0 ? 'error' : stopWatch <= 10 ? 'warning' : 'inherit'}
                sx={{
                  fontFamily: brandFonts.display,
                  fontWeight: 900,
                  fontSize: 48,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  pointerEvents: 'none',
                }}
              >
                {stopWatchFmt}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              aria-label={`Запустити таймер на ${SHORT_SPEECH_SECONDS} секунд`}
              onClick={() => startStopWatch(SHORT_SPEECH_SECONDS)}
              // mr: той самий проміжок 8px, що й між іконками праворуч (gap: 1).
              sx={{ minWidth: 44, height: 36, px: 1, mr: 1, flexShrink: 0, fontFamily: brandFonts.mono, fontWeight: 700 }}
            >
              {SHORT_SPEECH_SECONDS}
            </Button>
            </Box>
          ) : null}
          <Box
            sx={{
              display: 'none',
              '@media (min-width: 940px)': {display: 'flex'},
              gap: 1,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {/* Службові іконки стоять перед блоком акаунта, а акаунт — на правому
                краї. Так перемикач теми не сусідить з «Вийти» і не дає помилкового
                виходу з акаунта. */}
            <ColorModeToggle/>
            {
              user && <Button component={RouterLink} {...navLink('/profile')} color="primary" variant="text" size="small" sx={{gap: 1, lineHeight: 1.2, py: 0.5, maxWidth: 180, overflow: 'hidden'}}>
                    <RemoteAvatar avatarUrl={user.avatarUrl} nickname={avatarName} sx={headerAvatarSx}/>
                    <Box sx={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                      Мій Профіль
                      <span style={{fontSize: '0.7em', opacity: 0.7, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>({user?.name})</span>
                    </Box>
                </Button>
            }
            {
              user && <Button onClick={logoutAndGoHome} color="primary" variant="text" size="small">
                    Вийти
                </Button>
            }
            {
              !user && <Button component={RouterLink} {...navLink('/login')} color="primary" variant="text" size="small">
                    Увійти
                </Button>
            }
            {
              !user && <Button
                    component={RouterLink} {...navLink('/register')}
                    variant="contained"
                    size="small"
                    sx={{ px: 2, borderRadius: '12px' }}
                >
                    Зареєструватися
                </Button>
            }
          </Box>
          <Box sx={{display: 'flex', '@media (min-width: 940px)': {display: 'none'}, gap: 1, alignItems: 'center', flexShrink: 0}}>
            {soundInHeader ? (
              <ObsMuteButton variant="toolbar" />
            ) : (
              <ColorModeToggle size="medium"/>
            )}
            <IconButton aria-label="Відкрити меню" aria-expanded={open} onClick={toggleDrawer(true)}>
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
              <Box component="nav" aria-label="Головна навігація" sx={{p: 2, backgroundColor: 'background.default'}}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {soundInHeader ? <ColorModeToggle size="medium" /> : null}
                  <OutlinedActionIconButton aria-label="Закрити меню" onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </OutlinedActionIconButton>
                </Box>
                <MenuItem selected={isActive('/clubs-rating')}
                          component={RouterLink} {...navLink('/clubs-rating', closeDrawer)}><StarIcon sx={{ mr: .5 }}/>Рейтинг клубу</MenuItem>
                {canRecordRatingGame ? <>
                  <MenuItem selected={isActive('/new-game-rating')}
                            component={RouterLink} {...navLink('/new-game-rating', closeDrawer)}>Рейтингова гра</MenuItem>
                  <MenuItem selected={isActive('/new-game')}
                            component={RouterLink} {...navLink('/new-game', closeDrawer)}>Фан гра</MenuItem>
                </> : <MenuItem selected={isActive('/new-game')}
                          component={RouterLink} {...navLink('/new-game', closeDrawer)}>Фан гра</MenuItem>}
                <MenuItem selected={isActive('/rules')} component={RouterLink} {...navLink('/rules', closeDrawer)}>
                  Правила
                </MenuItem>
                <MenuItem selected={isActive('/members')} component={RouterLink} {...navLink('/members', closeDrawer)}>
                  Учасники
                </MenuItem>
                {liveTournament ? (
                  <MenuItem
                    component={RouterLink}
                    to={`/tournaments/${liveTournament.id}`}
                    onClick={closeDrawer}
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
                        {/* Головна дія виділена, як і на десктопі. Під нею — вхід через Google, як на головній. */}
                        <Box sx={drawerActionSx}>
                            <Button component={RouterLink} {...navLink('/register', closeDrawer)} color="primary" variant="contained" fullWidth>
                                Зареєструватися
                            </Button>
                        </Box>
                        <Box sx={drawerActionSx}>
                            <Button component={RouterLink} {...navLink('/login', closeDrawer)} color="primary" variant="outlined" fullWidth>
                                Увійти
                            </Button>
                        </Box>
                        {googleEnabled && (
                          <Box sx={drawerActionSx}>
                            <GoogleSignIn onSignedIn={closeDrawer} />
                          </Box>
                        )}
                    </>
                }
                {
                  user && <>
                        <Box sx={drawerActionSx}>
                            <Button component={RouterLink} {...navLink('/profile', closeDrawer)} color="primary" variant="outlined" fullWidth sx={{gap: 1, lineHeight: 1.2, py: 0.5}}>
                                <RemoteAvatar avatarUrl={user.avatarUrl} nickname={avatarName} sx={headerAvatarSx}/>
                                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                  Мій Профіль
                                  <span style={{fontSize: '0.7em', opacity: 0.7}}>({user?.name})</span>
                                </Box>
                            </Button>
                        </Box>
                        <Box sx={drawerActionSx}>
                            <Button onClick={logoutAndGoHome} color="primary" variant="outlined" fullWidth>
                                Вийти
                            </Button>
                        </Box>
                    </>
                }
              </Box>
            </Drawer>
            {/* Акаунт стоїть на правому краї, як і на десктопі. Круглий аватар без
                рамки кнопки: друга рамка навколо кола виглядала б як ще одна іконка. */}
            {user && (
              <IconButton
                aria-label="Мій профіль"
                component={RouterLink}
                {...navLink('/profile')}
                sx={{
                  // StyledToolbar фарбує всі IconButton рамкою і тлом селектором
                  // з двох класів. Потрійний & перебиває його без !important.
                  '&&&': {p: 0, border: 'none', borderRadius: '50%', bgcolor: 'transparent'},
                  '&&&:hover .MuiAvatar-root': {borderColor: brandColors.accent},
                }}
              >
                <RemoteAvatar avatarUrl={user.avatarUrl} nickname={avatarName} sx={{...headerAvatarSx, width: 36, height: 36, fontSize: 16}}/>
              </IconButton>
            )}
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
