import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined'
import { useCallback, useEffect, useRef, useState } from 'react'

import { AlbumControllerService, AlbumVo } from '@api/codegen'
import AlbumCard from '@components/AlbumCard'

/** 流式加载的单批数量 */
const PAGE_SIZE = 20;

/** 总上限：只展示最近上传的 100 张专辑 */
const MAX_ALBUM_COUNT = 100;

/** 追加加载时网格尾部骨架的数量（约一行，整批 20 个占位过多会让网格跳行） */
const APPEND_SKELETON_COUNT = 8;

/** 专辑网格：与首页「最新上传」一致，按可用宽度自动铺满，避免固定列数在超宽屏留下大面积空白 */
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

/** 专辑卡片骨架（首屏与追加加载共用）：文字行上边距对齐 AlbumCard 的标题/艺人（8px/2px）——
 *  variant='text' 的 Skeleton 自带 margin:0，不补边距会与封面紧贴、加载前后跳动 */
function AlbumCardSkeleton() {
    return (
        <Box>
            <Skeleton variant='rounded' sx={{ ...squareBoxSx, borderRadius: '12px', transform: 'unset' }} />
            <Skeleton variant='text' sx={{ transform: 'unset', marginTop: '8px' }} />
            <Skeleton variant='text' width='60%' sx={{ transform: 'unset', marginTop: '2px' }} />
        </Box>
    )
}

/**
 * 最近上传的专辑：普通用户可浏览的专辑流（专辑管理页仅 root 可见），
 * getRecentUpload 分页流式加载，滚到视口底部（提前 400px）自动追加，到 100 张或短页为止
 */
export default function RecentUploadAlbums() {
    const [albums, setAlbums] = useState<AlbumVo[]>([]);
    //首批是否已返回（成功或失败都算，用于切换首屏骨架）
    const [firstLoaded, setFirstLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [finished, setFinished] = useState(false);
    const [failed, setFailed] = useState(false);
    //请求中/已到头/分页游标/累计数量走 ref 镜像：IntersectionObserver 回调与 fetchNext 闭包读不到最新 state
    const loadingRef = useRef(false);
    const finishedRef = useRef(false);
    const failedRef = useRef(false);
    const nextPageRef = useRef(1);
    const loadedCountRef = useRef(0);
    const sentinelRef = useRef<HTMLDivElement>(null);

    /** 加载下一批并追加：短页或到 100 张封顶（截断溢出）；失败停在当前页供重试（不前进游标） */
    const fetchNext = useCallback(() => {
        if (loadingRef.current || finishedRef.current || failedRef.current) {
            return;
        }
        loadingRef.current = true;
        setLoading(true);
        AlbumControllerService.getRecentUpload(nextPageRef.current, PAGE_SIZE)
            .then(res => {
                const batch = res.data ?? [];
                loadedCountRef.current += batch.length;
                //到 100 张时截掉本批溢出部分
                const overflow = loadedCountRef.current - MAX_ALBUM_COUNT;
                const trimmed = overflow > 0 ? batch.slice(0, batch.length - overflow) : batch;
                setAlbums(prev => [...prev, ...trimmed]);
                nextPageRef.current += 1;
                if (batch.length < PAGE_SIZE || loadedCountRef.current >= MAX_ALBUM_COUNT) {
                    finishedRef.current = true;
                    setFinished(true);
                }
            })
            .catch(() => {
                failedRef.current = true;
                setFailed(true);
            })
            .finally(() => {
                loadingRef.current = false;
                setLoading(false);
                setFirstLoaded(true);
            });
    }, []);

    /** 失败重试：清失败标记后重新加载当前页 */
    const retry = useCallback(() => {
        failedRef.current = false;
        setFailed(false);
        fetchNext();
    }, [fetchNext]);

    //首批直接加载（首屏骨架可能高过视口，哨兵不可见，不能只依赖 IntersectionObserver）
    useEffect(() => {
        fetchNext();
    }, [fetchNext]);

    //触底哨兵：进入视口（提前 400px）加载下一批；依赖 albums.length 让每批追加后重新挂观察器——
    //observe() 会立即回调一次当前相交状态，内容仍不满一屏时无需滚动即可继续加载
    useEffect(() => {
        const el = sentinelRef.current;
        if (el === null) {
            return;
        }
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                fetchNext();
            }
        }, { rootMargin: '400px 0px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, [fetchNext, albums.length]);

    return (
        <Box sx={{ width: '100%', height: '100%', padding: { xs: '12px 12px 24px', sm: '16px 16px 28px' }, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant='h5' sx={{ marginBottom: '4px' }}>最近上传</Typography>
            <Typography variant='caption' color='text.secondary' sx={{ marginBottom: '16px' }}>最近入库的专辑，最多展示 {MAX_ALBUM_COUNT} 张</Typography>
            {/* 首屏骨架 */}
            {
                !firstLoaded &&
                <Box sx={albumGridSx}>
                    {
                        Array.from({ length: PAGE_SIZE }).map((_, index) => (
                            <AlbumCardSkeleton key={index} />
                        ))
                    }
                </Box>
            }
            {/* 空状态 */}
            {
                firstLoaded && albums.length === 0 && !failed &&
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', color: 'text.secondary', userSelect: 'none' }}>
                    <LibraryMusicOutlinedIcon sx={{ fontSize: '44px', opacity: 0.35 }} />
                    <Typography variant='subtitle2' sx={{ marginTop: '12px' }}>暂无专辑</Typography>
                </Box>
            }
            {/* 专辑网格（追加加载时尾部拼一段骨架占位） */}
            {
                albums.length > 0 &&
                <Box sx={albumGridSx}>
                    {
                        albums.map((album, index) => (
                            <AlbumCard key={album.albumId ?? index} album={album} />
                        ))
                    }
                    {
                        loading && Array.from({ length: APPEND_SKELETON_COUNT }).map((_, index) => (
                            <AlbumCardSkeleton key={`skeleton-${index}`} />
                        ))
                    }
                </Box>
            }
            {/* 底部状态：失败重试 / 加载到头 */}
            {
                failed &&
                <Box sx={{ display: 'flex', justifyContent: 'center', padding: '20px 0 8px' }}>
                    <Button size='small' sx={{ textTransform: 'none' }} onClick={retry}>加载失败，点击重试</Button>
                </Box>
            }
            {
                finished && albums.length > 0 &&
                <Box sx={{ display: 'flex', justifyContent: 'center', padding: '20px 0 8px', color: 'text.secondary', userSelect: 'none' }}>
                    <Typography variant='caption'>
                        {albums.length >= MAX_ALBUM_COUNT ? `已展示最近 ${MAX_ALBUM_COUNT} 张专辑` : `共 ${albums.length} 张专辑`}
                    </Typography>
                </Box>
            }
            {/* 触底哨兵：常驻渲染，避免观察目标反复挂卸 */}
            <div ref={sentinelRef} />
        </Box>
    )
}
