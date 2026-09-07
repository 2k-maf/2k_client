import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from '../theme/AppTheme';
import ProfilePage from '../components/brand/ProfilePage';
import BrandTable, { BrandColumn } from '../components/brand/BrandTable';
import { Pill } from '../components/brand/DocTable';
import axios from '../axios';
import { brandFonts } from '../theme/brand';

type Period = {
  id: number;
  name?: string;
  club?: string;
  active?: boolean;
};

const COLUMNS: BrandColumn<Period>[] = [
  {
    key: 'name',
    header: 'НАЗВА ПЕРІОДУ',
    width: 'minmax(0,1.4fr)',
    render: (period) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
        <Box
          component="span"
          sx={{
            fontFamily: brandFonts.display,
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {period.name}
        </Box>
        {period.active && <Pill tone="positive">Активний</Pill>}
      </Box>
    ),
  },
  { key: 'club', header: 'КЛУБ', width: 'minmax(0,1fr)' },
];

export default function DashboardRatingPeriods(props: { disableCustomTheme?: boolean }) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/club/rating-periods');
        setPeriods((data.items || []).map((item: any, i: number) => ({ ...item, id: i + 1 })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ProfilePage title="Рейтингові періоди">
        <BrandTable
          columns={COLUMNS}
          rows={periods}
          getRowKey={(period) => period.id}
          pageSize={20}
          loading={loading}
          emptyText="Рейтингових періодів поки немає."
          minWidth={600}
        />
      </ProfilePage>
    </AppTheme>
  );
}
