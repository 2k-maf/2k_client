import * as React from 'react';
import Box from '@mui/material/Box';
import { Link as RouterLink } from 'react-router-dom';
import { brandColors } from '../../theme/brand';

export type BrandTab = { label: string; to: string };

/**
 * Рядок вкладок у шапці сторінки — активна підсвічена червоним.
 * Використовують і правила, і кабінет, тому вигляд живе в одному місці.
 */
export default function BrandTabs({ tabs, activeTo }: { tabs: BrandTab[]; activeTo: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const active = tab.to === activeTo;
        return (
          <Box
            key={tab.to}
            component={RouterLink}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            sx={{
              px: 2.5,
              py: 1.5,
              borderRadius: '12px',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              background: active ? 'rgba(250,43,30,0.12)' : 'transparent',
              border: `1px solid ${active ? 'rgba(250,43,30,0.5)' : 'rgba(255,255,255,0.12)'}`,
              color: active ? brandColors.accentHover : 'rgba(242,243,247,0.65)',
              '&:hover': { color: brandColors.accentHover },
            }}
          >
            {tab.label}
          </Box>
        );
      })}
    </Box>
  );
}
