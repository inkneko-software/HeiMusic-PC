import { Box, Button, Paper, Stack } from "@mui/material";
import React from "react"

function AlbumEdit() {
    return (
        <Box>
            <Paper>
                <Stack direction="row">
                    <Button variant="outlined">选择音乐</Button>
                    <Button>读取cue文件</Button>
                    <Button>扫描文件夹</Button>
                </Stack>
            </Paper>
        </Box>
    )
}

export default AlbumEdit;