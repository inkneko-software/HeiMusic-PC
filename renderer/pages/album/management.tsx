import { Box, Button, Stack, Typography, Avatar, IconButton, Popover, PopoverProps, Divider, Dialog, DialogActions, DialogTitle, DialogContent } from "@mui/material";

import Link from "next/link";
import React from "react"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add'
import TablePagination from '@mui/material/TablePagination';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import CardMedia from "@mui/material/CardMedia";
import { useTheme } from '@mui/styles'
import { AlbumControllerService, AlbumVo, ApiError } from "@api/codegen";
import { pushToast } from "@components/HeiMusicMainLayout";
import ImageSkeleton from "@components/Common/ImageSkeleton";
import { useRouter } from "next/router";
import MusicVideoOutlinedIcon from '@mui/icons-material/MusicVideoOutlined';
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IChangePlayListEvent } from "@components/MusicControlPannel/MusicControlPannel";
function AlbumManagement() {
    const router = useRouter();
    const theme = useTheme()
    const [total, setTotal] = React.useState(0);
    const [page, setPage] = React.useState(1);
    const [rowsPerPage, setRowsPerPage] = React.useState(25);
    const [albumList, setAlbumList] = React.useState<AlbumVo[]>([]);

    const tableRef = React.useRef<HTMLDivElement>(null);

    //专辑右键菜单
    const [albumMenuOpen, setAlbumMenuOpen] = React.useState(false);
    const [albumMenuPos, setAlbumMenuPos] = React.useState({ top: 0, left: 0 })
    const [albumMenuInfo, setAlbumMenuInfo] = React.useState({ title: "", albumId: 0 })
    //删除专辑确认对话框
    const [deleteAlbumConfirmDialogOpen, setDeleteAlbumConfirmDialogOpen] = React.useState(false);
    React.useEffect(() => {
        const { p, s } = router.query;
        var page: number;
        var size: number;
        if (p !== undefined && s !== undefined) {
            console.log(p, s)
            page = parseInt(p as string);
            size = parseInt(s as string)

            setPage(page);
            setRowsPerPage(size);


        } else {
            page = 1;
            size = 25;
        }

        AlbumControllerService.getAlbumList(page, size)
            .then(res => {
                setTotal(res.data.total);
                setAlbumList(res.data.albumList);
            })
            .catch((error: ApiError) => {
                pushToast(error.message)
            })

    }, [router.query])

    const handleChangePage = (event: unknown, newPage: number) => {
        //分页组件的起始页为0，但后端的起始页为1，手动修正
        router.push(`/album/management?p=${newPage + 1}&s=${rowsPerPage}`)
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        //tableRef.current.scrollTo({left:0, top: 0});
        var newPageRange: number = parseInt(event.target.value);
        router.push(`/album/management?p=${1}&s=${newPageRange}`)
    };

    const handleMenuPlayAlbum = (albumId: number) => {
        (async () => {
            try {
                var albumInfo = (await AlbumControllerService.getAlbum(albumId)).data;

                var playlist = (await AlbumControllerService.getAlbumMusicList(albumId)).data.map((music, index) => {
                    return {
                        musicId: music.musicId,
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
                        duration: music.duration,
                        isFavorite: music.isFavorite
                    }
                });

                if (playlist.length !== 0) {
                    const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
                        detail: {
                            playlist: playlist,
                            startIndex: 0
                        }
                    });
                    document.dispatchEvent(event)
                }

            } catch (error) {
                var apiError = error as ApiError;
                pushToast(apiError.message, 'error');
            }
        })()

    }

    const handleDeleteAlbum = async function () {
        try {
            await AlbumControllerService.removeAlbum(albumMenuInfo.albumId)
            AlbumControllerService.getAlbumList(page, rowsPerPage)
                .then(res => {
                    setTotal(res.data.total);
                    setAlbumList(res.data.albumList);
                    setDeleteAlbumConfirmDialogOpen(false)
                })
                .catch((error: ApiError) => {
                    pushToast(error.message)
                })
        } catch (e) {
            pushToast(e.message)
        }

    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}  >
            <Box sx={{ position: "sticky", top: '0' }}>
                <Stack direction="row" sx={{ flex: "0 0 auto" }}>
                    <Typography variant='h5' sx={{ margin: "auto 0px auto 12px" }}>专辑管理</Typography>
                    <Link href="/album/upload" passHref>
                        <Button sx={{ margin: "auto 6px auto auto", display: "flex" }} color="info" startIcon={<AddBoxRoundedIcon />}>创建</Button>
                    </Link>

                    <TablePagination
                        sx={{ margin: "auto 0px auto 0px" }}
                        rowsPerPageOptions={[10, 25, 100]}
                        component="div"
                        count={total}
                        rowsPerPage={rowsPerPage}
                        page={page - 1} //组件起始页数为0
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="每页行数"
                        labelDisplayedRows={({ from, to, count }) => `第${page}页 ${from}-${to} 共 ${count !== -1 ? count : `超过 ${to}`} 个`}
                    />
                </Stack>

            </Box>
            {/* 删除专辑确认对话框 */}
            <Dialog open={deleteAlbumConfirmDialogOpen} onClose={() => setDeleteAlbumConfirmDialogOpen(false)}>
                <DialogTitle>确认删除当前专辑？</DialogTitle>
                <DialogContent>
                    <Typography>专辑标题：{albumMenuInfo.title}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteAlbum}>确认</Button>
                    <Button onClick={() => setDeleteAlbumConfirmDialogOpen(false)}>取消</Button>
                </DialogActions>
            </Dialog>

            {/* 表头 */}
            <TableRow sx={{ display: "table" }}>
                <TableCell width="15%" >专辑封面</TableCell>
                <TableCell width="35%" >专辑标题</TableCell>
                <TableCell width="30%">艺术家</TableCell>
                <TableCell width="10%" >曲数</TableCell>
                <TableCell width="10%" >操作</TableCell>
            </TableRow>
            {/* 表格 */}
            <TableContainer sx={{ overflowY: "auto", overflowX: "hidden", width: "auto" }} ref={tableRef}>
                <Table sx={{ tableLayout: 'fixed', margin: "0px 6px", ".MuiTableCell-root": { padding: "10px 16px" } }} >
                    <TableBody >
                        {
                            albumList.map((album, index) => (
                                <TableRow
                                    key={album.albumId}
                                    sx={[{ ':hover': { background: theme.palette.pannelBackground.main } }, albumMenuOpen && albumMenuInfo.albumId === album.albumId && { background: theme.palette.pannelBackground.main }]}
                                    onContextMenu={e => {
                                        setAlbumMenuOpen(true);
                                        setAlbumMenuPos({ left: e.clientX, top: e.clientY });
                                        setAlbumMenuInfo({ title: album.title, albumId: album.albumId });
                                    }}
                                >
                                    <TableCell sx={{ width: "15%", borderBottom: "unset" }} align="center">
                                        <ImageSkeleton sx={{
                                            width: '32px', height: '32px', borderRadius: '6%', flex: "0 0 auto", marginLeft: "12px", imageRendering: "auto", objectFit: "contain"
                                        }} src={album.frontCoverUrl !== null ? album.frontCoverUrl + "?s=@w32h32" : null} />

                                        {/* <CardMedia sx={{
                                            width: '32px', height: '32px', borderRadius: '6%', flex: "0 0 auto", marginLeft: "12px", imageRendering: "auto", objectFit: "contain"
                                        }} src={album.frontCoverUrl !== null ? album.frontCoverUrl + "?s=@w32h32" : "/images/akari.jpg"} component="img"></CardMedia> */}
                                    </TableCell>
                                    <TableCell sx={{ width: "35%", borderBottom: "unset" }}>
                                        <Link href={`/album/${album.albumId}`}>
                                            <Typography variant="body2" noWrap sx={{ ":hover": { cursor: "pointer", color: theme.palette.primary.main } }} title={album.title} >{album.title}</Typography>
                                        </Link>
                                    </TableCell>
                                    <TableCell sx={{ width: "30%", borderBottom: "unset" }}>
                                        <Typography variant="body2" noWrap>{album.artistList.map((v, i) => v.name).join('/')}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ width: "10%", borderBottom: "unset" }}>{album.musicNum}</TableCell>
                                    <TableCell sx={{ width: "10%", borderBottom: "unset" }}>
                                        <IconButton
                                            size='small'
                                            sx={{ padding: '0 0' }}
                                            onClick={e => {
                                                setAlbumMenuOpen(true);
                                                setAlbumMenuPos({ left: e.clientX, top: e.clientY });
                                                setAlbumMenuInfo({ title: album.title, albumId: album.albumId });
                                            }}
                                        >
                                            <MoreHorizIcon />
                                        </IconButton>


                                    </TableCell>


                                </TableRow>
                            ))
                        }
                    </TableBody>

                </Table>
            </TableContainer>
            {/* 专辑菜单 */}
            <Popover
                open={albumMenuOpen}
                anchorReference='anchorPosition'
                anchorPosition={albumMenuPos}
                onClose={() => setAlbumMenuOpen(false)}
                transitionDuration={100}
                onContextMenu={e=>{
                    e.preventDefault();
                    setAlbumMenuOpen(false);
                }}
            >
                <Paper sx={{ display: 'flex', flexDirection: 'column', width: "100px", backgroundColor: theme.palette.pannelBackground.main }}
                    onClick={() => setAlbumMenuOpen(false)}
                >
                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                        color='inherit'
                        startIcon={<PlayCircleFilledWhiteOutlinedIcon />}
                        onClick={() => handleMenuPlayAlbum(albumMenuInfo.albumId)}
                    >
                        播放
                    </Button>
                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                        color='inherit'
                        startIcon={<LibraryMusicOutlinedIcon />}
                        onClick={() => { router.push(`/album/${albumMenuInfo.albumId}`) }}
                    >
                        查看
                    </Button>
                    <Divider />
                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                        color='inherit'
                        startIcon={<EditNoteOutlinedIcon />}
                        onClick={() => { router.push(`/album/edit/${albumMenuInfo.albumId}`) }}
                    >
                        编辑
                    </Button>
                    <Button
                        sx={{ justifyContent: 'flex-start', padding: "6px 16px" }}
                        color='inherit'
                        startIcon={<DeleteForeverIcon />}
                        onClick={() => setDeleteAlbumConfirmDialogOpen(true)}
                    >
                        删除
                    </Button>
                </Paper>
            </Popover>
        </Box >
    )
}

export default AlbumManagement;