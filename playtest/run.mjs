#!/usr/bin/env node
/**
 * TerraBlock autonomous playtest runner.
 *
 * Eyes: canvas/page screenshots + JSON state dumps
 * Hands: PlaytestBridge virtual input + high-level commands
 *
 * Usage:
 *   npm run playtest              # smoke scenarios
 *   npm run playtest:agent        # autonomous agent session
 *   node playtest/run.mjs --mode smoke --seed 42
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { PlaytestClient } from "./lib/client.mjs";
import { PlaytestAgent } from "./lib/agent.mjs";
import { runSmoke } from "./scenarios/smoke.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "playtest", "output");

const args = parseArgs(process.argv.slice(2));
const mode = args.mode || "smoke";
const seed = Number(args.seed || 42) >>> 0;
const headed = args.headed === true || args.headed === "true";
const keepOpen = args.keep === true;

function log(...a) {
  console.log("[playtest]", ...a);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  // clean old outputs optionally
  if (args.clean) {
    for (const f of fs.readdirSync(outDir)) {
      fs.unlinkSync(path.join(outDir, f));
    }
  }

  const port = await findFreePort(5199);
  const baseUrl = `http://127.0.0.1:${port}`;
  log(`starting vite on ${baseUrl}`);

  const server = spawn(
    process.execPath,
    [
      path.join(root, "node_modules", "vite", "bin", "vite.js"),
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    {
      cwd: root,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    }
  );

  let serverLog = "";
  server.stdout.on("data", (d) => {
    serverLog += d.toString();
  });
  server.stderr.on("data", (d) => {
    serverLog += d.toString();
  });

  try {
    await waitForUrl(`${baseUrl}/`, 30000);
    log("vite ready");

    const browser = await chromium.launch({
      headless: !headed,
      args: ["--use-gl=angle", "--ignore-gpu-blocklist"],
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.on("console", (msg) => {
      if (args.verbose) log("console", msg.type(), msg.text());
    });
    page.on("pageerror", (err) => log("pageerror", err.message));

    const url = `${baseUrl}/?playtest=1&seed=${seed}`;
    log(`goto ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const client = new PlaytestClient(page, { outDir });
    let report;

    if (mode === "agent") {
      const agent = new PlaytestAgent(client, { log });
      report = await agent.run({
        seed,
        maxSteps: Number(args.steps || 35),
        screenshotEvery: Number(args.shotEvery || 4),
      });
      report.name = "agent";
    } else if (mode === "smoke") {
      report = await runSmoke(client, log);
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }

    const reportPath = path.join(outDir, `report_${mode}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`report → ${reportPath}`);
    log(`screenshots → ${outDir}`);

    if (!keepOpen) {
      await browser.close();
    } else {
      log("keeping browser open (--keep); Ctrl+C to exit");
      await new Promise(() => {});
    }

    stop(server);
    if (!report.ok) {
      log("FAILED");
      process.exit(1);
    }
    log("PASSED");
    process.exit(0);
  } catch (e) {
    log("ERROR", e.message || e);
    if (serverLog) {
      fs.writeFileSync(path.join(outDir, "vite.log"), serverLog);
      log("vite log written");
    }
    stop(server);
    process.exit(1);
  }
}

function stop(proc) {
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(proc.pid), "/f", "/t"], { stdio: "ignore" });
    } else {
      proc.kill("SIGTERM");
    }
  } catch {
    /* ignore */
  }
}

function parseArgs(argv) {
  /** @type {Record<string, string|boolean>} */
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    }
  }
  return out;
}

function findFreePort(start) {
  return new Promise((resolve, reject) => {
    let port = start;
    const tryListen = () => {
      const s = createServer();
      s.unref();
      s.on("error", () => {
        port++;
        if (port > start + 50) reject(new Error("no free port"));
        else tryListen();
      });
      s.listen(port, "127.0.0.1", () => {
        s.close(() => resolve(port));
      });
    };
    tryListen();
  });
}

async function waitForUrl(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

main();
