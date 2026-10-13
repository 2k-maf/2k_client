import * as React from 'react';
import Box from '@mui/material/Box';
import { brandColors, monoSx, fg } from '../../theme/brand';

export type LegendItem = {
  /** Скорочення або іконка з заголовка колонки. */
  term: React.ReactNode;
  /** Розшифровка простими словами. */
  text: string;
};

/**
 * Легенда скорочень під таблицею. Видна завжди: на телефоні підказка при
 * наведенні не працює, тож розшифровка має стояти текстом на сторінці.
 */
export default function AbbrLegend({ items, children }: { items: LegendItem[]; children?: React.ReactNode }) {
  // dl допускає лише пари dt/dd, тож посилання з children стоїть поруч, а не всередині.
  const rowSx = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2.5, rowGap: 1 } as const;
  return (
    <Box sx={{ ...rowSx, px: 1.5, pt: 1, ...monoSx(12, fg(0.6)) }}>
      <Box component="dl" sx={{ ...rowSx, m: 0 }}>
        {items.map((item, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box component="dt" sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: brandColors.text }}>
              {item.term}
            </Box>
            <Box component="dd" sx={{ m: 0 }}>
              {item.text}
            </Box>
          </Box>
        ))}
      </Box>
      {children}
    </Box>
  );
}
