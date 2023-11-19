import { Box, Divider, TextField, Typography } from "@mui/material"
import * as React from "react"

import Layout from "./layout"

const version = "0.2.3"


/**
 * 播放器设置的基础
 * 
 */
export default function Home() {
    const [apiHost, setApiHost] = React.useState("")

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
                })
            }

        }
    }, [])

    return (
        <Layout>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Box sx={{display:"flex"}}>
                    <Typography  >服务器设置</Typography>
                    <Typography variant="subtitle2" sx={{ margin: "auto 12px auto auto" }} color="GrayText">当前版本{version}</Typography>
                </Box>
                <Divider sx={{ margin: "2px 0px" }} />
                <Box sx={{ display: "flex", alignItems: "center", margin: "4px 0px" }}>
                    <Typography sx={{ minWidth: "30%" }} variant="subtitle2">API服务器</Typography>
                    <TextField sx={{ flexGrow: "1" }} size="small" value={apiHost} />
                </Box>
                <Typography sx={{ marginTop: "12px" }} >快捷键设置</Typography>
                <Divider sx={{ margin: "2px 0px" }} />
                <Box sx={{ display: "flex", margin: "4px 0px" }}>
                    <Typography sx={{ minWidth: "30%" }} variant="subtitle2">播放</Typography>
                    <TextField sx={{ flexGrow: "1" }} size="small" value="CTRL+ALT+P" />
                </Box>
                <Box sx={{ display: "flex", margin: "4px 0px" }}>
                    <Typography sx={{ minWidth: "30%" }} variant="subtitle2">上一首</Typography>
                    <TextField sx={{ flexGrow: "1" }} size="small" value="CTRL+ALT+P" />
                </Box>
                <Box sx={{ display: "flex", margin: "4px 0px" }}>
                    <Typography sx={{ minWidth: "30%" }} variant="subtitle2">下一首</Typography>
                    <TextField sx={{ flexGrow: "1" }} size="small" value="CTRL+ALT+P" />
                </Box>
                <Box sx={{ display: "flex", margin: "4px 0px" }}>
                    <Typography sx={{ minWidth: "30%" }} variant="subtitle2">添加收藏</Typography>
                    <TextField sx={{ flexGrow: "1" }} size="small" value="CTRL+ALT+P" />
                </Box>

            </Box>
        </Layout>
    )
}