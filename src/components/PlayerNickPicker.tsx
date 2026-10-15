import * as React from 'react';
import {
  Autocomplete,
  Box,
  createFilterOptions,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { brandColors, fg } from '../theme/brand';

export type NickOption = {
  _id?: string;
  title: string;
  inputValue?: string;
  /** Маркер рядка «інші гравці» у desktop-списку */
  __othersToggle?: boolean;
  __group?: 'evening' | 'others';
  __guest?: boolean;
};

type EveningPlayer = { id: string; title: string };

type Props = {
  seat: number;
  value: string;
  disabled?: boolean;
  freeSolo?: boolean;
  clubUsers: Array<{ _id?: string; nickname?: string }>;
  eveningPlayers: EveningPlayer[];
  /** Якщо задано — лише ці id (парна команда турніру). */
  pendingIds?: string[];
  onPick: (title: string, id: string) => void;
};

const filter = createFilterOptions<NickOption>();

function eveningKey(p: { id?: string; title: string }) {
  return p.id ? `id:${p.id}` : `nick:${p.title.trim().toLowerCase()}`;
}

function toEveningOptions(eveningPlayers: EveningPlayer[]): NickOption[] {
  return eveningPlayers.map((p) => ({
    _id: p.id || undefined,
    title: p.title,
    __group: 'evening',
    __guest: !p.id,
  }));
}

function toClubOptions(
  clubUsers: Props['clubUsers'],
  eveningKeys: Set<string>,
): NickOption[] {
  return clubUsers
    .map((u) => ({
      _id: u._id != null ? String(u._id) : undefined,
      title: String(u.nickname || ''),
      __group: 'others' as const,
    }))
    .filter((o) => o.title && !eveningKeys.has(eveningKey({ id: o._id, title: o.title })));
}

export default function PlayerNickPicker({
  seat,
  value,
  disabled,
  freeSolo = true,
  clubUsers,
  eveningPlayers,
  pendingIds,
  onPick,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [othersOpen, setOthersOpen] = React.useState(false);
  const [deskOthersOpen, setDeskOthersOpen] = React.useState(false);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  const eveningOpts = React.useMemo(() => {
    if (pendingIds?.length) {
      const allow = new Set(pendingIds.map(String));
      return toEveningOptions(eveningPlayers.filter((p) => p.id && allow.has(String(p.id))));
    }
    return toEveningOptions(eveningPlayers);
  }, [eveningPlayers, pendingIds]);

  const eveningKeys = React.useMemo(
    () => new Set(eveningOpts.map((o) => eveningKey({ id: o._id, title: o.title }))),
    [eveningOpts],
  );

  const clubOpts = React.useMemo(() => {
    const base = pendingIds?.length
      ? clubUsers.filter((u) => pendingIds.includes(String(u._id)))
      : clubUsers;
    return toClubOptions(base, eveningKeys);
  }, [clubUsers, eveningKeys, pendingIds]);

  const openModal = () => {
    if (disabled) return;
    setQ('');
    // Немає топу вечора — одразу показуємо клуб, без порожньої дірки.
    setOthersOpen(eveningOpts.length === 0);
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = 0;
    });
    return () => cancelAnimationFrame(id);
  }, [open, q]);

  const matchQ = (title: string, query: string) => {
    if (!query.trim()) return true;
    return title.toLowerCase().includes(query.trim().toLowerCase());
  };

  const pick = (title: string, id: string) => {
    onPick(title || `Гість ${seat}`, id || '');
    setOpen(false);
  };

  const sectionLabelSx = {
    display: 'block',
    px: 2,
    pt: 1.5,
    pb: 0.5,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'text.secondary',
  } as const;

  if (isMobile) {
    const searching = Boolean(q.trim());
    const eveningVisible = eveningOpts.filter((o) => matchQ(o.title, q));
    const showOthers = searching || othersOpen || eveningOpts.length === 0;
    const othersVisible = showOthers
      ? clubOpts.filter((o) => matchQ(o.title, q))
      : [];
    const hasEveningHits = eveningVisible.length > 0;
    const hasOtherHits = othersVisible.length > 0;
    // Під час пошуку заголовки секцій лише якщо обидві групи мають хіти.
    const showEveningLabel = hasEveningHits && (!searching || hasOtherHits);
    const showOthersLabel =
      hasOtherHits &&
      (searching
        ? hasEveningHits
        : eveningOpts.length > 0);
    const showOthersToggle = !searching && eveningOpts.length > 0;

    return (
      <>
        <TextField
          size="small"
          fullWidth
          disabled={disabled}
          value={value}
          onClick={openModal}
          onFocus={(e) => {
            e.target.blur();
            openModal();
          }}
          inputProps={{ readOnly: true, 'aria-label': `Нік гравця ${seat}` }}
          sx={{
            '& .MuiOutlinedInput-root': { cursor: disabled ? 'default' : 'pointer' },
          }}
        />
        <Dialog
          fullScreen
          open={open}
          onClose={() => setOpen(false)}
          TransitionProps={{
            onEntered: () => {
              if (listRef.current) listRef.current.scrollTop = 0;
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              pt: 'env(safe-area-inset-top)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
                flexShrink: 0,
              }}
            >
              <IconButton aria-label="Закрити" onClick={() => setOpen(false)}>
                <ArrowBackIcon />
              </IconButton>
              <TextField
                autoFocus
                fullWidth
                size="small"
                placeholder="Пошук гравця"
                value={q}
                onChange={(e) => {
                  const next = e.target.value;
                  setQ(next);
                  if (next.trim()) setOthersOpen(true);
                }}
                InputProps={{
                  endAdornment: q ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label="Очистити"
                        onClick={() => setQ('')}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: brandColors.accent,
                      borderWidth: 1,
                    },
                    '&:hover fieldset': {
                      borderColor: brandColors.accent,
                      borderWidth: 1,
                    },
                    // MUI за замовчуванням робить focused border 2px — лишаємо 1px.
                    '&.Mui-focused fieldset': {
                      borderColor: brandColors.accent,
                      borderWidth: '1px !important',
                    },
                  },
                }}
              />
            </Box>
            <List
              ref={listRef}
              disablePadding
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                py: 0,
                pb: 'env(safe-area-inset-bottom)',
                display: 'block',
              }}
            >
              {showEveningLabel && (
                <Typography variant="caption" sx={sectionLabelSx}>
                  Цей вечір
                </Typography>
              )}
              {eveningVisible.map((o) => (
                <ListItemButton
                  key={eveningKey({ id: o._id, title: o.title })}
                  onClick={() => pick(o.title, o._id ? String(o._id) : '')}
                >
                  <ListItemText primary={o.title} />
                  {o.__guest && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                      гість
                    </Typography>
                  )}
                </ListItemButton>
              ))}
              {showOthersToggle && (
                <>
                  <Divider />
                  <ListItemButton
                    onClick={() => setOthersOpen((v) => !v)}
                    sx={{ justifyContent: 'space-between' }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'text.secondary',
                      }}
                    >
                      інші гравці
                    </Typography>
                    <ExpandMoreIcon
                      sx={{
                        color: 'text.secondary',
                        transform: othersOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s',
                      }}
                    />
                  </ListItemButton>
                </>
              )}
              {showOthersLabel && (
                <Typography variant="caption" sx={sectionLabelSx}>
                  інші гравці
                </Typography>
              )}
              {showOthers &&
                othersVisible.map((o) => (
                  <ListItemButton
                    key={String(o._id)}
                    onClick={() => pick(o.title, o._id ? String(o._id) : '')}
                  >
                    <ListItemText primary={o.title} />
                  </ListItemButton>
                ))}
              {showOthers && !hasEveningHits && !hasOtherHits && (
                <Typography sx={{ px: 2, py: 2, color: 'text.secondary', fontSize: 14 }}>
                  Нікого не знайдено
                </Typography>
              )}
            </List>
          </Box>
        </Dialog>
      </>
    );
  }

  // Desktop Autocomplete
  const deskOptions = React.useMemo(() => {
    if (eveningOpts.length === 0) return [...clubOpts];
    const opts: NickOption[] = [...eveningOpts];
    if (deskOthersOpen) opts.push(...clubOpts);
    opts.push({ title: 'інші гравці', __othersToggle: true });
    return opts;
  }, [eveningOpts, clubOpts, deskOthersOpen]);

  return (
    <Autocomplete
      size="small"
      disabled={disabled}
      value={value}
      onOpen={() => setDeskOthersOpen(eveningOpts.length === 0)}
      onChange={(_e, newValue) => {
        if (typeof newValue === 'string') {
          onPick(newValue, '');
          return;
        }
        if (!newValue || newValue.__othersToggle) return;
        if (newValue.inputValue) {
          onPick(String(newValue.inputValue), '');
          return;
        }
        onPick(newValue.title || `Гість ${seat}`, newValue._id ? String(newValue._id) : '');
      }}
      filterOptions={(options, params) => {
        const { inputValue } = params;
        if (inputValue.trim()) {
          const all = [...eveningOpts, ...clubOpts];
          const filtered = filter(all, params);
          const isExisting = all.some((o) => inputValue === o.title);
          if (freeSolo && !isExisting) {
            filtered.push({
              inputValue,
              title: `Додати «${inputValue}»`,
            });
          }
          // Один хіт / одна група — без групових заголовків (flat search).
          const eveHits = filtered.filter((o) => o.__group === 'evening').length;
          const othHits = filtered.filter((o) => o.__group === 'others').length;
          if (!(eveHits > 0 && othHits > 0)) {
            return filtered.map((o) =>
              o.__group ? { ...o, __group: undefined } : o,
            );
          }
          return filtered;
        }
        const noEvening = eveningOpts.length === 0;
        const othersExpanded = deskOthersOpen || noEvening;
        const evening = eveningOpts;
        const others = othersExpanded ? clubOpts : [];
        // Без вечора — лише список клубу, без зайвого toggle.
        if (noEvening) return others;
        return [
          ...evening,
          ...others,
          { title: 'інші гравці', __othersToggle: true },
        ];
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      options={deskOptions}
      freeSolo={freeSolo}
      getOptionDisabled={(option) => Boolean(option.__othersToggle)}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        if (option.inputValue) return option.inputValue;
        return option.title;
      }}
      isOptionEqualToValue={(opt, val) => {
        if (typeof val === 'string') return opt.title === val;
        return String(opt._id || '') === String(val._id || '') && opt.title === val.title;
      }}
      groupBy={(option) => {
        if (option.__othersToggle || option.inputValue) return '';
        if (option.__group === 'evening') return 'Цей вечір';
        if (option.__group === 'others') return 'інші гравці';
        return '';
      }}
      renderGroup={(params) => (
        <li key={params.key}>
          {params.group ? (
            <Typography
              component="div"
              variant="caption"
              sx={{
                px: 1.5,
                pt: 1,
                pb: 0.5,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              {params.group}
            </Typography>
          ) : null}
          <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
        </li>
      )}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        if (option.__othersToggle) {
          return (
            <li key={key} {...optionProps} style={{ padding: 0, opacity: 1 }}>
              <Divider />
              <Box
                component="div"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeskOthersOpen((v) => !v);
                }}
                sx={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 1.5,
                  py: 1.25,
                  cursor: 'pointer',
                  color: fg(0.55),
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  інші гравці
                </Typography>
                <ExpandMoreIcon
                  fontSize="small"
                  sx={{
                    transform: deskOthersOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              </Box>
            </li>
          );
        }
        return (
          <li key={key} {...optionProps}>
            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 1 }}>
              <span>{option.title}</span>
              {option.__guest && (
                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
                  гість
                </Typography>
              )}
            </Box>
          </li>
        );
      }}
      ListboxProps={{
        style: { maxHeight: 320 },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{ ...params.inputProps, 'aria-label': `Нік гравця ${seat}` }}
        />
      )}
    />
  );
}
