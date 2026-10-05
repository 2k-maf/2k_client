import * as React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Avatar from '@mui/material/Avatar';
import { brandColors, brandFonts, fg, withAlpha } from '../../theme/brand';
import { formatSeasonLabel, Podium, PodiumWinner } from '../../utils/podium';

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

/** Наскільки слово-привид виходить за нижній край картки, px. Одне значення на всі картки. */
const GHOST_BOTTOM = -10;

/** Прозорість слова-привида. Одне значення на всі картки. */
const GHOST_ALPHA = 0.25;

const CARD_STYLES: CardStyle[] = [
  {
    ghost: 'Чемпіон',
    ghostColor: withAlpha(brandColors.accent, GHOST_ALPHA),
    ghostSize: 64,
    ghostSide: 'right',
    rotate: -2.5,
    ring: brandColors.accent,
    background: brandColors.panelAlt,
    border: `1px solid ${withAlpha(brandColors.accent, 0.5)}`,
    avatarSize: 60,
    nameSize: 30,
  },
  {
    ghost: 'MVP',
    ghostColor: fg(GHOST_ALPHA),
    ghostSize: 72,
    ghostSide: 'left',
    rotate: 2,
    ring: fg(0.55),
    background: brandColors.panel,
    border: `1px solid ${fg(0.12)}`,
    avatarSize: 56,
    nameSize: 26,
    alignEnd: true,
  },
  {
    ghost: 'Топ мафія',
    ghostColor: withAlpha(brandColors.ember, GHOST_ALPHA),
    ghostSize: 52,
    ghostSide: 'right',
    rotate: -1.5,
    ring: brandColors.ember,
    background: brandColors.panel,
    border: `1px solid ${fg(0.12)}`,
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
  // Нижній відступ більший: він тримає вміст вище смуги слова-привида.
  pt: 3,
  pb: 5.5,
  minHeight: 150,
  display: 'flex',
  alignItems: 'center',
  justifyContent: style.alignEnd ? 'flex-end' : 'flex-start',
  boxShadow: `0 8px 24px ${withAlpha(brandColors.shadow, 0.32)}`,
  position: 'relative',
  zIndex: CARD_STYLES.length - index,
  overflow: 'hidden',
});

function GhostWord({ style }: { style: CardStyle }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        [style.ghostSide]: 14,
        bottom: GHOST_BOTTOM,
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
  );
}

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
          color: brandColors.text,
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

/** CSS-печатка для порожньої номінації — картка лишається, місце позначене як вакантне. */
function VacantStamp({ periodName }: { periodName?: string | null }) {
  const season = formatSeasonLabel(periodName, '');
  return (
    <Box
      aria-label="Місце вакантне"
      sx={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        px: 2,
        py: 1.25,
        transform: 'rotate(-14deg)',
        border: `2.5px solid ${withAlpha(brandColors.accent, 0.72)}`,
        borderRadius: '6px',
        boxShadow: `inset 0 0 0 1px ${withAlpha(brandColors.accent, 0.35)}`,
        color: withAlpha(brandColors.accent, 0.78),
        fontFamily: brandFonts.display,
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1.05,
        userSelect: 'none',
        opacity: 0.92,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 3,
          border: `1px dashed ${withAlpha(brandColors.accent, 0.45)}`,
          borderRadius: '3px',
          pointerEvents: 'none',
        },
      }}
    >
      <Box component="span" sx={{ fontSize: 15, whiteSpace: 'nowrap', position: 'relative' }}>
        Місце вакантне
      </Box>
      {season ? (
        <Box
          component="span"
          sx={{
            fontFamily: brandFonts.mono,
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'none',
            opacity: 0.85,
            whiteSpace: 'nowrap',
            position: 'relative',
          }}
        >
          {season}
        </Box>
      ) : null}
    </Box>
  );
}

function PodiumRow({ winner, style, index }: { winner: PodiumWinner; style: CardStyle; index: number }) {
  return (
    <Box sx={cardSx(style, index)}>
      <GhostWord style={style} />
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
        <PodiumBadge
          avatarUrl={winner.avatarUrl}
          letter={winner.nickname?.trim()?.[0]?.toUpperCase() || '?'}
          style={style}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <Box
            component="span"
            sx={{
              fontFamily: brandFonts.display,
              fontWeight: 900,
              fontSize: style.nameSize,
              lineHeight: 1.2,
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
            sx={{
              fontFamily: brandFonts.mono,
              fontSize: 12,
              lineHeight: 1.5,
              color: fg(0.6),
            }}
          >
            {winner.stat}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function PodiumVacantRow({
  style,
  index,
  periodName,
}: {
  style: CardStyle;
  index: number;
  periodName?: string | null;
}) {
  return (
    <Box sx={cardSx(style, index)}>
      <GhostWord style={style} />
      <VacantStamp periodName={periodName} />
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
          sx={{ bgcolor: fg(0.06), flex: 'none' }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, flex: 1, maxWidth: 220 }}>
          <Skeleton
            variant="rounded"
            animation="wave"
            height={style.nameSize * 0.8}
            sx={{ bgcolor: fg(0.07), width: '65%' }}
          />
          <Skeleton
            variant="rounded"
            animation="wave"
            height={12}
            sx={{ bgcolor: fg(0.05), width: '90%' }}
          />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * П'єдестал сезону трьома нахиленими картками. Поки рейтинг вантажиться —
 * показуємо скелетони, щоб блок не стрибав і не зникав. Порожня номінація —
 * картка з печаткою «Місце вакантне».
 */
export default function PodiumStack({
  podium,
  loading,
  periodName,
}: {
  podium: Podium;
  loading?: boolean;
  periodName?: string | null;
}) {
  const winners = [podium.champion, podium.mvp, podium.bestMafia];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', px: { xs: 1.5, md: 1 }, py: 1 }}>
      {CARD_STYLES.map((style, i) => {
        const winner = winners[i];
        if (loading) {
          return <PodiumRowSkeleton key={style.ghost} style={style} index={i} />;
        }
        if (!winner) {
          return (
            <PodiumVacantRow
              key={style.ghost}
              style={style}
              index={i}
              periodName={periodName}
            />
          );
        }
        return <PodiumRow key={style.ghost} winner={winner} style={style} index={i} />;
      })}
    </Box>
  );
}
