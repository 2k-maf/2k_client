export type ParticipantUser = { nickname: string; avatarUrl: string | null };

/**
 * Клубні екрани знають лише членів клубу (`GET /club/users`), а в турнірі можуть
 * грати й гості поза клубом. Дописуємо їх у кінець списку, щоб показувати нік
 * замість id; члени клубу лишаються першими, у тому самому порядку.
 */
export function mergeParticipantUsers<T extends { _id: string }>(
  members: T[],
  participantUsers: Record<string, ParticipantUser> | undefined,
): Array<T | { _id: string; nickname: string; avatarUrl: string | null }> {
  const known = new Set(members.map((m) => String(m._id)));
  const extras = Object.entries(participantUsers || {})
    .filter(([id]) => !known.has(String(id)))
    .map(([id, u]) => ({ _id: id, nickname: u.nickname, avatarUrl: u.avatarUrl }));
  return [...members, ...extras];
}
