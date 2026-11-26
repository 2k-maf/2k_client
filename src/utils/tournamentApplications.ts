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

export const APPLICATION_ACTION_UA: Record<ApplicationStatus, string> = {
  approved: 'Схвалити',
  rejected: 'Відхилити',
  pending: 'Повернути в очікування',
};

const APPLICATION_ACTION_ORDER: ApplicationStatus[] = ['approved', 'rejected', 'pending'];

/** Статуси, на які клуб може перевести заявку (усі, крім поточного). */
export function applicationActions(status: ApplicationStatus): ApplicationStatus[] {
  return APPLICATION_ACTION_ORDER.filter((s) => s !== status);
}

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

/** Текст помилки зміни статусу заявки для notify.error (код сервера -> українське повідомлення). */
export function applicationErrorMessage(serverError: unknown): string {
  if (serverError === 'TOURNAMENT_NOT_OPEN') return 'Набір закрито: турнір вже почався';
  if (typeof serverError === 'string' && serverError.trim()) return serverError;
  return 'Не вдалося оновити заявку';
}
