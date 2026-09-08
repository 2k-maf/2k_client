import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type Props = {
  avatarUrl: string | null | undefined;
  nickname: string;
  sx?: React.ComponentProps<typeof Avatar>['sx'];
};

/**
 * Аватар з бекенда із заглушкою на першу літеру ніка.
 *
 * Чому потрібен стан failed. Відсутній ключ у бакеті CloudFront віддає як
 * index.html зі статусом 200, тому мережа помилки не показує. Тег img не
 * може розібрати HTML як картинку і кидає error. Цей стан ловить обидва
 * випадки: мертву адресу і зіпсований файл.
 */
export default function RemoteAvatar({ avatarUrl, nickname, sx }: Props) {
  const [failed, setFailed] = React.useState(false);

  // Той самий компонент може дістати іншого учасника — наприклад після
  // зміни сторінки таблиці. Без скидання попередня невдача сховала б
  // робочий аватар наступного.
  React.useEffect(() => setFailed(false), [avatarUrl]);

  const src = failed ? undefined : resolveMediaUrl(avatarUrl);
  const initial = nickname.trim().charAt(0).toUpperCase() || '?';

  return (
    <Avatar
      src={src}
      alt={nickname}
      // MUI 6.4.4 ще не описує slotProps.img у типах Avatar, тому тут
      // лишається imgProps. У v7 проп треба замінити на slotProps.img.
      imgProps={{ loading: 'lazy', onError: () => setFailed(true) }}
      sx={sx}
    >
      {initial}
    </Avatar>
  );
}
