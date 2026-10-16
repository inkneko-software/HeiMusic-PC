import { Box, Divider, TextField, Typography } from "@mui/material"
import Button from "@mui/material/Button"
import * as React from "react"

import Layout from "./layout"
import { Capacitor } from "@capacitor/core"
import useToast from '@components/Common/Toast';
import { ensureNativeApiBase, setNativeApiBase } from "../../../lib/apiServer"

//版本号由 renderer/next.config.js 构建期从 package.json 注入
const version = process.env.APP_VERSION ?? ""


/**
 * 播放器设置的基础设置
 * 
 */
export default function Home() {
    const [apiHost, setApiHost] = React.useState("")
    //Electron 客户端标记（与 login.tsx 一致）；安卓原生标记走本地插件持久化端点；网页端同源无可配置项
    const [client, setClient] = React.useState(false)
    const [isNative, setIsNative] = React.useState(false)
    const [Toast, makeToast] = useToast();
    const [hotkeys, setHotKeys] = React.useState({
        playback: "",
        prev: "string",
        next: "string",
        // favoriate: 'string',
    })

    React.useEffect(() => {
        if (typeof (window) !== "undefined" && typeof (window.electronAPI) !== "undefined") {
            //Electron 客户端：经 IPC 读取可配置的 apiHost 与快捷键
            setClient(true)
            window.electronAPI.config.get().then(res => {
                setApiHost(res.apiHost)
                setHotKeys(res.hotkeys)
            })
        } else if (typeof (window) !== "undefined" && Capacitor.isNativePlatform()) {
            //安卓原生：经本地插件读持久化端点（未设置回落构建期内联值）
            setIsNative(true)
            ensureNativeApiBase().then(setApiHost)
        }
        //网页端 API 与页面同源（nginx 反代），无可配置的 apiHost
    }, [])

    var keymap = {};
    var clearHandle = null;
    const keydownListener = (event: React.KeyboardEvent<HTMLDivElement>, callback: (hotkey: string) => void) => {
        if (event.key.match(/^[a-z]$/) !== null) {
            keymap[event.key.toUpperCase()] = event.code;
        } else if (event.key === ' ') {
            keymap[event.code] = event.code;
        } else if (event.key.match(/^Arrow/) !== null) {
            keymap[event.key.replace("Arrow", '')] = event.code;
        } else {
            keymap[event.key] = event.code;
        }
        if (clearHandle === null) {
            clearHandle = setInterval(() => {
                //支持小键盘
                //var convertedAccelerators: string[] = []
                // for (var key in keymap.keys()) {

                //     if (key.match(/[0-9]/)) { //数字的处理，可能为纯数字，也可能是小键盘数字
                //         //如小键盘数字1，key=1(如同code=Digits1), code=Numpad1，映射到Electron Accelerator为num1
                //         if (keymap.get(key).match(/Numpad[0-9]/)) {
                //             convertedAccelerators.push("num" + key);
                //         } else {
                //             convertedAccelerators.push(key);
                //         }
                //     } else if (key.match(/[+-\/*]/)) { //加减乘除的处理。至于另外的两个键（点和回车），Electron没有相关映射，故不处理
                //         if (keymap.get(key).match(/Numpad[0-9]/)) {
                //             convertedAccelerators.push("num" + key);
                //         } else {
                //             convertedAccelerators.push(key);
                //         }
                //     }
                // }
                callback(Object.keys(keymap).sort((a, b) => b.length - a.length).join('+'));
                clearInterval(clearHandle);
                clearHandle = null;
            }, 500)
        }
        event.preventDefault()
    }

    const handleSaveApiHost = () => {
        if (apiHost.trim() === "") {
            return;
        }
        if (client) {
            //Electron：保存并重启后生效
            window.electronAPI.config.set("apiHost", apiHost.trim());
            window.electronAPI.config.saveAndReload();
        } else {
            //安卓原生：持久化后即时生效（请求层与媒体壳层代理都读当前值），无需重启
            setNativeApiBase(apiHost)
                .then(() => makeToast("已保存", "success", "bottom-right"))
                .catch(() => makeToast("保存失败，请稍后尝试", "error", "bottom-right"))
        }
    }


    const onHotKeyPlaybackChange = (hotkey: string,) => {
        var config = {...hotkeys, playback: hotkey };
        setHotKeys(config)
        window.electronAPI.config.setHotKey("playback", hotkey);
    }

    const onHotKeyPrevChange = (hotkey: string,) => {
        var config = {...hotkeys, prev: hotkey };
        setHotKeys(config)
        window.electronAPI.config.setHotKey("prev", hotkey);

    }

    const onHotKeyNextChange = (hotkey: string,) => {
        var config = {...hotkeys, next: hotkey };
        setHotKeys(config)
        window.electronAPI.config.setHotKey("next", hotkey);

    }

    const onHotKeyFavoriateChange = (hotkey: string,) => {
        setHotKeys(prev => ({ ...prev, fav: hotkey }))
        // window.electronAPI.config.set('hotkeys', hotkeys);
        // window.electronAPI.config.save();
    }

    return (
        <Layout>
            {Toast}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex" }}>
                    {(client || isNative) && <Typography  >服务器设置</Typography>}
                    <Typography variant="subtitle2" sx={{ margin: "auto 12px auto auto" }} color="GrayText">当前版本{version}</Typography>
                </Box>
                {(client || isNative) && <Divider sx={{ margin: "2px 0px" }} />}
                {(client || isNative) &&
                    <Box sx={{ display: "flex", alignItems: "center", margin: "4px 0px" }}>
                        <Typography sx={{ minWidth: "30%" }} variant="subtitle2">API服务器</Typography>
                        <TextField sx={{ flexGrow: "1", marginRight: "12px" }} size="small" value={apiHost} onChange={e => setApiHost(e.target.value)} spellCheck={false} />
                        {/* Electron 需重启生效；安卓原生保存即生效 */}
                        <Button variant='contained' size='small' onClick={handleSaveApiHost}>{client ? "保存并重启" : "保存"}</Button>
                    </Box>
                }
                <Typography sx={{ marginTop: "12px" }} >快捷键设置</Typography>
                <Divider sx={{ margin: "2px 0px" }} />
                <Box sx={{ display: "flex", margin: "4px 0px" }}>
                    <Typography sx={{ minWidth: "30%" }} variant="subtitle2">播放</Typography>
                    <TextField sx={{ flexGrow: "1" }} size="small" value={hotkeys.playback} onKeyDown={e => { keydownListener(e, onHotKeyPlaybackChange) }} spellCheck={false} />
                </Box>
                <Box sx={{ display: "flex", margin: "4px 0px" }}>
                    <Typography sx={{ minWidth: "30%" }} variant="subtitle2">上一首</Typography>
                    <TextField sx={{ flexGrow: "1" }} size="small" value={hotkeys.prev} onKeyDown={e => { keydownListener(e, onHotKeyPrevChange) }} spellCheck={false} />
                </Box>
                <Box sx={{ display: "flex", margin: "4px 0px" }}>
                    <Typography sx={{ minWidth: "30%" }} variant="subtitle2">下一首</Typography>
                    <TextField sx={{ flexGrow: "1" }} size="small" value={hotkeys.next} onKeyDown={e => { keydownListener(e, onHotKeyNextChange) }} spellCheck={false} />
                </Box>
                {/* <Box sx={{ display: "flex", margin: "4px 0px" }}>
                    <Typography sx={{ minWidth: "30%" }} variant="subtitle2">添加收藏</Typography>
                    <TextField sx={{ flexGrow: "1" }} size="small" value={hotkeys.favoriate} onKeyDown={e => { keydownListener(e, onHotKeyPlaybackChange) }} spellCheck={false} />
                </Box> */}

            </Box>
        </Layout>
    )
}