var heiMusicConfig: HeiMusicConfig = null;
if (typeof (window) !== "undefined" && typeof (window.electronAPI) !== "undefined") {
    window.electronAPI.config.onChange((e, v) => {
        heiMusicConfig = v;
    })
}

interface IBaseFetch extends RequestInit {
    path: string,
}

export default async function baseFetch(props: IBaseFetch): Promise<Response> {
    //网页端
    if (typeof (window) !== "undefined" && typeof (window.electronAPI) === "undefined") {
        const host = "" //默认网页端使用的api服务器与当前网站地址相同
        return fetch(`${host}${props.path}`, { credentials: "include", ...props })
    }
    //客户端
    if (heiMusicConfig === null) {
        await window.electronAPI.config.get().then(res => {
            heiMusicConfig = res;
        })
    }
    return fetch(`${heiMusicConfig.apiHost}${props.path}`, { ...props })
}