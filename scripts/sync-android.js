/**
 * 安卓端代码同步（AGENTS.md「Android 构建链路」轻量路径的自动化封装）：
 *   ① 备份 app/background.js(.map) —— Electron 打包入口（package.json 的 main 指向它），
 *     next export 会清空 app/，不还原则 Electron 打包入口丢失
 *   ② npx next build renderer      —— 渲染层构建到 renderer/.next（next export 从这里导出，
 *     不先 build 导出的就是上一次的旧产物）
 *   ③ npx next export renderer -o app —— 静态导出到 app/
 *   ④ 还原 ① 的备份
 *   ⑤ npx cap copy android         —— 同步进 android/app/src/main/assets/public 并刷新 capacitor.config.json
 *
 * 可选参数 --install：追加 gradlew installDebug 装机（联调迭代）。
 * gradle 需要 JDK 21，本机默认版本不足时经环境变量传入：
 *   JAVA_HOME="<JDK21路径>" npm run android:sync:install
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const entryBackup = [
    { file: path.join(root, 'app', 'background.js'), data: null },
    { file: path.join(root, 'app', 'background.js.map'), data: null },
];

function run(command, cwd) {
    console.log(`[android:sync] ${command}`);
    execSync(command, { stdio: 'inherit', cwd });
}

function main() {
    const doInstall = process.argv.includes('--install');

    // ① 备份 Electron 入口：缺失说明入口已丢失（上次导出后未还原），先跑一次 npm run build 补回
    let backedUp = 0;
    for (const entry of entryBackup) {
        if (!fs.existsSync(entry.file)) {
            if (entry.file.endsWith('.js')) {
                console.error('[android:sync] app/background.js 不存在（Electron 打包入口已丢失），先执行一次 npm run build 再用本命令');
                process.exit(1);
            }
            continue; // .map 可选
        }
        entry.data = fs.readFileSync(entry.file);
        backedUp++;
    }

    try {
        // ②③ 构建并静态导出
        run('npx next build renderer', root);
        run('npx next export renderer -o app', root);
    } finally {
        // ④ 还原备份：构建/导出中途失败也要还（export 已清空 app/）
        for (const entry of entryBackup) {
            if (entry.data !== null) {
                fs.writeFileSync(entry.file, entry.data);
            }
        }
        console.log(`[android:sync] Electron 入口已还原（${backedUp} 个文件）`);
    }

    // ⑤ 同步进 Capacitor 工程
    run('npx cap copy android', root);

    if (doInstall) {
        // gradle 构建需 JDK 21（经 JAVA_HOME 环境变量传入）。
        // Windows 用绝对路径调用：NoDefaultCurrentDirectoryInExePath 生效的机器上，
        // cmd 不从当前目录解析裸名 gradlew.bat（实测报"不是内部或外部命令"）
        const gradlew = process.platform === 'win32'
            ? `"${path.join(root, 'android', 'gradlew.bat')}"`
            : './gradlew';
        run(`${gradlew} installDebug`, path.join(root, 'android'));
    }

    console.log('[android:sync] 完成');
}

main();
