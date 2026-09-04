import * as React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { brandColors, brandFonts } from '../../theme/brand';
import { Podium, PodiumWinner } from '../../utils/podium';

type CardStyle = {
  /** Слово-привид на тлі картки. */
  ghost: string;
  ghostColor: string;
  ghostSize: number;
  ghostSide: 'left' | 'right';
  rotate: number;
  ring: string;
  background: string;
  border: string;
  avatarSize: number;
  nameSize: number;
  /** Вміст притиснуто праворуч (як у MVP на макеті). */
  alignEnd?: boolean;
};

const CARD_STYLES: CardStyle[] = [
  {
    ghost: 'Чемпіон',
    ghostColor: 'rgba(250,43,30,0.22)',
    ghostSize: 64,
    ghostSide: 'right',
    rotate: -2.5,
    ring: `inset 0 0 0 3px ${brandColors.accent}`,
    background: '#151a30',
    border: '1px solid rgba(250,43,30,0.5)',
    avatarSize: 60,
    nameSize: 30,
  },
  {
    ghost: 'MVP',
    ghostColor: 'rgba(255,255,255,0.10)',
    ghostSize: 72,
    ghostSide: 'left',
    rotate: 2,
    ring: 'inset 0 0 0 2px rgba(255,255,255,0.55)',
    background: brandColors.panel,
    border: '1px solid rgba(255,255,255,0.12)',
    avatarSize: 56,
    nameSize: 26,
    alignEnd: true,
  },
  {
    ghost: 'Найкраща\nмафія',
    ghostColor: 'rgba(255,138,94,0.20)',
    ghostSize: 44,
    ghostSide: 'right',
    rotate: -1.5,
    ring: `inset 0 0 0 2px ${brandColors.ember}`,
    background: brandColors.panel,
    border: '1px solid rgba(255,255,255,0.12)',
    avatarSize: 56,
    nameSize: 26,
  },
];

function PodiumRow({ winner, style, index }: { winner: PodiumWinner | null; style: CardStyle; index: number }) {
  if (!winner) return null;
  return (
    <Box
      sx={{
        transform: { xs: 'none', md: `rotate(${style.rotate}deg)` },
        mt: index === 0 ? 0 : '-2px',
        background: style.background,
        border: style.border,
        borderRadius: '16px',
        px: 3,
        py: 2.75,
        minHeight: 124,
        display: 'flex',
        alignItems: 'center',
        justifyContent: style.alignEnd ? 'flex-end' : 'flex-start',
        boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
        position: 'relative',
        zIndex: CARD_STYLES.length - index,
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          [style.ghostSide]: 14,
          bottom: -12,
          fontFamily: brandFonts.display,
          fontWeight: 900,
          fontSize: style.ghostSize,
          lineHeight: 0.98,
          letterSpacing: '-0.04em',
          textTransform: 'uppercase',
          textAlign: style.ghostSide,
          whiteSpace: 'pre-line',
          color: style.ghostColor,
          pointerEvents: 'none',
        }}
      >
        {style.ghost}
      </Box>
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          src={winner.avatarUrl || undefined}
          sx={{
            width: style.avatarSize,
            height: style.avatarSize,
            bgcolor: brandColors.border,
            boxShadow: style.ring,
            fontFamily: brandFonts.display,
            fontWeight: 900,
            fontSize: style.avatarSize / 2.7,
            color: '#fff',
          }}
        >
          {winner.nickname?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          <Box
            component="span"
            sx={{
              fontFamily: brandFonts.display,
              fontWeight: 900,
              fontSize: style.nameSize,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {winner.nickname}
          </Box>
          <Box
            component="span"
            sx={{ fontFamily: brandFonts.mono, fontSize: 12, color: 'rgba(242,243,247,0.6)' }}
          >
            {winner.stat}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/** П'єдестал сезону трьома нахиленими картками, як на макеті головної. */
export default function PodiumStack({ podium }: { podium: Podium }) {
  const winners = [podium.champion, podium.mvp, podium.bestMafia];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', px: 1, pb: 1 }}>
      {winners.map((winner, i) => (
        <PodiumRow key={CARD_STYLES[i].ghost} winner={winner} style={CARD_STYLES[i]} index={i} />
      ))}
    </Box>
  );
}
