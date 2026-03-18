const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bookwork', {
  getBootstrap: () => ipcRenderer.invoke('bookwork:get-bootstrap'),
  saveSettings: (settings) => ipcRenderer.invoke('bookwork:save-settings', settings),
  openWorkspace: () => ipcRenderer.invoke('bookwork:open-workspace')
});
