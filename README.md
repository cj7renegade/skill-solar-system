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

### Computing foundation edition

`authoring/computing/` holds an authored Computing strand for robotics learners: 104 original skills with summaries, one or two paragraphs each, icons, and 268 relationships with a rationale for each. It covers:
- programming foundations and development practice;
- data structures and algorithms;
- computer architecture and systems programming;
- networking;
- embedded and real-time computing;
- robotics software;
- machine-learning foundations.

The edition also records a coverage checklist and a register of the public curricula and official documentation used to check coverage and accuracy (CS2023, the Python documentation, MIT OpenCourseWare, OSTEP, IETF RFCs, FreeRTOS, ROS 2, and others). The references are kept apart from the authored text; no source text was copied, and the prerequisites are editorial judgments, not an official curriculum graph. The edition is a coherent foundation, not exhaustive coverage.

It connects to existing Mathematics, Electronics, and Robotics skills by their ids (for example binary representation, Boolean algebra, algorithm growth rates, and digital logic) without reclassifying them.

To add it to a local master atlas (back the atlas up first):

```sh
node authoring/apply-computing.mjs path/to/Skill-Solar-System.json           # dry run: report only
node authoring/apply-computing.mjs path/to/Skill-Solar-System.json --write   # write the master and the sub-map
```

The tool:
- keeps every existing skill, coordinate, pin, level, and proficiency answer exactly as it was;
- places the new skills in the Computing ribbon of the spiral at 1 + 3 × prerequisite depth;
- writes `03-Computing-with-prerequisites.json` beside the master, holding every Computing skill and its full prerequisite closure with the same ids, so proficiency is shared with the master;
- writes atomically and is safe to rerun.

It never adds personal maps to the repository.

### DC Circuits batch 01

`authoring/dc-circuits/` holds a supplied content package and the tool that integrates it: 26 narrower Electronics abilities across DC interpretation, resistance, networks, dividers, power, measurement, and diagnosis, with 84 connections (53 prerequisite, 5 supports, 26 related) and 19 public references. The package is an authoring batch, not a map: it carries no coordinates, levels, or answers, and it cannot be opened with **Open map**.

The nine broader skills it overlaps (`e-schematic`, `e-current`, `e-voltage`, `e-resistance`, `e-series`, `e-parallel`, `e-divider`, `e-power`, `e-multimeter`) are kept exactly as they are. Each overlap is recorded as a **related** link: it carries no learning order and never transfers an answer, so a Yes on an overview does not mark the narrower skills. Node totals therefore count spheres, not independent competencies.

To add it to a local master atlas (back the atlas up first):

```sh
python authoring/dc-circuits/validate_batch.py path/to/Skill-Solar-System.json   # read-only pre-integration check
node authoring/apply-dc-circuits.mjs path/to/Skill-Solar-System.json             # dry run: report only
node authoring/apply-dc-circuits.mjs path/to/Skill-Solar-System.json --write     # write the master and the sub-map
```

The tool:
- keeps every existing skill, coordinate, level, pin, and answer exactly as it was, and adds no answers;
- derives levels from recorded prerequisite depth, never below a skill's prerequisites;
- places new skills in the Electronics ribbon in rows beyond those each level already uses, so nothing existing moves;
- ignores the batch's authoring-only `layoutRequest` and records sources under a `dcCircuitsExpansion` namespace;
- writes `DC-Circuits-with-prerequisites.json` beside the master, holding the 26 skills and their full prerequisite ancestry with the same ids, so proficiency is shared with the master;
- writes atomically and is safe to rerun: a second run changes nothing and keeps answers recorded in between.

The supplied validator is read-only and refuses a batch that is already applied, which is its documented way of saying "reconcile, do not reapply". On Windows, run it as `python -X utf8 …`: it reads files with the locale codec, and the master contains UTF-8 characters.

### Physics Foundations batch 01

`authoring/physics-foundations/` holds a supplied content package and the tool that integrates it: 19 narrower Physics abilities across motion interpretation, motion graphs, motion models, free-fall interpretation, force interpretation, force models, and force equations, with 61 connections (38 prerequisite, 4 supports, 19 related) and 12 public references. Like the DC package, it is an authoring batch, not a map: it carries no coordinates, levels, or answers, and it cannot be opened with **Open map**.

It reuses 28 skills the atlas already has instead of restating them: eight mathematics skills (`m-sign`, `m-ratio`, `m-slope`, `m-add`, `m-multiply`, `m-power`, `m-equation`, `m-inequality`) and twenty existing Physics skills, among them `px-distance`, `px-velocity-secant`, `px-fbd-isolate`, and `px-thirdlaw-pairs`. The eleven broader skills it overlaps (`p-position`, `p-accel`, `p-motiongraph`, `p-constantacc`, `p-freefall`, `p-weight`, `p-coupled`, `p-inertia`, `p-fbd`, `p-newton`, `p-thirdlaw`) are kept exactly as they are, and each overlap is recorded as a **related** link carrying no learning order, so a Yes on an overview never marks the narrower skills. Three of those overviews (`p-fbd`, `p-freefall`, `p-inertia`) are also a genuine **prerequisite** of the single narrower ability they lead to; the batch records both links deliberately, and neither transfers an answer.

To add it to a local master atlas (back the atlas up first):

```sh
python authoring/physics-foundations/validate_batch.py path/to/Skill-Solar-System.json   # read-only pre-integration check
node authoring/apply-physics-foundations.mjs path/to/Skill-Solar-System.json             # dry run: report only
node authoring/apply-physics-foundations.mjs path/to/Skill-Solar-System.json --write     # write the master and the sub-map
```

Both batches share one integration (`authoring/batch.mjs`), so this tool behaves exactly like the DC one: it keeps every existing skill, coordinate, level, pin, and answer as it was and adds no answers; derives levels from recorded prerequisite depth, never below a skill's prerequisites; places new skills in the Physics ribbon in rows beyond those each level already uses; ignores the authoring-only `layoutRequest`; writes `Physics-Foundations-Batch-01-with-prerequisites.json` beside the master; and is safe to rerun. Its sources go under a `physicsFoundationsExpansion` namespace, kept separate from the older `physicsExpansion` record that describes the original Physics strand.

### Material Behavior batch 01

`authoring/material-behavior/` holds a supplied content package and the tool that integrates it: 10 narrower Mechanics abilities in a new **Material behavior and tensile testing** subdomain — engineering stress and strain, Young's modulus from a stated interval, axial stiffness, elastic versus linear response, 0.2 percent offset proof stress, residual strain, ultimate tensile strength, nominal versus current-area stress, and reading property tables — with 32 connections (21 prerequisite, 9 related, 2 supports) and 5 public references. Like the others it is an authoring batch, not a map: it carries no coordinates, levels, or answers, and it cannot be opened with **Open map**.

Materials live in the Mechanics domain in this atlas, which already carries broad stress, strain, elasticity, plasticity, tensile-test, axial-deformation and selection topics. Those seven overviews (`s-stress`, `s-strain`, `s-elastic`, `s-plastic`, `s-tensile`, `s-axial`, `s-select`) are kept exactly as they are; nine of the ten new skills record their scope overlap as a **related** link that carries no learning order and never transfers an answer, and the tenth reaches its topic through prerequisites instead. It reuses 13 skills the atlas already has rather than restating them.

To add it to a local master atlas (back the atlas up first):

```sh
python authoring/material-behavior/validate_batch.py path/to/Skill-Solar-System.json   # read-only pre-integration check
node authoring/apply-material-behavior.mjs path/to/Skill-Solar-System.json             # dry run: report only
node authoring/apply-material-behavior.mjs path/to/Skill-Solar-System.json --write     # write the master and the sub-map
```

It shares the same integration (`authoring/batch.mjs`) as the DC and Physics batches, so it keeps every existing skill, coordinate, level, pin, and answer as it was and adds no answers; derives levels from recorded prerequisite depth; places new skills in the Mechanics ribbon in rows beyond those each level already uses; ignores the authoring-only `layoutRequest`; is safe to rerun; and writes `Material-Behavior-Batch-01-with-prerequisites.json` beside the master, holding the 10 skills and their full prerequisite ancestry (41 skills, 71 connections). Its sources go under a `materialBehaviorExpansion` namespace, separate from every earlier expansion record.

### Mechanics Statics batch 01

`authoring/mechanics-statics/` holds a supplied content package and the tool that integrates it: 11 narrower Mechanics abilities in a new **Planar statics and load transfer** subdomain — support reaction models, couples, equivalent force-and-couple relocation, pin-and-roller and cantilever reactions, a residual audit of a proposed solution, restraint-geometry and indeterminacy checks, two-force members, joint force transfer, and internal resultants at one beam cut — with 36 connections (22 prerequisite, 11 related, 3 supports) and 9 public references. Like the others it is an authoring batch, not a map: it carries no coordinates, levels, or answers, and it cannot be opened with **Open map**.

It reuses 10 skills the atlas already has rather than restating them, including `px-torque-sign` for signed torque, `p-equilibrium` for general force and moment balance, `px-fbd-isolate` for system boundaries, `px-thirdlaw-pairs` for interaction pairs, and `s-beamforces` for complete beam diagrams. Each new skill records its scope overlap with the topic it develops (`s-load`, `p-torque`, or `s-beamforces`) as a single **related** link that carries no learning order and never transfers an answer, and three **supports** links point back at existing skills without changing their prerequisites.

To add it to a local master atlas (back the atlas up first):

```sh
python authoring/mechanics-statics/validate_batch.py path/to/Skill-Solar-System.json   # read-only pre-integration check
node authoring/apply-mechanics-statics.mjs path/to/Skill-Solar-System.json             # dry run: report only
node authoring/apply-mechanics-statics.mjs path/to/Skill-Solar-System.json --write     # write the master and the sub-map
```

It shares the same integration (`authoring/batch.mjs`) as the DC, Physics, and Material Behavior batches, so it keeps every existing skill, coordinate, level, pin, and answer as it was and adds no answers; derives levels from recorded prerequisite depth; places new skills in the Mechanics ribbon in rows beyond those each level already uses; ignores the authoring-only `layoutRequest`; is safe to rerun; and writes `Mechanics-Statics-Batch-01-with-prerequisites.json` beside the master, holding the 11 skills and their full prerequisite ancestry (47 skills, 79 connections). Its sources go under a `mechanicsStaticsExpansion` namespace, separate from every earlier expansion record.

### Robotics Foundations batch 01

`authoring/robotics-foundations/` holds a supplied content package and the tool that integrates it: 17 narrower Robotics abilities in a new **Frames and kinematics foundations** subdomain — frame labelling, rotation matrices from axes, proper-rotation checks, point versus free-displacement conversion, transform composition and inversion, serial-chain coordinate counting, joint conventions, task versus joint space, planar forward kinematics, fixed tool offsets, geometric reach, both regular inverse branches, candidate verification, the position Jacobian, joint-to-tip velocity, and singular directions — with 47 connections (27 prerequisite, 17 related, 3 supports) and 10 public references. Like the others it is an authoring batch, not a map: it carries no coordinates, levels, or answers, and it cannot be opened with **Open map**.

It reuses 19 skills the atlas already has, mostly mathematics prerequisites (`m-vector`, `m-matrix`, `m-radian`, `m-unitcircle`, `m-invtrig`, `m-norm`, `m-partial`, `m-transdiff`). The eight broad robotics topics it develops (`r-frame`, `r-rigid`, `r-dof`, `r-configuration`, `r-forward`, `r-inverse`, `r-jacobian`, `r-singular`) are kept exactly as they are, and **every** new skill records its scope overlap as a single **related** link that carries no learning order and never transfers an answer. Three **supports** links point back at `r-planning`, `r-trajectory`, and `c-transforms` without changing their prerequisites.

This package ships two checks. `validate_batch.py` is the usual read-only pre-integration check; `check_examples.py` independently verifies the authored equations — known forward poses, both regular inverse branches, central-difference agreement with the Jacobian, the determinant identity, and a rigid-transform round trip.

```sh
python authoring/robotics-foundations/validate_batch.py path/to/Skill-Solar-System.json   # read-only pre-integration check
python authoring/robotics-foundations/check_examples.py                                   # equation spot checks, no app dependencies
node authoring/apply-robotics-foundations.mjs path/to/Skill-Solar-System.json             # dry run: report only
node authoring/apply-robotics-foundations.mjs path/to/Skill-Solar-System.json --write     # write the master and the sub-map
```

It shares the same integration (`authoring/batch.mjs`) as the other batches, so it keeps every existing skill, coordinate, level, pin, and answer as it was and adds no answers; derives levels from recorded prerequisite depth; places new skills in the Robotics ribbon in rows beyond those each level already uses; ignores the authoring-only `layoutRequest`; is safe to rerun; and writes `Robotics-Foundations-Batch-01-with-prerequisites.json` beside the master (61 skills, 96 connections). Its sources and frame conventions — right-handed frames, column vectors, `T_AB` mapping B into A, the second joint angle relative to link 1, radians — go under a `roboticsFoundationsExpansion` namespace, separate from every earlier expansion record.

### Coverage roadmap

`coverage-inventory/COVERAGE-ROADMAP.md` is the planning document behind these batches. It inventories all six domains with verified anchor ids and candidate outcomes to review, then sets a six-wave expansion sequence: robotics frames and kinematics first, then actuation and transmissions, trajectories and feedback, sensing and estimation, localization and planning, and finally the supporting physics, electronics, materials and computing branches that dependency reviews expose.

It is an editorial plan, not a completeness claim. Node counts measure spheres, not independent competencies, and no branch is marked complete; the document is explicit that there is no fixed batch size and no equal-count target across subjects. It also sets out what a finished branch review requires: explicit scope and exclusions, every candidate outcome mapped to an existing skill, a justified new skill or a stated deferral, two descriptive paragraphs with a self-reflection criterion and sources, prerequisites justified by meaning rather than name, and no overview answer propagated into a narrower skill.

## Features

**3D view**
- Spheres are colored by domain: Mathematics, Physics, Mechanics, Electronics, Computing, Robotics.
- Connection styles: gold for prerequisite, dashed for supports, violet for related.
- Navigation:
  - Drag to orbit. Clicking a sphere (or choosing it in the list) makes it the orbit centre: the view turns to it smoothly, and it stays the centre while you orbit and zoom in, until you pan or click empty space.
  - Scroll to zoom. Near the orbit limit, scrolling keeps travelling forward instead of stopping.
  - Right-drag, arrow keys, or WASD to pan. Held keys move smoothly and stop when released.
- Wheel travel and right-drag panning scale with the distance to the nearest sphere ahead, bounded by the map's typical spacing and overall size, so close inspection stays precise without getting stuck.
- **Held-key panning keeps one rate at any zoom:** arrow keys and WASD cross the same map distance every second, measured in sphere spacings, so travelling between skills takes the same time zoomed in as at overview. Very close up, where that rate would sweep several screen widths a second, it is capped in proportion to the nearest sphere ahead; the cap only slows it, and never back to the old close-range crawl.
- **Fit map** and **Front view** reset the camera.
- **Floor grid:** the ground grid steps its spacing up as the camera pulls back, so cells keep a usable size and the floor stays visible at any distance instead of fading out. The finer subdivision fades in as you come closer, and only the horizon fades.
- Toggles: nameplate labels, selected-connections-only, and proficiency coloring.
- **Proficiency colouring** shows two states: skills marked **Yes** are green (`#32CD32`), and every other skill is red, including skills you have not answered yet. The stored answer is still Yes, No, or unmarked; only the colour groups them, and the console and the guided review still treat unanswered skills separately. The answer is not repeated as text: nameplates show just the skill name, and the console shows it through the pressed Yes, No, or Clear button.
- **Proficiency pulse:** skills marked **Yes** pulse, about once every 1.4 seconds. The colour travels from green (`#32CD32`) to a pale tea green (`#DBF3C9`) and back, with a small added glow rising and falling in step, so colour and brightness always move together. The glow is deliberately gentle: the pale end of the pulse is already near full brightness, and a stronger glow would clip it to white. Every other skill stays steady red. The pulse is a glow on the sphere, not a halo, it changes no map data, and it holds a steady mid-pulse colour when the system asks for reduced motion.
- **Subject highlighting:** click a subject in the legend to put a halo in that subject's colour around every skill in it. A fixed-size ring keeps highlights visible at overview distance.
  - Several subjects can be highlighted at once; click again to remove one, or use **Clear highlights**.
  - Matching uses each skill's own domain, so a physics prerequisite inside a mathematics map counts as Physics.
  - Highlights are display only: they never select a skill, move the camera, or change the map.
- A sphere-spacing slider (0.5×–10×) spreads the display without changing saved coordinates.
- **Find skill:** a search box in the map tools. Type part of a name to see up to eight matches, with names that begin with what you typed listed first. Enter or a click selects the skill and moves the view to it; the arrow keys walk the list and Escape closes it. It keeps working when the console is hidden.
- **Collapsible map tools:** the toolbar folds away to a **Tools** handle, and its state is remembered between sessions.
- Click to select a subject; double-click to open its details.

**Data console**
- Searchable subject list and an inspector.
- The subject card collapses to its name and icon with the ▾ toggle beside it, stays collapsed as you select other subjects, and is remembered between sessions.
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
- the proficiency pulse: which skills pulse, and the shape, range, and repetition of the glow;
- the Find skill matcher: blank queries, substring matching, prefix-first ranking, and the result cap;
- the floor grid spacing: level steps, cells that never collapse below a few pixels, and the subdivision blend;
- the shared proficiency record: precedence rules, Undo/Redo, family isolation, import, and the on-disk store;
- the Computing edition:
  - unique, stable, namespaced ids;
  - valid, typed, unique relationships, each with its own rationale, and no prerequisite cycles;
  - no other-domain prerequisites for elementary programming;
  - checklist coverage and description rules;
  - a merge that preserves existing skills, pins, levels, and proficiency;
  - sub-map closure, and answers shared between the sub-map and the master;
- the supplied content batches (DC Circuits, Physics Foundations, Material Behavior, Mechanics Statics, and Robotics Foundations): batch completeness and two-paragraph descriptions, scope overlap recorded as related links, a merge that changes nothing existing, unmarked initialization, refusal of name clashes and unresolved references, idempotent reruns, and sub-map closure and family identity;
- atomic saving;
- spacing, nameplates, and click/keyboard interaction.

`npm run test:e2e` launches the real app, including the WebGL viewer and the desktop save path, in an isolated profile with its own shared record. It uses generated test maps and drives the app with real mouse and keyboard events over the Chrome DevTools Protocol, covering:
- the proficiency review;
- camera orbiting;
- the held-key pan rate, measured as the map distance covered per second at different zooms;
- subject highlighting;
- shared proficiency;
- the proficiency pulse, measured as sphere brightness over a full pulse period;
- the Find skill box, and collapsing the map tools and the subject card;
- the floor grid, measured from screenshots as the camera pulls back.

It needs a desktop session and a prior `npm run build`.

Optional local maps:
- Set `SSS_ATLAS=<path to a map>` to also open a large local map.
- Add `SSS_SUBMAP=<path to one of its sub-maps>` to repeat the Yes/No/Clear round trip between them and to run `tests/atlas-e2e.mjs`. With the master and its Computing sub-map, that test checks:
  - the Computing legend and highlight;
  - a skill card;
  - guided review;
  - map switching.
- Add `SSS_DC_SUBMAP=<path>`, `SSS_PHYS_SUBMAP=<path>`, `SSS_MAT_SUBMAP=<path>`, `SSS_STATICS_SUBMAP=<path>`, and `SSS_ROB_SUBMAP=<path>` to run `tests/dc-atlas-e2e.mjs`, `tests/physics-atlas-e2e.mjs`, `tests/material-atlas-e2e.mjs`, `tests/statics-atlas-e2e.mjs`, and `tests/robotics-atlas-e2e.mjs`. With the master and the matching batch sub-map, each checks the subject legend and highlight, **Find skill** reaching the new branch, a skill card with both authored paragraphs, the guided-review count, marking a narrower skill without disturbing its overview answer, that the batches integrated earlier are still intact, and the Yes/Clear round trip to the sub-map and back.
- Set `SSS_SHOTS=<folder>` to keep that test's screenshots.
- For `npm test`, `SSS_ATLAS`, `SSS_SUBMAP`, `SSS_DC_SUBMAP`, `SSS_PHYS_SUBMAP`, `SSS_MAT_SUBMAP`, `SSS_STATICS_SUBMAP`, `SSS_ROB_SUBMAP`, and `SSS_ATLAS_BACKUP` (the master as it was before the merge being checked) enable a read-only check of the real files.

These maps are copied or opened read-only, and saves go to a temporary folder.

`tests/console-smoke.mjs` is a separate, optional Playwright check of the data console. Playwright is not a project dependency. The check replaces the 3D viewer with a stub, so it does not test WebGL rendering.

## Project structure

```
src/        renderer source (app, Three.js viewer, camera math, map model, layouts, proficiency review, subject highlighting, shared proficiency, starter map)
desktop/    Electron main process, preload bridge, atomic file saving, and the shared proficiency store
authoring/  Computing foundation edition (content, checklist, reference register) and the tool that adds it to a local atlas
scripts/    esbuild bundling script
tests/      Node test suite, Electron end-to-end checks, and optional Playwright smoke check
*.cmd       Windows setup, launch, rebuild, and packaging scripts
```

`dist/` (build output), `release/` (packaged executables), and `node_modules/` are generated and not tracked.

## Project status

Skill Solar System is a personal project in active development at v0.4.0. Current status:

- `npm run build` succeeds.
- `npm test`: all 181 tests pass. Six real-atlas tests are skipped unless `SSS_ATLAS` is set.
- `npm run test:e2e` passes in Electron on Windows:
  - **With generated maps:** 135 checks (review 41, orbit 14, pan rate 6, highlighting and shared proficiency 41, proficiency pulse 14, find and collapse 14, floor grid 5).
  - **With local maps:** 250 checks (review 46, orbit 14, pan rate 6, highlighting and shared proficiency 46, proficiency pulse 14, find and collapse 14, floor grid 5, real atlas 13, DC integration 16, Physics integration 19, Material Behavior integration 19, Mechanics Statics integration 19, Robotics Foundations integration 19). The real-atlas suite reports 14 when the lowest unmarked skill is also in the Computing sub-map.
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
