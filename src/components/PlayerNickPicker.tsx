import * as React from 'react';
import {
  Autocomplete,
  Box,
  Dialog,
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
import { brandColors } from '../theme/brand';
import { nickMatches } from '../nickSearch';

export type NickOption = {
  _id?: string;
  title: string;
  inputValue?: string;
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

function optionsForQuery(
  query: string,
  eveningOpts: NickOption[],
  clubOpts: NickOption[],
  browseOptions: NickOption[],
): NickOption[] {
  const searching = Boolean(query.trim());
  const pool = searching ? [...eveningOpts, ...clubOpts] : browseOptions;
  return pool.filter((o) => nickMatches(o.title, query));
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
  const listRef = React.useRef<HTMLDivElement | null>(null);

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
    setOpen(true);
  };

  // Без запиту — гравці цього вечора. Клуб лише в пошуку.
  // Парна команда турніру і так вузька: обидва id видимі одразу.
  const browseOptions = React.useMemo(
    () => (pendingIds?.length ? [...eveningOpts, ...clubOpts] : eveningOpts),
    [pendingIds, eveningOpts, clubOpts],
  );

  React.useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = 0;
    });
    return () => cancelAnimationFrame(id);
  }, [open, q]);

  const pick = (title: string, id: string) => {
    onPick(title || `Гість ${seat}`, id || '');
    setOpen(false);
  };

  const isDefaultGuest = !value.trim() || value.trim().startsWith('Гість');
  const canClear = !disabled && !isDefaultGuest;
  const clearSeat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPick(`Гість ${seat}`, '');
  };

  if (isMobile) {
    const searching = Boolean(q.trim());
    const visible = optionsForQuery(q, eveningOpts, clubOpts, browseOptions);

    return (
      <>
        <TextField
          size="small"
          fullWidth
          disabled={disabled}
          value={value}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            // Не фокусити поле. blur() в onFocus лишав Mui-focused,
            // і тема малювала рамку червоною після закриття модалки.
            e.preventDefault();
          }}
          onClick={openModal}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openModal();
            }
          }}
          inputProps={{ readOnly: true, 'aria-label': `Нік гравця ${seat}` }}
          InputProps={{
            endAdornment: canClear ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={`Прибрати гравця з місця ${seat}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={clearSeat}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
          sx={{
            '& .MuiOutlinedInput-root': { cursor: disabled ? 'default' : 'pointer' },
          }}
        />
        <Dialog
          fullScreen
          open={open}
          disableRestoreFocus
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
                onChange={(e) => setQ(e.target.value)}
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
            {/* Скрол на обгортці: тема робить MuiList flex-колонкою — flex:1 на List
                розтягував єдиний хіт на всю висоту (виглядало як вертикальний центр). */}
            <Box
              ref={listRef}
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch',
                pb: 'env(safe-area-inset-bottom)',
              }}
            >
              <List
                disablePadding
                sx={{
                  display: 'block',
                  py: 0,
                  height: 'auto',
                  flex: 'none',
                  justifyContent: 'flex-start',
                  '& .MuiListItemButton-root': { flex: '0 0 auto' },
                }}
              >
                {visible.map((o) => (
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
                {searching && visible.length === 0 && (
                  <Typography sx={{ px: 2, py: 2, color: 'text.secondary', fontSize: 14 }}>
                    Нікого не знайдено
                  </Typography>
                )}
              </List>
            </Box>
          </Box>
        </Dialog>
      </>
    );
  }

  return (
    <Autocomplete
      size="small"
      disabled={disabled}
      value={value}
      disableClearable={!canClear}
      onChange={(_e, newValue) => {
        if (newValue == null || newValue === '') {
          onPick(`Гість ${seat}`, '');
          return;
        }
        if (typeof newValue === 'string') {
          onPick(newValue, '');
          return;
        }
        if (newValue.inputValue) {
          onPick(String(newValue.inputValue), '');
          return;
        }
        onPick(newValue.title || `Гість ${seat}`, newValue._id ? String(newValue._id) : '');
      }}
      filterOptions={(_options, params) => {
        const { inputValue } = params;
        const searching = Boolean(inputValue.trim());
        const filtered = optionsForQuery(inputValue, eveningOpts, clubOpts, browseOptions);
        const isExisting = [...eveningOpts, ...clubOpts].some((o) => inputValue === o.title);
        if (searching && freeSolo && !isExisting) {
          filtered.push({
            inputValue,
            title: `Додати «${inputValue}»`,
          });
        }
        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      options={browseOptions}
      freeSolo={freeSolo}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        if (option.inputValue) return option.inputValue;
        return option.title;
      }}
      isOptionEqualToValue={(opt, val) => {
        if (typeof val === 'string') return opt.title === val;
        return String(opt._id || '') === String(val._id || '') && opt.title === val.title;
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
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
