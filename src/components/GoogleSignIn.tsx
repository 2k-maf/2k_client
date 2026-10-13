import * as React from 'react';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import GoogleButton, { googleEnabled } from './GoogleButton';
import axios from '../axios';
import { useAuth } from '../AuthProvider';

/** Текст, коли старий дубль: один логін належить і гравцю, і клубу. */
export const ACCOUNT_CONFLICT_MESSAGE =
  'Ця адреса належить двом обліковим записам: гравця і клубу. Зверніться до адміністратора.';

/** Чи відповів сервер 409 ACCOUNT_CONFLICT. */
export function isAccountConflict(e: any): boolean {
  return e?.response?.status === 409 && e?.response?.data?.code === 'ACCOUNT_CONFLICT';
}

type Props = {
  /** Викликається після успішного входу, коли токен уже збережено. */
  onSignedIn?: () => void;
};

/**
 * Вхід через Google одним кліком: кнопка і повідомлення про помилку під нею.
 * Спільний для сторінки входу і головної сторінки.
 */
export default function GoogleSignIn({ onSignedIn }: Props) {
  const { setToken } = useAuth();
  // Код GOOGLE_NOT_LINKED або готовий текст помилки входу через Google.
  const [error, setError] = React.useState('');

  const handleCredential = async (credential: string) => {
    setError('');
    try {
      // 401 тут означає, що сервер не прийняв credential Google, а не завершену сесію.
      const { data } = await axios.post(
        '/auth/google',
        { credential },
        { skipAuthRedirect: true },
      );
      if (!data?.token) return;
      setToken(data.token);
      onSignedIn?.();
    } catch (e: any) {
      console.error(e);
      const status = e?.response?.status;
      if (status === 404 && e?.response?.data?.code === 'GOOGLE_NOT_LINKED') {
        setError('GOOGLE_NOT_LINKED');
      } else if (isAccountConflict(e)) {
        setError(ACCOUNT_CONFLICT_MESSAGE);
      } else if (status === 401) {
        setError('Сервер не прийняв підтвердження Google. Натисніть кнопку Google ще раз.');
      } else {
        setError('Не вдалося увійти через Google. Спробуйте пізніше.');
      }
    }
  };

  if (!googleEnabled) return null;
  return (
    <>
      <GoogleButton onCredential={handleCredential} />
      {error === 'GOOGLE_NOT_LINKED' ? (
        <Alert severity="warning">
          Цей Google-акаунт не прив'язано до жодного облікового запису.
          Увійдіть з паролем і прив'яжіть Google у кабінеті або зареєструйтеся{' '}
          <Link component={RouterLink} to="/register" sx={{ fontWeight: 600 }}>
            як гравець
          </Link>
          {' '}чи{' '}
          <Link component={RouterLink} to="/register-club" sx={{ fontWeight: 600 }}>
            як клуб
          </Link>
          .
        </Alert>
      ) : (
        error && <Alert severity="error">{error}</Alert>
      )}
    </>
  );
}
