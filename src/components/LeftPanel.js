import React from "react"

import Typography from "@material-ui/core/Typography"
import ExpansionPanel from "@material-ui/core/ExpansionPanel"
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails"
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary"
import Button from "@material-ui/core/Button"

import MusicListDisplay from  "./MusicListDisplay"
import ReactDOM from "react-dom"
import "./css/LeftPanel.css"

const remote = window.require("electron").remote
const config = remote.require("./heiMusicConfig")

class LeftPanel extends React.Component{
    constructor(props){
        super(props)
        this.currentSelectedBtnId = null
        this.tid = null
        this.state = {
            userCollectionList: []
        }
    }
    render(){
        return (
            <>
                <div className="left-panel-logo-wrap">
                    <img className="left-panel-logo" src="logo.jpg"/>
                    <div className="left-panel-appname">HeiMusic!</div>
                    
                </div>
                <ExpansionPanel classes={{root:"panel"}}  elevation={0} expanded={true}>
                    <ExpansionPanelSummary classes={{root: "panel-summary", content: "panel-summary-text"}}>
                        <Typography classes={{root:"panel-summary-text"}}>我的音乐</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails classes={{root:"panel-detail"}}>
                            <Button classes={{root: "panel-button", label: "panel-button-content"}} id={"songlist-uid"} onClick={this.ListBtnOnclick.bind(this, 'uid')}>我喜欢的音乐</Button>
                            <Button classes={{root: "panel-button", label: "panel-button-content"}} id={2}>下载管理</Button>
                            <Button classes={{root: "panel-button", label: "panel-button-content"}} id={3}>设置</Button>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <ExpansionPanel classes={{root:"panel"}} elevation={0}  className="panel-music-list" defaultExpanded={true}>
                    <ExpansionPanelSummary classes={{root: "panel-summary", content: "panel-summary-text"}}>
                        <Typography classes={{root:"panel-summary-text"}}>创建的歌单</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails classes={{root:"panel-detail"}} className="panel-music-list-details" >
                        {
                            this.state.userCollectionList.map((collectionInfo, index)=>{
                                let collectionId = collectionInfo.collection_id
                                let collectionName = collectionInfo.name
                                let collectionTitle = collectionInfo.title
                                return <Button classes={{root: "panel-button", label: "panel-button-content"}} id={`songlist-${collectionId}`} onClick={this.ListBtnOnclick.bind(this, collectionId)}>{collectionName}</Button>
                            })
                        }
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            </>
        )
    }

    componentDidMount(){
        ReactDOM.render(
            <MusicListDisplay tid={this.tid}/>,
            document.getElementById("display-browser")
        )
        console.log(config)
        var http = window.require("http")
        var options ={
            host: 'music.inkneko.com',
            port: 80,
            method: "GET",
            headers:{
                "User-Agent": config.client_ua
            },
            path: "/api/v1/getUserCollectionList"
        }
        let callback = function(response){
            let str =""
            response.on('data', function(chunk){
                str += chunk
            })

            response.on('end', function()
            {
                let json = JSON.parse(str)
                this.setState({
                    userCollectionList: json.list
                })
            }.bind(this))
        }.bind(this)

        http.request(options, callback).end()
    }

    ListBtnOnclick(id){
        if (id === this.currentSelectedBtnId){
            return
        }
        if (this.currentSelectedBtnId !== null)
        {
            let selectedBtn = document.getElementById("songlist-" + this.currentSelectedBtnId)
            selectedBtn.classList.remove("panel-button-selected")
        }
        
        let clickedBtn = document.getElementById("songlist-" + id)
        clickedBtn.classList.add("panel-button-selected")
        this.currentSelectedBtnId = id
        
        ReactDOM.unmountComponentAtNode(document.getElementById("display-browser"))
        ReactDOM.render(
            <MusicListDisplay tid={id}/>,
            document.getElementById("display-browser")
        )
        
    }

    RenderMusicListDisplay(tid){
        this.setState({
            tid:tid
        })        
    }
}

export default LeftPanel
