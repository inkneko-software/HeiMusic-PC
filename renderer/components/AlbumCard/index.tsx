import Box from '@mui/material/Box'
import CardMedia from '@mui/material/CardMedia'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded'
import { useTheme } from '@mui/styles'
import { useState } from 'react'

import { AlbumVo } from '@api/codegen'
import { coverUrlOf, onCoverError } from '../../lib/coverUrl'

/** 多行截断样式（-webkit-box 方案）。sx 走 emotion，属性名必须用驼峰 */
const clampLines = (lines: number) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    lineHeight: 1.5,
    maxHeight: `${lines * 1.5}em`,
} as const);

/** 正方形占位：padding-top 百分比相对包含块宽度，等价 1:1（height:0 归零 Skeleton 默认高度），
 *  且兼容不支持 aspect-ratio 的旧内核（如 Android WebView Chrome 83），配合绝对定位子元素使用 */
const squareBoxSx = {
    height: 0,
    paddingTop: '100%',
} as const;

/** 专辑卡片：封面 + 曲目数遮罩 + 标题/艺人，点击跳专辑详情（自 home.tsx 抽出，首页「最新上传」与最近上传页共用） */
interface IAlbumCard {
    album: AlbumVo
}

export default function AlbumCard(props: IAlbumCard) {
    const theme = useTheme();
    const [loaded, setLoaded] = useState(false);
    const cover = coverUrlOf(props.album.frontCoverUrl);
    const artists = (props.album.artistList || []).map(artist => artist.name).join(' / ');

    return (
        <Link href={`/album/${props.album.albumId}`} legacyBehavior passHref>
            <Box component='a' sx={{ display: 'block', color: 'inherit', textDecoration: 'none', minWidth: 0 }}>
                <Box sx={{
                    position: 'relative',
                    ...squareBoxSx,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(120,120,120,0.12)',
                    // 阴影用 filter 而非 box-shadow：filter 与 transform 同在合成器插值，避免 box-shadow 逐帧重绘跟不上浮动动画
                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.10))',
                    transition: 'transform 0.22s ease-in-out, filter 0.22s ease-in-out',
                    ':hover': { transform: 'translateY(-6px)', filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.24))' },
                    ':hover .album-cover-media': { transform: 'scale(1.05)' },
                    ':hover .album-cover-mask': { opacity: 1 },
                    ':hover .album-title': { color: theme.palette.primary.main },
                    // 触屏设备无 hover，遮罩常显以便点按
                    '@media (hover: none)': {
                        ':hover': { transform: 'none', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.10))' },
                        ':hover .album-cover-media': { transform: 'none' },
                        ':hover .album-title': { color: 'inherit' },
                        '.album-cover-mask': { opacity: 1 },
                    }
                }}>
                    {
                        !loaded &&
                        <Skeleton variant='rectangular' sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'unset' }} />
                    }
                    <CardMedia
                        className='album-cover-media'
                        component='img'
                        src={cover}
                        onLoad={() => setLoaded(true)}
                        onError={(event) => { setLoaded(true); onCoverError(event); }}
                        sx={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            objectFit: 'cover', opacity: loaded ? 1 : 0,
                            transition: 'opacity 0.25s ease-in-out, transform 0.35s ease-in-out'
                        }}
                    />
                    <Box className='album-cover-mask' sx={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        display: 'flex', alignItems: 'flex-end', padding: '10px',
                        background: 'linear-gradient(180deg, rgba(0,0,0,0) 42%, rgba(0,0,0,0.72) 100%)',
                        opacity: 0, transition: 'opacity 0.2s ease-in-out'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ffffff' }}>
                            <MusicNoteRoundedIcon sx={{ fontSize: '1rem', opacity: 0.9 }} />
                            <Typography variant='caption' fontWeight={600}>{props.album.musicNum ?? 0} 首</Typography>
                        </Box>
                        <Box sx={{
                            marginLeft: 'auto', width: 26, height: 26, borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.92)', display: 'flex'
                        }}>
                            <ArrowForwardRoundedIcon sx={{ fontSize: '1.05rem', margin: 'auto', color: '#1a1a1a' }} />
                        </Box>
                    </Box>
                </Box>
                <Typography className='album-title' variant='subtitle2' sx={{
                    marginTop: '8px', fontWeight: 600, ...clampLines(2),
                    transition: 'color 0.2s ease-in-out'
                }}>{props.album.title}</Typography>
                {
                    artists.length !== 0 &&
                    <Typography variant='caption' color='text.secondary' noWrap sx={{ display: 'block', marginTop: '2px' }}>{artists}</Typography>
                }
            </Box>
        </Link>
    )
}
