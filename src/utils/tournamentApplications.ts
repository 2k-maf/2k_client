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

/**
 * AuthProvider виставляє `user` в useEffect, тож на першому рендері `user` порожній
 * навіть за наявного токена. Auth «усталений», коли користувач є або токена в сховищі немає.
 */
export function isAuthSettled(hasUser: boolean, storedToken: string | null): boolean {
  return hasUser || !storedToken;
}

/** Публічні дані турніру для сторінок подачі й заявок (без чернеток поза вікном видимості). */
export function applyInfoUrl(id: string): string {
  return `/public/tournament/${id}/apply-info`;
}

/**
 * URL заголовка турніру. Публічний ендпоінт віддає 404 для чернеток поза вікном видимості,
 * тож клуб читає турнір авторизованим запитом (власник бачить його завжди).
 */
export function tournamentHeaderUrl(id: string, isClubUser: boolean): string {
  return isClubUser ? `/tournament/${id}` : applyInfoUrl(id);
}

/** Лічильник запитів: лише останній запуск має право записувати стан. */
export function createLatestGuard() {
  let current = 0;
  return {
    next: () => ++current,
    isLatest: (requestId: number) => requestId === current,
    invalidate: () => {
      current += 1;
    },
  };
}
