import Box from '@mui/material/Box'
import CardMedia from '@mui/material/CardMedia'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { useTheme } from '@mui/styles'
import { useEffect, useRef, useState } from 'react'

import useMusicContextMenu from '@components/MusicContextMenu'
import { IChangePlayListEvent, IMusicInfo } from '@components/MusicControlPannel/MusicControlPannel'
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

/** 横滑行卡片间距（行与骨架行共用，保持加载前后不跳动） */
const musicRowGap = { xs: '14px', sm: '20px', lg: '24px' } as const;

/** 卡片宽度（行与骨架行共用） */
const musicCardWidth = { xs: '104px', sm: '128px' } as const;

/** 滚动条：恒定 6px 占位、拇指默认透明，悬停行时浮现——保持整洁的同时不牺牲鼠标用户的可发现性
 *  （普通滚轮无法滚动横向容器，完全隐藏会让整行滚不动；高度恒定可避免浮现时挤压内容导致卡片跳动） */
const rowScrollSx = {
    // Firefox（scrollbar-color 同样以透明实现默认隐藏）
    scrollbarWidth: 'thin',
    scrollbarColor: 'transparent transparent',
    '::-webkit-scrollbar': { height: '6px' },
    '::-webkit-scrollbar-thumb': { background: 'transparent', borderRadius: '3px' },
    '::-webkit-scrollbar-track': { background: 'transparent' },
    ':hover': {
        scrollbarColor: 'rgba(128,128,128,0.4) transparent',
    },
    ':hover::-webkit-scrollbar-thumb': { background: 'rgba(128,128,128,0.4)' },
} as const;

interface IMusicRowCard {
    music: IMusicInfo,
    /** 点击播放的起始下标（整行作为播放列表） */
    index: number,
    /** 左上角排名角标（最常播放行用），从 1 开始 */
    rank?: number,
    /** 封面右下角的小角标文案（最近播放行的相对时间，如「3 天前」） */
    cornerCaption?: string,
    onPlay: (index: number) => void,
    onContextMenu: (event: React.MouseEvent, index: number) => void,
}

function MusicRowCard(props: IMusicRowCard) {
    const theme = useTheme();
    const [loaded, setLoaded] = useState(false);
    const cover = coverUrlOf(props.music.cover);
    const artists = props.music.artists.join(' / ');

    return (
        <Box
            sx={{
                flex: '0 0 auto', width: musicCardWidth, minWidth: 0,
                cursor: 'pointer',
                ':hover .row-title': { color: theme.palette.primary.main },
            }}
            onClick={() => { props.onPlay(props.index) }}
            onContextMenu={event => { props.onContextMenu(event, props.index) }}
        >
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
                ':hover .row-cover-media': { transform: 'scale(1.05)' },
                ':hover .row-cover-mask': { opacity: 1 },
                // 触屏设备无 hover，点击即播放，无需遮罩与上浮
                '@media (hover: none)': {
                    ':hover': { transform: 'none', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.10))' },
                    ':hover .row-cover-media': { transform: 'none' },
                    ':hover .row-title': { color: 'inherit' },
                }
            }}>
                {
                    !loaded &&
                    <Skeleton variant='rectangular' sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'unset' }} />
                }
                <CardMedia
                    className='row-cover-media'
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
                <Box className='row-cover-mask' sx={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.42)', opacity: 0, transition: 'opacity 0.2s ease-in-out',
                }}>
                    <PlayArrowRoundedIcon sx={{ color: '#ffffff', fontSize: '2rem' }} />
                </Box>
                {
                    props.rank !== undefined &&
                    <Box sx={{
                        position: 'absolute', top: 6, left: 6, zIndex: 2,
                        minWidth: 20, height: 20, padding: '0 5px', borderRadius: '6px',
                        backgroundColor: 'rgba(0,0,0,0.6)', color: '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 700, userSelect: 'none',
                    }}>
                        {props.rank}
                    </Box>
                }
                {
                    props.cornerCaption &&
                    <Box sx={{
                        position: 'absolute', right: 6, bottom: 6, zIndex: 2,
                        padding: '1px 6px', borderRadius: '6px',
                        backgroundColor: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.92)',
                        fontSize: '0.66rem', userSelect: 'none', pointerEvents: 'none',
                    }}>
                        {props.cornerCaption}
                    </Box>
                }
            </Box>
            <Typography className='row-title' variant='subtitle2' sx={{
                marginTop: '8px', fontWeight: 600, ...clampLines(2),
                transition: 'color 0.2s ease-in-out'
            }}>{props.music.title}</Typography>
            {
                artists.length !== 0 &&
                <Typography variant='caption' color='text.secondary' noWrap sx={{ display: 'block', marginTop: '2px' }}>{artists}</Typography>
            }
        </Box>
    )
}

/**
 * 首页/列表页的曲目横滑行：整行作为播放列表，点击任意卡片从该曲开始播放；
 * 卡片右键/长按弹出音乐菜单（menuType='history' 时多一项「删除播放记录」）
 */
interface IMusicRow {
    musicList: IMusicInfo[],
    menuType: 'favorite' | 'history',
    /** menuType 为 history 时删除单条播放记录的回调 */
    onHistoryDelete?: (musicId: number) => void,
    /** 卡片左上角显示排名角标（最常播放行用） */
    showRank?: boolean,
    /** 卡片右下角的小角标文案，按 musicList 下标对齐（最近播放行传相对时间） */
    cornerCaptions?: string[],
}

export default function MusicRow(props: IMusicRow) {
    const [MusicContextMenu, popupMusicContextMenu] = useMusicContextMenu({
        musicList: props.musicList,
        menuType: props.menuType,
        onHistoryDelete: props.onHistoryDelete,
    });
    //右缘渐隐提示还有更多内容可横滑；滚到尽头/无溢出时取消遮罩（mask 渐隐透出的是真实背景，兼容带背景图的半透明面板主题）
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el === null) {
            return;
        }
        const check = () => {
            setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
        };
        check();
        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, [props.musicList.length]);

    const playFrom = (index: number) => {
        const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
            detail: {
                playlist: props.musicList,
                startIndex: index
            }
        });
        document.dispatchEvent(event)
    }

    return (
        <Box
            ref={scrollContainerRef}
            onScroll={() => {
                const el = scrollContainerRef.current;
                if (el !== null) {
                    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
                }
            }}
            sx={[{
                display: 'flex', gap: musicRowGap, overflowX: 'auto', paddingBottom: '8px', ...rowScrollSx
            }, canScrollRight && {
                WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 40px), transparent 100%)',
                maskImage: 'linear-gradient(to right, #000 calc(100% - 40px), transparent 100%)',
            }]}
        >
            {
                props.musicList.map((music, index) => (
                    <MusicRowCard
                        key={music.musicId}
                        music={music}
                        index={index}
                        rank={props.showRank ? index + 1 : undefined}
                        cornerCaption={props.cornerCaptions?.[index]}
                        onPlay={playFrom}
                        onContextMenu={(event, index) => {
                            event.preventDefault();
                            popupMusicContextMenu({ left: event.clientX, top: event.clientY }, index);
                        }}
                    />
                ))
            }
            {MusicContextMenu}
        </Box>
    )
}

/** 横滑行的加载骨架（与 MusicRow 的卡片尺寸、间距一致，加载前后不跳动） */
export function MusicRowSkeleton(props: { count?: number }) {
    const count = props.count ?? 8;
    return (
        <Box sx={{ display: 'flex', gap: musicRowGap, overflow: 'hidden', paddingBottom: '8px' }}>
            {
                Array.from({ length: count }).map((_, index) => (
                    <Box key={index} sx={{ flex: '0 0 auto', width: musicCardWidth }}>
                        <Skeleton variant='rounded' sx={{ ...squareBoxSx, borderRadius: '12px', transform: 'unset' }} />
                        <Skeleton variant='text' sx={{ transform: 'unset' }} />
                        <Skeleton variant='text' width='60%' sx={{ transform: 'unset' }} />
                    </Box>
                ))
            }
        </Box>
    )
}
