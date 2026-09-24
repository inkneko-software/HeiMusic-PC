import { Box, Button, CardMedia, Dialog, IconButton, InputBase, TextField, Typography } from "@mui/material";
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import React from "react";
import { IMusicInfo, IPlayingMusicInfo } from "./MusicControlPannel";
import { useTheme } from "@mui/styles"

import MusicNote from "@mui/icons-material/MusicNote"
import SkipPrevious from "@mui/icons-material/SkipPreviousRounded"
import SkipNext from "@mui/icons-material/SkipNextRounded"
import QueueMusic from "@mui/icons-material/QueueMusicRounded"
import VolumeDown from "@mui/icons-material/VolumeDownRounded"
import VolumeOff from "@mui/icons-material/VolumeOff"
import Repeat from "@mui/icons-material/RepeatRounded"
import RepeatOne from "@mui/icons-material/RepeatOne"
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import MusicSlider from "./MusicSlider"
import VolumePannel from "./VolumePannel"
import ScrollableTypography from "@components/Common/ScrollableTypography"
import PlayList from "./PlayList"
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import { LyricControllerService } from "@api/codegen/services/LyricControllerService"
import type { LyricVo } from "@api/codegen/models/LyricVo"

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export interface IFullScreenMusicPannelProps {
    open: boolean,
    onClose: () => void,
    currentMusicInfo: IPlayingMusicInfo,
    timeLabel: string,
    playing: boolean,
    handleLoopOptionClick: () => void,
    handlePrevClick: () => void,
    handlePlayButtonClick: () => void,
    playBtnIcon: any,
    handleNextClick: () => void,
    volume: number,
    handleVolumeChange: (newVolume: number) => void,
    handleVolumePanelClose: () => void,
    setPlaylistOpen: (open: boolean) => void,
    handleRemoveFavoriteMusic: () => void,
    handleAddFavoriteMusic: () => void,
    duration: number,
    currentTime: number,
    handleProgressSeek: (newProgress: number) => void
}

interface LyricLine {
    startTime: number,
    text: string
}

//解析逐行时间标签 [mm:ss.xx]（兼容毫秒精度与一行多标签）；
//lrc_a2/qrc 正文中逐字标签 <mm:ss.xx> 一并剔除；无时间标签的行（元信息等）跳过
function parseTimedLyric(content: string): LyricLine[] {
    const timeTagRegex = /\[(\d+):(\d+(?:\.\d+)?)\]/g;
    const lyricLines: LyricLine[] = [];
    content.split(/\r?\n/).forEach(line => {
        timeTagRegex.lastIndex = 0;
        const times: number[] = [];
        let match: RegExpExecArray | null;
        while ((match = timeTagRegex.exec(line)) !== null) {
            times.push(parseInt(match[1]) * 60 + parseFloat(match[2]));
        }
        if (times.length === 0) {
            return;
        }
        const text = line.replace(timeTagRegex, '').replace(/<\d+:\d+(?:\.\d+)?>/g, '').trim();
        times.forEach(startTime => lyricLines.push({ startTime, text }));
    });
    return lyricLines.sort((a, b) => a.startTime - b.startTime);
}

//歌词选择：用户语言精确匹配 > 语言主子标签匹配 > 后端标记的默认歌词 > 第一份
function selectLyric(list: LyricVo[]): LyricVo | null {
    if (list.length === 0) {
        return null;
    }
    const userLocale = (navigator.language || '').toLowerCase();
    const userPrimary = userLocale.split('-')[0];
    return list.find(l => l.locale === userLocale)
        ?? list.find(l => l.locale?.split('-')[0] === userPrimary)
        ?? list.find(l => l.isDefault)
        ?? list[0];
}

export default function FullScreenMusicPannel(props: IFullScreenMusicPannelProps) {
    const theme = useTheme();
    const [volumePanelOpen, setVolumePanelOpen] = React.useState(false);
    const volumeButtonRef = React.useRef(null);
    const [lyricVo, setLyricVo] = React.useState<LyricVo | null>(null);
    const [lyricStatus, setLyricStatus] = React.useState<'loading' | 'loaded' | 'empty'>('empty');

    const musicId = props.currentMusicInfo.musicId;
    const isInstrumental = props.currentMusicInfo.isInstrumental === true;

    //切歌拉取歌词；纯音乐（isInstrumental === true）不请求
    React.useEffect(() => {
        setLyricVo(null);
        if (musicId === 0 || isInstrumental) {
            setLyricStatus('empty');
            return;
        }
        let cancelled = false;
        setLyricStatus('loading');
        LyricControllerService.getList(musicId)
            .then(res => {
                if (cancelled) {
                    return;
                }
                const selected = selectLyric(res.data ?? []);
                setLyricVo(selected);
                setLyricStatus(selected ? 'loaded' : 'empty');
            })
            .catch(error => {
                //歌词缺失/加载失败在歌词页静默展示占位，不打断播放
                console.error('歌词加载失败', error);
                if (!cancelled) {
                    setLyricStatus('empty');
                }
            });
        return () => {
            cancelled = true;
        };
    }, [musicId, isInstrumental])

    //format 为自由字符串：text 直接按纯文本展示；其余按时间标签解析，解析失败回落纯文本
    const parsedLyric = React.useMemo(() => {
        if (lyricVo?.content === undefined || lyricVo.content === '') {
            return null;
        }
        if (lyricVo.format !== 'text') {
            const lines = parseTimedLyric(lyricVo.content);
            if (lines.length > 0) {
                return { mode: 'timed' as const, lines };
            }
        }
        return { mode: 'text' as const, lines: lyricVo.content.split(/\r?\n/) };
    }, [lyricVo])


    return (
        <Dialog
            fullScreen
            open={props.open}
            onClose={props.onClose}
            TransitionComponent={Transition}
            sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}
        >
            {/* 状态栏 */}
            <Box sx={{ margin: '0px 24px', height: '64px', WebkitAppRegion: 'drag', userSelect: 'none', flex: '0 0 auto' }}>
                <IconButton onClick={props.onClose} sx={{ WebkitAppRegion: 'no-drag' }}><ExpandMoreOutlinedIcon sx={{ fontSize: '32px' }} /></IconButton>
            </Box>
            {/* 中部 */}
            <Box sx={{ display: 'flex', flex: '1 1 auto', paddingTop: '36px', height: 'calc(100% - 64px - 64px - 4px - 36px)' }}>
                {/* 左侧封面 */}
                <Box sx={{ width: '50%', display: 'flex', userSelect: 'none' }}>
                    <CardMedia sx={{
                        margin: "auto auto",
                        maxWidth: "190px",
                        aspectRatio: '1 / 1',
                        borderRadius: '100%',
                        border: '24px black solid',
                        flex: "0 0 auto",
                        imageRendering: "auto",
                        objectFit: "contain",
                        animation: '10s linear 0s infinite normal rotate_cover',
                        animationPlayState: props.playing ? 'running' : 'paused',
                        '@keyframes rotate_cover': {
                            'from': {

                            },
                            'to': {
                                transform: 'rotate(1turn)'
                            }
                        }

                    }} src={props.currentMusicInfo.cover ? props.currentMusicInfo.cover + "?s=@w300h300" : "/images/lxh_sign_400x400.png"} component="img"></CardMedia>
                </Box>
                {/* 右侧音乐信息 */}
                <Box sx={{
                    width: '50%',
                    maxHeight: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: "360px",
                    textAlign: 'center',
                    margin: 'auto auto',
                    marginLeft: '24px'
                }}>
                    <Typography fontWeight={600} variant='h5' sx={{ flexShrink: '0', '@media(max-width: 600px)': { fontSize: "1em" } }} noWrap title={props.currentMusicInfo.title} >{props.currentMusicInfo.title}</Typography>
                    <Typography variant='caption' noWrap sx={{ flexShrink: '0', marginTop: '24px', color: theme.palette.text.secondary }} >{`艺术家：${props.currentMusicInfo.artists.join(" / ")}`}</Typography>
                    <Typography variant='caption' noWrap sx={{ flexShrink: '0', color: theme.palette.text.secondary }} >{`专辑：${props.currentMusicInfo.albumTitle}`}</Typography>
                    <Box sx={{ flex: '1 1 auto', marginTop: '24px', marginBottom: '24px', overflow: 'auto', display: 'flex', flexDirection: 'column', '::-webkit-scrollbar': { display: 'none' } }}>
                        {
                            (isInstrumental || lyricStatus !== 'loaded' || parsedLyric === null) &&
                            <Typography sx={{ margin: 'auto', color: theme.palette.text.secondary }} variant='body2'>
                                {isInstrumental ? '纯音乐' : lyricStatus === 'loading' ? '歌词加载中…' : '暂无歌词'}
                            </Typography>
                        }
                        {
                            !isInstrumental && lyricStatus === 'loaded' && parsedLyric !== null && parsedLyric.mode === 'timed' &&
                            parsedLyric.lines.map((lyric, i) => {
                                //末行持续到歌曲结束；props.duration 未就绪时兜底 5 秒
                                const lineEnd = i + 1 < parsedLyric.lines.length
                                    ? parsedLyric.lines[i + 1].startTime
                                    : Math.max(props.duration, lyric.startTime + 5);
                                var currentLine = lyric.startTime <= props.currentTime && props.currentTime <= lineEnd;
                                // 高亮行不用 background-clip:text：非默认 clip 会让文本退化为灰度抗锯齿，暗色背景下笔画显细（无官方修复）。
                                // 改为双层叠加：底层整行已唱色，顶层未唱色以 clip-path 从左向右收缩。深色在下浅色在上——
                                // 若浅色在底，会从顶层抗锯齿边缘透出形成白色重影。
                                // 顶层结构：外层整行宽定位壳负责与底层对齐；clip-path 动画在内层收缩为文本宽的 span 上，
                                // 百分比按文本宽解析——若按整行宽解析，扫过分界需先越过文本左侧的居中留白，起扫会有可感知延迟。
                                return <Box component='p' key={i} sx={{ position: 'relative' }}>
                                    <Typography component='span'
                                        sx={{
                                            display: 'inline',
                                            textAlign: 'center',
                                            paddingTop: '12px',
                                            color: currentLine ? '#3152ad' : theme.palette.text.primary,
                                            "rt": { fontSize: '12px' },
                                        }}>
                                        {lyric.text}
                                    </Typography>
                                    {
                                        currentLine &&
                                        <Typography component='span' aria-hidden sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            display: 'block',
                                            textAlign: 'center',
                                            color: theme.palette.text.primary,
                                            userSelect: 'none',
                                            pointerEvents: 'none',
                                            "rt": { fontSize: '12px' },
                                        }}>
                                            <Typography component='span'
                                                onAnimationStart={e => {
                                                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }}
                                                sx={{
                                                    display: 'inline-block',
                                                    // 播一遍停在终点而非 infinite 循环：动画因 currentTime 观测滞后晚启动，
                                                    // 若循环重置会在行尾 currentLine 翻转前闪一次"从头重扫"
                                                    animation: `${lineEnd - lyric.startTime}s linear 0s 1 forwards lyric_progress`,
                                                    animationPlayState: props.playing && currentLine ? 'running' : 'paused',
                                                    '@keyframes lyric_progress': {
                                                        '0%': { clipPath: 'inset(0 0 0 0)' },
                                                        '100%': { clipPath: 'inset(0 0 0 100%)' }
                                                    }
                                                }}>
                                                {lyric.text}
                                            </Typography>
                                        </Typography>
                                    }
                                </Box>
                            })
                        }
                        {
                            !isInstrumental && lyricStatus === 'loaded' && parsedLyric !== null && parsedLyric.mode === 'text' &&
                            parsedLyric.lines.map((line, i) =>
                                <Typography key={i} sx={{ textAlign: 'center', paddingTop: '12px', color: theme.palette.text.primary }} variant='body1'>
                                    {line}
                                </Typography>
                            )
                        }

                    </Box>
                </Box>

            </Box>
            {/* 进度条 */}
            <MusicSlider sx={{ margin: '0px 24px', width: 'unset' }} size="small" max={props.duration} value={props.currentTime} onChangeCommitted={(event, value: number) => props.handleProgressSeek(value)} />
            {/* 控制面板 */}
            <Box sx={{ margin: '0px 24px', height: '64px', flex: '0 0 auto', display: 'flex' }}>
                <Box sx={{ margin: 'auto auto', marginLeft: '0px', flex: "1 0 auto", width: "30%", }}>
                    {
                        props.currentMusicInfo.isFavorite && <Button size="small" sx={{ padding: "0px 0px", width: "20px", height: "20px", minWidth: "unset" }} color="error" onClick={props.handleRemoveFavoriteMusic} ><FavoriteOutlinedIcon sx={{ width: "18px", height: "18px" }} /></Button>
                    }
                    {
                        !props.currentMusicInfo.isFavorite && <Button size="small" sx={{ padding: "0px 0px", width: "20px", height: "20px", minWidth: "unset" }} color="error" onClick={props.handleAddFavoriteMusic}><FavoriteBorderOutlinedIcon sx={{ width: "18px", height: "18px" }} /></Button>
                    }
                </Box>
                <Box sx={{ flexGrow: "2", margin: "auto auto", textAlign: "center", '@media(max-width:600px)': { display: 'none' } }} >
                    <IconButton size="small" sx={{ color: theme.palette.text.primary }} onClick={props.handleLoopOptionClick}><Repeat sx={{ fontSize: "20px" }} /></IconButton>
                    <IconButton size="small" sx={{ color: theme.palette.text.primary }} onClick={props.handlePrevClick} ><SkipPrevious sx={{ fontSize: "32px" }} /></IconButton>
                    <IconButton size="small" color="primary" onClick={() => { props.handlePlayButtonClick() }} >{props.playBtnIcon}</IconButton>
                    <IconButton size="small" sx={{ color: theme.palette.text.primary }} onClick={props.handleNextClick} ><SkipNext sx={{ fontSize: "32px" }} /></IconButton>
                    <VolumePannel
                        open={volumePanelOpen}
                        value={props.volume}
                        onChange={(event, value: number) => props.handleVolumeChange(value)}
                        onMouseEnter={() => setVolumePanelOpen(true)}
                        onMouseLeave={props.handleVolumePanelClose}
                        anchorEl={volumeButtonRef.current}
                    />
                    <IconButton
                        ref={volumeButtonRef}
                        size="small"
                        sx={{ color: theme.palette.text.primary }}
                        onMouseEnter={() => setVolumePanelOpen(true)}
                        onMouseLeave={() => setVolumePanelOpen(false)}
                    >
                        <VolumeDown />
                    </IconButton>

                </Box>
                <Box sx={{ flexGrow: "1", margin: "auto 12px auto auto", textAlign: "center", '@media(min-width:600px)': { display: 'none' } }}>
                    <IconButton color="primary" onClick={() => { props.handlePlayButtonClick() }} >{props.playBtnIcon}</IconButton>
                    <IconButton sx={{ margin: "auto 8px auto 0px" }} onClick={() => props.setPlaylistOpen(true)}><QueueMusic /></IconButton>
                </Box>
                <Box sx={{ flex: "1 0 auto", width: "30%", margin: "auto 0px", textAlign: "right", display: "flex", '@media(max-width:600px)': { display: 'none' } }}>
                    <Typography sx={{ margin: "auto 12px auto 0px", flexGrow: "1", userSelect: "none", color: theme.palette.text.secondary }} variant="subtitle2">{props.timeLabel}</Typography>
                    <Button sx={[props.currentMusicInfo.currentQuality.name === null && { display: 'none' }, { color: props.currentMusicInfo.currentQuality.color, border: `1px solid ${props.currentMusicInfo.currentQuality.color}`, padding: '0px 0px', margin: 'auto 8px auto 0px', minWidth: '32px', minHeight: '0px', lineHeight: 'normal' }]} size='small' >{props.currentMusicInfo.currentQuality.name}</Button>
                    <IconButton sx={{ margin: "auto 0px", padding: "0px 0px" }} onClick={() => props.setPlaylistOpen(true)}><QueueMusic /></IconButton>
                </Box>
            </Box>
        </Dialog>
    )
}