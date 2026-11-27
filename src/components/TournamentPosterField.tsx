import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { formatMaxMb, IMAGE_ACCEPT, IMAGE_TYPE_ERROR, readImageFile } from '../utils/imageFile';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { notify } from './feedback/feedback';

export const POSTER_MAX_BYTES = 3 * 1024 * 1024;

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

type TournamentPosterFieldProps = {
  posterUrl: string | null;
  busy?: boolean;
  onPick: (dataUrl: string) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
};

export default function TournamentPosterField({
  posterUrl,
  busy = false,
  onPick,
  onRemove,
}: TournamentPosterFieldProps) {
  const previewSrc = resolveMediaUrl(posterUrl);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const result = await readImageFile(file, POSTER_MAX_BYTES);
      if (!result.ok) {
        notify.error(
          result.reason === 'type'
            ? IMAGE_TYPE_ERROR
            : `Файл занадто великий (макс. ${formatMaxMb(POSTER_MAX_BYTES)})`,
        );
        return;
      }
      await onPick(result.dataUrl);
    } catch (e) {
      console.error(e);
      notify.error('Не вдалося прочитати файл');
    }
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Афіша</Typography>
      {previewSrc && (
        <Box
          component="img"
          src={previewSrc}
          alt="Афіша турніру"
          sx={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', alignSelf: 'flex-start', borderRadius: 1 }}
        />
      )}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button component="label" variant="outlined" size="small" disabled={busy}>
          Обрати афішу
          <VisuallyHiddenInput type="file" accept={IMAGE_ACCEPT} onChange={handleChange} />
        </Button>
        {posterUrl && (
          <Button variant="outlined" size="small" color="error" disabled={busy} onClick={() => onRemove()}>
            Видалити афішу
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
