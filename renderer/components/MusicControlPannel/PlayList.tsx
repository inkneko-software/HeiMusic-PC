import React from "react"
import { Box, Typography, Button } from "@mui/material"
import { IChangeMusicEvent, IMusicInfo } from "./MusicControlPannel"
import { useTheme } from "@mui/styles"

export interface IPlayList {
    musicList: IMusicInfo[],
    currentIndex: number,
    onClose: () => void
}

export default function PlayList(props: IPlayList) {
    const theme = useTheme()
    const changeMusic = (index: number) => {
        const event = new CustomEvent<IChangeMusicEvent>("music-control-panel::changeMusic", { detail: { index: index } });
        document.dispatchEvent(event)
    }

    return (
        <Box sx={{ width: "300px", height: "100%", display: "flex", flexDirection: "column" }}>
            {/* 标题 */}
            <Box sx={{ margin: "18px 16px 12px 16px", flex: "0 0 auto", display: "flex", flexDirection: "column" }}>
                <Typography variant="h5"  >播放列表</Typography>
                <Typography variant="subtitle2" sx={{ marginTop: "2px" }} >{`${props.musicList.length}首音乐`}</Typography>
            </Box>
            {/* 音乐列表 */}
            <Box sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden" }}>
                {
                    props.musicList.map((music, index) => {
                        return (
                            <Box sx={[{ padding: "6px 16px", ":hover": { background: "rgba(0,0,0,0.1)", color: theme.palette.primary.main, cursor:"pointer"} }, (index === props.currentIndex) && { background: "rgba(0,0,0,0.1)" }]} onDoubleClick={()=>changeMusic(index)} key={index}>
                                <Typography noWrap>{music.title} </Typography>
                                <Typography noWrap sx={{ fontSize: "12px", color: "#a1a1a1", minHeight: "12px" }}>{music.artists.join(" / ")}</Typography>
                            </Box>
                        )
                    })
                }
            </Box>
            {/* 菜单选项 */}
            <Box sx={{ flex: "0 0 auto", margin: "18px 16px", display: "flex" }}>
                <Button onClick={() => props.onClose()}>关闭</Button>
            </Box>
        </Box>
    )
}
