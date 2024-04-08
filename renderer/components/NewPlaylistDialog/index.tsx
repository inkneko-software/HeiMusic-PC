import { ApiError, PlaylistControllerService } from '@api/codegen';
import CoverInput from '@components/Common/CoverInput/CoverInput'
import { pushToast } from '@components/HeiMusicMainLayout';
import { IRefreshMyCreatedPlayListEvent } from '@components/LeftPannel/LeftPannel';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import React from 'react'

export interface NewPlaylistDialogProps {
    open: boolean,
    onClose: () => void,
    onSaved?: (playlistId: number) => void,
    musicIdList?: number[]
}

export default function NewPlaylisitDialog(props: NewPlaylistDialogProps) {
    const [cover, setCover] = React.useState(null);
    const [playlistTitle, setPlaylistTitle] = React.useState("")
    const [playlistDescription, setPlaylistDescription] = React.useState("")
    const handleSavePlaylist = () => {
        (async () => {
            try {
                var addPlaylistRes = await PlaylistControllerService.addPlaylist(playlistTitle, playlistDescription);
                if (props.musicIdList && props.musicIdList.length !== 0){
                    await PlaylistControllerService.addPlaylistMusic({playlistId: addPlaylistRes.data.playlistId, musicIdList: props.musicIdList} )
                }

                const event = new CustomEvent<IRefreshMyCreatedPlayListEvent>("left-panel::refreshMyCreatedPlaylist");
                document.dispatchEvent(event);
                pushToast("创建成功", "success")
                if (props.onSaved) {
                    props.onSaved(addPlaylistRes.data.playlistId)
                }
                props.onClose();

            } catch (error) {
                if (error instanceof ApiError){
                    pushToast(error.message);
                }
                
            }
        })()
    }
    return (
        <Dialog open={props.open} onClose={props.onClose}>
            <DialogTitle>
                <Typography>创建歌单</Typography>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='caption'>歌单标题</Typography>
                    <TextField value={playlistTitle} size="small" onChange={event => setPlaylistTitle(event.target.value)} />
                    <Typography variant='caption' sx={{ marginTop: '12px' }}>说明</Typography>
                    <TextField value={playlistDescription} size="small" onChange={event => setPlaylistDescription(event.target.value)} />
                </Box>

            </DialogContent>
            <DialogActions >
                <Button size='small' onClick={handleSavePlaylist}>保存</Button>
            </DialogActions>
        </Dialog>
    )
}