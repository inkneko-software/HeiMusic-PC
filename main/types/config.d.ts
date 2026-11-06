interface HeiMusicConfig {
    apiHost: string,
    volume: number,
    userId: string,
    sessionId: string,
    lastStatus: {
        coverUrl: string,
        title: string,
        artists: string[],
        album: string,
        albumid: number,
        duration: number,
        currentTime: number,
        quality: string,
        songUrl: string
    },
    hotkeys:{
        playback: string,
        next: string,
        prev: string,
    },
    theme: string,
    lastPannel: string,
    closeWindowMinimized?: boolean,
    /** 播放模式：loop=列表循环 / sequence=顺序播放 / random=随机播放 / repeat=单曲循环 */
    playbackMethod?: 'loop' | 'sequence' | 'random' | 'repeat'
}