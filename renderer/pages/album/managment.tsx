import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import React from "react"
import { TableVirtuoso } from "react-virtuoso";

function AlbumManagement() {
    return (
        <Box>
            <Stack direction="row">
                <Typography sx={{ flexGrow: 1 }}>当前专辑数：12345个</Typography>
                <Link href="/album/edit">
                    <Button variant="contained">创建新专辑</Button>
                </Link>
            </Stack>
            <TableVirtuoso />
        </Box>
    )
}

export default AlbumManagement;