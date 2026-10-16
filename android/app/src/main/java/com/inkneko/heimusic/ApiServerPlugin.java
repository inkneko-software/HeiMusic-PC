package com.inkneko.heimusic;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * API 端点运行时配置：渲染层经 bridge 读写 SharedPreferences，
 * MainActivity 的媒体壳层代理读同一存储（未设置时回落 BuildConfig.API_SERVER）。
 * 本地插件（非 npm 插件，无需 cap sync），须在 super.onCreate 前 registerPlugin。
 */
@CapacitorPlugin(name = "ApiServerPlugin")
public class ApiServerPlugin extends Plugin {

    /** 存储文件与键名，MainActivity 壳层代理读取时须与此保持一致 */
    public static final String PREFS_NAME = "heimusic";
    public static final String PREFS_KEY = "apiServer";

    @PluginMethod
    public void set(PluginCall call) {
        String apiServer = call.getString("apiServer");
        if (apiServer == null || apiServer.trim().isEmpty()) {
            call.reject("apiServer 不能为空");
            return;
        }
        // 规范化：去首尾空白与尾部斜杠，避免与请求路径拼接出双斜杠
        String normalized = apiServer.trim().replaceAll("/+$", "");
        getPrefs().edit().putString(PREFS_KEY, normalized).apply();
        call.resolve();
    }

    @PluginMethod
    public void get(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("apiServer", getPrefs().getString(PREFS_KEY, null));
        call.resolve(ret);
    }

    private SharedPreferences getPrefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
}
