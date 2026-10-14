package com.inkneko.heimusic;

import android.widget.Toast;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 安卓返回键退出确认：退出时机由渲染层判定（弹层栈与页面历史在 JS 侧），
 * 本插件只负责提示与执行——首次调用弹 Toast「再按一次返回键退出」，
 * 2 秒内再次调用才真正结束 Activity。
 */
@CapacitorPlugin(name = "ExitPrompt")
public class ExitPromptPlugin extends Plugin {

    /** 双击退出的确认窗口 */
    private static final long EXIT_CONFIRM_INTERVAL_MS = 2000L;

    private long lastPromptAt = 0L;

    @PluginMethod
    public void confirmExit(PluginCall call) {
        // Capacitor 插件方法默认跑在后台线程，Toast 与 finish 需回主线程
        getActivity().runOnUiThread(() -> {
            long now = System.currentTimeMillis();
            if (now - lastPromptAt < EXIT_CONFIRM_INTERVAL_MS) {
                getActivity().finish();
            } else {
                lastPromptAt = now;
                Toast.makeText(getContext(), "再按一次返回键退出", Toast.LENGTH_SHORT).show();
            }
        });
        call.resolve();
    }
}
