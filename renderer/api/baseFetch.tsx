const host = "http://localhost"
var heiMusicConfig: HeiMusicConfig = null;
if (typeof (window) !== "undefined" && typeof (window.electronAPI) !== "undefined") {
    //再加个读写锁...
    window.electronAPI.config.onChange((e, v) => {
        heiMusicConfig = v;
    })
}

interface IBaseFetch extends RequestInit {
    path: string,
}

//fixme: application error on heiMusicConfig not ready but function got called.
export default async function baseFetch(props: IBaseFetch): Promise<Response> {
    if (typeof (window) !== "undefined" && typeof (window.electronAPI) === "undefined") {
        return fetch(`${host}${props.path}`, { credentials: "include", ...props })
    }
    //每次调用都会判断一下，会有性能损失，或许该考虑工厂模式，或者如果有构造函数的话
    if (heiMusicConfig === null) {
        await window.electronAPI.config.get().then(res => {
            heiMusicConfig = res;
        })
    }

    return fetch(
        `${host}${props.path}`,
        {
            ...props,
            headers: {
                ...props.headers,
                "x-heimusic-auth-uid": heiMusicConfig.userId,
                "x-heimusic-auth-sid": heiMusicConfig.sessionId
            },
        }
    )
}