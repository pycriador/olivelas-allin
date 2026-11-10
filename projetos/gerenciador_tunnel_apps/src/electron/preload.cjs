const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  openExternal: (url) => ipcRenderer.invoke('electron:open-external', url),
  selectDirectory: (defaultPath) => ipcRenderer.invoke('electron:select-directory', defaultPath),
  getAppInfo: () => ipcRenderer.invoke('electron:get-app-info'),
});
