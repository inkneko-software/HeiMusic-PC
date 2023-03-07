import Box from '@mui/material/Box'
import { BoxProps, Typography } from "@mui/material"

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


interface Data {
    title: string,
    artists: string[],
    duration: string,
}

interface ColumnData {
    key: string,
    label: string,
    width: number,
}

const rows: Data[] = Array.from({ length: 2000 }, (_, index) => {
    return { title: "歌曲名称" + index, artists: ["艺术家a", "艺术家b"], duration: "1:59" };
});

const columns: ColumnData[] = [
    {
        key: "title",
        label: "歌曲",
        width: 300
    },
    {
        key: "artists",
        label: "歌手",
        width: 300
    },
    {
        key: "duration",
        label: "时长",
        width: 100
    },
]

const VirtuosoTableComponents: TableComponents<Data> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
        <TableContainer component={Paper} {...props} ref={ref} sx={{ borderRadius: "0px", boxShadow: "unset", background: "rgba(0,0,0,0)" }} />
    )),
    Table: (props) => (
        <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
    ),
    TableHead: () => (<TableRow>
        {columns.map((column) => (
            <TableCell
                key={column.key}
                variant="head"
                style={{ width: column.width }}
                sx={{
                    backgroundColor: 'background.paper',
                    borderBottom: "unset"
                }}
            >
                {column.label}
            </TableCell>
        ))}
    </TableRow>),
    TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
        <TableBody {...props} ref={ref} />
    )),
};



function rowContent(_index: number, row: Data) {
    return (
        <React.Fragment>
            {columns.map((column) => (
                <TableCell
                    key={column.key}
                    sx={{ borderBottom: "unset" }}
                >
                    {
                        row[column.key]
                    }
                </TableCell>
            ))}
        </React.Fragment>
    );
}


interface MusicAlbumProps extends BoxProps {

}

function MusicAlbum(props: MusicAlbumProps) {
    const router = useRouter()
    const { id } = router.query
    const [albumInfo, setAlbumInfo] = React.useState({
        name: "TVアニメ『ぼっち・ざ・ろっく!』フルアルバム「結束バンド」",
        artist: "結束バンド",
        cover: "https://oss.inkneko.com/heimusic/avatar/COVER.jpg",
        date: undefined,
        listenedCount: 0,
    })

    /**
     * 
     *         setMusicCoverUrl("https://oss.inkneko.com/heimusic/avatar/COVER.jpg");
        setMusicName("星座になれたら");
        setMusicSinger("結束バンド")
     */
    const [viewAtTopState, setViewAtTopState] = React.useState(true)
    const AlbumInfo = (
        <Box sx={{
            marginLeft: '3%',
            marginRight: '3%',
            marginTop: '20px',
            width: "auto",
            paddingBottom: '10px',
            display: 'flex',
        }}>
            <Avatar sx={{
                width: '180px', height: '180px', borderRadius: '3%', flex: "0 0 auto"
            }} variant="square" src={albumInfo.cover}><MusicNote style={{ fontSize: 72 }} /></Avatar>
            <Box sx={{
                marginLeft: '20px',
                marginRight: '20px',
                width: "auto",
                overflow: "hidden",
                flex: "1 1 auto",
                display: 'flex',
                flexDirection: 'column',
            }}>
                <Typography fontWeight={600} variant='h5' noWrap >{albumInfo.name}</Typography>
                <Typography variant='body2' noWrap >{albumInfo.artist}</Typography>
                {albumInfo.date ? <Typography variant='caption' noWrap >{albumInfo.date}</Typography> : null}
                <Typography variant='caption' sx={{ marginTop: "12px" }} >{"播放量 " + albumInfo.listenedCount}</Typography>
                <Box sx={{ marginTop: "auto" }}>
                    <Button sx={{ width: "90px", height: "32px", marginRight: "30px" }} variant="contained" >播放全部</Button>
                    <Button sx={{ width: "90px", height: "32px", marginRight: "30px" }} variant="outlined">下载</Button>
                </Box>
            </Box>
        </Box>
    )

    const AlbumInfoLite = (
        <Box sx={{
            marginLeft: '3%',
            marginRight: '3%',
            marginTop: '20px',
            display: 'flex',
            paddingBottom: '10px',
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
                <Typography fontWeight={600} variant='h5' noWrap >{albumInfo.name}</Typography>

                <Box sx={{ margin: "14px 0px", fontSize: "14px", color: "gray" }}>{"播放量 " + albumInfo.listenedCount}</Box>
            </Box>
            <Box sx={{ marginTop: "auto" }}>
                <Button sx={{ width: "90px", height: "32px", marginRight: "30px" }} variant='contained'>播放全部</Button>
                <Button className="album-brief-tool-bar-btn" variant='outlined'>下载</Button>
            </Box>
        </Box>
    )

    return (
        <Box sx={{ height: '100%', width: '100%', display: "flex", flexDirection: "column", }}>
            {viewAtTopState ? AlbumInfo : AlbumInfoLite}
            <TableVirtuoso
                data={rows}
                components={VirtuosoTableComponents}
                itemContent={rowContent}
                atTopStateChange={(atTop) => setViewAtTopState(atTop)}
            />
        </Box>
    );
}


export default MusicAlbum;