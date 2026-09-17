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
import Popover from '@mui/material/Popover'

import LoginDialog from './Auth/LoginDialog'
import Avatar from '@mui/material/Avatar'
import LeftPannel from './LeftPannel/LeftPannel'
import MusicControlPannel from './MusicControlPannel/MusicControlPannel'

import Skin from './Common/Icon/Skin'

import { HeiMusicThemeContext } from '../lib/HeiMusicThemeProvider'
import { resolveAvatarUrl } from '../lib/avatar'
import { useTheme } from '@mui/styles'
import OnCloseDialog from './OnCloseDialog'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import useToast from './Common/Toast'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import { AlbumControllerService, ApiError, AuthControllerService, UserControllerService } from '../api/codegen'
import { useRouter } from 'next/router'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';

import FilterNoneOutlinedIcon from '@mui/icons-material/FilterNoneOutlined';
import ZoomInMapOutlinedIcon from '@mui/icons-material/ZoomInMapOutlined';
import WebAssetOutlinedIcon from '@mui/icons-material/WebAssetOutlined';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Drawer } from '@mui/material'

/**
 * 发送Toast信息
 * 
 * 通过以下方式调用
 * 
 * const event = new CustomEvent<IHeimusicToastEvent>("main::makeToast", {detail: {...}});
 * 
 * window.dispatchEvent(event)
 */
export interface IHeimusicToastEvent {
    message: string,
    variant?: "success" | "info" | "warning" | "error",
    position?: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center" | "center",
}

/**
 * 发送Toast信息
 * 
 * @param message 消息
 * @param variant 类型，默认error
 * @param position 位置，默认bottom-left
 */
export function pushToast(message: string, variant?: "success" | "info" | "warning" | "error", position?: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center" | "center") {
    const event = new CustomEvent<IHeimusicToastEvent>("main::pushToast", { detail: { message: message, variant: variant, position: position } });
    window.dispatchEvent(event)
}


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
    const [prompt, setPrompt] = React.useState("");
    //当前登录用户的信息
    const [userDetail, setUserDetail] = React.useState(null)

    // const matcheMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [leftPannelDrawerOpen, setLeftPannelDrawerOpen] = React.useState(false)

    //读取当前登录用户信息；个人资料/头像在用户设置页更新后
    //通过 user::profileUpdated 事件触发重新拉取
    const refreshUserDetail = React.useCallback(() => {
        UserControllerService.nav()
            .then(res => {
                setUserDetail({ avatarUrl: res.data.avatarUrl, username: res.data.username === null ? `用户[${res.data.userId}]` : res.data.username })
            })
            .catch((error: ApiError) => {
                console.log(error)
                if (error.body.code === 403) {

                } else {
                    makeToast(error.message, 'error', "bottom-left")
                }
            })
    }, [makeToast])

    React.useEffect(() => {
        if (window.electronAPI !== undefined) {
            void window.electronAPI.config.get().then((value) => {
                setHeiMusicConfig(value)
            })
        }

        const handleToast = (event: CustomEvent<IHeimusicToastEvent>) => {
            makeToast(event.detail.message, event.detail.variant || "error", event.detail.position || "bottom-left");
        }

        const handleProfileUpdated = () => {
            refreshUserDetail()
        }

        window.addEventListener("main::pushToast", handleToast)
        window.addEventListener("user::profileUpdated", handleProfileUpdated)

        refreshUserDetail()

        return () => {
            window.removeEventListener("main::pushToast", handleToast)
            window.removeEventListener("user::profileUpdated", handleProfileUpdated)
        }
    }, [makeToast, refreshUserDetail])

    const onMinimizedClicked = () => {
        window.electronAPI.windowManagement.minimize()
    }

    const onWindowedModeClicked = () => {
        window.electronAPI.windowManagement.maximize()
    }

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

    const handleLogout = () => {
        setSettingMenuOpen(false)
        AuthControllerService.logout()
            .then(res => {
                router.reload();
            });
    }

    const handleSearch = () => {
        router.push(`/search?keyword=${prompt}`)
    }

    const handleScan = () => {
        setSettingMenuOpen(false)
        AlbumControllerService.scanAlbum()
            .then(res => {
                pushToast("已提交扫描请求", "success")
            })
            .catch((error: ApiError) => {
                pushToast(error.message)
            });
    }

    const customizedHiddenScrollBarStyle = {
        '::-webkit-scrollbar': {
            width: '6px',
            height: ' 8px',
            backgroundColor: 'rgba(0,0,0,0)', /* or add it to the track */
            borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0)',
            borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(0,0,0,0)',
            borderRadius: '4px',
        },
        '::-webkit-scrollbar-track': {

        }
    }
    const customizedScrollBarStyle = {
        '::-webkit-scrollbar': {
            width: '6px',
            height: ' 8px',
            backgroundColor: '#e3e3e3', /* or add it to the track */
            borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb': {
            background: '#aaa',
            borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
            background: '#7c7c7c',
            borderRadius: '4px',
        },
        '::-webkit-scrollbar-track': {

        }
    }

    return (
        <Box sx={{ width: 'calc(100vw)', height: 'calc(100%)', display: 'flex', flexDirection: 'column', maxHeight: '100%', overflow: 'hidden', background: `url(${heimusicThemeContext.backgroundUrl})`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}>
            {Toast}
            <LoginDialog open={loginDialogOpen} onClose={() => { setLoginDialogOpen(false) }} />
            <OnCloseDialog open={dialogOpen} onClose={() => { setDialogOpen(false) }} />
            {/* Logo 与 系统标题栏 */}
            <Box sx={{ height: "64px", flex: '0 0 auto', width: '100%', display: 'flex', WebkitAppRegion: 'drag', userSelect: 'none' }}>
                {/* 左侧logo */}
                {
                    <Box sx={{ width: '196px', background: theme.palette.pannelBackground.main, display: 'flex', '@media(max-width:600px)': { display: 'none' } }} >
                        <Box sx={{ margin: 'auto auto auto 12px', display: 'flex' }}>
                            <Avatar src='/images/logo.jpg'></Avatar>
                            <Typography sx={{ margin: 'auto 0 auto 6px' }} variant="h6">HeiMusic!</Typography>
                        </Box>
                    </Box>
                }
                {
                    <Box sx={{ display: 'flex', '@media(min-width:600px)': { display: 'none' } }} >
                        <Box sx={{ margin: 'auto auto auto 12px', display: 'flex' }}>
                            <Avatar src='/images/logo.jpg' onClick={() => setLeftPannelDrawerOpen(true)}></Avatar>
                        </Box>
                    </Box>
                }
                {/* 右侧状态栏 */}
                <Box sx={{ flexGrow: 1, display: 'flex', background: theme.palette.pannelBackground.light }}>
                    {/* 导航前进与后退 */}
                    <IconButton size="small" onClick={() => { router.back() }} sx={{ margin: "auto 0px", WebkitAppRegion: 'no-drag', '@media(max-width:600px)': { display: 'none' } }}><ChevronLeftOutlinedIcon /></IconButton>
                    <IconButton size="small" onClick={() => { window.history.forward() }} sx={{ margin: "auto 0px", WebkitAppRegion: 'no-drag', '@media(max-width:600px)': { display: 'none' } }}><ChevronRightOutlinedIcon /></IconButton>
                    {/* 搜索框 */}
                    <Box sx={{ margin: "auto 12px", WebkitAppRegion: 'no-drag' }}>
                        <InputBase startAdornment={<SearchOutlinedIcon />} onKeyUp={e => { e.key === "Enter" && prompt.length !== 0 ? handleSearch() : null }} value={prompt} onChange={e => setPrompt(e.target.value)} size='small' placeholder='搜索音乐' sx={{ borderRadius: '12px', border: '1px grey solid', padding: '2px 12px', fontSize: '14px', "input": { padding: 0 } }} />
                    </Box>
                    <Box sx={{ margin: 'auto 5px auto auto', WebkitAppRegion: 'no-drag' }}>
                        {
                            userDetail === null
                                ? <Button onClick={() => { setLoginDialogOpen(true) }} size="small" >点击登录</Button>
                                : <Box sx={{ display: 'flex' }}><Avatar src={resolveAvatarUrl(userDetail.avatarUrl)} sx={{ width: '24px', height: '24px' }} /><Typography sx={{ margin: 'auto 8px', maxWidth: '160px' }} noWrap>{userDetail.username}</Typography></Box>
                        }
                    </Box>
                    <Box sx={{ margin: 'auto 5px auto 0', WebkitAppRegion: 'no-drag' }}>
                        {/* 更换皮肤按钮 */}
                        <HeiMusicThemeContext.Consumer>
                            {
                                context => {
                                    return <IconButton sx={{ color: theme.palette.text.primary, '@media(max-width:600px)': { display: 'none' } }} onClick={() => { context.setMode(context.mode === 'light' ? 'dark' : 'light') }}><Skin fontSize='small' /></IconButton>
                                }
                            }
                        </HeiMusicThemeContext.Consumer>
                        {/* 设置按钮 */}
                        <IconButton title='设置' ref={settingButtonRef} onClick={() => { setSettingMenuOpen(!settingMenuOpen) }} sx={{ color: theme.palette.text.primary }}><MenuIcon fontSize='small' /></IconButton>
                        <Popover
                            anchorEl={settingButtonRef.current}
                            open={settingMenuOpen}
                            onClose={() => setSettingMenuOpen(false)}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }} >
                            <Paper sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Link href="/userDetail">
                                    <Button
                                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                                        color='inherit'
                                        startIcon={<AccountCircleRoundedIcon />}
                                        onClick={() => setSettingMenuOpen(false)}
                                    >
                                        用户设置
                                    </Button>
                                </Link>
                                <Link href="/settings/player/home">
                                    <Button
                                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                                        color='inherit'
                                        startIcon={<SettingsRoundedIcon />}
                                        onClick={() => setSettingMenuOpen(false)}
                                    >
                                        播放器设置
                                    </Button>
                                </Link>
                                <Button
                                    sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                                    color='inherit'
                                    startIcon={<ManageSearchRoundedIcon />}
                                    onClick={handleScan}
                                >
                                    扫描音乐
                                </Button>
                                <Button
                                    sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                                    color='inherit'
                                    startIcon={<ExitToAppRoundedIcon />}
                                    onClick={handleLogout}
                                >
                                    退出登录
                                </Button>
                            </Paper>
                        </Popover>
                    </Box>
                    {
                        typeof (window) !== 'undefined' && typeof (window.electronAPI) !== 'undefined' &&
                        <Box sx={{ margin: 'auto 0 auto 0', WebkitAppRegion: 'no-drag', display: 'flex' }}>
                            <Box sx={{ width: 2, height: 18, background: 'gray', margin: 'auto 6px auto 6px' }}></Box>
                            <IconButton sx={{ color: theme.palette.text.primary }} onClick={onMinimizedClicked}><Remove /> </IconButton>
                            <IconButton sx={{ color: theme.palette.text.primary }} onClick={onWindowedModeClicked} >{<Crop75OutlinedIcon />} </IconButton>
                            <IconButton sx={{ color: theme.palette.text.primary }} onClick={onCloseClicked}><Close /></IconButton>
                        </Box>
                    }
                </Box>
            </Box>
            {/* 左侧面板 与 右侧 */}
            <Box sx={{ display: 'flex', flexGrow: '1', height: "calc(100% - 64px)" }}>
                <LeftPannel sx={[{ width: '196px', height: "calc(100%)", maxHeight: "calc(100%)", flex: '0 0 auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: theme.palette.pannelBackground.main, ...customizedHiddenScrollBarStyle, ':hover': { ...customizedScrollBarStyle }, '@media(max-width:600px)': { display: 'none' } },]} />
                <Drawer variant='temporary' open={leftPannelDrawerOpen} onClose={() => setLeftPannelDrawerOpen(false)} sx={{ height: "calc(100%)" }}>
                    <LeftPannel sx={[{ width: '196px', height: "calc(100%)", maxHeight: "calc(100%)", flex: '0 0 auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: theme.palette.pannelBackground.main }]} />
                </Drawer>
                {/* 上部视窗 与 下部播放器 */}
                <Box sx={[{ width: "calc(100% - 196px)", display: 'flex', flexDirection: 'column', background: theme.palette.pannelBackground.light, '@media(max-width:600px)': { width: "calc(100%)" } }]}>
                    {/* <MusicAlbum sx={{ flexGrow: 1 }} /> */}
                    <Box sx={{ flexGrow: 1, flexShrink: 1, height: 'calc(100% - 64px - 76px)' }}>{children}</Box>
                    <MusicControlPannel sx={{ height: '76px', flexShrink: 0 }} />
                </Box>
            </Box>

        </Box>
    )
}

export default HeiMusicMainLayout
