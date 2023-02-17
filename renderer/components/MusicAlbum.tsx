import Box from '@mui/material/Box'
import { BoxProps } from "@mui/material"

interface MusicAlbumProps extends BoxProps{

}

function MusicAlbum(props: MusicAlbumProps){
    return (
        <Box {...props}>

        </Box>
    )
}

export default MusicAlbum;