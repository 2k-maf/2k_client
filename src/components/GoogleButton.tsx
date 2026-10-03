import * as React from 'react';
import Box from '@mui/material/Box';
import { jwtDecode } from 'jwt-decode';
import { fg } from '../theme/brand';

// Публічний Client ID OAuth. Без нього інтерфейс Google не показуємо зовсім.
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

export const googleEnabled = Boolean(GOOGLE_CLIENT_ID);

// Мінімальні типи Google Identity Services: лише те, що викликає цей модуль.
type GoogleIdApi = {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode: 'popup';
    auto_select: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } };
  }
}

let gisPromise: Promise<GoogleIdApi> | null = null;

/** Скрипт GIS вантажимо один раз і лише на сторінках, де є кнопка Google. */
function loadGoogleIdentity(): Promise<GoogleIdApi> {
  if (!gisPromise) {
    gisPromise = new Promise<GoogleIdApi>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.onload = () => {
        const gis = window.google?.accounts?.id;
        if (gis) resolve(gis);
        else reject(new Error('Google Identity Services недоступний'));
      };
      script.onerror = () => {
        script.remove();
        reject(new Error('Не вдалося завантажити Google Identity Services'));
      };
      document.head.appendChild(script);
    });
    // Після збою наступна кнопка пробує завантажити скрипт ще раз.
    gisPromise.catch(() => {
      gisPromise = null;
    });
  }
  return gisPromise;
}

/**
 * Email та ім'я з credential — лише для підстановки у форму.
 * Credential перевіряє тільки сервер.
 */
export function googleProfile(credential: string): { email: string; name: string } {
  try {
    const { email = '', name = '' } = jwtDecode<{ email?: string; name?: string }>(credential);
    return { email, name };
  } catch {
    return { email: '', name: '' };
  }
}

type Props = {
  /** Отримує credential (JWT від Google) після вибору акаунта. */
  onCredential: (credential: string) => void;
  /** Напис на кнопці. */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
};

/**
 * Кнопка Google у режимі popup. One Tap не використовуємо.
 * Вбудовані браузери (Telegram, Instagram) можуть блокувати popup,
 * тому вхід з паролем завжди лишається поруч.
 */
export default function GoogleButton({ onCredential, text = 'signin_with' }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [failed, setFailed] = React.useState(false);
  // GIS тримає один callback на сторінку. Ref дає йому свіжий onCredential без повторної ініціалізації.
  const onCredentialRef = React.useRef(onCredential);
  React.useLayoutEffect(() => {
    onCredentialRef.current = onCredential;
  });

  React.useEffect(() => {
    if (!googleEnabled) return;
    let cancelled = false;
    loadGoogleIdentity()
      .then((gis) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        gis.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => onCredentialRef.current(credential),
          ux_mode: 'popup',
          auto_select: false,
        });
        gis.renderButton(container, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text,
          locale: 'uk',
          // GIS приймає ширину лише в пікселях, від 200 до 400.
          width: Math.min(400, Math.max(200, container.offsetWidth)),
        });
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!googleEnabled) return null;
  if (failed) {
    return (
      <Box sx={{ fontSize: 13, textAlign: 'center', color: fg(0.6) }}>
        Кнопка Google не завантажилася. Скористайтеся паролем.
      </Box>
    );
  }
  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        minHeight: 44,
        display: 'flex',
        justifyContent: 'center',
        // Сторінка має color-scheme: dark, а iframe Google — light. Без цього
        // браузер малює під кнопкою білий непрозорий фон.
        colorScheme: 'light',
      }}
    />
  );
}
