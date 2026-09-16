import Link from '@components/Common/Link';
import { Box, Button, TextField, Typography, IconButton, CircularProgress } from '@mui/material';
import Remove from '@mui/icons-material/Remove'
import Crop32 from '@mui/icons-material/Crop32'
import Crop75OutlinedIcon from '@mui/icons-material/Crop75Outlined'
import Close from '@mui/icons-material/Close'
import Maximize from '@mui/icons-material/Maximize'
import MenuIcon from '@mui/icons-material/Menu'
import Popover from '@mui/material/Popover'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { useTheme } from '@mui/styles';
import { ApiError, AuthControllerService, UserControllerService, UserDetail } from '@api/codegen';
import { pushToast } from '@components/HeiMusicMainLayout';
import useToast from '@components/Common/Toast';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export interface LoginProps {
    onLoginSuccess: (userDetail: UserDetail) => void,
}

const Login = (props: LoginProps) => {
    const theme = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [client, setClient] = useState(false);
    const [Toast, makeToast] = useToast();
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loginButtonDisabled, setLoginButtonDisabled] = useState(false);
    //密码连续失败被锁定（业务码1007）时的剩余秒数
    const [lockCountdown, setLockCountdown] = useState(0);
    //当前正在连接的API服务器（Electron为配置的apiHost，其余环境为页面origin）
    const [currentApiHost, setCurrentApiHost] = useState("");
    const [apiHostInput, setApiHostInput] = useState("");
    const router = useRouter();

    const onMinimizedClicked = () => {
        window.electronAPI.windowManagement.minimize()
    }

    const onWindowedModeClicked = () => {
        window.electronAPI.windowManagement.maximize()
    }

    const onCloseClicked = () => {
        window.electronAPI.windowManagement.close()
    }

    const handleLogin = () => {
        if (lockCountdown > 0) {
            return;
        }
        setLoginButtonDisabled(true);
        AuthControllerService.login({ email: email, password: password })
            .then(res => {
                makeToast("登录成功", "success", 'bottom-right');
                UserControllerService.nav()
                    .then(res => {

                        var handle = setInterval(
                            () => {
                                props.onLoginSuccess(res.data);
                                clearInterval(handle)
                            },
                            1000
                        );

                    })

            })
            .catch((error: ApiError) => {
                makeToast(error.message, 'error', 'bottom-right')
                setLoginButtonDisabled(false);
                //1007：同一邮箱连续失败次数过多，后端锁定15分钟
                if (error.body?.code === 1007) {
                    setLockCountdown(15 * 60);
                }
            })
    }

    useEffect(() => {
        if (lockCountdown <= 0) {
            return;
        }
        const timer = setTimeout(() => setLockCountdown(lockCountdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [lockCountdown]);

    const handleRetry = () => {
        setIsNetworkError(false);
        UserControllerService.nav()
            .then(res => {
                props.onLoginSuccess(res.data);
            })
            .catch(error => {
                if (error instanceof TypeError || error instanceof ApiError && error.status !== 200 && error.status !== 403) {
                    setIsNetworkError(true);
                }
            })
    }

    const handleSaveApiHost = () => {
        if (apiHostInput.trim() === "") {
            return;
        }
        window.electronAPI.config.set("apiHost", apiHostInput.trim());
        //保存并重启应用，重启后自动用新地址重新连接
        window.electronAPI.config.saveAndReload();
    }

    useEffect(() => {
        if (typeof (window) !== 'undefined' && typeof (window.electronAPI) !== 'undefined') {
            setClient(true)
            window.electronAPI.config.get().then(config => {
                setCurrentApiHost(config.apiHost);
                setApiHostInput(config.apiHost);
            })
        } else if (typeof (window) !== 'undefined') {
            //网页端API与页面同源（由nginx反代），无可配置的apiHost
            setCurrentApiHost(window.location.origin);
        }

        UserControllerService.nav()
            .then(res => {
                props.onLoginSuccess(res.data);
            })
            .catch(error => {
                if (error instanceof TypeError || error instanceof ApiError && error.status !== 200 && error.status !== 403) {
                    setIsNetworkError(true);
                } else {
                    setIsLoading(false);
                }
            })

    // 登录门禁探测（_app 渲染 Login 时执行一次）；props 变化仅由父级状态翻转引起，
    // 重新探测 nav 为幂等请求，无副作用
    }, [props])

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
            {Toast}
            <Box sx={{ flex: '1 0 auto', width: "65%", backgroundImage: 'url(/images/lxh-background03.jpg)', backgroundPosition: 'right bottom', backgroundSize: 'cover', '@media(max-width: 600px)': { display: 'none' } }}>
            </Box>
            <Box sx={{ flex: '1 0 auto', width: '35%', display: 'flex', flexDirection: 'column', '@media(max-width: 600px)': { width: '100%' } }}>

                <Box sx={[{ margin: 'auto 0 auto 0', WebkitAppRegion: 'drag', display: 'none', justifyContent: 'flex-end' }, client && { display: 'flex' }]}>
                    <IconButton sx={{ color: theme.palette.text.primary, WebkitAppRegion: 'no-drag' }} onClick={onMinimizedClicked}><Remove /> </IconButton>
                    <IconButton sx={{ color: theme.palette.text.primary, WebkitAppRegion: 'no-drag' }} onClick={onWindowedModeClicked} >{<Crop75OutlinedIcon />} </IconButton>
                    <IconButton sx={{ color: theme.palette.text.primary, WebkitAppRegion: 'no-drag' }} onClick={onCloseClicked}><Close /></IconButton>
                </Box>
                {
                    !isLoading && !isNetworkError &&
                    <Box sx={{ display: 'flex', flexDirection: 'column', margin: "auto auto", flexGrow: '1', justifyContent: 'center' }}>

                        <Typography variant='h5' sx={{ margin: '12px 0px' }}>
                            登录
                        </Typography>
                        <TextField placeholder='请输入账户邮箱' size='small' value={email} onChange={e => setEmail(e.target.value)}></TextField>
                        <TextField placeholder='请输入账户密码' type='password' sx={{ marginTop: '12px' }} size='small' value={password} onChange={e => setPassword(e.target.value)} onKeyUp={e => { e.key === 'Enter' && handleLogin() }}></TextField>
                        <Button sx={{ marginTop: '12px' }} variant='contained' onClick={handleLogin} disabled={loginButtonDisabled || lockCountdown > 0} >{lockCountdown > 0 ? `尝试次数过多，${Math.ceil(lockCountdown / 60)}分钟后可重试` : loginButtonDisabled ? '登录中' : '登录'}</Button>
                        <Box sx={{ display: 'flex' }}>
                            <Button >注册账号</Button>
                            <Button sx={{ marginLeft: 'auto' }}>找回密码</Button>
                        </Box>
                    </Box>

                }
                {
                    isLoading && !isNetworkError &&
                    <Box sx={{ display: 'flex', flexDirection: 'column', margin: "auto auto", flexGrow: '1', justifyContent: 'center', alignItems: 'center' }}>
                        <CircularProgress />
                        <Typography variant='subtitle2' sx={{ marginTop: '12px' }}>尝试获取登录信息...</Typography>
                        <Typography variant='subtitle2' sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>正在连接：{currentApiHost}</Typography>
                    </Box>

                }
                {
                    isNetworkError &&
                    <Box sx={{ display: 'flex', flexDirection: 'column', margin: "auto auto", flexGrow: '1', justifyContent: 'center', alignItems: 'center' }}>
                        <ErrorOutlineOutlinedIcon />
                        <Typography variant='subtitle2' sx={{ marginTop: '12px' }}>连接至服务器失败</Typography>
                        <Typography variant='subtitle2' sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>当前服务器：{currentApiHost}</Typography>
                        {
                            client &&
                            <Box sx={{ display: 'flex', marginTop: '12px', width: '90%' }}>
                                <TextField size='small' sx={{ flexGrow: '1' }} value={apiHostInput} onChange={e => setApiHostInput(e.target.value)} placeholder='API服务器，如 http://192.168.1.100:8080' spellCheck={false} />
                                <Button variant='outlined' sx={{ marginLeft: '8px', flex: '0 0 auto' }} onClick={handleSaveApiHost}>保存并重连</Button>
                            </Box>
                        }
                    </Box>

                }

                {
                    isNetworkError &&
                    <Button onClick={handleRetry}>重试</Button>
                }


            </Box>
        </Box>
    )
}

// Login.getLayout = function getLayout(page) {
//     return page;
// }

export default Login;