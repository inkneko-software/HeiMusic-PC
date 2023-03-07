import React from 'react';
import Head from 'next/head';
import makeStyles from '@mui/styles/makeStyles';
import createStyles from '@mui/styles/createStyles';
import Button from '@mui/material/Button';

import Typography from '@mui/material/Typography';
import Link from './Link';
import SvgIcon from '@mui/material/SvgIcon';

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import Remove from '@mui/icons-material/Remove';
import Crop32 from '@mui/icons-material/Crop32';
import Crop75OutlinedIcon from '@mui/icons-material/Crop75Outlined';
import Close from '@mui/icons-material/Close';
import Maximize from '@mui/icons-material/Maximize';
import MenuIcon from '@mui/icons-material/Menu';

import LoginDialog from './Auth/LoginDialog';
import Avatar from '@mui/material/Avatar';
import LeftPannel from './LeftPannel/LeftPannel';
import MusicControlPannel from './MusicControlPannel/MusicControlPannel';

import Skin from './Icon/Skin'

import { HeiMusicThemeContext } from '../lib/HeiMusicThemeProvider';
import { useTheme } from '@mui/styles';
import OnCloseDialog from './OnCloseDialog';

function HeiMusicMainLayout({ children }) {
    const theme = useTheme();
    const heimusicThemeContext = React.useContext(HeiMusicThemeContext)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [loginDialogOpen, setLoginDialogOpen] = React.useState(false)
    var onCloseClicked = () => {
        setDialogOpen(true);
        // window.electronAPI.windowManagement.close()
    }

    return (
        <Box sx={{ width: "calc(100vw)", height: "calc(100vh)", display: "flex", flexDirection: 'column', background: `url(${heimusicThemeContext.backgroundUrl})`, backgroundRepeat: "no-repeat", backgroundSize: "cover" }}>
            <LoginDialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)} />
            <OnCloseDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
            {/* Logo 与 系统标题栏 */}
            <Box sx={{ height: 64, flex:"0 0 auto", width: "100%", display: "flex", WebkitAppRegion: "drag", userSelect: "none", }}>
                <Box sx={{ width: "196px", height: "100%", background: theme.palette.pannelBackground.main, display: "flex" }}  >
                    <Box sx={{ margin: "auto auto auto 12px", display: "flex" }}>
                        <Avatar src='/images/logo.jpg'></Avatar>
                        <Typography sx={{ margin: "auto 0 auto 6px" }} variant="h6">HeiMusic!</Typography>
                    </Box>
                </Box>
                <Box sx={{ flexGrow: 1, display: "flex", background: theme.palette.pannelBackground.light }}>
                    <Box sx={{ margin: "auto 5px auto auto", WebkitAppRegion: "no-drag", }}>
                        <Button onClick={() => setLoginDialogOpen(true)} size="small" >点击登录</Button>
                    </Box>
                    <Box sx={{ margin: "auto 5px auto 0", WebkitAppRegion: "no-drag", }}>
                        <HeiMusicThemeContext.Consumer>
                            {
                                context => {
                                    return <IconButton  sx={{ color: theme.palette.text.primary }} onClick={() => context.setMode(context.mode === "light" ? "customizedDarkMode" : "light")}><Skin fontSize='small' /></IconButton>
                                }
                            }
                        </HeiMusicThemeContext.Consumer>

                        <IconButton sx={{ color: theme.palette.text.primary }}><MenuIcon fontSize='small' /></IconButton>
                    </Box>
                    <Box sx={{ width: 2, height: 18, background: "gray", margin: "auto 6px auto 6px" }}></Box>
                    <Box sx={{ margin: "auto 0 auto 0", WebkitAppRegion: "no-drag" }}>
                        <IconButton sx={{ color: theme.palette.text.primary }}><Remove /> </IconButton>
                        <IconButton sx={{ color: theme.palette.text.primary }} ><Crop75OutlinedIcon /> </IconButton>
                        <IconButton sx={{ color: theme.palette.text.primary }} onClick={onCloseClicked}><Close /></IconButton>
                    </Box>
                </Box>
            </Box>
            {/* 左侧面板 与 右侧 */}
            <Box sx={{display: "flex", height: "100%" }}>
                <LeftPannel sx={{ width: "196px", flex:"0 0 auto", overflowY: "auto", display: "flex", flexDirection: "column", background: theme.palette.pannelBackground.main }} />
                {/* 上部视窗 与 下部播放器 */}
                <Box sx={{ overflow:"hidden", width:"100%",  display: "flex", flexDirection: "column", background: theme.palette.pannelBackground.light }}>
                    {/* <MusicAlbum sx={{ flexGrow: 1 }} /> */}
                    <Box sx={{ flexGrow: 1, flexShrink: 1, maxHeight: "calc(100vh - 64px - 76px)" }}>{children}</Box>
                    <MusicControlPannel sx={{ height: "76px", flexShrink: 0 }} />
                </Box>
            </Box>


        </Box>
    );
}

export default HeiMusicMainLayout;
