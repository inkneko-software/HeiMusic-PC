import React from 'react'
import Head from 'next/head'
import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import Button from '@mui/material/Button'

import Typography from '@mui/material/Typography'
import Link from 'next/link'
import SvgIcon from '@mui/material/SvgIcon'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

import Remove from '@mui/icons-material/Remove'
import Crop32 from '@mui/icons-material/Crop32'
import Crop75OutlinedIcon from '@mui/icons-material/Crop75Outlined'
import Close from '@mui/icons-material/Close'
import Maximize from '@mui/icons-material/Maximize'
import MenuIcon from '@mui/icons-material/Menu'
import Poper from '@mui/material/Popper'

import LoginDialog from './Auth/LoginDialog'
import Avatar from '@mui/material/Avatar'
import LeftPannel from './LeftPannel/LeftPannel'
import MusicControlPannel from './MusicControlPannel/MusicControlPannel'

import Skin from './Common/Icon/Skin'

import { HeiMusicThemeContext } from '../lib/HeiMusicThemeProvider'
import { useTheme } from '@mui/styles'
import OnCloseDialog from './OnCloseDialog'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import useToast from './Common/Toast'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import { ApiError, AuthControllerService, UserControllerService } from '../api/codegen'
import { useRouter } from 'next/router'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';

import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import ArrowBackIosOutlinedIcon from '@mui/icons-material/ArrowBackIosOutlined';

function HeiMusicMainLayout({ children }) {
    const theme = useTheme()
    const router = useRouter();
    const heimusicThemeContext = React.useContext(HeiMusicThemeContext)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [loginDialogOpen, setLoginDialogOpen] = React.useState(false)
    const [Toast, makeToast] = useToast()
    const [heiMusicConfig, setHeiMusicConfig] = React.useState<HeiMusicConfig>(null)
    const settingButtonRef = React.useRef(null)
    const [settingMenuOpen, setSettingMenuOpen] = React.useState(false)

    const onCloseClicked = () => {
        if (heiMusicConfig.closeWindowMinimized === null) {
            setDialogOpen(true)
            return
        }

        if (!heiMusicConfig.closeWindowMinimized) {
            window.electronAPI.windowManagement.close()
        } else {
            // window.electronAPI.windowManagement.minimize()
        }
    }

    const [userDetail, setUserDetail] = React.useState(null)

    const handleLogout = () => {
        AuthControllerService.logout()
            .then(res => {
                router.reload();
            });
    }

    React.useEffect(() => {
        if (window.electronAPI !== undefined) {
            void window.electronAPI.config.get().then((value) => {
                setHeiMusicConfig(value)
            })
            // 读取登录状态
            UserControllerService.nav()
                .then(res => {
                    if (res.code === 0) {
                        setUserDetail({ avatarUrl: res.data.avatarUrl, username: res.data.username === null ? `用户[${res.data.userId}]` : res.data.username })
                    } else {
                        makeToast(res.message, "error", "bottom-left")
                    }
                })
                .catch((error: ApiError) => {
                    if (error.status === 403) {

                    } else {
                        makeToast('网络连接失败', 'error', "top-right")
                    }
                })
                .catch(() => {
                    makeToast('网络连接失败', 'error', "top-right")
                })
        }
    }, [])

    return (
        <Box sx={{ width: 'calc(100vw)', height: 'calc(100vh)', display: 'flex', flexDirection: 'column', background: `url(${heimusicThemeContext.backgroundUrl})`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}>
            {Toast}
            <LoginDialog open={loginDialogOpen} onClose={() => { setLoginDialogOpen(false) }} />
            <OnCloseDialog open={dialogOpen} onClose={() => { setDialogOpen(false) }} />
            {/* Logo 与 系统标题栏 */}
            <Box sx={{ height: "64px", flex: '0 0 auto', width: '100%', display: 'flex', WebkitAppRegion: 'drag', userSelect: 'none' }}>
                {/* 左侧logo */}
                <Box sx={{ width: '196px', height: '100%', background: theme.palette.pannelBackground.main, display: 'flex' }} >
                    <Box sx={{ margin: 'auto auto auto 12px', display: 'flex' }}>
                        <Avatar src='/images/logo.jpg'></Avatar>
                        <Typography sx={{ margin: 'auto 0 auto 6px' }} variant="h6">HeiMusic!</Typography>
                    </Box>
                </Box>
                {/* 右侧状态栏 */}
                <Box sx={{ flexGrow: 1, display: 'flex', background: theme.palette.pannelBackground.light }}>
                    {/* 导航前进与后退 */}
                    <IconButton size="small" onClick={()=>{router.back()}} sx={{ margin: "auto 0px",  WebkitAppRegion: 'no-drag' }}><ChevronLeftOutlinedIcon/></IconButton>
                    <IconButton size="small" onClick={()=>{window.history.forward()}} sx={{ margin: "auto 0px",  WebkitAppRegion: 'no-drag' }}><ChevronRightOutlinedIcon/></IconButton>
                    <Box sx={{ margin: "auto 12px", WebkitAppRegion: 'no-drag' }}>
                        <InputBase startAdornment={<SearchOutlinedIcon />} size='small' placeholder='搜索音乐' sx={{ borderRadius: '12px', border: '1px grey solid', padding: '2px 12px', fontSize: '14px', "input": { padding: 0 } }} />
                    </Box>
                    <Box sx={{ margin: 'auto 5px auto auto', WebkitAppRegion: 'no-drag' }}>
                        {
                            userDetail === null
                                ? <Button onClick={() => { setLoginDialogOpen(true) }} size="small" >点击登录</Button>
                                : <Box sx={{ display: 'flex' }}><Avatar src={userDetail.avatarUrl} sx={{ width: '24px', height: '24px' }} /><Typography sx={{ margin: 'auto 8px', maxWidth: '160px' }} noWrap>{userDetail.username}</Typography></Box>
                        }
                    </Box>
                    <Box sx={{ margin: 'auto 5px auto 0', WebkitAppRegion: 'no-drag' }}>
                        <HeiMusicThemeContext.Consumer>
                            {
                                context => {
                                    return <IconButton sx={{ color: theme.palette.text.primary }} onClick={() => { context.setMode(context.mode === 'light' ? 'dark' : 'light') }}><Skin fontSize='small' /></IconButton>
                                }
                            }
                        </HeiMusicThemeContext.Consumer>

                        <IconButton title='设置' ref={settingButtonRef} onClick={() => { setSettingMenuOpen(!settingMenuOpen) }} sx={{ color: theme.palette.text.primary }}><MenuIcon fontSize='small' /></IconButton>
                        <Poper anchorEl={settingButtonRef.current} open={settingMenuOpen}>
                            <Paper sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Link href="/userDetail">
                                    <Button>用户设置</Button>
                                </Link>
                                <Button>播放器设置</Button>
                                <Button onClick={handleLogout}>退出登录</Button>
                            </Paper>
                        </Poper>
                    </Box>
                    {
                        typeof (window) !== 'undefined' && typeof (window.electronAPI) !== 'undefined' &&
                        <Box sx={{ margin: 'auto 0 auto 0', WebkitAppRegion: 'no-drag', display: 'flex' }}>
                            <Box sx={{ width: 2, height: 18, background: 'gray', margin: 'auto 6px auto 6px' }}></Box>
                            <IconButton sx={{ color: theme.palette.text.primary }}><Remove /> </IconButton>
                            <IconButton sx={{ color: theme.palette.text.primary }} ><Crop75OutlinedIcon /> </IconButton>
                            <IconButton sx={{ color: theme.palette.text.primary }} onClick={onCloseClicked}><Close /></IconButton>
                        </Box>
                    }
                </Box>
            </Box>
            {/* 左侧面板 与 右侧 */}
            <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
                <LeftPannel sx={{ width: '196px', flex: '0 0 auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: theme.palette.pannelBackground.main }} />
                {/* 上部视窗 与 下部播放器 */}
                <Box sx={{ overflow: 'hidden', width: '100%', display: 'flex', flexDirection: 'column', background: theme.palette.pannelBackground.light }}>
                    {/* <MusicAlbum sx={{ flexGrow: 1 }} /> */}
                    <Box sx={{ flexGrow: 1, flexShrink: 1, maxHeight: 'calc(100vh - 64px - 76px)' }}>{children}</Box>
                    <MusicControlPannel sx={{ height: '76px', flexShrink: 0 }} />
                </Box>
            </Box>

        </Box>
    )
}

export default HeiMusicMainLayout
