import React from "react"
import IconButton from "@material-ui/core/IconButton"
import Close from "@material-ui/icons/Close"
import Remove from "@material-ui/icons/Remove"
import Crop32 from "@material-ui/icons/Crop32"
import FilterNone from "@material-ui/icons/FilterNone"
import "./css/TopSystemMenu.css"

const ipcRenderer = window.require("electron").ipcRenderer;
const ipcMain = window.require("electron").ipcMain;

class TopSystemMenu extends React.Component{
    constructor(props){
        super(props)
        this.windowMode = "normal"
        this.state = {
            maximizeIcon: <Crop32/>
        }
        this.onCloseMinimized = true
    }
    render(){
        return (
            <div className="top-system-menu-content">
                <IconButton onClick={this.MinimizeOnclick.bind(this)}><Remove/></IconButton>
                <IconButton onClick={this.MaximizeOnlick.bind(this)}>{this.state.maximizeIcon}</IconButton>
                <IconButton onClick={this.CloseOnclick.bind(this)}><Close/></IconButton>
            </div>            
        )
    }

    componentDidMount(){
        ipcRenderer.on("window-change-callback",(event,data)=>{
            switch (data.action){
                case "maximize":
                    this.setState({
                        maximizeIcon: <FilterNone/>
                    })
                    this.windowMode = "maximize"
                    break;
                case "restore":
                    this.setState({
                        maximizeIcon: <Crop32/>
                    })
                    this.windowMode = "normal"
                    break;
            }
        })
    }

    IPCWindowControl(action){
        ipcRenderer.send('window-control', {action: action})
    }
    CloseOnclick(){
        if (this.onCloseMinimized === true){
            this.IPCWindowControl("hide")
        }
        else{
            this.IPCWindowControl("quit")
        }
    }
    MinimizeOnclick(){
        this.IPCWindowControl("minimize")
    }

    MaximizeOnlick(){
        if (this.windowMode == "normal"){
            this.IPCWindowControl('maximize')
        }
        else{
            this.IPCWindowControl('restore')
        }
        
    }
}

export default TopSystemMenu;