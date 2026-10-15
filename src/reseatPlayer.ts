const SEAT_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type SeatPlayer = {
  title?: string;
  id?: string;
  pendingTeamIds?: string[];
  n?: number;
  [key: string]: unknown;
};

/** Дефолтний «Гість N» — порожній стілець, не гравець. */
function isNamedPlayer(player: { title?: string } | undefined) {
  const title = String(player?.title || '').trim();
  return Boolean(title) && !title.startsWith('Гість');
}

function playerLabel(player: SeatPlayer | undefined) {
  return {
    title: String(player?.title || ''),
    id: player?.id ? String(player.id) : '',
    pendingTeamIds: player?.pendingTeamIds?.length ? [...player.pendingTeamIds] : undefined,
  };
}

function guestLabel(seat: number) {
  return { title: `Гість ${seat}`, id: '', pendingTeamIds: undefined as string[] | undefined };
}

function isSamePlayer(player: SeatPlayer, title: string, id: string) {
  if (id && player.id && String(player.id) === id) return true;
  return (
    !id &&
    !player.id &&
    Boolean(title) &&
    !title.startsWith('Гість') &&
    String(player.title || '').trim() === title.trim()
  );
}

/**
 * Садить гравця на місце. Якщо він уже сидить на іншому стільці і там теж є гравець —
 * ніки міняються місцями. Якщо нове місце порожнє (гість), старе стає гостем.
 * Роль, фоли і решта стану лишаються на стільці.
 */
export function reseatPlayer(
  players: Record<number, SeatPlayer>,
  seat: number,
  title: string,
  id: string,
) {
  const idStr = id ? String(id) : '';
  const nextPlayers = { ...players };
  const displaced = isNamedPlayer(nextPlayers[seat]) ? playerLabel(nextPlayers[seat]) : null;
  let displacedPlaced = false;

  for (const other of SEAT_NUMBERS) {
    if (other === seat) continue;
    const current = nextPlayers[other];
    if (!current || !isSamePlayer(current, title, idStr)) continue;

    const replacement = displaced && !displacedPlaced ? displaced : guestLabel(other);
    if (displaced && !displacedPlaced) displacedPlaced = true;
    nextPlayers[other] = { ...current, ...replacement };
  }

  nextPlayers[seat] = {
    ...nextPlayers[seat],
    title,
    id: idStr,
    pendingTeamIds: idStr || displacedPlaced ? undefined : nextPlayers[seat]?.pendingTeamIds,
  };
  return nextPlayers;
}
