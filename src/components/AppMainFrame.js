import React from "react"
import "./css/AppMainFrame.css"

import LeftPanel from "./LeftPanel"
import TitleBar from "./TitleBar"
import MusicPlayer from "./MusicPlayer"
import SnackBar from "@material-ui/core/Snackbar"
import MuiAlert from "@material-ui/lab/Alert"

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}
  
class AppMainFrame extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            "notificationOpen": false,
            "notificationText": null,
            "notificaionLevel": "" //error warning info success
        }
    }

    render(){
        return (
            <div className="app-main-frame">
                <SnackBar open={this.state.notificationOpen} autoHideDuration={3000} onClose={this.notificationOnClose.bind(this)} anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
                    <Alert severity={this.state.notificaionLevel} onClose={this.notificationOnClose.bind(this)}>{this.state.notificationText}</Alert>
                </SnackBar>
                <div className="left-control-panel">
                    <LeftPanel/>
                </div>
                <div className="display-page">
                    <TitleBar/>
                    <div id="display-browser"/>
                    <div id="music-player">
                        <MusicPlayer/>
                    </div>
                    <div id="music-disk-page" style={{display:"hidden"}}/>
                </div>
            </div>
        )
    }

    componentDidMount() {
        window.addEventListener("global_notification", this.notificationGlobalListener.bind(this));
    }

    notificationOnClose() {
        this.setState({ notificationOpen: false });
    }

    notificationGlobalListener(event) {
        this.setState({
            notificationOpen: true,
            notificaionLevel: event.level,
            notificationText: event.message
        });
    }
}



export default AppMainFrame