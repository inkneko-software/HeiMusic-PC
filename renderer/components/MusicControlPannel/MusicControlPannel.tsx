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
import PlaylistPlay from "@mui/icons-material/PlaylistPlay"
import Shuffle from "@mui/icons-material/Shuffle"
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
import { Capacitor } from "@capacitor/core"
import { mediaSession } from "../../lib/mediaSession"
import { nativeMediaUrl } from "../../lib/apiServer"

/** 播放模式：loop=列表循环（环绕）/ sequence=顺序播放（到末尾停止）/ random=随机播放（纯随机索引，上一曲走历史栈回退）/ repeat=单曲循环（自然播完重播当前曲） */
export type PlaybackMethod = 'loop' | 'sequence' | 'random' | 'repeat'

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

/**
 * 系统媒体通知的进度口径：大碟单曲为碟内相对位置
 * （与面板进度显示同一换算，见 ontimeupdate）
 */
function relPositionSec(audio: HTMLAudioElement, info: { isLargeTrackMusic: boolean; discStartTime?: number }) {
    return info.isLargeTrackMusic ? audio.currentTime - (info.discStartTime ?? 0) : audio.currentTime;
}

function MusicControlPannel(props: IMusicControlPannel) {
    // 仅解构 setter（useState 的 setter 身份稳定），避免依赖整个 context 对象
    // 导致 effect 反复重跑；本组件与 _app 双向同步播放状态
    const { setCurrentMusicInfo: setGlobalMusicInfo, registerOverlay, unregisterOverlay } = React.useContext(HeiMusicContext);
    const router = useRouter();
    const theme = useTheme();
    const audioRef = React.useRef<HTMLAudioElement>(null)
    const volumeButtonRef = React.useRef()
    //播放历史打点标记：换源时重置为 0，onplay 时若与当前曲目不一致则上报一次；
    //暂停后继续播放不重复计数
    const reportedMusicIdRef = React.useRef(0)
    //系统媒体通知进度的低频校准标记：距上次推送 ≥5s 才再推（系统按 speed 自行外推）
    const lastSyncedPosRef = React.useRef(0)

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
    const [playbackMethod, setPlaybackMethod] = React.useState<PlaybackMethod>("loop")
    const [musicList, setMusicList] = React.useState<IMusicInfo[]>([]);
    //随机模式的历史下标栈：随机切曲前压入当前下标，上一曲 pop 回退；列表变动（换列表/入队）时清空，避免下标失效
    const randomHistoryRef = React.useRef<number[]>([]);
    const [playlistOpen, setPlaylistOpen] = React.useState(false);

    const [fullScreenMusicPannelOpen, setFullScreenMusicPannelOpen] = React.useState(false);

    // 播放列表抽屉注册进 Android 返回键弹层栈：返回键优先收起抽屉
    React.useEffect(() => {
        if (!playlistOpen) return;
        const handle = { close: () => setPlaylistOpen(false) };
        registerOverlay(handle);
        return () => unregisterOverlay(handle);
    }, [playlistOpen, registerOverlay, unregisterOverlay]);

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
            if (audioRef.current.src === '') {
                const nextMusic = musicList[0];
                setCurrentMusicInfo({ ...nextMusic, currentIndex: 0, currentQuality: nextMusic.qualityOption[0] });
                audioRef.current.src = nativeMediaUrl(nextMusic.qualityOption[0].url);
                reportedMusicIdRef.current = 0;
                document.title = `${nextMusic.title} - HeiMusic!`;
            } else if (!newList && currentMusicInfo.isLargeTrackMusic && audioRef.current.currentTime > currentMusicInfo.discEndTime) {
                //大碟曲停在 discEndTime 之后（顺序播放末曲到点暂停）时恢复播放，先回碟内起点重播：普通曲 ended 态下
                //play() 浏览器会自动 seek 回 0，大碟没有这个行为，不回起点会从镜像里别的曲目续播、且立刻被
                //ontimeupdate 的到点检测再次暂停（表现为播放键点了没反应）。
                //newList 为换源路径（changePlayList/changeMusic），闭包里的 currentMusicInfo 还是旧曲，须跳过
                audioRef.current.currentTime = currentMusicInfo.discStartTime ?? 0;
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
    }, [musicList, currentMusicInfo])

    //换曲到 musicList[index]：集中各播放模式分支重复的换源/大碟起点/打点/标题逻辑
    //（先换源再定大碟起点：src 赋值触发 load() 会清掉已设的 currentTime，顺序须与 changePlayList/changeMusic 一致）
    const switchToMusic = React.useCallback((index: number) => {
        const audio = audioRef.current;
        var nextMusic: IMusicInfo = musicList[index];
        setCurrentMusicInfo({ ...nextMusic, currentIndex: index, currentQuality: nextMusic.qualityOption[0] });
        audio.src = nativeMediaUrl(nextMusic.qualityOption[0].url);
        reportedMusicIdRef.current = 0;
        if (nextMusic.isLargeTrackMusic) {
            audio.currentTime = nextMusic.discStartTime;
        }
        audio.play();
        document.title = `${nextMusic.title} - HeiMusic!`;
    }, [musicList])

    //切换播放模式：loop → sequence → random → repeat 轮换；Electron 存配置文件，非 Electron（网页/安卓）存 localStorage
    const handleLoopOptionClick = () => {
        const order: PlaybackMethod[] = ['loop', 'sequence', 'random', 'repeat'];
        const next = order[(order.indexOf(playbackMethod) + 1) % order.length];
        setPlaybackMethod(next);
        if (window !== undefined && window.electronAPI !== undefined) {
            window.electronAPI.config.set("playbackMethod", next);
            window.electronAPI.config.save();
        } else {
            localStorage.setItem('heimusic.playbackMethod', next);
        }
    }

    //恢复上次播放模式：只在挂载时读一次，不进主 useEffect——它随换曲重跑，会把用户刚切的模式反复覆盖回配置值
    React.useEffect(() => {
        const isValidMethod = (value: unknown): value is PlaybackMethod =>
            value === 'loop' || value === 'sequence' || value === 'random' || value === 'repeat';
        if (window !== undefined && window.electronAPI !== undefined) {
            window.electronAPI.config.get()
                .then(config => {
                    if (isValidMethod(config.playbackMethod)) {
                        setPlaybackMethod(config.playbackMethod);
                    }
                })
                .catch(error => {
                    console.error('读取播放模式配置失败', error);
                })
        } else {
            const saved = localStorage.getItem('heimusic.playbackMethod');
            if (isValidMethod(saved)) {
                setPlaybackMethod(saved);
            }
        }
    }, [])

    const handlePrevClick = React.useCallback(() => {
        if (musicList.length === 0) {
            return;
        }
        const audio = audioRef.current;
        //先回到本曲起点：后续分支若不切曲（顺序到头/随机栈空）即等效重播当前曲；大碟曲必须回碟内起点，落 0 会跳进镜像里别的曲目
        audio.currentTime = currentMusicInfo.isLargeTrackMusic ? (currentMusicInfo.discStartTime ?? 0) : 0;
        if (playbackMethod === 'loop' || playbackMethod === 'repeat') {
            var prevIndex = currentMusicInfo.currentIndex - 1;
            if (prevIndex === -1) {
                prevIndex = musicList.length - 1;
            }
            switchToMusic(prevIndex);
        } else if (playbackMethod === 'sequence') {
            //顺序播放：已到列表头不再环绕，重播当前曲
            if (currentMusicInfo.currentIndex > 0) {
                switchToMusic(currentMusicInfo.currentIndex - 1);
            }
        } else if (playbackMethod === 'random') {
            //随机播放：沿历史栈回退到刚才那首，栈空则重播当前曲
            if (randomHistoryRef.current.length > 0) {
                switchToMusic(randomHistoryRef.current.pop()!);
            }
        }
    }, [playbackMethod, currentMusicInfo, musicList, switchToMusic])

    //auto=true 表示自然播完（onended/大碟到点）：单曲循环下重播当前曲而非前进；手动切歌/热键/媒体通知仍前进
    const handleNextClick = React.useCallback((auto: boolean = false) => {
        if (musicList.length === 0) {
            return;
        }
        const audio = audioRef.current;
        if (playbackMethod === 'loop' || (playbackMethod === 'repeat' && !auto)) {
            var nextIndex = currentMusicInfo.currentIndex + 1;
            if (nextIndex === musicList.length) {
                nextIndex = 0;
            }
            switchToMusic(nextIndex);
        } else if (playbackMethod === 'sequence') {
            //顺序播放：到列表末尾不再回绕，自然播完即停（ended 后 onpause 会把按钮态置回播放）
            if (currentMusicInfo.currentIndex + 1 < musicList.length) {
                switchToMusic(currentMusicInfo.currentIndex + 1);
            } else if (auto && currentMusicInfo.isLargeTrackMusic) {
                //大碟整轨的末曲没有 onended 兜底（碟镜像后续还有别的曲目音频），到点须主动暂停；
                //进度留在末尾显示"已播完"，回碟内起点推迟到恢复播放时（见 handlePlayButtonClick）
                audio.pause();
            }
        } else if (playbackMethod === 'random') {
            //随机播放：纯随机索引（允许连播同曲），切曲前把当前下标压栈供上一曲回退
            randomHistoryRef.current.push(currentMusicInfo.currentIndex);
            switchToMusic(Math.floor(Math.random() * musicList.length));
        } else if (playbackMethod === 'repeat' && auto) {
            //单曲循环自然播完：不换源，回本曲起点重播；重置打点标记让每次重播都计入播放历史
            reportedMusicIdRef.current = 0;
            audio.currentTime = currentMusicInfo.isLargeTrackMusic ? (currentMusicInfo.discStartTime ?? 0) : 0;
            audio.play();
        }
    }, [playbackMethod, currentMusicInfo, musicList, switchToMusic])

    const handleProgressSeek = React.useCallback((newProgress: number) => {
        const audio = audioRef.current;
        // 空会话守卫：未加载曲目时进度条仍可交互（musicId 0、src 空），
        // 此时推送播放态会以空元数据拉起前台服务，直接忽略
        if (audio === null || currentMusicInfo.musicId === 0) {
            return;
        }
        var offset = currentMusicInfo.isLargeTrackMusic ? currentMusicInfo.discStartTime : 0;
        audio.currentTime = newProgress + offset;
        setCurrentTime(newProgress);
        //系统媒体通知：seek 后立即校准系统侧进度（持续播放中 onplay 不会再触发，等 5s 节流太慢）。
        //挂在 play() 之后：播放失败（流失效/URL 过期）时不误报播放中，并回推暂停态纠正快照
        audio.play()
            .then(() => mediaSession.updatePlaybackState({ playing: true, positionSec: newProgress, speed: 1 }))
            .catch(() => mediaSession.updatePlaybackState({ playing: false, positionSec: newProgress, speed: 0 }));
    }, [currentMusicInfo])

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
                //系统媒体通知：低频校准系统侧进度（系统按 speed 外推，5s 一次足够；
                //ontimeupdate 约 4Hz，直接透传会刷爆 bridge）
                if (!audio.paused) {
                    const relSec = relPositionSec(audio, currentMusicInfo);
                    if (Math.abs(relSec - lastSyncedPosRef.current) >= 5) {
                        lastSyncedPosRef.current = relSec;
                        void mediaSession.updatePlaybackState({ playing: true, positionSec: relSec, speed: 1 });
                    }
                }
                if (currentMusicInfo.isLargeTrackMusic && audio.currentTime > currentMusicInfo.discEndTime && audio.duration !== 0) {
                    handleNextClick(true);
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
                //系统媒体通知：播放态推送（进度为碟内相对位置）
                void mediaSession.updatePlaybackState({ playing: true, positionSec: relPositionSec(audio, currentMusicInfo), speed: 1 });
                //任务栏缩略图按钮：跟随实际播放态在 onplay/onpause 统一同步——切歌（switchToMusic）、单曲循环重播、
                //顺序播放播完自动停止等路径都不经 handlePlayButtonClick，放在那里会残留错误的按钮态
                if (window.electronAPI !== undefined) {
                    window.electronAPI.thumbnail.playing();
                }
            }

            audio.onpause = () => {
                setPlaying(false)
                setPlayBtnIcon(<PlayCircleFilled style={{ fontSize: 42 }} />)
                //系统媒体通知：暂停态推送
                void mediaSession.updatePlaybackState({ playing: false, positionSec: relPositionSec(audio, currentMusicInfo), speed: 0 });
                //任务栏缩略图按钮：暂停态同步（见 onplay）
                if (window.electronAPI !== undefined) {
                    window.electronAPI.thumbnail.paused();
                }
            }

            audio.onended = () => {
                console.log(currentMusicInfo);
                console.log(audio.duration);
                console.log(audio.currentTime)
                handleNextClick(true);
            }


            //更换播放列表消息的处理函数
            const changePlayList = (data: CustomEvent<IChangePlayListEvent>) => {
                //更换列表语境，随机模式历史栈里的旧下标全部失效
                randomHistoryRef.current = [];
                var index = data.detail.startIndex;
                var newMusic = data.detail.playlist[index]
                setMusicList(data.detail.playlist);
                setCurrentMusicInfo({ ...newMusic, currentIndex: index, currentQuality: newMusic.qualityOption[0] })
                document.title = `${newMusic.title} - HeiMusic!`;
                if (audioRef.current !== null) {
                    var audio = audioRef.current;
                    audio.src = nativeMediaUrl(newMusic.qualityOption[0].url);
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
                    // 先换源再定大碟起点：src 赋值触发 load() 会清掉已设的 currentTime
                    //（顺序须与 changePlayList/handleNextClick 一致，反了会从碟镜像 0:00 播放）
                    audio.src = nativeMediaUrl(newMusic.qualityOption[0].url);
                    reportedMusicIdRef.current = 0;
                    if (newMusic.isLargeTrackMusic) {
                        audio.currentTime = newMusic.discStartTime;
                    }
                    handlePlayButtonClick(true);
                }
            }

            //添加音乐到播放列表消息的处理函数
            const enqueue = (data: CustomEvent<IEnqueueEvent>) => {
                //入队会把已在列表中的曲目移到队尾、重排下标，历史栈清空
                randomHistoryRef.current = [];
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
                //当前曲之后插入会使后续下标漂移，历史栈清空
                randomHistoryRef.current = [];
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
                //next/play 必须包一层箭头函数：ipcRenderer.on 会把 IPC 事件对象透传为回调首参，truthy 的事件会被误判——
                //next 误判成 auto=true（单曲循环下热键下一曲变成重播当前曲），play 误判成 newList=true（跳过大碟末曲回起点）
                window.electronAPI.playback.next(() => handleNextClick());
                window.electronAPI.playback.prev(handlePrevClick);
                window.electronAPI.playback.play(() => handlePlayButtonClick());
            }

            //Android 系统媒体控制（通知栏/锁屏/耳机按键）反向控制播放器（与上面 electron 块并列）。
            //pause 直接暂停而非 toggle：系统按钮期望确定性结果，且 handlePlayButtonClick
            //的 1s 淡出窗口内二次指令会互相抵消；onpause 回调会同步按钮态与通知
            let unbindMediaSession: (() => void) | undefined;
            if (Capacitor.isNativePlatform()) {
                unbindMediaSession = mediaSession.bindActions((event) => {
                    switch (event.action) {
                        case "play":
                        case "toggle":
                            handlePlayButtonClick();
                            break;
                        case "pause":
                            audioRef.current?.pause();
                            break;
                        case "next":
                            handleNextClick();
                            break;
                        case "prev":
                            handlePrevClick();
                            break;
                        case "seekTo":
                            if (typeof event.positionMs === "number") {
                                handleProgressSeek(event.positionMs / 1000);
                            }
                            break;
                    }
                });
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
                if (unbindMediaSession !== undefined) {
                    unbindMediaSession();
                }

            }
        }

    }, [currentMusicInfo, musicList, playbackMethod, handlePlayButtonClick, handlePrevClick, handleNextClick, handleProgressSeek, setGlobalMusicInfo])

    // Android 系统媒体通知：曲目变化即推送元数据（musicId===0 为未播放占位态，跳过）。
    // 不并入主 useEffect：其依赖含 musicList/playbackMethod。依赖对象身份变化（收藏切换、
    // enqueue 重排）不重复推送——推送会使原生 metaSeq 自增，作废在途封面下载；顺带重置进度校准标记
    const lastMetaSignatureRef = React.useRef("");
    React.useEffect(() => {
        lastSyncedPosRef.current = 0;
        if (!Capacitor.isNativePlatform() || currentMusicInfo.musicId === 0) {
            return;
        }
        const signature = [
            currentMusicInfo.musicId, currentMusicInfo.title, currentMusicInfo.artists.join('/'),
            currentMusicInfo.albumTitle, currentMusicInfo.cover, currentMusicInfo.isLargeTrackMusic,
            currentMusicInfo.discStartTime, currentMusicInfo.discEndTime, currentMusicInfo.duration,
        ].join('|');
        if (signature === lastMetaSignatureRef.current) {
            return;
        }
        lastMetaSignatureRef.current = signature;
        void mediaSession.updateMetadata(currentMusicInfo);
    }, [currentMusicInfo])



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
                    {/* 播放模式：顺序播放为"不循环"中性色，其余循环态用主题色高亮 */}
                    <IconButton
                        sx={{ color: playbackMethod === 'sequence' ? theme.palette.text.primary : theme.palette.primary.main }}
                        onClick={handleLoopOptionClick}
                    >
                        {playbackMethod === 'loop' && <Repeat style={{ fontSize: 24 }} />}
                        {playbackMethod === 'sequence' && <PlaylistPlay style={{ fontSize: 24 }} />}
                        {playbackMethod === 'random' && <Shuffle style={{ fontSize: 24 }} />}
                        {playbackMethod === 'repeat' && <RepeatOne style={{ fontSize: 24 }} />}
                    </IconButton>
                    {/* 上一曲 */}
                    <IconButton sx={{ color: theme.palette.text.primary }} onClick={handlePrevClick} ><SkipPrevious style={{ fontSize: 34 }} /></IconButton>
                    {/* 播放 */}
                    <IconButton color="primary" onClick={() => { handlePlayButtonClick() }} >{playBtnIcon}</IconButton>
                    {/* 下一曲 */}
                    <IconButton sx={{ color: theme.palette.text.primary }} onClick={() => handleNextClick()} ><SkipNext style={{ fontSize: 34 }} /></IconButton>
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
                    <IconButton color="primary" onClick={() => { handlePlayButtonClick() }} >{playBtnIcon}</IconButton>
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
                playbackMethod={playbackMethod}
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