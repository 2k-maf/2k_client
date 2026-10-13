import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import AppTheme from './theme/AppTheme';
import BrandPage from './components/brand/BrandPage';
import { fg } from './theme/brand';

/** Невідома адреса: раніше маршрутизатор показував порожній екран без шапки. */
export default function NotFound(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <BrandPage eyebrow="Помилка 404" title="Сторінку не знайдено">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
          <Typography sx={{ m: 0, maxWidth: '56ch', fontSize: 16, lineHeight: 1.6, color: fg(0.7) }}>
            Адреса неправильна або сторінку видалили. Перевірте посилання чи поверніться на головну.
          </Typography>
          <Button component={RouterLink} to="/" variant="contained">
            На головну
          </Button>
        </Box>
      </BrandPage>
    </AppTheme>
  );
}
