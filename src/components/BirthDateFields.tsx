import * as React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { daysInMonth, MonthDay, MONTHS_NOMINATIVE } from '../utils/birthDate';

const pad = (n: number) => String(n).padStart(2, '0');

/** День і місяць народження двома списками. Року немає навмисно. */
export default function BirthDateFields(props: {
  value: MonthDay;
  onChange: (value: MonthDay) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
  error?: boolean;
  /** Підпис для читачів екрана, наприклад нік учасника в таблиці. */
  ariaLabel?: string;
}) {
  const { value, onChange, disabled, size, error, ariaLabel } = props;
  const label = ariaLabel ? `${ariaLabel}: ` : '';
  const days = daysInMonth(value.month);

  return (
    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
      <TextField
        select
        size={size}
        label="День"
        value={value.day}
        disabled={disabled}
        error={error}
        onChange={(e) => onChange({ ...value, day: e.target.value })}
        slotProps={{ htmlInput: { 'aria-label': `${label}день народження` } }}
        sx={{ flex: '0 0 96px' }}
      >
        <MenuItem value="">—</MenuItem>
        {Array.from({ length: days }, (_, i) => (
          <MenuItem key={i} value={pad(i + 1)}>
            {i + 1}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size={size}
        label="Місяць"
        value={value.month}
        disabled={disabled}
        error={error}
        onChange={(e) => {
          const month = e.target.value;
          // 31 квітня не існує: день, якого немає в новому місяці, скидаємо.
          const day = Number(value.day) > daysInMonth(month) ? '' : value.day;
          onChange({ month, day });
        }}
        slotProps={{ htmlInput: { 'aria-label': `${label}місяць народження` } }}
        sx={{ flex: '1 1 auto', minWidth: 140 }}
      >
        <MenuItem value="">—</MenuItem>
        {MONTHS_NOMINATIVE.map((name, i) => (
          <MenuItem key={name} value={pad(i + 1)}>
            {name}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}
