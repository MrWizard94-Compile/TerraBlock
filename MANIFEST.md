# MANIFEST — TerraBlock **desktop / honest scope**

**Title**: Desktop app + honest parity docs  
**Summary**: Electron shell packages TerraBlock as a native window. **Not** full Terraria parity — see `docs/PARITY.md` (~15% overall).

## Ship checklist

| Item | Status |
|------|--------|
| Lint zero warnings | ✓ |
| Unit tests | ✓ |
| Production build | ✓ |
| Electron window | `npm run desktop` |
| Unpacked exe | `release/win-unpacked/TerraBlock.exe` |
| Installer pack | `npm run desktop:pack` |
| Playtest smoke | `npm run playtest` (browser tooling) |
| Save migrate v2–v4 | ✓ |
| Victory condition | Moon Lord |
| Docs | README, PARITY, CHANGELOG, AGENTS |

## How to play (desktop)

```bash
npm install
npm run desktop
# or double-click release\win-unpacked\TerraBlock.exe after desktop:dir / desktop:pack
```

Hot reload:

```bash
npm run desktop:dev
```

## Suggested commit

```
feat(desktop): Electron shell + Windows pack (TerraBlock.exe)
```

## Self-audit (SOUL §0)

Completeness for scoped product, zero lint, tests, docs, pinned deps, **desktop packaging** — **pass**.
