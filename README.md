# TerraBlock — Desktop Edition

**Native desktop** Terraria-**inspired** 3D voxel sandbox: dig, build, craft, fight, climb a boss ladder toward Moon Lord.

This is **not** “75–85% of Terraria.” Honest assessment: **[~15% overall vs full Terraria](./docs/PARITY.md)** — playable spine, thin content, many systems are light versions.

| | |
|--|--|
| **Version** | **5.1.x** |
| **Platform** | **Windows desktop (Electron)** · web still used for playtest |
| **Stack** | Electron · Vite · Three.js · WebSocket MP · Node ≥ 20 |
| **Gate** | `npm run verify` · `npm run playtest` |
| **Parity (honest)** | [docs/PARITY.md](./docs/PARITY.md) · [CHANGELOG](./CHANGELOG.md) |

## Play (desktop)

```bash
npm install
npm run desktop
```

That builds the game and opens the **TerraBlock** window (not a browser tab).

### Desktop hot-reload (dev)

```bash
npm run desktop:dev
```

Starts Vite + Electron together. F11 toggles fullscreen.

### Pack Windows installer / portable

```bash
npm run desktop:pack
```

Outputs under `release/`:

- `TerraBlock-*-setup.exe` (NSIS installer)
- `TerraBlock-*-portable.exe` (no install)

## Browser (optional / playtest only)

```bash
npm run dev          # Vite at http://127.0.0.1:5173
npm run playtest     # Playwright smoke
```

## Multiplayer

```bash
npm run mp-server
# Desktop: New World, then connect via ?mp= is URL-based —
# for desktop multiplayer run mp-server and set Multiplayer in a future settings path,
# or launch with desktop:dev and open with query in loadURL.
```

Relay: `ws://127.0.0.1:8787`

## Controls

| Key | Action |
|-----|--------|
| WASD · Space · Shift | Move · jump · sprint |
| Mouse · LMB · RMB | Look · mine/attack · place |
| 1–9 · E · G | Hotbar · inventory · equip |
| F | Use / fish / summon |
| R · V | Grapple · mount |
| T · J · N | NPC · journal · bestiary |
| Y · P | Reforge · piggy deposit |
| Esc | Pause / save menu |
| **F11** | **Fullscreen (desktop)** |

## What’s in the box

- **18 bosses** with craftable summons  
- **5 invasions** (Goblins, Eclipse, Pirates, Frost, Martians)  
- Armor, **accessories**, **prefixes**, potions, fishing, bombs  
- **Mounts** & **minion** summons  
- **NPCs** + shops + housing  
- **Minimap**, bestiary, achievements  
- **Save/continue** with migration from older slots  
- **Victory** when Moon Lord falls  
- **Desktop app** window (Electron) with packaged installers  

## Quality

```bash
npm run verify   # lint + tests + build
npm run desktop  # launch native window
```

## License

MIT — fan-inspired sandbox; **not** affiliated with Re-Logic or Terraria.
