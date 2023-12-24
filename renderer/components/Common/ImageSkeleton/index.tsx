import { CardMedia, CardMediaProps, Skeleton } from "@mui/material";
import { useState, useRef, useEffect } from "react";

export default function ImageSkeleton(props: CardMediaProps<'img'>) {
    const [loaded, setLoaded] = useState(false)
    const imageRef = useRef(null)
    useEffect(() => {
        if (imageRef.current !== null) {
            if (props.src === null) {
                imageRef.current.src = "/images/akari.jpg";
                setLoaded(true);
                return;
            }

            new Promise<void>((resolve, reject) => {
                imageRef.current.onload = () => resolve()
                imageRef.current.src = props.src;
                imageRef.current.onerror = reject;
            }).then(() => {
                setLoaded(true);
            })
        }
    }, [imageRef.current]);

    return (
        <>
            <CardMedia {...props} component='img' ref={imageRef} sx={{ ...(props.sx), display: loaded ? 'block' : 'none' }} />
            {
                !loaded && <Skeleton {...props} sx={{ ...(props.sx), transform: 'unset' }} />
            }
        </>
    )
}