import React from 'react'

export interface ICurrentMusicInfo {
    musicId: number,
    albumId: number,
}

/** 弹层句柄：注册进 context 后，Android 硬件返回键优先关闭栈顶弹层 */
export interface IOverlayHandle {
    close: () => void
}

export interface IHeiMusicContext {
    currentMusicInfo: ICurrentMusicInfo
    setCurrentMusicInfo: React.Dispatch<React.SetStateAction<ICurrentMusicInfo>>
    /** 弹层栈（后进先出）：Android 硬件返回键从栈顶逐层关闭，空栈时才轮到页面回退/退出 */
    overlayStack: IOverlayHandle[]
    registerOverlay: (handle: IOverlayHandle) => void
    unregisterOverlay: (handle: IOverlayHandle) => void
}

export const HeiMusicContext = React.createContext<IHeiMusicContext>(null);