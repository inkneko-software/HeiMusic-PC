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

const testLyric = `[00:00.00]测试歌词测试歌词
[00:02.16]测试歌词
[00:02.39]测试歌词
[00:02.73]测试歌词测试歌词测试歌词
[00:05.19]测试歌词测试歌词测试歌词
[00:07.89]
[00:08.42]测试歌词
[00:15.39]
[00:24.87]测试歌词
[00:27.52]测试歌词
[00:30.19]测试歌词
[00:33.82]测试歌词
[00:35.48]测试歌词
[00:38.14]测试歌词
[00:40.83]测试歌词
[00:45.11]
[00:45.95]测试歌词
[00:50.30]测试歌词
[00:53.85]测试歌词
[00:56.69]测试歌词
[00:58.55]测试歌词
[01:01.14]测试歌词
[01:04.35]测试歌词
[01:06.88]测试歌词
[01:09.16]测试歌词
[01:11.80]测试歌词
[01:15.08]测试歌词
[01:16.38]测试歌词
[01:22.47]
[01:31.63]测试歌词
[01:34.13]测试歌词
[01:36.82]测试歌词
[01:40.58]测试歌词
[01:42.15]测试歌词
[01:44.85]测试歌词
[01:47.46]测试歌词
[01:51.56]
[01:52.54]测试歌词
[01:56.99]测试歌词
[02:00.56]测试歌词
[02:05.20]测试歌词
[02:07.83]测试歌词
[02:10.97]测试歌词
[02:13.69]测试歌词
[02:15.80]测试歌词测试歌词测试歌词测试歌词测试歌词
[02:18.45]测试歌词
[02:21.62]测试歌词
[02:28.70]
[02:38.34]测试歌词
[02:43.51]测试歌词
[02:47.25]测试歌词
[02:48.82]测试歌词
[02:53.32]测试歌词
[02:55.21]测试歌词
[03:01.83]
[03:05.15]测试歌词
[03:07.81]测试歌词
[03:10.81]测试歌词
[03:13.54]测试歌词
[03:15.96]测试歌词
[03:18.44]测试歌词
[03:21.67]测试歌词`

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
    setPlaylistOpen: (open: boolean) => void,
    handleRemoveFavoriteMusic: () => void,
    handleAddFavoriteMusic: () => void,
    duration: number,
    currentTime: number,
    handleProgressSeek: (newProgress: number) => void
}

interface LyricLine {
    startTime: number,
    duration: number,
    text: string
}

export default function FullScreenMusicPannel(props: IFullScreenMusicPannelProps) {
    const theme = useTheme();
    const [volumePanelOpen, setVolumePanelOpen] = React.useState(false);
    const volumeButtonRef = React.useRef(null);
    const [lyrics, setLyrics] = React.useState<LyricLine[]>([]);
    React.useEffect(() => {
        const regex = /\[(\d+):(\d+\.\d+)\](.*)/;
        const lyricLines: LyricLine[] = [];

        testLyric.split('\n')
            .map((line, i) => {
                var match = line.match(regex);
                var startTime = parseInt(match[1]) * 60 + parseFloat(match[2]);
                if (i !== 0) {
                    lyricLines[i - 1].duration = startTime - lyricLines[i - 1].startTime;
                }
                lyricLines.push({
                    startTime: startTime,
                    duration: 0,
                    text: match[3]
                })
            });

        lyricLines[lyricLines.length - 1].duration = props.duration - lyricLines[lyricLines.length - 1].startTime;
        setLyrics(lyricLines);
        console.log(lyricLines)
    }, [])


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

                    }} src={props.currentMusicInfo.cover || "/images/akari.jpg"} component="img"></CardMedia>
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
                            lyrics.map((lyric, i) => {
                                var currentLine = lyric.startTime <= props.currentTime && props.currentTime <= (lyric.startTime + lyric.duration);
                                return <Box component='p' key={i}>
                                    <Typography component='span'
                                        onAnimationStart={e => {
                                            e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            console.log('dick')
                                        }}
                                        sx={[{
                                            display: 'inline',
                                            textAlign: 'center',
                                            paddingTop: '12px',
                                            "rt": { fontSize: '12px' },

                                        },
                                        currentLine && {
                                            background: `linear-gradient(90deg, #3152ad 50%, ${theme.palette.text.primary} 50%)`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: '200%',
                                            backgroundClip: 'text',
                                            color: currentLine ? 'transparent' : theme.palette.text.primary,
                                            animation: `${lyric.duration}s linear 0s infinite normal lyric_progress`,
                                            animationPlayState: props.playing && currentLine ? 'running' : 'paused',
                                            '@keyframes lyric_progress': {
                                                '0%': {
                                                    backgroundPosition: '100%'
                                                },
                                                '100%': {
                                                    backgroundPosition: '0%'
                                                }
                                            }
                                        }]}>
                                        {lyric.text}
                                    </Typography>
                                </Box>
                            })
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
                        onMouseLeave={() => setVolumePanelOpen(false)}
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