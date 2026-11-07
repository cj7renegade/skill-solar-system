const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  saveMap: (content, options) => ipcRenderer.invoke('save-map', content, options),
  proficiency: {
    load: family => ipcRenderer.invoke('proficiency-load', family),
    save: (family, text) => ipcRenderer.invoke('proficiency-save', family, text)
  },
  maps: {
    list: () => ipcRenderer.invoke('maps-list'),
    read: relative => ipcRenderer.invoke('maps-read', relative)
  },
  // The AI Guide: requests go to the main process, which alone talks to Claude.
  guide: {
    status: () => ipcRenderer.invoke('guide-status'),
    retry: () => ipcRenderer.invoke('guide-retry'),
    setKey: key => ipcRenderer.invoke('guide-set-key', key),
    clearKey: () => ipcRenderer.invoke('guide-clear-key'),
    settings: next => ipcRenderer.invoke('guide-settings', next),
    turn: (id, request) => ipcRenderer.invoke('guide-turn', id, request),
    cancel: id => ipcRenderer.invoke('guide-cancel', id),
    onStatus: callback => ipcRenderer.on('guide-status', (_, status) => callback(status)),
    onDelta: callback => ipcRenderer.on('guide-delta', (_, id, text) => callback(id, text))
  }
});
