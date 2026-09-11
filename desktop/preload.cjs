const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  saveMap: (content, options) => ipcRenderer.invoke('save-map', content, options),
  proficiency: {
    load: family => ipcRenderer.invoke('proficiency-load', family),
    save: (family, text) => ipcRenderer.invoke('proficiency-save', family, text)
  }
});
