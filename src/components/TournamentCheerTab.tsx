import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import axios from '../axios';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { notify } from './feedback/feedback';

type PublicPlayer = { id: string; nickname: string; avatarUrl: string | null };
type PublicSlot = { seatIndex: number; players: PublicPlayer[] };

export type CheerItem = {
  id: string;
  message: string;
  createdAt: string;
  anonymous: boolean;
  fromUser: { id: string; nickname: string; avatarUrl: string | null } | null;
  toUser: { id: string; nickname: string; avatarUrl: string | null };
};

const SUGGESTIONS = [
  'Тримаємо кулаки! 💪',
  'Удачі за столом!',
  'Ти кращий!',
  'Грай як бог!',
  'Ми в тебе віримо!',
  'Покажи клас!',
  'Успіху та натхнення!',
  'Нехай мирні переможуть… завядяки тобі! 😉',
];

/** Усі зайняті місця: кожен учасник окремо (пара за одним столом — два елементи). */
function slotFieldEntries(slots: PublicSlot[]): { seatIndex: number; player: PublicPlayer; scatterIndex: number }[] {
  const sorted = [...slots].sort((a, b) => a.seatIndex - b.seatIndex);
  const out: { seatIndex: number; player: PublicPlayer; scatterIndex: number }[] = [];
  let scatterIndex = 0;
  for (const s of sorted) {
    for (const p of s.players || []) {
      if (!p?.id) continue;
      out.push({ seatIndex: s.seatIndex, player: p, scatterIndex: scatterIndex++ });
    }
  }
  return out;
}

function hashString(s: string): number {
  let h = 0;
  for (let j = 0; j < s.length; j++) h = (h * 31 + s.charCodeAt(j)) >>> 0;
  return h;
}

/**
 * Позиції в % від розмірів контейнера: сітка + псевдовипадковий джитер у комірці, без перетину
 * (мінімальна відстань між центрами карток у px).
 */
function computeCheerFieldPositions(
  layoutKeys: string[],
  cols: number,
  rows: number,
  w: number,
  h: number,
  compact: boolean
): { left: string; top: string }[] {
  const n = layoutKeys.length;
  if (n < 1 || w < 48 || h < 48) {
    return layoutKeys.map(() => ({ left: '50%', top: '50%' }));
  }

  const padX = compact ? Math.max(28, w * 0.032) : Math.max(48, w * 0.065);
  const padY = compact ? Math.max(40, h * 0.055) : Math.max(56, h * 0.075);
  const usableW = Math.max(1, w - 2 * padX);
  const usableH = Math.max(1, h - 2 * padY);
  const cellW = usableW / cols;
  const cellH = usableH / rows;
  const cellMin = Math.min(cellW, cellH);

  /** На mobile — мало джитеру, щоб після зсуву відстань між сусідами не падала нижче MIN_D. */
  const jmul = compact ? 0.08 : 0.3;
  const maxJX = cellW * jmul;
  const maxJY = cellH * jmul;

  const worstCaseSep = Math.min(cellW, cellH) * (1 - 2 * jmul);
  const MIN_D = compact
    ? Math.min(100, Math.max(68, Math.min(worstCaseSep * 0.995, cellMin * 0.96)))
    : Math.min(108, Math.max(78, cellMin * 0.88));

  const placed: { x: number; y: number }[] = [];
  const out: { left: string; top: string }[] = [];

  const fits = (cx: number, cy: number) =>
    placed.every((p) => Math.hypot(cx - p.x, cy - p.y) >= MIN_D - 0.5);

  for (let index = 0; index < n; index++) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const baseX = padX + (col + 0.5) * cellW;
    const baseY = padY + (row + 0.5) * cellH;
    const key = layoutKeys[index];

    let best: { x: number; y: number } | null = null;
    let bestScore = -1;

    for (let attempt = 0; attempt < 64; attempt++) {
      const h1 = hashString(`${key}:pl:${attempt}`);
      const h2 = hashString(`${key}:pl:${attempt}:b`);
      const u = (h1 % 10001) / 10000 - 0.5;
      const v = (h2 % 10001) / 10000 - 0.5;
      let cx = baseX + u * 2 * maxJX;
      let cy = baseY + v * 2 * maxJY;
      cx = Math.min(w - padX, Math.max(padX, cx));
      cy = Math.min(h - padY, Math.max(padY, cy));

      if (!fits(cx, cy)) continue;
      let minD = Infinity;
      for (const p of placed) {
        minD = Math.min(minD, Math.hypot(cx - p.x, cy - p.y));
      }
      const score = minD === Infinity ? 1000 : minD;
      if (score > bestScore) {
        bestScore = score;
        best = { x: cx, y: cy };
      }
    }

    if (!best) {
      best = { x: baseX, y: baseY };
      if (!fits(best.x, best.y)) {
        let found = false;
        for (let s = 1; s <= 36 && !found; s++) {
          const ang = s * 0.9;
          const r = s * 5;
          const cx = baseX + Math.cos(ang) * r;
          const cy = baseY + Math.sin(ang) * r;
          if (cx < padX || cx > w - padX || cy < padY || cy > h - padY) continue;
          if (fits(cx, cy)) {
            best = { x: cx, y: cy };
            found = true;
          }
        }
      }
    }

    placed.push(best);
    out.push({
      left: `${(best.x / w) * 100}%`,
      top: `${(best.y / h) * 100}%`,
    });
  }

  return out;
}

function cheerFieldGrid(n: number, compact: boolean): { cols: number; rows: number; minHeightPx: number } {
  if (n < 1) return { cols: 1, rows: 0, minHeightPx: 140 };
  let cols = n === 1 ? 1 : Math.min(5, Math.max(2, Math.ceil(Math.sqrt(n))));
  if (compact && n >= 6) {
    cols = Math.max(2, Math.min(cols, 3));
  }
  const rows = Math.ceil(n / cols);
  const minHeightPx = compact
    ? Math.max(440, 48 + rows * 138)
    : Math.max(300, 72 + rows * 148);
  return { cols, rows, minHeightPx };
}

function FeedAvatar({
  avatarUrl,
  nickname,
  size = 28,
}: {
  avatarUrl: string | null;
  nickname: string;
  size?: number;
}) {
  const [failed, setFailed] = React.useState(false);
  const src = !failed ? resolveMediaUrl(avatarUrl ?? null) : undefined;
  const initial = nickname.trim().charAt(0).toUpperCase() || '?';
  const dim = size;
  const fontSize = size >= 64 ? '1.35rem' : size >= 40 ? '1.1rem' : '0.75rem';
  if (src) {
    return (
      <Box
        component="img"
        src={src}
        alt=""
        onError={() => setFailed(true)}
        sx={{
          width: dim,
          height: dim,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: (t) => `2px solid ${alpha(t.palette.primary.main, 0.35)}`,
        }}
      />
    );
  }
  return (
    <Box
      sx={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      }}
    >
      {initial}
    </Box>
  );
}

function MuscleBadge({ count }: { count: number }) {
  if (count < 1) return null;
  const n = Math.min(count, 10);
  return (
    <Box
      sx={{
        position: 'absolute',
        top: -6,
        right: -6,
        zIndex: 2,
        fontSize: '0.7rem',
        lineHeight: 1.1,
        bgcolor: 'background.paper',
        borderRadius: 1,
        px: 0.4,
        py: 0.2,
        boxShadow: 1,
        border: (t) => `1px solid ${t.palette.divider}`,
        maxWidth: 96,
        overflow: 'hidden',
        textAlign: 'right',
      }}
      title={`${count} підтримок`}
    >
      {'💪'.repeat(n)}
      {count > 10 ? ` +${count - 10}` : ''}
    </Box>
  );
}

type Props = {
  tournamentId: string;
  slots: PublicSlot[];
  currentUserId: string | null | undefined;
  isLoggedIn: boolean;
};

export default function TournamentCheerTab({ tournamentId, slots, currentUserId, isLoggedIn }: Props) {
  const theme = useTheme();
  const isCheerCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const fieldAvatarPx = isCheerCompact ? 56 : 80;
  const feedAvatarToPx = isCheerCompact ? 32 : 40;
  const feedAvatarFromPx = isCheerCompact ? 28 : 34;

  const fieldEntries = React.useMemo(() => slotFieldEntries(slots), [slots]);
  const cheerGrid = React.useMemo(
    () => cheerFieldGrid(fieldEntries.length, isCheerCompact),
    [fieldEntries.length, isCheerCompact]
  );
  const [items, setItems] = React.useState<CheerItem[]>([]);
  const [countsByUserId, setCountsByUserId] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<PublicPlayer | null>(null);
  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [viewerHasCheered, setViewerHasCheered] = React.useState(false);
  /** За замовчуванням — анонімно (не показувати автора в стрічці). */
  const [cheerAnonymous, setCheerAnonymous] = React.useState(true);

  const alreadyCheered = Boolean(isLoggedIn && viewerHasCheered);

  const fieldLayoutRef = React.useRef<HTMLDivElement | null>(null);
  const [fieldSize, setFieldSize] = React.useState({ w: 560, h: 400 });

  React.useLayoutEffect(() => {
    const el = fieldLayoutRef.current;
    if (!el) return;
    const update = () => {
      const { clientWidth, clientHeight } = el;
      if (clientWidth > 0 && clientHeight > 0) {
        setFieldSize((prev) =>
          prev.w === clientWidth && prev.h === clientHeight ? prev : { w: clientWidth, h: clientHeight }
        );
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fieldEntries.length, cheerGrid.minHeightPx]);

  const cheerLayoutKeys = React.useMemo(
    () => fieldEntries.map((e) => `${e.player.id}-${e.seatIndex}-${e.scatterIndex}`),
    [fieldEntries]
  );

  const cardPositions = React.useMemo(
    () =>
      computeCheerFieldPositions(
        cheerLayoutKeys,
        cheerGrid.cols,
        cheerGrid.rows,
        fieldSize.w,
        fieldSize.h,
        isCheerCompact
      ),
    [cheerLayoutKeys, cheerGrid.cols, cheerGrid.rows, fieldSize.w, fieldSize.h, isCheerCompact]
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get<{
        items: CheerItem[];
        countsByUserId: Record<string, number>;
        viewerHasCheered?: boolean;
      }>(`/public/tournament/${tournamentId}/cheers`);
      const list = data.items || [];
      setItems(list);
      setCountsByUserId(data.countsByUserId || {});
      const uid = currentUserId != null ? String(currentUserId) : '';
      setViewerHasCheered(
        Boolean(
          data.viewerHasCheered ??
            (uid && list.some((c) => c.fromUser && c.fromUser.id === uid))
        )
      );
    } catch {
      setError('Не вдалося завантажити підтримку.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, currentUserId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openFor = (p: PublicPlayer) => {
    if (!isLoggedIn) return;
    if (alreadyCheered) return;
    if (currentUserId && p.id === String(currentUserId)) return;
    setSelected(p);
    setMessage('');
    setCheerAnonymous(true);
    setDialogOpen(true);
  };

  const appendSuggestion = (s: string) => {
    setMessage((prev) => (prev ? `${prev.trim()} ${s}` : s));
  };

  const send = async () => {
    const msg = message.trim();
    if (!selected || msg.length < 1) return;
    setSending(true);
    try {
      await axios.post(`/tournament/${tournamentId}/cheer`, {
        toUserId: selected.id,
        message: msg,
        anonymous: cheerAnonymous,
      });
      setDialogOpen(false);
      setSelected(null);
      setMessage('');
      await load();
    } catch (e: any) {
      notify.error(e?.response?.data?.error || e?.message || 'Помилка відправки');
    } finally {
      setSending(false);
    }
  };

  const fieldPaper = (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        minHeight: cheerGrid.minHeightPx + 52,
        borderRadius: 3,
        overflow: 'hidden',
        border: (t) => `1px solid ${t.palette.divider}`,
        background: (t) =>
          t.palette.mode === 'dark'
            ? `linear-gradient(160deg, ${alpha(t.palette.primary.dark, 0.35)} 0%, ${alpha(t.palette.grey[900], 0.9)} 45%, ${alpha(t.palette.secondary.dark, 0.25)} 100%)`
            : `linear-gradient(165deg, ${alpha(t.palette.primary.light, 0.35)} 0%, #fff8fb 40%, ${alpha(t.palette.secondary.light, 0.28)} 100%)`,
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle at 20% 30%, #000 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
      <Typography variant="subtitle2" sx={{ position: 'relative', zIndex: 1, pt: 1.5, px: 2, fontWeight: 800 }}>
        Обери учасника
      </Typography>
      {fieldEntries.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2, position: 'relative', zIndex: 1 }}>
          Список учасників порожній.
        </Typography>
      ) : (
        <Box
          ref={fieldLayoutRef}
          sx={{
            position: 'relative',
            zIndex: 1,
            minHeight: cheerGrid.minHeightPx,
            height: cheerGrid.minHeightPx,
            px: { xs: 0.5, sm: 1 },
            pb: 1,
            boxSizing: 'border-box',
          }}
        >
          {fieldEntries.map(({ seatIndex, player: p, scatterIndex }) => {
            const count = countsByUserId[p.id] || 0;
            const isSelf = currentUserId && p.id === String(currentUserId);
            const canClick = isLoggedIn && !alreadyCheered && !isSelf;
            const scatterKey = `${p.id}-${seatIndex}-${scatterIndex}`;
            const { left, top } = cardPositions[scatterIndex] ?? { left: '50%', top: '50%' };
            return (
              <Box
                key={scatterKey}
                onClick={() => canClick && openFor(p)}
                sx={{
                  position: 'absolute',
                  left,
                  top,
                  transform: 'translate(-50%, -50%)',
                  cursor: canClick ? 'pointer' : 'default',
                  opacity: isSelf ? 0.55 : 1,
                  zIndex: 1,
                  '&:hover': canClick
                    ? {
                        zIndex: 4,
                        '& .cheer-card-inner': { transform: 'scale(1.05)' },
                      }
                    : undefined,
                }}
              >
                <Box
                  className="cheer-card-inner"
                  sx={{
                    position: 'relative',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <MuscleBadge count={count} />
                  <FeedAvatar avatarUrl={p.avatarUrl} nickname={p.nickname} size={fieldAvatarPx} />
                  <Box
                    sx={{
                      mt: 0.5,
                      maxWidth: isCheerCompact ? 108 : 140,
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      display="block"
                      fontWeight={800}
                      sx={{
                        lineHeight: 1.2,
                        fontSize: isCheerCompact ? '0.78rem' : '0.9rem',
                        textShadow: (t) => `0 0 10px ${t.palette.background.paper}`,
                      }}
                    >
                      {p.nickname}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );

  const feed = (
    <Paper
      elevation={0}
      sx={{
        border: (t) => `1px solid ${t.palette.divider}`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: { xs: 360, md: 520 },
        minHeight: 240,
        overflow: 'hidden',
      }}
    >
      <Typography variant="subtitle2" fontWeight={800} sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        Стрічка підтримки
      </Typography>
      <Box sx={{ overflow: 'auto', flex: 1, p: 1 }}>
        {loading ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
            Завантаження…
          </Typography>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
            Ще ніхто не надіслав побажання. Будь першим!
          </Typography>
        ) : (
          <Stack spacing={1.25}>
            {items.map((c) => (
              <Paper key={c.id} variant="outlined" sx={{ p: 1, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                <Stack spacing={0.75}>
                  <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap" sx={{ rowGap: 0.5 }}>
                    <Typography variant="body2" fontWeight={800} component="span">
                      Підтримали
                    </Typography>
                    <FeedAvatar avatarUrl={c.toUser.avatarUrl} nickname={c.toUser.nickname} size={feedAvatarToPx} />
                    <Typography variant="body2" fontWeight={700} component="span">
                      {c.toUser.nickname}:
                    </Typography>
                    <Typography variant="body2" component="span" sx={{ fontStyle: 'italic' }}>
                      «{c.message}»
                    </Typography>
                  </Stack>
                  {c.fromUser ? (
                    <Stack direction="row" alignItems="center" gap={0.5} sx={{ opacity: 0.8 }}>
                      <Typography variant="caption" color="text.secondary">
                        від
                      </Typography>
                      <FeedAvatar avatarUrl={c.fromUser.avatarUrl} nickname={c.fromUser.nickname} size={feedAvatarFromPx} />
                      <Typography variant="caption" color="text.secondary">
                        {c.fromUser.nickname}
                      </Typography>
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ pt: 1, width: '100%' }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {!isLoggedIn ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Увійдіть, щоб надіслати побажання учаснику.{' '}
          <Button component={Link} to="/login" size="small" sx={{ ml: 0.5 }}>
            Увійти
          </Button>
        </Alert>
      ) : null}
      {isLoggedIn && alreadyCheered ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Дякуємо! Ви вже підтримали учасника в цьому турнірі.
        </Alert>
      ) : null}

      {!alreadyCheered ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, maxWidth: 640, lineHeight: 1.45, fontStyle: 'italic' }}
        >
          Обери ОДНОГО за кого тримаєш кулаки ✊
        </Typography>
      ) : null}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
        <Box sx={{ flex: 1, minWidth: 0 }}>{fieldPaper}</Box>
        <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>{feed}</Box>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => !sending && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Підтримати: {selected?.nickname}</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Коротке побажання (від руки або обери фразу):
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} size="small" label={s} onClick={() => appendSuggestion(s)} variant="outlined" />
            ))}
          </Stack>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            placeholder="Твоє побажання…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            inputProps={{ maxLength: 220 }}
            sx={(t) => ({
              mt: 0.5,
              '& textarea.MuiOutlinedInput-input': {
                lineHeight: 1.5,
                fontFamily: t.typography.body1.fontFamily,
                resize: 'vertical',
              },
            })}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {message.length}/220
          </Typography>
          <FormControlLabel
            sx={{ mt: 1.5, alignItems: 'flex-start', ml: 0 }}
            control={
              <Checkbox
                checked={cheerAnonymous}
                onChange={(_, v) => setCheerAnonymous(v)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2" component="span" display="block">
                  Надіслати анонімно
                </Typography>
              </Box>
            }
          />
        </DialogContent>
        <DialogActions sx={{ gap: 1, px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)} disabled={sending}>
            Скасувати
          </Button>
          <Button
            variant="contained"
            onClick={() => void send()}
            disabled={sending || message.trim().length < 1}
            sx={(th) => ({
              boxShadow: 'none',
              backgroundImage: 'none',
              border: 'none',
              bgcolor: th.palette.primary.main,
              color: th.palette.common.white,
              '&:hover': {
                bgcolor: th.palette.primary.dark,
                color: th.palette.common.white,
                boxShadow: 'none',
                backgroundImage: 'none',
              },
              '&.Mui-disabled': {
                bgcolor: th.palette.action.disabledBackground,
                color: th.palette.action.disabled,
                backgroundImage: 'none',
              },
            })}
          >
            Надіслати
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
