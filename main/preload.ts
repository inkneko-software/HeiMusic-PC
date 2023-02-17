import { contextBridge, ipcRenderer} from "electron"
// contextBridge.exposeInMainWorld('versions', {
//   node: () => process.versions.node,
//   chrome: () => process.versions.chrome,
//   electron: () => process.versions.electron,
// })

contextBridge.exposeInMainWorld('electronAPI', {
    windowManagement: {
        close: ()=>ipcRenderer.send('windowManagement-close'),
    }
})

