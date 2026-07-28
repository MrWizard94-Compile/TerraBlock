/**
 * Playwright client for TerraBlock playtest bridge (eyes + hands).
 */
import fs from "node:fs";
import path from "node:path";

export class PlaytestClient {
  /**
   * @param {import('playwright').Page} page
   * @param {{ outDir?: string }} [opts]
   */
  constructor(page, opts = {}) {
    this.page = page;
    this.outDir = opts.outDir || path.join(process.cwd(), "playtest", "output");
    this.shotIndex = 0;
    fs.mkdirSync(this.outDir, { recursive: true });
  }

  async waitForEngine(timeoutMs = 30000) {
    await this.page.waitForFunction(() => window.__TERRABLOCK_ENGINE_READY__ === true, null, {
      timeout: timeoutMs,
    });
  }

  async waitForBridge(timeoutMs = 10000) {
    await this.page.waitForFunction(() => !!window.__TERRABLOCK_PLAYTEST__, null, {
      timeout: timeoutMs,
    });
  }

  /**
   * @param {string} cmd
   * @param {object} [args]
   */
  async command(cmd, args = {}) {
    return this.page.evaluate(
      async ({ cmd, args }) => {
        const b = window.__TERRABLOCK_PLAYTEST__;
        if (!b) return { ok: false, error: "bridge missing" };
        return b.command(cmd, args);
      },
      { cmd, args }
    );
  }

  async getState() {
    return this.page.evaluate(() => {
      const b = window.__TERRABLOCK_PLAYTEST__;
      if (!b) return null;
      return b.getState();
    });
  }

  /**
   * @param {Partial<object>} controls
   */
  async setControls(controls) {
    return this.page.evaluate((c) => window.__TERRABLOCK_PLAYTEST__?.setControls(c), controls);
  }

  async clearControls() {
    return this.page.evaluate(() => window.__TERRABLOCK_PLAYTEST__?.clearControls());
  }

  /**
   * Eyes: capture game canvas (+ optional full page).
   * @param {string} [label]
   */
  async screenshot(label = "frame") {
    this.shotIndex += 1;
    const name = `${String(this.shotIndex).padStart(3, "0")}_${sanitize(label)}`;
    const canvasPath = path.join(this.outDir, `${name}_canvas.png`);
    const pagePath = path.join(this.outDir, `${name}_page.png`);
    const statePath = path.join(this.outDir, `${name}_state.json`);

    const state = await this.getState();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

    const canvas = this.page.locator("#game-canvas");
    await canvas.screenshot({ path: canvasPath });
    await this.page.screenshot({ path: pagePath, fullPage: false });

    return { canvasPath, pagePath, statePath, state };
  }

  /**
   * Hold movement/look for duration, stepping screenshots optionally.
   */
  async drive(opts = {}) {
    const {
      keys = [],
      left = false,
      right = false,
      lookDx = 0,
      lookDy = 0,
      ms = 500,
      tickMs = 100,
    } = opts;
    const steps = Math.max(1, Math.ceil(ms / tickMs));
    for (let i = 0; i < steps; i++) {
      await this.setControls({
        keys,
        left,
        right,
        lookDx: lookDx / steps,
        lookDy: lookDy / steps,
        locked: true,
      });
      await this.page.waitForTimeout(tickMs);
    }
    await this.clearControls();
  }
}

function sanitize(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 40);
}
