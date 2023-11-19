import { Box, Typography } from "@mui/material"
import * as React from "react"

interface ISettingsPlayerLayout {
    children: React.ComponentType
}

export default function Layout(props) {

    return (
        <Box sx={{ width: 'auto', height: "100%", padding: "12px 12px", overflowY: 'auto', overflowX: 'hidden'}}>
            <Typography variant='h5' sx={{ marginBottom: "12px" }}>播放器设置</Typography>
            {props.children}
        </Box>
    )

}