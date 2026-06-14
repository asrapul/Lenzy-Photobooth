// electron/preload.js — Secure contextBridge API for Lenzy Photo
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  captureFromDSLR: () => ipcRenderer.invoke("capture-dslr"),
  getDslrStatus: () => ipcRenderer.invoke("get-dslr-status"),
  getTunnelUrl: () => ipcRenderer.invoke("get-tunnel-url"),
});