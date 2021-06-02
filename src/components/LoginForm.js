import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

class LoginForm extends React.Component{
    constructor(props) {
        super(props);
        this.props = props;
        this.closeCallback = props.closeCallback;
        this.registerCallback = props.registerCallback;
        this.recoverCallback = props.recoverCallback;
    }

    render() {
        return (
            <Dialog open={this.props.open} onClose={this.closeCallback} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">登录</DialogTitle>
                <DialogContent dividers={true}>
                    <TextField margin="dense" id="email" label="邮箱地址" type="email" fullWidth variant="outlined" />
                    <TextField margin="dense" id="password" label="密码" type="password" fullWidth variant="outlined"/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.login.bind(this)} color="primary">登录</Button>
                    <Button onClick={() => { this.closeCallback(); this.registerCallback()}} color="primary">注册</Button>
                    <Button onClick={() => { this.closeCallback(); this.recoverCallback()}} color="primary">忘记密码</Button>
                </DialogActions>
            </Dialog>
        )
    }

    login() {
        var email = document.getElementById("email").value;
        var password = document.getElementById("password").value;
        fetch("https://music.inkneko.com/api/v1/auth/login", {
            method: "POST",
            body: `login_name=${encodeURI(email)}&password=${password}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(res => {
            if (res.status === 200) {
                return res.json();
            } else {
                return null;
            }
        }).then(res => {
            if (res !== null) {
                console.log(res);
            }
        })
    }

}
export default LoginForm;
