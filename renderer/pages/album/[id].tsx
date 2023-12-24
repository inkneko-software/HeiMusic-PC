import Box from '@mui/material/Box'
import { BoxProps, CardMedia, IconButton, Stack, Typography, useTheme } from "@mui/material"

import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import MusicNote from '@mui/icons-material/MusicNote'
import Avatar from "@mui/material/Avatar"
import Button from '@mui/material/Button';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { useRouter } from 'next/router';

import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';

import { IChangePlayListEvent, IMusicInfo, IMusicQuality } from '../../components/MusicControlPannel/MusicControlPannel';
import { AlbumControllerService, ArtistVo } from '../../api/codegen';

interface MusicAlbumProps extends BoxProps {

}

function MusicAlbum(props: MusicAlbumProps) {
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
                    songId: music.musicId,
                    title: music.title,
                    artists: music.artistList.map(val => val.name),
                    qualityOption: [{
                        name: "SQ",
                        url: music.resourceUrl,
                        color: "red"
                    }],
                    albumId: albumInfo.albumId,
                    albumTitle: albumInfo.title,
                    cover: albumInfo.frontCoverUrl,
                    duration: music.duration
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
        return `${Math.floor(time / 60).toString().padStart(2, "0")}:${(time % 60).toString().padStart(2, "0")}`
    }

    return (
        <Box sx={{ height: '100%', width: '100%', overflowY: "auto" }} ref={containerRef}>
            <Box sx={{
                marginTop: '20px',
                width: "auto",
                padding: "0px 12px 10px 12px",
                display: 'flex',
            }}
                ref={albumInfoRef}
            >
                <CardMedia sx={{
                    width: '160px', height: '160px', borderRadius: '6%', flex: "0 0 auto", imageRendering: "auto", border: "1px solid #e3e3e3", objectFit: "contain"
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
                    <Typography fontWeight={600} variant='h5' noWrap title={albumInfo.title} >{albumInfo.title}</Typography>
                    <Typography variant='body2' noWrap >{albumInfo.artist}</Typography>
                    {albumInfo.date ? <Typography variant='caption' noWrap >{albumInfo.date}</Typography> : null}
                    <Typography variant='caption' sx={{ marginTop: "12px" }} >{"播放量 " + albumInfo.listenedCount}</Typography>
                    <Box sx={{ marginTop: "auto" }}>
                        <Button sx={{ width: "90px", height: "32px", marginRight: "30px" }} variant="contained" onClick={handlePlayAll} >播放全部</Button>
                        <Button sx={{ width: "90px", height: "32px", marginRight: "30px" }} variant="outlined">下载</Button>
                    </Box>
                </Box>
            </Box>
            <Box sx={[
                {
                    marginTop: '20px',
                    display: 'flex',
                    height:"fit-content",
                    flexDirection: "column",
                    position: "sticky",
                    overflow:"hidden",
                    background: theme.palette.pannelBackground.light,
                    top: "0px",
                    zIndex: 10,
                    transition:"height .3s cubic-bezier(0.42, 1.0, 1.0, 1.0) 0s;"
                },
                showLargeAlbumInfo && {
                    visibility:"hidden",
                    height:"0px",
                }
            ]}>
                <Box sx={{ display: "flex", padding: "0px 12px 10px 12px",}}>
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
                                sx={{ userSelect: "none", ":hover": { background: "rgba(0,0,0,0.1)", color: theme.palette.primary.main,  } }}
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
                                    <Button size="small" sx={{ padding: "0px 0px", width: "20px", height: "20px", minWidth: "unset" }} color="error" ><FavoriteBorderOutlinedIcon sx={{ width: "18px", height: "18px" }} /></Button>
                                </TableCell>
                                <TableCell style={{ width: "45%" }} sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }} title={row.title}>{row.title}</TableCell>
                                <TableCell style={{ width: "45%" }} sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }} title={row.artists.join(" / ")}>{row.artists.join(" / ")}</TableCell>
                                <TableCell style={{ width: "10%" }} sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }}>{timePretty(row.duration)}</TableCell>

                            </TableRow>
                        ))

                    }


                </Table>
            </TableContainer>
            <Box sx={[{ height: "96px", width: "100%", display: "flex" }, playlist.length !== 0 && { display: "none" }]}>
                <Typography sx={{ margin: "auto auto" }} >当前专辑暂无音乐</Typography>
            </Box>
        </Box >
    );
}


export default MusicAlbum;