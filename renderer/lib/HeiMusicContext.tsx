import React from 'react'

export interface ICurrentMusicInfo {
    musicId: number,
    albumId: number,
}

export interface IHeiMusicContext {
    currentMusicInfo: ICurrentMusicInfo
    setCurrentMusicInfo: React.Dispatch<React.SetStateAction<ICurrentMusicInfo>>
}

export const HeiMusicContext = React.createContext<IHeiMusicContext>(null);