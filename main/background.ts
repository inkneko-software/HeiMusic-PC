import { app, ipcMain, session, protocol, nativeImage, globalShortcut, net } from 'electron';
import { pathToFileURL } from 'url';
import { createWindow } from './helpers';
import path from 'path';
import os from "os"
import fs from "fs"

import { parseFile } from 'music-metadata';
import { parse } from 'cue-parser';

const isProd: boolean = process.env.NODE_ENV === 'production';
var configPath = path.join(os.homedir(), ".heimusic/", "heimusic.json");
var heiMusicConfig: HeiMusicConfig = null;

if (isProd) {
    // app:// 协议由本文件统一接管（静态文件 + 后端代理，处理器见文件末尾），
    // stream 特权用于 <audio> 的 Range 流式请求
    protocol.registerSchemesAsPrivileged([{
        scheme: 'app',
        privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true, allowServiceWorkers: true }
    }]);
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`);
    configPath = path.join(os.homedir(), ".heimusic/", "heimusic_dev.json");
}

function getDefaultConfig(): HeiMusicConfig {
    return {
        apiHost: "http://localhost",
        volume: 35,
        userId: null,
        sessionId: null,
        lastStatus: {
            coverUrl: null,
            title: null,
            artists: [],
            album: null,
            albumid: null,
            duration: null,
            currentTime: null,
            quality: null,
            songUrl: null
        },
        hotkeys: {
            playback: "Control+Alt+P",
            next: "Control+Alt+Right",
            prev: "Control+Alt+Left"
        },
        theme: "light",
        lastPannel: null,
        closeWindowMinimized: null
    }
}

function readConfig(): HeiMusicConfig {
    //1aa0e861f28fe67eb8dfebed8a2dd4155a2e85a7
    console.log("读取配置，配置文件路径：", configPath)
    var defaultConfig = getDefaultConfig();
    if (fs.existsSync(configPath) === false) {
        //heiMusicConfig = structuredClone(defaultConfig); // avaliable in nodejs 17
        heiMusicConfig = { ...defaultConfig, lastStatus: { ...defaultConfig.lastStatus } }
        fs.writeFileSync(configPath, JSON.stringify(heiMusicConfig))
        return heiMusicConfig;
    }
    heiMusicConfig = { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath).toString()) }
    return heiMusicConfig;
}

function saveConfig() {
    console.log("main, save", heiMusicConfig)
    fs.writeFileSync(configPath, JSON.stringify(heiMusicConfig))
}



(async () => {
    await app.whenReady();

    var mainWindow = null;

    


    //检查存储配置文件的文件夹是否存在
    const configDir = path.join(os.homedir(), ".heimusic/");
    if (fs.existsSync(configDir) === false) {
        console.log("正在创建配置文件夹，路径：" + configDir)
        fs.mkdirSync(configDir);
    }

    /**
     * config
     */
    readConfig();
    ipcMain.handle("config::get", () => heiMusicConfig)
    ipcMain.handle("config::set", (event, value) => {
        heiMusicConfig[value[0]] = value[1]
        mainWindow.webContents.send("config::onChange", heiMusicConfig);
    })
    ipcMain.handle("config::save", saveConfig)
    ipcMain.handle("config::saveAndReload", () => {
        saveConfig();
        app.relaunch();
        app.exit();
    })

    /**
     * 热键注册
     */

    globalShortcut.register(heiMusicConfig.hotkeys.next, () => {
        mainWindow.webContents.send("playback::next")
    })
    globalShortcut.register(heiMusicConfig.hotkeys.prev, () => {
        mainWindow.webContents.send("playback::prev")
    })
    globalShortcut.register(heiMusicConfig.hotkeys.playback, () => {
        mainWindow.webContents.send("playback::play")
    })

    ipcMain.handle("config::setHotKey", (event, args) => {
        var target: "prev" | "next" | "playback" = args[0];
        var accelerator: string = args[1];
        switch (target) {
            case 'prev':
                globalShortcut.unregister(heiMusicConfig.hotkeys.prev);
                globalShortcut.register(accelerator, () => mainWindow.webContents.send("playback::prev"))
                heiMusicConfig.hotkeys.prev = accelerator;
                break;
            case 'next':
                globalShortcut.unregister(heiMusicConfig.hotkeys.next);
                globalShortcut.register(accelerator, () => mainWindow.webContents.send("playback::next"))
                heiMusicConfig.hotkeys.next = accelerator;
                break;
            case 'playback':
                globalShortcut.unregister(heiMusicConfig.hotkeys.playback);
                globalShortcut.register(accelerator, () => mainWindow.webContents.send("playback::play"))
                heiMusicConfig.hotkeys.playback = accelerator;
                break;
        }
        saveConfig()
    })

    /**
     * windowManagement
     */
    ipcMain.on("windowManagement::close", () => {
        app.quit()
    })
    ipcMain.on("windowManagement::show", ()=>{
        mainWindow.show();
        mainWindow.setThumbarButtons([
            {
                tooltip: '上一曲',
                icon: nativeImage.createFromPath(path.join(__dirname, "images", "thumbar", "prev.png")),
                click: () => { mainWindow.webContents.send("playback::prev") }
            },
            {
                tooltip: '播放',
                icon: nativeImage.createFromPath(path.join(__dirname, "images", "thumbar", "play.png")),
                click: () => { mainWindow.webContents.send("playback::play") }
            },
            {
                tooltip: '下一曲',
                icon: nativeImage.createFromPath(path.join(__dirname, "images", "thumbar", "next.png")),
                click: () => { mainWindow.webContents.send("playback::next") }
            }
        ])
    })
    
    ipcMain.on("windowManagement::minimize", () => {
        mainWindow.minimize()
    })

    ipcMain.on("windowManagement::maximize", () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize()
        } else {
            mainWindow.maximize()
        }
    })

    /**
     * music
     */
    ipcMain.handle("music::parse", async (_, arg: string) => {
        return await parseFile(arg);
    })

    ipcMain.handle("music::parseCue", async (_, path: string) => {
        console.log(path)
        console.log(parse)
        const cuesheet = parse(path);
        return cuesheet;
    })

    /**
     * web hooks，包括跨域，cookie设置
     * 
     * 已知问题是如果apiHost为http://localhost，则会匹配localhost:*，即匹配了前端webpack服务器的页面。
     */

    const filter = {
        urls: [heiMusicConfig.apiHost + "/*"]
    }

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        details.requestHeaders["Cookie"] = `userId=${heiMusicConfig.userId}; sessionId=${heiMusicConfig.sessionId}`;
        console.log("Electron webhook 已添加cookie：", details.url)
        callback({ requestHeaders: details.requestHeaders })
    })

    session.defaultSession.webRequest.onHeadersReceived(
        filter,
        (details, callback) => {
            // if (details.method.toUpperCase() === "OPTIONS"){
            //     details.statusCode = 200;
            // }

            // if (isProd) {
            //     details.responseHeaders['Access-Control-Allow-Origin'] = [
            //         'app://.'
            //     ];
            // } else {
            //     details.responseHeaders['Access-Control-Allow-Origin'] = [
            //         `http://localhost:${process.argv[2]}`
            //     ];
            // }
            // console.log("Electron webhook 已添加跨域头：", details.url, details.method, details.statusCode)
            var cookies: string[] = [];
            if (typeof (details.responseHeaders["Set-Cookie"]) !== "undefined") {
                cookies = details.responseHeaders["Set-Cookie"];

            }
            if (typeof (details.responseHeaders["set-cookie"]) !== "undefined") {
                cookies = details.responseHeaders["set-cookie"];
            }
            if (cookies.length !== 0) {
                cookies.forEach((value, index) => {
                    if (value.startsWith("sessionId")) {
                        heiMusicConfig.sessionId = value.split(";")[0].split("=")[1];
                        saveConfig();
                    }
                    if (value.startsWith("userId")) {
                        heiMusicConfig.userId = value.split(";")[0].split("=")[1];
                        saveConfig();
                    }
                })
            }
            callback({ responseHeaders: details.responseHeaders });
        }
    );

    

    ipcMain.handle("thumbnail::playing", () => {
        mainWindow.setThumbarButtons([
            {
                tooltip: '上一曲',
                icon: nativeImage.createFromPath(path.join(__dirname, "images", "thumbar", "prev.png")),
                click: () => { mainWindow.webContents.send("playback::prev") }
            },
            {
                tooltip: '暂停',
                icon: nativeImage.createFromPath(path.join(__dirname, "images", "thumbar", "pause.png")),
                click: () => { mainWindow.webContents.send("playback::play") }
            },
            {
                tooltip: '下一曲',
                icon: nativeImage.createFromPath(path.join(__dirname, "images", "thumbar", "next.png")),
                click: () => { mainWindow.webContents.send("playback::next") }
            }
        ])
    })

    ipcMain.handle("thumbnail::paused", () => {
        mainWindow.setThumbarButtons([
            {
                tooltip: '上一曲',
                icon: nativeImage.createFromPath(path.join(__dirname, "images", "thumbar", "prev.png")),
                click: () => { mainWindow.webContents.send("playback::prev") }
            },
            {
                tooltip: '播放',
                icon: nativeImage.createFromPath(path.join(__dirname, "images", "thumbar", "play.png")),
                click: () => { mainWindow.webContents.send("playback::play") }
            },
            {
                tooltip: '下一曲',
                icon: nativeImage.createFromPath(path.join(__dirname, "images", "thumbar", "next.png")),
                click: () => { mainWindow.webContents.send("playback::next") }
            }
        ])
    });



    mainWindow =  createWindow('main', {
        width: 1280,
        height: 768,
        minWidth: 1000,
        minHeight: 600,
        frame: false,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (isProd) {
        await mainWindow.loadURL('app://./home.html');
    } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/home`);
        mainWindow.webContents.openDevTools();
    }
})();

app.on('window-all-closed', () => {
    app.quit();
});


/**
 * app:// 协议处理器（生产态）——"壳层代理"：
 * - 后端前缀（/api、/public）：307 重定向到配置的 apiHost。渲染层的 API 请求与媒体
 *   资源统一使用相对路径（与网页端 nginx 反代、开发态 next rewrites 同一约定），
 *   鉴权 Cookie 由 webRequest 钩子按 apiHost/* 过滤器注入。
 * - 其余路径：本地静态文件（app/ 目录），映射逻辑与原 electron-serve 一致。
 * 注意：前缀表需与网页端 nginx 的反代 location 保持一致。
 */
const BACKEND_PATH_PREFIXES = ['/api', '/public'];

async function resolveStaticFile(filePath: string): Promise<string> {
    try {
        const result = await fs.promises.stat(filePath);
        if (result.isFile()) {
            return filePath;
        }
        if (result.isDirectory()) {
            return resolveStaticFile(path.join(filePath, 'index.html'));
        }
    } catch (_) { }
    return null;
}

app.on("ready", () => {
    if (!isProd) {
        return; // 开发态渲染层直接加载 dev server（http://localhost），/api 由 next rewrites 反代
    }
    const appDir = path.join(app.getAppPath(), 'app');
    protocol.handle('app', async (request) => {
        const url = new URL(request.url);
        if (BACKEND_PATH_PREFIXES.some(prefix => url.pathname.startsWith(prefix))) {
            // 307 重定向到后端而非主进程流式代理：媒体下载、取消、连接管理全部交还
            // Chromium 原生网络栈。实测主进程代理的流在渲染层取消（如切歌）时不会
            // 中断上游下载，多次切歌每首泄漏一条连接，占满单主机连接上限（6）后
            // 所有请求被阻塞。鉴权 Cookie 由下方 webRequest 钩子按 apiHost/* 注入。
            return Response.redirect(heiMusicConfig.apiHost + url.pathname + url.search, 307);
        }
        const filePath = path.join(appDir, decodeURIComponent(url.pathname));
        const resolvedPath = await resolveStaticFile(filePath);
        const fileExtension = path.extname(filePath);
        if (resolvedPath || !fileExtension || fileExtension === '.html' || fileExtension === '.asar') {
            return net.fetch(pathToFileURL(resolvedPath ?? path.join(appDir, 'index.html')).toString());
        }
        return new Response(null, { status: 404 });
    });
});