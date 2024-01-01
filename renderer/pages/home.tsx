import React from "react"
import Box from "@mui/material/Box"
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
// import Link from "../components/Common/Link";
import Link from "next/link";
import MuiLink from "@mui/material/Link";
import useToast from "../components/Common/Toast";
import { AlbumControllerService, AlbumVo } from "../api/codegen";


interface IAlbumCard {
    album: AlbumVo
}

function AlbumCard(props: IAlbumCard) {
    const imgRef = React.useRef<HTMLImageElement>(null);
    const gridRef = React.useRef<HTMLDivElement>(null);
    const [width, setWidth] = React.useState(0);
    const [loaded, setLoaded] = React.useState(false)

    // React.useEffect(() => {
    //     if (gridRef.current !== null) {
    //         setWidth(gridRef.current.clientWidth - 24)
    //         // 性能过低
    //         const observer = new ResizeObserver(()=>{
    //             setWidth(gridRef.current.clientWidth - 24)
    //             console.log(gridRef.current.clientWidth - 24)
    //         });
    //         observer.observe(gridRef.current)
    //         return ()=>{
    //             observer.disconnect();
    //         }
    //     }
    // }, [gridRef])

    React.useEffect(() => {
        if (imgRef.current !== null) {
            if (props.album.frontCoverUrl === null) {
                imgRef.current.src = "/images/akari.jpg";
                setLoaded(true);
                return;
            }

            new Promise<void>((resolve, reject) => {
                imgRef.current.onload = () => resolve()
                imgRef.current.src = props.album.frontCoverUrl + "?s=@w256h256";
                imgRef.current.onerror = reject;
            }).then(() => {
                setLoaded(true);
            })
        }
    }, [imgRef.current]);
    return (

        <Link href={`/album/${props.album.albumId}`}>
            <Grid ref={gridRef} item xs={3} sx={{ display: "flex", flexDirection: 'column', flexShrink: "0" }}>
                <Box sx={[{ borderRadius: "6%", display: "flex", aspectRatio: '1 / 1' }, loaded && { display: 'none' },]}>
                    <Skeleton variant="rounded" sx={[{ width: '100%', height: '100%' }]} />
                </Box>
                <Box sx={[{ borderRadius: "6%", border: "1px solid #e3e3e3", aspectRatio: '1 / 1', display: "flex", overflow: 'hidden' }, !loaded && { display: 'none' },]}>
                    <CardMedia ref={imgRef} sx={[{ margin: "auto auto", objectFit: "contain" }]} component='img' ></CardMedia>
                </Box>

                <Typography
                    variant="subtitle2"
                    sx={{
                        marginTop: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        "-webkit-box-orient": "vertical",
                        "-webkit-line-clamp": "2",
                        lineHeight: "1.5em",
                        maxHeight: "3em",
                    }} >{props.album.title}</Typography>

            </Grid>
        </Link>

    )
}

function Home() {
    const [firstLaunch, setFirstLaunch] = React.useState(false);
    const [newUploadList, setNewUploadList] = React.useState([]);
    const [Toast, makeToast] = useToast()
    const [recentUploadAlbum, setRecentUploadAlbum] = React.useState<AlbumVo[]>([]);

    React.useEffect(() => {
        AlbumControllerService.getRecentUpload()
            .then(res => {
                setRecentUploadAlbum(res.data)
                if (res.data.length === 0) {
                    setFirstLaunch(true);
                }
            })
            .catch(error => {
                makeToast("网络连接失败", "error", "bottom-right")
            })
    }, [])

    return (
        <Box sx={{ width: 'auto', height: "100%", padding: "12px 12px", overflowY: 'auto', overflowX: 'hidden' }}>
            {Toast}
            {/* <Box>
                <Typography variant='h5' sx={{ marginBottom: "12px" }}>热门歌单</Typography>
                <Grid container spacing={3} sx={{ display: 'flex', justifyContent: "space-between", }} columns={{ xs: 12, lg: 15, xl: 18 }} >
                    {
                        [1, 2, 3, 4, 5, 6, 7, 8, 9].map((val, index) => {
                            return <AlbumCard key={index} album={{albumId: 0}} />
                        })
                    }
                </Grid>
            </Box> */}
            <Box sx={[{ display: "none" }, firstLaunch && { display: "flex", flexDirection: "column" }]}>
                <Typography sx={{ marginBottom: "24px", userSelect: "none" }}>欢迎使用HeiMusic!</Typography>
                <Typography sx={{ marginBottom: "24px", userSelect: "none" }}>第一次使用请设置<Link href="/init"><MuiLink>管理账户</MuiLink></Link></Typography>
                <Typography sx={{ marginBottom: "24px", userSelect: "none" }}>设置完成后，可通过左侧专辑管理按钮进行音乐导入</Typography>
            </Box>
            <Box sx={[firstLaunch && { display: "none" }]}>
                <Typography variant='h5' sx={{ marginBottom: "12px" }}>最新上传</Typography>
                <Typography sx={[recentUploadAlbum.length !== 0 && { display: "none" }]}>暂无音乐</Typography>
                <Grid container spacing={3} sx={{ display: 'flex', justifyContent: "flex-start" }} columns={{ xs: 12, lg: 15, xl: 15 }} >
                    {
                        recentUploadAlbum.map((album, index) => {
                            return <AlbumCard key={index} album={album} />
                        })
                    }
                </Grid>
            </Box>
        </Box>
    )
}

export default Home;