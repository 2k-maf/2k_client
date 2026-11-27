import * as React from 'react';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAuth } from '../AuthProvider';
import axios from '../axios';
import { invalidateClubRatingCache } from '../utils/clubRatingCache';
import { IMAGE_ACCEPT, imageRejectedMessage, MAX_AVATAR_BYTES, readImageFile } from '../utils/imageFile';
import { notify } from './feedback/feedback';
import VisuallyHiddenInput from './VisuallyHiddenInput';

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
        notify.error(imageRejectedMessage(result.reason, MAX_AVATAR_BYTES));
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
