import * as React from 'react';
import InputBase from '@mui/material/InputBase';
import { brandColors } from '../../theme/brand';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Доступна назва поля — воно без видимої мітки. */
  label?: string;
};

/** Поле пошуку в шапці сторінки. Один вигляд для рейтингу, учасників і клубів. */
export default function BrandSearchField({ value, onChange, placeholder, label }: Props) {
  return (
    <InputBase
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputProps={{ 'aria-label': label ?? placeholder }}
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: '12px',
        background: brandColors.panel,
        border: '1px solid rgba(255,255,255,0.10)',
        fontSize: 14,
        minWidth: 220,
        color: brandColors.text,
      }}
    />
  );
}
