import ImageSkeleton from '@components/Common/ImageSkeleton'
import { Box, Typography } from '@mui/material'
import React from 'react'

export default function SeriesHome() {
    return (
        <Box sx={{ width: '100%', height: '100%', padding: '12px 12px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant='h5' sx={{ marginBottom: '12px' }}>音乐系列</Typography>
            <Typography variant='caption' sx={{ marginBottom: '12px' }}>动画 / 电视剧 / 电影的音乐系列</Typography>

            {
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(val => {
                    return (
                        <Box key={val} sx={{ position: 'relative', display: 'flex', height: '64px', marginBottom: '16px', flex: '1 0 auto', borderRadius: '12px',backgroundColor: "#000000" }}>
                            <Box sx={{ position: 'absolute', width: '114px', height: '100%', top: 0, left: 0, background: 'url("/images/lxh-background02.jpg")', backgroundRepeat: 'no-repeat', backgroundSize: 'contain', borderRadius: '12px' }}>

                            </Box>
                            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,.7)', display: 'flex', borderRadius: '12px' }} >
                                <Typography variant='h6' sx={{ margin: 'auto 0px auto 130px', color: '#ffffff' }}>罗小黑战记</Typography>
                                <Typography variant='subtitle2' sx={{ margin: 'auto 16px auto auto', color: '#ffffff' }}>专辑数：20</Typography>
                            </Box>
                        </Box>
                    )
                })
            }


        </Box>
    )
}