import { Capacitor } from '@capacitor/core';

/**
 * Capacitor 原生平台的 API 端点。
 * 值由 renderer/next.config.js 在构建期从仓库根目录 api-server.json（不入库，
 * 模板见 api-server.json.example）读取并经 env 内联；Android 端 MainActivity 的
 * 媒体代理经 BuildConfig 读取同一文件，两端天然一致。
 * TODO: 移入应用设置界面持久化。
 */
export const NATIVE_API_BASE: string = process.env.NATIVE_API_BASE ?? '';

/** 当前平台 API 请求基址（同步版，仅原生/网页两态；Electron 的 apiHost 走 ensureApiBase） */
export function getNativeApiBase(): string {
    return Capacitor.isNativePlatform() ? NATIVE_API_BASE : '';
}
