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

    const [musicCoverUrl, setMusicCoverUrl] = React.useState<string>(null);
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
        audioRef.current.src = "https://oss.inkneko.com/heimusic/14.%E8%BB%A2%E3%81%8C%E3%82%8B%E5%B2%A9%E3%80%81%E5%90%9B%E3%81%AB%E6%9C%9D%E3%81%8C%E9%99%8D%E3%82%8B.flac?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=HK7VZR1BIZ04M2QY2VLJ%2F20230307%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230307T140300Z&X-Amz-Expires=604800&X-Amz-Security-Token=eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NLZXkiOiJISzdWWlIxQklaMDRNMlFZMlZMSiIsImV4cCI6MTY3ODIwNjMzNCwicGFyZW50IjoiaGVpbXVzaWMifQ.7b2T9L2eyHQLtPyzE1s8NV_rsf1VVyEuFsKOuGglzpNGbmjXDF-yqAl0loRZz-r88_oCi-87jdNaKeYF2PcDiQ&X-Amz-SignedHeaders=host&versionId=null&X-Amz-Signature=8f37340d7bcfc7c65eaba0a42b11221ebf8753dcae901b2dd539d9302d21a538";
        setMusicCoverUrl("https://oss.inkneko.com/heimusic/avatar/COVER.jpg");
        setMusicName("星座になれたら");
        setMusicSinger("結束バンド")
    }
    const onPlay = () => {
        //fixme: 按钮在事件未完成时被按下
        var handle = null;
        var sourceVolume = audioRef.current.volume;
        if (handle !== null) {
            clearInterval(handle);
            audioRef.current.volume = sourceVolume
        }

        if (audioRef.current.paused) {
            if (audioRef.current.src === "") {
                setAudioAndPlay();
            }
            audioRef.current.play();
            var counter = 0;
            sourceVolume = audioRef.current.volume;
            audioRef.current.volume = 0;
            handle = setInterval(() => {
                audioRef.current.volume += sourceVolume / 10
                counter += 1;
                if (counter === 10) {
                    audioRef.current.volume = sourceVolume;
                    clearInterval(handle);
                    handle = null;
                }
            }, 100)
            setPlayBtnIcon(<PauseCircleFilled style={{ fontSize: 42 }} />)

        } else {
            var counter = 0;
            sourceVolume = audioRef.current.volume;
            handle = setInterval(() => {
                audioRef.current.volume -= sourceVolume / 10
                counter += 1;
                if (counter === 10) {
                    audioRef.current.volume = 0;
                    clearInterval(handle);
                    audioRef.current.pause();
                    audioRef.current.volume = sourceVolume;
                    handle = null;
                }
            }, 100)
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

            audio.onpause = () => {

            }

            return () => {
                audio.ontimeupdate = null;
            }
        }

    }, [audioRef.current])

    return (
        <Box sx={{ display: "flex", flexDirection: "column" }} {...props}>
            <audio ref={audioRef} />
            <MusicSlider size="small" max={duration} value={currentTime} onChangeCommitted={(event, value: number) => { audioRef.current.currentTime = value; audioRef.current.play(); setCurrentTime(value) }} />
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
                <Box sx={{ flexGrow: "1", margin: "auto auto", textAlign: "center" }} >
                    <IconButton sx={{ color: theme.palette.text.primary }}><Repeat style={{ fontSize: 24 }} /></IconButton>
                    <IconButton sx={{ color: theme.palette.text.primary }} ><SkipPrevious style={{ fontSize: 34 }} /></IconButton>
                    <IconButton color="primary" onClick={() => { onPlay() }} >{playBtnIcon}</IconButton>
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