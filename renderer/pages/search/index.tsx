import { ApiError, MusicVo, SearchControllerService } from "@api/codegen";
import { pushToast } from "@components/HeiMusicMainLayout";
import { IChangePlayListEvent, IEnqueueNextEvent, IMusicInfo } from "@components/MusicControlPannel/MusicControlPannel";
import { Table, TableBody, TableCell, TableHead, TableRow, Box, Typography, TableContainer } from "@mui/material";
import { useTheme } from "@mui/styles";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react"

export default function Search() {
    const theme = useTheme();
    const [result, setResult] = React.useState<MusicVo[]>(null);
    const [prompt, setPrompt] = React.useState("");
    const router = useRouter();

    React.useEffect(() => {
        const { keyword } = router.query;
        setPrompt(keyword as string);
        if (keyword !== '') {
            SearchControllerService.searchMusic(keyword as string)
                .then(res => {
                    setResult(res.data);
                })
                .catch((error: ApiError) => {
                    pushToast(error.message)
                });
        }
    }, [router.query])

    const handlePlay = (music: MusicVo) => {
        var musicList: IMusicInfo[] = [{
            musicId: music.musicId,
            title: music.title,
            artists: music.artistList.map(val => val.name),
            qualityOption: [{
                name: "SQ",
                url: music.resourceUrl,
                color: "red"
            }],
            albumId: music.albumId,
            albumTitle: music.albumTitle,
            cover: music.albumCoverUrl,
            duration: music.duration,
            isFavorite: music.isFavorite,
            isLargeTrackMusic: music.discStartTime !== '',
            discEndTime: parseFloat(music.discEndTime),
            discStartTime: parseFloat(music.discStartTime)
        }]
        const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", { detail: { playlist: musicList, startIndex: 0 } });

        document.dispatchEvent(event)
    }

    return (
        <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" sx={{ padding: '0px 12px' }}>{`搜索音乐：${prompt}`}</Typography>
            <Typography variant='caption' sx={{ padding: '0px 12px' }} >{result === null ? "加载中" : `共${result.length}个结果`}</Typography>
            {
                result !== null && result.length !== 0 &&
                <TableContainer sx={{ padding: '0px 12px' }}>
                <Table sx={{ tableLayout: "fixed", }} stickyHeader >
                    <TableHead>
                        <TableCell sx={{ backgroundColor: theme.palette.pannelBackground.light }}>
                            歌曲
                        </TableCell >
                        <TableCell sx={{ backgroundColor: theme.palette.pannelBackground.light }}>
                            艺术家
                        </TableCell>
                        <TableCell sx={{ backgroundColor: theme.palette.pannelBackground.light }}>
                            专辑
                        </TableCell>
                    </TableHead>
                    <TableBody>
                        {
                            result.map(music => {
                                return (
                                    <TableRow
                                        onDoubleClick={() => handlePlay(music)}
                                        sx={[{ ':hover': { background: theme.palette.pannelBackground.main } }/*, albumMenuOpen && albumMenuInfo.albumId === album.albumId && { background: theme.palette.pannelBackground.main }*/]}>
                                        <TableCell sx={{ width: '30%' }}>
                                            <Typography variant='body2' noWrap title={music.title} sx={{ ':hover': { cursor: 'default', color: theme.palette.primary.main } }}>{music.title}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: '30%' }}>
                                            <Typography variant='body2' noWrap sx={{ ':hover': { cursor: 'pointer', color: theme.palette.primary.main } }} title={music.artistList.map(artist => artist.name).join(' / ')}>{music.artistList.map(artist => artist.name).join(' / ')}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ width: '40%' }}>
                                            <Link href={`/album/${music.albumId}`}>
                                                <Typography variant='body2' noWrap title={music.albumTitle} sx={{ ':hover': { cursor: 'pointer', color: theme.palette.primary.main } }} >{music.albumTitle}</Typography>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        }
                    </TableBody>
                </Table>
            </TableContainer>
            }

        </Box>

    )
}