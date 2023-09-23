import { Box, Button, CardMedia, TableCell, TableContainer, TableHead, TableRow, Typography, Table, TableBody, Chip, IconButton, useTheme, Grid, Avatar, Dialog, DialogTitle, DialogContent, TextField, Paper, Autocomplete, DialogActions, Stack, Divider } from "@mui/material";
import React from "react"
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import { ArtistVo, ArtistControllerService, AlbumControllerService, MusicControllerService } from "../../api/codegen";
import CoverInput from "@components/Common/CoverInput/CoverInput";
import { useRouter } from "next/router";


interface IMusic {
    musicId: number,
    title: string,
    path: string,
    artists: ArtistVo[]
    cover: string,
    file: File
}

interface IMusicDialog {
    open: boolean,
    musicIndex: number
}

function AlbumEdit() {
    const theme = useTheme();
    const router = useRouter();
    //专辑标题
    const [title, setTitle] = React.useState("")
    const [cover, setCover] = React.useState<Blob>(null)
    //专辑艺术家列表
    const [albumArtists, setAlbumArtists] = React.useState<ArtistVo[]>([]);
    //艺术家对话框相关
    const [artistSearchInput, setArtistSearchInput] = React.useState<string>("")
    const [artistSearchCandidate, setArtistSearchCandidate] = React.useState<ArtistVo[]>([])
    const [addArtistDialogOpen, setAddArtistDialogOpen] = React.useState(false)
    const [musicDialogContext, setMusicDialogContext] = React.useState<IMusicDialog>({ open: false, musicIndex: null })
    //音乐列表
    const [musicList, setMusicList] = React.useState<IMusic[]>([])

    const musicFileRef = React.useRef<HTMLInputElement>(null)

    const addArtist = (name: string) => {

    }

    const removeArtist = (name: string) => {
        setAlbumArtists(albumArtists.filter((item, index) => { return name === item.name }))
    }

    const onPickMusic = async () => {
        musicFileRef.current.click();
        // setMusicDialogContext({ ...musicDialogContext, open: true })
        musicFileRef.current.onchange = async () => {
            const files = musicFileRef.current.files;
            for (var i = 0; i < files.length; ++i) {
                const file = files[i];
                const metadata = await window.electronAPI.music.parse(file.path);
                console.log(metadata.common)
                console.log(file.path)


                var coverUrl = null;
                if (metadata.common.picture !== undefined) {
                    const b = new Blob([metadata.common.picture[0].data])

                    coverUrl = URL.createObjectURL(b);
                }
                var artists: ArtistVo[] = []
                if (metadata.common.artists !== undefined) {
                    artists = metadata.common.artists.map((name: string, index) => {
                        return {
                            artistId: null,
                            name: name,
                            translateName: "",
                            avatarUrl: "",
                            birth: ""
                        }
                    });
                    if (artists.length === 1) {
                        //可能将多个作家合并为了一个条目，因此通过常见的分隔符进行分隔（・ 、 & /），能够处理以下格式：
                        //ArtistA(cv1分隔符cv2分隔符cv3)分隔符ArtistB(cv1分隔符cv2)
                        //ArtistA分隔符ArtistB分隔符ArtistC
                        var artistsString = artists[0].name;
                        artists = [];

                        var artistLeft = 0;
                        var artistRight = 0;
                        var remarkLeft = 0;
                        var isInsideRemark = false;
                        var artistsStringLength = artistsString.length;
                        for (var j = 0; j < artistsStringLength; ++j) {
                            var char = artistsString.charAt(j);
                            //如果在备注中，当遇到右括号，即意味着一个作者的条目。
                            //如果不在备注中，遇到分隔符，即意味着一个作者的条目。
                            if (!isInsideRemark) {
                                if (char === '(' || char === '（') {
                                    isInsideRemark = true;
                                    remarkLeft = j + 1;
                                    artistRight = j - 1;
                                    continue;
                                }

                                if (j + 1 === artistsStringLength) {
                                    artists.push({
                                        artistId: null,
                                        name: artistsString.substring(artistLeft, j + 1),
                                        translateName: "",
                                        avatarUrl: "",
                                        birth: ""
                                    })
                                    break;
                                }


                                if (char.match(/[・、&\/]+/) !== null) {
                                    //先判断"ArtistA(cv1)分隔符ArtistB"的情况
                                    if (j === 0) {
                                        continue;
                                    }
                                    var lastChar = artistsString.charAt(j - 1);
                                    if (lastChar === ')' || lastChar === '）') {
                                        continue;
                                    }
                                    artists.push({
                                        artistId: null,
                                        name: artistsString.substring(artistLeft, j),
                                        translateName: "",
                                        avatarUrl: "",
                                        birth: ""
                                    })
                                    artistLeft = j + 1;
                                }

                            } else {
                                if (char === ')' || char === '）') {
                                    isInsideRemark = false;
                                    artists.push({
                                        artistId: null,
                                        name: artistsString.substring(artistLeft, artistRight + 1),
                                        translateName: artistsString.substring(remarkLeft, j),
                                        avatarUrl: "",
                                        birth: ""
                                    })
                                    artistLeft = j + 1;

                                    //如果下个字符是分隔符，则artistLeft应当再跳过一个字符
                                    if (j + 1 !== artistsStringLength) {
                                        var nextChar = artistsString.charAt(j + 1);
                                        if (nextChar.match(/[・、&\/]+/) !== null) {
                                            artistLeft += 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                const music: IMusic = {
                    musicId: null,
                    title: metadata.common.title || '',
                    artists: artists,
                    path: file.path,
                    cover: coverUrl,
                    file: file
                }


                setMusicList(prev => [...prev, music]);

                // const event = new CustomEvent<IMusicControlEventDetail>("music-control-panel::play", {
                //     detail: {
                //         src: "app:///" + file.path,
                //         title: musicMeta.title,
                //         cover: musicMeta.cover,
                //         albumTitle: musicMeta.album,
                //         artists: metadata.artists
                //     }
                // });
                //document.dispatchEvent(event)
            }
        }
    }

    const onPickCue = async () => {
        musicFileRef.current.click();
        musicFileRef.current.onchange = async () => {
            const files = musicFileRef.current.files;
            if (files !== null && files.length !== 0) {
                const file = files[0];
                console.log(file.path)
                const data = await window.electronAPI.music.parseCue(file.path);
                console.log(data)

                interface CueSheet {
                    encoding: string,
                    files: {
                        name: string, //"GNBA-228202.flac"
                        type: string, //"WAVE"
                        tracks: {
                            type: string, // "AUDIO"
                            performer: string, //
                            title: string, //
                            indexes: {
                                number: number,
                                time: {
                                    min: number,
                                    sec: number,
                                    frame: number
                                }
                            }[]
                        }[]
                    }[]
                }
            }
        }
    }



    const handleSaveAlbum = async () => {
        var albumInfo = await AlbumControllerService.addAlbum(title, "", albumArtists.map(item => item.artistId), { frontCover: cover })
        console.log(albumInfo.data.albumId)

        var musicIds: number[] = []
        for (var i = 0; i < musicList.length; ++i) {
            var item = musicList[i]
            musicIds.push((await MusicControllerService.addMusic(item.title, "", item.artists.map(artist => artist.name), { file: item.file })).data.musicId)
        }

        await AlbumControllerService.addAlbumMusic(albumInfo.data.albumId, musicIds)
        router.push(`/album/${albumInfo.data.albumId}`)

    }

    return (
        <Box sx={{ padding: "12px 12px", overflowY: 'auto', height: '100%' }}>
            <input ref={musicFileRef} name="music_file" type="file" accept=".mp3,.flac,.ogg" multiple hidden />
            {/* 添加艺术家对话框 */}
            <Dialog open={addArtistDialogOpen} onClose={() => setAddArtistDialogOpen(false)}>
                <DialogTitle>
                    <Typography>添加艺术家</Typography>
                </DialogTitle>
                <DialogContent sx={{ display: "flex" }}>
                    <Autocomplete
                        sx={{ width: "200px" }}
                        filterOptions={(x) => x}
                        options={artistSearchCandidate.map(value => value.name)}
                        autoComplete
                        freeSolo
                        includeInputInList
                        value={artistSearchInput}
                        noOptionsText="无结果，点击添加以创建"
                        onChange={(event: any, selectedArtist: string) => {
                            setArtistSearchInput(selectedArtist)
                        }}
                        onInputChange={(event, newInputValue) => {
                            setArtistSearchInput(newInputValue)
                            ArtistControllerService.searchArtist(newInputValue)
                                .then(res => {
                                    setArtistSearchCandidate(res.data)
                                })
                        }}
                        renderInput={(params) => (
                            <TextField   {...params} size="small" />
                        )}
                    />
                    <Button size="small" onClick={() => {
                        console.log(artistSearchInput)
                        var selectedArtist = artistSearchCandidate.find(value => value.name === artistSearchInput)
                        if (selectedArtist === undefined) {
                            ArtistControllerService.addArtist(artistSearchInput)
                                .then(res => {
                                    if (res.code === 0) {
                                        selectedArtist = res.data
                                        setAlbumArtists([...albumArtists, selectedArtist])
                                        setAddArtistDialogOpen(false);
                                    }
                                })
                        } else {
                            setAlbumArtists([...albumArtists, selectedArtist])
                            setAddArtistDialogOpen(false);
                        }
                    }}>添加</Button>
                </DialogContent>
            </Dialog>

            {/* 音乐信息对话框 */}
            <Dialog open={musicDialogContext.open} onClose={() => setMusicDialogContext({ ...musicDialogContext, open: false })}>
                <DialogTitle>
                    <Typography>音乐信息</Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", marginBottom: '12px' }}>
                        <Typography sx={{ width: '30%' }}>音乐标题</Typography>
                        <TextField size="small" value={musicList[musicDialogContext.musicIndex] && musicList[musicDialogContext.musicIndex].title} onChange={e => setMusicList(musicList.map((val, index) => {
                            if (index === musicDialogContext.musicIndex) {
                                val.title = e.target.value;
                            }
                            return val;
                        }))} />
                    </Box>
                    <Box sx={{ display: "flex", marginBottom: '12px' }}>
                        <Typography sx={{ width: '30%' }}>艺术家</Typography>
                        <Grid sx={{ flex: "1 0 0" }}  >
                            {
                                musicList[musicDialogContext.musicIndex] && musicList[musicDialogContext.musicIndex].artists.map((value, index) => {
                                    return <Chip label={value.name} sx={{ margin: "0px 2px 2px 0px" }} avatar={<Avatar>{value.name.charAt(0)}</Avatar>} color="primary" onDelete={removeArtist} />
                                })
                            }
                            <Chip sx={{ margin: "0px 2px 2px 0px" }} label="添加" icon={<AddCircleOutlineOutlinedIcon />} onClick={() => { setAddArtistDialogOpen(true) }} />
                        </Grid>
                    </Box>
                    <Box sx={{ display: "flex", marginBottom: '12px' }}>
                        <Typography sx={{ width: '30%', flex: "0 0 auto" }}>文件</Typography>
                        <Typography variant="caption" sx={{ margin: "auto auto auto 0" }}>{musicList[musicDialogContext.musicIndex] && musicList[musicDialogContext.musicIndex].path}</Typography>

                    </Box>
                </DialogContent>
            </Dialog>
            {/* 页面标题，操作按钮 */}
            <Box sx={{ display: 'flex' }}>
                <Typography variant="h5" sx={{ width: '30%' }}>新建专辑</Typography>

                <Button variant="outlined" size='small' sx={{ margin: "auto 12px auto 0px" }} onClick={onPickCue}>读取cue文件</Button>
                <Button variant="outlined" size='small' sx={{ margin: "auto 12px" }}>读取文件夹</Button>
                <Button variant="outlined" size='small' color="success" sx={{ margin: "auto 12px" }} onClick={handleSaveAlbum}>保存专辑</Button>
            </Box>

            <Divider sx={{ margin: "12px 0px" }} />

            {/* 专辑信息 */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {/* 专辑标题设定 */}
                <Box sx={{ display: 'flex', marginBottom: '12px' }}>
                    <Typography sx={{ width: '30%' }}>标题</Typography>
                    <TextField value={title} size="small" sx={{ maxWidth: '60%', }} onChange={event => setTitle(event.target.value)} />
                </Box>

                {/* 艺术家设定 */}
                <Box sx={{ display: 'flex', marginBottom: '12px' }}>
                    <Typography sx={{ width: '30%' }}>作者</Typography>
                    {/* <Input value={selectedMusicFile.artist} sx={{ maxWidth: '60%' }} /> */}
                    <Grid sx={{ flex: "1 0 0" }}  >
                        {
                            albumArtists.map((value, index) => {
                                return <Chip label={value.name} sx={{ margin: "0px 2px 2px 0px" }} avatar={<Avatar>{value.name.charAt(0)}</Avatar>} color="primary" onDelete={removeArtist} />
                            })
                        }
                        <Chip sx={{ margin: "0px 2px 2px 0px" }} variant="outlined" label="添加" icon={<AddCircleOutlineOutlinedIcon />} onClick={() => { setAddArtistDialogOpen(true) }} />
                    </Grid>
                </Box>
                {/* 封面设定 */}
                <Box sx={{ display: 'flex', marginBottom: '12px' }}>
                    <Typography sx={{ width: '30%' }}>封面</Typography>
                    <CoverInput cover={cover} onCoverChanged={newCover => setCover(newCover)} />
                </Box>

                {/* 音乐列表 */}
                <Box sx={{ display: 'flex', marginBottom: '12px' }}>
                    <Typography sx={{ width: '30%' }}>音乐列表</Typography>
                    <Button variant="outlined" size='small' onClick={onPickMusic}>添加音乐文件</Button>
                </Box>


                <TableContainer sx={{ width: 'auto' }}>
                    <Table sx={{ tableLayout: 'fixed' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell width='30%' sx={{ padding: "12px 0px" }}>歌曲名称</TableCell>
                                <TableCell width='40%' sx={{ padding: "12px 0px" }}>歌手</TableCell>
                                <TableCell width='15%' sx={{ padding: "12px 0px" }}>音乐文件</TableCell>
                                <TableCell width='15%' sx={{ padding: "12px 0px" }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                musicList.map((music, index) => {
                                    return (
                                        <TableRow sx={{ ":hover": { backgroundColor: theme.palette.pannelBackground.main, cursor: 'pointer' } }} key={index}>
                                            <TableCell sx={{ width: '30%', padding: "12px 0px" }} >
                                                <Typography variant='body2' noWrap>{music.title}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ padding: "12px 0px" }}>
                                                <Typography variant='body2' noWrap>
                                                    {
                                                        music.artists.map(item => {
                                                            console.log(item)
                                                            if (item.translateName !== null && item.translateName.length !== 0) {
                                                                return `${item.name}(${item.translateName})`;
                                                            }
                                                            return item.name;
                                                        }
                                                        ).join(" / ")
                                                    }
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ padding: "12px 0px" }}>
                                                <Typography variant='body2' noWrap>{music.path}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ padding: "12px 0px" }}>
                                                <Box sx={{ display: 'flex' }}>

                                                    <Button size='small' sx={{ padding: 0, minWidth: 0 }} onClick={() => setMusicDialogContext({ open: true, musicIndex: index })}><EditOutlinedIcon /></Button>
                                                    <Button size='small' sx={{ padding: 0, minWidth: 0, marginLeft: '2px' }} onClick={() => setMusicList(musicList.filter((val, itemIndex) => itemIndex !== index))}><DeleteOutlineOutlinedIcon /></Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            }
                        </TableBody>
                    </Table>
                    <Box sx={[musicList.length === 0 && { display: "none" }, { height: "96px", width: "100%", display: "flex" }]}>
                        <Typography sx={{ margin: "auto auto" }} >暂无音乐，点击上方按钮添加音乐</Typography>
                    </Box>
                </TableContainer>

            </Box>
        </Box>
    )
}

export default AlbumEdit;