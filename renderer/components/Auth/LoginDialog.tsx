import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import InputBase, { InputBaseProps } from '@mui/material/InputBase'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'


import styles from "./LoginDialog.module.css"
import { AlertColor } from '@mui/material/Alert';

import { ApiError, AuthControllerService } from '../../api/codegen';

interface IInputProps extends InputBaseProps {
    children?: React.ReactNode,
    label: string
}

function Input(props: IInputProps) {
    const { children, label, placeholder, type, ...others } = props;
    return (
        <Box sx={{ display: "flex" }}>
            <Box sx={{ margin: 'auto 20px', width: "50px", flex: '0 0 auto', '@media(max-width:600px)': { display: 'none' } }}>{label}</Box>
            <InputBase sx={{ margin: '5px 10px', flex: '1 1 auto' }} placeholder={placeholder} type={type} {...others} ></InputBase>
            {children}
        </Box>
    )
}

interface NotifyState {
    open: boolean,
    message: string,
    variant: AlertColor
}

function PasswordLogin(props) {
    const switchToAuthLogin = props.switchToAuthLogin

    const [accountInput, setAccountInput] = React.useState("")
    const [password, setPassword] = React.useState("")
    //密码连续失败被锁定（业务码1007）时的剩余秒数
    const [lockCountdown, setLockCountdown] = React.useState(0)

    React.useEffect(() => {
        if (lockCountdown <= 0) {
            return;
        }
        const timer = setTimeout(() => setLockCountdown(lockCountdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [lockCountdown])

    const [notifyState, setNotifyState] = React.useState<NotifyState>({
        open: false,
        message: "",
        variant: "success" //{success | info | warning | error}
    })

    function notifyMessage(message, variant) {
        notifyMessageClose()
        setNotifyState({
            open: true,
            message: message,
            variant: variant
        })
    }

    function notifyMessageClose() {
        setNotifyState({ ...notifyState, open: false })
    }

    function Login() {
        if (lockCountdown > 0) {
            return;
        }
        AuthControllerService.login({ email: accountInput, password: password })
            .then((json) => {
                notifyMessage("登录成功", "success")
                setInterval(() => { location.reload() }, 2000)
            })
            .catch((error) => {
                notifyMessage(`${error.message}`, "warning")
                //1007：同一邮箱连续失败次数过多，后端锁定15分钟
                if (error instanceof ApiError && error.body?.code === 1007) {
                    setLockCountdown(15 * 60)
                }
            })

    }



    return (
        <>
            <Box sx={{ border: "1px solid #e3e3e3", borderRadius: 1 }}>
                <Input
                    label="账号"
                    placeholder="请输入账号"
                    value={accountInput}
                    onChange={(event) => { setAccountInput(event.target.value); console.log(event) }}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            Login()
                        }
                    }} />
                <Divider sx={{ borderColor: "#e3e3e3" }} />
                <Input
                    label="密码"
                    placeholder="请输入密码"
                    type='password'
                    value={password}
                    onChange={(event) => { setPassword(event.target.value) }}
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            Login()
                        }
                    }} />
            </Box>
            <Stack sx={{ marginTop: 2, display: "flex" }} direction='row' spacing={2}>
                <Button variant='outlined' fullWidth onClick={switchToAuthLogin}>注册</Button>
                <Button variant='contained' fullWidth onClick={Login} disabled={lockCountdown > 0}>{lockCountdown > 0 ? `${Math.ceil(lockCountdown / 60)}分钟后可重试` : '登录'}</Button>
            </Stack>
            <Snackbar open={notifyState.open} autoHideDuration={3000} onClose={notifyMessageClose} anchorOrigin={{ "vertical": "bottom", "horizontal": "center" }}>
                <Alert severity={notifyState.variant}>
                    {notifyState.message}
                </Alert>
            </Snackbar>
        </>
    )
}

function AuthCodeLogin(props) {
    const [email, setEmail] = React.useState("")
    const [code, setCode] = React.useState("")
    const [countDown, setcountDown] = React.useState(0)


    const [notifyState, setNotifyState] = React.useState<NotifyState>({
        open: false,
        message: "",
        variant: "success" //{success | info | warning | error}
    })

    function notifyMessage(message, variant) {
        setNotifyState({
            open: true,
            message: message,
            variant: variant
        })
    }

    function notifyMessageClose() {
        setNotifyState({ ...notifyState, open: false })
    }

    function sendEmailRequest() {
        AuthControllerService.sendLoginEmailCode(email)
            .then(resp => {
                if (resp.code !== 0) {
                    notifyMessage(`${resp.message}`, "warning")
                } else {
                    notifyMessage("发送成功", "info")
                    var tempCountDown = 60;
                    var handle = setInterval(() => {
                        setcountDown(tempCountDown);
                        if (tempCountDown > 0) {
                            tempCountDown--
                        } else {
                            clearInterval(handle)
                        }
                    }, 1000)

                }
            })
            .catch((error) => {
                notifyMessage(`${error.message}`, "warning")
            })
    }

    function AuthLogin() {
        AuthControllerService.login({ email: email, code: code })
            .then((json) => {
                notifyMessage("登录成功", "success")
                setInterval(() => { location.reload() }, 2000)
            })
            .catch((error) => {
                //1002：验证码错误；连续输错5次后验证码作废，正确码也过不了，引导重新获取
                if (error instanceof ApiError && error.body?.code === 1002) {
                    notifyMessage("验证码错误或已失效，请重新获取验证码", "warning")
                } else {
                    notifyMessage(`${error.message}`, "warning")
                }
            })
    }

    return (
        <>
            <Box sx={{ border: "1px solid #e3e3e3", borderRadius: 1 }}>
                <Input
                    value={email}
                    onChange={(event) => { setEmail(event.target.value) }}
                    label="邮箱"
                    placeholder="请输入账号"
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            AuthLogin()
                        }
                    }} />
                <Divider sx={{ borderColor: "#e3e3e3" }} />
                <Input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    label="验证码"
                    placeholder="请输入验证码"
                    type='numeric'
                    onKeyDown={event => {
                        if (event.key === 'Enter') {
                            AuthLogin()
                        }
                    }}>
                    <Button variant="text" sx={{ margin: 'auto 20px', cursor: "pointer", padding: 0, flex: '1 0 auto' }} onClick={sendEmailRequest} disabled={countDown !== 0}>{countDown === 0 ? "获取验证码" : countDown + "s"}</Button>
                </Input>
            </Box>
            <Stack sx={{ marginTop: 2, display: "flex" }} direction='row' spacing={2}>
                <Button variant='contained' fullWidth onClick={AuthLogin}>登录/注册</Button>
            </Stack>
            <Snackbar open={notifyState.open} autoHideDuration={3000} onClose={notifyMessageClose} anchorOrigin={{ "vertical": "bottom", "horizontal": "center" }}>
                <Alert severity={notifyState.variant}>
                    {notifyState.message}
                </Alert>
            </Snackbar>
        </>
    )
}



function Tab(props) {
    const { tabIndex, currentIndex, text, ...others } = props

    if (tabIndex === currentIndex) {
        return <Typography variant='h6' sx={{ color: '#549ee1', cursor: 'pointer' }} {...others}>{text}</Typography>
    } else {
        return <Typography variant='h6' sx={{ color: "blueButton", cursor: 'pointer' }} {...others}>{text}</Typography>
    }
}

function TabPanel(props) {
    const { children, tabIndex, currentIndex, text, ...others } = props

    if (tabIndex === currentIndex) {
        return <Box {...others}>{children}</Box>
    } else {
        return <Box {...others} />
    }
}




interface LoginDialogProps {
    open: boolean,
    onClose: () => void
}

export default function LoginDialog(props) {
    const [open, onClose] = [props.open, props.onClose];
    const [tabIndex, setTabIndex] = React.useState(1)

    const changePanel = (index) => {
        console.log(index)
        setTabIndex(index)
    }

    React.useEffect(() => {
        if (open === true) {
            setTabIndex(1);
        }
    }, [open])


    return (
        <Dialog className={styles['login-dialog']} sx={{ borderRadius: '9px' }} open={open} onClose={onClose}>

            <DialogContent sx={{ margin: '40px 60px 20px 60px', width: '460px', '@media(max-width:600px)': { margin: '10px 0px', width: '280px' } }}>
                <Stack sx={{ margin: 'auto', justifyContent: 'center', marginBottom: 3 }} direction='row' spacing={2}>
                    <Tab tabIndex={1} currentIndex={tabIndex} text="验证登录" onClick={() => { changePanel(1) }} />
                    <Divider flexItem orientation='vertical' sx={{ borderColor: "#e3e3e3" }} />
                    <Tab tabIndex={0} currentIndex={tabIndex} text="密码登录" onClick={() => { changePanel(0) }} />

                </Stack>
                <TabPanel tabIndex={0} currentIndex={tabIndex}>
                    <PasswordLogin switchToAuthLogin={() => { changePanel(1) }} />
                </TabPanel>

                <TabPanel tabIndex={1} currentIndex={tabIndex}>
                    <AuthCodeLogin />
                </TabPanel>

                <Stack sx={{ textAlign: 'center', marginTop: 5 }}>
                    <Typography variant="subtitle2" sx={{ color: 'gray' }}>未注册的邮箱，将自动注册账号</Typography>
                    {/* <Typography variant="overline" sx={{ color: 'gray' }}>登录或完成注册即代表你同意<Link className={styles["link"]} href="/">用户协议</Link>和<Link className={styles["link"]}>隐私政策</Link></Typography> */}
                </Stack>

            </DialogContent>
        </Dialog >
    );
}