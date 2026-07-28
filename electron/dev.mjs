/**
 * Desktop dev: start Vite, wait until ready, launch Electron, tear down together.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { existsSync } from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const DEV_URL = "http://127.0.0.1:5173";
const host = "127.0.0.1";
const port = 5173;

function bin(name) {
  const p = path.join(root, "node_modules", ".bin", isWin ? `${name}.cmd` : name);
  if (!existsSync(p)) throw new Error(`Missing ${p} — run npm install`);
  return p;
}

function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Vite did not become ready within ${timeoutMs}ms`));
        } else {
          setTimeout(tick, 250);
        }
      });
    };
    tick();
  });
}

/** @type {import('node:child_process').ChildProcess[]} */
const children = [];

function killAll() {
  for (const c of children) {
    try {
      if (isWin) {
        spawn("taskkill", ["/pid", String(c.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        c.kill("SIGTERM");
      }
    } catch {
      /* ignore */
    }
  }
}

process.on("SIGINT", () => {
  killAll();
  process.exit(0);
});
process.on("SIGTERM", () => {
  killAll();
  process.exit(0);
});

console.log("[desktop:dev] starting Vite…");
const vite = spawn(bin("vite"), ["--host", host, "--port", String(port)], {
  cwd: root,
  stdio: "inherit",
  shell: isWin,
  env: { ...process.env },
});
children.push(vite);

vite.on("exit", (code) => {
  if (code && code !== 0) {
    console.error("[desktop:dev] Vite exited", code);
    killAll();
    process.exit(code);
  }
});

try {
  await waitForServer(DEV_URL);
} catch (e) {
  console.error(e);
  killAll();
  process.exit(1);
}

console.log("[desktop:dev] launching Electron…");
const electronBin = bin("electron");
const electron = spawn(electronBin, ["."], {
  cwd: root,
  stdio: "inherit",
  shell: isWin,
  env: {
    ...process.env,
    VITE_DEV_SERVER_URL: DEV_URL,
    ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
  },
});
children.push(electron);

electron.on("exit", (code) => {
  killAll();
  process.exit(code ?? 0);
});
