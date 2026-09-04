import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import AppTheme from "./theme/AppTheme";
import { brandColors, brandFonts } from "./theme/brand";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import HeartBrokenIcon from '@mui/icons-material/HeartBroken';
import WarningIcon from '@mui/icons-material/Warning';
import {styled} from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import Grid from "@mui/material/Grid2";
import CustomizedDataGrid from "./components/dashboard/CustomizedDataGrid";
import CustomizedTreeView from "./components/dashboard/CustomizedTreeView";
import ChartUserByCountry from "./components/dashboard/ChartUserByCountry";
import {DataGrid} from "@mui/x-data-grid";
import {columns, rows} from "./internals/data/gridDataClubs";
import {useEffect, useMemo} from "react";
import axios from "./axios";
import AppAppBar from "./components/AppAppBar";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {Autocomplete, createFilterOptions, Popover} from "@mui/material";
import Box from "@mui/material/Box";
import { invalidateClubRatingCache } from "./utils/clubRatingCache";
import Button from "@mui/material/Button";
import {useAuth} from "./AuthProvider";
import {vancouverTodayYmd} from "./utils/vancouverDate";

const filter = createFilterOptions();

const NewGameContainer = styled(Stack)(({theme}) => ({
  // height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  // minHeight: '100%',
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
        `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(250,43,30,0.10), ${brandColors.bg})`,
    }),
  },
}));

const RolesPoolDefault = [1, 2, 3, 4]
const RolesPoolMap: Record<number, string> = {
  0: '',
  1: 'М1',
  2: 'М2',
  3: 'Д',
  4: 'Ш'
}

/** Бекенд зберігає ролі рядками (normalizeRole); у формі потрібні числа 0–4 для RolesPoolMap. */
function apiRoleToUiRole(raw: unknown, mafiaSlot: { n: number }): number {
  if (typeof raw === 'number' && raw >= 0 && raw <= 4 && Number.isFinite(raw)) {
    return raw;
  }
  const s = String(raw ?? '').toLowerCase();
  if (s === 'cit' || s === 'citizen') return 0;
  if (s === 'don') return 3;
  if (s === 'sher' || s === 'sheriff') return 4;
  if (s === 'maf' || s === 'mafia') {
    mafiaSlot.n += 1;
    return mafiaSlot.n <= 1 ? 1 : 2;
  }
  return 0;
}

const createInitialPlayers = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].reduce((acc, n) => {
  acc[n] = {n, title: `Гість ${n}`, warnings: 0, role: 0, killed: 0, bestTurn: {} as Record<number, string>, bonusPoints: 0};
  return acc
}, {} as Record<number, any>);

const createInitialVotings = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].reduce((acc, c) => {
  acc[c] = {c, title: `День ${c}`, candidates: []};
  return acc
}, {} as Record<number, any>);

const STORAGE_KEY = 'ratingGameState';

const BONUS_RATING_WIN = [0.3, 0.4, 0.5];
const BONUS_RATING_LOSS = [0.1, 0.2, 0.3];
const BONUS_TOURNAMENT_WIN = [0.4, 0.5, 0.6, 0.7, 0.8];
/** Програвша команда в турнірі — максимум +0.5 */
const BONUS_TOURNAMENT_LOSS = [0.2, 0.3, 0.4, 0.5];
const PENALTY_TOURNAMENT_WIN = [-0.4, -0.5, -0.6, -0.7, -0.8];
const PENALTY_TOURNAMENT_LOSS = [-0.2, -0.3, -0.4, -0.5];

const loadSavedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const today = vancouverTodayYmd();
    if (!parsed._vancouverSavedYmd || parsed._vancouverSavedYmd !== today) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
};

const loadTournamentDraft = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

function applySeatingFromTournament(
  seatMap: Record<string, { userIds: string[] }> | undefined,
  clubMemberList: any[],
  setPlayers: (fn: any) => void
) {
  const nick = (oid: string) => {
    const u = clubMemberList.find((x: any) => String(x._id) === String(oid));
    return u?.nickname || u?.name || String(oid);
  };
  const restored = createInitialPlayers();
  if (seatMap && typeof seatMap === 'object') {
    for (let s = 1; s <= 10; s++) {
      const cell = seatMap[String(s)];
      if (!cell?.userIds?.length) continue;
      if (cell.userIds.length === 1) {
        const oid = String(cell.userIds[0]);
        restored[s] = { ...restored[s], title: nick(oid), id: oid, pendingTeamIds: undefined };
      } else {
        const [a, b] = cell.userIds.map(String);
        restored[s] = {
          ...restored[s],
          title: `${nick(a)} / ${nick(b)}`,
          id: '',
          pendingTeamIds: [a, b],
        };
      }
    }
  }
  setPlayers(restored);
}

export default function NewGame(props: { disableCustomTheme?: boolean }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { tournamentId, gameIndex: gameIndexStr } = useParams<{ tournamentId: string; gameIndex: string }>();
  const isTournamentGame = Boolean(tournamentId && gameIndexStr);
  const tournamentStorageKey = isTournamentGame ? `tournamentGame_${tournamentId}_${gameIndexStr}` : '';
  const isRatingGame = location.pathname.endsWith('new-game-rating');
  const saved = React.useRef(
    isTournamentGame
      ? loadTournamentDraft(tournamentStorageKey)
      : isRatingGame
        ? loadSavedState()
        : null
  ).current;

  const [readOnlyTournament, setReadOnlyTournament] = React.useState(false);
  /** Редагування вже збереженої гри турніру (клуб, турнір триває). */
  const [editingSavedTournamentGame, setEditingSavedTournamentGame] = React.useState(false);
  const [tournamentHidden, setTournamentHidden] = React.useState(false);
  const [tournamentTitle, setTournamentTitle] = React.useState('');
  const [tournamentNumGames, setTournamentNumGames] = React.useState(0);

  const [clubUsers, setClubUsers] = React.useState([]);
  const [winState, setWinState] = React.useState(saved?.winState || '');
  const [hideRoles, setHideRoles] = React.useState(saved?.hideRoles || false);
  const [preventSleepMode, setPreventSleepMode] = React.useState(true);
  const [votings, setVotings] = React.useState(saved?.votings || createInitialVotings());
  const [activeVoting, setActiveVoting] = React.useState(saved?.activeVoting || null as { c: number, candidates: [] } | null);

  const [players, _setPlayers] = React.useState(saved?.players || createInitialPlayers());
  const setPlayers = (item: any) => _setPlayers(() => item);
  const [bonusAnchorEl, setBonusAnchorEl] = React.useState<HTMLElement | null>(null);
  const [bonusPlayerN, setBonusPlayerN] = React.useState<number>(0);
  const [killedShowInfo, setKilledShowInfo] = React.useState(false);

  const gameLockedAfterWin = Boolean(winState && !(editingSavedTournamentGame && isTournamentGame));

  useEffect(() => {
    if (!isRatingGame) return;
    const hasRealPlayers = Object.values(players).some(
      (p: any) => p.id && !p.title?.startsWith('Гість')
    );
    if (!hasRealPlayers) return;
    const state = {
      players,
      votings,
      activeVoting,
      winState,
      hideRoles,
      _vancouverSavedYmd: vancouverTodayYmd(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [players, votings, activeVoting, winState, hideRoles, isRatingGame]);

  useEffect(() => {
    if (!isTournamentGame || !tournamentStorageKey || readOnlyTournament || tournamentHidden) return;
    const hasContent = Object.values(players).some(
      (p: any) => p.title && !String(p.title).startsWith('Гість')
    );
    if (!hasContent) return;
    const state = { players, votings, activeVoting, winState, hideRoles };
    localStorage.setItem(tournamentStorageKey, JSON.stringify(state));
  }, [players, votings, activeVoting, winState, hideRoles, isTournamentGame, tournamentStorageKey, readOnlyTournament, tournamentHidden]);

  const resetGame = () => {
    setPlayers(createInitialPlayers());
    setVotings(createInitialVotings());
    setActiveVoting(null);
    setWinState('');
    setHideRoles(false);
    setBonusAnchorEl(null);
    setBonusPlayerN(0);
    localStorage.removeItem(STORAGE_KEY);
    if (tournamentStorageKey) localStorage.removeItem(tournamentStorageKey);
  };

  const setPlayerNickname = (n: number, title: string, id: string) => {
    if (readOnlyTournament || tournamentHidden) return;
    if (gameLockedAfterWin && !(isTournamentGame && players[n]?.pendingTeamIds?.length)) {
      alert('Гра закінчена');
      return;
    }
    const next = {...players[n], title, id};
    if (id) next.pendingTeamIds = undefined;
    setPlayers({...players, [n]: next});
  }

  const addWarning = (n: number) => {
    if (readOnlyTournament || tournamentHidden) return;
    if (!n) return;
    if (gameLockedAfterWin) {
      alert('Гра закінчена');
      return;
    }
    setPlayers({...players, [n]: {...players[n], warnings: (players[n].warnings + 1) % 5}});
  }

  const addRole = (n: number) => {
    if (readOnlyTournament || tournamentHidden) return;
    if (n === 0) {
      return setHideRoles(!hideRoles);
    }
    if (gameLockedAfterWin) {
      alert('Гра закінчена');
      return;
    }
    const currentRole = players[n].role || 0;
    const pool = RolesPoolDefault.filter(role => !rolesPool.includes(role));
    let role = pool.length ? pool.find((r) => r > currentRole) : 0;
    role = role || 0;
    setPlayers({...players, [n]: {...players[n], role}});
  }

  const killPlayer = (n: number) => {
    if (readOnlyTournament || tournamentHidden) return;
    if (gameLockedAfterWin) {
      alert('Гра закінчена');
      return;
    }
    const hasFirstKilled = Object.values(players).some((p: any) => p.n !== n && p.killed === 1);
    if (hasFirstKilled && players[n].killed !== 1) return;
    setPlayers({...players, [n]: {...players[n], killed: players[n].killed === 1 ? 0 : 1, bestTurn: players[n].killed === 1 ? {} : players[n].bestTurn}});
  }

  const isPlayerWinner = (n: number) => {
    const role = players[n]?.role;
    return winState === 'mafia' ? [1, 2, 3].includes(role) : [0, 4].includes(role);
  };

  /** Турнір: програвша команда — бонус не більше 0.5 (після зміни переможця / старої чернетки). */
  useEffect(() => {
    if (!isTournamentGame || !winState || readOnlyTournament) return;
    _setPlayers((prev: Record<number, any>) => {
      let changed = false;
      const out = { ...prev };
      for (const k of Object.keys(out)) {
        const n = Number(k);
        if (!Number.isFinite(n)) continue;
        const role = out[n]?.role;
        const won = winState === 'mafia' ? [1, 2, 3].includes(role) : [0, 4].includes(role);
        const bp = Number(out[n]?.bonusPoints) || 0;
        if (!won && (bp > 0.5 || bp < -0.5)) {
          out[n] = { ...out[n], bonusPoints: 0 };
          changed = true;
        }
      }
      return changed ? out : prev;
    });
  }, [isTournamentGame, winState, readOnlyTournament]);

  const openBonusPopover = (e: React.MouseEvent<HTMLElement>, n: number) => {
    if (readOnlyTournament || tournamentHidden) return;
    setBonusAnchorEl(e.currentTarget);
    setBonusPlayerN(n);
  };

  const selectBonus = (pts: number) => {
    if (readOnlyTournament || tournamentHidden) return;
    const current = players[bonusPlayerN].bonusPoints;
    setPlayers({...players, [bonusPlayerN]: {...players[bonusPlayerN], bonusPoints: current === pts ? 0 : pts}});
    setBonusAnchorEl(null);
  };

  const supportFive = (n: number, i: number) => {
    if (readOnlyTournament || tournamentHidden) return;
    if (gameLockedAfterWin) {
      alert('Гра закінчена');
      return;
    }
    const current = {...(players[n].bestTurn || {})};

    Object.keys(players).forEach((key) => {
      if (Number(key) !== n) {
        players[Number(key)].bestTurn = {};
      }
    });

    const currentColor = current[i];
    if (currentColor === 'black') {
      current[i] = 'red';
    } else if (currentColor === 'red') {
      delete current[i];
    } else {
      if (Object.keys(current).length >= 5) return;
      current[i] = 'black';
    }

    setPlayers({...players, [n]: {...players[n], bestTurn: current}});
  }

  const promoteVote = (n: number) => {
    if (readOnlyTournament || tournamentHidden) return;
    if (gameLockedAfterWin) {
      alert('Гра закінчена');
      return;
    }
    if (!n) return;
    const currentVoting = activeVoting || votings[1];
    // if (!activeVoting) setActiveVoting(() => votings[0]);
    const activeVotingCandidates = currentVoting?.candidates || []
    const isExists = activeVotingCandidates.find(([candidate]: [number, number]) => candidate === n);
    if (isExists) {
      return;
    }
    activeVotingCandidates.push([n, 0]);
    // activeVotingCandidates[n] = 0;

    setVotings(() => ({...votings, [currentVoting?.c]: {...currentVoting, candidates: activeVotingCandidates}}));
    setActiveVoting(() => ({ ...currentVoting }));
  }

  const voteForPlayer = (candidateIndex: number, votes: number) => {
    if (readOnlyTournament || tournamentHidden) return;
    if (gameLockedAfterWin) {
      alert('Гра закінчена');
      return;
    }
    if (!activeVoting) return;
    const activeVotingCandidates: Array<[number, number]> = activeVoting?.candidates
    // const findCandidate = Object.keys(activeVotingCandidates).find(key => Number(key) === candidate);
    if (activeVotingCandidates && activeVotingCandidates[candidateIndex][1] === votes) {
      activeVotingCandidates[candidateIndex][1] = 0;
      return;
    }
    activeVotingCandidates[candidateIndex][1] = votes;
    setVotings(() => ({...votings, [activeVoting.c]: {...activeVoting, candidates: activeVotingCandidates}}));
  }

  const win = (winner: string) => {
    if (readOnlyTournament || tournamentHidden) return;
    if (winState && !(editingSavedTournamentGame && isTournamentGame)) {
      alert('Гра закінчена');
      return;
    }
    if (rolesPool.length !== 4) {
      alert('Не всім розподілено ролі');
      return;
    }
    if (Object.values(players).filter((player: any) => player.title).length < 10) {
      alert('Не всім розподілено нікнейми');
      return
    }
    if (!isTournamentGame) {
      const missingId = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].some(
        (seat) => players[seat]?.title && !String(players[seat].title).startsWith('Гість') && !players[seat].id
      );
      if (missingId) {
        alert('Для кожного місця з командою оберіть гравця (конкретний акаунт)');
        return;
      }
    }
    setWinState(() => winner);
  }

  const resolveTeamSeats = (src: Record<number, any>): Record<number, any> => {
    if (!isTournamentGame) return src;
    let changed = false;
    const copy = { ...src };
    for (let seat = 1; seat <= 10; seat++) {
      const p = copy[seat];
      if (!p?.id && p?.pendingTeamIds?.length) {
        const firstId = String(p.pendingTeamIds[0]);
        const member = clubUsers.find((u: any) => String(u._id) === firstId) as any;
        copy[seat] = { ...p, id: firstId, title: member?.nickname || p.title, pendingTeamIds: undefined };
        changed = true;
      }
    }
    return changed ? copy : src;
  };

  const submitGame = async () => {
    if (!winState) return;
    const effective = resolveTeamSeats(players);
    if (effective !== players) setPlayers(effective);
    if (isTournamentGame) {
      const missingId = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].some(
        (seat) => effective[seat]?.title && !String(effective[seat].title).startsWith('Гість') && !effective[seat].id
      );
      if (missingId) {
        alert('Для кожного місця з командою оберіть гравця (конкретний акаунт)');
        return;
      }
    }
    const updatingSaved = Boolean(isTournamentGame && editingSavedTournamentGame);
    if (!confirm(updatingSaved ? 'Зберегти зміни в цій грі турніру?' : 'Відправити результати гри?')) return;
    const playersPayload = Object.values(effective).map((p: any) => ({
      ...p,
      bestTurn: Object.entries(p.bestTurn || {}).map(([seat, color]) => ({n: Number(seat), color})),
    }));
    if (isTournamentGame) {
      const payload = {
        tournamentId,
        gameIndex: Number(gameIndexStr),
        players: playersPayload,
        winState,
        votings,
      };
      try {
        if (updatingSaved) {
          await axios.put('/club/tournament-game', payload);
          if (tournamentStorageKey) localStorage.removeItem(tournamentStorageKey);
          alert('Зміни збережено');
        } else {
          await axios.post('/club/tournament-game', payload);
          if (tournamentStorageKey) localStorage.removeItem(tournamentStorageKey);
          alert('Гру збережено');
          try {
            const { data: tour } = await axios.get(`/tournament/${tournamentId}`);
            if (tour.nextGameIndex != null) {
              navigate(`/profile/tournament/${tournamentId}/game/${tour.nextGameIndex}`, { replace: true });
            } else {
              navigate(`/profile/tournaments/${tournamentId}`);
            }
          } catch {
            navigate(`/profile/tournaments/${tournamentId}`);
          }
        }
      } catch (e: any) {
        alert(e?.response?.data?.error || e?.message || 'Помилка збереження');
      }
      return;
    }
    await axios.post('/club/rating-game', {
      players: playersPayload,
      winState,
      votings
    });
    invalidateClubRatingCache();
    alert('Гру збережено');
    resetGame();
  }

  useEffect(() => {
    async function fetchData() {
      try {
        if (isTournamentGame && tournamentId && gameIndexStr) {
          setEditingSavedTournamentGame(false);
          const { data: tour } = await axios.get(`/tournament/${tournamentId}`);
          const { data: gamesData } = await axios.get(`/tournament/${tournamentId}/games`);
          setTournamentTitle(tour.name || '');
          setTournamentNumGames(tour.numGames || 0);
          const idx = Number(gameIndexStr);
          const existing = (gamesData.items || []).find((g: any) => Number(g.gameIndex) === idx);

          if (existing?.hidden) {
            setTournamentHidden(true);
            setReadOnlyTournament(true);
            setClubUsers([]);
            return;
          }
          if (existing && !existing.hidden) {
            const canEditSaved =
              user?.authType === 'Клуб' &&
              tour.clubId != null &&
              String(user._id) === String(tour.clubId) &&
              tour.status === 'in_progress';
            if (canEditSaved) {
              setReadOnlyTournament(false);
              setEditingSavedTournamentGame(true);
              try {
                const { data: cu } = await axios.get('/club/users');
                const members = cu.items || [];
                setClubUsers(() => members.map((item: any, i: number) => ({ ...item, id: i + 1 })));
              } catch {
                setClubUsers([]);
              }
            } else {
              setReadOnlyTournament(true);
              setClubUsers([]);
            }
            const restored = createInitialPlayers();
            const mafiaSlot = { n: 0 };
            for (let seat = 1; seat <= 10; seat++) {
              const p = (existing.players || []).find((x: any) => Number(x.n) === seat);
              if (!p) continue;
              const bt: Record<number, string> = {};
              (p.bestTurn || []).forEach((x: any) => {
                if (x && x.n != null) bt[Number(x.n)] = x.color;
              });
              restored[seat] = {
                ...restored[seat],
                ...p,
                n: seat,
                role: apiRoleToUiRole(p.role, mafiaSlot),
                bestTurn: bt,
                id: p.id ? String(p.id) : '',
                pendingTeamIds: undefined,
              };
            }
            setPlayers(restored);
            setWinState(existing.winState || '');
            setVotings(existing.votings || createInitialVotings());
            return;
          }

          if (user?.authType !== 'Клуб') {
            alert('Проводити гру може лише клуб');
            navigate(`/profile/tournaments/${tournamentId}`);
            return;
          }

          const { data: cu } = await axios.get('/club/users');
          const members = cu.items || [];
          const array = members.map((item: any, i: number) => ({ ...item, id: i + 1 }));
          setClubUsers(() => array);

          if (tour.nextGameIndex != null && idx !== tour.nextGameIndex) {
            navigate(`/profile/tournament/${tournamentId}/game/${tour.nextGameIndex}`, { replace: true });
            return;
          }
          if (tour.status !== 'in_progress') {
            alert('Турнір не активний');
            navigate(`/profile/tournaments/${tournamentId}`);
            return;
          }

          const draft = tournamentStorageKey ? loadTournamentDraft(tournamentStorageKey) : null;
          if (draft?.players) {
            setPlayers(draft.players);
            if (draft.votings) setVotings(draft.votings);
            if (draft.activeVoting !== undefined) setActiveVoting(draft.activeVoting);
            if (draft.winState) setWinState(draft.winState);
            if (draft.hideRoles !== undefined) setHideRoles(draft.hideRoles);
            return;
          }

          setVotings(createInitialVotings());
          setActiveVoting(null);
          setWinState('');
          setHideRoles(false);
          setBonusAnchorEl(null);
          setBonusPlayerN(0);
          const seatMap = tour.seatingByGame?.[String(idx)];
          applySeatingFromTournament(seatMap, members, setPlayers);
          return;
        }

        const urlPath = isRatingGame ? 'club/users' : 'users';
        const {data} = await axios.get(`/${urlPath}`);
        const array = (data.items || []).map((item: any, i: number) => {
          return {...item, id: i + 1};
        })
        setClubUsers(() => array || []);

        const savedHasRealPlayers = saved && Object.values(saved.players || {}).some(
          (p: any) => p.id && !p.title?.startsWith('Гість')
        );
        if (isRatingGame && !savedHasRealPlayers) {
          try {
            const { data: lastGame } = await axios.get('/club/last-game-players');
            if (lastGame.players?.length) {
              const restored = createInitialPlayers();
              lastGame.players.forEach((p: any) => {
                if (p.seat >= 1 && p.seat <= 10) {
                  restored[p.seat] = { ...restored[p.seat], title: p.title, id: p.id };
                }
              });
              setPlayers(restored);
            }
          } catch (e) {
            console.error('Failed to load last game players', e);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
    return () => {};
  }, [isTournamentGame, tournamentId, gameIndexStr, user?._id, user?.authType])

  // get active players nickname list
  const activePlayers = useMemo(() => {
    return Object.values(players).filter((player: any) => player.title).map((player: any) => player.title)
  }, [players]);

  const rolesPool = useMemo(() => {
    return Object.values(players).filter((player: any) => player.role).map((player: any) => player.role)
  }, [players]);

  const killedPool = useMemo(() => {
    return Object.values(players).filter((player: any) => player.killed).map((player: any) => player.killed)
  }, [players]);

  const bonusWinnerOpts = isTournamentGame ? BONUS_TOURNAMENT_WIN : BONUS_RATING_WIN;
  const bonusLoserOpts = isTournamentGame ? BONUS_TOURNAMENT_LOSS : BONUS_RATING_LOSS;
  const penaltyWinnerOpts = isTournamentGame ? PENALTY_TOURNAMENT_WIN : [];
  const penaltyLoserOpts = isTournamentGame ? PENALTY_TOURNAMENT_LOSS : [];

  if (tournamentHidden) {
    return (
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <NewGameContainer direction="column" justifyContent="flex-start" alignItems="center">
          <AppAppBar />
          <Typography sx={{ mt: '6rem', px: 2, textAlign: 'center' }}>
            Результати цієї гри приховані до завершення турніру.
          </Typography>
        </NewGameContainer>
      </AppTheme>
    );
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme/>
      <NewGameContainer direction="column" justifyContent="space-between" alignItems="center">
        <AppAppBar/>
        {isTournamentGame && (
          <Box sx={{ mt: '5rem', mb: 0.5, textAlign: 'center', px: 1 }}>
            <Typography variant="body2">
              Турнір: {tournamentTitle || '…'} · Гра {gameIndexStr} / {tournamentNumGames || '…'}
              {readOnlyTournament ? ' (перегляд)' : editingSavedTournamentGame ? ' (редагування)' : ''}
            </Typography>
            {editingSavedTournamentGame && !readOnlyTournament ? (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, maxWidth: 520, mx: 'auto' }}>
                Поки турнір не завершено, можна змінити цю гру та натиснути «Зберегти гру» — оновиться рейтинг турніру.
              </Typography>
            ) : null}
          </Box>
        )}
        <Box
          sx={{
            mt: isTournamentGame ? '0.5rem' : '5.3rem',
            width: '100%',
            maxWidth: 1280,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: brandFonts.mono,
              fontSize: 11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: brandColors.accentHover,
            }}
          >
            Протокол гри
          </Box>
          <Typography
            variant="h1"
            sx={{
              m: 0,
              fontFamily: brandFonts.display,
              fontWeight: 900,
              fontSize: 'clamp(32px,4vw,52px)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
            }}
          >
            {isTournamentGame ? 'Турнірна гра' : isRatingGame ? 'Рейтингова гра' : 'Фан гра'}
          </Typography>
        </Box>
        <Box sx={{mt: 2, display: 'flex', justifyContent: 'space-between', flexGrow: 1, gap: 1, flexWrap: 'wrap'}}>
          <Button
            onClick={() =>
              !readOnlyTournament &&
              (!winState || (editingSavedTournamentGame && isTournamentGame)) &&
              win('mafia')
            }
            variant="outlined"
            color={winState === 'mafia' ? 'secondary' : 'info'}
            size="small"
            disabled={readOnlyTournament || Boolean(winState && !(editingSavedTournamentGame && isTournamentGame))}
          >
            Перемога мафії
          </Button>
          <Button
            onClick={() =>
              !readOnlyTournament &&
              (!winState || (editingSavedTournamentGame && isTournamentGame)) &&
              win('citizens')
            }
            variant="outlined"
            color={winState === 'citizens' ? 'secondary' : 'info'}
            size="small"
            disabled={readOnlyTournament || Boolean(winState && !(editingSavedTournamentGame && isTournamentGame))}
          >
            Перемога мирних
          </Button>
          {winState && user?.authType === 'Клуб' && isRatingGame && (
            <Button onClick={submitGame} variant="contained" color="success" size="small">
              Зберегти гру
            </Button>
          )}
          {winState && user?.authType === 'Клуб' && isTournamentGame && !readOnlyTournament && (
            <Button onClick={submitGame} variant="contained" color="success" size="small">
              {editingSavedTournamentGame ? 'Зберегти зміни' : 'Зберегти гру'}
            </Button>
          )}
        </Box>
        <Grid minHeight={30} container columns={12} sx={{
          p: 0,
          // fontSize: '16px !important',
          // justifyContent: 'center',
          textAlign: 'center',
          maxWidth: '1200px',
          width: '100%',
          mt: '.5rem',
          '--Grid-borderWidth': '1px',
          borderTop: 'var(--Grid-borderWidth) solid',
          borderLeft: 'var(--Grid-borderWidth) solid',
          borderColor: 'divider',
          '& > div': {
            borderRight: 'var(--Grid-borderWidth) solid',
            borderBottom: 'var(--Grid-borderWidth) solid',
            borderColor: 'divider',
          },
        }}>
          {
            [{n: 0}, ...Object.values(players)].map(({n}: any) => (
              <React.Fragment key={n}>
                {
                  (players[n]?.killed !== 1 || (n !== 0 && killedShowInfo)) && <>
                        <Grid onClick={() => promoteVote(n)} sx={{cursor: 'pointer', p: '.2rem'}}
                              size={{xs: 1.5, sm: 1, lg: 1}}>
                          {n === 0 ? <ThumbUpIcon/> : n}
                        </Grid>
                        <Grid sx={{p: '.3rem'}} size={{xs: 5.5, sm: 7.5, lg: 7.5}}>
                          {n === 0 ? 'Нік' : <Autocomplete
                            size={'small'}
                            disabled={readOnlyTournament}
                            value={players[n].title}
                            onChange={(event, newValue) => {
                              if (typeof newValue === 'string') {
                                setPlayerNickname(n, newValue, '');
                              } else if (newValue && newValue.inputValue) {
                                setPlayerNickname(n, newValue.inputValue || newValue.inputValue?.title || '', newValue.inputValue?.id || '');
                              } else {
                                setPlayerNickname(n, newValue?.title || `Гість ${n}`, newValue?._id);
                              }
                            }}
                            filterOptions={(options, params) => {
                              const filtered = filter(options, params);

                              const {inputValue} = params;
                              const isExisting = options.some((option) => inputValue === option.title);
                              if (inputValue !== '' && !isExisting) {
                                filtered.push({
                                  inputValue,
                                  title: `Add "${inputValue}"`,
                                });
                              }

                              return filtered;
                            }}
                            selectOnFocus
                            clearOnBlur
                            handleHomeEndKeys
                            id="free-solo-with-text-demo"
                            options={(() => {
                              const pending = (players[n] as any)?.pendingTeamIds as string[] | undefined;
                              const base = pending?.length
                                ? clubUsers.filter((u: any) => pending.includes(String(u._id)))
                                : clubUsers.filter((u: any) => !activePlayers.includes(u.nickname));
                              return base.map((option: { nickname: string }) => ({ ...option, title: option.nickname }));
                            })()}
                            freeSolo={!readOnlyTournament && !(players[n] as any)?.pendingTeamIds?.length}
                            getOptionLabel={(option) => {
                              if (typeof option === 'string') {
                                return option;
                              }
                              if (option.inputValue) {
                                return option.inputValue;
                              }
                              return option.title;
                            }}
                            renderOption={(props, option) => {
                              const {key, ...optionProps} = props;
                              return (
                                <li key={key} {...optionProps}>
                                  {option.title}
                                </li>
                              );
                            }}
                            renderInput={(params) => (
                              <TextField {...params} />
                            )}
                          />}
                        </Grid>
                        <Grid sx={{
                          p: n === 0 ? '.5rem' : '.1rem',
                          backgroundColor: players[n]?.warnings === 3 ? 'rgba(255,165,0, 0.2)' : players[n]?.warnings === 4 ? 'rgba(255,0,0, 0.3)' : 'transparent',
                          cursor: 'pointer'
                        }} onClick={() => addWarning(n)} size={{xs: 1.75, sm: 2, lg: 1.5}}>
                          {n === 0 ? "Ф" : new Array(players[n].warnings).fill('⚠️').join('  ')}
                        </Grid>
                        <Grid sx={{
                          p: '.5rem',
                          fontWeight: n !== 0 ? 800 : '',
                          cursor: 'pointer',
                        }} size={{xs: 2, sm: 1, lg: 1.5}} onClick={() => addRole(n)}>
                          {n === 0 ? 'Р' : hideRoles ? '?' : `${RolesPoolMap[Number(players[n].role)] ?? ''} `}
                        </Grid>
                    </>
                }
                {
                  n !== 0 && players[n]?.killed === 1 && !killedShowInfo &&
                    <Grid container columns={12} sx={{p: '.3rem', backgroundColor: 'rgba(200, 200, 210, 0.25)'}} size={{xs: 10.75, sm: 11.5, lg: 11.5}}>
                      {
                        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
                          const color = players[n].bestTurn?.[i];
                          return <Grid key={i} sx={{
                            backgroundColor: color === 'black' ? 'rgba(0, 0, 0, 1)'
                              : color === 'red' ? 'rgba(180, 0, 0, 0.6)'
                              : 'transparent',
                            color: color ? '#fff' : 'inherit',
                            borderColor: 'gray !important',
                            borderRight: 'var(--Grid-borderWidth) solid',
                            cursor: 'pointer',
                            fontWeight: color ? 700 : 400,
                          }} size={{xs: 12 / 10}} onClick={() => supportFive(n, i)}>
                            {i}
                          </Grid>
                        })
                      }
                    </Grid>
                }
                <Grid sx={{
                  fontWeight: n !== 0 ? 800 : '',
                  cursor: winState && n !== 0
                    ? 'pointer'
                    : n !== 0 && (!killedPool.includes(1) || players[n]?.killed === 1) ? 'pointer' : 'default',
                  py: '.4rem',
                  opacity: !winState && n !== 0 && killedPool.includes(1) && players[n]?.killed !== 1 ? 0.3 : 1,
                  fontSize: players[n]?.killed === 1 && !winState ? '0.7rem' : 'inherit',
                }} size={{xs: 1.25, sm: 0.5, lg: 0.5}}
                   onClick={(e: any) => {
                     if (!n) return;
                     if (winState) {
                       openBonusPopover(e, n);
                     } else {
                       killPlayer(n);
                     }
                   }}>
                  {winState && n !== 0
                    ? (players[n].bonusPoints
                      ? <span style={{fontSize: '0.7rem', color: players[n].bonusPoints > 0 ? '#4caf50' : '#f44336'}}>{players[n].bonusPoints > 0 ? '+' : ''}{players[n].bonusPoints}</span>
                      : <ThumbUpIcon sx={{fontSize: '0.9rem', opacity: 0.5}}/>)
                    : n === 0
                      ? <HeartBrokenIcon/>
                      : players[n]?.killed === 1
                        ? `${Object.keys(players[n].bestTurn || {}).length}/5`
                        : ''
                  }
                </Grid>
              </React.Fragment>
            ))
          }
        </Grid>

        {Object.values(players).some((p: any) => p.killed === 1) && (
          <Button
            onClick={() => setKilledShowInfo(!killedShowInfo)}
            variant="text"
            size="small"
            sx={{ mt: 0.5, textTransform: 'none', fontSize: '0.75rem' }}
          >
            {killedShowInfo ? 'ОП5' : 'Роль / Нік / Фоли'}
          </Button>
        )}

        <Popover
          open={Boolean(bonusAnchorEl)}
          anchorEl={bonusAnchorEl}
          onClose={() => setBonusAnchorEl(null)}
          anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
          transformOrigin={{vertical: 'top', horizontal: 'center'}}
        >
          <Stack spacing={1} sx={{p: 1.5}}>
            <Stack direction="row" spacing={1}>
              {(isPlayerWinner(bonusPlayerN) ? bonusWinnerOpts : bonusLoserOpts).map(p => (
                <Button
                  key={p}
                  variant={players[bonusPlayerN]?.bonusPoints === p ? 'contained' : 'outlined'}
                  size="small"
                  color="success"
                  onClick={() => selectBonus(p)}
                >
                  +{p}
                </Button>
              ))}
            </Stack>
            {(isPlayerWinner(bonusPlayerN) ? penaltyWinnerOpts : penaltyLoserOpts).length > 0 && (
              <Stack direction="row" spacing={1}>
                {(isPlayerWinner(bonusPlayerN) ? penaltyWinnerOpts : penaltyLoserOpts).map(p => (
                  <Button
                    key={p}
                    variant={players[bonusPlayerN]?.bonusPoints === p ? 'contained' : 'outlined'}
                    size="small"
                    color="error"
                    onClick={() => selectBonus(p)}
                  >
                    {p}
                  </Button>
                ))}
              </Stack>
            )}
          </Stack>
        </Popover>

        {
          activeVoting && Boolean(activeVoting.candidates?.length) && <>
                <Grid minHeight={30} container columns={12} sx={{
                  p: 0,
                  // justifyContent: 'center',
                  textAlign: 'center',
                  maxWidth: '1200px',
                  width: '100%',
                  mt: '.5rem',
                  '--Grid-borderWidth': '1px',
                  borderTop: 'var(--Grid-borderWidth) solid',
                  borderLeft: 'var(--Grid-borderWidth) solid',
                  borderColor: 'divider',
                  '& > div': {
                    borderRight: 'var(--Grid-borderWidth) solid',
                    borderBottom: 'var(--Grid-borderWidth) solid',
                    borderColor: 'divider',
                  },
                }}>
                  {
                    activeVoting?.candidates.map(([candidate]: [number, number], i: number) => {
                      return <>
                        <Grid sx={{cursor: 'pointer', p: '.3rem'}} size={{xs: 1}}> <strong>{candidate}</strong> </Grid>
                        {
                          [1, 2, 3, 4, 5, 6].map((j) => {
                            return <Grid sx={{
                              p: '.3rem',
                              fontStyle: 'italic',
                              backgroundColor: activeVoting?.candidates?.[i]?.[1] === j ? 'rgb(0, 54, 107)' : 'transparent',
                              // borderColor: 'gray !important',
                              // borderRight: 'var(--Grid-borderWidth) solid',
                              cursor: 'pointer'
                            }} size={{xs: 11 / 6}} onClick={() => voteForPlayer(i, j)}>
                              {j === 6 ? '6+' : j }
                            </Grid>
                          })
                        }
                      </>
                    })
                  }
                </Grid>
                <Button onClick={() => setActiveVoting(votings[activeVoting.c ? activeVoting.c + 1 : 1])} sx={{mt: '1rem'}} variant="outlined"
                        color={winState === 'mafia' ? 'secondary' : 'info'} size="small">
                    Зберегти голосування
                </Button>
            </>
        }
      </NewGameContainer>
    </AppTheme>
  );
}