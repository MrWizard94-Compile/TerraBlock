import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localTexturesRoot = path.resolve(__dirname, "local/textures");

/**
 * Dev-only: serve gitignored local/textures at /__local_textures/*
 * Never copied into dist — production builds stay procedural-only.
 */
function localDevTexturesPlugin() {
  return {
    name: "terrablock-local-dev-textures",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/__local_textures/")) return next();
        const rel = decodeURIComponent(url.slice("/__local_textures/".length).split("?")[0]);
        if (!rel || rel.includes("..") || path.isAbsolute(rel)) {
          res.statusCode = 400;
          res.end("bad path");
          return;
        }
        const filePath = path.resolve(localTexturesRoot, rel);
        if (!filePath.startsWith(localTexturesRoot)) {
          res.statusCode = 403;
          res.end("forbidden");
          return;
        }
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          res.statusCode = 404;
          res.end("not found");
          return;
        }
        res.setHeader("Cache-Control", "no-store");
        if (filePath.endsWith(".png")) res.setHeader("Content-Type", "image/png");
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

/**
 * base: './' so the production build works under Electron loadFile (file://).
 * Browser dev still works with vite's default server.
 */
export default defineConfig({
  base: "./",
  plugins: [localDevTexturesPlugin()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
});
