import React from "react"
import Typography, { TypographyProps } from "@mui/material/Typography";
import Box from "@mui/material/Box";

export interface IScrollableTypography extends TypographyProps {

}

export default function ScrollableTypography(props: IScrollableTypography) {
    const typographyRef = React.useRef<HTMLElement>(null);
    const [position, setPosition] = React.useState(0);
    const [transitTime, setTransitTime] = React.useState(0);
    React.useEffect(() => {
        if (typographyRef.current !== null) {
            var element = typographyRef.current;
            var clone = element.cloneNode(true) as HTMLElement;
            clone.style.visibility = 'hidden';
            clone.style.position = 'absolute';
            clone.style.width = 'auto';
            clone.style.whiteSpace = 'nowrap';
            document.body.appendChild(clone);
            var width = clone.offsetWidth;
            document.body.removeChild(clone);

            if (width !== element.clientWidth) {
                var left = true;
                setTransitTime(5);
                var handle = setInterval(() => {
                    if (left) {
                        setPosition(width - element.clientWidth)
                    } else {
                        setPosition(0)
                    }
                    left = !left;
                }, 5000)

                return () => {
                    clearInterval(handle);
                }
            }else{
                setTransitTime(0);
                setPosition(0);
            }
        }
    }, [typographyRef, props.children])

    return (
        <Box sx={{ position: "relative", overflow: "hidden" }}>
            <Typography {...props} ref={typographyRef} noWrap={false} sx={{ ...props.sx, whiteSpace: "nowrap", transform: `translateX(-${position}px)`, transition: `transform ${transitTime}s ease-in-out` }} >{props.children}</Typography>
        </Box>
    )
}