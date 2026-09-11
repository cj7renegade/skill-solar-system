const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', { saveMap: content => ipcRenderer.invoke('save-map', content) });
