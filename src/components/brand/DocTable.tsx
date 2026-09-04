import * as React from 'react';
import Box from '@mui/material/Box';
import { brandColors, brandFonts } from '../../theme/brand';

export type PillTone = 'positive' | 'negative' | 'neutral' | 'accent' | 'light';

const PILL_TONES: Record<PillTone, { bg: string; color: string }> = {
  positive: { bg: 'rgba(37,204,128,0.14)', color: brandColors.positive },
  negative: { bg: 'rgba(250,43,30,0.14)', color: brandColors.negative },
  neutral: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(242,243,247,0.7)' },
  accent: { bg: 'rgba(250,43,30,0.14)', color: brandColors.accentHover },
  light: { bg: 'rgba(255,255,255,0.10)', color: brandColors.band },
};

/** Значення-пігулка: бали, команда, колір вибору. */
export function Pill({ tone = 'neutral', children }: { tone?: PillTone; children: React.ReactNode }) {
  const { bg, color } = PILL_TONES[tone];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: brandFonts.mono,
        fontSize: 11,
        letterSpacing: '0.08em',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Box>
  );
}

type Align = 'left' | 'right';

/**
 * Таблиця документа: моно-шапка і рядки на CSS-сітці, як у макеті.
 * `columns` задає ширини, `align` — вирівнювання останніх колонок.
 */
export default function DocTable({
  columns,
  headers,
  rows,
  align = [],
}: {
  columns: string;
  headers: string[];
  rows: React.ReactNode[][];
  align?: Align[];
}) {
  const alignOf = (i: number) => align[i] ?? 'left';
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 520 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: columns,
            gap: 2,
            py: 1.25,
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            fontFamily: brandFonts.mono,
            fontSize: 11,
            letterSpacing: '0.14em',
            color: 'rgba(242,243,247,0.45)',
          }}
        >
          {headers.map((h, i) => (
            <Box key={h} component="span" sx={{ textAlign: alignOf(i) }}>
              {h}
            </Box>
          ))}
        </Box>
        {rows.map((row, rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              display: 'grid',
              gridTemplateColumns: columns,
              gap: 2,
              alignItems: 'center',
              py: 1.75,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              fontSize: 15,
            }}
          >
            {row.map((cell, i) => (
              <Box key={i} component="span" sx={{ textAlign: alignOf(i), minWidth: 0 }}>
                {cell}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
