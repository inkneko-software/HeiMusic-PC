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
    }
    lastPannel: string,
    closeWindowMinimized?: boolean
}