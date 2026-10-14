import React, { ReactElement, ReactNode } from 'react';
import Head from 'next/head';
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { AppProps } from 'next/app';
import HeiMusicThemeProvider from '../lib/HeiMusicThemeProvider';
import HeiMusicMainLayout from '../components/HeiMusicMainLayout';
import { ICurrentMusicInfo, IOverlayHandle, HeiMusicContext } from '../lib/HeiMusicContext';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { ApiError, UserControllerService } from '@api/codegen';
import Login from './login';
import { useRouter } from 'next/router';
import { NextPage } from 'next';


declare module '@mui/styles/defaultTheme' {
    interface DefaultTheme extends Theme { }
}

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout
}

/** 安卓原生退出确认插件（android/.../ExitPromptPlugin.java，经 MainActivity 注册）：
 *  首次调用弹原生 Toast「再按一次返回键退出」，2 秒内再调才真正退出 */
interface IExitPromptPlugin {
    confirmExit: () => Promise<void>
}
const ExitPrompt = registerPlugin<IExitPromptPlugin>('ExitPrompt');


export default function MyApp(props: AppProps) {
    const { Component, pageProps }: AppPropsWithLayout = props;
    const [noLogin, setNoLogin] = React.useState(true);
    const [currentMusicInfo, setCurrentMusicInfo] = React.useState<ICurrentMusicInfo>(null);
    const [overlayStack, setOverlayStack] = React.useState<IOverlayHandle[]>([]);
    const registerOverlay = React.useCallback((handle: IOverlayHandle) => setOverlayStack(stack => [...stack, handle]), []);
    const unregisterOverlay = React.useCallback((handle: IOverlayHandle) => setOverlayStack(stack => stack.filter(h => h !== handle)), []);
    const router = useRouter();

    React.useEffect(() => {
        const jssStyles = document.querySelector('#jss-server-side');
        if (jssStyles) {
            jssStyles.parentElement.removeChild(jssStyles);
        }
    }, []);

    // Android 硬件返回键：@capacitor/app 接管（插件默认无监听且无历史时会吞掉按键），
    // 优先关闭弹层栈栈顶（全屏播放器/播放列表抽屉），无弹层时有页面历史则回退，
    // 无历史则交给原生 ExitPrompt 做 Toast 二次确认退出
    React.useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        const handle = CapApp.addListener('backButton', ({ canGoBack }) => {
            if (overlayStack.length > 0) {
                overlayStack[overlayStack.length - 1].close();
            } else if (canGoBack) {
                window.history.back();
            } else {
                // 兼容尚未包含 ExitPromptPlugin 的旧 APK：调用失败则退回直接退出
                ExitPrompt.confirmExit().catch(() => CapApp.exitApp());
            }
        });
        return () => {
            handle.then(h => h.remove()).catch(() => { /* 卸载异常可忽略 */ });
        };
    }, [overlayStack]);

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
                    <HeiMusicContext.Provider value={{ currentMusicInfo: currentMusicInfo, setCurrentMusicInfo: setCurrentMusicInfo, overlayStack: overlayStack, registerOverlay: registerOverlay, unregisterOverlay: unregisterOverlay }}>
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
