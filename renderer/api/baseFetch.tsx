import { Capacitor } from '@capacitor/core';
import { NATIVE_API_BASE } from '../lib/apiServer';
import { ensureApiBase } from '../lib/mediaUrl';

interface IBaseFetch extends RequestInit {
    path: string,
}

export default async function baseFetch(props: IBaseFetch): Promise<Response> {
    //Capacitor 原生：写死端点（lib/apiServer.ts），fetch 由 CapacitorHttp 原生层发出，无 CORS
    if (Capacitor.isNativePlatform()) {
        return fetch(`${NATIVE_API_BASE}${props.path}`, { credentials: "include", ...props })
    }
    //网页端：同源相对路径（/api 由 nginx 或 dev server rewrites 反代），无跨域
    //Electron：拼接配置的 apiHost 直连（媒体走 app:// 壳层代理，API 直连靠后端 CORS 白名单）
    if (typeof window !== "undefined" && typeof window.electronAPI !== "undefined") {
        return fetch(`${await ensureApiBase()}${props.path}`, { ...props })
    }
    return fetch(props.path, { credentials: "include", ...props })
}
