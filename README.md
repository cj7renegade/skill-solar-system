# Skill Solar System

An offline desktop reference atlas that shows skills as a navigable 3D "solar system". Subjects are spheres; connections show how subjects relate. It is built with [Three.js](https://threejs.org/) for rendering and [Electron](https://www.electronjs.org/) for the desktop shell.

Current version: **0.4.0** (see [UPDATE-v0.4.0.md](UPDATE-v0.4.0.md) for the release notes).

## About the content

Skill levels and prerequisite relationships in Skill Solar System are **authored reference information**. They are editorial judgments recorded in a map. They are not a standardized curriculum, an assessment, or a measure of difficulty.

- **Reference level (1–100)** is a provisional rank derived from recorded prerequisite depth or entered by hand. It controls height in the spiral layout.
- **Connections** come in three types:
  - **prerequisite**: learning order.
  - **supports**: a directional contribution.
  - **related**: no order.
  
  Only prerequisites affect automatic height, and prerequisite cycles are rejected.
- **Proficiency** is a separate, self-reported Yes/No/unmarked field ("at least 80% proficient"). The app does no testing or automatic scoring.

The bundled starter map (`src/starter.js`) is an illustrative 18-subject, 26-connection robotics overview. It is not a validated curriculum and contains no proficiency markings. Larger maps are saved and opened as separate JSON files. They are not part of this repository.

## Features

**3D view**
- Spheres are colored by domain: Mathematics, Physics, Mechanics, Electronics, Computing, Robotics.
- Connection styles: gold for prerequisite, dashed for supports, violet for related.
- Drag to orbit, scroll to zoom, and right-drag, arrow keys, or WASD to pan. **Fit map** and **Front view** reset the camera.
- Toggles: nameplate labels, selected-connections-only, and proficiency coloring.
- A sphere-spacing slider (0.5×–4×) spreads the display without changing saved coordinates.
- Click to select a subject; double-click to open its details.

**Data console**
- Searchable subject list, an inspector, and a details dialog. The dialog shows the description, connections, and an explanation of why the subject sits where it does.
- Edit mode: add, edit, and delete subjects and connections. You can set the reference level, icon, coordinates, and pin state, or Shift-drag spheres to move them. Undo covers up to 50 steps.

**Layouts**
- **Arrange level spiral**: estimates unassigned levels and raises levels to stay above their prerequisites.
- **Recalculate levels + spiral**: replaces all levels with dependency-derived ranks.
- **Arrange by prerequisites**: lays subjects out in domain columns by prerequisite depth.
- **New empty map** and **Restore starter**.
- Pinned subjects keep their positions in every layout.

**Files**
- Maps are saved and opened as version-1 JSON (up to 10 MB, 5,000 subjects, and 20,000 connections). Ctrl+S saves.
- A local draft is cached between sessions. Closing with unsaved changes asks for confirmation.
- Invalid map files are rejected with a message.

**Offline by design**
- The Electron shell blocks all `http`, `https`, `ws`, and `ftp` requests, denies permission requests, and blocks navigation and new windows.
- The renderer runs sandboxed with a strict Content Security Policy.
- The Three.js renderer is bundled locally, so no network is needed after setup.

## Requirements

- Windows (the included `.cmd` scripts target Windows; the npm scripts are cross-platform).
- [Node.js](https://nodejs.org/) LTS with npm. The project was last built with Node.js 24.15.0 and npm 11.12.1.
- Internet access once, to install the pinned dependencies (`three`, `electron`, `electron-builder`, `esbuild`).

## Setup and launch

On Windows:

| Script | Purpose |
| --- | --- |
| `Setup-Windows.cmd` | One-time: `npm install`, then build the offline renderer. Needs internet. |
| `Launch-Windows.cmd` | Start the app (offline). |
| `Rebuild-Windows.cmd` | Rebuild after changing source files. |
| `Build-Portable-Windows.cmd` | Package a portable `.exe` into `release/`. May download packaging tools. |

With npm directly:

```sh
npm install        # install pinned dependencies
npm run build      # bundle src/ into dist/ with esbuild
npm start          # launch Electron
npm run dist:win   # build + package a portable Windows executable into release/
```

## Testing

```sh
npm test
```

This runs the Node test suite (`tests/*.test.mjs`). It covers map validation and normalization, prerequisite depth and cycle rejection, the layouts, reference-level reconciliation, connection visibility, spacing, nameplate projection, camera panning, and click/keyboard interaction.

`tests/console-smoke.mjs` is a separate, optional Playwright check of the data console. Playwright is not a project dependency. The check replaces the 3D viewer with a stub, so it does not test WebGL rendering.

## Project structure

```
src/        renderer source (app, Three.js viewer, map model, layouts, starter map)
desktop/    Electron main process and preload bridge
scripts/    esbuild bundling script
tests/      Node test suite and optional Playwright smoke check
*.cmd       Windows setup, launch, rebuild, and packaging scripts
```

`dist/` (build output), `release/` (packaged executables), and `node_modules/` are generated and not tracked.

## Project status

Skill Solar System is a personal project in active development at v0.4.0. Status as of this repository's setup:

- `npm run build` succeeds.
- `npm test`: all 39 tests pass, including `tests/positions.test.mjs`, which covers the coordinate-precision fix.
- **Not verified during repository setup:**
  - WebGL rendering and interactive behavior inside the Electron window.
  - The optional Playwright smoke check.
  - Portable packaging (`npm run dist:win`).
  - A fresh run of the Windows `.cmd` scripts.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

No license has been selected yet.
