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
    artist/[id[.tsx  series/index.tsx  songlist/[id].tsx
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
    mediaUrl.ts               非 Electron 下的 API 基址 + ensureApiBase()
    apiServer.ts              Capacitor 原生端点（读根目录 api-server.json）
    HeiMusicContext.tsx       当前播放音乐等跨组件 Context
    HeiMusicThemeProvider.tsx / theme.ts
  api/
    request.ts                自定义 OpenAPI 请求模板（基址解析、业务错误码、Toast）
    baseFetch.tsx             非 codegen 的手写请求入口（上传等）
    codegen/                  **自动生成，勿手改**
      core/ models/ services/ index.ts
    upload/music.ts

android/                      Capacitor 原生工程（src/main/java/com/inkneko/heimusic/MainActivity.java）
  app/build.gradle            读取 ../api-server.json 注入 BuildConfig.API_SERVER
  android/app/build/          **构建产物，勿手改**

api-server.json.example       本地 API 端点配置模板（api-server.json 不入库）
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

- 没有 lint/test/typecheck 脚本，也**没有 ESLint 配置**；类型检查靠 `tsc` / IDE。
- `npm run openapi` 前先确认 `package.json` 中 `openapi` 项的 swagger host 正确，生成的代码整体覆盖 `renderer/api/codegen`。

### Android 构建链路

Capacitor 的 `webDir` 指向 nextron 的构建输出目录 `app/`，因此流程为：

```bash
npx next build renderer  # 渲染层构建产物输出到 app/（nextron build 内部的这一步同样如此）
npx cap copy android     # 把 app/ 同步进 android/app/src/main/assets/public（npx cap sync 亦可）
# 然后在 android/ 下执行 gradle assembleRelease
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

请求基址解析（codegen 请求）见 `renderer/api/request.ts` 的 `request()`：网页端把 `config.BASE` 置空走同源，Electron 走 `heiMusicConfig.apiHost` 直连（依赖后端 CORS 白名单）。
手写请求入口 `renderer/api/baseFetch.tsx` 按 Capacitor / Electron / 网页三态分支。

### 4.2 配置与持久化

- 配置文件：`~/.heimusic/heimusic.json`，开发态为 `heimusic_dev.json`。
- 配置对象保存在**主进程内存**中，通过 IPC 读写：`config::get` / `config::set` / `config::save` / `config::saveAndReload` / `config::onChange`。
- 类型定义：`main/types/config.d.ts` 的 `HeiMusicConfig`。
- Electron 会话 Cookie（`userId`、`sessionId`）由主进程 `webRequest` 钩子自动注入与捕获（`main/background.ts`），渲染层无需手动处理。
- Android 端 API 端点来自仓库根目录 `api-server.json`（**不入库，需先按 `api-server.json.example` 创建**），由 `renderer/lib/apiServer.ts` 与 `app/build.gradle` 双端读取，务必保持一致。

### 4.3 IPC 与跨组件通信

- 通道命名：`域::动作`，如 `config::get`、`windowManagement::maximize`、`music::parse`、`playback::next`、`thumbnail::playing`。
- 渲染层通过 `window.electronAPI.<域>.<方法>` 调用（`main/preload.ts` 定义，`main/types/preload.d.ts` 声明类型）。
- **非 Electron 环境必须判空**：`typeof window.electronAPI !== 'undefined'`。
- 渲染层内部跨组件通信使用 DOM `CustomEvent`，已存在的事件名：
  - `main::pushToast` — 全局 Toast，推荐直接调用 `pushToast(message, variant?, position?)`（从 `@components/HeiMusicMainLayout` 导出）。
  - `music-control-panel::changePlayList` / `::play` / `::enqueue` / `::enqueueNext` — 见 `MusicControlPannel.tsx` 顶部接口注释。

### 4.4 登录门禁与布局

`renderer/pages/_app.tsx` 统一控制：未登录时渲染 `Login` 覆盖全屏；登录后若页面定义了 `getLayout` 则用页面自定义布局（如 `settings/player/layout.tsx`），否则套 `HeiMusicMainLayout`。
登录态由 `UserControllerService.nav()` 探测。

### 4.5 API 调用

- 优先使用 `renderer/api/codegen/services/*ControllerService`（8 个：Album、Artist、Auth、MinIo、Music、Playlist、Search、User）。
- 返回结构约定后端业务码：`code !== 0` 视为业务错误，`request.ts` 会 reject 并携带 `message`；网络异常统一 Toast「服务错误，请稍后尝试」。
- **不要手工修改 `renderer/api/codegen/`**，改接口请改 swagger 后重跑 `npm run openapi`；需要调整请求行为请改 `renderer/api/request.ts`。

## 5. 代码约定

- 路径别名：`@components/*` → `renderer/components/*`，`@api/*` → `renderer/api/*`（同时配置在 `renderer/tsconfig.json` 的 `paths` 与 `renderer/next.config.js` 的 webpack alias，**两处都要改**）。
- 样式：MUI v5 + `@mui/styles` 的 `makeStyles`/`createStyles`/`styled`；少量 `*.module.css`。未启用 emotion `sx` 之外的统一规范，改动时跟随所在文件风格。
- 语言：注释、UI 文案、README 变更记录均为中文。
- 版本：`package.json` 的 `version` 为唯一版本来源，发版时同步在 `README.md` 追加一条 `0.x.y` 变更记录（按现有格式）。

## 6. 注意事项

- `renderer/lib/apiServer.ts` 直接 `import api-server.json`，**仓库根目录缺少该文件会导致渲染层构建失败**；本地开发先复制模板。
- `capacitor.config.ts` 的 `DEV` 开关：为 `true` 时 WebView 加载 dev server（`http://10.0.2.2:8888`，真机需改局域网 IP）；**打包 release 前必须改回 `false`**，否则 APK 会指向开发机。
- Electron 生产态同时注册了 `app://` 特权协议与静态文件处理器（`main/background.ts` 末尾），静态资源根目录为打包后的 `app/`；`/api`、`/public` 走 307 重定向而非主进程流式代理——这是为了避免切歌时连接泄漏耗尽单主机连接上限，**不要改回主进程代理**。
- `android/app/build/`、`app/`、`dist/`、`node_modules/` 均为产物或依赖，不要手改或提交（`.gitignore` 已锚定根目录的 `/app` 与 `/dist`）。
- CUE 音轨解析在主进程完成（`music-metadata`、`cue-parser`），渲染层通过 `music::parse` / `music::parseCue` 调用；APE/TAK 因 Chromium 内核限制暂不支持播放。
- 全局热键（播放/上一曲/下一曲）在主进程注册，修改后调用 `config::setHotKey` 会自动注销旧键；配置保存后需 `config::saveAndReload` 生效。
