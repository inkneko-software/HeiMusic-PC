import { Alert, Fade, Grow, IconButton, Snackbar, SnackbarOrigin, Toolbar } from '@mui/material'
import { Box } from '@mui/system'
import * as React from 'react'
import CloseIcon from '@mui/icons-material/Close';

type ToastVairant = "success" | "info" | "warning" | "error"
type ToastPositionVariant = "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center" | "center"

//pos默认为'center
//variant默认为success
export default function useToast(): [JSX.Element, (message: string, variant?: ToastVairant, pos?: ToastPositionVariant) => void] {

    interface ToastState {
        open: boolean,
        message: string,
        variant: ToastVairant
        anchorOrigin: SnackbarOrigin
    }

    var state: ToastState = {
        open: false,
        message: "",
        variant: "success", //{success | info | warning | error}
        anchorOrigin: { vertical: "bottom", horizontal: "center" }
    }

    const [notifyState, setNotifyState] = React.useState(state);
    const [snackPack, setSnackPack] = React.useState([]);
    const [centerDisplay, setCenterDisplay] = React.useState(false);
    const [topDisplay, setTopDisplay] = React.useState(false);

    React.useEffect(() => {
        if (snackPack.length && !notifyState.open) {
            // Set a new snack when we don't have an active one
            var msg: ToastState = snackPack[0];

            setSnackPack((prev) => prev.slice(1));
            setNotifyState({
                open: true,
                message: msg.message,
                variant: msg.variant,
                anchorOrigin: msg.anchorOrigin
            })
        } else if (snackPack.length && notifyState.open) {
            // Close an active snack when a new one is added
            setNotifyState({ ...notifyState, open: false })
        }
    }, [snackPack, notifyState]);

    function makeToast(message: string, variant: ToastVairant = "success", pos: ToastPositionVariant = "center") {
        var actualPos: SnackbarOrigin;
        switch (pos) {
            case 'top-left':
                actualPos = { vertical: "top", horizontal: "left" }
                break;
            case "top-right":
                actualPos = { vertical: "top", horizontal: "right" }
                break;
            case "top-center":
                actualPos = { vertical: "top", horizontal: "center" }
                break;
            case "bottom-left":
                actualPos = { vertical: "bottom", horizontal: "left" }
                break;
            case "bottom-right":
                actualPos = { vertical: "bottom", horizontal: "right" }
                break;
            case "bottom-center":
                actualPos = { vertical: "bottom", horizontal: "center" }
                break;
            case "center":
                actualPos = { vertical: "top", horizontal: "center" }
            default:
                actualPos = { vertical: "bottom", horizontal: "center" }
                break;
        }
        setCenterDisplay(pos === "center");
        setTopDisplay(pos.startsWith("top"));

        setSnackPack((prev) => [...prev, {
            open: true,
            message: message,
            variant: variant,
            anchorOrigin: actualPos
        }]);
    }

    function notifyMessageClose(event, reason) {
        if (reason !== 'clickaway') {
            setNotifyState({ ...notifyState, open: false })
        }
    }

    const ToastComponent = (
        <Snackbar
            sx={[centerDisplay && { "&.MuiSnackbar-root": { left: "50%", bottom: "50%" } }, topDisplay && { "&.MuiSnackbar-root": { top: "64px" } }]}
            open={notifyState.open}
            autoHideDuration={3000}
            onClose={notifyMessageClose}
            anchorOrigin={notifyState.anchorOrigin}
            TransitionComponent={Grow}
        >
            <Box >
                <Alert
                    severity={notifyState.variant}
                    variant="filled"
                    action={<IconButton color='inherit' onClick={(e) => notifyMessageClose(e, "close")} sx={{ padding: 0, margin: 'auto' }}><CloseIcon /></IconButton>}

                >
                    {notifyState.message}
                </Alert>
            </Box>
        </Snackbar>
    )

    return [ToastComponent, makeToast]
}