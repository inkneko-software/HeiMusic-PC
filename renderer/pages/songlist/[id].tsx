import Box from '@mui/material/Box'
import { BoxProps } from "@mui/material"

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
    calories: number;
    carbs: number;
    dessert: string;
    fat: number;
    id: number;
    protein: number;
}

interface ColumnData {
    dataKey: keyof Data;
    label: string;
    numeric?: boolean;
    width: number;
}

type Sample = [string, number, number, number, number];

const sample: readonly Sample[] = [
    ['Frozen yoghurt', 159, 6.0, 24, 4.0],
    ['Ice cream sandwich', 237, 9.0, 37, 4.3],
    ['Eclair', 262, 16.0, 24, 6.0],
    ['Cupcake', 305, 3.7, 67, 4.3],
    ['Gingerbread', 356, 16.0, 49, 3.9],
];

function createData(
    id: number,
    dessert: string,
    calories: number,
    fat: number,
    carbs: number,
    protein: number,
): Data {
    return { id, dessert, calories, fat, carbs, protein };
}

const columns: ColumnData[] = [
    {
        width: 200,
        label: 'Dessert',
        dataKey: 'dessert',
    },
    {
        width: 120,
        label: 'Calories\u00A0(g)',
        dataKey: 'calories',
        numeric: true,
    },
    {
        width: 120,
        label: 'Fat\u00A0(g)',
        dataKey: 'fat',
        numeric: true,
    },
    {
        width: 120,
        label: 'Carbs\u00A0(g)',
        dataKey: 'carbs',
        numeric: true,
    },
    {
        width: 120,
        label: 'Protein\u00A0(g)',
        dataKey: 'protein',
        numeric: true,
    },
];

const rows: Data[] = Array.from({ length: 2000 }, (_, index) => {
    const randomSelection = sample[Math.floor(Math.random() * sample.length)];
    return createData(index, ...randomSelection);
});

const VirtuosoTableComponents: TableComponents<Data> = {
    Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
        <TableContainer component={Paper} {...props} ref={ref} sx={{ borderRadius: "0px", boxShadow: "unset", background: "rgba(0,0,0,0)" }} />
    )),
    Table: (props) => (
        <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
    ),
    TableHead,
    TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
    TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
        <TableBody {...props} ref={ref} />
    )),
};

function fixedHeaderContent() {
    return (
        <TableRow>
            {columns.map((column) => (
                <TableCell
                    key={column.dataKey}
                    variant="head"
                    align={column.numeric || false ? 'right' : 'left'}
                    style={{ width: column.width }}
                    sx={{
                        backgroundColor: 'background.paper',
                    }}
                >
                    {column.label}
                </TableCell>
            ))}
        </TableRow>
    );
}

function rowContent(_index: number, row: Data) {
    return (
        <React.Fragment>
            {columns.map((column) => (
                <TableCell
                    key={column.dataKey}
                    align={column.numeric || false ? 'right' : 'left'}
                >
                    {row[column.dataKey]}
                </TableCell>
            ))}
        </React.Fragment>
    );
}


interface SongListProps extends BoxProps {
    songlistId?: number
}

function SongList(props: SongListProps) {
    const router = useRouter()
    var { id } = router.query;
    var [albumInfo, setAlbumInfo] = React.useState({
        name: "songlist id: " + id,
        cover: "",
        listenedCount: 0,
    })

    var [albumName, setAlbumName] = React.useState("songlist id: " + id)
    React.useEffect(() => {
        if (router.isReady) {
            console.log(typeof (props.songlistId))
            if (typeof (props.songlistId) !== "undefined") {
                setAlbumName("songlist id: " + props.songlistId)
            } else {
                setAlbumName("songlist id: " + id)
            }
        }
    }, [router.isReady, id])


    const [viewAtTopState, setViewAtTopState] = React.useState(true)
    const AlbumInfo = (
        <Box sx={{
            marginLeft: '3%',
            marginRight: '3%',
            marginTop: '20px',
            display: 'flex',
            paddingBottom: '10px',
        }}>
            <Avatar sx={{
                width: '180px', height: '180px', borderRadius: '3%'
            }} variant="square" src={albumInfo.cover}><MusicNote style={{ fontSize: 72 }} /></Avatar>
            <Box sx={{
                marginLeft: '20px',
                flex: '1',
                display: 'flex',
                flexFlow: 'column',
            }}>
                <Box sx={{ marginLeft: "-2px", fontSize: '28px' }}>{albumName}</Box>
                <Box sx={{ margin: "14px 0px", fontSize: "14px", color: "gray" }}>{"播放量 " + albumInfo.listenedCount}</Box>
                <Box sx={{ marginTop: "auto" }}>
                    <Button sx={{ width: "90px", height: "32px", marginRight: "30px" }} >播放全部</Button>
                    <Button className="album-brief-tool-bar-btn">下载</Button>
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
                flex: '1',
                display: 'flex',
                flexFlow: 'column',
            }}>
                <Box sx={{ marginLeft: "-2px", fontSize: '28px' }}>{albumInfo.name}</Box>
                <Box sx={{ margin: "14px 0px", fontSize: "14px", color: "gray" }}>{"播放量 " + albumInfo.listenedCount}</Box>
            </Box>
            <Box sx={{ marginTop: "auto" }}>
                <Button sx={{ width: "90px", height: "32px", marginRight: "30px" }} >播放全部</Button>
                <Button className="album-brief-tool-bar-btn">下载</Button>
            </Box>
        </Box>
    )

    return (
        <Box sx={{ height: '100%', width: '100%', display: "flex", flexDirection: "column", }}>
            {viewAtTopState ? AlbumInfo : AlbumInfoLite}
            <TableVirtuoso
                data={rows}
                components={VirtuosoTableComponents}
                fixedHeaderContent={fixedHeaderContent}
                itemContent={rowContent}
                atTopStateChange={(atTop) => setViewAtTopState(atTop)}
            />
        </Box>
    );
}


export default SongList;