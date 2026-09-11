import type { CapacitorConfig } from '@capacitor/cli';

// ===== 开发联调开关 =====
// true：WebView 直接加载 dev server，API 走 dev server 的 next rewrites 反代（无跨域）。
//       模拟器用 http://10.0.2.2:8888（宿主机 loopback 别名），真机改局域网 IP。
// false（打包 release 前必须改回）：WebView 加载打包进 APK 的静态资源（源为
//       https://localhost），fetch/XHR 由 CapacitorHttp 原生层直连后端，
//       媒体相对路径由 MainActivity 的壳层代理转发。
const DEV = true;
const DEV_SERVER = 'http://10.0.2.2:8888';

const config: CapacitorConfig = {
  appId: 'com.inkneko.heimusic',
  appName: 'HeiMusic',
  webDir: 'app',
  server: {
    url: DEV ? DEV_SERVER : undefined,
    cleartext: true, // dev server 为 http 明文
  },
  plugins: {
    // 将渲染层的 fetch/XHR 改走原生网络层：无 CORS，
    // 且与 WebView 共享 CookieManager（登录会话对媒体请求也可见）
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
