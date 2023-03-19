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
        onChange: (callback: (event: Electron.IpcRendererEvent, config: HeiMusicConfig) => void) => ipcRenderer.on("config::onChange", callback)
    }
})
