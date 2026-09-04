/**
 * П'єдестал сезону — чемпіон, MVP та найкраща мафія — виводиться з того самого
 * списку гравців, що й таблиця рейтингу. Логіка живе тут, бо її показують два
 * екрани: `/clubs-rating` і головна.
 */

export type RatingPlayer = {
  nickname: string;
  avatarUrl?: string;
  rating: number;
  totalWins: number;
  totalGames: number;
  totalWinsRate: number;
  bonusPoints?: number;
  mafiaWins: number;
  mafiaGames: number;
  donWins: number;
  donGames: number;
  [key: string]: any;
};

export type RatingStats = { avgGames?: number; yearStats?: any; [key: string]: any };

export type PodiumWinner = { nickname: string; stat: string; avatarUrl?: string };

export type Podium = {
  champion: PodiumWinner | null;
  mvp: PodiumWinner | null;
  bestMafia: PodiumWinner | null;
};

export const EMPTY_PODIUM: Podium = { champion: null, mvp: null, bestMafia: null };

/** Один знак після коми — прибирає float-сміття на кшталт 0.10000000000000003. */
export function formatFloat1(n: number): string {
  return (Math.round((Number(n) + Number.EPSILON) * 10) / 10).toFixed(1);
}

export function derivePodium(players: RatingPlayer[], stats: RatingStats = {}): Podium {
  const champion = players[0];
  const mvpPlayer = [...players].sort((a, b) => (b.bonusPoints || 0) - (a.bonusPoints || 0))[0];
  const avgGames = stats.avgGames || 0;
  const bestMafiaPlayer = [...players]
    .filter((p) => p.totalGames >= avgGames && (p.mafiaGames + p.donGames) > 0)
    .sort((a, b) => {
      const aWins = a.mafiaWins + a.donWins, aGames = a.mafiaGames + a.donGames;
      const bWins = b.mafiaWins + b.donWins, bGames = b.mafiaGames + b.donGames;
      return (bWins * bWins / bGames) - (aWins * aWins / aGames);
    })[0];

  return {
    champion: champion
      ? {
          nickname: champion.nickname,
          avatarUrl: champion.avatarUrl,
          stat: `${formatFloat1(champion.rating)} · ${champion.totalWins}/${champion.totalGames} (${formatFloat1(champion.totalWinsRate)}%)`,
        }
      : null,
    mvp: mvpPlayer?.bonusPoints
      ? {
          nickname: mvpPlayer.nickname,
          avatarUrl: mvpPlayer.avatarUrl,
          stat: `+${formatFloat1(mvpPlayer.bonusPoints)} бонусних балів`,
        }
      : null,
    bestMafia: bestMafiaPlayer
      ? {
          nickname: bestMafiaPlayer.nickname,
          avatarUrl: bestMafiaPlayer.avatarUrl,
          stat: `${bestMafiaPlayer.mafiaWins + bestMafiaPlayer.donWins}/${bestMafiaPlayer.mafiaGames + bestMafiaPlayer.donGames} (${
            formatFloat1(
              ((bestMafiaPlayer.mafiaWins + bestMafiaPlayer.donWins) /
                (bestMafiaPlayer.mafiaGames + bestMafiaPlayer.donGames)) * 100,
            )
          }%)`,
        }
      : null,
  };
}
