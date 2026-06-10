const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ElectronStore = require('electron-store');

const store = new ElectronStore({
  defaults: {
    todos: [],
    settings: {
      autoLaunch: false,
      alwaysOnTop: true,
      opacity: 0.75,
      theme: 'system',
      fontSize: 14,
      autoDeleteDays: 30,
      defaultDueDate: 'none',
      language: 'system'
    },
    windowBounds: { x: undefined, y: undefined, width: 350, height: 500 }
  }
});

let mainWindow = null;
let tray = null;
let localeStrings = {
  trayTooltip: '待办便贴纸',
  trayShow: '显示',
  trayQuit: '退出',
  importDialogTitle: '导入待办',
  textFile: '文本文件',
  exportDialogTitle: '导出待办数据',
  exportDefaultName: '待办数据'
};

function createWindow() {
  const bounds = store.get('windowBounds');
  const settings = store.get('settings');
  const alwaysOnTop = settings.alwaysOnTop !== undefined ? settings.alwaysOnTop : true;

  // 安全检查：确保窗口位置在屏幕可见范围内
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const winWidth = bounds.width || 350;
  const winHeight = bounds.height || 500;
  let winX = bounds.x;
  let winY = bounds.y;
  if (winX !== undefined && (winX < -100 || winX > screenWidth - 100)) winX = undefined;
  if (winY !== undefined && (winY < -100 || winY > screenHeight - 100)) winY = undefined;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: winX,
    y: winY,
    minWidth: 280,
    minHeight: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: alwaysOnTop,
    resizable: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 使用 screen-saver 级别确保窗口置顶于所有应用之上（仅在开启置顶时生效）
  if (alwaysOnTop) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  }

  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowBounds.width', width);
    store.set('windowBounds.height', height);
  });

  mainWindow.on('move', () => {
    const { x, y } = mainWindow.getBounds();
    store.set('windowBounds.x', x);
    store.set('windowBounds.y', y);
  });

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  // 使用 ICO 文件加载托盘图标（Windows 系统托盘对 ICO 格式兼容性更好）
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.ico');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip(localeStrings.trayTooltip);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: localeStrings.trayShow,
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: localeStrings.trayQuit,
      click: () => {
        if (mainWindow) {
          mainWindow.removeAllListeners('close');
          mainWindow.close();
        }
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  // 不退出应用，保持托盘运行
});

// IPC: 获取待办
ipcMain.handle('get-todos', () => {
  return store.get('todos', []);
});

// IPC: 保存待办
ipcMain.handle('save-todos', (event, todos) => {
  store.set('todos', todos);
  return true;
});

// IPC: 获取设置
ipcMain.handle('get-settings', () => {
  return store.get('settings', { autoLaunch: false, alwaysOnTop: true, opacity: 0.75, theme: 'system', fontSize: 14, autoDeleteDays: 0, language: 'system', defaultDueDate: 'none' });
});

// IPC: 保存设置
ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);

  // 处理 alwaysOnTop
  if (mainWindow && settings.alwaysOnTop !== undefined) {
    mainWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver');
  }

  return true;
});

// IPC: 切换开机自启
ipcMain.handle('toggle-auto-launch', (event, enable) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    path: app.getPath('exe')
  });

  const settings = store.get('settings', { autoLaunch: false, alwaysOnTop: true });
  settings.autoLaunch = enable;
  store.set('settings', settings);

  return enable;
});

// IPC: 窗口最小化
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

// IPC: 窗口关闭（隐藏到托盘）
ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.hide();
});

// IPC: 设置窗口透明度
ipcMain.handle('set-opacity', (event, value) => {
  if (mainWindow) {
    mainWindow.setOpacity(value);
  }
  return true;
});

// IPC: 更新语言（渲染进程通知主进程更新托盘菜单等）
ipcMain.handle('update-locale', (event, strings) => {
  localeStrings = { ...localeStrings, ...strings };
  // 重建托盘菜单
  if (tray) {
    tray.setToolTip(localeStrings.trayTooltip);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: localeStrings.trayShow,
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      { type: 'separator' },
      {
        label: localeStrings.trayQuit,
        click: () => {
          if (mainWindow) {
            mainWindow.removeAllListeners('close');
            mainWindow.close();
          }
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  }
  return true;
});

// IPC: 导入文件
ipcMain.handle('import-file', async () => {
  const result = dialog.showOpenDialogSync(mainWindow, {
    title: localeStrings.importDialogTitle,
    filters: [{ name: localeStrings.textFile, extensions: ['txt'] }],
    properties: ['openFile']
  });
  if (!result || result.length === 0) return null;
  try {
    const content = fs.readFileSync(result[0], 'utf-8');
    return content;
  } catch (err) {
    return null;
  }
});

// IPC: 导出文件
ipcMain.handle('export-file', async (event, content) => {
  const result = dialog.showSaveDialogSync(mainWindow, {
    title: localeStrings.exportDialogTitle,
    defaultPath: localeStrings.exportDefaultName + '-' + (function() { const d = new Date(); const pad = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds()); }()) + '.txt',
    filters: [{ name: localeStrings.textFile, extensions: ['txt'] }]
  });
  if (!result) return false;
  try {
    fs.writeFileSync(result, content, 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
});
