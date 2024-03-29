import React from 'react';
import Head from 'next/head';
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { AppProps } from 'next/app';
import HeiMusicThemeProvider from '../lib/HeiMusicThemeProvider';
import HeiMusicMainLayout from '../components/HeiMusicMainLayout';
import { ICurrentMusicInfo, HeiMusicContext } from '../lib/HeiMusicContext';


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme { }
}



export default function (props: AppProps) {
  const { Component, pageProps } = props;

  const [currentMusicInfo, setCurrentMusicInfo] = React.useState<ICurrentMusicInfo>(null);

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
        <style>
          {
            `::-webkit-scrollbar {
                width: 12px;
                height: 8px;
                background-color: #e3e3e3; /* or add it to the track */
                border-radius: 4px;

              }
              ::-webkit-scrollbar-thumb {
                background: #aaa;
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: #7c7c7c;
                border-radius: 4px;
              }
              ::-webkit-scrollbar-track {
              }
              
              @media(max-width: 600px) {
                ::-webkit-scrollbar {
                  width: 6px;
                  height: 8px;
                  background-color: #e3e3e3; /* or add it to the track */
                  border-radius: 4px;
  
                }
              }
              body, html {
                margin: 0;
                height: 100%;
              }
    
              body {
                display: flex;
                flex-direction: column;
              }

              #__next {
                margin: 0;
                height: 100%;
              }
              `
          }

        </style>
      </Head>
      <StyledEngineProvider injectFirst>
        <HeiMusicThemeProvider >
          <HeiMusicContext.Provider value={{currentMusicInfo: currentMusicInfo, setCurrentMusicInfo: setCurrentMusicInfo}}>
            <CssBaseline />
            <HeiMusicMainLayout>
              <Component {...pageProps} />
            </HeiMusicMainLayout>
          </HeiMusicContext.Provider>
        </HeiMusicThemeProvider>
      </StyledEngineProvider>
    </React.Fragment>
  );
}
