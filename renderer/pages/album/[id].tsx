import Box from '@mui/material/Box'
import { BoxProps, CardMedia, Typography } from "@mui/material"

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

import { IChangePlayListEvent, IMusicInfo, IMusicQuality } from '../../components/MusicControlPannel/MusicControlPannel';
import { AlbumControllerService, ArtistVo } from '../../api/codegen';

interface MusicAlbumProps extends BoxProps {

}

function MusicAlbum(props: MusicAlbumProps) {
    const router = useRouter()
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
    const [viewAtTopState, setViewAtTopState] = React.useState(true)

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
                    cover: albumInfo.frontCoverUrl
                }
            }))
        })()

    }, [id])

    React.useEffect(() => {

    }, [viewAtTopState])

    const handlePlayAll = ()=>{
        if (playlist.length !== 0){
            const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
                detail: {
                    playlist: playlist,
                    startIndex: 0
                }
            });
            document.dispatchEvent(event)
        }
    }
    const AlbumInfo = () => {
        return (
            <Box sx={{
                marginTop: '20px',
                width: "auto",
                padding: "0px 12px 10px 12px",
                display: 'flex',
            }}>
                <CardMedia sx={{
                    width: '180px', height: '180px', borderRadius: '6%', flex: "0 0 auto", imageRendering: "auto", border: "1px solid #e3e3e3", objectFit: "contain"
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
        )
    }

    const AlbumInfoLite = () => {
        return (
            <Box sx={{
                marginTop: '20px',
                display: 'flex',
                padding: "0px 12px 10px 12px"
            }}>
                <Avatar sx={{
                    width: '90px', height: '90px', borderRadius: '3%'
                }} variant="square" src={albumInfo.cover}><MusicNote style={{ fontSize: 72 }} /></Avatar>
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
        )
    }

    React.useEffect(() => {
        console.log("dick1")
    }, [])


    // const VirtuosoTableComponents: TableComponents<IMusicInfo> = {
    //     Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    //         <TableContainer component={Paper} {...props} ref={ref} sx={{ borderRadius: "0px", boxShadow: "unset", background: "rgba(0,0,0,0)" }} />
    //     )),
    //     Table: (props) => (
    //         <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
    //     ),
    //     TableHead,
    //     TableRow: ({ item: _item, "data-item-index": _index,  ...props }) => <TableRow {...props} onDoubleClick={() => {
    //         const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
    //             detail: {
    //                 playlist: playlist,
    //                 startIndex: _index
    //             }
    //         });
    //         document.dispatchEvent(event)
    //     }} />,
    //     TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    //         <TableBody {...props} ref={ref} />
    //     )),
    // };

    // const fixedHeaderContent = () => {
    //     return (
    //         <TableRow>
    //             <TableCell key="title" variant="head" style={{ width: 300 }} sx={{ backgroundColor: 'background.paper', borderBottom: "unset" }}>歌曲</TableCell>
    //             <TableCell key="artists" variant="head" style={{ width: 300 }} sx={{ backgroundColor: 'background.paper', borderBottom: "unset" }}>歌手</TableCell>
    //             <TableCell key="duration" variant="head" style={{ width: 100 }} sx={{ backgroundColor: 'background.paper', borderBottom: "unset" }}>时长</TableCell>
    //         </TableRow>
    //     )
    // }


    // const rowContent = (_index: number, row: IMusicInfo) => {
    //     return (
    //         <React.Fragment >
    //             <TableCell key="title" sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }}>{row.title}</TableCell>
    //             <TableCell key="artists"  sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }}>{row.artists.join(" / ")}</TableCell>
    //             <TableCell key="duration" sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }}>{0}</TableCell>

    //         </React.Fragment>
    //     );
    // }

    return (
        <Box sx={{ height: '100%', width: '100%', display: "flex", flexDirection: "column", overflowY: "" }}>
            <AlbumInfo />
            <TableContainer sx={{ flex: '0 1 auto' }}>
                <Table stickyHeader >
                    <TableHead>
                        <TableRow >
                            <TableCell style={{ width: "45%" }} sx={{ borderBottom: "unset" }}>歌曲</TableCell>
                            <TableCell style={{ width: "45%" }} sx={{ borderBottom: "unset" }}>歌手</TableCell>
                            <TableCell style={{ width: "10%" }} sx={{ borderBottom: "unset" }}>时长</TableCell>
                        </TableRow>
                    </TableHead>
                    {
                        playlist.map((row, index) => (
                            <TableRow onDoubleClick={() => {
                                const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
                                    detail: {
                                        playlist: playlist,
                                        startIndex: index
                                    }
                                });
                                document.dispatchEvent(event)
                            }}>
                                <TableCell style={{ width: "45%" }} sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }} title={row.title}>{row.title}</TableCell>
                                <TableCell style={{ width: "45%" }} sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }} title={row.artists.join(" / ")}>{row.artists.join(" / ")}</TableCell>
                                <TableCell style={{ width: "10%" }} sx={{ borderBottom: "unset", textOverflow: "ellipsis", whiteSpace: "nowrap", overflowX: "hidden" }}>{0}</TableCell>

                            </TableRow>
                        ))
                    }

                </Table>
            </TableContainer>
        </Box >
    );
}


export default MusicAlbum;