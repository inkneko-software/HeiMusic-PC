import { Box, FormControl, FormControlLabel, TextField } from "@mui/material";
import { useState } from "react";

interface IAlbumInfo{
    title: string,
    pic: string,
    musics: string[],
    artists: string[]
}

export default function Edit(){
    const [album, setAlbum] = useState<IAlbumInfo>({
        title: "",
        pic: "",
        musics: [],
        artists: []
    });
    
    return (
        <Box>
            专辑编辑
            <Box sx={{display: "flex", flexDirection: "column", width: "30%"}}>
                <TextField label="标题" value={album.title} onChange={e=>setAlbum({...album, title: e.target.value})}/>
                <TextField label="图片" value={album.pic} onChange={e=>setAlbum({...album, pic: e.target.value})}/>
                
            </Box>
        </Box>
    )
}