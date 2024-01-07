import { Box, Button, Dialog } from "@mui/material";
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import React from "react";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface IFullScreenMusicPannelProps {
    open: boolean,
    onClose: () => void
}
export default function FullScreenMusicPannel(props: IFullScreenMusicPannelProps) {

    return (
        <Dialog
            fullScreen
            open={props.open}
            onClose={props.onClose}
            TransitionComponent={Transition}
        >
            <Box sx={{ height: '64px', width: '100%', WebkitAppRegion: 'drag', userSelect: 'none' }}>
                <Button onClick={props.onClose} sx={{WebkitAppRegion: 'no-drag',}}>关闭</Button>
            </Box>
        </Dialog>
    )
}