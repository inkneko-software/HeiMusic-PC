import { Box, Button, Divider, TextField, Typography } from "@mui/material"
import * as React from "react"
import { ApiError, AuthControllerService } from "@api/codegen"
import useToast from "@components/Common/Toast"

/**
 * 用户设置：账户安全
 * 修改密码（旧密码验证）与修改绑定邮箱（需当前密码），对应后端
 * /api/v1/auth/updatePassword 与 /api/v1/auth/updateEmail
 */
export default function UserDetail() {
    const [Toast, makeToast] = useToast()

    //修改密码
    const [oldPassword, setOldPassword] = React.useState("")
    const [newPassword, setNewPassword] = React.useState("")
    const [newPasswordConfirm, setNewPasswordConfirm] = React.useState("")
    const [updatingPassword, setUpdatingPassword] = React.useState(false)

    //修改绑定邮箱
    const [newEmail, setNewEmail] = React.useState("")
    const [emailPassword, setEmailPassword] = React.useState("")
    const [updatingEmail, setUpdatingEmail] = React.useState(false)

    const handleUpdatePassword = () => {
        if (oldPassword === "" || newPassword === "") {
            makeToast("请填写旧密码与新密码", "warning")
            return
        }
        if (newPassword !== newPasswordConfirm) {
            makeToast("两次输入的新密码不一致", "warning")
            return
        }
        setUpdatingPassword(true)
        AuthControllerService.updatePassword(oldPassword, newPassword)
            .then(() => {
                //改密成功后其他设备登录态立即失效，当前设备由 Set-Cookie 无感续期
                makeToast("密码已更新，其他设备需重新登录", "success")
                setOldPassword("")
                setNewPassword("")
                setNewPasswordConfirm("")
            })
            .catch((error: ApiError) => {
                makeToast(error.message, "error")
            })
            .finally(() => {
                setUpdatingPassword(false)
            })
    }

    const handleUpdateEmail = () => {
        if (newEmail === "" || emailPassword === "") {
            makeToast("请填写新邮箱与当前密码", "warning")
            return
        }
        setUpdatingEmail(true)
        AuthControllerService.updateEmail(newEmail, emailPassword)
            .then(() => {
                makeToast("邮箱已更新，之后请使用新邮箱登录", "success")
                setNewEmail("")
                setEmailPassword("")
            })
            .catch((error: ApiError) => {
                makeToast(error.message, "error")
            })
            .finally(() => {
                setUpdatingEmail(false)
            })
    }

    return (
        <Box sx={{ width: '100%', height: '100%', padding: '12px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
            {Toast}
            <Typography variant='h5' sx={{ marginBottom: '12px' }}>用户设置</Typography>

            <Typography>账户安全</Typography>
            <Divider sx={{ margin: '2px 0px' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '480px', margin: '12px 0px 24px 0px' }}>
                <Typography variant="subtitle2" sx={{ marginBottom: '8px' }}>修改密码</Typography>
                <TextField
                    size='small'
                    type='password'
                    label='旧密码'
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                />
                <TextField
                    sx={{ marginTop: '8px' }}
                    size='small'
                    type='password'
                    label='新密码'
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                />
                <TextField
                    sx={{ marginTop: '8px' }}
                    size='small'
                    type='password'
                    label='确认新密码'
                    value={newPasswordConfirm}
                    onChange={e => setNewPasswordConfirm(e.target.value)}
                />
                <Button
                    sx={{ marginTop: '12px', alignSelf: 'flex-start' }}
                    variant='contained'
                    size='small'
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword}
                >
                    {updatingPassword ? '提交中' : '修改密码'}
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '480px', margin: '12px 0px 24px 0px' }}>
                <Typography variant="subtitle2" sx={{ marginBottom: '8px' }}>修改绑定邮箱</Typography>
                <TextField
                    size='small'
                    label='新邮箱'
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    spellCheck={false}
                />
                <TextField
                    sx={{ marginTop: '8px' }}
                    size='small'
                    type='password'
                    label='当前密码'
                    value={emailPassword}
                    onChange={e => setEmailPassword(e.target.value)}
                />
                <Button
                    sx={{ marginTop: '12px', alignSelf: 'flex-start' }}
                    variant='contained'
                    size='small'
                    onClick={handleUpdateEmail}
                    disabled={updatingEmail}
                >
                    {updatingEmail ? '提交中' : '修改邮箱'}
                </Button>
            </Box>
        </Box>
    )
}
