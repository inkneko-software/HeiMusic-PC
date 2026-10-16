import { Capacitor, PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { ensureNativeApiBase } from './apiServer';

/**
 * Android 系统媒体会话桥接（本地插件 MediaSessionPlugin + 前台服务 PlaybackService）：
 * 正向——把曲目元数据/播放态推给原生 MediaSessionCompat + MediaStyle 前台通知，
 * 系统媒体控制（通知栏/锁屏/耳机按键）据此展示并按 speed 外推进度；
 * 反向——系统控制经 "mediaControlAction" 事件回传，由 MusicControlPannel 接线复用现有回调。
 * 非 Android 原生平台全部为空操作（Electron 走 thumbnail/playback IPC，网页端走 navigator.mediaSession）。
 */

/** 反向控制事件：seekTo 的 positionMs 为碟内相对毫秒（大碟单曲与面板进度同一口径） */
export interface IMediaControlAction {
    action: 'play' | 'pause' | 'toggle' | 'next' | 'prev' | 'seekTo';
    positionMs?: number;
}

/**
 * 曲目元数据入参：结构兼容 MusicControlPannel 的 IPlayingMusicInfo
 * （不直接 import 组件文件，避免 lib → components 循环引用）
 */
export interface IMediaSessionTrackInfo {
    musicId: number;
    title: string;
    artists: string[];
    albumTitle: string;
    cover: string | null;
    duration?: number;
    isLargeTrackMusic: boolean;
    discStartTime?: number;
    discEndTime?: number;
}

/** 本地插件 MediaSessionPlugin（android/.../MediaSessionPlugin.java）的桥接声明 */
interface MediaSessionPluginProtocol {
    requestNotificationPermission(): Promise<{ granted: boolean }>;
    updateMetadata(options: {
        musicId: number;
        title: string;
        artists: string;
        albumTitle: string;
        durationSec: number;
        coverUrl: string | null;
    }): Promise<void>;
    updatePlaybackState(options: { playing: boolean; positionSec: number; speed: number }): Promise<void>;
    stop(): Promise<void>;
    addListener(
        eventName: 'mediaControlAction',
        listener: (event: IMediaControlAction) => void
    ): Promise<PluginListenerHandle>;
    removeAllListeners(): Promise<void>;
}

const MediaSessionPlugin = registerPlugin<MediaSessionPluginProtocol>('MediaSessionPlugin');

// 通知权限每进程只请求一次（Android 13+ 首播弹窗），拒绝后不再骚扰
let notificationPermissionAsked = false;

/**
 * 原生监听只注册一次，分发到当前组件实例的处理函数：
 * effect 重挂时同步换绑（旧解绑是异步 remove，直接 addListener 会留下双监听窗口，
 * 同一系统事件触发两次——如 next 连跳两首）
 */
let activeActionHandler: ((event: IMediaControlAction) => void) | null = null;
let mediaControlListener: Promise<PluginListenerHandle | null> | null = null;

function ensureMediaControlListener(): void {
    if (mediaControlListener !== null) {
        return;
    }
    mediaControlListener = MediaSessionPlugin.addListener('mediaControlAction', (event) => {
        activeActionHandler?.(event);
    }).catch(() => null);
}

export const mediaSession = {
    /**
     * 推送曲目元数据：artists 预 join（与面板副标题一致）；时长统一为碟内相对秒
     * （大碟单曲 = discEndTime - discStartTime，与进度条同一口径）；封面拼绝对 URL 交原生下载
     */
    async updateMetadata(m: IMediaSessionTrackInfo): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;
        const coverUrl = m.cover ? await absoluteCoverUrl(m.cover) : null;
        const durationSec = m.isLargeTrackMusic
            ? (m.discEndTime ?? 0) - (m.discStartTime ?? 0)
            : (m.duration ?? 0);
        await MediaSessionPlugin.updateMetadata({
            musicId: m.musicId,
            title: m.title,
            artists: m.artists.join(' / '),
            albumTitle: m.albumTitle,
            durationSec,
            coverUrl,
        }).catch(() => { /* 兼容未包含该插件的旧 APK：静默 */ });
    },

    /** 推送播放态：positionSec 同为碟内相对秒；首次开播顺带请求通知权限（拒绝不阻断） */
    async updatePlaybackState(o: { playing: boolean; positionSec: number; speed?: number }): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;
        if (o.playing && !notificationPermissionAsked) {
            // 不 await 权限弹窗：弹窗悬置期间若发生暂停回推，会先于首次播放推送落库，
            // 弹窗关闭后的补发推送（last-write-wins）会把快照错置成 PLAYING
            notificationPermissionAsked = true;
            void MediaSessionPlugin.requestNotificationPermission().catch(() => ({ granted: false }));
        }
        await MediaSessionPlugin.updatePlaybackState({
            playing: o.playing,
            positionSec: o.positionSec,
            speed: o.speed ?? 1,
        }).catch(() => { /* 兼容旧 APK：静默 */ });
    },

    /** 渲染层主动收尾（预留退出场景）；正常退出由 MainActivity.onDestroy 兜底 */
    async stop(): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;
        await MediaSessionPlugin.stop().catch(() => { /* 兼容旧 APK：静默 */ });
    },

    /** 注册系统控制回调，返回解绑函数（同步换绑当前处理函数，见顶部 ensureMediaControlListener 注释） */
    bindActions(onAction: (event: IMediaControlAction) => void): () => void {
        if (!Capacitor.isNativePlatform()) return () => undefined;
        activeActionHandler = onAction;
        ensureMediaControlListener();
        return () => {
            if (activeActionHandler === onAction) {
                activeActionHandler = null;
            }
        };
    },
};

/** 封面相对路径（/public/...）→ 绝对 URL：经运行时持久化端点拼接（未就绪回落构建期默认值） */
async function absoluteCoverUrl(cover: string): Promise<string> {
    if (/^https?:\/\//.test(cover)) {
        return cover;
    }
    return (await ensureNativeApiBase()) + cover;
}
