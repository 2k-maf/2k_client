import * as React from 'react';
import AppTheme from "./theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import Button from "@mui/material/Button";
import {styled} from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid2";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {useEffect} from "react";
import axios from "./axios";
import Box from "@mui/material/Box";
import AppAppBar from "./components/AppAppBar";


export const columns: GridColDef[] = [
  { field: 'nickname', headerName: 'Нік', flex: 1, minWidth: 100 },
  { field: 'name', headerName: 'Імя', flex: 1, minWidth: 100 },
  // {
  //   field: 'status',
  //   headerName: 'Status',
  //   flex: 0.5,
  //   minWidth: 80,
  //   renderCell: (params) => renderStatus(params.value as any),
  // },
  {
    field: 'clubs',
    headerName: 'Клуби',
    headerAlign: 'left',
    align: 'left',
    flex: 1,
    minWidth: 100,
  },
  // {
  //   field: 'email',
  //   headerName: 'Email',
  //   headerAlign: 'left',
  //   align: 'left',
  //   flex: 1,
  //   minWidth: 100,
  // },
  // {
  //   field: 'usersAmount',
  //   headerName: 'Учасники',
  //   headerAlign: 'left',
  //   align: 'left',
  //   flex: .5,
  //   minWidth: 80,
  // },
  // {
  //   field: 'viewsPerUser',
  //   headerName: 'Views per User',
  //   headerAlign: 'right',
  //   align: 'right',
  //   flex: 1,
  //   minWidth: 120,
  // },
  // {
  //   field: 'averageTime',
  //   headerName: 'Average Time',
  //   headerAlign: 'right',
  //   align: 'right',
  //   flex: 1,
  //   minWidth: 100,
  // },
  // {
  //   field: 'conversions',
  //   headerName: 'Daily Conversions',
  //   flex: 1,
  //   minWidth: 150,
  //   renderCell: renderSparklineCell,
  // },
];


const MembersContainer = styled(Stack)(({ theme }) => ({
  // height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  // minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(20, 30%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(250,43,30,0.10), #0a0c18)',
    }),
  },
}));

export default function MembersList(props: { disableCustomTheme?: boolean }) {
  const [members, setMembers] = React.useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get('/users');
        const array = (data.items || []).map((item: any, i: number) => {
          return { ...item, id: i + 1 };
        })
        setMembers(array || []);
      } catch (e) {
        console.error(e);
      }
    }
    fetchData();
  }, [])
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <MembersContainer direction="column" justifyContent="space-between">
        <AppAppBar />
        <Box sx={{ mt: '5rem' }}>
          <Grid container spacing={2} columns={12}>
            <Grid size={{ xs: 12, lg: 9 }}>
              <DataGrid
                // checkboxSelection
                rows={members}
                columns={columns}
                getRowClassName={(params) =>
                  params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
                }
                initialState={{
                  pagination: { paginationModel: { pageSize: 15 } },
                }}
                pageSizeOptions={[15]}
                disableColumnResize
                disableColumnMenu
                disableColumnSorting
                density="compact"
                // slotProps={{
                //   filterPanel: {
                //     filterFormProps: {
                //       logicOperatorInputProps: {
                //         variant: 'outlined',
                //         size: 'small',
                //       },
                //       columnInputProps: {
                //         variant: 'outlined',
                //         size: 'small',
                //         sx: { mt: 'auto' },
                //       },
                //       operatorInputProps: {
                //         variant: 'outlined',
                //         size: 'small',
                //         sx: { mt: 'auto' },
                //       },
                //       valueInputProps: {
                //         InputComponentProps: {
                //           variant: 'outlined',
                //           size: 'small',
                //         },
                //       },
                //     },
                //   },
                // }}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 3 }}>
              <Stack gap={2} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
                {/*<CustomizedTreeView />*/}
                {/*<ChartUserByCountry />*/}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </MembersContainer>
    </AppTheme>
  );
}