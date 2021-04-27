import { Button } from "@material-ui/core";
import React from "react"
import "./css/TitleBarUserRegion.css"
import LoginForm from "./LoginForm";
import RecoverForm from "./RecoverForm";
import RegisterForm from "./RegisterForm";

class TitleBarUserRegion extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            showLoginForm: false,
            showRegisterForm: false,
            showRecoverForm:false
        }
    }
    render(){
        return (
            <div id="title-bar-user-region">
                <Button className="title-bar-user-region-loginbtn" onClick={this.openLoginForm.bind(this)}>
                    点击登录
                </Button>
                <LoginForm open={this.state.showLoginForm} closeCallback={this.closeLoginForm.bind(this)} registerCallback={this.openRegisterForm.bind(this)} recoverCallback={this.openRecoverForm.bind(this)}/>
                <RegisterForm open={this.state.showRegisterForm} closeCallback={this.closeRegisterForm.bind(this)} />
                <RecoverForm open={this.state.showRecoverForm} closeCallback={this.closeRecoverForm.bind(this)} />
            </div>

        )
    }

    componentDidMount(){
        
    }

    openLoginForm() {
        this.setState({ showLoginForm: true });
    }

    closeLoginForm() {
        this.setState({ showLoginForm: false });
    }

    openRegisterForm() {
        this.setState({ showRegisterForm: true });
    }

    closeRegisterForm() {
        this.setState({ showRegisterForm: false });
    }

    openRecoverForm() {
        this.setState({ showRecoverForm: true });
    }

    closeRecoverForm() {
        this.setState({ showRecoverForm: false });
    }
    
}


export default TitleBarUserRegion;