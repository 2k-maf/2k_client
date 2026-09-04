import * as React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
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
    ghostColor: 'rgba(250,43,30,0.24)',
    ghostSize: 64,
    ghostSide: 'right',
    rotate: -2.5,
    ring: brandColors.accent,
    background: brandColors.panelAlt,
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
    ring: 'rgba(255,255,255,0.55)',
    background: brandColors.panel,
    border: '1px solid rgba(255,255,255,0.12)',
    avatarSize: 56,
    nameSize: 26,
    alignEnd: true,
  },
  {
    ghost: 'Топ мафія',
    ghostColor: 'rgba(255,138,94,0.20)',
    ghostSize: 52,
    ghostSide: 'right',
    rotate: -1.5,
    ring: brandColors.ember,
    background: brandColors.panel,
    border: '1px solid rgba(255,255,255,0.12)',
    avatarSize: 56,
    nameSize: 26,
  },
];

/** Спільна геометрія картки — щоб скелетон і готова картка збігалися піксель у піксель. */
const cardSx = (style: CardStyle, index: number) => ({
  transform: `rotate(${style.rotate}deg)`,
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
});

/**
 * Аватар гравця в кольоровому кільці. Якщо фото немає — ініціал, як на макеті.
 * Кільце малюємо окремим шаром, щоб воно лежало поверх фото.
 */
function PodiumBadge({
  avatarUrl,
  letter,
  style,
}: {
  avatarUrl?: string;
  letter: string;
  style: CardStyle;
}) {
  const ringWidth = 1.5;
  return (
    <Box sx={{ position: 'relative', width: style.avatarSize, height: style.avatarSize, flex: 'none' }}>
      <Avatar
        src={avatarUrl || undefined}
        sx={{
          width: style.avatarSize,
          height: style.avatarSize,
          bgcolor: brandColors.border,
          fontFamily: brandFonts.display,
          fontWeight: 900,
          fontSize: style.avatarSize / 2.7,
          color: '#fff',
        }}
      >
        {letter}
      </Avatar>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '999px',
          border: `${ringWidth}px solid ${style.ring}`,
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}

function PodiumRow({ winner, style, index }: { winner: PodiumWinner; style: CardStyle; index: number }) {
  return (
    <Box sx={cardSx(style, index)}>
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
          color: style.ghostColor,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {style.ghost}
      </Box>
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
        <PodiumBadge
          avatarUrl={winner.avatarUrl}
          letter={winner.nickname?.trim()?.[0]?.toUpperCase() || '?'}
          style={style}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, minWidth: 0 }}>
          <Box
            component="span"
            sx={{
              fontFamily: brandFonts.display,
              fontWeight: 900,
              fontSize: style.nameSize,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {winner.nickname?.trim()}
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

/** Заглушка тієї ж форми — показуємо, поки не приїхав рейтинг. */
function PodiumRowSkeleton({ style, index }: { style: CardStyle; index: number }) {
  return (
    <Box sx={cardSx(style, index)}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
        <Skeleton
          variant="circular"
          animation="wave"
          width={style.avatarSize}
          height={style.avatarSize}
          sx={{ bgcolor: 'rgba(255,255,255,0.06)', flex: 'none' }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.9, flex: 1, maxWidth: 220 }}>
          <Skeleton
            variant="rounded"
            animation="wave"
            height={style.nameSize * 0.8}
            sx={{ bgcolor: 'rgba(255,255,255,0.07)', width: '65%' }}
          />
          <Skeleton
            variant="rounded"
            animation="wave"
            height={12}
            sx={{ bgcolor: 'rgba(255,255,255,0.05)', width: '90%' }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * П'єдестал сезону трьома нахиленими картками. Поки рейтинг вантажиться —
 * показуємо скелетони, щоб блок не стрибав і не зникав.
 */
export default function PodiumStack({ podium, loading }: { podium: Podium; loading?: boolean }) {
  const winners = [podium.champion, podium.mvp, podium.bestMafia];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', px: { xs: 1.5, md: 1 }, py: 1 }}>
      {CARD_STYLES.map((style, i) => {
        const winner = winners[i];
        if (loading) {
          return <PodiumRowSkeleton key={style.ghost} style={style} index={i} />;
        }
        // Порожня номінація (напр. сезон без жодних бонусних балів) — картки просто немає.
        if (!winner) return null;
        return <PodiumRow key={style.ghost} winner={winner} style={style} index={i} />;
      })}
    </Box>
  );
}
