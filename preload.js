const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTodos: () => ipcRenderer.invoke('get-todos'),
  saveTodos: (todos) => ipcRenderer.invoke('save-todos', todos),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  toggleAutoLaunch: (enable) => ipcRenderer.invoke('toggle-auto-launch', enable),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  setOpacity: (value) => ipcRenderer.invoke('set-opacity', value),
  importFile: () => ipcRenderer.invoke('import-file'),
  exportFile: (content) => ipcRenderer.invoke('export-file', content),
  updateLocale: (strings) => ipcRenderer.invoke('update-locale', strings)
});
