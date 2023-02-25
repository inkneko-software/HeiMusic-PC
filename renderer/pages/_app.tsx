import React from 'react';
import Head from 'next/head';
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '../lib/theme';
import type { AppProps } from 'next/app';
import HeiMusicThemeProvider from '../lib/HeiMusicThemeProvider';
import HeiMusicMainLayout from '../components/HeiMusicMainLayout';


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme { }
}


export default function (props: AppProps) {
  const { Component, pageProps } = props;

  React.useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <React.Fragment>
      <Head>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <title>HeiMusic</title>

      </Head>
      <StyledEngineProvider injectFirst>
        <HeiMusicThemeProvider >
          <CssBaseline />
          <HeiMusicMainLayout>
            <Component {...pageProps} />
          </HeiMusicMainLayout>
        </HeiMusicThemeProvider>
      </StyledEngineProvider>
    </React.Fragment>
  );
}