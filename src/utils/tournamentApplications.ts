export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type ApplicationRow = {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  status: ApplicationStatus;
  rating: number | null;
  rank: number | null;
  totalGames: number;
  /** ISO-рядок із JSON. */
  createdAt: string;
};

export const APPLICATION_STATUS_UA: Record<ApplicationStatus, string> = {
  pending: 'На розгляді',
  approved: 'Схвалено',
  rejected: 'Відхилено',
};

export type ApplyView = 'login' | 'club' | 'closed' | 'avatar' | 'form' | 'submitted';

export function resolveApplyView(input: {
  authType: 'Клуб' | 'Учасник' | undefined;
  hasAvatar: boolean;
  tournamentStatus: string;
  myStatus: ApplicationStatus | null;
}): ApplyView {
  if (!input.authType) return 'login';
  if (input.authType === 'Клуб') return 'club';
  if (input.myStatus) return 'submitted';
  if (input.tournamentStatus !== 'draft') return 'closed';
  if (!input.hasAvatar) return 'avatar';
  return 'form';
}
