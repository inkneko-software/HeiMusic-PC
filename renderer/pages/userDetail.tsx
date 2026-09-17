import { Box, Button, Divider, FormControlLabel, Paper, Tab, Tabs, Radio, RadioGroup, TextField, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import Avatar from "@mui/material/Avatar"
import * as React from "react"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined"
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined"
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

interface IFormFieldProps {
    label: string
    children: React.ReactNode
    helperText?: React.ReactNode
}

/**
 * 表单字段：标签统一放在控件上方，
 * 避免单行控件与多行控件混排时出现基线对齐偏差
 */
function FormField(props: IFormFieldProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>{props.label}</Typography>
            {props.children}
            {props.helperText !== undefined && props.helperText !== null &&
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>{props.helperText}</Typography>
            }
        </Box>
    )
}

interface ISectionHeaderProps {
    icon: React.ReactNode
    title: string
    description: string
}

/** 账户安全页签内的分组标题 */
function SectionHeader(props: ISectionHeaderProps) {
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {props.icon}
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>{props.title}</Typography>
            </Box>
            <Typography variant='caption' sx={{ color: 'text.secondary' }}>{props.description}</Typography>
        </Box>
    )
}

/**
 * 用户设置：个人资料与账户安全两个页签
 * 个人资料对应后端 /api/v1/user/updateUserInfo 与 /api/v1/user/updateAvatar；
 * 账户安全（修改密码、修改绑定邮箱）对应后端 /api/v1/auth/updatePassword
 * 与 /api/v1/auth/updateEmail
 */
export default function UserDetail() {
    const [Toast, makeToast] = useToast()
    const theme = useTheme()

    /** 卡片式分组：与主题 pannelBackground 保持一致，兼容浅色/深色/壁纸主题 */
    const cardSx = {
        borderRadius: '12px',
        padding: '24px',
        backgroundColor: theme.palette.pannelBackground.main,
    }

    /** 只读输入框：通过底色与可编辑项区分 */
    const readOnlyInputSx = {
        '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.action.hover,
        },
    }

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
        <Box sx={{ width: '100%', height: '100%', padding: '16px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
            {Toast}
            <Box sx={{ maxWidth: '880px', margin: '0 auto' }}>
                {/* 页头 */}
                <Box sx={{ marginBottom: '12px' }}>
                    <Typography variant='h5'>用户设置</Typography>
                    <Typography variant='body2' sx={{ marginTop: '4px', color: 'text.secondary' }}>管理个人资料与账户安全</Typography>
                </Box>

                <Tabs
                    value={tab}
                    onChange={(_, value) => setTab(value)}
                    sx={{
                        minHeight: '40px',
                        marginBottom: '20px',
                        '& .MuiTab-root': { minHeight: '40px', padding: '6px 12px' },
                        '& .MuiTabs-indicator': { height: '3px', borderRadius: '3px' },
                    }}
                >
                    <Tab label="个人资料" />
                    <Tab label="账户安全" />
                </Tabs>

                {/* 个人资料 */}
                {
                    tab === 0 &&
                    <Paper variant='outlined' sx={{ ...cardSx, padding: 0, overflow: 'hidden' }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                            {/* 左侧：头像与上传入口 */}
                            <Box
                                sx={{
                                    flex: '0 0 auto',
                                    width: { xs: '100%', sm: '240px' },
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px',
                                    borderRight: { xs: 'none', sm: `1px solid ${theme.palette.divider}` },
                                    borderBottom: { xs: `1px solid ${theme.palette.divider}`, sm: 'none' },
                                }}
                            >
                                <Avatar src={resolveAvatarUrl(avatarUrl)} sx={{ width: '96px', height: '96px' }} />
                                <Button
                                    variant='outlined'
                                    size='small'
                                    startIcon={<PhotoCameraOutlinedIcon />}
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
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant='caption' sx={{ display: 'block', color: 'text.secondary' }}>支持 JPG / PNG / WebP / GIF，最大 10MB</Typography>
                                    <Typography variant='caption' sx={{ display: 'block', color: 'text.secondary' }}>自动裁剪为正方形并压缩，每小时限 5 次</Typography>
                                </Box>
                            </Box>

                            {/* 右侧：资料表单 */}
                            <Box sx={{ flexGrow: 1, minWidth: 0, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <FormField label='邮箱' helperText='邮箱用于登录与找回密码，如需更换请前往「账户安全」'>
                                    <TextField size='small' value={email} InputProps={{ readOnly: true }} spellCheck={false} sx={readOnlyInputSx} />
                                </FormField>
                                <FormField label='用户名'>
                                    <TextField size='small' placeholder='未设置' value={username} onChange={e => setUsername(e.target.value)} />
                                </FormField>
                                <FormField label='性别'>
                                    <RadioGroup row value={gender} onChange={e => setGender(e.target.value)}>
                                        {GENDER_OPTIONS.map(option => (
                                            <FormControlLabel key={option.value} value={option.value} control={<Radio size='small' />} label={option.label} />
                                        ))}
                                    </RadioGroup>
                                </FormField>
                                <FormField label='生日'>
                                    <TextField
                                        size='small'
                                        type='date'
                                        value={birth}
                                        onChange={e => setBirth(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ max: today }}
                                    />
                                </FormField>
                                <FormField label='个性签名'>
                                    <TextField size='small' placeholder='未设置' value={sign} onChange={e => setSign(e.target.value)} multiline minRows={3} maxRows={5} />
                                </FormField>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant='contained'
                                        onClick={handleUpdateProfile}
                                        disabled={savingProfile || !profileLoaded}
                                    >
                                        {savingProfile ? '提交中' : '保存资料'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                }

                {/* 账户安全 */}
                {
                    tab === 1 &&
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', gap: '24px' }}>
                        {/* 修改密码 */}
                        <Paper variant='outlined' sx={{ ...cardSx, flex: 1, width: '100%' }}>
                            <SectionHeader
                                icon={<LockOutlinedIcon color='primary' fontSize='small' />}
                                title='修改密码'
                                description='修改成功后，其他设备上的登录状态将失效，需要重新登录'
                            />
                            <Divider sx={{ margin: '16px 0px' }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <FormField label='旧密码'>
                                    <TextField size='small' type='password' value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                                </FormField>
                                <FormField label='新密码'>
                                    <TextField size='small' type='password' value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                </FormField>
                                <FormField label='确认新密码'>
                                    <TextField size='small' type='password' value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} />
                                </FormField>
                                <Button
                                    variant='contained'
                                    onClick={handleUpdatePassword}
                                    disabled={updatingPassword}
                                >
                                    {updatingPassword ? '提交中' : '修改密码'}
                                </Button>
                            </Box>
                        </Paper>

                        {/* 修改绑定邮箱 */}
                        <Paper variant='outlined' sx={{ ...cardSx, flex: 1, width: '100%' }}>
                            <SectionHeader
                                icon={<MailOutlineOutlinedIcon color='primary' fontSize='small' />}
                                title='修改绑定邮箱'
                                description='更换后请使用新邮箱登录，原邮箱将不再可用'
                            />
                            <Divider sx={{ margin: '16px 0px' }} />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <FormField label='当前邮箱'>
                                    <TextField size='small' value={email} InputProps={{ readOnly: true }} spellCheck={false} sx={readOnlyInputSx} />
                                </FormField>
                                <FormField label='新邮箱'>
                                    <TextField size='small' value={newEmail} onChange={e => setNewEmail(e.target.value)} spellCheck={false} />
                                </FormField>
                                <FormField label='当前密码'>
                                    <TextField size='small' type='password' value={emailPassword} onChange={e => setEmailPassword(e.target.value)} />
                                </FormField>
                                <Button
                                    variant='contained'
                                    onClick={handleUpdateEmail}
                                    disabled={updatingEmail}
                                >
                                    {updatingEmail ? '提交中' : '修改邮箱'}
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                }
            </Box>
        </Box>
    )
}
