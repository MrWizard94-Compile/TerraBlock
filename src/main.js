import "./style.css";
import { Game } from "./game/Game.js";

const canvas = document.getElementById("game-canvas");
const uiRoot = document.getElementById("ui-root");

const game = new Game(canvas, uiRoot);

// Expose for Playwright / debug (read-only handle; control via playtest bridge)
try {
  window.__TERRABLOCK_GAME__ = game;
  if (window.terrablockDesktop?.isDesktop) {
    document.title = "TerraBlock";
    document.documentElement.classList.add("desktop");
  }
} catch {
  /* ignore */
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
