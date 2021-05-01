import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import InputLabel from '@material-ui/core/InputLabel';
import "./css/RegisterForm.css"

class RegisterForm extends React.Component{
    constructor(props) {
        super(props);
        this.props = props;
        this.closeCallback = props.closeCallback;
        this.state = {
            emailCheckFailed: false,
            emailHint: "仅支持腾讯，网易，新浪，谷歌邮箱",
            email_notice_style: "register-form-input-hint",

            nickCheckFailed: false,
            nickHint: "小于10个字符",
            nick_notice_style: "register-form-input-hint",

            passwordCheckFailed: false,
            passwordHint: "长度为8-15位，需包含字母和数字，可添加下划线",
            password_notice_style: "register-form-input-hint",

            repasswordCheckFailed: false,
            repasswordHint: "",
            repassword_notice_style: "register-form-input-hint",

            accessCodeCheckFailed: false,
            accesscodeHint: "",
            accessCode_notice_style: "register-form-input-hint",

            inviteCodeCheckFailed: false,
            inviteCodeHint: "当前注册需要使用邀请码",
            inviteCode_notice_style: "register-form-input-hint",
        }
    }

    render() {

        return (
            <Dialog open={this.props.open} onClose={this.closeCallback} aria-labelledby="form-dialog-title" maxWidth="md">
                <DialogTitle id="form-dialog-title">注册</DialogTitle>
                <DialogContent style={{'overflow': 'unset'}} dividers={true}>
                    <div className="register-form-input-region">
                        <TextField className="register-form-input" margin="dense" id="email" label="邮箱地址" type="email" onBlur={this.emailCheckCallback.bind(this)} error={this.state.emailCheckFailed} variant="outlined" />
                        <InputLabel className={this.state.email_notice_style} variant="filled">{this.state.emailHint}</InputLabel>
                    </div>
                    <div className="register-form-input-region">
                        <TextField margin="dense" id="password" label="昵称" type="text" onBlur={this.emailCheckCallback.bind(this)} error={this.state.nickcheckFailed} variant="outlined" />
                        <InputLabel className={this.state.nick_notice_style} variant="filled">{this.state.nickHint}</InputLabel>
                    </div>
                    <div className="register-form-input-region">
                        <TextField margin="dense" id="password" label="密码" type="password"  onBlur={this.emailCheckCallback.bind(this)} error={this.state.passwordCheckFailed} variant="outlined"/>
                        <InputLabel className={this.state.password_notice_style} variant="filled">{this.state.passwordHint}</InputLabel>
                    </div>
                    <div className="register-form-input-region">
                        <TextField margin="dense" id="password" label="确认密码" type="password"  onBlur={this.emailCheckCallback.bind(this)} error={this.state.repasswordCheckFailed} variant="outlined" />
                        <InputLabel className={this.state.repassword_notice_style} variant="filled">{this.state.repasswordHint}</InputLabel>
                    </div>
                    <div className="register-form-input-region">
                        <TextField margin="dense" id="password" label="认证码" type="text" onBlur={this.emailCheckCallback.bind(this)} error={this.state.accessCodeCheckFailed} variant="outlined" />
                        <Button style={{ "margin": 'auto 0px auto 42px', height:36}} color="primary" variant="contained">发送验证码</Button>
                        <InputLabel className={this.state.accesscode_notice_style} variant="filled">{this.state.accesscodeHint}</InputLabel>
                    </div>
                    <div className="register-form-input-region">
                        <TextField margin="dense" id="password" label="邀请码" type="text"  onBlur={this.emailCheckCallback.bind(this)} error={this.state.inviteCodeCheckFailed} variant="outlined" />
                        <InputLabel className={this.state.inviteCode_notice_style} variant="filled">{this.state.inviteCodeHint}</InputLabel>
                    </div>
                    
                    
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.closeCallback} color="primary">提交</Button>
                </DialogActions>
            </Dialog>
        )
    }

    emailCheckCallback() {
        this.setState({ emailcheckFailed: true, emailHint: "worked." });
    }
}
export default RegisterForm;
