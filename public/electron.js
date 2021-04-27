// 引入electron并创建一个Browserwindow
const {
	app,
	BrowserWindow,
	ipcMain,
	Menu,
	Tray,
	globalShortcut
} = require('electron')
const path = require('path')
const url = require('url')



let mainWindow
let iconPath = path.join(__dirname, './logo.jpg')
if (process.env.NODE_ENV !== 'production'){
	iconPath = path.join(__dirname, './baseline_build_circle_black_18dp.png')
}

function createWindow () {
	mainWindow = new BrowserWindow({width: 1360, height: 758, frame: false, minWidth: 1024, minHeight: 640,webPreferences: {nodeIntegration: true, webSecurity: false}, icon: iconPath})
		if (process.env.NODE_ENV === 'production'){
			mainWindow.loadURL(url.format({
				pathname: path.join(__dirname, '../build/index.html'),
				protocol: 'file:',
				slashes: true
			}))
		}
		else{
		mainWindow.loadURL('http://localhost:3000/');
		}
		// mainWindow.webContents.openDevTools()
		mainWindow.on('closed', function () {
			mainWindow = null
	})

	ipcMain.on('window-control', (event, data)=>{
		switch(data.action){
			case "quit":
				app.quit();
				app.quit();
				break;
			case "minimize":
				mainWindow.minimize()
				break;
			case "maximize":
				mainWindow.maximize()
				break;
			case "restore":
				mainWindow.restore()
				break;
			case "hide":
				mainWindow.hide()
				break;
		}
	})

	mainWindow.on('maximize', function(){
		mainWindow.webContents.send('window-change-callback', {action: 'maximize'})
	})
	
	mainWindow.on('unmaximize', function(){
		mainWindow.webContents.send('window-change-callback', {action: 'restore'})
	})

	
	globalShortcut.register("Control+Alt+P", ()=>{mainWindow.webContents.send('music-player-hotkey-callback', {action: 'pause'})})
	globalShortcut.register("Control+Alt+Right", ()=>{mainWindow.webContents.send('music-player-hotkey-callback', {action: 'next'})})
	globalShortcut.register("Control+Alt+Left", ()=>{mainWindow.webContents.send('music-player-hotkey-callback', {action: 'privious'})})


	
	//mainWindow.setMenu(null);
}

function Init(){
	createWindow()
	let appTray = new Tray(iconPath)
	appTray.setToolTip('HeiMusic!');
	var trayMenuTemplate = [
        {
          label: '打开',
          click: () => {
			mainWindow.show();
          }
        },
        {
          label: '退出',
          click: () => {
			mainWindow.webContents.send('music-player-saveHistory-callback')
			//因为没有办法从主进程发送同步消息到渲染进程，所以让渲染进程执行完保存记录后给主进程发送window-control->quit消息
            // app.quit();
			// app.quit();//因为程序设定关闭为最小化，所以调用两次关闭，防止最大化时一次不能关闭的情况
          }
        }
      ];
	  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
      //设置此托盘图标的悬停提示内容
      appTray.setToolTip('我的托盘图标');
      //设置此图标的上下文菜单
      appTray.setContextMenu(contextMenu);
      //单击右下角小图标显示应用左键
      appTray.on('click',function(){
        mainWindow.show();
      })
      //右键
      appTray.on('right-click', () => {
        appTray.popUpContextMenu(trayMenuTemplate);
      });
}
app.on('ready', Init)

app.on('window-all-closed', function () {
	// macOS中除非用户按下 `Cmd + Q` 显式退出,否则应用与菜单栏始终处于活动状态.
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function () {
	 // macOS中点击Dock图标时没有已打开的其余应用窗口时,则通常在应用中重建一个窗口
	if (mainWindow === null) {
		createWindow()
	}
})

app.on('will-quit', (e) => {
	globalShortcut.unregisterAll()
  })