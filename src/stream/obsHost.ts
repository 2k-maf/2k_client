const HOST_KEY = 'obs-host';
const PASSWORD_KEY = 'obs-host-password';

export type Octets = [string, string, string, string];

const EMPTY_OCTETS: Octets = ['', '', '', ''];

function isOctet(value: string): boolean {
  if (!/^\d{1,3}$/.test(value)) return false;
  const number = Number(value);
  return number >= 0 && number <= 255;
}

/** Чотири числа з адреси. Невалідне — порожні поля. */
export function octetsFromHost(host: string): Octets {
  const parts = host.trim().split('.');
  if (parts.length !== 4 || parts.some((part) => !isOctet(part))) return [...EMPTY_OCTETS];
  return parts as Octets;
}

/** Адреса з чотирьох полів. null, поки хоч одне число не готове. */
export function hostFromOctets(octets: readonly string[]): string | null {
  if (octets.length !== 4 || octets.some((part) => !isOctet(part))) return null;
  return octets.join('.');
}

/**
 * Вставка цілої адреси. Крапки розбираємо самі.
 * Дванадцять цифр без крапок — це чотири повні октети по три.
 */
export function octetsFromText(raw: string): Octets | null {
  const trimmed = raw.trim();
  if (trimmed.includes('.')) {
    const parts = trimmed.split('.').map((part) => part.replace(/\D/g, ''));
    return parts.length === 4 && parts.every(isOctet) ? parts as Octets : null;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length !== 12) return null;
  const parts = [0, 1, 2, 3].map((index) => String(Number(digits.slice(index * 3, index * 3 + 3))));
  return parts.every(isOctet) ? parts as Octets : null;
}

/** Лишаємо лише цифри октета. Зайва цифра, що виводить за 255, відкидається. */
export function clampOctetInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 3);
  if (!digits) return '';
  if (Number(digits) <= 255) return digits;
  return digits.slice(0, -1);
}

/** Октет уже не прийме ще одну цифру: можна стрибати в наступне поле без крапки. */
export function octetComplete(digits: string): boolean {
  if (!isOctet(digits)) return false;
  if (digits.length >= 3) return true;
  return digits.length === 2 && Number(digits) > 25;
}

export function hostFromObsUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/** Міняє лише хост. Порт і схема лишаються; без адреси — ws на 4455. */
export function obsUrlForHost(currentUrl: string, host: string): string {
  let protocol = 'ws:';
  let port = '4455';
  try {
    const parsed = new URL(currentUrl);
    if (parsed.protocol) protocol = parsed.protocol;
    if (parsed.port) port = parsed.port;
  } catch {
    // Порожня або бита адреса: лишаємо стандартний порт OBS.
  }
  return `${protocol}//${host}:${port}`;
}

export function readStoredObsHost(): string | null {
  try {
    const value = localStorage.getItem(HOST_KEY)?.trim() ?? '';
    return hostFromOctets(value.split('.'));
  } catch {
    return null;
  }
}

export function readStoredObsPassword(): string {
  try {
    return localStorage.getItem(PASSWORD_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writeStoredObsHost(host: string, password?: string): void {
  localStorage.setItem(HOST_KEY, host);
  if (password) localStorage.setItem(PASSWORD_KEY, password);
}
