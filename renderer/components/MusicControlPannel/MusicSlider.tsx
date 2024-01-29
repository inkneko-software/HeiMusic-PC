import React from 'react'
import { Slider, SliderProps } from "@mui/material";
import { useTheme } from "@mui/styles";

function MusicSlider(props: SliderProps) {
    const theme = useTheme();
    return (
        <Slider
            {...props}
            step={1}
            sx={{
                height: 2,
                padding: "0px 0px 4px 0px",
                display: "block",
                '& .MuiSlider-thumb': {
                    display: "none",
                    width: 8,
                    height: 8,
                    '&:before': {
                        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.1)',
                    },
                    '&:hover, &.Mui-focusVisible': {
                        boxShadow: `0px 0px 0px 0px ${theme.palette.mode === 'dark'
                            ? 'rgb(255 255 255 / 16%)'
                            : 'rgb(0 0 0 / 16%)'
                            }`,
                    },
                    '&.Mui-active': {
                        width: 10,
                        height: 10,
                    },
                },
                "&:hover": {
                    '& .MuiSlider-thumb': {
                        display: "unset",
                    }
                },
                '& .MuiSlider-rail': {
                    opacity: 0.28,
                },
                '@media (pointer: coarse)': {
                    padding: "0px 0px 4px 0px",
                },
                ...(props.sx)
            }} />
    )
}

export default MusicSlider;