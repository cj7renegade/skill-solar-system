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
- Navigation:
  - Drag to orbit. Clicking a sphere (or choosing it in the list) makes it the orbit centre: the view turns to it smoothly, and it stays the centre while you orbit and zoom in, until you pan or click empty space.
  - Scroll to zoom. Near the orbit limit, scrolling keeps travelling forward instead of stopping.
  - Right-drag, arrow keys, or WASD to pan. Held keys move smoothly and stop when released.
- Movement speed scales with the distance to the nearest sphere ahead, bounded by the map's typical spacing and overall size, so close inspection stays precise without getting stuck.
- **Fit map** and **Front view** reset the camera.
- Toggles: nameplate labels, selected-connections-only, and proficiency coloring.
- **Subject highlighting:** click a subject in the legend to put a halo in that subject's colour around every skill in it. A fixed-size ring keeps highlights visible at overview distance.
  - Several subjects can be highlighted at once; click again to remove one, or use **Clear highlights**.
  - Matching uses each skill's own domain, so a physics prerequisite inside a mathematics map counts as Physics.
  - Highlights are display only: they never select a skill, move the camera, or change the map.
- A sphere-spacing slider (0.5×–4×) spreads the display without changing saved coordinates.
- Click to select a subject; double-click to open its details.

**Data console**
- Searchable subject list and an inspector.
- A details card with:
  - the subject's one or two description paragraphs;
  - a short "Where it sits" summary built from its actual connections;
  - a collapsible connection list.
- Edit mode:
  - Add, edit, and delete subjects and connections.
  - Set the reference level, icon, coordinates, and pin state, or Shift-drag spheres to move them.
  - Coordinates, layout details, and placement notes appear here.
  - Undo and Redo cover up to 50 steps.

**Proficiency review**
- **Mark proficiency** opens a guided review. It asks, one skill at a time from the bottom of the map upward (by saved height, then name), whether you have at least 80% proficiency.
- Choose **Continue unmarked skills**, **Review all skills**, or **Resume review**.
- Only the **Yes** and **No** buttons record an answer. **Back**, **Skip**, and **Pause** never change answers.
- Skipped skills can be reviewed at the end.
- Answers are stored in each subject's proficiency field and are kept in the local draft until you use **Save map**.

**Shared proficiency**
- Maps in the same *atlas family* share your proficiency answers on this computer. Answer a skill in a sub-map and the master atlas shows the same answer when you open it, and the other way round.
  - Only proficiency is shared; descriptions, positions, levels, connections, and pins are never synchronized.
- **Atlas family:** a map's family is `metadata.atlasFamily`. Atlas files made before that field existed are recognized by their `metadata.datasetId` (`sss-robotics-foundations-2026-09`). Maps without a family keep their answers to themselves, even if they reuse skill ids.
- **Where answers live:** the shared record is a file per family in the app's user-data folder (`%APPDATA%\skill-solar-system\proficiency\` on Windows), outside every map file. It stores Yes, No, or an explicit Clear for each skill.
- **Which answer wins:**
  - Shared answers take precedence over answers saved inside older map files. A Clear also overrides an old Yes.
  - A map's own Yes or No is added only for skills the shared record has no answer for.
  - Unmarked skills in a map never erase a shared answer.
- **Opening and saving:** opening a map applies shared answers first, then reports how many changed. Such a map is marked as a local draft until you **Save map**. Files you have not opened are never rewritten.
- **Shared proficiency panel** (in the console):
  - **Export record** and **Import record**, for backup or moving to another computer. Imported answers replace shared answers for the same skills; others are kept.
  - **Use this file's answers instead…**, which deliberately replaces the shared answers with those saved in the map file you opened, after confirmation.
- **Footer indicator:** shows whether shared answers were saved. **Retry** appears if a write failed or the record could not be read.

**Layouts**
- **Arrange level spiral**: estimates unassigned levels and raises levels to stay above their prerequisites.
- **Recalculate levels + spiral**: replaces all levels with dependency-derived ranks.
- **Arrange by prerequisites**: lays subjects out in domain columns by prerequisite depth.
- **New empty map** and **Restore starter**.
- Pinned subjects keep their positions in every layout.

**Files**
- Maps are saved and opened as version-1 JSON (up to 10 MB, 5,000 subjects, and 20,000 connections). Ctrl+S saves.
- Saves are atomic: the file is written in full to a temporary copy and then swapped into place, so an interrupted save leaves the previous file intact.
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
| `Rebuild-Windows.cmd` | Rebuild after changing source files or updating the code. |
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
npm test           # Node test suite (tests/*.test.mjs)
npm run build
npm run test:e2e   # end-to-end checks in the real Electron app
```

`npm test` covers:
- map validation and normalization;
- prerequisite depth and cycle rejection;
- the layouts and reference-level reconciliation;
- placement summaries;
- the camera speed policy and wheel handling;
- the proficiency review order and session logic;
- subject highlighting;
- the shared proficiency record: precedence rules, Undo/Redo, family isolation, import, and the on-disk store;
- atomic saving;
- spacing, nameplates, and click/keyboard interaction.

`npm run test:e2e` launches the real app, including the WebGL viewer and the desktop save path, in an isolated profile with its own shared record. It drives the proficiency review, camera orbiting, subject highlighting, and shared proficiency with real mouse and keyboard events over the Chrome DevTools Protocol, using generated test maps. It needs a desktop session and a prior `npm run build`.

Optional larger maps:
- Set `SSS_ATLAS=<path to a map>` to also open a large local map.
- Add `SSS_SUBMAP=<path to one of its sub-maps>` to repeat the Yes/No/Clear round trip between them.

These maps are copied or opened read-only, and saves go to a temporary folder.

`tests/console-smoke.mjs` is a separate, optional Playwright check of the data console. Playwright is not a project dependency. The check replaces the 3D viewer with a stub, so it does not test WebGL rendering.

## Project structure

```
src/        renderer source (app, Three.js viewer, camera math, map model, layouts, proficiency review, subject highlighting, shared proficiency, starter map)
desktop/    Electron main process, preload bridge, atomic file saving, and the shared proficiency store
scripts/    esbuild bundling script
tests/      Node test suite, Electron end-to-end checks, and optional Playwright smoke check
*.cmd       Windows setup, launch, rebuild, and packaging scripts
```

`dist/` (build output), `release/` (packaged executables), and `node_modules/` are generated and not tracked.

## Project status

Skill Solar System is a personal project in active development at v0.4.0. Current status:

- `npm run build` succeeds.
- `npm test`: all 85 tests pass.
- `npm run test:e2e`: all 106 end-to-end checks pass in Electron on Windows (review 46, orbit 14, highlighting and shared proficiency 46).
- **Not yet verified:**
  - A screen reader.
  - A physical trackpad or touch input. The automated checks use synthetic input events.
  - Portable packaging (`npm run dist:win`).
  - Two app windows open at once: the last window to save the shared record wins for answers changed in both.
  - A fresh run of the Windows `.cmd` scripts on a new machine.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

No license has been selected yet.
