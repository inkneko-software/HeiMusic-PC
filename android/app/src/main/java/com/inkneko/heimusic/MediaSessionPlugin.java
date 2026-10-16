package com.inkneko.heimusic;

import android.Manifest;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * 系统媒体会话桥接：渲染层经 bridge 推送曲目元数据/播放态到 PlaybackService
 * （MediaSessionCompat + MediaStyle 前台通知），系统媒体控制（通知栏/锁屏/耳机）
 * 经 "mediaControlAction" 事件回传渲染层。时间口径统一为碟内相对值（大碟单曲
 * 减 discStartTime），秒→毫秒的换算只发生在本插件的边界。
 * 本地插件（非 npm 插件，无需 cap sync），须在 MainActivity super.onCreate 前 registerPlugin。
 */
@CapacitorPlugin(name = "MediaSessionPlugin")
@Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "postNotifications")
public class MediaSessionPlugin extends Plugin {

    /** 运行期插件实例：服务回传控制事件的入口，随 Activity 重建被替换 */
    private static volatile MediaSessionPlugin activeInstance;

    /** Activity 是否处于前台：Android 12+ 禁止后台启动前台服务，后台时状态只进服务暂存 */
    private volatile boolean resumed = false;

    @Override
    public void load() {
        activeInstance = this;
    }

    @Override
    protected void handleOnDestroy() {
        if (activeInstance == this) {
            activeInstance = null;
        }
    }

    @Override
    protected void handleOnResume() {
        resumed = true;
    }

    @Override
    protected void handleOnPause() {
        resumed = false;
    }

    /**
     * 服务回传系统控制事件（须在主线程调用，服务侧已保证）。
     * 插件实例可能已随 Activity 销毁（如划掉通知时 WebView 先死），判空静默。
     * 已知局限：Activity 重建间隙（未被 configChanges 覆盖的配置变化）内事件会被丢弃、
     * 不排队重放——间隙极短且重建后下一次正向推送会对齐状态，接受该取舍
     */
    static void dispatchAction(String action, Long positionMs) {
        MediaSessionPlugin plugin = activeInstance;
        if (plugin == null) {
            return;
        }
        JSObject data = new JSObject();
        data.put("action", action);
        if (positionMs != null) {
            data.put("positionMs", positionMs);
        }
        plugin.notifyListeners("mediaControlAction", data);
    }

    /** Android 13+ 通知运行时权限：渲染层首次播放时调用一次，拒绝不阻断播放 */
    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (getPermissionState("postNotifications") == PermissionState.GRANTED) {
            resolveGranted(call, true);
            return;
        }
        // BridgeActivity 会把系统权限回调派发给插件的 @PermissionCallback 方法，
        // 不要裸调 ActivityCompat.requestPermissions（结果被壳层拦截，插件拿不到）
        requestPermissionForAlias("postNotifications", call, "onPostNotificationsResult");
    }

    @PermissionCallback
    private void onPostNotificationsResult(PluginCall call) {
        resolveGranted(call, getPermissionState("postNotifications") == PermissionState.GRANTED);
    }

    private void resolveGranted(PluginCall call, boolean granted) {
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    /**
     * 曲目元数据推送：{ musicId, title, artists(已 join), albumTitle, durationSec, coverUrl|null }。
     * 碟内相对时长与封面绝对 URL 均由渲染层换算拼装，原生不做端点与时间口径的二次推断
     */
    @PluginMethod
    public void updateMetadata(PluginCall call) {
        long durationMs = Math.round(call.getDouble("durationSec", 0d) * 1000d);
        PlaybackService.pushMetadata(new PlaybackService.Metadata(
                call.getInt("musicId", 0),
                call.getString("title", ""),
                call.getString("artists", ""),
                call.getString("albumTitle", ""),
                durationMs,
                call.getString("coverUrl")));
        call.resolve();
    }

    /** 播放态推送：{ playing, positionSec, speed }；秒→毫秒在此边界换算一次 */
    @PluginMethod
    public void updatePlaybackState(PluginCall call) {
        boolean playing = Boolean.TRUE.equals(call.getBoolean("playing", false));
        long positionMs = Math.round(call.getDouble("positionSec", 0d) * 1000d);
        float speed = call.getFloat("speed", 1f);
        // startIfNeeded 仅前台放行：后台（resumed=false）时状态只进暂存，
        // 规避 Android 12+ 的 ForegroundServiceStartNotAllowedException
        PlaybackService.pushPlaybackState(getContext(), playing, positionMs, speed, playing && resumed);
        call.resolve();
    }

    /** 渲染层主动收尾（预留退出场景）；正常退出由 MainActivity.onDestroy 兜底 */
    @PluginMethod
    public void stop(PluginCall call) {
        PlaybackService.requestTeardown(getContext());
        call.resolve();
    }
}
