import Box from '@mui/material/Box'
import CardMedia from '@mui/material/CardMedia'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { useTheme } from '@mui/styles'
import { useCallback, useEffect, useRef, useState } from 'react'

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

/** 滚动条：完全隐藏（横向翻页由两侧悬浮箭头承担，触屏仍可手势横滑、鼠标可 Shift+滚轮），容器本身保持可滚动 */
const rowScrollHiddenSx = {
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // 旧版 Edge
    '::-webkit-scrollbar': { display: 'none' }, // Chromium/WebKit
} as const;

/** 两侧悬浮翻页箭头的公共样式：圆形半透明深色底 + 白尖角；垂直居中于封面——封面为正方形、边长即卡片宽，
 *  top 取半宽（xs 104/2、sm 128/2）即封面中心；默认透明且不拦截点击，行悬停时经 :hover .row-nav 淡入 */
const navArrowSx = {
    position: 'absolute',
    top: { xs: 52, sm: 64 },
    transform: 'translateY(-50%)',
    zIndex: 3,
    width: { xs: 30, sm: 34 },
    height: { xs: 30, sm: 34 },
    padding: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(4px)',
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease-in-out, background-color 0.2s ease-in-out',
    ':hover': { backgroundColor: 'rgba(0,0,0,0.75)' },
    // 触屏设备无行悬停可言且手势横滑更自然，不显示悬浮箭头
    '@media (hover: none)': { display: 'none' },
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
    //两侧悬浮箭头与渐隐遮罩共用同一判定：对应方向还有未滚入的内容；8px 容差吸收亚像素与平滑滚动的尾差
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el === null) {
            return;
        }
        setCanScrollLeft(el.scrollLeft > 8);
        setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el === null) {
            return;
        }
        updateScrollState();
        const observer = new ResizeObserver(updateScrollState);
        observer.observe(el);
        return () => observer.disconnect();
    }, [props.musicList.length, updateScrollState]);

    /** 点击悬浮箭头的滚动量：可见宽度的 80%，平滑滚动 */
    const scrollByNav = (direction: -1 | 1) => {
        const el = scrollContainerRef.current;
        if (el !== null) {
            el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
        }
    };

    const playFrom = (index: number) => {
        const event = new CustomEvent<IChangePlayListEvent>("music-control-panel::changePlayList", {
            detail: {
                playlist: props.musicList,
                startIndex: index
            }
        });
        document.dispatchEvent(event)
    }

    //边缘渐隐遮罩：哪侧还有未滚入的内容就在哪侧渐隐（mask 渐隐透出的是真实背景，兼容带背景图的半透明面板主题）
    const rowMaskImage = `linear-gradient(to right, ${canScrollLeft ? 'transparent 0, #000 40px' : '#000 0'}, #000 calc(100% - ${canScrollRight ? '40px' : '0px'}), transparent 100%)`;

    return (
        <Box sx={{ position: 'relative', ':hover .row-nav': { opacity: 1, pointerEvents: 'auto' } }}>
            <Box
                ref={scrollContainerRef}
                onScroll={updateScrollState}
                sx={[{
                    display: 'flex', gap: musicRowGap, overflowX: 'auto', paddingBottom: '8px', ...rowScrollHiddenSx
                }, (canScrollLeft || canScrollRight) && {
                    WebkitMaskImage: rowMaskImage,
                    maskImage: rowMaskImage,
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
            {
                canScrollLeft &&
                <IconButton className='row-nav' aria-label='向左滚动' onClick={() => scrollByNav(-1)}
                    sx={{ ...navArrowSx, left: { xs: 2, sm: 4 } }}>
                    <ChevronLeftRoundedIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
                </IconButton>
            }
            {
                canScrollRight &&
                <IconButton className='row-nav' aria-label='向右滚动' onClick={() => scrollByNav(1)}
                    sx={{ ...navArrowSx, right: { xs: 2, sm: 4 } }}>
                    <ChevronRightRoundedIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
                </IconButton>
            }
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
