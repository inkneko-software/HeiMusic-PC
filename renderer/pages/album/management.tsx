import { Box, Button, Stack, Typography, Avatar, IconButton } from "@mui/material";

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
import { AlbumControllerService, AlbumVo } from "@api/codegen";

function AlbumManagement() {
    const theme = useTheme()
    const [total, setTotal] = React.useState(0);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [albumList, setAlbumList] = React.useState<AlbumVo[]>([]);
    React.useEffect(() => {
        AlbumControllerService.getAlbumList()
            .then(res => {
                setTotal(res.data.total);
                setAlbumList(res.data.albumList);
            })
    }, [])

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };



    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }} >
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
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="每页行数"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count !== -1 ? count : `超过 ${to}`} 个`}
                    />
                </Stack>

            </Box>
            <TableContainer sx={{ overflowY: "auto", overflowX: "hidden", width: "auto" }}>
                <Table stickyHeader sx={{ tableLayout: 'fixed', margin: "0px 6px", ".MuiTableCell-root": { padding: "12px 6px" } }} >
                    <TableHead >
                        <TableRow>
                            <TableCell width="15%" >专辑封面</TableCell>
                            <TableCell width="35%" >专辑标题</TableCell>
                            <TableCell width="30%">艺术家</TableCell>
                            <TableCell width="10%" >歌曲数</TableCell>
                            <TableCell width="10%" >操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody >
                        {
                            albumList.map((album, index) => (
                                <TableRow key={album.albumId}>
                                    <TableCell sx={{ width: "15%", borderBottom: "unset" }}>
                                        <CardMedia sx={{
                                            width: '32px', height: '32px', borderRadius: '6%', flex: "0 0 auto", imageRendering: "auto", objectFit: "contain"
                                        }} src={album.frontCoverUrl || "/images/akari.jpg"} component="img"></CardMedia>
                                    </TableCell>
                                    <TableCell sx={{ width: "35%", borderBottom: "unset" }}>
                                        <Typography variant="body2" noWrap>{album.title}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ width: "30%", borderBottom: "unset" }}>
                                        <Typography variant="body2" noWrap>{album.artistList.map((v, i) => v.name).join('/')}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ width: "10%", borderBottom: "unset" }}>{album.musicNum}</TableCell>
                                    <TableCell sx={{ width: "10%", borderBottom: "unset" }}>
                                        <Link href="/album/edit/0"><Button variant="outlined" size="small">编辑</Button></Link>
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