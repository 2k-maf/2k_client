import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './theme/AppTheme';
import AppAppBar from './components/AppAppBar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import { usePageTitle } from './hooks/usePageTitle';

export default function MarketingPage(props: { disableCustomTheme?: boolean }) {
  usePageTitle();
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />

      <AppAppBar />
      <Hero />
      <div>
        <Footer />
      </div>
    </AppTheme>
  );
}
