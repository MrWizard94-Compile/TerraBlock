/**
 * TerraBlock Desktop — Electron main process.
 * Loads the Vite-built game (production) or the Vite dev server (desktop:dev).
 */
import { app, BrowserWindow, Menu, shell, globalShortcut } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { wireDesktopIpc } from "./ipc.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const isDev = !!process.env.VITE_DEV_SERVER_URL;
const DEV_URL = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5173";

/** @type {BrowserWindow | null} */
let mainWindow = null;

// Windows: proper taskbar grouping
if (process.platform === "win32") {
  app.setAppUserModelId("com.wpai.terrablock");
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#070a10",
    title: "TerraBlock",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  // Prefer GPU for Three.js
  mainWindow.webContents.setFrameRate(60);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // External links open in OS browser, never inside the game window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (e, url) => {
    const allowed =
      url.startsWith("file://") ||
      url.startsWith("http://127.0.0.1") ||
      url.startsWith("http://localhost");
    if (!allowed) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    if (process.env.TERRABLOCK_DEVTOOLS === "1") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    const indexHtml = path.join(ROOT, "dist", "index.html");
    if (!fs.existsSync(indexHtml)) {
      console.error("[TerraBlock] Missing dist/index.html — run: npm run build");
      app.quit();
      return;
    }
    mainWindow.loadFile(indexHtml);
  }

  buildMenu();
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "Game",
      submenu: [
        {
          label: "Toggle Fullscreen",
          accelerator: "F11",
          click: () => {
            if (!mainWindow) return;
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.webContents.reload(),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit", label: "Quit TerraBlock" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "togglefullscreen" },
        { type: "separator" },
        {
          label: "Toggle Developer Tools",
          accelerator: "CmdOrCtrl+Shift+I",
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Controls",
          click: () => {
            mainWindow?.webContents.executeJavaScript(
              `window.__TERRABLOCK_GAME__?.ui?.toast?.(
                "WASD move · Space jump · LMB mine · RMB place · E inventory · Esc pause · F11 fullscreen"
              )`
            );
          },
        },
        {
          label: "GitHub / Project",
          click: () => shell.openExternal("https://github.com/"),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  wireDesktopIpc();
  createWindow();

  globalShortcut.register("F11", () => {
    if (!mainWindow) return;
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
