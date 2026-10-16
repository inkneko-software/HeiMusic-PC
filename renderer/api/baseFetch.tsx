import { Capacitor } from '@capacitor/core';
import { ensureNativeApiBase } from '../lib/apiServer';
import { ensureApiBase } from '../lib/mediaUrl';

interface IBaseFetch extends RequestInit {
    path: string,
}

export default async function baseFetch(props: IBaseFetch): Promise<Response> {
    //Capacitor 原生：持久化端点（lib/apiServer.ts，未设置回落构建期内联值），fetch 由 CapacitorHttp 原生层发出，无 CORS
    if (Capacitor.isNativePlatform()) {
        return fetch(`${await ensureNativeApiBase()}${props.path}`, { credentials: "include", ...props })
    }
    //网页端：同源相对路径（/api 由 nginx 或 dev server rewrites 反代），无跨域
    //Electron：拼接配置的 apiHost 直连（媒体走 app:// 壳层代理，API 直连靠后端 CORS 白名单）
    if (typeof window !== "undefined" && typeof window.electronAPI !== "undefined") {
        return fetch(`${await ensureApiBase()}${props.path}`, { ...props })
    }
    return fetch(props.path, { credentials: "include", ...props })
}
