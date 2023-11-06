import { ResponseMusic } from "@api/codegen";

var heiMusicConfig: HeiMusicConfig = null;
if (typeof (window) !== "undefined" && typeof (window.electronAPI) !== "undefined") {
    window.electronAPI.config.onChange((e, v) => {
        heiMusicConfig = v;
    })
}

export async function addMusic(title: string, file: Blob, translateTitle?: string, artistList?: Array<string>, onprogress?: (loaded: number, total: number) => void): Promise<ResponseMusic> {
    var host: string = "";
    if (typeof (window) !== "undefined" && typeof (window.electronAPI) !== "undefined") {
        //客户端
        if (heiMusicConfig === null) {
            await window.electronAPI.config.get().then(res => {
                heiMusicConfig = res;
            })
        }
        host = heiMusicConfig.apiHost
    }

    var request = new XMLHttpRequest();

    return new Promise<ResponseMusic>((resolve, reject) => {
        request.open("post", host + "/api/v1/music/add");

        request.onload = (e) => {
            resolve(JSON.parse(request.response));
        }

        request.onerror = e => {
            reject(e);
        }
        request.upload.onloadstart = e =>{
            if (onprogress !== undefined) {
                onprogress(e.loaded, e.total);
            }
        }

        request.upload.onprogress = e => {
            if (onprogress !== undefined) {
                onprogress(e.loaded, e.total);
            }
        }

        var form = new FormData();
        form.set("title", title);
        form.set("file", file);
        if (translateTitle !== undefined) {
            form.set("translateTitle", translateTitle);
        }

        if (artistList !== undefined) {
            artistList.forEach(v => form.append("artistList", v));
        }
        request.send(form);
    });

}