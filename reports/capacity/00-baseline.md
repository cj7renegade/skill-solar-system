# Capacity 00 — Baseline (Task 0)

Measured 2026-09-27 in `C:\Users\hilli\OneDrive\Desktop\Skill Solar System`.

## Repository

| | |
| --- | --- |
| `git fetch origin` | `main` moved `1c96ba5..c5c5e4c` |
| `origin/main` | `c5c5e4c86fa9f52664508f3b1830053beffb3104`: "Merge pull request #16 from cj7renegade/housekeeping-2026-09" |
| Housekeeping merged? | **yes**. `f14c8c3` (the tip of `housekeeping-2026-09`) and `origin/housekeeping-2026-09` are both ancestors of `origin/main` (`git merge-base --is-ancestor` → 0) |
| Working tree before starting | only `M Tasks/TASKS.md` (this queue) |
| Local `main` | fast-forwarded to `c5c5e4c`, the same as `origin/main` |
| Branch | `capacity-stress-test`, created from `main` at `c5c5e4c` |

**How `main` was updated.** `git switch main` refuses while `Tasks/TASKS.md` has local edits that
differ from `main`'s copy (seen last session). So local `main` was fast-forwarded with
`git fetch origin main:main`. Like `git pull --ff-only`, it refuses anything but a forward move.
Then `git switch -c capacity-stress-test main` created the branch, with a check that each step
succeeded before the next.

## Baseline tests

| Command | Result |
| --- | --- |
| `npm run build` | exit 0, "Offline renderer built in dist." |
| `npm test` | exit 0; **207 tests, 201 pass, 0 fail, 6 skipped** (the six `SSS_ATLAS` real-atlas tests) |

## Machine

Frame rates and timings depend on this hardware. Every later number is for this machine only.

| | Measured | Method |
| --- | --- | --- |
| CPU | AMD Ryzen 7 9800X3D, 8 cores / 16 threads, 4.7 GHz max | `Win32_Processor` |
| RAM | 31.2 GB | `Win32_ComputerSystem` |
| GPU used by the app | **NVIDIA GeForce RTX 3090**, via ANGLE on Direct3D 11 | WebGL `UNMASKED_RENDERER_WEBGL`, queried inside the app |
| GPU driver | NVIDIA 32.0.15.9186 (2026-01-19) | `Win32_VideoController` |
| Second GPU | AMD Radeon integrated graphics, driver 32.0.21043.5001, not used by the app | `Win32_VideoController` |
| Display | 1920 × 1080 at **59 Hz**, one screen, scale 1.0 | `Win32_VideoController`, `Screen.AllScreens`, `devicePixelRatio` |
| App window (e2e harness) | 1484 × 921; 3D canvas 1129 × 802 | measured in the page |
| Renderer heap limit | 3,586 MB (`performance.memory.jsHeapSizeLimit`) | measured in the page |
| WebGL | WebGL 2 available; max texture 16,384 | measured in the page |
| OS | Windows 11 Home 10.0.26200, build 26200, 64-bit | `Win32_OperatingSystem` |
| Power plan | Balanced; desktop, no battery | `powercfg`, `Win32_Battery` |
| Node | v24.15.0 | `node --version` |
| Electron | 44.2.0 (Chrome 152.0.7977.76) | `electron/package.json`, user agent |
| three.js | 0.185.1 | `node_modules/three/package.json` |
| esbuild | 0.28.2 | `node_modules/esbuild/package.json` |

**Frame-rate ceiling:** the display refreshes at 59 Hz, and Chromium's animation loop runs in step
with it. **About 60 fps is the most any measurement here can show**, even when the app has time to
spare.

**Isolation:** the e2e harness gives every launch its own profile folder under
`%TEMP%` (`C:\Users\hilli\AppData\Local\Temp\sss-…`). `tests/electron-launcher.cjs` sets Electron's
`userData` there and replaces the save dialog with a fixed path in the same folder. The real
`%APPDATA%\skill-solar-system\` is never used.

## Scratch folder

| | |
| --- | --- |
| Path | `C:\sss-scratch\stress\` (created) |
| Inside OneDrive? | **no**: it does not start with `%OneDrive%` = `C:\Users\hilli\OneDrive`, and it has no OneDrive reparse attribute |
| Inside the repo? | no |
| Free space on C: | 345 GB |

## Outcome

No STOP condition. Task 0 complete.
