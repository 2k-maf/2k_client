import * as React from 'react';
import Box from '@mui/material/Box';
import { brandColors, brandFonts } from '../../theme/brand';
import { publicStaticUrl } from '../../utils/mediaUrl';

/** Картка форми з макета: знак, заголовок і вміст. */
export default function BrandFormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        background: brandColors.panel,
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '16px',
        p: { xs: 3, md: 4.5 },
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
        <Box
          component="img"
          src={publicStaticUrl('/brand/dk-mark-red.png')}
          alt=""
          sx={{ height: 44, width: 'auto', display: 'block' }}
        />
        <Box
          component="span"
          sx={{
            fontFamily: brandFonts.display,
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Box>
      </Box>
      {children}
    </Box>
  );
}
