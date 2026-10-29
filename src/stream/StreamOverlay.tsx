import React, { useEffect, useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { publicStaticUrl, resolveMediaUrl } from '../utils/mediaUrl';
import styles from './StreamOverlay.module.css';
import { avatarOnPublicSite, plateTone, type OverlayGame, type OverlayPlayer } from './overlayState';
import { useStreamOverlay } from './useStreamOverlay';

const STAGE_W = 1920;
const STAGE_H = 1080;
const CLUB_MARK = publicStaticUrl('/brand/dk-mark-navy.png');
const CLUB_LOGO = publicStaticUrl('/brand/dk-mark-red.png');

const ROLE_ICON: Partial<Record<NonNullable<OverlayPlayer['role']>, string>> = {
  don: publicStaticUrl('/stream/don.svg'),
  sher: publicStaticUrl('/stream/sheriff.svg'),
};

function useStagePlacement() {
  const [placement, setPlacement] = useState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    const fit = () => {
      const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
      setPlacement({
        scale,
        x: (window.innerWidth - STAGE_W * scale) / 2,
        y: (window.innerHeight - STAGE_H * scale) / 2,
      });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return placement;
}

/** Прозорий кадр до першого малюнка React: клас ставить скрипт у index.html. */
function useTransparentPage() {
  useEffect(() => {
    document.documentElement.classList.add('stream-overlay');
    return () => {
      if (!window.location.pathname.startsWith('/overlay')) {
        document.documentElement.classList.remove('stream-overlay');
      }
    };
  }, []);
}

function NominatedPanel({ game }: { game: OverlayGame }) {
  const roleAt = (seat: number) => game.players.find((player) => player.seat === seat)?.role ?? null;
  return (
    <section className={styles.panel} aria-label="Гра і голосування">
      <div className={styles.panelHead}>
        <span>Гра {game.game}</span>
        <span>Голосування</span>
      </div>
      <div className={styles.nominated}>
        {game.nominated.map((seat) => {
          const black = plateTone(roleAt(seat)) === 'steel';
          return (
            <span key={seat} className={black ? `${styles.nomSeat} ${styles.nomBlack}` : styles.nomSeat}>
              {seat}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function RefereePanel() {
  return (
    <aside className={styles.referee} aria-label="Dva Kol'ory">
      <div className={styles.brand}>
        <img className={styles.mark} src={CLUB_LOGO} alt="" />
        <span className={styles.wordmark}>DVA KOL'ORY</span>
      </div>
    </aside>
  );
}

function PlayerPhoto({ player }: { player: OverlayPlayer }) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaUrl(player.avatarUrl);
  const src = failed || !resolved ? undefined : avatarOnPublicSite(resolved);

  useEffect(() => setFailed(false), [player.avatarUrl]);

  if (!src) {
    return <img className={styles.fallback} src={CLUB_MARK} alt="" />;
  }
  return <img src={src} alt="" onError={() => setFailed(true)} />;
}

function OutMark({ kind }: { kind: 'killed' | 'left' }) {
  const killed = kind === 'killed';
  return (
    <span className={killed ? `${styles.outMark} ${styles.kill}` : styles.outMark} aria-label={killed ? 'Вбитий' : 'Пішов зі столу'}>
      {killed ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 21s-6.5-4.2-6.5-9A3.7 3.7 0 0 1 12 9.2 3.7 3.7 0 0 1 18.5 12C18.5 16.8 12 21 12 21z" />
          <path d="M12 8.2 14 12l-2 1.4 2 3.6" fill="none" stroke="#111" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M10 4H5v16h5v-2H7V6h3V4zm2.2 4.2 1.4-1.4L19 12l-5.4 5.2-1.4-1.4 2.8-2.8H9v-2h6l-2.8-2.8z" />
        </svg>
      )}
    </span>
  );
}

function PlayerCard({ player }: { player: OverlayPlayer }) {
  const roleIcon = player.role ? ROLE_ICON[player.role] : undefined;
  const tone = plateTone(player.role) === 'steel' ? ` ${styles.steel}` : '';
  const dimmed = player.eliminated ? ` ${styles.dimmed}` : '';
  const out = player.killed === 1 || player.killed === 2 ? 'killed' : player.killed === 3 ? 'left' : null;
  return (
    <article className={`${styles.card}${tone}`}>
      <div className={`${styles.photo}${dimmed}`}>
        <PlayerPhoto player={player} />
        {out && <OutMark kind={out} />}
        {roleIcon && (
          <span className={player.role === 'sher' ? `${styles.roleIcon} ${styles.sher}` : styles.roleIcon}>
            <img src={roleIcon} alt={player.role === 'don' ? 'Дон' : 'Шериф'} />
          </span>
        )}
      </div>
      <div className={styles.namebar}>
        <span className={styles.seat}>{player.seat}</span>
        <span className={styles.nick}>{player.nickname}</span>
        {player.fouls > 0 && (
          <span className={styles.fouls} aria-label={`Фолів: ${player.fouls}`}>
            {'!'.repeat(player.fouls)}
          </span>
        )}
      </div>
    </article>
  );
}

/** Прозорий кадр 1920×1080 для накладання на веб-стрім. Фон порожній, видно лише плашки. */
export default function StreamOverlay() {
  usePageTitle('Оверлей');
  useTransparentPage();
  const game = useStreamOverlay();
  const { scale, x, y } = useStagePlacement();

  return (
    <div className={styles.viewport}>
      <div
        className={styles.stage}
        data-stage
        style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }}
      >
        <NominatedPanel game={game} />
        <RefereePanel />
        <div className={styles.players}>
          {game.players.map((player) => (
            <PlayerCard key={player.seat} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}
