import { Capacitor } from '@capacitor/core';

import apiServerConfig from '../../api-server.json';

/**
 * Capacitor 原生平台的 API 端点。
 * 配置文件为仓库根目录的 api-server.json（不入库，模板见 api-server.json.example）；
 * Android 端 MainActivity 的媒体代理经 BuildConfig 读取同一文件，两端天然一致。
 * TODO: 移入应用设置界面持久化。
 */
export const NATIVE_API_BASE: string = apiServerConfig.apiServer;

/** 当前平台 API 请求基址（同步版，仅原生/网页两态；Electron 的 apiHost 走 ensureApiBase） */
export function getNativeApiBase(): string {
    return Capacitor.isNativePlatform() ? NATIVE_API_BASE : '';
}
