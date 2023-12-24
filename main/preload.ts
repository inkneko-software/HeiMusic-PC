import { contextBridge, ipcRenderer } from "electron"
// contextBridge.exposeInMainWorld('versions', {
//   node: () => process.versions.node,
//   chrome: () => process.versions.chrome,
//   electron: () => process.versions.electron,
// })

contextBridge.exposeInMainWorld('electronAPI', {
    windowManagement: {
        close: () => ipcRenderer.send('windowManagement::close'),
        minimize: () => ipcRenderer.send('windowManagement::minimize'),
        maximize: () => ipcRenderer.send('windowManagement::maximize'),
    },
    config: {
        get: () => ipcRenderer.invoke("config::get"),
        set: (key, value) => ipcRenderer.invoke("config::set", [key, value]),
        save: () => ipcRenderer.invoke("config::save"),
        saveAndReload: () => ipcRenderer.invoke("config::saveAndReload"),
        onChange: (callback: (event: Electron.IpcRendererEvent, config: HeiMusicConfig) => void) => ipcRenderer.on("config::onChange", callback),
    },
    music: {
        parse: (filepath: string) => ipcRenderer.invoke("music::parse", filepath),
        parseCue: (filepath: string) => ipcRenderer.invoke("music::parseCue", filepath),
    },
    playback: {
        play: (callback: () => void) => ipcRenderer.on("playback::play", callback),
        next: (callback: () => void) => ipcRenderer.on("playback::next", callback),
        prev: (callback: () => void) => ipcRenderer.on("playback::prev", callback),
        cleanup: () => { ["playback::play", "playback::next", "playback::prev"].map(val => ipcRenderer.removeAllListeners(val)) }
    },
    thumbnail: {
        playing: () => ipcRenderer.invoke("thumbnail::playing"),
        paused: () => ipcRenderer.invoke("thumbnail::paused"),
    }
})

