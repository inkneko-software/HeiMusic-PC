import { app, ipcMain, session, protocol, nativeImage, globalShortcut } from 'electron';
import serve from 'electron-serve';
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
    serve({ directory: 'app' });
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


app.on("ready", () => {
    protocol.registerFileProtocol("app", (request, callback) => {
        const filePath = request.url.replace("app:///", "");
        const decodedPath = decodeURI(filePath);
        callback(decodedPath);
    });
});