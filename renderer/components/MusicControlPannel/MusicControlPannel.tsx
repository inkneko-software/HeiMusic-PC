import React from "react"
import Slider from "@mui/material/Slider"
import { Avatar, Box, BoxProps, Button, SwipeableDrawer, Typography } from "@mui/material"
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
import ScrollableTypography from "@components/Common/ScrollableTypography"
import PlayList from "./PlayList"


/**
 * 更换播放列表并播放
 * 
 * 通过以下方式调用
 * 
 * const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {detail: {...}});
 * 
 * window.dispatchEvent(event)
 */
export interface IChangePlayListEvent {
    playlist: IMusicInfo[],
    startIndex: number,
}

/**
 * 播放事件
 * 
 * 通过以下方式调用
 * 
 * const event = new CustomEvent<IPlayEvent>("music-control-panel::play", {detail: {action: "play"}});
 * 
 * window.dispatchEvent(event)
 */
export interface IPlayEvent {
    action: "play" | "pause" | "next" | "prev" | "play_or_pause"
}

/**
 * 切换当前播放列表正在播放的音乐
 * 
 * 通过以下方式调用
 * 
 * const event = new CustomEvent<IChangeMusicEvent>("music-control-panel::changeMusic", {detail: {index: 0}});
 * 
 * window.dispatchEvent(event)
 */
export interface IChangeMusicEvent {
    index: number
}

export interface IMusicQuality {
    name: string,
    url: string,
    color: string
}

export interface IMusicInfo {
    songId: number,
    title: string,
    artists: string[],
    qualityOption: IMusicQuality[],
    albumId: number,
    albumTitle: string,
    cover: string
}

interface IPlayingMusicInfo extends IMusicInfo {
    currentQuality: IMusicQuality,
    currentIndex: number
}

interface IMusicControlPannel extends BoxProps {
    src?: string
}

function MusicControlPannel(props: IMusicControlPannel) {
    const theme = useTheme();
    const audioRef = React.useRef<HTMLAudioElement>(null)
    const volumeButtonRef = React.useRef()

    const [playBtnIcon, setPlayBtnIcon] = React.useState(<PlayCircleFilled style={{ fontSize: 42 }} />);
    const [volumePanelOpen, setVolumePanelOpen] = React.useState(false);
    const [volume, setVolume] = React.useState(35);
    const [duration, setDuration] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [timeLabel, setTimeLabel] = React.useState("--:-- / --:--");
    const [currentMusicInfo, setCurrentMusicInfo] = React.useState<IPlayingMusicInfo>({
        songId: 0,
        title: "HeiMusic!",
        artists: ["author: inkneko."],
        qualityOption: [{
            name: "SQ",
            url: "",
            color: "red"
        }],
        albumId: 0,
        albumTitle: "",
        cover: "",
        currentIndex: 0,
        currentQuality: {
            name: "SQ",
            url: "",
            color: "red"
        }
    });
    const [playbackMethod, setPlaybackMethod] = React.useState<'loop' | 'sequence' | 'random' | 'repeate'>("loop")
    const [musicList, setMusicList] = React.useState<IMusicInfo[]>([]);
    const [playlistOpen, setPlaylistOpen] = React.useState(false)

    React.useEffect(() => {
        if (audioRef.current !== null) {
            const audio = audioRef.current;
            audio.volume = volume / 100;
            audio.ontimeupdate = () => {

                var durationMinutes = '00';
                var durationSeconds = '00';
                if (!Number.isNaN(audio.duration)) {
                    durationMinutes = String(Math.floor(audio.duration / 60)).padStart(2, '0')
                    durationSeconds = String(Math.floor(audio.duration % 60)).padStart(2, '0')
                }

                var currentMinutes = String(Math.floor(audio.currentTime / 60)).padStart(2, '0');
                var currentSeconds = String(Math.floor(audio.currentTime % 60)).padStart(2, '0')

                setCurrentTime(audio.currentTime)
                setDuration(audio.duration)
                setTimeLabel(`${currentMinutes}:${currentSeconds} / ${durationMinutes}:${durationSeconds}`)
            }

            audio.onpause = () => {

            }

            audio.onended = () => {
                handleNextClick();
            }


            const changePlayList = (data: CustomEvent<IChangePlayListEvent>) => {
                var index = data.detail.startIndex;
                var newMusic = data.detail.playlist[index]
                setMusicList(data.detail.playlist);
                setCurrentMusicInfo({ ...newMusic, currentIndex: index, currentQuality: newMusic.qualityOption[0] })
                document.title = `${newMusic.title} - HeiMusic!`;
                if (audioRef.current !== null) {
                    var audio = audioRef.current;
                    audio.src = newMusic.qualityOption[0].url;
                    handlePlayButtonClick(true);
                }
            }

            const changeMusic = (data: CustomEvent<IChangeMusicEvent>) => {
                var newIndex = data.detail.index;
                var newMusic = musicList[newIndex]
                setCurrentMusicInfo({ ...newMusic, currentIndex: newIndex, currentQuality: newMusic.qualityOption[0] })
                document.title = `${newMusic.title} - HeiMusic!`;
                if (audioRef.current !== null) {
                    var audio = audioRef.current;
                    audio.src = newMusic.qualityOption[0].url;
                    handlePlayButtonClick(true);
                }
            }
            document.addEventListener("music-control-panel::changePlayList", changePlayList);
            document.addEventListener("music-control-panel::changeMusic", changeMusic);
            if(window.electronAPI !== undefined){
                window.electronAPI.playback.next(handleNextClick);
                window.electronAPI.playback.prev(handlePrevClick);
                window.electronAPI.playback.play(handlePlayButtonClick);
            }
            

            return () => {
                audio.ontimeupdate = null;
                document.removeEventListener("music-control-panel::changePlayList", changePlayList);
                document.removeEventListener("music-control-panel::changeMusic", changeMusic);
                if (window.electronAPI !== undefined){
                    window.electronAPI.playback.cleanup();
                }

            }
        }

    }, [audioRef.current, currentMusicInfo, musicList])


    const handlePlayButtonClick = (newList: boolean = false) => {
        if (musicList.length === 0 && newList == false) {
            return;
        }

        //fixme: 按钮在事件未完成时被按下
        var handle = null;
        var sourceVolume = audioRef.current.volume;
        if (handle !== null) {
            clearInterval(handle);
            audioRef.current.volume = sourceVolume
        }


        if (audioRef.current.paused) {
            if (audioRef.current.src === '') {
                const nextMusic = musicList[0];
                setCurrentMusicInfo({ ...nextMusic, currentIndex: 0, currentQuality: nextMusic.qualityOption[0] });
                audioRef.current.src = nextMusic.qualityOption[0].url;
                document.title = `${nextMusic.title} - HeiMusic!`;
            }
            audioRef.current.play();
            var counter = 0;
            sourceVolume = audioRef.current.volume;
            audioRef.current.volume = 0;
            handle = setInterval(() => {
                var volumeIncrement = sourceVolume / 10
                if (audioRef.current.volume + volumeIncrement > sourceVolume) {
                    audioRef.current.volume = sourceVolume;
                } else {
                    audioRef.current.volume += volumeIncrement;
                }
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
                var volumeDecrement = sourceVolume / 10;
                if (audioRef.current.volume - volumeDecrement < 0) {
                    audioRef.current.volume = 0;
                } else {
                    audioRef.current.volume -= sourceVolume / 10
                }
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

    const handleLoopOptionClick = () => {

    }

    const handlePrevClick = () => {
        const audio = audioRef.current;
        if (playbackMethod === 'loop') {
            var nextIndex = currentMusicInfo.currentIndex - 1;
            if (nextIndex === -1) {
                nextIndex = musicList.length - 1;
            }
            var nextMusic: IMusicInfo = musicList[nextIndex];
            setCurrentMusicInfo({ ...nextMusic, currentIndex: nextIndex, currentQuality: nextMusic.qualityOption[0] });
            //fix: 未调整
            audio.src = nextMusic.qualityOption[0].url;
            audio.play();
            document.title = `${nextMusic.title} - HeiMusic!`;
        }
    }

    const handleNextClick = () => {
        const audio = audioRef.current;
        if (playbackMethod === 'loop') {
            var nextIndex = currentMusicInfo.currentIndex + 1;
            if (nextIndex === musicList.length) {
                nextIndex = 0;
            }
            var nextMusic: IMusicInfo = musicList[nextIndex];
            setCurrentMusicInfo({ ...nextMusic, currentIndex: nextIndex, currentQuality: nextMusic.qualityOption[0] });
            //fix: 未调整
            audio.src = nextMusic.qualityOption[0].url;
            audio.play();
            document.title = `${nextMusic.title} - HeiMusic!`;
        }
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column" }} {...props}>
            <audio ref={audioRef} />
            <MusicSlider size="small" max={duration} value={currentTime} onChangeCommitted={(event, value: number) => { audioRef.current.currentTime = value; audioRef.current.play(); setCurrentTime(value) }} />
            <Box sx={{ display: "flex", margin: "auto 0px", flexGrow: "1" }}>
                <Box sx={{ display: "flex", marginLeft: "20px", width: "30%", textAlign: "left" }}>
                    <Avatar sx={{ margin: "auto 0", borderRadius: "2px" }} variant="square" src={currentMusicInfo.cover}><MusicNote /></Avatar>
                    <Box sx={{ margin: "auto 0 auto 15px", display: "flex", flexDirection: "column", textAlign: "left", width: '30%', flexGrow: 1 }}>
                        <ScrollableTypography>{currentMusicInfo.title}</ScrollableTypography>
                        <ScrollableTypography sx={{ fontSize: "12px", color: "#a1a1a1" }} noWrap>{currentMusicInfo.artists.join(' / ')}</ScrollableTypography>
                    </Box>
                </Box>
                <Box sx={{ flexGrow: "1", margin: "auto auto", textAlign: "center" }} >
                    <IconButton sx={{ color: theme.palette.text.primary }} onClick={handleLoopOptionClick}><Repeat style={{ fontSize: 24 }} /></IconButton>
                    <IconButton sx={{ color: theme.palette.text.primary }} onClick={handlePrevClick} ><SkipPrevious style={{ fontSize: 34 }} /></IconButton>
                    <IconButton color="primary" onClick={() => { handlePlayButtonClick() }} >{playBtnIcon}</IconButton>
                    <IconButton sx={{ color: theme.palette.text.primary }} onClick={handleNextClick} ><SkipNext style={{ fontSize: 34 }} /></IconButton>
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
                    <Typography sx={{ margin: "auto 12px auto 0px", flexGrow: "1", userSelect: "none", color: theme.palette.text.secondary }} variant="subtitle2">{timeLabel}</Typography>
                    <Button sx={[currentMusicInfo.currentQuality.name === null && { display: 'none' }, { color: currentMusicInfo.currentQuality.color, border: `1px solid ${currentMusicInfo.currentQuality.color}`, padding: '0px 0px', margin: 'auto 8px auto 0px', minWidth: '32px', minHeight: '0px', lineHeight: 'normal' }]} size='small' >{currentMusicInfo.currentQuality.name}</Button>
                    <IconButton sx={{ margin: "auto 8px auto 0px" }} onClick={() => setPlaylistOpen(true)}><QueueMusic /></IconButton>
                </Box>
            </Box>
            {/* 右侧边音乐列表 */}
            <SwipeableDrawer
                anchor="right"
                open={playlistOpen}
                onClose={() => setPlaylistOpen(false)}
                onOpen={() => setPlaylistOpen(true)}
            >
                <PlayList musicList={musicList} currentIndex={currentMusicInfo.currentIndex} onClose={() => setPlaylistOpen(false)} />
            </SwipeableDrawer>
        </Box>
    )
}

export default MusicControlPannel;