import * as React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '../AuthProvider';
import axios from '../axios';
import { invalidateClubRatingCache } from '../utils/clubRatingCache';
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

  const handleUploadAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      notify.error('Файл занадто великий (макс. 2MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { data } = await axios.post('/user/avatar', { image: reader.result });
        data?.token && setToken(data.token);
        invalidateClubRatingCache();
        notify.success(isClub ? 'Логотип клубу збережено' : 'Аватар оновлено');
        onUploaded?.();
      } catch (e: any) {
        notify.error(e?.response?.data?.error || 'Помилка при завантаженні');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
      Завантажити
      <VisuallyHiddenInput type="file" accept=".jpg, .jpeg, .png" onChange={handleUploadAvatar} />
    </Button>
  );
}
