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

    // 悬浮滚动条的指针追踪：指针（仅鼠标）所在位置祖先链上的元素统一加 heimusic-sb-hover 类，
    // 由 <Head> 内的全局样式显现滚动条（含 Popover 等 portal 到 body 下的弹层，链会自然走到 body/html）。
    // 仅对真正出滚动条的容器有视觉效果，无需逐个判断 overflow；指针离开窗口时全部隐藏
    React.useEffect(() => {
        const SB_HOVER_CLASS = 'heimusic-sb-hover';
        let classedElements: Element[] = [];
        const applyChain = (target: Element | null) => {
            const chain: Element[] = [];
            for (let node: Element | null = target; node !== null; node = node.parentElement) {
                chain.push(node);
            }
            const keep = new Set(chain);
            classedElements = classedElements.filter(el => {
                if (keep.has(el)) return true;
                el.classList.remove(SB_HOVER_CLASS);
                return false;
            });
            for (const el of chain) {
                if (!el.classList.contains(SB_HOVER_CLASS)) {
                    el.classList.add(SB_HOVER_CLASS);
                    classedElements.push(el);
                }
            }
        };
        const clearAll = () => {
            classedElements.forEach(el => el.classList.remove(SB_HOVER_CLASS));
            classedElements = [];
        };
        const handlePointerOver = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') return;
            applyChain(e.target instanceof Element ? e.target : null);
        };
        const handlePointerOut = (e: PointerEvent) => {
            if (e.relatedTarget === null) clearAll();
        };
        document.addEventListener('pointerover', handlePointerOver);
        document.addEventListener('pointerout', handlePointerOut);
        return () => {
            document.removeEventListener('pointerover', handlePointerOver);
            document.removeEventListener('pointerout', handlePointerOut);
            clearAll();
        };
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
                        // 悬浮滚动条（原左侧导航栏的交互推广到全局）：默认 thumb/track 全透明，占位宽度固定 6px
                        // 不引起布局跳动；指针（仅鼠标，由下方 useEffect 追踪）所在位置的祖先链元素被加上
                        // heimusic-sb-hover 类后滚动条显现——与 :hover 沿祖先链传播的语义一致，嵌套滚动容器同时显示。
                        // 不用「元素:hover::-webkit-scrollbar-*」复合选择器：Chromium 121+ 的滚动条伪元素样式
                        // 已不响应元素的 :hover 状态（2026-11 于 Chromium 152 实测），class 作用域规则新旧内核均生效；
                        // 触屏不上类，滚动条保持不可见、走手势滚动，与首页横滑行一致
                        `::-webkit-scrollbar {
                width: 6px;
                height: 8px;
                background-color: transparent;
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb {
                background: transparent;
                border-radius: 4px;
              }
              ::-webkit-scrollbar-track {
                background: transparent;
              }
              .heimusic-sb-hover::-webkit-scrollbar-thumb {
                background: #aaa;
                border-radius: 4px;
              }
              .heimusic-sb-hover::-webkit-scrollbar-track {
                background: #e3e3e3;
                border-radius: 4px;
              }
              /* 悬停 thumb 本身时加深；与上面的类规则同特异性，靠置后胜出 */
              ::-webkit-scrollbar-thumb:hover {
                background: #7c7c7c;
                border-radius: 4px;
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
