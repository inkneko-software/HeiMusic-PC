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
        console.log(props);
        console.log(this.props);
        this.state = {
            emailCheckFailed: true,
            emailHint: "仅支持腾讯，网易，新浪，谷歌邮箱",
            email_notice_style: "register-form-input-hint",

            nickCheckFailed: true,
            nickHint: "需小于10个字符",
            nick_notice_style: "register-form-input-hint",

            passwordCheckFailed: true,
            passwordHint: "长度为8-15位，需包含字母和数字，可添加下划线",
            password_notice_style: "register-form-input-hint",

            repasswordCheckFailed: true,
            repasswordHint: "",
            repassword_notice_style: "register-form-input-hint",

            accessCodeCheckFailed: true,
            accesscodeHint: "",
            accessCode_notice_style: "register-form-input-hint",

            inviteCodeCheckFailed: true,
            inviteCodeHint: "当前注册需要使用邀请码",
            inviteCode_notice_style: "register-form-input-hint",

            accessCodeSended: false,
            sendAccessCodeButtonText: "发送验证码"
        }
        this.accessCodeInterval = 0;
        this.interval_id = null;
    }

    render() {
        return (
            <Dialog open={this.props.open} onClose={this.closeCallback.bind(this)} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">注册</DialogTitle>
                <DialogContent style={{'overflow': 'unset'}} dividers={true}>
                    <div className="register-form-input-region">
                        <TextField className="register-form-input" margin="dense" id="email" label="邮箱地址" type="email" onBlur={this.emailCheckCallback.bind(this)} variant="outlined" />
                        <InputLabel  className={this.state.email_notice_style} variant="filled">{this.state.emailHint}</InputLabel>
                    </div>
                    <div className="register-form-input-region">
                        <TextField margin="dense" id="nick" label="昵称" type="text" onBlur={this.nickCheckCallback.bind(this)} variant="outlined" />
                        <InputLabel className={this.state.nick_notice_style} variant="filled">{this.state.nickHint}</InputLabel>
                    </div>
                    <div className="register-form-input-region">
                        <TextField margin="dense" id="password" label="密码" type="password"  onBlur={this.passwordCheckCallback.bind(this)} variant="outlined"/>
                        <InputLabel className={this.state.password_notice_style} variant="filled">{this.state.passwordHint}</InputLabel>
                    </div>
                    <div className="register-form-input-region">
                        <TextField margin="dense" id="repassword" label="确认密码" type="password"  onBlur={this.repasswordCheckCallback.bind(this)} variant="outlined" />
                        <InputLabel className={this.state.repassword_notice_style} variant="filled">{this.state.repasswordHint}</InputLabel>
                    </div>
                    <div className="register-form-input-region">
                        <TextField margin="dense" id="access-code" label="认证码" type="text" onBlur={this.accesscodeCheckCallback.bind(this)} variant="outlined" />
                        <Button id="send-accesscode-btn" style={{ "margin": 'auto 0px auto 42px', height:36}} color="primary" variant="contained" onClick={this.sendAccessCode.bind(this)} disabled={this.state.accessCodeSended}>{this.state.sendAccessCodeButtonText}</Button>
                        <InputLabel className={this.state.accesscode_notice_style} variant="filled">{this.state.accesscodeHint}</InputLabel>
                    </div>
                    <div className="register-form-input-region">
                        <TextField margin="dense" id="invite-code" label="邀请码" type="text"  onBlur={this.invitecodeCheckCallback.bind(this)} variant="outlined" />
                        <InputLabel className={this.state.inviteCode_notice_style} variant="filled">{this.state.inviteCodeHint}</InputLabel>
                    </div>
                    
                    
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.closeCallback} color="primary" onClick={this.submit.bind(this)}>提交</Button>
                </DialogActions>
            </Dialog>
        )
    }

    emailCheckCallback() {
        var emailAddress = document.getElementById("email").value;
        if (emailAddress === "") {
            this.setState({
                emailHint: "仅支持腾讯，网易，新浪，谷歌邮箱",
                email_notice_style: "register-form-input-hint"
            });
            return null;
        }

        this.setState({ email_notice_style: "register-form-input-padding", emailHint: "检查中..." });
        fetch(`https://music.inkneko.com/api/v1/auth/checkEmail?email=${emailAddress}`)
            .then(res => {
                if (res.status == 200) {
                    return res.json();
                } else {
                    this.setState({ emailHint: "服务器未响应，请稍后再试", emailCheckFailed: true })
                    return null;
                }
            })
            .then(res => {
                if (res !== null) {
                    if (res.code === 0) {
                        this.setState({ email_notice_style: "register-form-input-passed", emailHint: "邮箱地址可用", emailCheckFailed: false })
                    } else if (res.code === -12001){
                        this.setState({ email_notice_style: "register-form-input-failed", emailHint: "仅支持腾讯，网易，新浪，谷歌邮箱", emailCheckFailed: true})
                    } else {
                        this.setState({ email_notice_style: "register-form-input-failed", emailHint: res.msg, emailCheckFailed: true})
                    }
                }
        })
    }

    nickCheckCallback() {
        var len = document.getElementById("nick").value.length;
        if (len === 0) {
            this.setState({
                nickHint: "需小于10个字符",
                nick_notice_style: "register-form-input-hint"
            })
            return null;
        }

        if (len > 10) {
            this.setState({ nick_notice_style: "register-form-input-failed", nickHint: `用户名过长，当前长度${len}` ,nickCheckFailed: true})
        } else {
            if (len != 0) {
                this.setState({ nick_notice_style: "register-form-input-passed", nickHint: `长度符合要求`,nickCheckFailed: false })                
            }
            else {
                this.setState({ nick_notice_style: "register-form-input-failed", nickHint: `用户名为空`,nickCheckFailed: true })
            }
        }
    }

    passwordCheckCallback()     {
        var password_input = document.getElementById("password");
        var password = password_input.value;

        if (password === "")
        {
            this.setState({
                passwordHint: "长度为8-15位，需包含字母和数字，可添加下划线",
                password_notice_style: "register-form-input-hint",
                passwordCheckFailed: true
            })
            return;
        }

        if (password.length >= 8 && password.length <= 15)
        {
            var foundAlpha = false;
            var foundDigit = false;
            for (var i = 0; i < password.length; ++i)
            {
                var chr = password.charAt(i);
                if ((chr >= 'A' && chr <= 'Z') || (chr >= 'a' && chr <= 'z'))
                {
                    foundAlpha = true;
                }
                else if (chr >= '0' && chr <= '9')
                {
                    foundDigit = true;
                }
                else if (chr === '_')
                {
                    continue;
                }
                else
                {
                    this.setState({
                        passwordHint: "密码中只能由字母、数字，和下划线组成",
                        password_notice_style: "register-form-input-failed",
                        passwordCheckFailed: true
                    });
                    return;
                }
            }
    
            if (foundAlpha === false || foundDigit === false)
            {
                this.setState({
                    passwordHint: "当前密码中缺少字母或数字",
                    password_notice_style: "register-form-input-failed",
                    passwordCheckFailed: true
                });
            }
            else
            {
                this.setState({
                    passwordHint: "当前密码可以使用",
                    password_notice_style: "register-form-input-passed",
                    passwordCheckFailed: false
                });
            }
        }
        else
        {
            this.setState({
                passwordHint: "密码长度不符合要求，当前长度：" + password.length,
                password_notice_style: "register-form-input-failed",
                passwordCheckFailed: true
            });
        }
    }

    repasswordCheckCallback() {
        var password = document.getElementById("password").value;
        var repassword = document.getElementById("repassword").value;
        if (password === "" && repassword === "") {
            this.setState({
                repassword_notice_style: "register-form-input-hint",
                repasswordCheckFailed: true
            });
        }
        if (password !== repassword) {
            this.setState({
                repasswordHint: "密码不匹配",
                repassword_notice_style: "register-form-input-failed",
                repasswordCheckFailed: true
            })
        } else {
            this.setState({
                repassword_notice_style: "register-form-input-hint",
                repasswordCheckFailed: false
            })
        }
    }

    accesscodeCheckCallback() {
        var accessCode = document.getElementById("access-code").value;
        if (accessCode !== "") {
            this.setState({
                accessCodeCheckFailed: false
            });
        } else {
            this.setState({
                accessCodeCheckFailed: true
            });
        }
    }

    invitecodeCheckCallback() {
        var inviteCode = document.getElementById("invite-code").value;
        if (inviteCode !== "") {
            this.setState({
                inviteCodeCheckFailed: false
            });
        } else {
            this.setState({
                inviteCodeCheckFailed: true
            });
        }
    }

    closeCallback() {
        console.log(this.props);
        this.props.closeCallback();

        this.setState({
            emailCheckFailed: true,
            emailHint: "仅支持腾讯，网易，新浪，谷歌邮箱",
            email_notice_style: "register-form-input-hint",

            nickCheckFailed: true,
            nickHint: "小于10个字符",
            nick_notice_style: "register-form-input-hint",

            passwordCheckFailed: true,
            passwordHint: "长度为8-15位，需包含字母和数字，可添加下划线",
            password_notice_style: "register-form-input-hint",

            repasswordCheckFailed: true,
            repasswordHint: "",
            repassword_notice_style: "register-form-input-hint",

            accessCodeCheckFailed: true,
            accesscodeHint: "",
            accessCode_notice_style: "register-form-input-hint",

            inviteCodeCheckFailed: true,
            inviteCodeHint: "当前注册需要使用邀请码",
            inviteCode_notice_style: "register-form-input-hint",
        });
    }

    sendAccessCode() {
        var event = new Event("global_notification")
        if (this.state.emailCheckFailed === true) {
            event.level = "error";
            event.message = "邮箱格式不正确";
            window.dispatchEvent(event);
            return null;
        }
        
        let email = document.getElementById("email").value;
        fetch("https://music.inkneko.com/api/v1/auth/sendRegisterEmailCode", {
            method: "POST",
            body: encodeURI("email=" + email),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(res => {
            if (res.status == 200) {
                return res.json();
            } else {
                event.level = "error";
                event.message = "服务器错误，状态码：" + res.status;
                window.dispatchEvent(event);
                return null;
            }
        }).then(res => {
            if (res !== null) {
                this.accessCodeInterval = 60;
                this.setState({
                    accessCodeSended: true
                });
                if (res.code !== 0) {
                    event.level = "error";
                    event.message = res.msg;
                } else {
                    event.level = "success";
                    event.message = "发送成功";
                }
                window.dispatchEvent(event)

                this.interval_id = setInterval(function () {
                    this.accessCodeInterval -= 1;
                    if (this.accessCodeInterval === 0) {
                        this.setState({
                            accessCodeSended: false,
                            sendAccessCodeButtonText: "发送验证码"
                        })
                        clearInterval(this.interval_id);
                    } else {
                        this.setState({
                            sendAccessCodeButtonText: `(${this.accessCodeInterval} s)`
                        })
                    }
                }.bind(this), 1000);
            }
        })
    }

    submit() {
        var event = new Event("global_notification");
        if (this.state.emailCheckFailed
            || this.state.nickCheckFailed
            || this.state.passwordCheckFailed
            || this.state.repasswordCheckFailed
            || this.state.accessCodeCheckFailed
            || this.state.inviteCodeCheckFailed) {
            event.level = "error";
            event.message = "请检查注册信息";
            window.dispatchEvent(event);
            return null;
        }

        var email = document.getElementById("email").value;
        var nick = document.getElementById("nick").value;
        var password = document.getElementById("password").value;
        var accessCode = document.getElementById("access-code").value;
        var inviteCode = document.getElementById("invite-code").value;
        fetch("https://music.inkneko.com/api/v1/auth/register", {
            method: "POST",
            body: `email=${encodeURI(email)}&nick=${encodeURI(nick)}&password=${encodeURI(password)}&access_code=${encodeURI(accessCode)}&invite_code=${encodeURI(inviteCode)}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(res => {
            if (res.status !== 200) {
                event.level = "error";
                event.message = "服务器错误，状态码：" + res.status;
                window.dispatchEvent(event);
                return null;
            } else {
                return res.json();
            }
        }).then(res => {
            if (res !== null) {
                if (res.code === 0) {
                    event.level = "success";
                    event.message = res.msg;
                    window.dispatchEvent(event);
                    this.closeCallback();
                } else {
                    event.level = "error";
                    event.message = res.msg;
                    window.dispatchEvent(event);
                }
            }
        })
        
    }
}
export default RegisterForm;
