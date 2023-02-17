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
import InputBase from '@mui/material/InputBase'
import InputLabel from '@mui/material/InputLabel'
import Link from '@mui/material/Link'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'


import styles from "./LoginDialog.module.css"
import { AlertColor } from '@mui/material/Alert';

function Input(props) {
  const { children, label, placeholder, type, ...others } = props;
  return (
    <Box sx={{ display: "flex", width: "400px" }}>
      <Box sx={{ margin: 'auto 20px', width: "50px" }}>{label}</Box>
      <InputBase sx={{ margin: '5px 10px' }} placeholder={placeholder} type={type} {...others}></InputBase>
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
    // account.Login(accountInput, password)
    // .then(res=>{
    //     if (res.data.code === 0){
    //         notifyMessage("登录成功", "success")
    //         setInterval(()=>{window.location="/"}, 2000)
    //     }else{
    //         console.log(res)
    //         notifyMessage(`${res.data.message}`, "warning")
    //     }
    // })
    // .catch((error)=>{
    //     notifyMessage("请求错误", "error")
    //     console.log(error)
    // })
  }



  return (
    <>
      <Box sx={{ border: "1px solid #e3e3e3", borderRadius: 1 }}>
        <Input label="账号" placeholder="请输入账号" value={accountInput} onChange={(event) => { setAccountInput(event.target.value); console.log(event) }} />
        <Divider />
        <Input label="密码" placeholder="请输入密码" type='password' value={password} onChange={(event) => { setPassword(event.target.value) }} />
      </Box>
      <Stack sx={{ marginTop: 2, display: "flex" }} direction='row' spacing={2}>
        <Button variant='outlined' fullWidth onClick={switchToAuthLogin}>注册</Button>
        <Button variant='contained' fullWidth  onClick={Login}>登录</Button>
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
    // account.SendAuthcodeEmail(email, code)
    // .then(resp=>{return resp.data})
    // .then(resp=>{
    //     if (resp.code !== 0){
    //         notifyMessage(`${resp.message}`, "warning")
    //     }else{
    //         notifyMessage("发送成功", "info")
    //         var tempCountDown = 60;
    //         var handle = setInterval(()=>{
    //             setcountDown(tempCountDown);
    //             if (tempCountDown >0){
    //                 tempCountDown--
    //             }else{
    //                 clearInterval(handle)
    //             }
    //         }, 1000)

    //     }
    // })
    // .catch((error)=>{
    //     console.log(error)
    // })
  }

  function AuthLogin() {
    // account.EmailAuthcodeLogin(email, code)
    // .then(resp=>{return resp.data})
    // .then(resp=>{
    //     if (resp.code !== 0){
    //         notifyMessage(`${resp.message}`, "warning")
    //     }else{
    //         notifyMessage("登录成功", "success")
    //         setInterval(()=>{window.location="/"}, 2000)
    //     }
    // })
    // .catch((error)=>{
    //     console.log(error)
    // })
  }

  return (
    <>
      <Box sx={{ border: "1px solid #e3e3e3", borderRadius: 1 }}>
        <Input value={email} onChange={(event) => { setEmail(event.target.value) }} label="邮箱" placeholder="请输入账号" />
        <Divider />
        <Input value={code} onChange={(event) => setCode(event.target.value)} label="验证码" placeholder="请输入验证码" type='numeric'>
          <Button variant="text" sx={{ margin: 'auto', cursor: "pointer", padding: 0 }} onClick={sendEmailRequest} disabled={countDown !== 0}>{countDown === 0 ? "获取验证码" : countDown + "s"}</Button>
        </Input>
      </Box>
      <Stack sx={{ marginTop: 2, display: "flex" }} direction='row' spacing={2}>
        <Button variant='contained' fullWidth  onClick={AuthLogin}>登录/注册</Button>
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
  const [tabIndex, setTabIndex] = React.useState(0)

  const changePanel = (index) => {
    console.log(index)
    setTabIndex(index)
  }


  return (
    <Dialog className={styles['login-dialog']} sx={{ borderRadius: '9px' }} open={open} onClose={onClose}>

      <DialogContent sx={{ margin: '40px 60px 20px 60px' }}>
        <Stack sx={{ margin: 'auto', justifyContent: 'center', marginBottom: 3 }} direction='row' spacing={2}>
          <Tab tabIndex={0} currentIndex={tabIndex} text="密码登录" onClick={() => { changePanel(0) }} />
          <Divider flexItem orientation='vertical' />
          <Tab tabIndex={1} currentIndex={tabIndex} text="验证登录" onClick={() => { changePanel(1) }} />
        </Stack>
        <TabPanel tabIndex={0} currentIndex={tabIndex}>
          <PasswordLogin switchToAuthLogin={() => { changePanel(1) }} />
        </TabPanel>

        <TabPanel tabIndex={1} currentIndex={tabIndex}>
          <AuthCodeLogin />
        </TabPanel>

        <Stack sx={{ textAlign: 'center', marginTop: 5 }}>
          <Typography variant="overline" sx={{ color: 'gray' }}>未注册过墨云音乐的邮箱，将自动注册账号</Typography>
          <Typography variant="overline" sx={{ color: 'gray' }}>登录或完成注册即代表你同意<Link className={styles["link"]} href="/">用户协议</Link>和<Link className={styles["link"]}>隐私政策</Link></Typography>
        </Stack>

      </DialogContent>
    </Dialog>
  );
}