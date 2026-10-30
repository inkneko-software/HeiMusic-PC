import MusicNote from "@mui/icons-material/MusicNote";
import { Avatar, CardMedia, CardMediaProps, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState, useRef, useEffect } from "react";

export default function ImageSkeleton(props: CardMediaProps<'img'>) {
    const theme = useTheme();
    const [loaded, setLoaded] = useState(false)
    const imageRef = useRef(null)
    useEffect(() => {
        if (props.src === null) {
            // imageRef.current.src = "/images/akari.jpg";
            setLoaded(true);
            return;
        }
        if (imageRef.current !== null) {
            new Promise<void>((resolve, reject) => {
                imageRef.current.onload = () => resolve()
                imageRef.current.src = props.src;
                imageRef.current.onerror = reject;
            }).then(() => {
                setLoaded(true);
            })
        }
    }, [props.src]);

    return (
        <>
            <CardMedia {...props} component='img' ref={imageRef} sx={{ ...(props.sx), display: props.src !== null && loaded ? 'block' : 'none' }} />
            {
                !props.src && loaded &&
                // 兜底图标颜色必须显式指定：Avatar 默认前景色取 palette.background.default，
                // 带背景图的主题该值为全透明（rgba(0,0,0,0)）会导致图标不可见；
                // 取主题文字色的反色可还原「浅色主题白图标 / 深色主题黑图标」的跟随效果
                <Avatar sx={{ ...props.sx, color: theme.palette.getContrastText(theme.palette.text.primary) }} onClick={props.onClick}>
                    <MusicNote/>
                </Avatar>
            }
            {
                !loaded && <Skeleton {...props} sx={{ ...(props.sx), transform: 'unset' }} />
            }
        </>
    )
}