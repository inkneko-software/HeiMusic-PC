# AGENTS.md

HeiMusic 跨平台 PC 客户端的仓库说明，供 AI/协作者快速建立上下文。

## 1. 项目概览

HeiMusic 是一个音乐播放器前端（后端为独立服务，通过 Swagger/OpenAPI 交互）。
同一套渲染层代码运行在三种宿主环境：

| 宿主 | 说明 | 构建/运行 |
| --- | --- | --- |
| Electron 桌面端 | 主目标。`main/` 为主进程，`renderer/` 为渲染层 | `npm run dev` / `npm run build` |
| 网页端 | 浏览器直接访问，需后端 nginx 反代 | `npx next build renderer` + `npx next start renderer` |
| Android | Capacitor 壳层，WebView 加载打包后的静态资源 | `android/` 目录为原生工程 |

**技术栈**：Electron 29 + Next.js 12（Pages Router）+ TypeScript 5 + React 17 + MUI v5（`@mui/styles` 旧式样式 API）+ Capacitor 8。
构建工具链为 **nextron**（Next.js + Electron 一体化）。

## 2. 目录结构

```
main/                         Electron 主进程
  background.ts               入口：窗口创建、IPC 注册、全局热键、Cookie 注入、app:// 协议代理
  preload.ts                  contextBridge 暴露 window.electronAPI
  helpers/create-window.ts    窗口位置/尺寸持久化（electron-store）
  types/config.d.ts           HeiMusicConfig 全局类型
  types/preload.d.ts          window.electronAPI 全局类型声明

renderer/                     渲染层（Next.js）
  pages/                      路由页面（Pages Router）
    home.tsx / index.tsx      首页（index 转发 home）
    login.tsx / init.tsx      登录 / 创建根账户
    album/{[id],management,upload}.tsx  album/edit/[albumId].tsx
    lyric/fetchlog.tsx        歌词拉取记录页（URL 驱动分页与筛选）
    artist/[id].tsx  series/index.tsx  songlist/[id].tsx
    search/index.tsx  favoriate.tsx  daily30.tsx  userDetail.tsx
    settings/player/{home,layout}.tsx
    _app.tsx                  全局 Provider + 登录门禁 + 布局分发
  components/
    HeiMusicMainLayout.tsx    主布局；导出 pushToast
    LeftPannel/               侧边导航
    MusicControlPannel/       播放控制面板（HTML5 audio 播放器在此）
    MusicContextMenu/         音乐右键菜单
    Auth/LoginDialog.tsx
    Common/                   通用组件（Toast、Icon、Input、ImageSkeleton…）
  lib/
    mediaUrl.ts               Electron 的 API 基址（ensureApiBase，经 IPC 读配置）
    apiServer.ts              Capacitor 原生端点：构建期内联默认值（process.env.NATIVE_API_BASE）
                               + 运行时持久化（ensureNativeApiBase / setNativeApiBase）
    mediaSession.ts           Android 系统媒体会话桥接（元数据/播放态推送、控制事件；非原生平台空操作）
    HeiMusicContext.tsx       当前播放音乐等跨组件 Context
    HeiMusicThemeProvider.tsx / theme.ts
  api/
    request.ts                自定义 OpenAPI 请求模板（基址解析、业务错误码、Toast）
    baseFetch.tsx             非 codegen 的手写请求入口（上传等）
    codegen/                  **自动生成，勿手改**
      core/ models/ services/ index.ts
    upload/music.ts

android/                      Capacitor 原生工程（src/main/java/com/inkneko/heimusic/）
  MainActivity.java           媒体壳层代理（端点：优先 SharedPreferences，回落 BuildConfig）
  ApiServerPlugin.java        API 端点运行时读写（本地插件，渲染层经 bridge 持久化）
  ExitPromptPlugin.java       返回键退出二次确认（本地插件）
  MediaSessionPlugin.java     系统媒体通知桥接（本地插件：推送元数据/播放态、请求通知权限、回传系统控制）
  PlaybackService.java        媒体前台服务（MediaSessionCompat + MediaStyle 通知、封面缓存、音频焦点）
  app/build.gradle            读取 ../api-server.json 注入 BuildConfig.API_SERVER（构建期默认值）
  android/app/build/          **构建产物，勿手改**

api-server.json.example       本地 API 端点配置模板（api-server.json 不入库，现为 Android 构建期默认值）
nextron.config.js             主进程入口：main/background.ts、main/preload.ts
renderer/next.config.js       webpack alias + dev rewrites（/api、/public → 后端）
electron-builder.yml / Dockerfile / capacitor.config.ts
```

## 3. 常用命令

```bash
npm install                        # 安装依赖（postinstall 会执行 electron-builder install-app-deps）
npm run dev                        # Electron + Next 开发模式
npm run build                      # 打包（nextron build → electron-builder，输出 dist/）
npm run openapi                    # 重新生成 renderer/api/codegen（需后端 swagger 可达）

npx next build renderer            # 仅构建网页端
npx next start renderer            # 运行网页端
```

- 没有测试框架与 test 脚本；类型检查用 `npm run typecheck`（分别对 `tsconfig.main.json` 与 `renderer/tsconfig.json` 跑 `tsc --noEmit`），lint 用 `npm run lint`（`renderer/.eslintrc.json`，extends `next/core-web-vitals`）。
- `npm run openapi` 前先确认 `package.json` 中 `openapi` 项的 swagger host 正确，生成的代码整体覆盖 `renderer/api/codegen`。

### Android 构建链路

Capacitor 的 `webDir` 指向静态导出目录 `app/`（该目录同时承载 Electron 主进程产物，`package.json` 的 `main` 指向 `app/background.js`）。注意 `npx next build renderer` 只输出到 `renderer/.next`，**不会产出 `app/`**——`app/` 由静态导出生成：

```bash
# ① 生成渲染层静态导出到 app/，二选一：
npm run build                # nextron build，完整发布流程（同时重建 Electron 产物，app/ 保证完整）
npx next export renderer -o app  # 轻量路径（仅安卓迭代更快）：导出会清空 app/，
                                 # 须先备份 app/background.js(.map) 导出后再还原，否则 Electron 打包入口丢失
# ② 把 app/ 同步进 android/app/src/main/assets/public（npx cap sync 亦可，同时会刷新 assets/capacitor.config.json）
npx cap copy android
# ③ 在 android/ 下执行 gradle assembleRelease
```

- release 签名需在 `android/key.properties` 配置（不入库，字段见 `android/app/build.gradle`）；文件不存在时 release 输出未签名 APK。
- `android/app/src/main/assets/public`、`capacitor.config.json`、`capacitor.plugins.json` 均为生成物，勿手改。

## 4. 核心架构约定

### 4.1 多端 API 基址（最重要的约定）

后端资源路径前缀统一为 `/api` 与 `/public`，**渲染层一律使用相对路径**，由各平台壳层转发：

| 环境 | `/api`、`/public` 的转发者 | 代码位置 |
| --- | --- | --- |
| 网页端（生产） | 后端 nginx 反代 | 部署侧 |
| 网页端（开发） | next dev rewrites | `renderer/next.config.js` |
| Electron（生产） | 主进程 `app://` 协议处理器 307 重定向到 `apiHost` | `main/background.ts` 的 `BACKEND_PATH_PREFIXES` |
| Electron（开发） | dev server rewrites | 同网页端开发 |
| Capacitor 原生 | `MainActivity.ProxyWebViewClient` 拦截 `https://localhost` 转发 | `android/.../MainActivity.java` 的 `BACKEND_PATH_PREFIXES` |

> **改动前缀表时必须四处同步**：`main/background.ts`、`renderer/next.config.js`、`MainActivity.java`、生产 nginx。

- **Android 端 `<audio>` 媒体源直连后端（例外于上表）**：渲染层 `nativeMediaUrl`（`renderer/lib/apiServer.ts`）在原生平台把相对媒体地址拼为 `getNativeApiBase() + 路径` 的绝对地址。原因：`shouldInterceptRequest` 拦截响应的 `Content-Length` 被 WebView 置 0，媒体管线对 206 Range 响应校验失败，seek 后 `net::ERR_FAILED`；直连后由后端 nginx 正确处理 Range（2026-10-17 实测，媒体接口无需会话 Cookie；若后端后续收紧鉴权需另行方案）。图片等其余相对资源仍走壳层代理。

请求基址解析（codegen 请求）见 `renderer/api/request.ts` 的 `request()`：网页端把 `config.BASE` 置空走同源，Electron 走 `heiMusicConfig.apiHost` 直连（依赖后端 CORS 白名单），Capacitor 原生走 `ensureNativeApiBase()`（持久化端点，未设置回落构建期默认值）。
手写请求入口 `renderer/api/baseFetch.tsx` 按 Capacitor / Electron / 网页三态分支。

### 4.2 配置与持久化

- 配置文件：`~/.heimusic/heimusic.json`，开发态为 `heimusic_dev.json`。
- 配置对象保存在**主进程内存**中，通过 IPC 读写：`config::get` / `config::set` / `config::save` / `config::saveAndReload` / `config::onChange`。
- 类型定义：`main/types/config.d.ts` 的 `HeiMusicConfig`。
- Electron 会话 Cookie（`userId`、`sessionId`）由主进程 `webRequest` 钩子自动注入与捕获（`main/background.ts`），渲染层无需手动处理。
- 网页端开发态的 `/api`、`/public` 转发端点与 Android 端 API 端点的**构建期默认值**均来自仓库根目录 `api-server.json`（**不入库，本地需按 `api-server.json.example` 创建**）：`renderer/next.config.js` 读它做两件事——dev rewrites 转发、构建期经 `env` 把 `NATIVE_API_BASE` 内联进渲染层；`android/app/build.gradle` 读它注入 `BuildConfig.API_SERVER`。渲染层（`renderer/lib/apiServer.ts`）只读 `process.env.NATIVE_API_BASE` 作默认值，**不直接 import 该文件**，因此网页镜像（Docker）构建不依赖它；文件缺失时回落 `http://localhost:8081`。
- **Android 端点运行时可配置**（入口：登录页连接失败分支、设置页）：经本地插件 `ApiServerPlugin`（`android/.../ApiServerPlugin.java`，与 `ExitPromptPlugin` 同为本地插件，无需 cap sync，须在 `super.onCreate` 前 `registerPlugin`）持久化到 SharedPreferences；渲染层入口为 `renderer/lib/apiServer.ts` 的 `ensureNativeApiBase` / `setNativeApiBase`，未设置时回落构建期默认值；`MainActivity` 的媒体壳层代理每次拦截经 `currentApiServer()` 重读存储，保存后即时生效、无需重启。

### 4.3 IPC 与跨组件通信

- 通道命名：`域::动作`，如 `config::get`、`windowManagement::maximize`、`music::parse`、`playback::next`、`thumbnail::playing`。
- 渲染层通过 `window.electronAPI.<域>.<方法>` 调用（`main/preload.ts` 定义，`main/types/preload.d.ts` 声明类型）。
- **非 Electron 环境必须判空**：`typeof window.electronAPI !== 'undefined'`。
- 渲染层内部跨组件通信使用 DOM `CustomEvent`，已存在的事件名：
  - `main::pushToast` — 全局 Toast，推荐直接调用 `pushToast(message, variant?, position?)`（从 `@components/HeiMusicMainLayout` 导出）。
  - `user::profileUpdated` — 用户设置页保存资料/更新头像成功后派发，主布局监听并重新拉取 nav 刷新右上角头像与用户名。
  - `music-control-panel::changePlayList` / `::play` / `::enqueue` / `::enqueueNext` — 见 `MusicControlPannel.tsx` 顶部接口注释。

### 4.4 登录门禁与布局

`renderer/pages/_app.tsx` 统一控制：未登录时渲染 `Login` 覆盖全屏；登录后若页面定义了 `getLayout` 则用页面自定义布局（如 `settings/player/layout.tsx`），否则套 `HeiMusicMainLayout`。
登录态由 `UserControllerService.nav()` 探测。

### 4.5 API 调用

- 优先使用 `renderer/api/codegen/services/*ControllerService`（10 个：Album、Artist、Auth、Lyric、MinIo、Music、PlayHistory、Playlist、Search、User）。分页类接口的 `data` 为 MyBatis-Plus Page 形状 `{ records, total, size, current, pages }`（首次引入于歌词拉取日志接口）。
- 返回结构约定后端业务码：`code !== 0` 视为业务错误，`request.ts` 会 reject 并携带 `message`；网络异常统一 Toast「服务错误，请稍后尝试」。
- codegen 请求有双层超时保护（`request.ts`），超时以 `TypeError` reject，调用方据此判定网络层失败（如登录门禁走「连接失败」分支）：①原生平台直调 `CapacitorHttp.request` 并显式传 `connectTimeout` 10s / `readTimeout` 15s——**fetch 垫片不透传超时参数，原生 HttpURLConnection 默认无限等待**，直调让超时由原生网络栈强制执行；②其余路径（FormData/Blob 上传、非原生）用 `Promise.race` 15s 兜底（垫片不感知 AbortSignal，race 保证必达）。**原生直调路径的原生层 reject（CapacitorException，message 为 Java 异常原文）必须在 `nativeSend` 转换为 `TypeError`**——保持与 fetch 垫片路径一致的失败语义，否则登录门禁会把网络失败误判为业务错误、直接显示登录表单并透出 Java 原文。媒体流与上传不走 codegen 请求，无长任务受影响。
- **不要手工修改 `renderer/api/codegen/`**，改接口请改 swagger 后重跑 `npm run openapi`；需要调整请求行为请改 `renderer/api/request.ts`——注意它是 openapi 生成器的**模板源**，改动只在下一次 `npm run openapi`（或手动同步到 `renderer/api/codegen/core/request.ts`）后才生效，只改模板会过 typecheck 但产物不含改动。

## 5. 代码约定

- 路径别名：`@components/*` → `renderer/components/*`，`@api/*` → `renderer/api/*`（同时配置在 `renderer/tsconfig.json` 的 `paths` 与 `renderer/next.config.js` 的 webpack alias，**两处都要改**）。
- 样式：MUI v5 + `@mui/styles` 的 `makeStyles`/`createStyles`/`styled`；少量 `*.module.css`。未启用 emotion `sx` 之外的统一规范，改动时跟随所在文件风格。
- 语言：注释、UI 文案、README 变更记录均为中文。
- 版本：`package.json` 的 `version` 为唯一版本来源，发版时同步在 `README.md` 追加一条 `0.x.y` 变更记录（按现有格式）；设置页展示的版本号由 `renderer/next.config.js` 构建期注入（`process.env.APP_VERSION`），无需手动改代码。

## 6. 注意事项

- 渲染层不直接 import 根目录 `api-server.json`（值由 `renderer/next.config.js` 构建期内联为 `process.env.NATIVE_API_BASE`，见 4.2）；该文件仅本地开发转发与 Android 构建需要，缺失时前者回落 `http://localhost:8081`、后者注入 `UNCONFIGURED`，均不影响网页镜像构建。Android 端 `UNCONFIGURED` 只意味着首启无默认端点——连接失败后经登录页设置即可（见 4.2 的运行时配置）。
- `capacitor.config.ts` 的 `DEV` 开关：为 `true` 时 WebView 加载 dev server（`http://10.0.2.2:8888`，真机需改局域网 IP）；**打包 release 前必须改回 `false`**，否则 APK 会指向开发机。
- Android 硬件返回键由 `@capacitor/app` 插件接管：`renderer/pages/_app.tsx` 注册 `backButton` 监听——优先关闭 `HeiMusicContext` 弹层栈栈顶（全屏播放器、播放列表抽屉均已注册），无弹层时按页面历史回退，无历史则交给本地插件 `ExitPromptPlugin`（`android/.../ExitPromptPlugin.java`，非 npm 插件无需 cap sync）弹原生 Toast 二次确认退出。插件在**无监听且无历史**时会吞掉按键（应用无法退出），故该监听不可移除；新增全屏级弹层时应经 `registerOverlay` 挂进弹层栈。**`MainActivity.registerPlugin` 必须在 `super.onCreate` 之前调用**——bridge 在 `super.onCreate` 内部完成构建，之后再注册不会生效。
- Electron 生产态同时注册了 `app://` 特权协议与静态文件处理器（`main/background.ts` 末尾），静态资源根目录为打包后的 `app/`；`/api`、`/public` 走 307 重定向而非主进程流式代理——这是为了避免切歌时连接泄漏耗尽单主机连接上限，**不要改回主进程代理**。
- Android 系统媒体通知由本地插件 `MediaSessionPlugin` + 前台服务 `PlaybackService`（MediaSessionCompat + MediaStyle，依赖 `androidx.media:media`）承担，渲染层接线点在 `MusicControlPannel.tsx`：元数据跟 `currentMusicInfo` 走，播放态在 onplay/onpause/seek 时推送、`ontimeupdate` 每 5s 低频校准，控制事件经 `bindActions` 回灌（`renderer/lib/mediaSession.ts`）。约定：时间口径统一为碟内相对值（大碟单曲减 `discStartTime`）；Android 13+ 通知按钮由 `PlaybackStateCompat` 的 action 推导、`POST_NOTIFICATIONS` 需运行时请求（渲染层首播时调一次，拒绝不阻断）；插件 `resumed=false`（后台）时不 `startForegroundService`（Android 12+ 限制），状态只进服务暂存、回前台自动拉起；音频焦点默认关闭（`PlaybackService.AUDIO_FOCUS_ENABLED = false`）——Chromium 的 `<audio>` 播放时会自行申请音频焦点，原生再申请会同 uid 互顶、被顶方立即暂停（表现为开播即自暂停，2026-10-16 真机 dumpsys audio 实证），抢占暂停/来电暂停由 Chromium 自身焦点处理承担，拔耳机暂停走 `AUDIO_BECOMING_NOISY` 不依赖焦点，**勿改回 true**。
- `android/app/build/`、`app/`、`dist/`、`node_modules/` 均为产物或依赖，不要手改或提交（`.gitignore` 已锚定根目录的 `/app` 与 `/dist`）。
- CUE 音轨解析在主进程完成（`music-metadata`、`cue-parser`），渲染层通过 `music::parse` / `music::parseCue` 调用；APE/TAK 因 Chromium 内核限制暂不支持播放。
- 全局热键（播放/上一曲/下一曲）在主进程注册，修改后调用 `config::setHotKey` 会自动注销旧键；配置保存后需 `config::saveAndReload` 生效。
