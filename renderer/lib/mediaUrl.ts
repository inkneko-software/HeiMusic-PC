/**
 * Electron 下 API 请求基址的获取入口（供 codegen/core/request.ts、baseFetch 使用）。
 *
 * 媒体资源（封面、音频）不走这里：渲染层对后端资源统一使用相对路径
 * （/api/...、/public/...），由各平台壳层代理到后端——网页端为 nginx 反代，
 * 开发态为 dev server 的 next rewrites，Electron 生产态为主进程的 app:// 协议代理
 * （见 main/background.ts 的 BACKEND_PATH_PREFIXES，前缀表需与 nginx 保持一致）。
 */

const isElectron = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';

let electronApiHost = '';
let electronApiHostReady: Promise<string> = Promise.resolve('');

if (isElectron) {
    window.electronAPI.config.onChange((_e, config) => { electronApiHost = config.apiHost });
    electronApiHostReady = window.electronAPI.config.get().then(config => {
        electronApiHost = config.apiHost;
        return electronApiHost;
    });
}

/** 异步等待 API 基址就绪（仅 Electron 需要一次 IPC 往返），发请求前调用。 */
export function ensureApiBase(): Promise<string> {
    return electronApiHostReady;
}
