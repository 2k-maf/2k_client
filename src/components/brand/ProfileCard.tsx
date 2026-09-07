import * as React from 'react';
import Box from '@mui/material/Box';
import { brandColors, brandFonts, monoSx } from '../../theme/brand';

type Props = {
  /** Іконка розділу — суто декоративна. */
  icon: React.ReactNode;
  /** Моно-напис над заголовком. */
  label: string;
  title: string;
  /** Пояснення під заголовком. */
  hint?: string;
  children: React.ReactNode;
};

/** Панель дії в кабінеті: іконка, заголовок, підказка і форма. */
export default function ProfileCard({ icon, label, title, hint, children }: Props) {
  return (
    <Box
      sx={{
        background: brandColors.panel,
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '16px',
        p: 2.75,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box aria-hidden sx={{ display: 'flex', color: brandColors.accentHover }}>
          {icon}
        </Box>
        <Box component="span" sx={{ ...monoSx(11, brandColors.accentHover), letterSpacing: '0.16em' }}>
          {label}
        </Box>
      </Box>
      <Box
        component="span"
        sx={{ fontFamily: brandFonts.display, fontWeight: 900, fontSize: 22, letterSpacing: '-0.01em' }}
      >
        {title}
      </Box>
      {hint && (
        <Box component="span" sx={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(242,243,247,0.6)' }}>
          {hint}
        </Box>
      )}
      <Box sx={{ mt: 'auto', pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {children}
      </Box>
    </Box>
  );
}

/** Сітка панелей кабінету. */
export function ProfileCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 2,
        alignItems: 'stretch',
      }}
    >
      {children}
    </Box>
  );
}
