import { IAudioMetadata } from "music-metadata"
import { ICueSheet } from "cue-parser/lib/types"
declare global {

    interface Window {
        electronAPI: {
            windowManagement: {
                close: () => void,
                minimize: () => void,
                maximize: () => void,
            },
            config: {
                //获取当前内存中的配置。配置对象保存在主进程中
                get: () => Promise<HeiMusicConfig>,
                //设置内存中配置的某项
                set: (key: any, value: any) => void,
                //保存当前内存中的配置至文件
                save: () => Promise<null>,
                //订阅配置更新
                onChange: (callback: (event: Electron.IpcRendererEvent, config: HeiMusicConfig) => void) => void
            },
            music: {
                parse: (filepath: string) => Promise<IAudioMetadata>,
                parseCue: (filepath: string) => Promise<ICueSheet>
            },
            playback: {
                play: (callback: () => void) => void,
                next: (callback: () => void) => void,
                prev: (callback: () => void) => void,
                cleanup: () => void,
            }
        }
    }

    interface File {
        path: string
    }
}

export { }