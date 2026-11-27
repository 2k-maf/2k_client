import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Link as RouterLink } from 'react-router-dom';
import { GUEST_FORM_LIMITS, validateGuestForm } from '../utils/guestApplication';
import { formatMaxMb, IMAGE_ACCEPT, IMAGE_TYPE_ERROR, readImageFile } from '../utils/imageFile';
import { notify } from './feedback/feedback';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export type GuestApplyInput = { nickname: string; contact: string; image: string; website: string };

type GuestApplyFormProps = {
  busy: boolean;
  onSubmit: (input: GuestApplyInput) => void | Promise<void>;
};

type FormErrors = ReturnType<typeof validateGuestForm>;

export default function GuestApplyForm({ busy, onSubmit }: GuestApplyFormProps) {
  const [nickname, setNickname] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [image, setImage] = React.useState<string | null>(null);
  const [website, setWebsite] = React.useState('');
  const [errors, setErrors] = React.useState<FormErrors>({});

  const clearError = (field: keyof FormErrors) => setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handlePickImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const result = await readImageFile(file, MAX_AVATAR_BYTES);
      if (!result.ok) {
        notify.error(
          result.reason === 'type'
            ? IMAGE_TYPE_ERROR
            : `Файл занадто великий (макс. ${formatMaxMb(MAX_AVATAR_BYTES)})`,
        );
        return;
      }
      setImage(result.dataUrl);
      clearError('image');
    } catch {
      notify.error('Не вдалося прочитати файл');
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateGuestForm({ nickname, contact, image });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !image) return;
    void onSubmit({ nickname: nickname.trim(), contact: contact.trim(), image, website });
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField
          label="Нік"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            clearError('nickname');
          }}
          error={Boolean(errors.nickname)}
          helperText={errors.nickname}
          slotProps={{ htmlInput: { maxLength: GUEST_FORM_LIMITS.nicknameMax } }}
          autoComplete="nickname"
          required
          fullWidth
        />
        <TextField
          label="Контакт"
          value={contact}
          onChange={(e) => {
            setContact(e.target.value);
            clearError('contact');
          }}
          error={Boolean(errors.contact)}
          helperText={errors.contact ?? 'Telegram, телефон або email'}
          slotProps={{ htmlInput: { maxLength: GUEST_FORM_LIMITS.contactMax } }}
          required
          fullWidth
        />
        <Stack spacing={1} alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={image ?? undefined} alt="Аватарка" sx={{ width: 64, height: 64 }} />
            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
              {image ? 'Змінити аватарку' : 'Обрати аватарку'}
              <VisuallyHiddenInput type="file" accept={IMAGE_ACCEPT} onChange={handlePickImage} />
            </Button>
          </Stack>
          <FormHelperText error={Boolean(errors.image)}>
            {errors.image ?? `JPEG або PNG, до ${formatMaxMb(MAX_AVATAR_BYTES)}`}
          </FormHelperText>
        </Stack>
        {/* Поле-пастка для ботів: поза екраном, невидиме для людей і скрінрідерів, але є в DOM. */}
        <Box aria-hidden="true" sx={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </Box>
        <Button type="submit" variant="contained" disabled={busy} sx={{ alignSelf: 'flex-start' }}>
          Податись
        </Button>
        <Typography variant="body2">
          Вже маєш акаунт?{' '}
          <Link component={RouterLink} to="/login">
            Увійти
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
}
