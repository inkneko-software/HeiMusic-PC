import React from "react"
import Slider from "@mui/material/Slider"
import { Avatar, Box, BoxProps, Typography } from "@mui/material"
import MusicNote from "@mui/icons-material/MusicNote"
import SkipPrevious from "@mui/icons-material/SkipPrevious"
import SkipNext from "@mui/icons-material/SkipNext"
import PlayCircleFilled from "@mui/icons-material/PlayCircleFilled"
import PauseCircleFilled from "@mui/icons-material/PauseCircleFilled"
import QueueMusic from "@mui/icons-material/QueueMusic"
import VolumeDown from "@mui/icons-material/VolumeDown"
import VolumeOff from "@mui/icons-material/VolumeOff"
import Repeat from "@mui/icons-material/Repeat"
import RepeatOne from "@mui/icons-material/RepeatOne"
import IconButton from '@mui/material/IconButton';

import { styled, useTheme } from "@mui/styles"

import MusicSlider from "./MusicSlider"
import VolumePannel from "./VolumePannel"

interface IMusicControlPannel extends BoxProps {
    src?: string
}

function MusicControlPannel(props: IMusicControlPannel) {
    const theme = useTheme();

    const [musicCoverUrl, setMusicCoverUrl] = React.useState(MusicNote.toString(),);
    const [musicName, setMusicName] = React.useState("HeiMusic!");
    const [musicSinger, setMusicSinger] = React.useState("author: inkneko.");
    const [playBtnIcon, setPlayBtnIcon] = React.useState(<PlayCircleFilled style={{ fontSize: 42 }} />);
    const [volumePanelOpen, setVolumePanelOpen] = React.useState(false);
    const [volume, setVolume] = React.useState(35);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [qulity, setQulity] = React.useState("");
    const [qulityColor, setQulityColor] = React.useState("black");


    const [timeLabel, setTimeLabel] = React.useState("--:-- / --:--");


    const audioRef = React.useRef<HTMLAudioElement>()

    const volumeButtonRef = React.useRef()
    const setAudioAndPlay = () => {
        audioRef.current.src = "https://music.inkneko.com/青空JumpingHeart.flac";
        audioRef.current.play();
    }

    const onPlay = () => {
        if (audioRef.current.paused) {
            setAudioAndPlay();
            setPlayBtnIcon(<PauseCircleFilled style={{ fontSize: 42 }} />)

        } else {
            audioRef.current.pause();
            setPlayBtnIcon(<PlayCircleFilled style={{ fontSize: 42 }} />)

        }
    }

    React.useEffect(() => {
        if (typeof (audioRef.current) !== "undefined") {
            const audio = audioRef.current;
            audio.ontimeupdate = () => {
                var durationMinutes = String(Math.floor(audio.duration / 60)).padStart(2, '0')
                var durationSeconds = String(Math.floor(audio.duration % 60)).padStart(2, '0')

                var currentMinutes = String(Math.floor(audio.currentTime / 60)).padStart(2, '0');
                var currentSeconds = String(Math.floor(audio.currentTime % 60)).padStart(2, '0')

                setCurrentTime(audio.currentTime)
                setDuration(audio.duration)
                setTimeLabel(`${currentMinutes}:${currentSeconds} / ${durationMinutes}:${durationSeconds}`)
            }

            audio.onpause = ()=>{

            }
            
            return () => {
                audio.ontimeupdate = null;
            }
        }

    }, [audioRef.current])

    return (
        <Box sx={{ display: "flex", flexDirection: "column" }} {...props}>
            <audio ref={audioRef} />
            <MusicSlider size="small" max={duration} value={currentTime} onChangeCommitted={(event, value: number) => { audioRef.current.currentTime = value; audioRef.current.play() }} />
            <Box sx={{ display: "flex", margin: "auto 0px", flexGrow: "1" }}>
                <Box sx={{
                    display: "flex", marginLeft: "20px", width: "30%", textAlign: "left"
                }}>
                    <Avatar sx={{ margin: "auto 0", borderRadius: "2px" }} variant="square" src={musicCoverUrl}><MusicNote /></Avatar>
                    <Box sx={{ margin: "auto 0 auto 15px", display: "flex", flexDirection: "column", textAlign: "left" }}>
                        <Box sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{musicName}</Box>
                        <Box sx={{ fontSize: "12px", color: "#a1a1a1", overflow: "hidden", textOverflow: "ellipsis" }}>{musicSinger}</Box>
                    </Box>
                </Box>
                <Box sx={{ flexGrow: "1", margin:"auto auto", textAlign:"center"}} >
                    <IconButton sx={{ color: theme.palette.text.primary }}><Repeat style={{ fontSize: 24 }} /></IconButton>
                    <IconButton sx={{ backgroundColor: "transparent", color: theme.palette.text.primary }} ><SkipPrevious style={{ fontSize: 34 }} /></IconButton>
                    <IconButton sx={{ color: theme.palette.primary.main }} onClick={() => { onPlay() }} >{playBtnIcon}</IconButton>
                    <IconButton sx={{ backgroundColor: "transparent", color: theme.palette.text.primary }} ><SkipNext style={{ fontSize: 34 }} /></IconButton>
                    <VolumePannel
                        open={volumePanelOpen}
                        value={volume}
                        onChange={(event, value: number) => { setVolume(value); audioRef.current.volume = value / 100 }}
                        onMouseEnter={() => setVolumePanelOpen(true)}
                        onMouseLeave={() => setVolumePanelOpen(false)}
                        anchorEl={volumeButtonRef.current}
                    />
                    <IconButton
                        ref={volumeButtonRef}
                        sx={{ color: theme.palette.text.primary }}
                        onMouseEnter={() => setVolumePanelOpen(true)}
                        onMouseLeave={() => setVolumePanelOpen(false)}
                    >
                        <VolumeDown style={{ fontSize: 24 }} />
                    </IconButton>

                </Box>
                <Box sx={{ margin: "auto 0", width: "30%", textAlign: "right", display: "flex" }}>
                    <Typography sx={{ margin: "auto 0", flexGrow: "1", userSelect: "none", color: theme.palette.text.secondary }} variant="subtitle2">{timeLabel}</Typography>
                    <Box sx={{ margin: "auto 0px auto 8px", color: qulityColor }} >{qulity}</Box>
                    <IconButton sx={{ margin: "0px 8px" }}><QueueMusic /></IconButton>
                </Box>
            </Box>
        </Box>
    )
}

export default MusicControlPannel;