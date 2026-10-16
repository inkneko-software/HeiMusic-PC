package com.inkneko.heimusic;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.LruCache;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;
import android.webkit.CookieManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 媒体播放前台服务：真实播放器在 WebView 的 &lt;audio&gt; 里，本服务只持有 MediaSessionCompat
 * 作为系统侧的"影子会话"——元数据/播放态由渲染层经 MediaSessionPlugin 推送，系统据此展示
 * 媒体通知、锁屏与快捷设置控制；系统控制（通知栏/锁屏/耳机按键）经 Callback 回传渲染层。
 * 与插件的通信用"静态快照仓 + 运行实例"解耦两者生命周期：插件可在服务启动前写入（进暂存），
 * 服务也可活过插件实例（WebView 重建）。所有状态变更统一在主线程串行化，无需加锁。
 */
public class PlaybackService extends Service implements AudioManager.OnAudioFocusChangeListener {

    public static final String CHANNEL_ID = "heimusic_playback";
    public static final int NOTIFICATION_ID = 1001;

    /** 诊断日志标签：adb logcat -s HeiMusicMedia 过滤 */
    private static final String TAG = "HeiMusicMedia";

    // 通知按钮的动作（Android 12- 显示显式按钮；13+ 系统按钮由 PlaybackState 的 action 推导）
    private static final String ACTION_TOGGLE = "com.inkneko.heimusic.media.TOGGLE";
    private static final String ACTION_NEXT = "com.inkneko.heimusic.media.NEXT";
    private static final String ACTION_PREV = "com.inkneko.heimusic.media.PREV";
    private static final String ACTION_DELETE = "com.inkneko.heimusic.media.DELETE";

    /**
     * 音频焦点开关（2026-10-16 真机 dumpsys audio 实证后置 false）：Chromium 的 &lt;audio&gt;
     * 播放时自己会申请音频焦点（org.chromium...AudioFocusDelegate），本服务再申请会互相顶替——
     * 同 uid 内后申请者夺走焦点，被顶一方收到 LOSS 立即暂停，表现为"按下播放后自动暂停"。
     * 焦点行为全部交由 Chromium 承担（其他应用抢占暂停、来电暂停恢复均覆盖），
     * 拔耳机暂停（BECOMING_NOISY）独立于焦点，不受本开关影响。勿在 WebView 架构下改回 true。
     */
    private static final boolean AUDIO_FOCUS_ENABLED = false;

    /** 插件写入与实例消费统一转主线程：快照的读写只发生在主线程 */
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    /** 运行实例；null = 未启动。插件据此决定写暂存还是立即生效 */
    private static volatile PlaybackService instance;

    /** 最新状态快照：服务启动时从这里取初值，运行期增量更新 */
    private static final Snapshot snapshot = new Snapshot();

    /** 元数据序号：封面异步下载完成时序号不一致即视为切歌后的晚到结果，丢弃 */
    private static final AtomicInteger metaSeq = new AtomicInteger();

    // ==================== 静态层：插件写入接口 ====================

    /** 曲目元数据推送（时长为大碟单曲碟内相对值）。元数据不启动服务：首播紧随播放态推送 */
    public static void pushMetadata(Metadata meta) {
        MAIN.post(() -> {
            metaSeq.incrementAndGet();
            snapshot.metadata = meta;
            if (instance != null) {
                instance.applySnapshot(false); // 元数据变化：需要重发通知
            }
        });
    }

    /**
     * 播放态推送。startIfNeeded 表示允许拉起服务——仅 Activity 前台时为 true
     * （Android 12+ 禁止后台启动前台服务）；后台时只进暂存，回前台后下一次推送自然拉起
     */
    public static void pushPlaybackState(Context ctx, boolean playing, long positionMs, float speed,
                                         boolean startIfNeeded) {
        MAIN.post(() -> {
            snapshot.playing = playing;
            snapshot.positionMs = Math.max(0, positionMs);
            snapshot.speed = playing ? speed : 0f;
            if (instance != null) {
                instance.applySnapshot(true); // 进度校准为主：仅播放/暂停切换时重发通知
            } else if (startIfNeeded && playing && ctx != null) {
                // 合法性：由用户前台播放交互触发；onStartCommand 随即 startForeground（5 秒规则）
                ContextCompat.startForegroundService(ctx, new Intent(ctx, PlaybackService.class));
            }
        });
    }

    /** 收尾：移除通知并停止服务（MainActivity.onDestroy / 划掉通知 / 渲染层 stop） */
    public static void requestTeardown(Context ctx) {
        MAIN.post(() -> {
            PlaybackService service = instance;
            if (service != null) {
                // 先置停止态并摘除实例引用：渲染层的在途暂停回推与封面补发不再渲染，
                // 防止复活刚划掉的通知（复活通知的 deleteIntent 会冷启动服务并命中
                // ACTION_DELETE 的提前返回路径，从未 startForeground 会触发 5 秒超时崩溃）
                service.stopping = true;
                instance = null;
                // 重置快照：暂停回推可能因 WebView 已死无人接收，避免下次启动闪现旧曲目/播放态
                snapshot.playing = false;
                snapshot.speed = 0f;
                service.stopForeground(Service.STOP_FOREGROUND_REMOVE);
                service.stopSelf();
            } else if (ctx != null) {
                ctx.getApplicationContext().stopService(new Intent(ctx, PlaybackService.class));
            }
        });
    }

    // ==================== 实例层 ====================

    private MediaSessionCompat session;
    private boolean foregroundStarted = false;
    /** 停止中标记：teardown 已启动，在途的推送/封面补发不再渲染（防复活已划掉的通知） */
    private volatile boolean stopping = false;
    /** 上次通知渲染时的播放态：仅进度变化的推送不必重发通知（系统按 PlaybackState 外推进度） */
    private boolean lastNotificationPlaying = false;
    private boolean focusHeld = false;
    /** 焦点短暂丢失（来电等）导致的暂停：焦点回归时自动续播 */
    private boolean transientPaused = false;
    private AudioFocusRequest focusRequest;

    private final BroadcastReceiver becomingNoisyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            // 拔耳机/断开蓝牙音频：暂停（仅播放中，暂停态无需重复通知渲染层）
            if (snapshot.playing) {
                emitControl("pause", null);
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createChannel();
        session = new MediaSessionCompat(this, "HeiMusicPlayback");
        session.setCallback(new SessionCallback());
        session.setActive(true);
        ContextCompat.registerReceiver(this, becomingNoisyReceiver,
                new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY),
                ContextCompat.RECEIVER_NOT_EXPORTED);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // stopSelf 后同一实例可能再收到 start 命令（teardown 与新一次播放的系统级竞态）：
        // 重新激活并强制走 startForeground——前台已撤却跳过 startForeground 会触发
        // "did not call startForeground" 5 秒超时崩溃
        if (stopping) {
            stopping = false;
            foregroundStarted = false;
            instance = this;
        }
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_DELETE.equals(action)) {
            // 用户划掉通知：对齐渲染层播放态（UI 与音频一致），随后移除通知并停止服务
            emitControl("pause", null);
            requestTeardown(this);
            return START_NOT_STICKY;
        }
        if (ACTION_TOGGLE.equals(action)) {
            emitControl("toggle", null);
        } else if (ACTION_NEXT.equals(action)) {
            emitControl("next", null);
        } else if (ACTION_PREV.equals(action)) {
            emitControl("prev", null);
        }
        // 无 action 为 startForegroundService 直启路径：applySnapshot 内部按 5 秒规则立即
        // startForeground；快照此时可能仍为暂存值，渲染层回推后增量刷新
        applySnapshot(true);
        return START_NOT_STICKY;
    }

    /**
     * 快照 → MediaSession + 通知。首次调用进入前台，之后用同 id notify 原位增量刷新。
     * @param playbackOnly true 表示播放态校准推送（约每 5s 一次）：锁屏/快捷设置的进度条由系统
     *                     按 PlaybackState 的 position+speed 自行外推，仅播放/暂停切换（按钮图标、
     *                     ongoing 变化）才需要重发通知；false 表示元数据/封面变化，总是重发
     */
    private void applySnapshot(boolean playbackOnly) {
        if (stopping) {
            return; // teardown 已启动：在途推送不再渲染，防止复活刚划掉的通知
        }
        Metadata meta = snapshot.metadata;
        MediaMetadataCompat.Builder metadataBuilder = new MediaMetadataCompat.Builder();
        if (meta != null) {
            metadataBuilder.putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, String.valueOf(meta.musicId));
            metadataBuilder.putString(MediaMetadataCompat.METADATA_KEY_TITLE, meta.title);
            metadataBuilder.putString(MediaMetadataCompat.METADATA_KEY_ARTIST, meta.artist);
            metadataBuilder.putString(MediaMetadataCompat.METADATA_KEY_ALBUM, meta.albumTitle);
            metadataBuilder.putLong(MediaMetadataCompat.METADATA_KEY_DURATION, meta.durationMs);
            Bitmap art = CoverCache.get(meta.coverUrl);
            if (art != null) {
                metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, art);
            }
        }
        session.setMetadata(metadataBuilder.build());

        // Android 13+ 的通知/锁屏按钮由这组 action 标志推导，缺 PLAY_PAUSE 则无播放暂停键
        PlaybackStateCompat state = new PlaybackStateCompat.Builder()
                .setActions(PlaybackStateCompat.ACTION_PLAY
                        | PlaybackStateCompat.ACTION_PAUSE
                        | PlaybackStateCompat.ACTION_PLAY_PAUSE
                        | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                        | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                        | PlaybackStateCompat.ACTION_SEEK_TO)
                .setState(snapshot.playing ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                        snapshot.positionMs, snapshot.playing ? snapshot.speed : 0f)
                .build();
        session.setPlaybackState(state);

        updateAudioFocus();
        CoverCache.fetchAsync(meta != null ? meta.coverUrl : null);

        boolean playingChanged = lastNotificationPlaying != snapshot.playing;
        if (!foregroundStarted) {
            // ServiceCompat 自动处理各版本的 foregroundServiceType 差异（29- 需清单声明）
            ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(),
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            foregroundStarted = true;
            lastNotificationPlaying = snapshot.playing;
        } else if (playbackOnly && !playingChanged) {
            return; // 仅进度校准：通知可见内容未变，不重发（省 binder 与 SystemUI 重渲染）
        } else if (NotificationManagerCompat.from(this).areNotificationsEnabled()) {
            // Android 13+ 未授予通知权限时通知不可见：服务继续持有媒体会话，不崩溃
            NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, buildNotification());
            lastNotificationPlaying = snapshot.playing;
        }
    }

    /** MediaStyle 通知：Android 12- 显示下方显式按钮，13+ 按钮由系统按 PlaybackState 生成 */
    private Notification buildNotification() {
        Metadata meta = snapshot.metadata;
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_music)
                .setContentTitle(meta != null && meta.title != null && !meta.title.isEmpty()
                        ? meta.title : getString(R.string.app_name))
                .setContentText(meta != null && meta.artist != null ? meta.artist : "")
                .setContentIntent(mainActivityPendingIntent())
                .setDeleteIntent(servicePendingIntent(ACTION_DELETE))
                .setOnlyAlertOnce(true)
                .setOngoing(snapshot.playing)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        Bitmap art = CoverCache.get(meta != null ? meta.coverUrl : null);
        if (art != null) {
            builder.setLargeIcon(art);
        }
        builder.addAction(new NotificationCompat.Action(R.drawable.ic_notif_prev,
                "上一曲", servicePendingIntent(ACTION_PREV)));
        builder.addAction(new NotificationCompat.Action(
                snapshot.playing ? R.drawable.ic_notif_pause : R.drawable.ic_notif_play,
                snapshot.playing ? "暂停" : "播放",
                servicePendingIntent(ACTION_TOGGLE)));
        builder.addAction(new NotificationCompat.Action(R.drawable.ic_notif_next,
                "下一曲", servicePendingIntent(ACTION_NEXT)));
        // MediaStyle 挂 session token：锁屏/快捷设置的媒体控制据此生成
        builder.setStyle(new MediaStyle()
                .setMediaSession(session.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2));
        return builder.build();
    }

    /** 系统控制 → 渲染层。不做乐观翻转：等渲染层回推 updatePlaybackState 确认（同进程毫秒级） */
    private class SessionCallback extends MediaSessionCompat.Callback {
        @Override
        public void onPlay() {
            emitControl("play", null);
        }

        @Override
        public void onPause() {
            emitControl("pause", null);
        }

        @Override
        public void onSkipToNext() {
            emitControl("next", null);
        }

        @Override
        public void onSkipToPrevious() {
            emitControl("prev", null);
        }

        @Override
        public void onSeekTo(long pos) {
            // 碟内相对毫秒（与推送的 position/duration 同一口径），渲染层自行加回大碟偏移
            emitControl("seekTo", pos);
        }

        @Override
        public void onStop() {
            // 部分系统 UI 以 stop 收尾（快捷设置里清掉媒体卡片等）：对齐渲染层后收尾
            emitControl("pause", null);
            requestTeardown(PlaybackService.this);
        }
    }

    /** 回传渲染层（本方法均在主线程被调；插件实例可能已销毁，内部判空静默） */
    private void emitControl(String action, Long positionMs) {
        MediaSessionPlugin.dispatchAction(action, positionMs);
    }

    // ==================== 音频焦点 ====================

    /** 按播放态申请/放弃音频焦点（AUDIO_FOCUS_ENABLED 关闭时为空操作） */
    private void updateAudioFocus() {
        if (!AUDIO_FOCUS_ENABLED) {
            return;
        }
        if (snapshot.playing && !focusHeld) {
            focusHeld = requestFocus();
        } else if (!snapshot.playing && focusHeld) {
            abandonFocus();
            focusHeld = false;
            transientPaused = false;
        }
    }

    private boolean requestFocus() {
        AudioManager audioManager = getSystemService(AudioManager.class);
        int result;
        if (Build.VERSION.SDK_INT >= 26) {
            if (focusRequest == null) {
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_MEDIA)
                                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                                .build())
                        .setOnAudioFocusChangeListener(this)
                        .build();
            }
            result = audioManager.requestAudioFocus(focusRequest);
        } else {
            result = audioManager.requestAudioFocus(this, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
        return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void abandonFocus() {
        AudioManager audioManager = getSystemService(AudioManager.class);
        if (Build.VERSION.SDK_INT >= 26 && focusRequest != null) {
            audioManager.abandonAudioFocusRequest(focusRequest);
        } else {
            audioManager.abandonAudioFocus(this);
        }
    }

    @Override
    public void onAudioFocusChange(int focusChange) {
        switch (focusChange) {
            case AudioManager.AUDIOFOCUS_LOSS:
                // 永久失去（其他播放器长期占用）：暂停且不自动续播，下次播放重新申请
                focusHeld = false;
                transientPaused = false;
                emitControl("pause", null);
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                // 短暂失去（来电等）：暂停并记录，焦点回归自动续播
                transientPaused = true;
                emitControl("pause", null);
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                break; // 压低音量场景（通知音等），继续播放
            case AudioManager.AUDIOFOCUS_GAIN:
                if (transientPaused) {
                    transientPaused = false;
                    emitControl("play", null);
                }
                break;
        }
    }

    // ==================== 生命周期收尾 ====================

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // 最近任务里划掉应用：WebView 即将销毁，控制事件已无人接收，直接收尾避免通知残留
        requestTeardown(this);
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        // 判等清引用：teardown 可能已把 instance 置 null，或该实例已被新实例顶替，
        // 误清会把后继实例的"运行中"状态抹掉
        if (instance == this) {
            instance = null;
        }
        unregisterReceiver(becomingNoisyReceiver);
        if (focusHeld) {
            abandonFocus();
            focusHeld = false;
        }
        if (session != null) {
            session.setActive(false);
            session.release();
            session = null;
        }
        // CoverCache 的缓存与下载线程按进程生命周期保留：服务可能在同进程内再次启动
        //（如划掉通知后重新播放），重建线程池反而浪费
        super.onDestroy();
    }

    // ==================== 通知辅助 ====================

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                    getString(R.string.notification_channel_playback),
                    NotificationManager.IMPORTANCE_LOW);
            channel.setDescription(getString(R.string.notification_channel_playback_description));
            channel.setShowBadge(false);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    private PendingIntent mainActivityPendingIntent() {
        Intent intent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (intent == null) {
            intent = new Intent(this, MainActivity.class);
        }
        return PendingIntent.getActivity(this, 0, intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** 通知按钮 → 本服务：用 getForegroundService 保证应用在后台时按钮仍可用（26+） */
    private PendingIntent servicePendingIntent(String action) {
        Intent intent = new Intent(this, PlaybackService.class).setAction(action);
        int flags = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 26) {
            return PendingIntent.getForegroundService(this, action.hashCode(), intent, flags);
        }
        return PendingIntent.getService(this, action.hashCode(), intent, flags);
    }

    // ==================== 数据结构 ====================

    /** 曲目元数据（不可变；渲染层推送，时长为大碟单曲碟内相对值） */
    public static final class Metadata {
        public final int musicId;
        public final String title;
        public final String artist;
        public final String albumTitle;
        public final long durationMs;
        public final String coverUrl;

        public Metadata(int musicId, String title, String artist, String albumTitle,
                        long durationMs, String coverUrl) {
            this.musicId = musicId;
            this.title = title;
            this.artist = artist;
            this.albumTitle = albumTitle;
            this.durationMs = durationMs;
            this.coverUrl = coverUrl;
        }
    }

    /** 最新状态快照：仅在主线程读写（推送经 MAIN.post 串行化），无需加锁 */
    private static final class Snapshot {
        Metadata metadata;
        boolean playing;
        long positionMs;
        float speed = 1f;
    }

    /**
     * 封面下载与内存缓存：单线程顺序下载天然节流；LruCache 以 coverUrl 为键，
     * 顺序切回上一首不重下。URL 由渲染层拼好绝对地址（运行时端点），
     * Cookie 在主线程读取（CookieManager 须与 WebView 同线程访问）后带入后台任务。
     * 播放态推送（约每 5s）都会触发 fetchAsync，故以"缓存命中 / 在途去重 / 失败负缓存"
     * 三重短路保证重复调用廉价且不重试风暴
     */
    private static final class CoverCache {
        /** 解码上限（最长边，像素）：通知大图足够，系统自行缩放 */
        private static final int MAX_EDGE = 640;
        /** 响应体大小上限：防误配 URL 指向超大资源时无界读入内存（OOM 无法被 catch(Exception) 兜住） */
        private static final int MAX_BYTES = 10 * 1024 * 1024;

        private static final LruCache<String, Bitmap> CACHE = new LruCache<String, Bitmap>(8 * 1024 * 1024) {
            @Override
            protected int sizeOf(String key, Bitmap value) {
                return value.getByteCount();
            }
        };

        /** 下载中的 URL：同一封面并发去重 */
        private static final Set<String> IN_FLIGHT = ConcurrentHashMap.newKeySet();
        /** 失败负缓存：404/超时的 URL 本进程不再重试（否则播放态推送会每 5s 重发一次请求） */
        private static final Set<String> FAILED = ConcurrentHashMap.newKeySet();

        private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();

        static Bitmap get(String url) {
            return url == null ? null : CACHE.get(url);
        }

        static void fetchAsync(String url) {
            if (url == null || CACHE.get(url) != null || FAILED.contains(url) || !IN_FLIGHT.add(url)) {
                return;
            }
            final String cookie = CookieManager.getInstance().getCookie(url);
            final int seq = metaSeq.get();
            EXECUTOR.execute(() -> {
                Bitmap bitmap;
                try {
                    bitmap = download(url, cookie);
                } finally {
                    IN_FLIGHT.remove(url);
                }
                if (bitmap == null) {
                    FAILED.add(url);
                    return;
                }
                // 切歌后的晚到结果：位图丢弃（URL 有效，不进负缓存，切回该曲会重新下载）
                if (metaSeq.get() != seq) {
                    return;
                }
                CACHE.put(url, bitmap);
                MAIN.post(() -> {
                    PlaybackService service = instance;
                    if (service != null) {
                        service.applySnapshot(false); // 补发带封面版本（原位刷新）
                    }
                });
            });
        }

        private static Bitmap download(String url, String cookie) {
            HttpURLConnection conn = null;
            try {
                conn = (HttpURLConnection) new URL(url).openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(10000);
                if (cookie != null) {
                    conn.setRequestProperty("Cookie", cookie);
                }
                int status = conn.getResponseCode();
                if (status < 200 || status >= 300) {
                    return null;
                }
                InputStream stream = conn.getInputStream();
                // 字节流不可回卷：先整体读入，再两段式（边界+缩放）解码
                byte[] data = readAll(stream);
                stream.close();
                BitmapFactory.Options bounds = new BitmapFactory.Options();
                bounds.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(data, 0, data.length, bounds);
                BitmapFactory.Options opts = new BitmapFactory.Options();
                opts.inSampleSize = calcSampleSize(bounds);
                return BitmapFactory.decodeByteArray(data, 0, data.length, opts);
            } catch (Exception e) {
                // 失败静默降级：通知无封面，记入负缓存不再重试
                Log.d(TAG, "封面下载失败: " + url, e);
                return null;
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        }

        private static byte[] readAll(InputStream stream) throws Exception {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[16 * 1024];
            int read;
            int total = 0;
            while ((read = stream.read(chunk)) != -1) {
                total += read;
                if (total > MAX_BYTES) {
                    // 经 catch(Exception) 走静默降级路径，而非无界读入直到 OOM
                    throw new IOException("封面响应超过大小上限 " + MAX_BYTES + " 字节");
                }
                buffer.write(chunk, 0, read);
            }
            return buffer.toByteArray();
        }

        /** 缩放系数：解码后最长边不超过 MAX_EDGE（向下取 2 的幂） */
        private static int calcSampleSize(BitmapFactory.Options bounds) {
            int edge = Math.max(bounds.outWidth, bounds.outHeight);
            int sample = 1;
            while (edge / (sample * 2) >= MAX_EDGE) {
                sample *= 2;
            }
            return sample;
        }
    }
}
