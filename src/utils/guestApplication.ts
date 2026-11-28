const TOKEN_KEY_PREFIX = 'guest_application_';
const TOKEN_HASH_RE = /^#g=([0-9a-fA-F]{64})$/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/;

export const GUEST_FORM_LIMITS = { nicknameMin: 2, nicknameMax: 30, contactMin: 3, contactMax: 100 } as const;

const NICKNAME_ERROR = `Нік: від ${GUEST_FORM_LIMITS.nicknameMin} до ${GUEST_FORM_LIMITS.nicknameMax} символів`;
const CONTACT_ERROR = `Контакт: від ${GUEST_FORM_LIMITS.contactMin} до ${GUEST_FORM_LIMITS.contactMax} символів`;
const AVATAR_ERROR = 'Додайте аватарку';

const tokenKey = (tournamentId: string) => `${TOKEN_KEY_PREFIX}${tournamentId}`;

/** Доступ до localStorage може кидати (приватний режим, заборонене сховище): помилки ковтаємо. */
function withStorage<T>(action: (storage: Storage) => T, fallback: T): T {
  try {
    return action(window.localStorage);
  } catch {
    return fallback;
  }
}

export function readGuestToken(tournamentId: string): string | null {
  return withStorage((s) => s.getItem(tokenKey(tournamentId)), null);
}

export function saveGuestToken(tournamentId: string, token: string): void {
  withStorage((s) => s.setItem(tokenKey(tournamentId), token), undefined);
}

export function clearGuestToken(tournamentId: string): void {
  withStorage((s) => s.removeItem(tokenKey(tournamentId)), undefined);
}

/** Токен із фрагмента `#g=<64 hex>` (нижнім регістром) або `null`. */
export function tokenFromHash(hash: string): string | null {
  const match = TOKEN_HASH_RE.exec(hash);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Бере токен із фрагмента URL, зберігає його й прибирає фрагмент з адреси.
 * Без валідного фрагмента повертає збережений токен.
 */
export function adoptGuestToken(tournamentId: string): string | null {
  const fromHash = tokenFromHash(window.location.hash);
  if (!fromHash) return readGuestToken(tournamentId);
  saveGuestToken(tournamentId, fromHash);
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return fromHash;
}

export function guestApplicationLink(origin: string, tournamentId: string, token: string): string {
  return `${origin}/tournaments/${tournamentId}/apply#g=${token}`;
}

const isValidText = (value: string, min: number, max: number): boolean => {
  const text = value.trim();
  return text.length >= min && text.length <= max && !CONTROL_CHARS_RE.test(text);
};

export function validateGuestForm(input: { nickname: string; contact: string; image: string | null }): {
  nickname?: string;
  contact?: string;
  image?: string;
} {
  const errors: { nickname?: string; contact?: string; image?: string } = {};
  if (!isValidText(input.nickname, GUEST_FORM_LIMITS.nicknameMin, GUEST_FORM_LIMITS.nicknameMax)) {
    errors.nickname = NICKNAME_ERROR;
  }
  if (!isValidText(input.contact, GUEST_FORM_LIMITS.contactMin, GUEST_FORM_LIMITS.contactMax)) {
    errors.contact = CONTACT_ERROR;
  }
  if (!input.image) errors.image = AVATAR_ERROR;
  return errors;
}

const GUEST_APPLY_ERRORS: Record<string, string> = {
  ALREADY_APPLIED: 'Заявку з цим контактом уже подано',
  TOURNAMENT_NOT_OPEN: 'Набір закрито: турнір вже почався',
  APPLICATIONS_FULL: 'Заявок забагато. Спробуйте пізніше',
  TOO_MANY_REQUESTS: 'Забагато спроб. Спробуйте за годину',
  AVATAR_REQUIRED: AVATAR_ERROR,
  INVALID_NICKNAME: NICKNAME_ERROR,
  INVALID_CONTACT: CONTACT_ERROR,
};

export function guestApplyErrorMessage(code: unknown): string {
  return (typeof code === 'string' && GUEST_APPLY_ERRORS[code]) || 'Не вдалося подати заявку';
}
