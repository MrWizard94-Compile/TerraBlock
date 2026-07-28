/**
 * Optional IPC handlers for desktop chrome (fullscreen).
 * Imported from main after app ready if needed.
 */
import { ipcMain, BrowserWindow } from "electron";

let wired = false;

export function wireDesktopIpc() {
  if (wired) return;
  wired = true;
  ipcMain.on("desktop:toggle-fullscreen", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setFullScreen(!win.isFullScreen());
  });
}
