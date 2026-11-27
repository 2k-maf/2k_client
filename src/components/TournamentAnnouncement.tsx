import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { resolveMediaUrl } from '../utils/mediaUrl';

type TournamentAnnouncementProps = {
  posterUrl: string | null;
  description: string;
};

/** Афіша й публічний опис турніру. Обидва необов'язкові: без них нічого не рендериться. */
export default function TournamentAnnouncement({ posterUrl, description }: TournamentAnnouncementProps) {
  const posterSrc = resolveMediaUrl(posterUrl);
  const text = description.trim();
  if (!posterSrc && !text) return null;

  return (
    <Stack spacing={2}>
      {posterSrc && (
        <Box
          component="img"
          src={posterSrc}
          alt="Афіша турніру"
          loading="lazy"
          sx={{ maxWidth: '100%', height: 'auto', alignSelf: 'flex-start', borderRadius: 1 }}
        />
      )}
      {text && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {text}
        </Typography>
      )}
    </Stack>
  );
}
