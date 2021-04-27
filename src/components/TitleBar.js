import React from "react"
import TopSystemMenu from "./TopSystemMenu"
import TitleBarUserRegion from "./TitleBarUserRegion"
import "./css/TitleBar.css"

class TitleBar extends React.Component{
    render(){
        return(
            <div className="top-title-bar">
                <div className="top-title-bar-padding"/>
                <TitleBarUserRegion/>
                <div className="top-title-bar-function-padding"/>
                <TopSystemMenu/>
            </div>
        )
    }
}

export default TitleBar;