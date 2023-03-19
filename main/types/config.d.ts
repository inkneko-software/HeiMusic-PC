interface HeiMusicConfig {
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
    lastPannel: string,
    closeWindowMinimized?: boolean
}