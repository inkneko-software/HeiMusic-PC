import React from 'react'
import Box from '@mui/material/Box'
import CardMedia from '@mui/material/CardMedia';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
// import Link from '../components/Common/Link';
import Link from 'next/link';
import MuiLink from '@mui/material/Link';
import useToast from '../components/Common/Toast';
import { AlbumControllerService, AlbumVo, ApiError, MusicVo, PlaylistControllerService } from '../api/codegen';
import { useTheme } from '@mui/styles'
import { IconButton } from '@mui/material';
import SkipNext from "@mui/icons-material/SkipNext"
import PlayCircleFilled from "@mui/icons-material/PlayCircleFilled"
import PauseCircleFilled from "@mui/icons-material/PauseCircleFilled"
import { IChangePlayListEvent } from '@components/MusicControlPannel/MusicControlPannel';
import { useRouter } from 'next/router';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';

interface IAlbumCard {
    album: AlbumVo
}

function AlbumCard(props: IAlbumCard) {
    const imgRef = React.useRef<HTMLImageElement>(null);
    const gridRef = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = React.useState(0);
    const [loaded, setLoaded] = React.useState(false)

    // React.useEffect(() => {
    //     if (gridRef.current !== null) {
    //         setWidth(gridRef.current.clientWidth - 24)
    //         // 性能过低
    //         const observer = new ResizeObserver(()=>{
    //             setWidth(gridRef.current.clientWidth - 24)
    //             console.log(gridRef.current.clientWidth - 24)
    //         });
    //         observer.observe(gridRef.current)
    //         return ()=>{
    //             observer.disconnect();
    //         }
    //     }
    // }, [gridRef])

    React.useEffect(() => {
        if (imgRef.current !== null) {
            if (props.album.frontCoverUrl === null) {
                imgRef.current.src = '/images/akari.jpg';
                setLoaded(true);
                return;
            }

            new Promise<void>((resolve, reject) => {
                imgRef.current.onload = () => resolve()
                imgRef.current.src = props.album.frontCoverUrl + '?s=@w256h256';
                imgRef.current.onerror = reject;
            }).then(() => {
                setLoaded(true);
            })
        }
    }, [imgRef.current]);
    return (

        <Link href={`/album/${props.album.albumId}`}>
            <Grid ref={gridRef} item xs={3} sx={{ display: 'flex', flexDirection: 'column', flexShrink: '0' }}>
                <Box sx={[{ borderRadius: '6%', display: 'flex', aspectRatio: '1 / 1' }, loaded && { display: 'none' },]}>
                    <Skeleton variant='rounded' sx={[{ width: '100%', height: '100%' }]} />
                </Box>
                <Box sx={[{ borderRadius: '6px', aspectRatio: '1 / 1', display: 'flex', overflow: 'hidden' }, !loaded && { display: 'none' },]}>
                    <CardMedia ref={imgRef} sx={[{ margin: 'auto auto', objectFit: 'contain' }]} component='img' ></CardMedia>
                </Box>

                <Typography
                    variant='subtitle2'
                    sx={{
                        marginTop: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        '-webkit-box-orient': 'vertical',
                        '-webkit-line-clamp': '2',
                        lineHeight: '1.5em',
                        maxHeight: '3em',
                    }} >{props.album.title}</Typography>

            </Grid>
        </Link>

    )
}

function Home() {
    const theme = useTheme();
    const router = useRouter();

    const [firstLaunch, setFirstLaunch] = React.useState(false);
    const [newUploadList, setNewUploadList] = React.useState([]);
    const [Toast, makeToast] = useToast()
    const [recentUploadAlbum, setRecentUploadAlbum] = React.useState<AlbumVo[]>([]);

    //随机音乐
    const [randomMusic, setRandomMusic] = React.useState<MusicVo>(undefined);
    //每日30首封面
    const [daily30Cover, setDaily30Cover] = React.useState(undefined);
    React.useEffect(() => {
        AlbumControllerService.getRecentUpload(1, 12)
            .then(res => {
                setRecentUploadAlbum(res.data)
                if (res.data.length === 0) {
                    setFirstLaunch(true);
                }
            })
            .catch(error => {
                makeToast('网络连接失败', 'error', 'bottom-left')
            })

        AlbumControllerService.randomMusic()
            .then(res => {
                setRandomMusic(res.data)
            })
            .catch((error: ApiError) => {
                if (error.status !== 403) {
                    makeToast(error.message, "error", "bottom-left");
                }
            })

        AlbumControllerService.daily30()
            .then(res => {
                setDaily30Cover(res.data[0].albumCoverUrl);
            })
            .catch((error: ApiError) => {
                if (error.status !== 403) {
                    makeToast(error.message, "error", "bottom-left");
                }
            })


    }, [])

    const handlePlayRandomMusic = () => {

        var event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
            detail: {
                playlist: [{
                    musicId: randomMusic.musicId,
                    title: randomMusic.title,
                    artists: randomMusic.artistList.map(artist => artist.name),
                    albumId: randomMusic.albumId,
                    albumTitle: randomMusic.albumTitle,
                    cover: randomMusic.albumCoverUrl,
                    isFavorite: randomMusic.isFavorite,
                    duration: randomMusic.duration,
                    qualityOption: [{
                        name: "SQ",
                        url: randomMusic.resourceUrl,
                        color: "red"
                    }],
                }], startIndex: 0
            }
        });
        document.dispatchEvent(event)
    }

    const handleNextRandomMusic = () => {
        AlbumControllerService.randomMusic()
            .then(res => {
                var newRandomMusic = res.data;
                setRandomMusic(newRandomMusic)
                var event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
                    detail: {
                        playlist: [{
                            musicId: newRandomMusic.musicId,
                            title: newRandomMusic.title,
                            artists: newRandomMusic.artistList.map(artist => artist.name),
                            albumId: newRandomMusic.albumId,
                            albumTitle: newRandomMusic.albumTitle,
                            cover: newRandomMusic.albumCoverUrl,
                            isFavorite: newRandomMusic.isFavorite,
                            duration: newRandomMusic.duration,
                            qualityOption: [{
                                name: "SQ",
                                url: newRandomMusic.resourceUrl,
                                color: "red"
                            }],
                        }], startIndex: 0
                    }
                });
                document.dispatchEvent(event)
            })
            .catch((error: ApiError) => {
                if (error.status !== 403) {
                    makeToast(error.message, "error", "bottom-left");
                }
            })

    }

    const handleFavorite = () => {
        if (randomMusic.isFavorite){
            PlaylistControllerService.removeMusicFavorite(randomMusic.musicId)
            .then(res => {
                setRandomMusic(prev=>({...prev, isFavorite: !prev.isFavorite}))
            })
            .catch((error) => {
                makeToast(error.message, "error", "bottom-left");
            })
        }else{
            PlaylistControllerService.addMusicFavorite(randomMusic.musicId)
            .then(res => {
                setRandomMusic(prev=>({...prev, isFavorite: !prev.isFavorite}))
            })
            .catch((error) => {
                makeToast(error.message, "error", "bottom-left");
            })
        }
        
    }

    return (
        <Box sx={{ width: '100%', height: '100%', padding: '12px 12px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {Toast}
            {/* <Box>
                <Typography variant='h5' sx={{ marginBottom: '12px' }}>热门歌单</Typography>
                <Grid container spacing={3} sx={{ display: 'flex', justifyContent: 'space-between', }} columns={{ xs: 12, lg: 15, xl: 18 }} >
                    {
                        [1, 2, 3, 4, 5, 6, 7, 8, 9].map((val, index) => {
                            return <AlbumCard key={index} album={{albumId: 0}} />
                        })
                    }
                </Grid>
            </Box> */}
            <Box sx={[{ display: 'none' }, firstLaunch && { display: 'flex', flexDirection: 'column' }]}>
                <Typography sx={{ marginBottom: '24px', userSelect: 'none' }}>欢迎使用HeiMusic!</Typography>
                <Typography sx={{ marginBottom: '24px', userSelect: 'none' }}>第一次使用请设置<Link href='/init'><MuiLink>管理账户</MuiLink></Link></Typography>
                <Typography sx={{ marginBottom: '24px', userSelect: 'none' }}>设置完成后，可通过左侧专辑管理按钮进行音乐导入</Typography>
            </Box>
            <Box sx={[{ display: 'flex', flexDirection: 'column' }, firstLaunch && { display: 'none' }]}>
                {/* 推荐 */}
                <Typography variant='h5' sx={{ marginBottom: '12px' }}>推荐</Typography>
                <Grid container spacing={3} sx={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px', userSelect: 'none' }} columns={{ xs: 12, lg: 15, xl: 18 }} >
                    {/* 随机推荐 */}
                    <Grid item xs={6} lg={9} xl={9} sx={{ aspectRatio: { xs: "2 / 1", lg: "3 / 1", xl: "3 / 1" } }}>
                        <Box sx={{ position: 'relative', backgroundColor: 'aqua', width: '100%', height: '100%', display: 'flex', borderRadius: '12px', overflow: 'hidden' }}>
                            {/* 背景和文本 */}
                            <Box sx={{ position: 'absolute', top: '0px', left: '0px', boxShadow: 'inset 0px 95px 280px -106px black', width: '100%', height: '100%' }}>
                                <Typography variant='h5' fontWeight={600} sx={{ position: 'absolute', top: '6px', left: '18px', color: '#e3e3e3', zIndex: 1 }}>
                                    For
                                    <br />
                                    You
                                </Typography>
                            </Box>
                            {/* 封面预览 */}
                            {
                                randomMusic &&
                                <Box sx={{ margin: '24px 18px 24px 36px', height: 'calc(100% - 24px - 24px)', aspectRatio: '1 / 1', position: 'relative', ':hover .random-music-playback-btn': { display: 'flex', background: 'rgba(0,0,0,0.5)' } }}>
                                    <CardMedia className="random-music-cover" sx={[{ position: 'absolute', top: 0, left: 0, objectFit: 'contain', height: '100%', width: 'unset', aspectRatio: '1 / 1', borderRadius: '6px' }]} component='img' src={randomMusic.albumCoverUrl || "/images/akari.jpg"} >

                                    </CardMedia>
                                    <Box className="random-music-playback-btn" sx={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 'unset', aspectRatio: '1 / 1', display: 'none', borderRadius: '6px' }}>
                                        <IconButton
                                            disableRipple
                                            sx={{ height: '100%', width: '100%', color: '#ffffff' }}
                                            onClick={handlePlayRandomMusic}
                                        >
                                            <PlayCircleFilled />
                                        </IconButton>
                                    </Box>
                                </Box>

                            }
                            {/* 音乐信息与操作 */}
                            {
                                randomMusic &&
                                <Box sx={{ display: 'flex', flexDirection: 'column', margin: 'auto auto auto 0px', zIndex: '1' }}>
                                    <Typography sx={{ color: '#ffffff' }}>{randomMusic.title}</Typography>
                                    <Typography variant='body2' sx={{ color: '#e3e3e3' }}>{randomMusic.artistList.map(artist => artist.name).join('/')}</Typography>
                                    <Box sx={{ marginLeft: '-4px' }}>
                                        <IconButton disableRipple sx={{ padding: '0px 0px', color: '#ffffff' }} onClick={handleNextRandomMusic}><SkipNext sx={{ fontSize: '1.5em' }} /></IconButton>
                                        <IconButton sx={{ padding: '0px 0px', color: '#ffffff' }} onClick={handleFavorite}>{randomMusic.isFavorite ? <FavoriteOutlinedIcon /> : <FavoriteBorderOutlinedIcon />}</IconButton>

                                    </Box>
                                </Box>
                            }
                        </Box>
                        <Typography
                            variant='subtitle2'
                            sx={{
                                marginTop: '6px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                '-webkit-box-orient': 'vertical',
                                '-webkit-line-clamp': '2',
                                lineHeight: '1.5em',
                                maxHeight: '3em',
                            }} >猜你喜欢</Typography>
                    </Grid>
                    {/* 每日30首 */}
                    <Grid item xs={3} sx={{ display: 'flex', flexDirection: 'column', flexShrink: '0' }} onClick={() => { router.push("/daily30") }}>
                        <Box sx={[{ borderRadius: '6px', aspectRatio: '1 / 1', display: 'flex', overflow: 'hidden', position: 'relative' }]}>
                            <CardMedia sx={[{ margin: 'auto auto', objectFit: 'contain' }]} component='img' src={daily30Cover || "/images/akari.jpg"} ></CardMedia>
                            <Box sx={{ position: 'absolute', top: '0px', left: '0px', boxShadow: 'inset 0px 95px 280px -106px black', width: '100%', height: '100%' }}>
                                <Typography variant='h5' fontWeight={600} sx={{ position: 'absolute', top: '6px', left: '18px', color: '#e3e3e3' }}>
                                    Daily
                                    <br />
                                    30
                                </Typography>
                            </Box>
                        </Box>
                        <Typography
                            variant='subtitle2'
                            sx={{
                                marginTop: '6px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                '-webkit-box-orient': 'vertical',
                                '-webkit-line-clamp': '2',
                                lineHeight: '1.5em',
                                maxHeight: '3em',
                            }} >每日30首</Typography>
                    </Grid>
                    {/* 热门歌单 */}
                    <Grid item xs={3} sx={{ display: 'flex', flexDirection: 'column', flexShrink: '0' }}>
                        <Box sx={[{ borderRadius: '6px', aspectRatio: '1 / 1', display: 'flex', overflow: 'hidden', position: 'relative' }]}>
                            <CardMedia sx={[{ margin: 'auto auto', objectFit: 'contain' }]} component='img' src='/images/akari.jpg' ></CardMedia>
                            <Box sx={{ position: 'absolute', top: '0px', left: '0px', boxShadow: 'inset 0px 95px 280px -106px black', width: '100%', height: '100%' }}>
                                <Typography variant='h5' fontWeight={600} sx={{ position: 'absolute', top: '6px', left: '18px', color: '#e3e3e3' }}>
                                    Hot
                                </Typography>
                            </Box>
                        </Box>
                        <Typography
                            variant='subtitle2'
                            sx={{
                                marginTop: '6px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                '-webkit-box-orient': 'vertical',
                                '-webkit-line-clamp': '2',
                                lineHeight: '1.5em',
                                maxHeight: '3em',
                            }} >热门歌单</Typography>
                    </Grid>
                </Grid>
                {/* 最新上传 */}
                <Typography variant='h5' sx={{ marginBottom: '12px' }}>最新上传</Typography>
                <Typography sx={[recentUploadAlbum.length !== 0 && { display: 'none' }]}>暂无音乐</Typography>
                <Grid container spacing={3} sx={{ display: 'flex', justifyContent: 'flex-start' }} columns={{ xs: 12, lg: 15, xl: 18 }} >
                    {
                        recentUploadAlbum.map((album, index) => {
                            return <AlbumCard key={index} album={album} />
                        })
                    }
                </Grid>
            </Box>
        </Box>
    )
}

export default Home;