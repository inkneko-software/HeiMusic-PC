import { Box, Button, CardMedia, Dialog } from "@mui/material";
import React from "react"

interface ICoverInput {
    width?: string,
    height?: string,
    radius?: string,
    cover: Blob,
    onCoverChanged: (cover: Blob) => void
}

const CoverInput = (({ width = "128px", height = "128px", radius = "6%", cover, onCoverChanged }: ICoverInput) => {
    const [previewCoverDialogOpen, setPreviewCoverDialogOpen] = React.useState(false)
    const [coverPreviewLink, setCoverPreviewLink] = React.useState("")
    const [coverFileSelected, setCoverFileSelected] = React.useState(false)

    const coverFileRef = React.useRef<HTMLInputElement>(null)

    const onPickCover = () => {
        coverFileRef.current.click();
        coverFileRef.current.onchange = () => {
            const files = coverFileRef.current.files;
            if (files !== null && files.length !== 0) {
                onCoverChanged(files[0])
                setCoverFileSelected(true);
            } else {
                onCoverChanged(null)
                setCoverFileSelected(false);
            }
        };
    }

    const onRemoveCover = () => {
        coverFileRef.current.value = "";
        setCoverFileSelected(false);
    }

    React.useEffect(() => {
        if (cover !== null){
            setCoverPreviewLink(URL.createObjectURL(cover))
        }
    }, [cover])

    return (
        <>
            <input ref={coverFileRef} name="cover" type="file" hidden />
            {/* 放大预览对话框 */}
            <Dialog open={previewCoverDialogOpen} onClose={() => setPreviewCoverDialogOpen(false)}>
                <img src={coverPreviewLink} onClick={() => setPreviewCoverDialogOpen(false)} />
            </Dialog>
            {/* 选择后的直接预览 */}
            <Box sx={[{ height: height, width: width, position: "relative", }, !coverFileSelected && { display: "none" }]}>
                <Box sx={{ position: "absolute", bottom: "0px", width: "100%", display: "flex", flexDirection: "row", background: "rgba(0,0,0,0.6)", borderRadius: radius }}>
                    <Button sx={{ margin: "auto auto", color: "white" }} onClick={() => setPreviewCoverDialogOpen(true)}>预览</Button>
                    <Box sx={{ minWidth: "1px", margin: "9% auto", background: "white" }} />
                    <Button sx={{ margin: "auto auto", color: "red" }} onClick={onRemoveCover}>删除</Button>
                </Box>
                <CardMedia src={coverPreviewLink} sx={{ height: "100%", borderRadius: radius }} component='img' />
            </Box>
            {/* 选择文件按钮 */}
            <Button variant="outlined" size='small' onClick={onPickCover} sx={[coverFileSelected && { display: "none" }]}>选择文件</Button>
        </>

    )
})

export default CoverInput;
