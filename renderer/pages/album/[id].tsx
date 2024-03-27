import Box from '@mui/material/Box'
import { BoxProps, CardMedia, Divider, IconButton, Popover, Stack, Typography, useTheme } from "@mui/material"

import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { useRouter } from 'next/router';

import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined';
import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import { IChangePlayListEvent, IEnqueueNextEvent, IMusicInfo, IMusicQuality } from '../../components/MusicControlPannel/MusicControlPannel';
import { AlbumControllerService, ArtistVo, PlaylistControllerService } from '../../api/codegen';
import { pushToast } from '@components/HeiMusicMainLayout';
import SpectrumIcon from '@components/Common/Icon/SpectrumIcon';
import { HeiMusicContext } from '../../lib/HeiMusicContext';

interface MusicAlbumProps extends BoxProps {

}

function MusicAlbum(props: MusicAlbumProps) {
    const heiMusicContext = React.useContext(HeiMusicContext)
    const router = useRouter()
    const theme = useTheme()
    const { id } = router.query
    const [albumInfo, setAlbumInfo] = React.useState({
        albumId: 0,
        title: "加载中...",
        artist: "",
        cover: "",
        date: undefined,
        listenedCount: 0,
    })
    const [playlist, setPlayList] = React.useState<IMusicInfo[]>([])
    const [showLargeAlbumInfo, setShowLargeAlbumInfo] = React.useState(true)

    //音乐右键菜单
    const [musicMenuOpen, setMusicMenuOpen] = React.useState(false);
    const [musicMenuPos, setMusicMenuPos] = React.useState({ top: 0, left: 0 })
    const [musicMenuInfo, setMusicMenuInfo] = React.useState({ albumTitle: "", albumId: 0, musicTitle: "", musicId: 0, index: 0, isFavorite: false })

    const containerRef = React.useRef<HTMLElement>();
    const albumInfoRef = React.useRef<HTMLElement>();

    React.useEffect(() => {
        if (typeof (id) !== "string") {
            return;
        }

        (async () => {
            var albumId = parseInt(id)
            var albumInfo = await AlbumControllerService.getAlbum(albumId)
                .then(res => {
                    //todo: status check
                    return res.data
                })

            var playlist = await AlbumControllerService.getAlbumMusicList(albumId)
                .then(res => {
                    //todo: status check
                    return res.data
                })

            setAlbumInfo({
                albumId: albumInfo.albumId,
                title: albumInfo.title,
                artist: albumInfo.artistList.map((artist, index) => { return artist.name }).join(" / "),
                cover: albumInfo.frontCoverUrl,
                date: undefined,
                listenedCount: 0,
            })

            setPlayList(playlist.map((music, index) => {
                return {
                    musicId: music.musicId,
                    title: music.title,
                    artists: music.artistList.map(val => val.name),
                    discStartTime: parseFloat(music.discStartTime),
                    discEndTime: parseFloat(music.discEndTime),
                    qualityOption: [{
                        name: "SQ",
                        url: music.resourceUrl,
                        color: "red"
                    }],
                    albumId: albumInfo.albumId,
                    albumTitle: albumInfo.title,
                    cover: albumInfo.frontCoverUrl,
                    duration: music.duration,
                    isFavorite: music.isFavorite,
                    isLargeTrackMusic: music.discStartTime !== ''
                }
            }))
        })()

    }, [id])

    React.useEffect(() => {
        if (containerRef.current !== null && albumInfoRef.current !== null) {
            var container = containerRef.current;
            var albumInfo = albumInfoRef.current;
            container.onscroll = () => {
                if (container.scrollTop > albumInfo.clientHeight + albumInfo.offsetTop) {
                    setShowLargeAlbumInfo(false)
                } else {
                    setShowLargeAlbumInfo(true)
                }
            }

            return () => {
                container.onscroll = null;
            }
        }
    }, [containerRef, albumInfoRef])

    const handlePlayAll = () => {
        if (playlist.length !== 0) {
            const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
                detail: {
                    playlist: playlist,
                    startIndex: 0
                }
            });
            document.dispatchEvent(event)
        }
    }

    const timePretty = (time: number) => {
        return `${Math.floor(time / 60).toString().padStart(2, "0")}:${Math.floor(time % 60).toString().padStart(2, "0")}`
    }

    const handleAddFavoriteMusic = (musicId: number) => {
        PlaylistControllerService.addMusicFavorite(musicId)
            .then(res => {
                setPlayList(prev => prev.map(music => {
                    if (music.musicId === musicId) {
                        music.isFavorite = true;
                    }
                    return music;
                }))
            })
            .catch((error) => {
                pushToast(error.message)
            })
    }

    const handleRemoveFavoriteMusic = (musicId: number) => {
        PlaylistControllerService.removeMusicFavorite(musicId)
            .then(res => {
                setPlayList(prev => prev.map(music => {
                    if (music.musicId === musicId) {
                        music.isFavorite = false;
                    }
                    return music;
                }))
            })
            .catch((error) => {
                pushToast(error.message)
            })
    }

    const handleContextMenuPlay = () => {
        const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
            detail: {
                playlist: playlist,
                startIndex: musicMenuInfo.index
            }
        });
        document.dispatchEvent(event)
    }

    const handleContextMenuPlayNext = () => {
        const event = new CustomEvent<IEnqueueNextEvent>("music-control-panel::enqueueNext", {
            detail: {
                musicList: [playlist[musicMenuInfo.index]]
            }
        });
        document.dispatchEvent(event)
    }

    return (
        <Box sx={{ height: '100%', width: '100%', overflowY: "auto" }} ref={containerRef}>
            {/* 专辑信息 */}
            <Box sx={{
                marginTop: '20px',
                width: "auto",
                padding: "0px 12px 10px 12px",
                display: 'flex',
            }}
                ref={albumInfoRef}
            >
                <CardMedia sx={{
                    width: '160px', height: '160px', borderRadius: '6%', flex: "0 0 auto", imageRendering: "auto", border: "1px solid #e3e3e3", objectFit: "contain",
                    '@media(max-width: 600px)': { width: '80px', height: '80px' }
                }} src={albumInfo.cover || "/images/akari.jpg"} component="img"></CardMedia>
                {/* <MusicNote sx={{
                    width: '180px', height: '180px', borderRadius: '6%', flex: "0 0 auto",  border: "1px solid #e3e3e3", fontSize: 72 
                }}  /> */}
                <Box sx={{
                    marginLeft: '20px',
                    marginRight: '20px',
                    width: "auto",
                    overflow: "hidden",
                    flex: "1 1 auto",
                    display: 'flex',
                    flexDirection: 'column',

                }}>
                    <Typography fontWeight={600} variant='h5' sx={{ '@media(max-width: 600px)': { fontSize: "1em" } }} noWrap title={albumInfo.title} >{albumInfo.title}</Typography>
                    <Typography variant='body2' noWrap >{albumInfo.artist}</Typography>
                    {albumInfo.date ? <Typography variant='caption' noWrap >{albumInfo.date}</Typography> : null}
                    <Typography variant='caption' sx={{ marginTop: "12px" }} >{"播放量 " + albumInfo.listenedCount}</Typography>
                    <Box sx={{ marginTop: "auto", display: 'flex' }}>
                        <Button sx={{ marginRight: "16px" }} size='small' variant="contained" onClick={handlePlayAll} >播放全部</Button>
                        <Button sx={{ marginRight: "16px" }} size='small' variant="contained" onClick={handlePlayAll} >加入列表</Button>
                        <Button sx={{ marginRight: "16px" }} size='small' variant="outlined">下载</Button>
                    </Box>
                </Box>
            </Box>
            {/* 专辑信息Lite */}
            <Box sx={[
                {
                    marginTop: '20px',
                    display: 'flex',
                    height: "fit-content",
                    flexDirection: "column",
                    position: "sticky",
                    overflow: "hidden",
                    background: theme.palette.pannelBackground.light,
                    top: "0px",
                    zIndex: 10,
                    transition: "height .3s cubic-bezier(0.42, 1.0, 1.0, 1.0) 0s;"
                },
                showLargeAlbumInfo && {
                    visibility: "hidden",
                    height: "0px",
                }
            ]}>
                <Box sx={{ display: "flex", padding: "0px 12px 10px 12px", }}>
                    <CardMedia sx={{
                        width: '90px', height: '90px', borderRadius: '6%', flex: "0 0 auto", imageRendering: "auto", border: "1px solid #e3e3e3", objectFit: "contain"
                    }} src={albumInfo.cover || "/images/akari.jpg"} component="img"></CardMedia>
                    <Box sx={{
                        marginLeft: '20px',
                        width: "auto",
                        overflow: "hidden",
                        flex: '1',
                        display: 'flex',
                        flexFlow: 'column',
                    }}>
                        <Typography fontWeight={600} variant='h5' noWrap >{albumInfo.title}</Typography>

                        <Box sx={{ margin: "14px 0px", fontSize: "14px", color: "gray" }}>{"播放量 " + albumInfo.listenedCount}</Box>
                    </Box>
                    <Box sx={{ marginTop: "auto" }}>
                        <Button sx={{ width: "90px", height: "32px", marginRight: "30px" }} variant='contained'>播放全部</Button>
                        <Button className="album-brief-tool-bar-btn" variant='outlined'>下载</Button>
                    </Box>
                </Box>

                <TableContainer sx={{ width: "auto", padding: "0px 12px", }}>
                    <Table sx={{ tableLayout: "fixed", ".MuiTableCell-root": { padding: "0px 6px" } }}>
                        <TableHead>
                            <TableRow >
                                <TableCell style={{ width: "5%" }} sx={{ borderBottom: "unset" }}></TableCell>
                                <TableCell style={{ width: "45%" }} sx={{ borderBottom: "unset" }}>歌曲</TableCell>
                                <TableCell style={{ width: "40%" }} sx={{ borderBottom: "unset" }}>歌手</TableCell>
                                <TableCell style={{ width: "10%" }} sx={{ borderBottom: "unset" }}>时长</TableCell>
                            </TableRow>
                        </TableHead>
                    </Table>
                </TableContainer>
            </Box>
            {/* 音乐列表 */}
            <TableContainer sx={{ width: "auto", padding: "0px 12px", }}>
                <Table sx={{ tableLayout: "fixed", ".MuiTableCell-root": { padding: "14px 6px" } }}>
                    <TableHead>
                        <TableRow >
                            <TableCell style={{ width: "5%" }} sx={{ borderBottom: "unset" }}></TableCell>
                            <TableCell style={{ width: "45%" }} sx={{ borderBottom: "unset" }}>歌曲</TableCell>
                            <TableCell style={{ width: "40%" }} sx={{ borderBottom: "unset" }}>歌手</TableCell>
                            <TableCell style={{ width: "10%" }} sx={{ borderBottom: "unset" }}>时长</TableCell>
                        </TableRow>
                    </TableHead>
                    {
                        playlist.map((row, index) => (
                            <TableRow
                                sx={[
                                    {
                                        userSelect: "none",
                                        ":hover": {
                                            background: "rgba(0,0,0,0.1)", color: theme.palette.primary.main
                                        }
                                    },
                                    musicMenuOpen && musicMenuInfo.musicId === row.musicId && {
                                        background: "rgba(0,0,0,0.1)", color: theme.palette.primary.main
                                    },
                                    heiMusicContext.currentMusicInfo !== null && heiMusicContext.currentMusicInfo.albumId === row.albumId && heiMusicContext.currentMusicInfo.musicId === row.musicId && {
                                        color: theme.palette.primary.main
                                    }
                                ]}
                                onContextMenu={e => {
                                    e.preventDefault();
                                    setMusicMenuOpen(true);
                                    setMusicMenuPos({ left: e.clientX, top: e.clientY });
                                    setMusicMenuInfo({ albumTitle: row.albumTitle, albumId: row.albumId, musicTitle: row.title, musicId: row.musicId, index: index, isFavorite: row.isFavorite });
                                }}
                                onDoubleClick={() => {
                                    const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
                                        detail: {
                                            playlist: playlist,
                                            startIndex: index
                                        }
                                    });
                                    document.dispatchEvent(event)
                                }}>
                                <TableCell style={{ width: "5%" }} sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }} onDoubleClick={e => e.stopPropagation()}>
                                    {
                                        row.isFavorite && <Button size="small" sx={{ padding: "0px 0px", width: "20px", height: "20px", minWidth: "unset" }} color="error" onClick={() => handleRemoveFavoriteMusic(row.musicId)} ><FavoriteOutlinedIcon sx={{ width: "18px", height: "18px" }} /></Button>
                                    }
                                    {
                                        !row.isFavorite && <Button size="small" sx={{ padding: "0px 0px", width: "20px", height: "20px", minWidth: "unset" }} color="error" onClick={() => handleAddFavoriteMusic(row.musicId)}><FavoriteBorderOutlinedIcon sx={{ width: "18px", height: "18px" }} /></Button>
                                    }
                                </TableCell>
                                <TableCell sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden", display: 'flex' }} title={row.title}>
                                    <Typography variant='body2' noWrap >{row.title}</Typography>
                                    {
                                        heiMusicContext.currentMusicInfo !== null && heiMusicContext.currentMusicInfo.albumId === row.albumId && heiMusicContext.currentMusicInfo.musicId === row.musicId &&
                                        <Box sx={{ flex: '1 0 auto', margin: 'auto 0px auto 4px' }}>
                                            <SpectrumIcon variant='small' />
                                        </Box>
                                    }
                                </TableCell>
                                <TableCell style={{ width: "45%" }} sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }} title={row.artists.join(" / ")}>{row.artists.join(" / ")}</TableCell>
                                <TableCell style={{ width: "10%" }} sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }}>{timePretty(row.duration === 0 ? row.discEndTime - row.discStartTime : row.duration)}</TableCell>


                            </TableRow>
                        ))

                    }


                </Table>
            </TableContainer>
            {/* 无音乐提示 */}
            <Box sx={[{ height: "96px", width: "100%", display: "flex" }, playlist.length !== 0 && { display: "none" }]}>
                <Typography sx={{ margin: "auto auto" }} >当前专辑暂无音乐</Typography>
            </Box>
            {/* 音乐菜单 */}
            <Popover
                open={musicMenuOpen}
                anchorReference='anchorPosition'
                anchorPosition={musicMenuPos}
                onClose={() => setMusicMenuOpen(false)}
                transitionDuration={100}
                onContextMenu={e => {
                    e.preventDefault();
                    setMusicMenuOpen(false);
                }}
            >
                <Paper sx={{ display: 'flex', flexDirection: 'column', width: "160px", backgroundColor: theme.palette.pannelBackground.main }}
                    onClick={() => setMusicMenuOpen(false)}
                >
                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                        color='inherit'
                        startIcon={<PlayCircleFilledWhiteOutlinedIcon />}
                        onClick={handleContextMenuPlay}
                        size='small'
                    >
                        播放
                    </Button>
                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                        color='inherit'
                        startIcon={<LibraryMusicOutlinedIcon />}
                        onClick={handleContextMenuPlayNext}
                        size='small'

                    >
                        下一首播放
                    </Button>
                    <Divider />
                    {
                        musicMenuInfo.isFavorite &&
                        <Button
                            sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                            color='inherit'
                            startIcon={<FavoriteOutlinedIcon />}
                            onClick={() => { }}
                            size='small'

                        >
                            收藏
                        </Button>
                    }
                    {
                        !musicMenuInfo.isFavorite &&
                        <Button
                            sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                            color='inherit'
                            startIcon={<FavoriteBorderOutlinedIcon />}
                            onClick={() => { }}
                            size='small'

                        >
                            收藏
                        </Button>
                    }
                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px", ".MuiButton-endIcon": { marginLeft: 'auto', marginRight: '0px' } }}
                        color='inherit'
                        startIcon={<PlaylistAddRoundedIcon />}
                        endIcon={<NavigateNextRoundedIcon />}
                        onClick={() => { }}
                        size='small'
                    >
                        添加到
                    </Button>
                    <Divider />

                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                        color='inherit'
                        startIcon={<MenuOutlinedIcon />}
                        onClick={() => { router.push(`/album/edit/${musicMenuInfo.albumId}`) }}
                        size='small'

                    >
                        复制音乐信息
                    </Button>
                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                        color='inherit'
                        startIcon={<DeleteSweepOutlinedIcon />}
                        onClick={() => { router.push(`/album/edit/${musicMenuInfo.albumId}`) }}
                        size='small'
                    >
                        删除
                    </Button>
                </Paper>
            </Popover>
        </Box >
    );
}


export default MusicAlbum;