import MusicNote from "@mui/icons-material/MusicNote";
import { Avatar, CardMedia, CardMediaProps, Skeleton } from "@mui/material";
import { useState, useRef, useEffect } from "react";

export default function ImageSkeleton(props: CardMediaProps<'img'>) {
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
    }, []);

    return (
        <>
            <CardMedia {...props} component='img' ref={imageRef} sx={{ ...(props.sx), display: props.src !== null && loaded ? 'block' : 'none' }} />
            {
                !props.src && loaded &&
                <Avatar sx={props.sx} onClick={props.onClick}>
                    <MusicNote/>
                </Avatar>
            }
            {
                !loaded && <Skeleton {...props} sx={{ ...(props.sx), transform: 'unset' }} />
            }
        </>
    )
}