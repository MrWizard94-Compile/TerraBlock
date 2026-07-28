#!/usr/bin/env node
/**
 * SOUL pre-delivery verification gate.
 * Exit 0 only when lint, unit tests, and production build all succeed.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readdirSync, existsSync, statSync } from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const node = process.execPath;

/**
 * Never ship third-party / placeholder textures on product paths.
 * Local placeholders live only under local/textures (dev server).
 */
function assertNoShippedTexturePack() {
  console.log("\n══ No third-party textures on ship paths ══");
  const bannedRoots = [
    path.join(root, "public", "textures"),
    path.join(root, "dist", "textures"),
  ];
  const hits = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.(png|jpe?g|gif|webp)$/i.test(name)) hits.push(path.relative(root, p));
    }
  };
  for (const dir of bannedRoots) walk(dir);
  if (hits.length) {
    console.error("FAIL: texture files on ship path (remove them; use local/textures for private placeholders only):");
    for (const h of hits.slice(0, 40)) console.error("  -", h);
    if (hits.length > 40) console.error(`  … +${hits.length - 40} more`);
    process.exit(1);
  }
  console.log("OK: No third-party textures on ship paths");
}

function bin(name) {
  const base = path.join(root, "node_modules", ".bin", isWin ? `${name}.cmd` : name);
  if (!existsSync(base)) {
    throw new Error(`Missing local binary: ${base}. Run npm install.`);
  }
  return base;
}

/**
 * Run a local .bin tool. On Windows, .cmd wrappers need shell:true with a single
 * command string; args are fixed literals (no user input) so this is safe.
 * @param {string} label
 * @param {string} binName
 * @param {string[]} args
 */
function runBin(label, binName, args) {
  console.log(`\n══ ${label} ══`);
  let result;
  if (isWin) {
    const cmd = `"${bin(binName)}" ${args.map((a) => `"${a}"`).join(" ")}`;
    result = spawnSync(cmd, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
  } else {
    result = spawnSync(bin(binName), args, {
      cwd: root,
      stdio: "inherit",
      shell: false,
      env: process.env,
    });
  }
  if (result.error) {
    console.error(`\nFAIL: ${label}`, result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\nFAIL: ${label} (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
  console.log(`OK: ${label}`);
}

/**
 * @param {string} label
 * @param {string} command
 * @param {string[]} args
 */
function runNode(label, command, args) {
  console.log(`\n══ ${label} ══`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.error) {
    console.error(`\nFAIL: ${label}`, result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\nFAIL: ${label} (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
  console.log(`OK: ${label}`);
}

const testFiles = readdirSync(path.join(root, "tests"))
  .filter((f) => f.endsWith(".test.js"))
  .map((f) => path.join("tests", f));

assertNoShippedTexturePack();
runBin("ESLint (zero warnings)", "eslint", [".", "--max-warnings", "0"]);
runNode("Unit tests", node, ["--test", ...testFiles]);
runBin("Production build", "vite", ["build"]);
assertNoShippedTexturePack();

// Full playtest is part of the real gate (not optional). Set SKIP_PLAYTEST=1 only for emergency.
if (process.env.SKIP_PLAYTEST !== "1") {
  runNode("Playtest acceptance", node, [
    path.join("playtest", "run.mjs"),
    "--mode",
    "smoke",
    "--seed",
    "42",
    "--clean",
  ]);
} else {
  console.log("\n══ Playtest acceptance ══");
  console.log("SKIPPED (SKIP_PLAYTEST=1)");
}

console.log("\n══════════════════════════════════════");
console.log("VERIFY GATE PASSED — delivery eligible");
console.log("══════════════════════════════════════\n");
