import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Capacitor 原生平台的 API 端点——构建期默认值。
 * 值由 renderer/next.config.js 在构建期从仓库根目录 api-server.json（不入库，
 * 模板见 api-server.json.example）读取并经 env 内联；Android 端 MainActivity 的
 * 媒体代理经 BuildConfig 读取同一文件，两端天然一致。
 * 运行时可经登录页/设置页修改并持久化到原生 SharedPreferences（本地插件
 * ApiServerPlugin），未设置时回落本默认值；媒体壳层代理每次拦截重读存储，即时生效。
 */

/** 本地插件 ApiServerPlugin（android/.../ApiServerPlugin.java）的桥接声明 */
interface ApiServerPluginProtocol {
    set(options: { apiServer: string }): Promise<void>;
    get(): Promise<{ apiServer: string | null }>;
}

const ApiServerPlugin = registerPlugin<ApiServerPluginProtocol>('ApiServerPlugin');

export const NATIVE_API_BASE: string = process.env.NATIVE_API_BASE ?? '';

// 运行时端点缓存：null 表示尚未从原生读出，此时回落构建期默认值
let nativeApiBase: string | null = null;
let nativeApiBaseReady: Promise<string> | null = null;

if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    // 模块加载即预热：登录页首帧展示的就是持久化端点而非构建期默认值
    void ensureNativeApiBase();
}

/**
 * 等待原生端点就绪（仅原生平台需要一次插件往返），发请求前调用。
 * 非原生平台恒返回空串。
 */
export function ensureNativeApiBase(): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
        return Promise.resolve('');
    }
    if (nativeApiBaseReady === null) {
        nativeApiBaseReady = ApiServerPlugin.get()
            .then(({ apiServer }) => {
                nativeApiBase = apiServer ?? NATIVE_API_BASE;
                return nativeApiBase;
            })
            .catch(() => {
                // 插件调用失败（理论上仅原生实现缺失时发生）回落构建期默认值
                nativeApiBase = NATIVE_API_BASE;
                return nativeApiBase;
            });
    }
    return nativeApiBaseReady;
}

/** 当前平台 API 请求基址（同步读缓存，仅原生/网页两态；Electron 的 apiHost 走 ensureApiBase） */
export function getNativeApiBase(): string {
    return Capacitor.isNativePlatform() ? (nativeApiBase ?? NATIVE_API_BASE) : '';
}

/** 保存端点并立即生效（更新缓存并返回规范化值；网页/Electron 调用为空操作） */
export async function setNativeApiBase(apiServer: string): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
        return '';
    }
    const normalized = apiServer.trim().replace(/\/+$/, '');
    await ApiServerPlugin.set({ apiServer: normalized });
    nativeApiBase = normalized;
    nativeApiBaseReady = Promise.resolve(normalized);
    return normalized;
}
