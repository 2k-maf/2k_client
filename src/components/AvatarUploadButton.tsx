import * as React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '../AuthProvider';
import axios from '../axios';
import { invalidateClubRatingCache } from '../utils/clubRatingCache';
import { formatMaxMb, IMAGE_ACCEPT, readImageFile } from '../utils/imageFile';
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

type AvatarUploadButtonProps = {
  isClub: boolean;
  onUploaded?: () => void;
};

export default function AvatarUploadButton({ isClub, onUploaded }: AvatarUploadButtonProps) {
  const { setToken } = useAuth();

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await readImageFile(file, MAX_AVATAR_BYTES);
      if (!result.ok) {
        notify.error(
          result.reason === 'type'
            ? 'Дозволені лише файли JPEG або PNG'
            : `Файл занадто великий (макс. ${formatMaxMb(MAX_AVATAR_BYTES)})`,
        );
        return;
      }
      const { data } = await axios.post('/user/avatar', { image: result.dataUrl });
      data?.token && setToken(data.token);
      invalidateClubRatingCache();
      notify.success(isClub ? 'Логотип клубу збережено' : 'Аватар оновлено');
      onUploaded?.();
    } catch (e: any) {
      notify.error(e?.response?.data?.error || 'Помилка при завантаженні');
    }
  };

  return (
    <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
      Завантажити
      <VisuallyHiddenInput type="file" accept={IMAGE_ACCEPT} onChange={handleUploadAvatar} />
    </Button>
  );
}
