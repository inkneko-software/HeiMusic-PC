import React from "react"
import Slider from "@mui/material/Slider"
import { Avatar, Box, BoxProps, Button, Drawer, SwipeableDrawer, Typography } from "@mui/material"
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
import FullScreenMusicPannel from "./FullScreenMusicPannel"
import ImageSkeleton from "@components/Common/ImageSkeleton"
import { useRouter } from "next/router"
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import { PlaylistControllerService } from "@api/codegen/services/PlaylistControllerService"
import { PlayHistoryControllerService } from "@api/codegen/services/PlayHistoryControllerService"
import { pushToast } from "@components/HeiMusicMainLayout"
import { HeiMusicContext } from "../../lib/HeiMusicContext"

/**
 * 更换播放列表并播放
 * 
 * 通过以下方式调用
 * 
 * const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {detail: {...}});
 * 
 * document.dispatchEvent(event)
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
 * document.dispatchEvent(event)
 */
export interface IPlayEvent {
    action: "play" | "pause" | "next" | "prev" | "play_or_pause"
}


/**
 * 将指定音乐列表加入到当前的播放列表的底部
 * 
 * 通过以下方式调用
 * 
 * const event = new CustomEvent<IEnqueueEvent>("music-control-panel::enqueue", {detail: ...});
 * 
 * document.dispatchEvent(event)
 */
export interface IEnqueueEvent {
    musicList: IMusicInfo[]
}

/**
 * 将指定的音乐列表插入到下一首进行播放
 * 
 * 通过以下方式调用
 * 
 * const event = new CustomEvent<IEnqueueNextEvent>("music-control-panel::enqueueNext", {detail: ...});
 * 
 * document.dispatchEvent(event)
 */
export interface IEnqueueNextEvent {
    musicList: IMusicInfo[]
}

/**
 * 切换当前播放列表正在播放的音乐
 * 
 * 通过以下方式调用
 * 
 * const event = new CustomEvent<IChangeMusicEvent>("music-control-panel::changeMusic", {detail: {index: 0}});
 * 
 * document.dispatchEvent(event)
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
    musicId: number,
    title: string,
    artists: string[],
    qualityOption: IMusicQuality[],
    albumId: number,
    albumTitle: string,
    cover: string,
    isLargeTrackMusic: boolean,
    isFavorite?: boolean,
    duration?: number,
    discStartTime?: number,
    discEndTime?: number,
    isInstrumental?: boolean
}

export interface IPlayingMusicInfo extends IMusicInfo {
    currentQuality: IMusicQuality,
    currentIndex: number
}

interface IMusicControlPannel extends BoxProps {
    src?: string
}

function MusicControlPannel(props: IMusicControlPannel) {
    // 仅解构 setter（useState 的 setter 身份稳定），避免依赖整个 context 对象
    // 导致 effect 反复重跑；本组件与 _app 双向同步播放状态
    const { setCurrentMusicInfo: setGlobalMusicInfo } = React.useContext(HeiMusicContext);
    const router = useRouter();
    const theme = useTheme();
    const audioRef = React.useRef<HTMLAudioElement>(null)
    const volumeButtonRef = React.useRef()
    //播放历史打点标记：换源时重置为 0，onplay 时若与当前曲目不一致则上报一次；
    //暂停后继续播放不重复计数
    const reportedMusicIdRef = React.useRef(0)

    const [playing, setPlaying] = React.useState(false);
    const [playBtnIcon, setPlayBtnIcon] = React.useState(<PlayCircleFilled style={{ fontSize: 42 }} />);
    const [volumePanelOpen, setVolumePanelOpen] = React.useState(false);
    const [volume, setVolume] = React.useState(35);
    const [duration, setDuration] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [timeLabel, setTimeLabel] = React.useState("--:-- / --:--");
    const [currentMusicInfo, setCurrentMusicInfo] = React.useState<IPlayingMusicInfo>({
        musicId: 0,
        title: "HeiMusic!",
        artists: ["author: inkneko."],
        qualityOption: [{
            name: "SQ",
            url: "",
            color: "red"
        }],
        albumId: 0,
        albumTitle: "",
        cover: null,
        currentIndex: 0,
        currentQuality: {
            name: "SQ",
            url: "",
            color: "red"
        },
        isLargeTrackMusic: false
    });
    const [playbackMethod, setPlaybackMethod] = React.useState<'loop' | 'sequence' | 'random' | 'repeate'>("loop")
    const [musicList, setMusicList] = React.useState<IMusicInfo[]>([]);
    const [playlistOpen, setPlaylistOpen] = React.useState(false);

    const [fullScreenMusicPannelOpen, setFullScreenMusicPannelOpen] = React.useState(false);

    const handlePlayButtonClick = React.useCallback((newList: boolean = false) => {
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
            //设置主进程小窗口按钮
            if (typeof (window) !== "undefined" && typeof (window.electronAPI) !== "undefined") {
                window.electronAPI.thumbnail.playing();
            }

            if (audioRef.current.src === '') {
                const nextMusic = musicList[0];
                setCurrentMusicInfo({ ...nextMusic, currentIndex: 0, currentQuality: nextMusic.qualityOption[0] });
                audioRef.current.src = nextMusic.qualityOption[0].url;
                reportedMusicIdRef.current = 0;
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

        } else {
            if (typeof (window) !== "undefined" && typeof (window.electronAPI) !== "undefined") {
                window.electronAPI.thumbnail.paused();
            }

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

        }
    }, [musicList])

    const handleLoopOptionClick = () => {

    }

    const handlePrevClick = React.useCallback(() => {
        const audio = audioRef.current;
        audio.currentTime = 0;
        if (playbackMethod === 'loop') {
            var nextIndex = currentMusicInfo.currentIndex - 1;
            if (nextIndex === -1) {
                nextIndex = musicList.length - 1;
            }
            var nextMusic: IMusicInfo = musicList[nextIndex];
            setCurrentMusicInfo({ ...nextMusic, currentIndex: nextIndex, currentQuality: nextMusic.qualityOption[0] });
            audio.src = nextMusic.qualityOption[0].url;
            reportedMusicIdRef.current = 0;
            if (nextMusic.isLargeTrackMusic) {
                audio.currentTime = nextMusic.discStartTime;
            }
            audio.play();
            document.title = `${nextMusic.title} - HeiMusic!`;
        }
    }, [playbackMethod, currentMusicInfo, musicList])

    const handleNextClick = React.useCallback(() => {
        const audio = audioRef.current;
        if (playbackMethod === 'loop') {
            audio.currentTime = 0;
            var nextIndex = currentMusicInfo.currentIndex + 1;
            if (nextIndex === musicList.length) {
                nextIndex = 0;
            }
            var nextMusic: IMusicInfo = musicList[nextIndex];
            setCurrentMusicInfo({ ...nextMusic, currentIndex: nextIndex, currentQuality: nextMusic.qualityOption[0] });
            audio.src = nextMusic.qualityOption[0].url;
            reportedMusicIdRef.current = 0;
            if (nextMusic.isLargeTrackMusic) {
                audio.currentTime = nextMusic.discStartTime;
            }
            audio.play();
            document.title = `${nextMusic.title} - HeiMusic!`;
        }
    }, [playbackMethod, currentMusicInfo, musicList])

    React.useEffect(() => {
        setGlobalMusicInfo({ musicId: currentMusicInfo.musicId, albumId: currentMusicInfo.albumId });
        if (audioRef.current !== null) {
            const audio = audioRef.current;
            //获取音量配置
            (async function () {
                if (window !== undefined && window.electronAPI !== undefined) {
                    var config = await window.electronAPI.config.get();
                    setVolume(config.volume);
                    audio.volume = config.volume / 100;
                }
            })()

            audio.ontimeupdate = () => {
                document.title = `${currentMusicInfo.title} - HeiMusic!`;
                var duration;
                var currentMinutes;
                var currentSeconds;
                if (currentMusicInfo.isLargeTrackMusic) {
                    duration = currentMusicInfo.discEndTime - currentMusicInfo.discStartTime;
                    currentMinutes = String(Math.floor((audio.currentTime - currentMusicInfo.discStartTime) / 60)).padStart(2, '0');
                    currentSeconds = String(Math.floor((audio.currentTime - currentMusicInfo.discStartTime) % 60)).padStart(2, '0');
                    setCurrentTime(audio.currentTime - currentMusicInfo.discStartTime);
                } else {
                    duration = audio.duration;
                    currentMinutes = String(Math.floor(audio.currentTime / 60)).padStart(2, '0');
                    currentSeconds = String(Math.floor(audio.currentTime % 60)).padStart(2, '0');
                    setCurrentTime(audio.currentTime);
                }

                var durationMinutes = '00';
                var durationSeconds = '00';
                if (!Number.isNaN(audio.duration)) {
                    durationMinutes = String(Math.floor(duration / 60)).padStart(2, '0')
                    durationSeconds = String(Math.floor(duration % 60)).padStart(2, '0')
                }

                setDuration(duration);
                setTimeLabel(`${currentMinutes}:${currentSeconds} / ${durationMinutes}:${durationSeconds}`)
                if (currentMusicInfo.isLargeTrackMusic && audio.currentTime > currentMusicInfo.discEndTime && audio.duration !== 0) {
                    handleNextClick();
                }

            }

            if ("mediaSession" in navigator) {
                navigator.mediaSession.setActionHandler("play", () => {
                    handlePlayButtonClick()
                })

                navigator.mediaSession.setActionHandler("pause", () => {
                    handlePlayButtonClick();
                })
            }

            audio.onplay = () => {
                setPlaying(true)
                setPlayBtnIcon(<PauseCircleFilled style={{ fontSize: 42 }} />)
                //播放历史打点：每首曲目实际开播时上报一次，暂停后继续不重复计数；失败静默不影响播放
                if (currentMusicInfo.musicId !== 0 && reportedMusicIdRef.current !== currentMusicInfo.musicId) {
                    reportedMusicIdRef.current = currentMusicInfo.musicId;
                    PlayHistoryControllerService.report(currentMusicInfo.musicId)
                        .catch(error => {
                            console.error('播放历史打点失败', error);
                        })
                }
            }

            audio.onpause = () => {
                setPlaying(false)
                setPlayBtnIcon(<PlayCircleFilled style={{ fontSize: 42 }} />)
            }

            audio.onended = () => {
                console.log(currentMusicInfo);
                console.log(audio.duration);
                console.log(audio.currentTime)
                handleNextClick();
            }


            //更换播放列表消息的处理函数
            const changePlayList = (data: CustomEvent<IChangePlayListEvent>) => {
                var index = data.detail.startIndex;
                var newMusic = data.detail.playlist[index]
                setMusicList(data.detail.playlist);
                setCurrentMusicInfo({ ...newMusic, currentIndex: index, currentQuality: newMusic.qualityOption[0] })
                document.title = `${newMusic.title} - HeiMusic!`;
                if (audioRef.current !== null) {
                    var audio = audioRef.current;
                    audio.src = newMusic.qualityOption[0].url;
                    reportedMusicIdRef.current = 0;
                    if (newMusic.isLargeTrackMusic) {
                        audio.currentTime = newMusic.discStartTime;
                    }
                    handlePlayButtonClick(true);
                }
            }

            //更换当前播放音乐消息的处理函数
            const changeMusic = (data: CustomEvent<IChangeMusicEvent>) => {
                var newIndex = data.detail.index;
                var newMusic = musicList[newIndex]
                setCurrentMusicInfo({ ...newMusic, currentIndex: newIndex, currentQuality: newMusic.qualityOption[0] })
                document.title = `${newMusic.title} - HeiMusic!`;
                if (audioRef.current !== null) {
                    var audio = audioRef.current;
                    if (newMusic.isLargeTrackMusic) {
                        audio.currentTime = newMusic.discStartTime;
                    }
                    audio.src = newMusic.qualityOption[0].url;
                    reportedMusicIdRef.current = 0;
                    handlePlayButtonClick(true);
                }
            }

            //添加音乐到播放列表消息的处理函数
            const enqueue = (data: CustomEvent<IEnqueueEvent>) => {
                //对于已在播放列表中的音乐，将其移动到队尾
                //也就是先将已存在的歌曲删掉，然后追加音乐列表
                var enqueueMusicList = data.detail.musicList;
                const isNotEnqueuedMusic = (music: IMusicInfo) => {
                    return enqueueMusicList.find(m => m.musicId === music.musicId) === undefined;
                }
                var modifiedList = [...musicList.filter(isNotEnqueuedMusic), ...enqueueMusicList]
                setMusicList(modifiedList);
                //调整currentIndex
                var afterEnqueuePlayingIndex = modifiedList.findIndex(music => {
                    return music.musicId == currentMusicInfo.musicId;
                });
                setCurrentMusicInfo({ ...currentMusicInfo, currentIndex: afterEnqueuePlayingIndex });
            }

            //添加音乐到下一曲播放消息的处理函数
            const enqueueNext = (data: CustomEvent<IEnqueueNextEvent>) => {
                var enqueueMusicList = data.detail.musicList;
                //判断给定的音乐是否不在入队的音乐列表中
                const isNotEnqueuedMusic = (music: IMusicInfo) => {
                    return enqueueMusicList.find(m => m.musicId === music.musicId) === undefined;
                }
                var modifiedList = [...musicList.slice(0, currentMusicInfo.currentIndex + 1).filter(isNotEnqueuedMusic), ...enqueueMusicList, ...musicList.slice(currentMusicInfo.currentIndex + 1).filter(isNotEnqueuedMusic)];
                setMusicList(modifiedList);
                //调整currentIndex
                var afterEnqueuePlayingIndex = modifiedList.findIndex(music => {
                    return music.musicId == currentMusicInfo.musicId;
                });
                setCurrentMusicInfo({ ...currentMusicInfo, currentIndex: afterEnqueuePlayingIndex });
            }


            document.addEventListener("music-control-panel::changePlayList", changePlayList);
            document.addEventListener("music-control-panel::changeMusic", changeMusic);
            document.addEventListener("music-control-panel::enqueue", enqueue);
            document.addEventListener("music-control-panel::enqueueNext", enqueueNext);


            //electron 相关操作
            if (window.electronAPI !== undefined) {
                window.electronAPI.playback.next(handleNextClick);
                window.electronAPI.playback.prev(handlePrevClick);
                window.electronAPI.playback.play(handlePlayButtonClick);
            }

            return () => {
                audio.ontimeupdate = null;
                document.removeEventListener("music-control-panel::changePlayList", changePlayList);
                document.removeEventListener("music-control-panel::changeMusic", changeMusic);
                document.removeEventListener("music-control-panel::enqueue", enqueue);
                document.removeEventListener("music-control-panel::enqueueNext", enqueueNext);
                if (window.electronAPI !== undefined) {
                    window.electronAPI.playback.cleanup();
                }

            }
        }

    }, [currentMusicInfo, musicList, playbackMethod, handlePlayButtonClick, handlePrevClick, handleNextClick, setGlobalMusicInfo])



    const handleVolumeChange = (value) => {
        setVolume(value);
        audioRef.current.volume = value / 100
    }

    const handleAddFavoriteMusic = () => {
        PlaylistControllerService.addMusicFavorite(currentMusicInfo.musicId)
            .then(res => {
                setCurrentMusicInfo(prev => ({ ...prev, isFavorite: true }))
            })
            .catch((error) => {
                pushToast(error.message)
            })
    }

    const handleRemoveFavoriteMusic = () => {
        PlaylistControllerService.removeMusicFavorite(currentMusicInfo.musicId)
            .then(res => {
                setCurrentMusicInfo(prev => ({ ...prev, isFavorite: false }))

            })
            .catch((error) => {
                pushToast(error.message)
            })
    }

    const handleProgressSeek = (newProgress: number) => {
        var offset = currentMusicInfo.isLargeTrackMusic ? currentMusicInfo.discStartTime : 0;
        audioRef.current.currentTime = newProgress + offset;
        audioRef.current.play();
        setCurrentTime(newProgress);
    }

    const handleVolumePanelClose = () => {
        if (window !== undefined && window.electronAPI !== undefined) {
            window.electronAPI.config.set("volume", volume);
            window.electronAPI.config.save();
        }
        setVolumePanelOpen(false);
    }

    return (
        <Box {...props} sx={{ ...(props.sx), display: "flex", flexDirection: "column" }}>
            <audio ref={audioRef} />
            {/* 进度条 */}
            <MusicSlider size="small" max={duration} value={currentTime} onChangeCommitted={(event, value: number) => handleProgressSeek(value)} />
            {/* 音乐信息与控制面板 */}
            <Box sx={{ display: "flex", margin: "auto 0px", flexGrow: "1", paddingBottom: '4px' }}>
                {/* 音乐信息 */}
                <Box sx={{ display: "flex", marginLeft: "20px", width: "30%", textAlign: "left", '@media(max-width:600px)': { flexGrow: '1' } }}>
                    {/* <Avatar
                        variant="square"
                        src={currentMusicInfo.cover}
                        sx={{ margin: "auto 0", borderRadius: "6px", objectFit: 'contain' }}
                        onClick={()=>setFullScreenMusicPannelOpen(true)}
                    >
                        <MusicNote />
                    </Avatar> */}
                    <ImageSkeleton
                        sx={{
                            width: '40px',
                            height: '40px',
                            margin: "auto 0px",
                            borderRadius: '6px',
                            imageRendering: "auto",
                            objectFit: "contain",
                            ':hover': {
                                cursor: 'pointer'
                            }
                        }}
                        src={currentMusicInfo.cover !== null ? currentMusicInfo.cover + "?s=@w64h64" : null}
                        onClick={() => setFullScreenMusicPannelOpen(true)} />
                    <Box sx={{ margin: "auto 0 auto 15px", display: "flex", flexDirection: "column", textAlign: "left", width: '30%', flexGrow: 1 }}>
                        <ScrollableTypography sx={{ cursor: 'pointer' }} onClick={() => router.push(`/album/${currentMusicInfo.albumId}`)}>{currentMusicInfo.title}</ScrollableTypography>
                        <ScrollableTypography sx={{ fontSize: "12px", color: "#a1a1a1" }} noWrap>{currentMusicInfo.artists.join(' / ')}</ScrollableTypography>
                    </Box>
                </Box>
                {/* 控制面板 */}
                <Box sx={{ flexGrow: "1", margin: "auto auto", textAlign: "center", '@media(max-width:600px)': { display: 'none' } }} >
                    {/* 播放模式 */}
                    <IconButton sx={{ color: theme.palette.text.primary }} onClick={handleLoopOptionClick}><Repeat style={{ fontSize: 24 }} /></IconButton>
                    {/* 上一曲 */}
                    <IconButton sx={{ color: theme.palette.text.primary }} onClick={handlePrevClick} ><SkipPrevious style={{ fontSize: 34 }} /></IconButton>
                    {/* 播放 */}
                    <IconButton color="primary" onClick={() => { handlePlayButtonClick() }} >{playBtnIcon}</IconButton>
                    {/* 下一曲 */}
                    <IconButton sx={{ color: theme.palette.text.primary }} onClick={handleNextClick} ><SkipNext style={{ fontSize: 34 }} /></IconButton>
                    {/* 音量 */}
                    <VolumePannel
                        open={volumePanelOpen}
                        value={volume}
                        onChange={(event, value: number) => handleVolumeChange(value)}
                        onMouseEnter={() => setVolumePanelOpen(true)}
                        onMouseLeave={handleVolumePanelClose}
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
                {/* 控制面板的移动端适配 */}
                <Box sx={{ margin: "auto 12px auto auto", textAlign: "center", '@media(min-width:600px)': { display: 'none' } }}>
                  .  <IconButton color="primary" onClick={() => { handlePlayButtonClick() }} >{playBtnIcon}</IconButton>
                    <IconButton sx={{ margin: "auto 8px auto 0px" }} onClick={() => setPlaylistOpen(true)}><QueueMusic /></IconButton>
                </Box>
                {/* 时间、音质、收藏、播放列表 */}
                <Box sx={{ margin: "auto 0px", width: "30%", textAlign: "right", display: "flex", '@media(max-width:600px)': { display: 'none' } }}>
                    {/* 时间信息 */}
                    <Typography sx={{ margin: "auto 4px", flexGrow: "1", userSelect: "none", color: theme.palette.text.secondary }} variant="subtitle2">{timeLabel}</Typography>
                    {/* 收藏 */}
                    {
                        currentMusicInfo.isFavorite && <Button size="small" sx={{ padding: "0px 0px", width: "20px", height: "20px", margin: 'auto 4px', minWidth: "unset" }} color="error" onClick={handleRemoveFavoriteMusic} ><FavoriteOutlinedIcon sx={{ width: "18px", height: "18px" }} /></Button>
                    }
                    {
                        !currentMusicInfo.isFavorite && <Button size="small" sx={{ padding: "0px 0px", width: "20px", height: "20px", margin: 'auto 4px', minWidth: "unset" }} color="error" onClick={handleAddFavoriteMusic}><FavoriteBorderOutlinedIcon sx={{ width: "18px", height: "18px" }} /></Button>
                    }
                    {/* 音质 */}
                    <Button sx={[currentMusicInfo.currentQuality.name === null && { display: 'none' }, { color: currentMusicInfo.currentQuality.color, border: `1px solid ${currentMusicInfo.currentQuality.color}`, padding: '0px 0px', margin: 'auto 4px', minWidth: '32px', minHeight: '0px', lineHeight: 'normal' }]} size='small' >{currentMusicInfo.currentQuality.name}</Button>
                    {/* 播放列表按钮 */}
                    <IconButton sx={{ margin: "auto 8px auto 0px" }} onClick={() => setPlaylistOpen(true)}><QueueMusic /></IconButton>
                </Box>
            </Box>
            {/* 右侧边音乐列表 */}
            <Drawer
                anchor="right"
                open={playlistOpen}
                onClose={() => setPlaylistOpen(false)}
                sx={{ zIndex: '1300' }}
            >
                <PlayList musicList={musicList} currentIndex={currentMusicInfo.currentIndex} onClose={() => setPlaylistOpen(false)} />
            </Drawer>
            {/* 全屏歌词页面 */}
            <FullScreenMusicPannel
                open={fullScreenMusicPannelOpen}
                onClose={() => setFullScreenMusicPannelOpen(false)}
                currentMusicInfo={currentMusicInfo}
                timeLabel={timeLabel}
                playing={playing}
                handleLoopOptionClick={handleLoopOptionClick}
                handlePrevClick={handlePrevClick}
                handlePlayButtonClick={handlePlayButtonClick}
                playBtnIcon={playBtnIcon}
                handleNextClick={handleNextClick}
                volume={volume}
                handleVolumeChange={handleVolumeChange}
                handleVolumePanelClose={handleVolumePanelClose}
                setPlaylistOpen={setPlaylistOpen}
                handleAddFavoriteMusic={handleAddFavoriteMusic}
                handleRemoveFavoriteMusic={handleRemoveFavoriteMusic}
                handleProgressSeek={handleProgressSeek}
                currentTime={currentTime}
                duration={duration}
            />
        </Box>
    )
}

export default MusicControlPannel;