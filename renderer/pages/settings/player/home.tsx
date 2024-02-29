import { Box, Divider, TextField, Typography } from "@mui/material"
import Button from "@mui/material/Button"
import * as React from "react"

import Layout from "./layout"

const version = "0.3.3"


/**
 * 播放器设置的基础设置
 * 
 */
export default function Home() {
    const [apiHost, setApiHost] = React.useState("")
    const [hotkeys, setHotKeys] = React.useState({
        playback: "",
        prev: "string",
        next: "string",
        // favoriate: 'string',
    })

    React.useEffect(() => {
        if (typeof (window) !== "undefined" && typeof (window.electronAPI) === "undefined") {
            //网页端
            setApiHost("") //默认网页端使用的api服务器与当前网站地址相同
        } else {
            //客户端
            var heiMusicConfig: HeiMusicConfig = null;
            // window.electronAPI.config.onChange((e, v) => {
            //     heiMusicConfig = v;
            // })
            if (heiMusicConfig === null) {
                window.electronAPI.config.get().then(res => {
                    heiMusicConfig = res;
                    setApiHost(heiMusicConfig.apiHost)
                    setHotKeys(heiMusicConfig.hotkeys)
                })
            }

        }
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
        window.electronAPI.config.set("apiHost", apiHost);
        window.electronAPI.config.saveAndReload();
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
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex" }}>
                    <Typography  >服务器设置</Typography>
                    <Typography variant="subtitle2" sx={{ margin: "auto 12px auto auto" }} color="GrayText">当前版本{version}</Typography>
                </Box>
                <Divider sx={{ margin: "2px 0px" }} />
                <Box sx={{ display: "flex", alignItems: "center", margin: "4px 0px" }}>
                    <Typography sx={{ minWidth: "30%" }} variant="subtitle2">API服务器</Typography>
                    <TextField sx={{ flexGrow: "1", marginRight: "12px" }} size="small" value={apiHost} onChange={e => setApiHost(e.target.value)} spellCheck={false} />
                    <Button variant='contained' size='small' onClick={handleSaveApiHost}>保存并重启</Button>
                </Box>
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