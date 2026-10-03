import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import GoogleButton, { googleEnabled, googleProfile } from './GoogleButton';
import { fg } from '../theme/brand';

/** Дані Google для реєстрації. Credential живе одну годину. */
export type GoogleSignUpData = { credential: string; email: string; name: string };

type Props = {
  value: GoogleSignUpData | null;
  onChange: (value: GoogleSignUpData | null) => void;
};

/**
 * Блок над формою реєстрації: кнопка Google, а після вибору акаунта —
 * адреса з Google і кнопка повернення до реєстрації з паролем.
 */
export default function GoogleSignUpBlock({ value, onChange }: Props) {
  if (!googleEnabled) return null;
  if (value) {
    return (
      <Alert
        severity="info"
        action={
          <Button color="inherit" size="small" onClick={() => onChange(null)}>
            Скасувати
          </Button>
        }
      >
        Реєстрація через Google ({value.email}). Заповніть інші поля. Пароль необов'язковий.
      </Alert>
    );
  }
  return (
    <>
      <GoogleButton
        text="signup_with"
        onCredential={(credential) => onChange({ credential, ...googleProfile(credential) })}
      />
      <Divider sx={{ fontSize: 13, color: fg(0.6) }}>або</Divider>
    </>
  );
}

/** Текст помилки реєстрації за відповіддю POST /user або POST /club. */
export function signUpErrorMessage(e: any, withGoogle: boolean): string {
  const status = e?.response?.status;
  const data = e?.response?.data;
  if (status === 409 && data?.code === 'GOOGLE_ALREADY_LINKED') {
    return "Цей Google-акаунт уже прив'язано до іншого облікового запису. Увійдіть через Google на сторінці входу.";
  }
  if (status === 409 && withGoogle) {
    return "Обліковий запис з цією адресою вже існує. Увійдіть з паролем і прив'яжіть Google у кабінеті. Якщо пароль забули, скористайтеся «Забули пароль?» на сторінці входу.";
  }
  if (status === 409) {
    return 'Користувач з такою електронною адресою вже існує. Зверніться до адміністратора';
  }
  if (status === 401 && withGoogle) {
    return 'Підтвердження Google застаріло. Натисніть кнопку Google ще раз.';
  }
  if (status === 422) {
    return 'Сервер не прийняв дані. Перевірте заповнені поля.';
  }
  return 'Не вдалося зареєструватися. Спробуйте пізніше.';
}
