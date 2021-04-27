import React from "react"
import Slider from "@material-ui/core/Slider"
import "./css/VolumePanel.css"
import { withStyles } from '@material-ui/core/styles';

const VolumeSlider  = withStyles({
    root: {
        color: '#52af77',
        paddingTop: 8,
        paddingBottom: 8,
      },
      thumb: {
        height: 4,
        width: 16,
        backgroundColor: '#52af77',
        border: '2px solid',
        borderRadius: 0,
        '&:focus, &:hover, &$active': {
          boxShadow: 'inherit',
        },
      },
      active: {},
      valueLabel: {
        left: 'calc(-50% + 4px)',
      },
      track: {
        borderRadius: 4,
      },
      rail: {
        borderRadius: 4,
        opacity: 1,
        backgroundColor: "#e3e3e3"
      },
    })(Slider);

class VolumePanel extends React.Component{
    constructor(props){
        super(props)
        this.props = props

    }

    render(){
        let panelDynamicStyle = {
            display: this.props.open? "unset": "none"
        }

        return(
            <div className="volume-panel-wrap" style={panelDynamicStyle}>
                <VolumeSlider className="volume-slider" value={this.props.value} classes={{thumb: "fuck-volume-bar-property"}} onChange={this.props.onChange} orientation="vertical"/>
            </div>
            
        )
    }
}

export default VolumePanel