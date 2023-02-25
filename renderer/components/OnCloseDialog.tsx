import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { Button, DialogProps, FormControlLabel, Radio, RadioGroup } from "@mui/material";
function OnCloseDialog(props: DialogProps) {
    return (
        <Dialog open={props.open}>
            <DialogTitle>是否退出？</DialogTitle>
            <DialogContent>
                <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    defaultValue="female"
                    name="radio-buttons-group"
                >
                    <FormControlLabel value="female" control={<Radio />} label="最小化至托盘图标" />
                    <FormControlLabel value="male" control={<Radio />} label="退出应用程序" />
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { window.electronAPI.windowManagement.close() }}>确认</Button>
                <Button onClick={() => props.onClose}>取消</Button>
            </DialogActions>
        </Dialog>
    )
}

export default OnCloseDialog;