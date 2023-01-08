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

import Box from '@mui/material/Box'
import  Stack  from '@mui/material/Stack';
import Divider from '@mui/material/Divider';

function onSystemTitleBarMouseDown(){

}

function Home() {

  return (
    <>
      <Head>
        <title>HeiMusic</title>
      </Head>
      <Box sx={{width:"calc(100vw)", height:"calc(100vh)", display:"flex", flexDirection: 'column'}}>
        <Box sx={{border:"1px solid black", height:64, width: "100%", display:"flex", WebkitAppRegion: "drag", userSelect: "none",}}>
          <Box sx={{margin:"auto 6px"}}>
            HeiMusic!
          </Box>

          <Box sx={{width: "100%",  display:"flex"}}>
            <Box sx={{margin:"auto 0 auto auto",  WebkitAppRegion: "no-drag"}}>
              <Button variant='contained' >最小化</Button>
              <Button variant='contained'>最大化</Button>
              <Button variant='contained'>关闭</Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{border:"1px solid blue", flexGrow: 1, height: 24, width: "100%", display:"flex"}}>
          <Box sx={{border:"1px solid green", minWidth: 196, display:"flex", flexDirection: "column"}}>
            <Stack direction="column" sx={{margin: "26px auto"}}>
              <Button variant="contained">我喜欢</Button>
              <Button variant="contained">本地和下载</Button>
              <Button variant="contained">最近播放</Button>
            </Stack>
            <Divider />
            <Stack direction="column" sx={{margin: "26px auto"}}>
              <Button variant="contained">歌单1</Button>
              <Button variant="contained">歌单2</Button>
              <Button variant="contained">歌单3</Button>
            </Stack>
          </Box>
          <Box sx={{display:"flex", flexDirection:"column", flexGrow:1}}>
            <Box sx={{border:"1px solid purple",flexGrow: 1}}>

            </Box>
            <Box sx={{border:"1px solid yellow", height:64, width: "100%"}}>

            </Box>
          </Box>
        </Box>
 
        
      </Box>

    </>
  );
}

export default Home;
