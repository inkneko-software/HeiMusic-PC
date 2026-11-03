import Box from '@mui/material/Box'
import CardMedia from '@mui/material/CardMedia';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Link from 'next/link';
import useToast from '../components/Common/Toast';
import { AlbumControllerService, AlbumVo, ApiError, MusicVo, PlayHistoryControllerService, PlayHistoryVo, PlaylistControllerService, RecommendControllerService } from '../api/codegen';
import { useTheme } from '@mui/styles'
import { IconButton } from '@mui/material';
import SkipNext from "@mui/icons-material/SkipNext"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded"
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded"
import LibraryMusicOutlinedIcon from "@mui/icons-material/LibraryMusicOutlined"
import { IChangePlayListEvent, IMusicInfo } from '@components/MusicControlPannel/MusicControlPannel';
import { HeiMusicUserContext } from '@components/HeiMusicMainLayout';
import MusicRow, { MusicRowSkeleton } from '@components/MusicRow';
import { useRouter } from 'next/router';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import { ReactNode, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { coverUrlOf } from '../lib/coverUrl';

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

/** 专辑网格：按可用宽度自动铺满，避免固定列数在超宽屏留下大面积空白。
 *  minmax 的最小宽度与 ALBUM_CARD_MIN_WIDTH 保持一致（可见数量按同公式计算列数） */
const albumGridSx = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: { xs: '14px', sm: '20px', lg: '24px' },
} as const;

/** 正方形占位：padding-top 百分比相对包含块宽度，等价 1:1（height:0 归零 Skeleton 默认高度），
 *  且兼容不支持 aspect-ratio 的旧内核（如 Android WebView Chrome 83），配合绝对定位子元素使用 */
const squareBoxSx = {
    height: 0,
    paddingTop: '100%',
} as const;

/** 最近上传一次拉取的上限，供宽高联动切片（32 覆盖常见 8 列 × 4 行） */
const RECENT_UPLOAD_FETCH_SIZE = 32;

/** 横滑行一次拉取的曲目数（最近播放 / 最常播放 / 久未重现共用） */
const HISTORY_ROW_SIZE = 12;

/** 同口味推荐批量预取数量：一次取 5 首供「换一首」本地轮换，调用量降为 1/5 */
const SIMILAR_BATCH_SIZE = 5;

/** 播放时间 → 相对时间文案（最近播放卡片角标用），非法/缺失返回空串（不显示角标） */
const relativeTimeOf = (time?: string) => {
    if (!time) {
        return '';
    }
    const timestamp = new Date(time).getTime();
    if (isNaN(timestamp)) {
        return '';
    }
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) {
        return '刚刚';
    }
    if (minutes < 60) {
        return `${minutes} 分钟前`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} 小时前`;
    }
    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days} 天前`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} 个月前`;
    }
    return `${Math.floor(months / 12)} 年前`;
}

/** MusicVo → 播放器曲目信息（猜你喜欢与各横滑行共用同一形状） */
const toMusicInfo = (music: MusicVo): IMusicInfo => ({
    musicId: music.musicId,
    title: music.title,
    artists: (music.artistList || []).map(artist => artist.name),
    qualityOption: [{
        name: "SQ",
        url: music.resourceUrl,
        color: "red"
    }],
    albumId: music.albumId,
    albumTitle: music.albumTitle,
    cover: music.albumCoverUrl,
    duration: music.duration,
    isFavorite: music.isFavorite,
    isLargeTrackMusic: music.discStartTime !== '',
    isInstrumental: music.isInstrumental,
    discStartTime: parseFloat(music.discStartTime),
    discEndTime: parseFloat(music.discEndTime)
})

/** 专辑卡最小宽度，与 albumGridSx 的 minmax(150px, 1fr) 一致 */
const ALBUM_CARD_MIN_WIDTH = 150;

/**
 * 分区标题：强调色竖条 + 标题 + 说明文案 + 右侧操作
 */
function SectionTitle(props: { title: string, caption?: string, action?: ReactNode }) {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: { xs: '12px', sm: '16px' }, userSelect: 'none' }}>
            <Box sx={{
                width: 4,
                height: 18,
                borderRadius: '2px',
                marginRight: '10px',
                background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
            }} />
            <Typography variant='h6' fontWeight={700}>{props.title}</Typography>
            {
                props.caption &&
                <Typography variant='caption' color='text.secondary' sx={{ marginLeft: '10px', '@media(max-width:600px)': { display: 'none' } }}>{props.caption}</Typography>
            }
            {
                props.action &&
                <Box sx={{ marginLeft: 'auto' }}>{props.action}</Box>
            }
        </Box>
    )
}

/**
 * 「猜你喜欢」主推荐卡
 *
 * 用当前音乐的封面做高斯模糊铺底，再盖一层取色渐变，
 * 保证任何封面下卡片都有一致的氛围色与足够的文字对比度。
 */
interface IRecommendHero {
    music: MusicVo,
    backdrop: IRgbColor,
    coverRef: React.RefObject<HTMLImageElement>,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    onCoverLoad: () => void,
    onPlay: () => void,
    onNext: () => void,
    onFavorite: () => void,
}

/** 封面取色结果，按需拼出不同透明度的 rgba */
interface IRgbColor {
    r: number,
    g: number,
    b: number,
}

const DEFAULT_BACKDROP: IRgbColor = { r: 90, g: 90, b: 90 }

const rgbaOf = (color: IRgbColor, alpha: number) => `rgba(${color.r},${color.g},${color.b},${alpha})`

/**
 * 把封面采样色转成 Hero 卡底色：
 * 绕均值拉开饱和度以保留封面色彩倾向，再整体压暗到目标亮度，
 * 这样无论封面明暗，白色文字都能保持足够的对比度。
 */
const toBackdropColor = (r: number, g: number, b: number): IRgbColor => {
    const mean = (r + g + b) / 3;
    const saturation = 1.5;
    const targetMean = 104;
    const k = mean === 0 ? 0 : targetMean / mean;
    const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
    return {
        r: clamp((mean + (r - mean) * saturation) * k),
        g: clamp((mean + (g - mean) * saturation) * k),
        b: clamp((mean + (b - mean) * saturation) * k),
    }
}

function RecommendHero(props: IRecommendHero) {
    const { music } = props;
    const cover = coverUrlOf(music?.albumCoverUrl);
    const artists = (music?.artistList || []).map(artist => artist.name).join(' / ');

    return (
        <Box sx={{
            position: 'relative',
            gridColumn: { xs: 'span 2', sm: 'span 1' },
            height: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            isolation: 'isolate',
            display: 'flex',
            backgroundColor: rgbaOf(props.backdrop, 1),
            boxShadow: '0 4px 18px rgba(0,0,0,0.14)',
            userSelect: 'none',
        }}>
            {/* 模糊封面铺底 */}
            <CardMedia component='img' aria-hidden src={cover} sx={{
                position: 'absolute', top: '-12%', left: '-12%', width: '124%', height: '124%',
                objectFit: 'cover', filter: 'blur(32px) saturate(1.5)', zIndex: 0,
            }} />
            {/* 取色渐变：主色自左向右淡出，右侧压黑保证白色文字的对比度 */}
            <Box sx={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1,
                background: `linear-gradient(100deg, ${rgbaOf(props.backdrop, 1)} 0%, ${rgbaOf(props.backdrop, 1)} 24%, ${rgbaOf(props.backdrop, 0.72)} 56%, rgba(0,0,0,0.55) 100%)`
            }} />
            <Box sx={{
                position: 'relative', zIndex: 2, display: 'flex', alignItems: 'stretch', width: '100%',
                gap: { xs: '12px', sm: '16px' }, padding: { xs: '12px', sm: '14px', lg: '16px' }
            }}>
                {/* 封面 + 悬停播放遮罩 */}
                <Box sx={{
                    // 高度驱动的正方形：宽度不用 aspect-ratio（旧内核如 Chrome 83 不支持），
                    // 由下方静态定位的主图以 height:100% + width:auto 的内在 1:1 比例撑出
                    position: 'relative', flex: '0 0 auto', height: '100%',
                    borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 26px rgba(0,0,0,0.35)',
                    ':hover .hero-cover-mask': { opacity: 1 },
                }}>
                    <CardMedia
                        ref={props.coverRef}
                        crossOrigin='anonymous'
                        onLoad={props.onCoverLoad}
                        component='img'
                        src={cover}
                        sx={{ display: 'block', height: '100%', width: 'auto' }}
                    />
                    {/* 触屏无 hover，播放按钮常显以便点按播放 */}
                    <Box className='hero-cover-mask' sx={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.42)', opacity: 0, transition: 'opacity 0.2s ease-in-out',
                        '@media (hover: none)': { opacity: 1, background: 'rgba(0,0,0,0.28)' },
                    }}>
                        <IconButton
                            disableRipple
                            onClick={props.onPlay}
                            sx={{
                                color: '#ffffff',
                                transition: 'transform 0.2s ease-in-out',
                                transform: { xs: 'scale(1)', sm: 'scale(0.82)' },
                                '&:hover': { transform: 'scale(1)', background: 'transparent' },
                                '& .MuiSvgIcon-root': { fontSize: '2.4rem' }
                            }}
                        >
                            <PlayArrowRoundedIcon />
                        </IconButton>
                    </Box>
                </Box>
                <canvas ref={props.canvasRef} style={{ display: 'none' }} />
                {/* 音乐信息与操作 */}
                <Box sx={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: '1 1 auto',
                    minWidth: 0, color: '#ffffff', textShadow: '0 1px 6px rgba(0,0,0,0.35)'
                }}>
                    <Typography sx={{
                        fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.18em',
                        color: 'rgba(255,255,255,0.72)', marginBottom: '2px'
                    }}>FOR YOU</Typography>
                    <Typography fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.1rem', lg: '1.25rem' }, ...clampLines(2) }}>
                        {music?.title}
                    </Typography>
                    <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.82)', ...clampLines(1) }}>
                        {artists}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '4px', sm: '8px' }, marginTop: { xs: '8px', sm: '12px' } }}>
                        <Button
                            variant='contained'
                            color='inherit'
                            disableElevation
                            startIcon={<PlayArrowRoundedIcon />}
                            onClick={props.onPlay}
                            sx={{
                                backgroundColor: '#ffffff',
                                color: '#16171a',
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: '999px',
                                padding: '4px 16px 4px 12px',
                                minWidth: '72px',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.24)',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.88)' },
                                '& .MuiButton-startIcon': { marginLeft: 0, marginRight: '4px' },
                                '@media(max-width:600px)': {
                                    minWidth: 0,
                                    padding: '4px 8px',
                                    '& .MuiButton-startIcon': { marginRight: 0 }
                                }
                            }}
                        >
                            <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>播放</Box>
                        </Button>
                        <IconButton
                            title='换一首'
                            onClick={props.onNext}
                            sx={{ color: '#ffffff', '&:hover': { background: 'rgba(255,255,255,0.16)' } }}
                        >
                            <SkipNext sx={{ fontSize: '1.5rem' }} />
                        </IconButton>
                        <IconButton
                            title={music?.isFavorite ? '取消收藏' : '收藏'}
                            onClick={props.onFavorite}
                            sx={{ color: '#ffffff', '&:hover': { background: 'rgba(255,255,255,0.16)' } }}
                        >
                            {music?.isFavorite ? <FavoriteOutlinedIcon /> : <FavoriteBorderOutlinedIcon />}
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

/**
 * 推荐区右侧的方形快捷入口卡
 */
interface IQuickCard {
    title: string,
    caption: string,
    /** 四宫格封面（优先级高于 image，不足 4 张时剩余格子用 tone 填充） */
    images?: (string | null | undefined)[],
    image?: string,
    /** 无封面时使用的渐变底色 */
    tone?: string,
    icon: ReactNode,
    onClick?: () => void,
}

function QuickCard(props: IQuickCard) {
    const clickable = typeof props.onClick === 'function';
    return (
        <Box
            onClick={props.onClick}
            sx={[{
                position: 'relative',
                height: '100%',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-end',
                // 阴影用 filter 而非 box-shadow：filter 与 transform 同在合成器插值，避免 box-shadow 逐帧重绘跟不上浮动动画
                filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.12))',
                transition: 'transform 0.22s ease-in-out, filter 0.22s ease-in-out',
            }, clickable && {
                cursor: 'pointer',
                ':hover': { transform: 'translateY(-6px)', filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.24))' },
                ':hover .quick-card-media': { transform: 'scale(1.06)' },
                // 触屏设备无 hover，避免点按后卡片停留在上浮状态
                '@media (hover: none)': {
                    ':hover': { transform: 'none', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.12))' },
                    ':hover .quick-card-media': { transform: 'none' },
                }
            }]}
        >
            {
                props.images && props.images.length > 0
                    ? <Box className='quick-card-media' sx={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
                        gap: '2px', backgroundColor: 'rgba(0,0,0,0.3)',
                        transition: 'transform 0.35s ease-in-out'
                    }}>
                        {Array.from({ length: 4 }).map((_, index) => {
                            const url = props.images?.[index];
                            return url
                                ? <CardMedia key={index} component='img' src={coverUrlOf(url)} sx={{ width: '100%', height: '100%', objectFit: 'cover' } as const} />
                                : <Box key={index} sx={{ background: props.tone ?? 'rgba(255,255,255,0.06)' }} />;
                        })}
                    </Box>
                    : props.image
                        ? <CardMedia className='quick-card-media' component='img' src={props.image} sx={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            objectFit: 'cover', transition: 'transform 0.35s ease-in-out'
                        }} />
                        : <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: props.tone }} />
            }
            <Box sx={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.06) 42%, rgba(0,0,0,0.72) 100%)'
            }} />
            <Box sx={{ position: 'absolute', top: '10px', left: '12px', color: 'rgba(255,255,255,0.88)' }}>{props.icon}</Box>
            <Box sx={{ position: 'relative', width: '100%', padding: { xs: '8px 10px', sm: '10px 12px' }, userSelect: 'none' }}>
                <Typography noWrap sx={{ color: '#ffffff', fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, lineHeight: 1.3 }}>
                    {props.title}
                </Typography>
                <Typography noWrap sx={{ color: 'rgba(255,255,255,0.75)', fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                    {props.caption}
                </Typography>
            </Box>
        </Box>
    )
}

interface IAlbumCard {
    album: AlbumVo
}

function AlbumCard(props: IAlbumCard) {
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
                        onError={() => setLoaded(true)}
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

function Home() {
    const router = useRouter();
    //专辑管理为管理类功能，非 root 角色不展示指向该页的入口
    const { userDetail } = useContext(HeiMusicUserContext);
    const isRoot = userDetail?.role === 'root';

    const [firstLaunch, setFirstLaunch] = useState(false);
    const [recentUploadAlbum, setRecentUploadAlbum] = useState<AlbumVo[]>([]);
    const [recentUploadLoaded, setRecentUploadLoaded] = useState(false);
    //最近上传可见数量联动宽高：列数随容器宽、行数随首屏剩余高度，恒为整行
    const [visibleAlbumCount, setVisibleAlbumCount] = useState(16);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const albumGridSectionRef = useRef<HTMLDivElement>(null);
    const albumGridRef = useRef<HTMLDivElement>(null);
    const [Toast, makeToast] = useToast()

    //猜你喜欢：优先同口味推荐（similar 批量预取、本地轮换），无历史或候选听尽回落纯随机
    const [recommendMusic, setRecommendMusic] = useState<MusicVo>(undefined);
    const similarQueueRef = useRef<MusicVo[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const coverRef = useRef<HTMLImageElement>(null);
    const [heroBackdrop, setHeroBackdrop] = useState<IRgbColor>(DEFAULT_BACKDROP)

    //每日30首：前 4 首封面拼四宫格；曲库不足 100 首时后端报业务错误，静默回落占位卡
    const [daily30Covers, setDaily30Covers] = useState<(string | null)[]>([]);
    const [daily30Unavailable, setDaily30Unavailable] = useState(false);

    //我喜欢卡：数量与前 4 首封面（失败按无收藏渲染，不打扰首屏）
    const [favoriteMusics, setFavoriteMusics] = useState<MusicVo[]>([]);

    //首页横滑行：最近播放 / 最常播放 / 久未重现（空数据整节隐藏，失败静默）
    const [recentHistory, setRecentHistory] = useState<PlayHistoryVo[]>([]);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [mostPlayedHistory, setMostPlayedHistory] = useState<PlayHistoryVo[]>([]);
    const [mostPlayedLoaded, setMostPlayedLoaded] = useState(false);
    const [forgottenMusics, setForgottenMusics] = useState<MusicVo[]>([]);
    const [forgottenLoaded, setForgottenLoaded] = useState(false);
    useEffect(() => {
        AlbumControllerService.getRecentUpload(1, RECENT_UPLOAD_FETCH_SIZE)
            .then(res => {
                setRecentUploadAlbum(res.data)
                if (res.data.length === 0) {
                    setFirstLaunch(true);
                }
            })
            .catch(error => {
                makeToast('网络连接失败', 'error', 'bottom-left')
            })
            .finally(() => {
                setRecentUploadLoaded(true);
            })

        //猜你喜欢：批量预取同口味推荐（首曲上 Hero、其余进本地队列供「换一首」轮换），空结果/失败回落纯随机
        const fetchRandomFallback = () => {
            AlbumControllerService.randomMusic()
                .then(res => {
                    setRecommendMusic(res.data)
                })
                .catch((error: ApiError) => {
                    if (error.status !== 403) {
                        makeToast(error.message, "error", "bottom-left");
                    }
                })
        }
        RecommendControllerService.similar(SIMILAR_BATCH_SIZE)
            .then(res => {
                if ((res.data?.length ?? 0) > 0) {
                    similarQueueRef.current = res.data.slice(1)
                    setRecommendMusic(res.data[0])
                } else {
                    fetchRandomFallback()
                }
            })
            .catch(fetchRandomFallback)

        //每日30首：取前 4 首封面拼四宫格；曲库不足 100 首时后端报业务错误，静默回落占位卡
        AlbumControllerService.daily30()
            .then(res => {
                setDaily30Covers(res.data.slice(0, 4).map(music => music.albumCoverUrl))
            })
            .catch(() => {
                setDaily30Unavailable(true)
            })

        //最近播放 / 最常播放横滑行
        PlayHistoryControllerService.getRecentList(HISTORY_ROW_SIZE)
            .then(res => {
                setRecentHistory(res.data ?? [])
            })
            .catch(() => { })
            .finally(() => {
                setHistoryLoaded(true)
            })

        PlayHistoryControllerService.getMostPlayedList(HISTORY_ROW_SIZE)
            .then(res => {
                setMostPlayedHistory(res.data ?? [])
            })
            .catch(() => { })
            .finally(() => {
                setMostPlayedLoaded(true)
            })

        //久未重现（以前常听、近 90 天没听）
        RecommendControllerService.forgotten(90, HISTORY_ROW_SIZE)
            .then(res => {
                setForgottenMusics(res.data ?? [])
            })
            .catch(() => { })
            .finally(() => {
                setForgottenLoaded(true)
            })

        //我喜欢卡：取数量与前 4 首封面
        PlaylistControllerService.getMyFavoriteMusicList()
            .then(res => {
                setFavoriteMusics(res.data ?? [])
            })
            .catch(() => { })

    }, [makeToast])

    //可见专辑数：数据就绪/容器宽高变化时重算，恒为整行，正好填满首屏剩余高度
    useEffect(() => {
        const scrollEl = scrollContainerRef.current;
        const sectionEl = albumGridSectionRef.current;
        const gridEl = albumGridRef.current;
        if (scrollEl === null || sectionEl === null) {
            return;
        }
        const recompute = () => {
            const gap = gridEl !== null ? (parseFloat(window.getComputedStyle(gridEl).rowGap) || 20) : 20;
            //列数与 albumGridSx 的 auto-fill minmax(150px, 1fr) 同公式
            const width = sectionEl.getBoundingClientRect().width;
            const cols = Math.max(1, Math.floor((width + gap) / (ALBUM_CARD_MIN_WIDTH + gap)));
            //行高优先取已渲染网格的首行轨道高度（含标题文案），数据未就绪时按 卡片宽 + 文案区 估算
            const firstTrack = gridEl !== null ? parseFloat(window.getComputedStyle(gridEl).gridTemplateRows.split(' ')[0]) : NaN;
            const rowHeight = !isNaN(firstTrack) && firstTrack > 0
                ? firstTrack
                : (width - (cols - 1) * gap) / cols + 60;
            //可用高度 = 滚动视口高 - 网格顶部布局距离 - 底部内边距；至少 2 行，窄屏靠滚动浏览
            const distanceFromTop = sectionEl.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;
            const available = scrollEl.clientHeight - (parseFloat(window.getComputedStyle(scrollEl).paddingBottom) || 0) - distanceFromTop;
            const rows = Math.max(2, Math.floor((available + gap) / (rowHeight + gap)));
            const cap = recentUploadLoaded ? recentUploadAlbum.length : RECENT_UPLOAD_FETCH_SIZE;
            let count = Math.min(cols * rows, cap);
            count -= count % cols;
            //曲库不足一整行时全部展示，接受残行
            if (count === 0 && recentUploadLoaded && recentUploadAlbum.length > 0) {
                count = Math.min(recentUploadAlbum.length, cols);
            }
            setVisibleAlbumCount(count);
        };
        recompute();
        const observer = new ResizeObserver(recompute);
        observer.observe(scrollEl);
        observer.observe(sectionEl);
        return () => observer.disconnect();
        //上方横滑行区块的出现/隐藏会改变网格顶部位置，需一并触发重算
    }, [recentUploadLoaded, recentUploadAlbum.length, historyLoaded, recentHistory.length, mostPlayedLoaded, mostPlayedHistory.length, forgottenLoaded, forgottenMusics.length])

    //选取背景色：采样整张封面并剔除接近纯黑/纯白的像素，避免高光与阴影把主色拉偏
    const handleRandomMusicCoverLoaded = () => {
        if (canvasRef.current === null || coverRef.current === null) {
            return;
        }
        try {
            const img = coverRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx === null) {
                return;
            }
            canvas.width = 48;
            canvas.height = 48;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let r = 0, g = 0, b = 0, count = 0;
            //每 3 个像素取一个样，足够稳定且开销可忽略
            for (let i = 0; i < data.length; i += 12) {
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                if (brightness < 24 || brightness > 235) {
                    continue;
                }
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
            if (count === 0) {
                return;
            }
            //整体压暗并提升饱和度：封面取色普遍偏亮，处理后白色文字才有足够对比度
            setHeroBackdrop(toBackdropColor(r / count, g / count, b / count))
        } catch (error) {
            //跨源图片会污染画布导致 getImageData 抛错，保留默认底色即可
            console.log(error)
        }
    }

    const playMusic = (music: MusicVo) => {
        const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
            detail: {
                playlist: [toMusicInfo(music)], startIndex: 0
            }
        });
        document.dispatchEvent(event)
    }

    //横滑行曲目数据（PlayHistoryVo 的 music 为可选字段，缺失的直接丢弃）
    const recentMusicInfos = useMemo(() => recentHistory.flatMap(history => history.music ? [toMusicInfo(history.music)] : []), [recentHistory]);
    const recentTimeCaptions = useMemo(() => recentHistory.flatMap(history => history.music ? [relativeTimeOf(history.lastPlayedAt)] : []), [recentHistory]);
    const mostPlayedMusicInfos = useMemo(() => mostPlayedHistory.flatMap(history => history.music ? [toMusicInfo(history.music)] : []), [mostPlayedHistory]);
    const forgottenMusicInfos = useMemo(() => forgottenMusics.map(music => toMusicInfo(music)), [forgottenMusics]);

    //删除单条播放记录（最近播放与最常播放两行同步移除）
    const handleRemoveHistory = (musicId: number) => {
        PlayHistoryControllerService.removeHistory(musicId)
            .then(() => {
                setRecentHistory(prev => prev.filter(history => history.music?.musicId !== musicId));
                setMostPlayedHistory(prev => prev.filter(history => history.music?.musicId !== musicId));
                makeToast('已删除该条播放记录', 'success', 'bottom-left')
            })
            .catch((error) => {
                makeToast(error.message, 'error', 'bottom-left')
            })
    }

    const handlePlayRecommendMusic = () => {
        if (!recommendMusic) {
            return;
        }
        playMusic(recommendMusic);
    }

    //换一首：优先消费本地预取队列，队列空时再批量拉取；空结果/失败回落纯随机
    const handleNextRecommendMusic = () => {
        //跨批次有放回抽样可能抽回当前这首，跳过避免连播重复
        while (similarQueueRef.current.length > 0) {
            const candidate = similarQueueRef.current.shift();
            if (candidate.musicId !== recommendMusic?.musicId) {
                setRecommendMusic(candidate)
                playMusic(candidate);
                return;
            }
        }
        RecommendControllerService.similar(SIMILAR_BATCH_SIZE)
            .then(res => {
                if ((res.data?.length ?? 0) > 0) {
                    const next = res.data.find(music => music.musicId !== recommendMusic?.musicId) ?? res.data[0];
                    similarQueueRef.current = res.data.filter(music => music.musicId !== next.musicId)
                    setRecommendMusic(next)
                    playMusic(next);
                } else {
                    return AlbumControllerService.randomMusic()
                        .then(res => {
                            setRecommendMusic(res.data)
                            playMusic(res.data);
                        })
                        .catch((error: ApiError) => {
                            if (error.status !== 403) {
                                makeToast(error.message, "error", "bottom-left");
                            }
                        })
                }
            })
            .catch((error: ApiError) => {
                if (error.status !== 403) {
                    makeToast(error.message, "error", "bottom-left");
                }
            })

    }

    const handleFavorite = () => {
        if (recommendMusic.isFavorite) {
            PlaylistControllerService.removeMusicFavorite(recommendMusic.musicId)
                .then(res => {
                    setRecommendMusic(prev => ({ ...prev, isFavorite: !prev.isFavorite }))
                })
                .catch((error) => {
                    makeToast(error.message, "error", "bottom-left");
                })
        } else {
            PlaylistControllerService.addMusicFavorite(recommendMusic.musicId)
                .then(res => {
                    setRecommendMusic(prev => ({ ...prev, isFavorite: !prev.isFavorite }))
                })
                .catch((error) => {
                    makeToast(error.message, "error", "bottom-left");
                })
        }

    }

    return (
        <Box ref={scrollContainerRef} sx={{ width: '100%', height: '100%', padding: { xs: '12px 12px 24px', sm: '16px 16px 28px' }, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {Toast}
            {/* 首次启动：还没有任何音乐时的引导 */}
            <Box sx={[{ display: 'none' }, firstLaunch && { display: 'flex', flexDirection: 'column' }]}>
                <Box sx={{ margin: 'auto', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 24px' }}>
                    <Avatar src='/images/logo.jpg' sx={{ width: 64, height: 64, marginBottom: '18px' }} />
                    <Typography variant='h5' fontWeight={700} sx={{ marginBottom: '8px', userSelect: 'none' }}>欢迎使用 HeiMusic!</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ marginBottom: '24px', lineHeight: 1.8, userSelect: 'none' }}>
                        管理员账户由服务端自动创建，初始密码见服务端日志；
                        <br />
                        将本地音乐放入媒体库后扫描即可开始使用
                    </Typography>
                    {isRoot && <Button variant='contained' disableElevation onClick={() => { router.push('/album/management') }}>导入音乐</Button>}
                </Box>
            </Box>
            <Box sx={[{ display: 'flex', flexDirection: 'column', width: '100%' }, firstLaunch && { display: 'none' }]}>
                {/* 推荐 */}
                <SectionTitle title='推荐' caption='为你精选' />
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: '3fr 1fr 1fr' },
                    gridAutoRows: { xs: '168px', sm: '200px', lg: '224px' },
                    gap: { xs: '12px', sm: '16px', lg: '20px' },
                    marginBottom: { xs: '20px', sm: '28px' },
                }}>
                    {/* 猜你喜欢 */}
                    {
                        recommendMusic
                            ? <RecommendHero
                                music={recommendMusic}
                                backdrop={heroBackdrop}
                                coverRef={coverRef}
                                canvasRef={canvasRef}
                                onCoverLoad={handleRandomMusicCoverLoaded}
                                onPlay={handlePlayRecommendMusic}
                                onNext={handleNextRecommendMusic}
                                onFavorite={handleFavorite}
                            />
                            : <Skeleton variant='rounded' sx={{ gridColumn: { xs: 'span 2', sm: 'span 1' }, height: '100%', borderRadius: '16px', transform: 'unset' }} />
                    }
                    {/* 每日30首 */}
                    <QuickCard
                        title='每日30首'
                        caption={daily30Unavailable ? '曲库满 100 首后开启' : '每天 6 点更新'}
                        images={daily30Covers}
                        tone='linear-gradient(135deg, #f6a23c 0%, #f65c4c 55%, #d64577 100%)'
                        icon={<AutoAwesomeRoundedIcon />}
                        onClick={() => { router.push('/daily30') }}
                    />
                    {/* 我喜欢（与侧边栏入口同一页面） */}
                    <QuickCard
                        title='我喜欢'
                        caption={favoriteMusics.length > 0 ? `已收藏 ${favoriteMusics.length} 首` : '收藏喜欢的音乐'}
                        images={favoriteMusics.slice(0, 4).map(music => music.albumCoverUrl)}
                        tone='linear-gradient(135deg, #ef7d9a 0%, #d6556a 55%, #a855b8 100%)'
                        icon={<FavoriteOutlinedIcon />}
                        onClick={() => { router.push('/favoriate') }}
                    />
                </Box>
                {/* 最新上传 */}
                <Box sx={{ marginBottom: { xs: '20px', sm: '28px' } }}>
                    <SectionTitle
                        title='最新上传'
                        caption='最近入库的专辑'
                        action={
                            isRoot
                                ? <Button size='small' onClick={() => { router.push('/album/management') }} sx={{ textTransform: 'none' }}>全部专辑</Button>
                                : undefined
                        }
                    />
                    {/* 测量锚点：宽高联动可见数量的参考盒（骨架、空状态、网格都在其内） */}
                    <Box ref={albumGridSectionRef}>
                        {/* 加载中骨架 */}
                        <Box sx={[albumGridSx, recentUploadLoaded && { display: 'none' }]}>
                            {Array.from({ length: visibleAlbumCount }).map((_, index) => (
                                <Skeleton key={index} variant='rounded' sx={{ ...squareBoxSx, borderRadius: '12px', transform: 'unset' }} />
                            ))}
                        </Box>
                        {/* 空状态 */}
                        {
                            recentUploadLoaded && recentUploadAlbum.length === 0 &&
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: { xs: '32px 0 40px', sm: '40px 0 56px' }, color: 'text.secondary', userSelect: 'none' }}>
                                <LibraryMusicOutlinedIcon sx={{ fontSize: '44px', opacity: 0.35 }} />
                                <Typography variant='subtitle2' sx={{ marginTop: '12px' }}>暂无音乐</Typography>
                                <Typography variant='caption'>扫描本地媒体库后，专辑会出现在这里</Typography>
                                {isRoot && <Button size='small' sx={{ marginTop: '12px', textTransform: 'none' }} onClick={() => { router.push('/album/management') }}>前往专辑管理</Button>}
                            </Box>
                        }
                        {/* 专辑网格 */}
                        <Box ref={albumGridRef} sx={[albumGridSx, !recentUploadLoaded && { display: 'none' }]}>
                            {
                                recentUploadAlbum.slice(0, visibleAlbumCount).map((album, index) => {
                                    return <AlbumCard key={index} album={album} />
                                })
                            }
                        </Box>
                    </Box>
                </Box>
                {/* 最近播放（空数据整节隐藏） */}
                {
                    !(historyLoaded && recentHistory.length === 0) &&
                    <Box sx={{ marginBottom: { xs: '20px', sm: '28px' } }}>
                        <SectionTitle
                            title='最近播放'
                            caption='接着上次的继续听'
                            action={<Button size='small' onClick={() => { router.push('/recent') }} sx={{ textTransform: 'none' }}>查看全部</Button>}
                        />
                        {
                            historyLoaded
                                ? <MusicRow musicList={recentMusicInfos} cornerCaptions={recentTimeCaptions} menuType='history' onHistoryDelete={handleRemoveHistory} />
                                : <MusicRowSkeleton />
                        }
                    </Box>
                }
                {/* 最常播放（空数据整节隐藏） */}
                {
                    !(mostPlayedLoaded && mostPlayedHistory.length === 0) &&
                    <Box sx={{ marginBottom: { xs: '20px', sm: '28px' } }}>
                        <SectionTitle
                            title='最常播放'
                            caption='经常播放的歌曲'
                            action={<Button size='small' onClick={() => { router.push('/mostplayed') }} sx={{ textTransform: 'none' }}>查看全部</Button>}
                        />
                        {
                            mostPlayedLoaded
                                ? <MusicRow musicList={mostPlayedMusicInfos} menuType='history' onHistoryDelete={handleRemoveHistory} showRank />
                                : <MusicRowSkeleton />
                        }
                    </Box>
                }
                {/* 久未重现（空数据整节隐藏） */}
                {
                    !(forgottenLoaded && forgottenMusics.length === 0) &&
                    <Box sx={{ marginBottom: { xs: '20px', sm: '28px' } }}>
                        <SectionTitle
                            title='久未重现'
                            caption='以前常听 · 近 90 天没听'
                        />
                        {
                            forgottenLoaded
                                ? <MusicRow musicList={forgottenMusicInfos} menuType='favorite' />
                                : <MusicRowSkeleton />
                        }
                    </Box>
                }
            </Box>
        </Box>
    )
}

export default Home;
