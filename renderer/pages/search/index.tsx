import { ApiError, MusicVo, SearchControllerService } from "@api/codegen";
import { pushToast } from "@components/HeiMusicMainLayout";
import { IChangePlayListEvent, IEnqueueNextEvent } from "@components/MusicControlPannel/MusicControlPannel";
import { Table, TableBody, TableCell, TableHead, TableRow, Box, Typography } from "@mui/material";
import { useRouter } from "next/router";
import React from "react"

export default function Search() {
    const [result, setResult] = React.useState<MusicVo[]>([]);
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
        var musicList = [{
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
            isFavorite: music.isFavorite
        }]
        const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", { detail: { playlist: musicList, startIndex: 0 } });

        document.dispatchEvent(event)
    }

    return (
        <Box sx={{ width: '100%', height: '100%', padding: '12px 12px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5">{`搜索：${prompt}`}</Typography>
            <Table>
                <TableHead>
                    <TableCell>
                        歌曲
                    </TableCell>
                    <TableCell>
                        艺术家
                    </TableCell>
                    <TableCell>
                        专辑
                    </TableCell>
                </TableHead>
                <TableBody>
                    {
                        result.map(music => {
                            return (
                                <TableRow onDoubleClick={() => handlePlay(music)} >
                                    <TableCell>
                                        <Typography variant='body2' noWrap title={music.title}>{music.title}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant='body2' noWrap title={music.artistList.map(artist => artist.name).join(' / ')}>{music.artistList.map(artist => artist.name).join(' / ')}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant='body2' noWrap title={music.albumTitle}>{music.albumTitle}</Typography>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    }
                </TableBody>
            </Table>
        </Box>

    )
}