import React, { ReactElement, ReactNode } from 'react';
import Head from 'next/head';
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { AppProps } from 'next/app';
import HeiMusicThemeProvider from '../lib/HeiMusicThemeProvider';
import HeiMusicMainLayout from '../components/HeiMusicMainLayout';
import { ICurrentMusicInfo, HeiMusicContext } from '../lib/HeiMusicContext';
import { ApiError, UserControllerService } from '@api/codegen';
import Login from './login';
import { useRouter } from 'next/router';
import { NextPage } from 'next';


declare module '@mui/styles/defaultTheme' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface DefaultTheme extends Theme { }
}

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout
}


export default function (props: AppProps) {
    const { Component, pageProps }: AppPropsWithLayout = props;
    const [noLogin, setNoLogin] = React.useState(true);
    const [currentMusicInfo, setCurrentMusicInfo] = React.useState<ICurrentMusicInfo>(null);
    const router = useRouter();

    React.useEffect(() => {
        const jssStyles = document.querySelector('#jss-server-side');
        if (jssStyles) {
            jssStyles.parentElement.removeChild(jssStyles);
        }
    }, []);

    const handleLoginSuccess = () => {
        setNoLogin(false);
    }

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
                    <HeiMusicContext.Provider value={{ currentMusicInfo: currentMusicInfo, setCurrentMusicInfo: setCurrentMusicInfo }}>
                        <CssBaseline />
                        {
                            noLogin && <Login onLoginSuccess={handleLoginSuccess}/>
                        }
                        {
                            !noLogin && Component.getLayout && Component.getLayout(<Component {...pageProps} />)
                        }
                        {
                            !noLogin && !Component.getLayout &&
                            <HeiMusicMainLayout>
                                <Component {...pageProps} />
                            </HeiMusicMainLayout>
                        }
                    </HeiMusicContext.Provider>
                </HeiMusicThemeProvider>
            </StyledEngineProvider>
        </React.Fragment>
    );
}
