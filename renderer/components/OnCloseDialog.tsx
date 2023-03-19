import React from "react"
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { Button, DialogProps, FormControlLabel, Radio, RadioGroup, RadioGroupProps } from "@mui/material";

function OnCloseDialog(props: DialogProps) {
    const [selectedOption, setSelectedOption] = React.useState<string>("minimized");
    const [heiMusicConfig, setHeiMusicConfig] = React.useState<HeiMusicConfig>(null)
    React.useEffect(()=>{
        window.electronAPI.config.get().then(res=>{
            setHeiMusicConfig(res);
            res.closeWindowMinimized = false;
        })
        // window.electronAPI.config.onChange((e, res)=>{
        //     setHeiMusicConfig(res)
        // })
    }, [])
    
    const onConfirm = ()=>{
        if (selectedOption === "exit"){
            window.electronAPI.config.set("closeWindowMinimized", false);
            window.electronAPI.config.save();
            window.electronAPI.windowManagement.close();
        }else{
            window.electronAPI.config.set("closeWindowMinimized", true);
            window.electronAPI.config.save();
            window.electronAPI.windowManagement.minimize();

        }
    }
    return (
        <Dialog open={props.open} onClose={props.onClose}>
            <DialogTitle>是否退出？</DialogTitle>
            <DialogContent>
                <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    defaultValue="minimized"
                    name="radio-buttons-group"
                    onChange={(e, v)=>{setSelectedOption(v)}}
                >
                    <FormControlLabel value="minimized" control={<Radio value="minimized"/>} label="最小化至托盘图标" />
                    <FormControlLabel value="exit" control={<Radio value="exit" />} label="退出应用程序" />
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onConfirm}>确认</Button>
                <Button onClick={(e) => props.onClose(e, "backdropClick")}>取消</Button>
            </DialogActions>
        </Dialog>
    )
}

export default OnCloseDialog;