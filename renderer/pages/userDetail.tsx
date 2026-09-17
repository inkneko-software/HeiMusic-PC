import { Box, Button, Divider, FormControlLabel, Tab, Tabs, Radio, RadioGroup, TextField, Typography } from "@mui/material"
import Avatar from "@mui/material/Avatar"
import * as React from "react"
import { ApiError, AuthControllerService, UserControllerService } from "@api/codegen"
import type { UserDetailVo } from "@api/codegen"
import { uploadAvatar } from "@api/upload/avatar"
import { resolveAvatarUrl } from "../lib/avatar"
import useToast from "@components/Common/Toast"

/** 性别选项：value 为空串表示“保密”，提交时转为 null（未设置） */
const GENDER_OPTIONS = [
    { value: "", label: "保密" },
    { value: "m", label: "男" },
    { value: "f", label: "女" },
]

/** 后端校验：username / sign 最长 255 字符 */
const PROFILE_FIELD_MAX_LENGTH = 255

/** 本地时区的 yyyy-MM-dd（toISOString 是 UTC，直接用会差一天） */
function toLocalDateString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/**
 * 用户设置：个人资料与账户安全两个页签
 * 个人资料对应后端 /api/v1/user/updateUserInfo 与 /api/v1/user/updateAvatar；
 * 账户安全（修改密码、修改绑定邮箱）对应后端 /api/v1/auth/updatePassword
 * 与 /api/v1/auth/updateEmail
 */
export default function UserDetail() {
    const [Toast, makeToast] = useToast()

    //页签：0 个人资料，1 账户安全
    const [tab, setTab] = React.useState(0)

    //个人资料
    const [profileLoaded, setProfileLoaded] = React.useState(false)
    const [avatarUrl, setAvatarUrl] = React.useState("")
    const [username, setUsername] = React.useState("")
    const [gender, setGender] = React.useState("")
    const [birth, setBirth] = React.useState("")
    const [sign, setSign] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [savingProfile, setSavingProfile] = React.useState(false)
    const [uploadingAvatar, setUploadingAvatar] = React.useState(false)
    const avatarInputRef = React.useRef<HTMLInputElement>(null)
    const today = toLocalDateString(new Date())

    //修改密码
    const [oldPassword, setOldPassword] = React.useState("")
    const [newPassword, setNewPassword] = React.useState("")
    const [newPasswordConfirm, setNewPasswordConfirm] = React.useState("")
    const [updatingPassword, setUpdatingPassword] = React.useState(false)

    //修改绑定邮箱
    const [newEmail, setNewEmail] = React.useState("")
    const [emailPassword, setEmailPassword] = React.useState("")
    const [updatingEmail, setUpdatingEmail] = React.useState(false)

    React.useEffect(() => {
        UserControllerService.nav()
            .then(res => {
                const detail: UserDetailVo = res.data
                setAvatarUrl(detail.avatarUrl ?? "")
                setUsername(detail.username ?? "")
                setGender(detail.gender ?? "")
                setBirth(detail.birth ?? "")
                setSign(detail.sign ?? "")
                setEmail(detail.email ?? "")
                setProfileLoaded(true)
            })
            .catch((error: ApiError) => {
                setProfileLoaded(true)
                makeToast(error.message, "error")
            })
    }, [makeToast])

    /**
     * 资料更新成功后通知主布局刷新右上角的头像与用户名
     */
    const notifyProfileUpdated = (detail: UserDetailVo) => {
        window.dispatchEvent(new CustomEvent<UserDetailVo>("user::profileUpdated", { detail }))
    }

    const handleAvatarFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files === null ? null : event.target.files.item(0)
        //清空选择，允许下次选择同一个文件
        event.target.value = ""
        if (file === null) {
            return
        }
        setUploadingAvatar(true)
        uploadAvatar(file)
            .then(res => {
                setAvatarUrl(res.data.avatarUrl ?? "")
                makeToast("头像已更新", "success")
                notifyProfileUpdated(res.data)
            })
            .catch((error: Error) => {
                makeToast(error.message, "error")
            })
            .finally(() => {
                setUploadingAvatar(false)
            })
    }

    const handleUpdateProfile = () => {
        if (username.length > PROFILE_FIELD_MAX_LENGTH || sign.length > PROFILE_FIELD_MAX_LENGTH) {
            makeToast(`用户名与个性签名最长 ${PROFILE_FIELD_MAX_LENGTH} 个字符`, "warning")
            return
        }
        if (birth !== "" && birth >= today) {
            makeToast("生日必须早于今天", "warning")
            return
        }
        setSavingProfile(true)
        //后端为全量更新语义，四个字段全部提交；空值显式传 null 清空
        //（sign 清空后为空串）。生成的 DTO 类型未标注 null，这里按接口语义传入
        UserControllerService.updateUserInfo({
            username: username === "" ? null : username,
            birth: birth === "" ? null : birth,
            gender: gender === "" ? null : gender,
            sign: sign,
        })
            .then(res => {
                makeToast("个人资料已保存", "success")
                notifyProfileUpdated(res.data)
            })
            .catch((error: ApiError) => {
                makeToast(error.message, "error")
            })
            .finally(() => {
                setSavingProfile(false)
            })
    }

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
            <Typography variant='h5' sx={{ marginBottom: '8px' }}>用户设置</Typography>
            <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                <Tab label="个人资料" />
                <Tab label="账户安全" />
            </Tabs>
            <Divider />

            {/* 个人资料 */}
            {
                tab === 0 &&
                <Box sx={{ maxWidth: '560px' }}>
                    {/* 头像与上传入口 */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', margin: '16px 0px' }}>
                        <Avatar src={resolveAvatarUrl(avatarUrl)} sx={{ width: '88px', height: '88px' }} />
                        <Box sx={{ marginLeft: '16px' }}>
                            <Button
                                variant='outlined'
                                size='small'
                                disabled={uploadingAvatar || !profileLoaded}
                                onClick={() => avatarInputRef.current?.click()}
                            >
                                {uploadingAvatar ? '处理中' : '更换头像'}
                            </Button>
                            {/* 隐藏的文件选择框，由按钮触发 */}
                            <input
                                ref={avatarInputRef}
                                type='file'
                                accept='image/jpeg,image/png,image/webp,image/gif'
                                hidden
                                onChange={handleAvatarFileSelected}
                            />
                            <Typography variant='caption' sx={{ display: 'block', marginTop: '4px' }}>支持 JPG / PNG / WebP / GIF，最大 10MB</Typography>
                            <Typography variant='caption' sx={{ display: 'block' }}>自动裁剪为正方形并压缩，每小时限 5 次</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', margin: '4px 0px' }}>
                        <Typography sx={{ minWidth: '30%' }} variant='subtitle2'>邮箱</Typography>
                        <TextField sx={{ flexGrow: '1' }} size='small' value={email} InputProps={{ readOnly: true }} spellCheck={false} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', margin: '4px 0px' }}>
                        <Typography sx={{ minWidth: '30%' }} variant='subtitle2'>用户名</Typography>
                        <TextField sx={{ flexGrow: '1' }} size='small' placeholder='未设置' value={username} onChange={e => setUsername(e.target.value)} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', margin: '4px 0px' }}>
                        <Typography sx={{ minWidth: '30%' }} variant='subtitle2'>性别</Typography>
                        <RadioGroup sx={{ flexGrow: '1' }} row value={gender} onChange={e => setGender(e.target.value)}>
                            {GENDER_OPTIONS.map(option => (
                                <FormControlLabel key={option.value} value={option.value} control={<Radio size='small' />} label={option.label} />
                            ))}
                        </RadioGroup>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', margin: '4px 0px' }}>
                        <Typography sx={{ minWidth: '30%' }} variant='subtitle2'>生日</Typography>
                        <TextField
                            sx={{ flexGrow: '1' }}
                            size='small'
                            type='date'
                            value={birth}
                            onChange={e => setBirth(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ max: today }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', margin: '4px 0px' }}>
                        <Typography sx={{ minWidth: '30%', paddingTop: '6px' }} variant='subtitle2'>个性签名</Typography>
                        <TextField sx={{ flexGrow: '1' }} size='small' placeholder='未设置' value={sign} onChange={e => setSign(e.target.value)} multiline minRows={2} maxRows={4} />
                    </Box>
                    <Button
                        sx={{ marginTop: '12px' }}
                        variant='contained'
                        size='small'
                        onClick={handleUpdateProfile}
                        disabled={savingProfile || !profileLoaded}
                    >
                        {savingProfile ? '提交中' : '保存资料'}
                    </Button>
                </Box>
            }

            {/* 账户安全 */}
            {
                tab === 1 &&
                <Box sx={{ maxWidth: '560px' }}>
                    <Box sx={{ marginTop: '16px' }}>
                        <Typography>修改密码</Typography>
                        <Divider sx={{ margin: '2px 0px' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', margin: '4px 0px' }}>
                            <Typography sx={{ minWidth: '30%' }} variant='subtitle2'>旧密码</Typography>
                            <TextField sx={{ flexGrow: '1' }} size='small' type='password' value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', margin: '4px 0px' }}>
                            <Typography sx={{ minWidth: '30%' }} variant='subtitle2'>新密码</Typography>
                            <TextField sx={{ flexGrow: '1' }} size='small' type='password' value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', margin: '4px 0px' }}>
                            <Typography sx={{ minWidth: '30%' }} variant='subtitle2'>确认新密码</Typography>
                            <TextField sx={{ flexGrow: '1' }} size='small' type='password' value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} />
                        </Box>
                        <Button
                            sx={{ marginTop: '12px' }}
                            variant='contained'
                            size='small'
                            onClick={handleUpdatePassword}
                            disabled={updatingPassword}
                        >
                            {updatingPassword ? '提交中' : '修改密码'}
                        </Button>
                    </Box>
                    <Box sx={{ marginTop: '24px' }}>
                        <Typography>修改绑定邮箱</Typography>
                        <Divider sx={{ margin: '2px 0px' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', margin: '4px 0px' }}>
                            <Typography sx={{ minWidth: '30%' }} variant='subtitle2'>新邮箱</Typography>
                            <TextField sx={{ flexGrow: '1' }} size='small' value={newEmail} onChange={e => setNewEmail(e.target.value)} spellCheck={false} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', margin: '4px 0px' }}>
                            <Typography sx={{ minWidth: '30%' }} variant='subtitle2'>当前密码</Typography>
                            <TextField sx={{ flexGrow: '1' }} size='small' type='password' value={emailPassword} onChange={e => setEmailPassword(e.target.value)} />
                        </Box>
                        <Button
                            sx={{ marginTop: '12px' }}
                            variant='contained'
                            size='small'
                            onClick={handleUpdateEmail}
                            disabled={updatingEmail}
                        >
                            {updatingEmail ? '提交中' : '修改邮箱'}
                        </Button>
                    </Box>
                </Box>
            }
        </Box>
    )
}
