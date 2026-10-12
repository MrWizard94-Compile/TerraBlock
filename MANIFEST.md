# MANIFEST — TerraBlock desktop delivery history

This records the earlier desktop packaging delivery. Checkmarks below are
historical claims, not fresh evidence for the WPAI Constitution migration or
a current packaged-app acceptance run. Current source verification is performed
by `npm run verify` and the pinned Constitution CI workflow.

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

## Historical self-audit (desktop delivery)

Completeness for scoped product, zero lint, tests, docs, pinned deps, **desktop packaging** — **pass**.
