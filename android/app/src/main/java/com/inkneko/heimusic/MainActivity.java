package com.inkneko.heimusic;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainActivity extends BridgeActivity {

    /**
     * API 端点经 BuildConfig 注入，来源为仓库根目录 api-server.json（不入库），
     * 与前端 renderer/lib/apiServer.ts 读取同一份文件。
     */
    private static final String API_SERVER = BuildConfig.API_SERVER;

    /**
     * 后端拥有的路径前缀，需与网页端 nginx、Electron 壳层代理（main/background.ts）的前缀表一致。
     */
    private static final String[] BACKEND_PATH_PREFIXES = {"/api/", "/public/"};

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        CookieManager.getInstance().setAcceptThirdPartyCookies(bridge.getWebView(), true);
        bridge.getWebView().setWebViewClient(new ProxyWebViewClient(bridge));
    }

    /**
     * 壳层代理：媒体元素（<img>/<audio>）不经过 CapacitorHttp，相对路径落在
     * https://localhost 上，在这里转发到 API_SERVER 并附带会话 Cookie。
     * fetch/XHR 已由 CapacitorHttp 在原生层直连后端，不会进入此拦截。
     */
    private class ProxyWebViewClient extends BridgeWebViewClient {

        ProxyWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            // 仅拦截打包前端的源（https://localhost）。开发态 WebView 加载 dev server
            // （host 为 IP），由 dev server 的 rewrites 反代，不在拦截范围。
            if ("localhost".equals(url.getHost())) {
                String path = url.getPath() == null ? "" : url.getPath();
                for (String prefix : BACKEND_PATH_PREFIXES) {
                    if (path.startsWith(prefix)) {
                        return proxyToBackend(request);
                    }
                }
            }
            return super.shouldInterceptRequest(view, request);
        }
    }

    private WebResourceResponse proxyToBackend(WebResourceRequest request) {
        Uri uri = request.getUrl();
        try {
            StringBuilder target = new StringBuilder(API_SERVER)
                    .append(uri.getPath() == null ? "" : uri.getPath());
            if (uri.getQuery() != null) {
                target.append('?').append(uri.getQuery());
            }

            HttpURLConnection conn = (HttpURLConnection) new URL(target.toString()).openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(30000);
            conn.setRequestMethod(request.getMethod());
            // 禁用透明 gzip：媒体流原样透传，Content-Length 保持有效
            //（音频时长显示与进度拖动依赖长度信息；未压缩时长度才与实际流一致）
            conn.setRequestProperty("Accept-Encoding", "identity");
            conn.setUseCaches(false);
            // 媒体请求为 GET/HEAD；透传 Range 以支持音频拖动进度，不透传 Host/编码协商等头
            Map<String, String> reqHeaders = request.getRequestHeaders();
            if (reqHeaders != null) {
                String range = reqHeaders.get("Range");
                if (range != null) {
                    conn.setRequestProperty("Range", range);
                }
            }
            String cookie = CookieManager.getInstance().getCookie(API_SERVER + "/");
            if (cookie != null) {
                conn.setRequestProperty("Cookie", cookie);
            }

            int status = conn.getResponseCode();
            Map<String, String> respHeaders = new HashMap<>();
            for (Map.Entry<String, List<String>> entry : conn.getHeaderFields().entrySet()) {
                String name = entry.getKey();
                if (name == null || entry.getValue().isEmpty()) {
                    continue; // 状态行
                }
                if (name.equalsIgnoreCase("Content-Encoding")
                        || name.equalsIgnoreCase("Transfer-Encoding")) {
                    continue;
                }
                respHeaders.put(name, entry.getValue().get(0));
            }

            InputStream stream = status >= 400 ? conn.getErrorStream() : conn.getInputStream();
            if (stream == null) {
                conn.disconnect();
                stream = new ByteArrayInputStream(new byte[0]);
            }
            // 确定性释放连接：WebView 读完或取消关闭流时断开底层 socket。
            // 切歌会中途取消音频请求，若不主动断开，被取消的流会泄漏连接，
            // 多次切歌后连接耗尽导致后续请求全部卡住。
            final HttpURLConnection connection = conn;
            InputStream guardedStream = new FilterInputStream(stream) {
                @Override
                public void close() throws IOException {
                    try {
                        super.close();
                    } finally {
                        connection.disconnect();
                    }
                }
            };
            String mime = conn.getContentType();
            return new WebResourceResponse(mime == null ? "application/octet-stream" : mime,
                    conn.getContentEncoding(), status,
                    conn.getResponseMessage() == null ? "" : conn.getResponseMessage(),
                    respHeaders, guardedStream);
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 502, "Bad Gateway",
                    null, new ByteArrayInputStream(("proxy error: " + e.getMessage()).getBytes()));
        }
    }
}
