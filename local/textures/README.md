# Local-only texture placeholders (NOT SHIPPED)

**DO NOT commit, pack, upload, or redistribute anything in `blocks/`.**

This folder is for **this machine only** while developing layout/feel.

| Guard | Behavior |
|--------|----------|
| Gitignore | `local/textures/blocks/**` + image globs |
| Vite build | Does **not** copy `local/` into `dist/` |
| Runtime | Loaded **only** when `import.meta.env.DEV` (dev server) |
| Electron pack | `files` whitelist is `dist` + `electron` only; `local` excluded |
| Verify | Fails if PNGs appear under `public/textures` or `dist/textures` |

## TerraBlock policy

Product art is **procedural** until original TerraBlock textures exist.
Third-party / Mojang assets must never leave this folder onto a ship path.

## How placeholders work here

If present, PNGs under `blocks/` are overlaid in **dev only**
(`npm run dev` / `npm run desktop:dev`) via `/__local_textures/`.

`npm run build`, `desktop`, and `desktop:pack` use procedural tiles only.

