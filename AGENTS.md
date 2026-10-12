# AGENTS — TerraBlock project entry

**Status:** Level 4 project instructions  
**Canonical Constitution:** https://github.com/MrWizard94-Compile/Agents-Constitution  
**Accepted source commit:** `5d5aa0c79a9bcad095f58ebe315bf44adc94fbff`

The GitHub repository above is the sole editable source of WPAI Constitution
law. This file supplies TerraBlock-specific context; it is not a copy of that
law. For this project, load `SKILL.md`, `AGENTS.md`, `SOP.md`,
`references/always-load.md`, and applicable `law/*` modules from the same
verified accepted commit. A generated local mirror may be used only when its
manifest matches that commit. If the pinned source cannot be verified, report
the gap rather than substituting an adjacent directory or retired SOUL file.

## TerraBlock mission and acceptance

- Build and maintain a Windows desktop, Terraria-inspired 3D voxel sandbox.
  The Electron app is the product; the browser is a development/playtest
  surface. Preserve user worlds and saves across changes.
- Use the stack and exact versions declared by `package.json` and
  `package-lock.json`; Node.js must satisfy `>=20`.
- Run `npm run verify` for zero-warning lint, unit tests, a production build,
  and the automated browser smoke playtest. Do not set `SKIP_PLAYTEST=1` for
  delivery acceptance. Exercise the desktop app separately when desktop
  runtime or packaging behavior changes.
- Maintain honest feature/parity claims in `README.md` and `docs/PARITY.md`.
  Product decisions and historical context remain in this repository.

CI checks out the exact Constitution commit above, validates its source and
tests, and audits this project for active retired-pack consumers. Advance the
pin only to another accepted, verified canonical commit in the same change.

Historical recovery (not active law): `git show e3e2e825f71fa3fdac4d7d3194a6fdbb5920358e:SOUL.md`
