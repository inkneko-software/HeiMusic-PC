import React from "react"
import Box from "@mui/material/Box"
import { BoxProps } from "@mui/material"
import List from "@mui/material/List"
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import ListItemText from "@mui/material/ListItemText"
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import PannelList from './PannelList'
import PannelItem, { StyledListItemButton } from './PannelItem'
import RadioPannelList from "./RadioPannelList";
interface LeftPannelProps extends BoxProps {
    uid?: number;
}

function LeftPannel(props: LeftPannelProps) {

    const [activeList, setActiveList] = React.useState("在线音乐")
    const [activeIndex, setActiveIndex] = React.useState(1)
    const [myMusicListOpen, setMyMusicListOpen] = React.useState(false);

    return (
        <Box {...props}>
            <List sx={{ margin: "12px 12px", }} >
                <RadioPannelList value={{
                    activeIndex: activeIndex,
                    setActiveIndex: setActiveIndex,
                    activeName: activeList,
                    setActiveName: setActiveList,
                }}
                >
                    <PannelList sx={{ marginBottom: "18px" }} context={{ name: "在线音乐" }} >
                        <ListItemText
                            primary="在线音乐"
                            sx={{ paddingLeft: "12px", paddingRight: "12px" }}
                            primaryTypographyProps={{ variant: "subtitle2", sx: { userSelect: "none" } }}
                        />
                        <PannelItem index={1} icon={<AutoAwesomeIcon />} text="推荐" />
                        <PannelItem index={2} icon={<LibraryMusicIcon />} text="专辑管理" />
                    </PannelList>
                    <PannelList sx={{ marginBottom: "18px" }} context={{ name: "我的音乐" }}>
                        <ListItemText
                            sx={{ paddingLeft: "12px", paddingRight: "12px" }}
                            primary="我的音乐"
                            primaryTypographyProps={{ variant: "subtitle2", sx: { userSelect: "none" } }}
                        />
                        <PannelItem index={1} icon={<FavoriteOutlinedIcon />} text="我喜欢" />
                        <PannelItem index={2} icon={<FileDownloadOutlinedIcon />} text="本地和下载" />
                        <PannelItem index={3} icon={<RestoreOutlinedIcon />} text="最近播放" />
                    </PannelList>

                    <PannelList sx={{ marginBottom: "18px" }} context={{ name: "创建的歌单" }}>
                        <StyledListItemButton onClick={() => setMyMusicListOpen(!myMusicListOpen)}>
                            <ListItemText primary="创建的歌单" primaryTypographyProps={{ variant: "subtitle2" }} />
                            {myMusicListOpen ? <ExpandLess /> : <ExpandMore />}
                        </StyledListItemButton>
                        <Collapse in={myMusicListOpen} timeout="auto" unmountOnExit sx={{ marginBottom: "18px" }}>
                            <PannelItem index={1} text="VOCALOID" />
                        </Collapse>
                    </PannelList>
                </RadioPannelList>
            </List>
        </Box>
    )
}

export default LeftPannel;