import { Box, Button, Stack, Typography, Avatar, IconButton, Popover, PopoverProps, Divider, Dialog, DialogActions, DialogTitle, DialogContent, Tooltip } from "@mui/material";

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
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { IChangePlayListEvent, IMusicInfo } from "@components/MusicControlPannel/MusicControlPannel";
import { HeiMusicUserContext } from "@components/HeiMusicMainLayout";

function AlbumManagement() {
    const router = useRouter();
    const theme = useTheme()
    //专辑管理为管理类功能：仅 root 角色可见与访问（表结构预留 admin，后端放开时在此扩展）
    const { userDetail } = React.useContext(HeiMusicUserContext);
    const isRoot = userDetail?.role === 'root';
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
        //非权限角色不发任何管理请求（nav 未返回时同样不拉取，避免无权限用户闪现空表）
        if (!isRoot) {
            return;
        }

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

    }, [router.query, isRoot])

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

                var playlist: IMusicInfo[] = (await AlbumControllerService.getAlbumMusicList(albumId)).data.map((music, index) => {
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
                        isLargeTrackMusic: music.discStartTime !== '',
                        isInstrumental: music.isInstrumental,
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

    /** 打开专辑右键菜单（桌面右键 / 更多按钮、移动端长按与更多按钮共用） */
    const openAlbumMenu = (e: React.MouseEvent, album: AlbumVo) => {
        setAlbumMenuOpen(true);
        setAlbumMenuPos({ left: e.clientX, top: e.clientY });
        setAlbumMenuInfo({ title: album.title, albumId: album.albumId });
    }

    //nav 未返回前不渲染，避免非权限用户闪现空表
    if (userDetail === null) {
        return null;
    }

    //非权限用户直达 URL 时给出提示并阻断页面
    if (!isRoot) {
        return (
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "text.secondary", userSelect: "none" }}>
                <LockOutlinedIcon sx={{ fontSize: '44px', opacity: 0.35 }} />
                <Typography variant='subtitle1'>无权访问专辑管理</Typography>
                <Typography variant='caption'>该页面仅对管理账户开放</Typography>
                <Button variant='outlined' size='small' sx={{ marginTop: '12px', textTransform: 'none' }} onClick={() => { router.push('/home') }}>返回首页</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}  >
            <Box sx={{ position: "sticky", top: '0' }}>
                {/* 移动端换行排布：标题独占一行、按钮保留文字铺开一行、分页独占一行（与专辑页移动端按钮排布一致） */}
                <Stack direction="row" sx={{ flex: "0 0 auto", '@media(max-width:600px)': { flexWrap: 'wrap' } }}>
                    <Typography variant='h5' sx={{ margin: "auto 0px auto 12px", '@media(max-width:600px)': { width: '100%' } }}>专辑管理</Typography>
                    {/* 歌词拉取任务页入口 */}
                    <Link href="/lyric/fetchlog" passHref>
                        <Button sx={{ margin: "auto 0px auto 12px", '@media(max-width:600px)': { margin: '0px auto 0px 12px' } }} color="info" startIcon={<CloudDownloadOutlinedIcon />}>歌词拉取</Button>
                    </Link>
                    {/* 曲库扫描入口：日志接口未就绪，先禁用占位 */}
                    <Tooltip title="后端扫描日志接口未就绪，敬请期待">
                        <span style={{ display: "inline-flex" }}>
                            <Button sx={{ margin: "auto 0px auto 6px", '@media(max-width:600px)': { margin: '0px auto 0px 0px' } }} disabled startIcon={<AutorenewOutlinedIcon />}>曲库扫描</Button>
                        </span>
                    </Tooltip>
                    <Link href="/album/upload" passHref>
                        <Button sx={{ margin: "auto 6px auto auto", display: "flex", '@media(max-width:600px)': { margin: '0px 12px 0px 0px' } }} color="info" startIcon={<AddBoxRoundedIcon />}>创建</Button>
                    </Link>

                    <TablePagination
                        sx={{
                            margin: "auto 0px auto 0px",
                            '@media(max-width:600px)': {
                                //根元素默认 overflow:auto，窄屏下内容溢出会产生横向滚动条
                                width: 'calc(100% - 12px)',
                                margin: '0px 0px 4px 12px',
                                overflow: 'hidden',
                                //去掉 MUI 自带的 flex:1 1 100% 占位块（它会让文字在左侧大量留白时仍被按比例压缩省略），
                                //改为文字贴左、箭头贴右的两端布局；文字仅极端窄屏才收缩省略
                                '.MuiTablePagination-toolbar': { paddingLeft: '0px', minHeight: '40px', justifyContent: 'space-between' },
                                '.MuiTablePagination-spacer': { display: 'none' },
                                '.MuiTablePagination-displayedRows': { flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                                '.MuiTablePagination-actions': { marginLeft: '0px' },
                            }
                        }}
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
            {/* 专辑菜单 */}
            <Popover
                open={albumMenuOpen}
                anchorReference='anchorPosition'
                anchorPosition={albumMenuPos}
                onClose={() => setAlbumMenuOpen(false)}
                transitionDuration={100}
                onContextMenu={e => {
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
            {/* 表头（桌面端；移动端隐藏，由移动端列表自行呈现） */}
            <TableRow sx={{ display: "table", '@media(max-width:600px)': { display: 'none' } }}>
                <TableCell width="15%" >专辑封面</TableCell>
                <TableCell width="35%" >专辑标题</TableCell>
                <TableCell width="30%">艺术家</TableCell>
                <TableCell width="10%" >曲数</TableCell>
                <TableCell width="10%" >操作</TableCell>
            </TableRow>
            {/* 表格（桌面端） */}
            <TableContainer sx={{ overflowY: "auto", overflowX: "hidden", width: "auto", '@media(max-width:600px)': { display: 'none' } }} ref={tableRef}>
                <Table sx={{ tableLayout: 'fixed', margin: "0px 6px", ".MuiTableCell-root": { padding: "10px 16px" } }} >
                    <TableBody >
                        {
                            albumList.map((album, index) => (
                                <TableRow
                                    key={album.albumId}
                                    sx={[{ ':hover': { background: theme.palette.pannelBackground.main } }, albumMenuOpen && albumMenuInfo.albumId === album.albumId && { background: theme.palette.pannelBackground.main }]}
                                    onContextMenu={e => {
                                        e.preventDefault();
                                        openAlbumMenu(e, album);
                                    }}
                                >
                                    <TableCell sx={{ width: "15%", borderBottom: "unset" }} align="center">
                                        <ImageSkeleton sx={{
                                            width: '32px', height: '32px', borderRadius: '6%', flex: "0 0 auto", marginLeft: "12px", imageRendering: "auto", objectFit: "contain"
                                        }} src={album.frontCoverUrl !== null ? album.frontCoverUrl + "?s=@w64h64" : null} />

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
                                            onClick={e => openAlbumMenu(e, album)}
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
            {/* 专辑列表（移动端）：封面 + 标题/艺术家两行 + 更多按钮，长按或点更多弹出菜单 */}
            <TableContainer sx={{ overflowY: "auto", overflowX: "hidden", width: "auto", '@media(min-width:600px)': { display: 'none' } }}>
                <Table sx={{ tableLayout: 'fixed', margin: "0px 6px", ".MuiTableCell-root": { padding: "10px 10px" } }} >
                    <TableBody >
                        {
                            albumList.map((album) => (
                                <TableRow
                                    key={album.albumId}
                                    sx={[{ ':hover': { background: theme.palette.pannelBackground.main } }, albumMenuOpen && albumMenuInfo.albumId === album.albumId && { background: theme.palette.pannelBackground.main }]}
                                    onContextMenu={e => {
                                        e.preventDefault();
                                        openAlbumMenu(e, album);
                                    }}
                                >
                                    <TableCell sx={{ width: "72px", borderBottom: "unset" }}>
                                        <ImageSkeleton sx={{
                                            width: '52px', height: '52px', borderRadius: '6%', flex: "0 0 auto", imageRendering: "auto", objectFit: "contain"
                                        }} src={album.frontCoverUrl !== null ? album.frontCoverUrl + "?s=@w96h96" : null} />
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: "unset" }}>
                                        <Link href={`/album/${album.albumId}`}>
                                            <Typography variant="body2" noWrap sx={{ ":hover": { cursor: "pointer", color: theme.palette.primary.main } }} title={album.title} >{album.title}</Typography>
                                        </Link>
                                        <Typography variant="caption" noWrap component="p" sx={{ display: 'block', color: 'text.secondary', margin: 0 }}>{album.artistList.map((v, i) => v.name).join('/')}{` · ${album.musicNum} 首`}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ width: "44px", borderBottom: "unset" }} align="center">
                                        <IconButton size='small' sx={{ padding: '0 0' }} onClick={e => openAlbumMenu(e, album)}>
                                            <MoreHorizIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </Box >
    )
}

export default AlbumManagement;