import { Popover, Paper, Button, Divider, Popper, ClickAwayListener, Typography } from '@mui/material';
import { useTheme } from '@mui/styles';
import router from 'next/router';
import React from 'react'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined';
import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import { IChangePlayListEvent, IEnqueueNextEvent, IMusicInfo } from '@components/MusicControlPannel/MusicControlPannel';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import { ApiError, LyricControllerService, PlaylistControllerService, PlaylistVo } from '@api/codegen';
import { pushToast } from '@components/HeiMusicMainLayout';
import NewPlaylisitDialog from '@components/NewPlaylistDialog';

export interface IMusicContextMenuAnchorPostion {
    top: number,
    left: number
}

export interface IMusicContextMenuMusicInfo {
    albumTitle: string,
    albumId: number,
    musicTitle: string,
    musicId: number,
    index: number,
    isFavorite: boolean,
    isInstrumental?: boolean,
}

export interface UseMusicContextMenuProps {
    musicList: IMusicInfo[],
    menuType: 'album' | 'playlist' | 'favorite',
    onPlaylistMusicDelete?: (musicIdList: number[]) => void
}

/**
 * 获取音乐菜单
 * 使用方法：const [MusicContextMenu, popupMusicContextMenu, musicMenuOpen, musicMenuInfo] = useMusicContextMenu(musicList)
 * 
 * @param props 音乐列表
 * @returns 菜单组件与显示菜单的调用函数
 */
export default function useMusicContextMenu(props: UseMusicContextMenuProps): [
    React.ReactNode,
    (anchorPosition: IMusicContextMenuAnchorPostion, index: number) => void,
    boolean,
    IMusicContextMenuMusicInfo
] {
    const theme = useTheme();
    //音乐右键菜单
    const [musicMenuOpen, setMusicMenuOpen] = React.useState(false);
    const [musicMenuPos, setMusicMenuPos] = React.useState<IMusicContextMenuAnchorPostion>({
        top: 0,
        left: 0
    });
    const [musicMenuInfo, setMusicMenuInfo] = React.useState<IMusicContextMenuMusicInfo>({
        albumTitle: "",
        albumId: 0,
        musicTitle: "",
        musicId: 0,
        index: 0,
        isFavorite: false
    });

    //歌单二级菜单
    var closeHandle = null;
    const [playlistMenuOpen, setPlaylistMenuOpen] = React.useState(false);
    const [playlistInfoList, setPlaylistInfoList] = React.useState<PlaylistVo[]>([]);
    const addButtonRef = React.useRef(null);
    //创建歌单对话框
    const [createPlaylistDialogOpen, setCreatePlaylistDialogOpen] = React.useState(false);
    //删除操作（移除歌单内的音乐）
    var handlePlaylistMusicDelete: (musicIdList: number[]) => void = null;

    const handleContextMenuPlay = () => {
        const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
            detail: {
                playlist: props.musicList,
                startIndex: musicMenuInfo.index
            }
        });
        document.dispatchEvent(event)
    }

    const handleContextMenuPlayNext = () => {
        const event = new CustomEvent<IEnqueueNextEvent>("music-control-panel::enqueueNext", {
            detail: {
                musicList: [props.musicList[musicMenuInfo.index]]
            }
        });
        document.dispatchEvent(event)
    }

    //从 LRCLIB 手动拉取当前曲目歌词；拉取永远不会覆盖已有歌词，人工数据优先
    const handleContextMenuFetchLyric = () => {
        LyricControllerService.fetchFromLrclib(musicMenuInfo.musicId)
            .then(res => {
                const outcome = res.data?.outcome;
                switch (outcome) {
                    case 'created': pushToast("歌词拉取成功", 'success'); break;
                    case 'instrumental': pushToast("该曲目为纯音乐，无歌词", 'info'); break;
                    case 'not_found': pushToast("LRCLIB 暂无此曲，后台补录后可重试", 'info'); break;
                    default: pushToast("已处理", 'info'); break;
                }
            })
            .catch((error: ApiError) => {
                const code = error.body?.code;
                if (code === 5005) pushToast("该曲目已有歌词，无需拉取", 'info')
                else if (code === 429 || error.status === 429) pushToast("请求过于频繁，请稍后重试", 'warning')
                else pushToast(error.message)
            })
    }

    // const MusicContextMenu = (
    //     <ClickAwayListener onClickAway={() => { setMusicMenuOpen(false) }}>

    //         <Popper
    //             open={musicMenuOpen}
    //             placement='bottom-start'
    //             anchorEl={{
    //                 getBoundingClientRect: (): ClientRect => {
    //                     return ({
    //                         width: 0,
    //                         height: 0,
    //                         top: musicMenuPos.top,
    //                         right: musicMenuPos.left,
    //                         bottom: musicMenuPos.top,
    //                         left: musicMenuPos.left,
    //                         x: 0,
    //                         y: 0,
    //                         toJSON() {

    //                         },
    //                     })
    //                 }
    //             }}
    //             onContextMenu={e => {
    //                 e.preventDefault();
    //                 setMusicMenuOpen(false);
    //             }}
    //         >
    //             <Paper sx={{ display: 'flex', flexDirection: 'column', width: "160px", backgroundColor: theme.palette.pannelBackground.main }}
    //                 onClick={() => setMusicMenuOpen(false)}
    //             >
    //                 <Button
    //                     sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
    //                     color='inherit'
    //                     startIcon={<PlayCircleFilledWhiteOutlinedIcon />}
    //                     onClick={handleContextMenuPlay}
    //                     size='small'
    //                 >
    //                     播放
    //                 </Button>
    //                 <Button
    //                     sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
    //                     color='inherit'
    //                     startIcon={<LibraryMusicOutlinedIcon />}
    //                     onClick={handleContextMenuPlayNext}
    //                     size='small'

    //                 >
    //                     下一首播放
    //                 </Button>
    //                 <Divider />
    //                 {
    //                     musicMenuInfo.isFavorite &&
    //                     <Button
    //                         sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
    //                         color='inherit'
    //                         startIcon={<FavoriteOutlinedIcon />}
    //                         onClick={() => { }}
    //                         size='small'

    //                     >
    //                         收藏
    //                     </Button>
    //                 }
    //                 {
    //                     !musicMenuInfo.isFavorite &&
    //                     <Button
    //                         sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
    //                         color='inherit'
    //                         startIcon={<FavoriteBorderOutlinedIcon />}
    //                         onClick={() => { }}
    //                         size='small'

    //                     >
    //                         收藏
    //                     </Button>
    //                 }
    //                 <Button
    //                     sx={{ justifyContent: 'flex-start', padding: "6px 16px", ".MuiButton-endIcon": { marginLeft: 'auto', marginRight: '0px' } }}
    //                     color='inherit'
    //                     startIcon={<PlaylistAddRoundedIcon />}
    //                     endIcon={<NavigateNextRoundedIcon />}
    //                     onClick={() => { }}
    //                     onMouseEnter={() => {
    //                         PlaylistControllerService.getCreatedPlaylistInfo()
    //                             .then(res => {
    //                                 setPlaylistInfoList(res.data);
    //                                 setPlaylistMenuOpen(true)

    //                             })
    //                     }}
    //                     onMouseLeave={() => {
    //                         setPlaylistMenuOpen(false)

    //                     }}
    //                     size='small'
    //                     ref={addButtonRef}
    //                 >
    //                     添加到
    //                 </Button>
    //                 <Divider />

    //                 <Button
    //                     sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
    //                     color='inherit'
    //                     startIcon={<MenuOutlinedIcon />}
    //                     onClick={() => { router.push(`/album/edit/${musicMenuInfo.albumId}`) }}
    //                     size='small'
    //                     onMouseEnter={() => {
    //                         setPlaylistMenuOpen(false);
    //                     }}
    //                 >
    //                     复制音乐信息
    //                 </Button>
    //                 <Button
    //                     sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
    //                     color='inherit'
    //                     startIcon={<DeleteSweepOutlinedIcon />}
    //                     onClick={() => { router.push(`/album/edit/${musicMenuInfo.albumId}`) }}
    //                     size='small'
    //                 >
    //                     删除
    //                 </Button>

    //             </Paper>
    //             {/* 二级菜单 */}
    //             <Popper
    //                 open={playlistMenuOpen}
    //                 anchorEl={addButtonRef.current}
    //                 placement="right"
    //             >
    //                 <Paper
    //                     sx={{ display: 'flex', flexDirection: 'column', width: "160px", backgroundColor: theme.palette.pannelBackground.main }}
    //                     onMouseEnter={() => setPlaylistMenuOpen(true)}
    //                     onMouseLeave={() => setPlaylistMenuOpen(false)} >
    //                     {
    //                         playlistInfoList.map((playlist, index) => {
    //                             return (
    //                                 <Button
    //                                     sx={{ justifyContent: 'flex-start', padding: "6px 16px", ".MuiButton-endIcon": { marginLeft: 'auto', marginRight: '0px' } }}
    //                                     color='inherit'
    //                                     onClick={() => {
    //                                         PlaylistControllerService.addPlaylistMusic({ playlistId: playlist.playlistId, musicIdList: [musicMenuInfo.musicId] })
    //                                             .then(res => {
    //                                                 setPlaylistMenuOpen(false)
    //                                                 setMusicMenuOpen(false);
    //                                                 pushToast("添加至歌单成功", 'success')
    //                                             })
    //                                             .catch((error: ApiError) => {
    //                                                 pushToast(error.message)
    //                                             })
    //                                     }}
    //                                     size='small'
    //                                 >
    //                                     <Typography noWrap variant='body2'>{playlist.title}</Typography>
    //                                 </Button>
    //                             )
    //                         })
    //                     }
    //                 </Paper>
    //             </Popper>
    //         </Popper>
    //     </ClickAwayListener>
    // )

    const customizedScrollBarStyle = {
        '::-webkit-scrollbar': {
            width: '6px',
            height: ' 8px',
            backgroundColor: '#e3e3e3', /* or add it to the track */
            borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb': {
            background: '#aaa',
            borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
            background: '#7c7c7c',
            borderRadius: '4px',
        },
        '::-webkit-scrollbar-track': {

        }


    }

    const PopoverContextMenu = (
        <Popover
            open={musicMenuOpen}
            onClose={() => {
                setMusicMenuOpen(false);
                setPlaylistMenuOpen(false);
            }}
            anchorPosition={{ top: musicMenuPos.top, left: musicMenuPos.left }}
            anchorReference='anchorPosition'
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
                        取消收藏
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
                    onClick={e => { e.stopPropagation(); }}
                    onMouseEnter={() => {
                        if (closeHandle !== null) {
                            clearTimeout(closeHandle);
                        }
                        closeHandle = setTimeout(() => {
                            PlaylistControllerService.getCreatedPlaylistInfo()
                                .then(res => {
                                    setPlaylistInfoList(res.data);
                                    setPlaylistMenuOpen(true)

                                })
                            clearTimeout(closeHandle);
                            closeHandle = null;
                        }, 300)

                    }}
                    onMouseLeave={() => {
                        if (closeHandle !== null) {
                            clearTimeout(closeHandle);
                            closeHandle = null;
                        }
                    }}

                    size='small'
                    ref={addButtonRef}
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
                    onMouseEnter={() => {
                        setPlaylistMenuOpen(false);
                    }}
                >
                    复制音乐信息
                </Button>
                {/* 从 LRCLIB 拉取歌词；纯音乐没有歌词，禁用该项 */}
                <Button
                    sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                    color='inherit'
                    startIcon={<CloudDownloadOutlinedIcon />}
                    onClick={handleContextMenuFetchLyric}
                    disabled={musicMenuInfo.isInstrumental === true}
                    size='small'
                    onMouseEnter={() => {
                        setPlaylistMenuOpen(false);
                    }}
                >
                    拉取歌词
                </Button>
                {
                    props.menuType === 'album' &&
                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                        color='inherit'
                        startIcon={<EditNoteOutlinedIcon />}
                        onClick={() => { router.push(`/album/edit/${musicMenuInfo.albumId}`) }}
                        size='small'
                        onMouseEnter={() => {
                            setPlaylistMenuOpen(false);
                        }}
                    >
                        编辑
                    </Button>
                }
                {
                    props.menuType === 'playlist' &&
                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                        color='inherit'
                        startIcon={<DeleteSweepOutlinedIcon />}
                        onClick={() => props.onPlaylistMusicDelete([musicMenuInfo.musicId])}
                        size='small'
                    >
                        从歌单中删除
                    </Button>
                }

            </Paper>
            {/* 二级菜单 */}
            <Popover
                open={playlistMenuOpen}
                onClose={() => {
                    setPlaylistMenuOpen(false);
                    setCreatePlaylistDialogOpen(false);
                }}
                anchorEl={addButtonRef.current}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ ".MuiPaper-root": { ...customizedScrollBarStyle }, WebkitAppRegion: 'no-drag' }}
            >
                <Paper
                    sx={{ display: 'flex', flexDirection: 'column', width: "160px", backgroundColor: theme.palette.pannelBackground.main, }}
                    onMouseEnter={() => setPlaylistMenuOpen(true)}
                >
                    {/* 添加歌单对话框 */}
                    <NewPlaylisitDialog
                        open={createPlaylistDialogOpen}
                        musicIdList={[musicMenuInfo.musicId]}
                        onClose={() => setCreatePlaylistDialogOpen(false)}
                        onSaved={(playlistId: number) => {
                            setMusicMenuOpen(false);
                            setPlaylistMenuOpen(false);
                        }}
                    />

                    <Button
                        sx={{
                            justifyContent: 'flex-start',
                            padding: "6px 16px",
                            ".MuiButton-endIcon": {
                                marginLeft: 'auto',
                                marginRight: '0px'
                            }
                        }}
                        color='inherit'
                        startIcon={<AddBoxRoundedIcon />}
                        onClick={() => {
                            setCreatePlaylistDialogOpen(true);
                        }}
                    >
                        添加到新歌单
                    </Button>
                    <Divider />

                    {
                        playlistInfoList.map((playlist, index) => {
                            return (
                                <Button
                                    key={index}
                                    sx={{ justifyContent: 'flex-start', padding: "6px 16px", ".MuiButton-endIcon": { marginLeft: 'auto', marginRight: '0px' }, textTransform: 'none' }}
                                    color='inherit'
                                    onClick={() => {
                                        PlaylistControllerService.addPlaylistMusic({ playlistId: playlist.playlistId, musicIdList: [musicMenuInfo.musicId] })
                                            .then(res => {
                                                setPlaylistMenuOpen(false)
                                                setMusicMenuOpen(false);
                                                pushToast("添加至歌单成功", 'success')
                                            })
                                            .catch((error: ApiError) => {
                                                pushToast(error.message)
                                            })
                                    }}
                                    size='small'
                                >
                                    <Typography noWrap variant='body2'>{playlist.title}</Typography>
                                </Button>
                            )
                        })
                    }
                </Paper>
            </Popover>
        </Popover>
    )

    const popupMusicContextMenu = (anchorPosition: IMusicContextMenuAnchorPostion, index: number) => {
        setMusicMenuOpen(true);
        setPlaylistMenuOpen(false);
        setMusicMenuPos(anchorPosition);
        setMusicMenuInfo({
            albumTitle: props.musicList[index].albumTitle,
            albumId: props.musicList[index].albumId,
            musicTitle: props.musicList[index].title,
            musicId: props.musicList[index].musicId,
            index: index,
            isFavorite: props.musicList[index].isFavorite,
            isInstrumental: props.musicList[index].isInstrumental,
        });
    }
    return [PopoverContextMenu, popupMusicContextMenu, musicMenuOpen, musicMenuInfo]
}