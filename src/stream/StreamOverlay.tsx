import React, { useEffect, useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { publicStaticUrl, resolveMediaUrl } from '../utils/mediaUrl';
import styles from './StreamOverlay.module.css';
import { avatarOnPublicSite, type OverlayGame, type OverlayPlayer } from './overlayState';
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
  return (
    <section className={styles.panel} aria-label="Гра і номінація">
      <div className={styles.panelHead}>Гра {game.game}</div>
      <div className={styles.panelLabel}>Номіновані</div>
      <div className={styles.nominated}>
        {game.nominated.map((seat) => (
          <span key={seat} className={styles.nomSeat}>{seat}</span>
        ))}
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

function PlayerCard({ player }: { player: OverlayPlayer }) {
  const roleIcon = player.role ? ROLE_ICON[player.role] : undefined;
  return (
    <article className={player.eliminated ? `${styles.card} ${styles.eliminated}` : styles.card}>
      <div className={styles.photo}>
        <PlayerPhoto player={player} />
        {roleIcon && (
          <span className={`${styles.roleIcon} ${player.role === 'don' ? styles.don : styles.sher}`}>
            <img src={roleIcon} alt={player.role === 'don' ? 'Дон' : 'Шериф'} />
          </span>
        )}
      </div>
      <div className={styles.namebar}>
        <span className={styles.seat}>{player.seat}</span>
        <span className={styles.nick}>{player.nickname}</span>
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
