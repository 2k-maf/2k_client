import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import AppAppBar from '../AppAppBar';
import Footer from '../Footer';
import { brandColors, brandFonts } from '../../theme/brand';

export type DocTab = { label: string; to: string };

/** Перемикач між сторінками правил — активна вкладка підсвічена червоним. */
function DocTabs({ tabs, activeTo }: { tabs: DocTab[]; activeTo: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
      {tabs.map((tab) => {
        const active = tab.to === activeTo;
        return (
          <Box
            key={tab.to}
            component={RouterLink}
            to={tab.to}
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

/** Пронумерована секція документа: велика цифра ліворуч, вміст праворуч. */
export function DocSection({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '40px minmax(0,1fr)', md: '64px minmax(0,1fr)' },
        gap: 3,
        py: 4,
        borderTop: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          fontFamily: brandFonts.display,
          fontWeight: 900,
          fontSize: { xs: 28, md: 40 },
          lineHeight: 0.9,
          color: 'rgba(255,255,255,0.14)',
        }}
      >
        {String(index).padStart(2, '0')}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, minWidth: 0 }}>
        <Typography
          variant="h2"
          sx={{
            m: 0,
            fontFamily: brandFonts.display,
            fontWeight: 900,
            fontSize: 26,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>
        {children}
      </Box>
    </Box>
  );
}

/** Абзац документа. */
export function DocText({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        m: 0,
        maxWidth: '70ch',
        fontSize: 16,
        lineHeight: 1.65,
        color: 'rgba(242,243,247,0.72)',
        textWrap: 'pretty',
        '& strong': { color: brandColors.text },
      }}
    >
      {children}
    </Typography>
  );
}

/** Картка в сітці — фази гри, умови перемоги тощо. */
export function DocCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

export function DocCard({
  label,
  labelColor = brandColors.text,
  title,
  filled = true,
  borderColor = 'rgba(255,255,255,0.10)',
  children,
}: {
  label?: string;
  labelColor?: string;
  title?: string;
  filled?: boolean;
  borderColor?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        background: filled ? brandColors.panel : 'transparent',
        border: `1px solid ${borderColor}`,
        borderRadius: '16px',
        p: 2.75,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
      }}
    >
      {label && (
        <Box
          component="span"
          sx={{
            fontFamily: brandFonts.mono,
            fontSize: 11,
            letterSpacing: '0.16em',
            color: labelColor,
          }}
        >
          {label}
        </Box>
      )}
      {title && (
        <Box
          component="span"
          sx={{ fontFamily: brandFonts.display, fontWeight: 900, fontSize: 22, color: labelColor }}
        >
          {title}
        </Box>
      )}
      <Box sx={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(242,243,247,0.7)' }}>{children}</Box>
    </Box>
  );
}

/** Каркас сторінки-документа: шапка з вкладками, секції, футер. */
export default function DocPage({
  eyebrow = 'Правила',
  title,
  tabs,
  activeTo,
  children,
}: {
  eyebrow?: string;
  title: string;
  tabs: DocTab[];
  activeTo: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: brandColors.bg,
        color: brandColors.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppAppBar />
      <Box
        sx={{
          flex: 1,
          px: { xs: 2.5, md: 6 },
          pt: { xs: 11, md: 13 },
          pb: 8,
          maxWidth: 1280,
          width: '100%',
          mx: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 4,
            pb: 4.5,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            <Box
              component="span"
              sx={{
                fontFamily: brandFonts.mono,
                fontSize: 11,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: brandColors.accentHover,
              }}
            >
              {eyebrow}
            </Box>
            <Typography
              variant="h1"
              sx={{
                m: 0,
                fontFamily: brandFonts.display,
                fontWeight: 900,
                fontSize: 'clamp(40px,5vw,64px)',
                lineHeight: 0.95,
                letterSpacing: '-0.04em',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </Typography>
          </Box>
          <DocTabs tabs={tabs} activeTo={activeTo} />
        </Box>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
