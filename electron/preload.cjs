/**
 * Preload — CommonJS for Electron reliability under contextIsolation.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("terrablockDesktop", {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  toggleFullscreen() {
    ipcRenderer.send("desktop:toggle-fullscreen");
  },
});
