import React from 'react';
import Head from 'next/head';
import makeStyles from '@mui/styles/makeStyles';
import createStyles from '@mui/styles/createStyles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Link from '../components/Link';
import SvgIcon from '@mui/material/SvgIcon';

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import Remove from '@mui/icons-material/Remove';
import Crop32 from '@mui/icons-material/Crop32';
import Crop75OutlinedIcon from '@mui/icons-material/Crop75Outlined';
import Close from '@mui/icons-material/Close';
import Maximize from '@mui/icons-material/Maximize';
import MenuIcon from '@mui/icons-material/Menu';

import LoginDialog from '../components/Auth/LoginDialog';
import Avatar from '@mui/material/Avatar';
import LeftPannel from '../components/LeftPannel/LeftPannel';
import MusicAlbum from '../components/MusicAlbum';
import MusicControlPannel from '../components/MusicControlPannel';

import Skin from '../components/Icon/Skin'

import { theme } from '../lib/theme';
import { HeiMusicThemeContext } from '../lib/HeiMusicThemeProvider';

function Home() {
    const heimusicThemeContext = React.useContext(HeiMusicThemeContext)
    const [dialogOpen, setDialogOpen] = React.useState(false)
    const [loginDialogOpen, setLoginDialogOpen] = React.useState(false)
    var onCloseClicked = () => {
        setDialogOpen(true);
        // window.electronAPI.windowManagement.close()
    }

    return (
        <>
            <Head>
                <title>HeiMusic</title>
            </Head>
            <Box sx={{ width: "calc(100vw)", height: "calc(100vh)", display: "flex", flexDirection: 'column', background:`url(${heimusicThemeContext.backgroundUrl})`, backgroundRepeat:"no-repeat", backgroundSize:"cover"}}>
                <LoginDialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)} />
                <Dialog open={dialogOpen}>
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
                        <Button onClick={() => setDialogOpen(false)}>取消</Button>
                    </DialogActions>
                </Dialog>
                <Box sx={{ border: "1px solid black", height: 64, width: "100%", display: "flex", WebkitAppRegion: "drag", userSelect: "none", }}>
                    <Stack sx={{ margin: "auto 6px auto 12px" }} direction='row' >
                        <Avatar src='/images/logo.jpg'></Avatar>
                        <Typography sx={{ margin: "auto 0 auto 6px" }} variant="h6">HeiMusic!</Typography>
                    </Stack>
                    <Box sx={{ width: "100%", display: "flex" }}>
                        <Box sx={{ margin: "auto 5px auto auto", WebkitAppRegion: "no-drag", }}>
                            <Button onClick={() => setLoginDialogOpen(true)} size="small" >点击登录</Button>
                        </Box>
                        <Box sx={{ margin: "auto 5px auto 0", WebkitAppRegion: "no-drag", }}>
                            <HeiMusicThemeContext.Consumer>
                                {
                                    context=>{
                                        return <IconButton onClick={()=>context.setMode(context.mode === "light"? "customizedDarkMode" : "light")}><Skin fontSize='small' /></IconButton>
                                    }
                                }
                            </HeiMusicThemeContext.Consumer>
                            
                            <IconButton><MenuIcon fontSize='small' /></IconButton>
                        </Box>
                        <Box sx={{ width: 2, height: 18, background: "gray", margin: "auto 6px auto 6px" }}></Box>
                        <Box sx={{ margin: "auto 0 auto 0", WebkitAppRegion: "no-drag" }}>
                            <IconButton ><Remove /> </IconButton>
                            <IconButton ><Crop75OutlinedIcon /> </IconButton>
                            <IconButton onClick={onCloseClicked}><Close /></IconButton>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ border: "1px solid blue", flexGrow: 1, width: "100%", display: "flex" }}>
                    <LeftPannel sx={{ border: "1px solid green", width: "196px", display: "flex", flexDirection: "column" }} />
                    <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                        <MusicAlbum sx={{ border: "1px solid purple", flexGrow: 1 }} />
                        <MusicControlPannel sx={{ border: "1px solid yellow", height: 64, width: "100%" }} />
                    </Box>
                </Box>


            </Box>

        </>
    );
}

export default Home;
