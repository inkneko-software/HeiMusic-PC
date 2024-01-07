import { Box, Button, CardMedia, TableCell, TableContainer, TableHead, TableRow, Typography, Table, TableBody, Chip, IconButton, useTheme, Grid, Avatar, Dialog, DialogTitle, DialogContent, TextField, Paper, Autocomplete, DialogActions, Stack, Divider } from "@mui/material";
import React from "react"
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import { ArtistVo, ArtistControllerService, AlbumControllerService, MusicControllerService, MusicDto, ApiError } from "../../api/codegen";
import CoverInput from "@components/Common/CoverInput/CoverInput";
import { useRouter } from "next/router";

import { addMusic, addMusicFromCue } from "@api/upload/music";
import { Index } from "cue-parser/lib/cuesheet";
import { pushToast } from "@components/HeiMusicMainLayout";


interface IMusic {
    musicId: number,
    title: string,
    translatedTitle?: string,
    path: string,
    artists: ArtistVo[]
    file: File
    sourceArtistTag?: string,
    loaded?: number,
    total?: number,
    startTime?: string,
    endTime?: string,
}

interface IMusicDialog {
    open: boolean,
    music: IMusic,
    musicIndex: number,
}

interface ICueMusicFile {
    file: File,
    fileName: string,
    musicList: IMusic[],
    loaded?: number,
    total?: number
}

interface ICue {
    fileList: ICueMusicFile
}


function parsePeformers(artistsString: string): ArtistVo[] {
    if (artistsString === null) {
        return [];
    }
    var artists = [];

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
    return artists;
}


interface IAddArtistDialogProps {
    open: boolean,
    onClose: () => void,
    onAddSuccessful: (artist: ArtistVo) => void
}

function AddArtistDialog(props: IAddArtistDialogProps) {
    const [artistSearchInput, setArtistSearchInput] = React.useState<string>("")
    const [artistSearchCandidate, setArtistSearchCandidate] = React.useState<ArtistVo[]>([])
    return (
        <Dialog open={props.open} onClose={() => props.onClose()}>
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
                    //判断是否为候选结果。候选结果为已创建的艺术家，拥有艺术家ID。
                    //如果不是则尝试创建
                    var selectedArtist = artistSearchCandidate.find(value => value.name === artistSearchInput)
                    if (selectedArtist === undefined) {
                        ArtistControllerService.addArtist(artistSearchInput)
                            .then(res => {
                                //添加成功，执行callback
                                selectedArtist = res.data
                                props.onAddSuccessful(selectedArtist);
                                props.onClose();
                            })
                            .catch((e: ApiError) => {
                                //若已存在则查询指定艺术家
                                ArtistControllerService.getArtistByName(artistSearchInput)
                                    .then(res => {
                                        selectedArtist = res.data
                                        props.onAddSuccessful(selectedArtist);
                                        props.onClose();
                                    })
                                    .catch((e: ApiError) => {
                                        pushToast(e.message, 'error')
                                    })
                            })
                    } else {
                        props.onAddSuccessful(selectedArtist);
                        props.onClose();
                    }
                }}>添加</Button>
            </DialogContent>
        </Dialog>
    )
}

interface IMusicInfoDialogProps {
    open: boolean,
    music: IMusic,
    onClose: () => void,
    onUpdate: (music: IMusic) => void,
    usingCue?: boolean
}

function MusicInfoDialog(props: IMusicInfoDialogProps) {
    const [music, setMusic] = React.useState({ ...props.music })
    const [addArtistDialogOpen, setAddArtistDialogOpen] = React.useState(false)

    React.useEffect(() => {
        setMusic({ ...props.music })
    }, [props.open])

    return (
        <Dialog open={props.open}>
            <AddArtistDialog
                open={addArtistDialogOpen}
                onClose={() => setAddArtistDialogOpen(false)}
                onAddSuccessful={
                    addedArtist => setMusic(prev => {
                        var music = { ...prev };
                        music.artists = [...prev.artists, addedArtist];
                        return music;
                    })
                }
            />
            <DialogTitle >
                <Typography>音乐信息</Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ marginTop: "12px", display: "flex", marginBottom: '12px' }}>
                    <Typography sx={{ width: '30%' }}>音乐标题</Typography>
                    <TextField size="small" value={music.title} onChange={e => {
                        setMusic(prev => {
                            var music = { ...prev }
                            music.title = e.target.value;
                            return music;
                        })
                    }} />
                </Box>
                <Box sx={{ display: "flex", marginBottom: '12px' }}>
                    <Typography sx={{ width: '30%' }}>艺术家</Typography>
                    <Grid sx={{ flex: "1 0 0" }} >
                        {
                            music.artists.map((artist, index) => {
                                return <Chip
                                    label={artist.name}
                                    sx={{ margin: "0px 2px 2px 0px" }}
                                    avatar={<Avatar>{artist.name.charAt(0)}</Avatar>}
                                    color="primary"
                                    onDelete={
                                        () => setMusic(prev => {
                                            var music = { ...prev };
                                            music.artists = music.artists.filter((oldArtist) => oldArtist.name !== artist.name);
                                            return music;
                                        })
                                    }
                                />
                            })
                        }

                        <Chip
                            sx={{ margin: "0px 2px 2px 0px" }}
                            label="添加" icon={<AddCircleOutlineOutlinedIcon />}
                            onClick={() => setAddArtistDialogOpen(true)} />
                    </Grid>
                </Box>
                <Box sx={{ display: "flex", marginBottom: '12px' }}>
                    <Typography sx={{ width: '30%', flex: "0 0 auto" }}>文件</Typography>
                    <Button variant='outlined' size='small' disabled>上传音乐</Button>

                </Box>
                <Box sx={{ display: "flex", marginTop: '6px', marginBottom: '6px' }}>
                    <Typography variant="caption" sx={{ marginBottom: '12px' }} >{`原始艺术家信息：${props.music.sourceArtistTag}`}</Typography>

                </Box>

                {
                    !props.usingCue &&
                    <Box sx={{ display: "flex", marginBottom: '12px' }}>
                        <Typography variant="caption" >{`文件路径：${music.path}`}</Typography>
                    </Box>
                }




            </DialogContent>
            <DialogActions>
                <Button variant="contained" size='small' onClick={() => {
                    props.onUpdate(music)
                    props.onClose()
                }}>保存</Button>
                <Button variant='outlined' size='small' onClick={() => props.onClose()}>取消</Button>

            </DialogActions>
        </Dialog>

    )
}

function AlbumEdit() {
    const theme = useTheme();
    const router = useRouter();
    //专辑标题
    const [title, setTitle] = React.useState("")
    const [cover, setCover] = React.useState<Blob>(null)
    //专辑艺术家列表
    const [albumArtists, setAlbumArtists] = React.useState<ArtistVo[]>([]);
    const [albumArtistTag, setAlbumArtistTag] = React.useState("")
    //艺术家对话框相关
    const [addArtistDialogOpen, setAddArtistDialogOpen] = React.useState(false)
    //音乐信息编辑对话框相关
    const [musicDialogOpen, setMusicDialogOpen] = React.useState(false)
    const [musicDialogMusic, setMusicDialogMusic] = React.useState<IMusic>(null);
    const [musicDialogMusicIndex, setMusicDialogMusicIndex] = React.useState(0);
    const [musicDialogFileIndex, setMusicDialogFileIndex] = React.useState(0);

    //音乐列表
    const [musicList, setMusicList] = React.useState<IMusic[]>([])
    //文件input
    const musicFileRef = React.useRef<HTMLInputElement>(null)
    const cueFileRef = React.useRef<HTMLInputElement>(null)

    const [transfering, setTransfering] = React.useState<boolean>(false);

    //cue模式
    const [usingCue, setUsingCue] = React.useState(false);
    const [fileList, setFileList] = React.useState<ICueMusicFile[]>([]);

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


                if (metadata.common.picture !== undefined && cover === null) {
                    const coverBlob = new Blob([metadata.common.picture[0].data], { type: metadata.common.picture[0].format })
                    console.log(coverBlob)
                    setCover(coverBlob)
                }

                var artists: ArtistVo[] = []
                var sourceArtistTag = ''
                if (metadata.common.artists !== undefined) {
                    sourceArtistTag = metadata.common.artists.join(' ')
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
                        artists = parsePeformers(artistsString)

                    }
                }

                const music: IMusic = {
                    musicId: null,
                    title: metadata.common.title || '',
                    artists: artists,
                    path: file.path,
                    file: file,
                    sourceArtistTag: sourceArtistTag,
                    loaded: 0,
                    total: file.size
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

    const parseMinutesToHoursMinutes = (minutes: number): string => {
        return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`
    }

    const onPickCue = async () => {
        cueFileRef.current.click();
        cueFileRef.current.onchange = async () => {
            setUsingCue(true);
            const cueFiles = cueFileRef.current.files;
            if (cueFiles !== null && cueFiles.length !== 0) {
                const cueFile = cueFiles[0];
                console.log(cueFile.path)
                const data = await window.electronAPI.music.parseCue(cueFile.path);
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

                setTitle(data.title)
                setAlbumArtists(parsePeformers(data.performer))


                data.files.forEach(file => {
                    console.log("in file: ", file.name)
                    var tracks: IMusic[] = []
                    file.tracks.forEach(track => {
                        var index01: Index = null;
                        track.indexes.forEach(index => {
                            if (index.number === 1) {
                                index01 = index;
                            }
                        })

                        if (index01 === null) {
                            if (track.indexes.length === 0) {
                                pushToast("无法查找到音乐的起始时间", 'error')
                                console.log(data);
                                return;
                            }
                            index01 = track.indexes[0];
                        }

                        var startTime = `${parseMinutesToHoursMinutes(index01.time.min)}:${index01.time.sec.toString().padStart(2, '0')}.${index01.time.frame.toString().padStart(2, '0')}`;

                        if (tracks.length !== 0) {
                            tracks[tracks.length - 1].endTime = startTime;
                        }

                        var musicInfo: IMusic = {
                            musicId: null,
                            file: null,
                            path: null,
                            title: track.title,
                            translatedTitle: "",
                            artists: parsePeformers(track.performer).map(artistVo => artistVo.name).map((performer => ({ name: performer }))),
                            sourceArtistTag: track.performer,
                            startTime: startTime,
                            endTime: null
                        }
                        if (musicInfo.artists.length === 0) {
                            musicInfo.artists = parsePeformers(data.performer).map(artist => artist.name).map(performer => ({name: performer}));
                        }
                        tracks.push(musicInfo)
                    })
                    setFileList(prev => [...prev, { file: null, fileName: file.name, musicList: tracks }])

                    console.log(tracks)
                    tracks.forEach((track, i) => {
                        if (track.endTime !== null) {
                            console.log(`ffmpeg -i ${file.name} -vn -ss ${track.startTime} -to ${track.endTime} -metadata artist="${file.tracks[i].performer}" -metadata title="${track.title}" "${track.title}.flac"`)
                        } else {
                            console.log(`ffmpeg -i ${file.name} -vn -ss ${track.startTime} -metadata artist="${file.tracks[i].performer}" -metadata title="${track.title}" "${track.title}.flac"`)
                        }
                    })

                })


            }
        }
    }



    const handleSaveAlbum = async () => {
        setTransfering(true);
        var albumInfo = await AlbumControllerService.addAlbum(title, "", albumArtists.map(item => item.artistId), { frontCover: cover })
        var musicIds: number[] = []
        if (usingCue === true) {
            console.log(fileList)
            for (var i = 0; i < fileList.length; ++i) {
                var cueMusicfile = fileList[i];
                musicIds = musicIds.concat(
                    musicIds,
                    (await addMusicFromCue(
                        cueMusicfile.musicList.map(music=>({
                            title: music.title,
                            translatedTitl: music.translatedTitle,
                            artists: music.artists.map(artist=>artist.name),
                            startTime: music.startTime,
                            endTime: music.endTime
                        })),
                        cueMusicfile.file,
                        (loaded, total) => {
                            setFileList(fileList.map((val, index) => {
                                if (index === i) {
                                    val.loaded = loaded;
                                    val.total = total;
                                }
                                return val;
                            }))
                        })).data.map(music => music.musicId)
                );
            }
            await AlbumControllerService.addAlbumMusic(albumInfo.data.albumId, musicIds)
            router.push(`/album/${albumInfo.data.albumId}`)

            return;
        }

        for (var i = 0; i < musicList.length; ++i) {
            var item = musicList[i]
            musicIds.push((
                await addMusic(item.title, item.file, "", item.artists.map(artist => artist.name), (loaded, total) => {
                    setMusicList(musicList.map((val, index) => {
                        if (index === i) {
                            val.loaded = loaded;
                            val.total = total;
                        }
                        return val;
                    }))
                })).data.musicId)
        }

        await AlbumControllerService.addAlbumMusic(albumInfo.data.albumId, musicIds)
        router.push(`/album/${albumInfo.data.albumId}`)

    }

    const uploadProgressPretty = (loaded: number, total: number) => {
        if (transfering) {
            return `${(loaded / total * 100).toFixed(0)}% | ${((total - loaded) / 1024 / 1024).toFixed(2)} MB`
        }

        return `0% / ${(total / 1024 / 1024).toFixed(2)} MB`
    }

    return (
        <Box sx={{ padding: "12px 12px", overflowY: 'auto', height: '100%' }}>
            <input ref={musicFileRef} name="music_file" type="file" accept=".mp3,.flac,.ogg" multiple hidden />
            <input ref={cueFileRef} name="cue_file" type="file" accept=".cue" hidden />

            {/* 添加艺术家对话框 */}
            <AddArtistDialog
                open={addArtistDialogOpen}
                onClose={() => setAddArtistDialogOpen(false)}
                onAddSuccessful={artist => setAlbumArtists(prev => [...prev, artist])}
            />
            {/* 音乐信息对话框 */}
            {
                musicDialogMusic && !usingCue &&
                <MusicInfoDialog
                    open={musicDialogOpen}
                    music={musicDialogMusic}
                    onClose={() => setMusicDialogOpen(false)}
                    onUpdate={updatedMusic => {
                        setMusicList(prev => {
                            return prev.map((oldMusic, index) => {
                                if (index === musicDialogMusicIndex) {
                                    oldMusic = updatedMusic;
                                }
                                return oldMusic;
                            })
                        })
                    }}
                />
            }
            {
                musicDialogMusic && usingCue &&
                <MusicInfoDialog
                    usingCue
                    open={musicDialogOpen}
                    music={musicDialogMusic}
                    onClose={() => setMusicDialogOpen(false)}
                    onUpdate={updatedMusic => {
                        setFileList(prev => {
                            return prev.map((oldFile, index) => {
                                if (index === musicDialogFileIndex) {
                                    oldFile.musicList = oldFile.musicList.map((oldMusic, index) => {
                                        if (index === musicDialogMusicIndex) {
                                            oldMusic = updatedMusic;
                                        }
                                        return oldMusic;

                                    })
                                }
                                return oldFile;
                            })
                        })
                    }}
                />
            }

            {/* 页面标题，操作按钮 */}
            <Box sx={{ display: 'flex' }}>
                <Typography variant="h5" sx={{ width: '30%' }}>新建专辑</Typography>

                <Button variant="outlined" size='small' sx={{ margin: "auto 12px auto 0px" }} onClick={onPickCue}>读取cue文件</Button>
                <Button variant="outlined" size='small' color="success" sx={{ margin: "auto 12px" }} disabled={transfering} onClick={handleSaveAlbum}>保存专辑</Button>
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
                                return <Chip
                                    label={value.name}
                                    sx={{ margin: "0px 2px 2px 0px" }}
                                    avatar={<Avatar>{value.name.charAt(0)}</Avatar>}
                                    color="primary"
                                    onDelete={() => {
                                        setAlbumArtists(prev => prev.filter((item, index) => { return item.name !== value.name }))
                                    }} />
                            })
                        }
                        <Chip
                            sx={{ margin: "0px 2px 2px 0px" }}
                            variant="outlined"
                            label="添加"
                            icon={<AddCircleOutlineOutlinedIcon />}
                            onClick={() => setAddArtistDialogOpen(true)}
                        />
                    </Grid>
                </Box>
                {/* 封面设定 */}
                <Box sx={{ display: 'flex', marginBottom: '12px' }}>
                    <Typography sx={{ width: '30%' }}>封面</Typography>
                    <CoverInput cover={cover} onCoverChanged={newCover => setCover(newCover)} />
                </Box>

                {/* 音乐列表(非cue模式) */}
                {
                    !usingCue &&
                    <Box sx={{ display: 'flex', marginBottom: '12px' }}>
                        <Typography sx={{ width: '30%' }}>音乐列表</Typography>
                        <Button variant="outlined" size='small' onClick={onPickMusic}>添加音乐文件</Button>
                    </Box>
                }

                {
                    !usingCue &&
                    <TableContainer sx={{ width: 'auto' }}>
                        <Table sx={{ tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell width='30%' sx={{ padding: "12px 0px" }}>歌曲名称</TableCell>
                                    <TableCell width='30%' sx={{ padding: "12px 0px" }}>歌手</TableCell>
                                    <TableCell width='15%' sx={{ padding: "12px 0px" }}>音乐文件</TableCell>
                                    <TableCell width='15%' sx={{ padding: "12px 0px" }}>进度</TableCell>
                                    <TableCell width='10%' sx={{ padding: "12px 0px" }}>选项</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {
                                    musicList.map((music, index) => {
                                        return (
                                            <TableRow sx={{ ":hover": { backgroundColor: theme.palette.pannelBackground.main, cursor: 'pointer' } }} key={index}>
                                                <TableCell sx={{ width: '30%', padding: "12px 0px", paddingRight: "12px" }} >
                                                    <Typography variant='body2' noWrap>{music.title}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ padding: "12px 0px", paddingRight: "12px" }}>
                                                    <Typography variant='body2' noWrap>
                                                        {
                                                            music.artists.map(item => {
                                                                if (item.translateName && item.translateName.length !== 0) {
                                                                    return `${item.name}(${item.translateName})`;
                                                                }
                                                                return item.name;
                                                            }
                                                            ).join(" / ")
                                                        }
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ padding: "12px 0px", paddingRight: "12px" }}>
                                                    <Typography variant='body2' noWrap>{music.path}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ padding: "12px 0px", paddingRight: "12px" }}>
                                                    <Typography noWrap variant='body2'>{uploadProgressPretty(music.loaded, music.total)}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ padding: "12px 0px", paddingRight: "12px" }}>
                                                    <Box sx={{ display: 'flex' }}>
                                                        <Button
                                                            size='small'
                                                            sx={{ padding: 0, minWidth: 0 }}
                                                            onClick={() => {
                                                                setMusicDialogMusic(music);
                                                                setMusicDialogMusicIndex(index);
                                                                setMusicDialogOpen(true);
                                                            }}
                                                        >
                                                            <EditOutlinedIcon />
                                                        </Button>
                                                        <Button size='small' sx={{ padding: 0, minWidth: 0, marginLeft: '2px' }} onClick={() => setMusicList(musicList.filter((val, itemIndex) => itemIndex !== index))}><DeleteOutlineOutlinedIcon /></Button>
                                                    </Box>
                                                </TableCell>

                                            </TableRow>
                                        )
                                    })
                                }
                            </TableBody>
                        </Table>
                        <Box sx={[{ height: "96px", width: "100%", display: "flex" }, musicList.length !== 0 && { display: "none" }]}>
                            <Typography sx={{ margin: "auto auto" }} >暂无音乐，点击上方按钮添加音乐</Typography>
                        </Box>
                    </TableContainer>
                }

                {
                    usingCue &&
                    <>
                        <Divider sx={{ display: 'flex', marginBottom: '12px' }} />
                        {
                            fileList.map(file => {
                                return (
                                    <>
                                        <Box sx={{ display: 'flex' }}>
                                            <Typography sx={{ width: '30%' }} variant="subtitle2">音乐文件 {file.fileName}</Typography>
                                            <Button variant="outlined" size='small' onClick={
                                                (event: React.MouseEvent<HTMLButtonElement>) => {
                                                    var fileInput = document.createElement("input");
                                                    fileInput.type = "file";
                                                    fileInput.accept = ".flac,.wav,.mp3,.tak"
                                                    fileInput.onchange = () => {
                                                        setFileList(prev => prev.map(prevFile => {
                                                            if (prevFile.fileName === file.fileName) {
                                                                prevFile.file = fileInput.files[0];
                                                                prevFile.loaded = 0;
                                                                prevFile.total = fileInput.files[0].size;
                                                            }
                                                            return prevFile;
                                                        }))

                                                        var target = event.target as HTMLButtonElement;
                                                        target.innerText = "已选择文件" + fileInput.files[0].name;
                                                    }
                                                    fileInput.click();
                                                }
                                            }>选择音乐文件</Button>
                                            <Typography noWrap variant='body2' sx={[{ margin: "auto 12px" }, file.file === null && { display: 'none' }]} >{uploadProgressPretty(file.loaded, file.total)}</Typography>

                                        </Box>
                                        <TableContainer sx={{ width: 'auto' }}>
                                            <Table sx={{ tableLayout: 'fixed' }}>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell width='30%' sx={{ padding: "12px 0px" }}>歌曲名称</TableCell>
                                                        <TableCell width='30%' sx={{ padding: "12px 0px" }}>歌手</TableCell>
                                                        <TableCell width='10%' sx={{ padding: "12px 0px" }}>选项</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {
                                                        file.musicList.map((music, index) => {
                                                            return (
                                                                <TableRow sx={{ ":hover": { backgroundColor: theme.palette.pannelBackground.main, cursor: 'pointer' } }} key={index}>
                                                                    <TableCell sx={{ width: '30%', padding: "12px 0px", paddingRight: "12px" }} >
                                                                        <Typography variant='body2' noWrap>{music.title}</Typography>
                                                                    </TableCell>
                                                                    <TableCell sx={{ padding: "12px 0px", paddingRight: "12px" }}>
                                                                        <Typography variant='body2' noWrap>
                                                                            {
                                                                                music.artists.map(item => {
                                                                                    if (item.translateName && item.translateName.length !== 0) {
                                                                                        return `${item.name}(${item.translateName})`;
                                                                                    }
                                                                                    return item.name;
                                                                                }
                                                                                ).join(" / ")
                                                                            }
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell sx={{ padding: "12px 0px", paddingRight: "12px" }}>
                                                                        <Box sx={{ display: 'flex' }}>
                                                                            <Button size='small' sx={{ padding: 0, minWidth: 0 }} onClick={()=>{
                                                                                setMusicDialogMusic(music);
                                                                                setMusicDialogMusicIndex(index);
                                                                                setMusicDialogOpen(true);
                                                                            }} ><EditOutlinedIcon /></Button>
                                                                            <Button size='small' sx={{ padding: 0, minWidth: 0, marginLeft: '2px' }} onClick={() => setMusicList(musicList.filter((val, itemIndex) => itemIndex !== index))}><DeleteOutlineOutlinedIcon /></Button>
                                                                        </Box>
                                                                    </TableCell>

                                                                </TableRow>
                                                            )
                                                        })
                                                    }
                                                </TableBody>
                                            </Table>

                                        </TableContainer>
                                    </>
                                )
                            })
                        }
                    </>
                }

            </Box>
        </Box>
    )
}

export default AlbumEdit;