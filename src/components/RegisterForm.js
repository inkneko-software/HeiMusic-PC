import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

class RegisterForm extends React.Component{
    constructor(props) {
        super(props);
        this.props = props;
        this.closeCallback = props.closeCallback;
    }

    render() {
        return (
            <Dialog open={this.props.open} onClose={this.closeCallback} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">注册</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" id="email" label="邮箱地址" type="email" fullWidth />
                    <TextField margin="dense" id="password" label="昵称" type="text" fullWidth />
                    <TextField margin="dense" id="password" label="密码" type="password" fullWidth />
                    <TextField margin="dense" id="password" label="确认密码" type="password" fullWidth />
                    <TextField margin="dense" id="password" label="认证码" type="text" fullWidth />
                    <TextField margin="dense" id="password" label="邀请码" type="text" fullWidth />
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.closeCallback} color="primary">提交</Button>
                </DialogActions>
            </Dialog>
        )
    }

}
export default RegisterForm;
