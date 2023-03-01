import React from "react"
import Slider, { SliderProps } from "@mui/material/Slider"
import { styled } from '@mui/styles/';
import { Box, Fade, Popper, Typography,Paper } from "@mui/material";

const VolumeSlider = styled(Slider)({
    root: {
        color: '#52af77',
        paddingTop: 8,
        paddingBottom: 8,
    },
    thumb: {
        margin: "-2px 0px -7px -2px",
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
});


interface IVolumePannel extends SliderProps {
    open: boolean,
    anchorEl: HTMLElement,
}

function VolumePannel(props: IVolumePannel) {
    return (
        <>
            <Popper open={props.open} anchorEl={props.anchorEl} transition placement="top" onMouseEnter={props.onMouseEnter} onMouseLeave={props.onMouseLeave} >
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={350}>
                        <Paper sx={{ bgcolor: "black", marginBottom: 2, paddingTop: 1, paddingBottom: 1 }} >
                            <Typography variant="subtitle2" color="#ffffff" sx={{ width: "100%", textAlign: "center", marginBottom: 1 }}>{props.value}</Typography>
                            <Slider
                                size="small"
                                sx={{ height: 70 }}
                                orientation="vertical"
                                min={0}
                                max={100}
                                value={props.value}
                                onChange={props.onChange}
                            />
                        </Paper>
                    </Fade>
                )}

            </Popper>
        </>
    )
}

export default VolumePannel;