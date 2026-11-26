import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import RemoteAvatar from './brand/RemoteAvatar';
import { APPLICATION_STATUS_UA, type ApplicationRow } from '../utils/tournamentApplications';

type Props = {
  /** Рядки в порядку, у якому їх віддав сервер. */
  rows: ApplicationRow[];
  /** Якщо передано — додається колонка дій (лише для клубу-власника). */
  actions?: (row: ApplicationRow) => React.ReactNode;
};

const headSx = {
  background: (t: Theme) =>
    `linear-gradient(90deg, ${alpha(t.palette.primary.main, 0.88)} 0%, ${alpha(t.palette.primary.dark, 0.82)} 100%)`,
  '& .MuiTableCell-head': {
    color: 'primary.contrastText',
    fontWeight: 800,
    borderBottom: 'none',
  },
};

const formatRating = (rating: number | null) => (rating == null ? '—' : rating.toFixed(1));

export default function TournamentApplicationsTable({ rows, actions }: Props) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 2,
        border: (t) => `1px solid ${t.palette.divider}`,
        boxShadow: (t) => t.shadows[2],
        width: '100%',
        overflowX: 'auto',
      }}
    >
      <Table size="medium" sx={{ '& .MuiTableCell-body': { verticalAlign: 'middle' } }}>
        <TableHead>
          <TableRow sx={headSx}>
            <TableCell align="center" sx={{ width: 56 }}>
              №
            </TableCell>
            <TableCell>Гравець</TableCell>
            <TableCell align="right">Рейтинг</TableCell>
            <TableCell align="right">Ігор</TableCell>
            <TableCell>Статус</TableCell>
            {actions ? <TableCell>Дії</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={actions ? 6 : 5} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Заявок поки немає.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.userId}
                sx={{
                  '&:nth-of-type(even)': { bgcolor: (t) => alpha(t.palette.action.hover, 0.2) },
                  '&:last-child td': { borderBottom: 0 },
                }}
              >
                <TableCell align="center">{row.rank ?? '—'}</TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
                    <RemoteAvatar
                      avatarUrl={row.avatarUrl}
                      nickname={row.nickname}
                      sx={{ width: 40, height: 40, flexShrink: 0 }}
                    />
                    <Typography variant="body1" fontWeight={600} noWrap>
                      {row.nickname}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">{formatRating(row.rating)}</TableCell>
                <TableCell align="right">{row.totalGames}</TableCell>
                <TableCell>{APPLICATION_STATUS_UA[row.status]}</TableCell>
                {actions ? <TableCell>{actions(row)}</TableCell> : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
