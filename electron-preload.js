// Gives the update screen its progress events, and nothing else.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('updater', { onProgress: fn => ipcRenderer.on('progress', (e, p) => fn(p)) });
