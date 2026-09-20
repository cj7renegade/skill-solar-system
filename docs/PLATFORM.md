# Skill Solar System — platform documentation

Written for the owner of this project: someone who designed the system and knows why it exists, but
who is still learning to read code. Every programming term is defined the first time it appears.
Every claim about how the system is built cites the file it came from, and where a file could not
settle a question, this document says so instead of guessing.

**Written against commit `7c95db636812ed0109cc25e275ac15f458341f70`**, with one important caveat:
the working tree also contains **uncommitted Edition 06 work** that was in progress while this was
written. See [§9.4](#94-uncommitted-work-in-the-tree-at-the-time-of-writing) — it is described, not
touched.

Contents:
[1 Purpose](#1-purpose) ·
[2 Repository map](#2-repository-map) ·
[3 Application architecture](#3-application-architecture) ·
[4 Data model](#4-data-model) ·
[5 Identity and persistence](#5-identity-and-persistence) ·
[6 Content pipeline](#6-content-pipeline) ·
[7 Proficiency and review](#7-proficiency-and-review) ·
[8 Testing and verification](#8-testing-and-verification) ·
[9 Current state](#9-current-state) ·
[10 Known limitations](#10-known-limitations-and-open-structural-questions) ·
[11 How-to recipes](#11-how-to-recipes) ·
[Things I could not determine](#things-i-could-not-determine)

---

## 1. Purpose

### What the Skill Solar System is

A desktop program that shows a body of knowledge as a three-dimensional map. Each skill is a sphere.
Lines between spheres record which skills come before which. You fly a camera through it, click a
sphere to read about that subject, and mark for yourself whether you can do it.

It runs entirely offline. `desktop/main.cjs` actively blocks network requests — it cancels every
`http`, `https`, `ws`, `wss` and `ftp` request the window tries to make, and denies every permission
request the page asks for. Nothing you record leaves the machine.

The map is a *reference structure*, not a course and not a test. Two rules are repeated throughout
the code, and both are enforced rather than merely stated:

- **Height is not difficulty and not mastery.** `src/model.js` calls the vertical axis a
  *reference level*, described in `src/vortex.js` as "recorded dependency structure, not personal
  mastery", and the map file itself carries that sentence in its `layout.levelMeaning` field.
- **Only you decide what you know.** Nothing in the program ever marks a skill on your behalf. §7
  goes through exactly what is and is not capable of writing an answer.

### What the Robotics V3 curriculum is within it

The Skill Solar System can hold any number of maps. One of them — `Maps/Robotics-v3/` — is a
dedicated, deliberately separate map holding a reviewed robotics curriculum: **381 entries** joined
by **894 connections**, aimed at building and verifying a working robot.

It is kept apart from your main Skill Solar System map on purpose. They declare different *atlas
families* (§5), which is the mechanism that stops an answer in one map from ever appearing in the
other.

### The design rules the system enforces

**Foundations first.** A `prerequisite` connection means a strict learning order. `src/model.js`
refuses to load a map whose prerequisite links form a loop — if A must come before B, and B before
C, and C before A, the file is rejected with "Prerequisite cycle detected". Softer relationships
have their own link types so they cannot silently create such a loop.

**Hierarchy before lessons.** The shape of the curriculum was fixed first, in a reviewed
specification (`packages/robotics-curriculum-v3/Robotics-Reviewed-Specification.json`), and turned
into a map by `authoring/robotics-v3/build-preview.mjs` with **no lesson text at all** — every entry
initially said "LESSON NOT YET AUTHORED". Lessons were written afterwards, against that fixed
structure. The importer in `authoring/robotics-v3/lessons.mjs` re-checks, for every single lesson,
that the entry's name, prerequisites and demonstration requirement still match the specification
before it will attach any text.

**Expansion by milestone chains.** Content is not written in whatever order feels natural. Each
edition takes one milestone and authors every entry that milestone depends on, to the bottom:

| | Milestone | Chain size |
| --- | --- | --- |
| I01 | Integrate and verify a controlled joint | 185 entries |
| I02 | Integrate and verify a robot arm | 249 |
| I03 | Integrate and verify an autonomous wheeled robot | 241 |
| I04 | Integrate a perception-guided mobile manipulator | 291 |
| I05 | Verify a repeatable robotic work system | 298 |

(Chain sizes are counts of the transitive prerequisite closure including the milestone itself,
computed from the map's own edges; see §9.)

**Lesson availability never implies proficiency.** Two separate fields carry two separate facts.
`contentStatus` says whether a card has been written. `proficiency80` says whether *you* said you
can do it. The map's own `metadata.contentStatusPolicy` states it: *"An authored lesson is not an
answer, and opening a card, revealing an answer or finishing an exercise never marks a skill."*

**Introductory coverage is not a full course.** Every authored entry also carries
`lessonStatus: "introductory lesson available; extended lesson and further practice authoring
pending"` — set by `authoring/robotics-v3/lessons.mjs`. The card shows that second line beneath the
first (`src/lesson.js`, `contentPendingLine`).

**Synthetic exercises are not physical demonstration.** Each edition ships a Python "lab" that runs
numerical exercises. None is wired to the application, and `src/lesson.js` puts a standing sentence
on every card: *"A simulated or calculated result is supporting evidence, not a record of physical
work."* Where an entry's own demonstration still needs real hardware, the card says so — see §3.5
for how that is detected.

---

## 2. Repository map

> **Term: repository.** The folder holding the project, tracked by Git — a tool that records a
> history of every change so any earlier version can be recovered.

The single most important distinction in this tree is between **supplied source packages** (content
that arrived from outside, never edited) and **generated artifacts** (files a tool produced, which
can be thrown away and rebuilt). Both are excluded from Git by `.gitignore`, so neither is published.

```
Skill Solar System/
├── src/              ← the program's source code (TRACKED)
├── desktop/          ← the Electron shell (TRACKED)
├── dist/             ← GENERATED build output, ignored
├── tests/            ← automated checks (TRACKED)
├── authoring/        ← tools that build and import content (TRACKED)
├── docs/             ← this file (TRACKED)
├── packages/         ← SUPPLIED source packages, ignored
├── Maps/             ← GENERATED map exports + your personal maps, ignored
├── Archive/          ← older versions, ignored
├── coverage-inventory/  ← planning documents (TRACKED)
├── node_modules/     ← downloaded libraries, ignored
├── scripts/build.mjs ← the build step (TRACKED)
└── *.cmd, package.json, README.md  (TRACKED)
```

### 2.1 `src/` — the program itself

Plain JavaScript files, each a *module* (a file that can export pieces for other files to import).

| File | Lines | What it does | Read by |
| --- | ---: | --- | --- |
| `app.js` | 536 | The controller. Wires every button, renders the side panel and the subject card, opens and saves files, and owns the map currently in memory. | the build step |
| `model.js` | 126 | Defines what a valid map is, and rejects invalid ones. Holds `validate`, `normalize`, `levels`, the six domains and their colours. | nearly everything |
| `viewer.js` | 247 | The 3D scene: spheres, connection lines, nameplates, camera, mouse and wheel handling. | `app.js` |
| `review.js` | 179 | The guided review: queue order, session state, and map identity (§5). | `app.js`, `review-dialog.js` |
| `review-dialog.js` | 157 | The review window's screens and buttons. | `app.js` |
| `lesson.js` | 141 | Decides *what* a lesson card shows. Returns plain data, no screen code. | `app.js`, tests |
| `proficiency.js` | 107 | The shared answer record: validation, merging, and the rule that answers are never inferred. | `app.js`, `proficiency-store.js` |
| `prerequisites.js` | 68 | Walks the prerequisite chain behind one skill, for the bulk-marking control. | `app.js`, tests |
| `knowledge.js` | 63 | Offline descriptions for the 18 starter subjects only. | `model.js` |
| `environment.js` | 58 | The floor grid, drawn by the graphics card. | `viewer.js` |
| `vortex.js` | 43 | The spiral layout and reference-level assignment. | `app.js` |
| `icons.js` | 35 | 20-odd hand-written icon shapes. No external images. | `app.js`, `model.js` |
| `pulse.js` | 35 | The glow animation for skills marked Yes. | `viewer.js` |
| `starter.js` | 36 | The 18-subject illustrative map shown on first run. | `app.js` |
| `highlight.js` | 27 | Domain highlighting (display only). | `app.js` |
| `grid.js` | 24 | Grid spacing maths, shared with the graphics shader. | `environment.js` |
| `proficiency-store.js` | 17 | Chooses where answers are saved: disk in Electron, browser storage otherwise. | `app.js` |
| `find.js` | 15 | The "Find skill" search. | `app.js` |
| `interaction.js` | 15 | Arrow-key panning directions; double-click detection. | `app.js`, `viewer.js` |
| `spacing.js` | 12 | Display-only sphere spacing. Never changes stored coordinates. | `app.js`, `viewer.js` |
| `connections.js` | 6 | Which connection lines are visible. | `viewer.js` |
| `nameplates.js` | 9 | Where a floating name sits relative to its sphere. | `viewer.js` |
| `index.html` | — | The page skeleton: header, console panel, and three dialog windows. | the build step |
| `style.css` | — | All appearance. | copied by the build |

### 2.2 `desktop/` — the Electron shell

| File | What it does |
| --- | --- |
| `main.cjs` | Creates the window, blocks all network access, and handles save/load requests from the page. |
| `preload.cjs` | The only bridge between the page and the operating system. Exposes exactly three functions. |
| `save.cjs` | Writes a file atomically (§3.6). |
| `proficiency-store.cjs` | Reads and writes shared answer records on disk. |

### 2.3 `authoring/` — content tools (tracked)

Older content batches each have a folder (`dc-circuits/`, `physics-foundations/`,
`material-behavior/`, `mechanics-statics/`, `robotics-foundations/`, `computing/`) holding a
reviewed copy of their content JSON and a `merge.mjs` that folds it into an atlas.

The robotics v3 work lives in `authoring/robotics-v3/`:

| File | Kind | What it does |
| --- | --- | --- |
| `build-preview.mjs` | tool | Turns the reviewed specification into a runtime map with no lessons. Run once. |
| `lessons.mjs` | tool | The import logic: reconciliation, conflict detection, status labelling. No file access. |
| `apply-lessons.mjs` | tool | The command you actually run. Finds inputs, reports, gates, writes. |
| `Integration-Summary.md` | record | The tracked written handoff note for editions 01–05. |
| `I05-Audit.md` | record | The read-only structural audit of the I05 chain. |
| `Edition06-Targets.json` | record | The six then-unwritten I05 entries, extracted verbatim. |

### 2.4 `packages/` — supplied source packages (ignored by Git)

Content that arrived from outside. **Never edited.** Each edition package holds its lesson JSON, a
readable Markdown edition, a workbook, a study sequence, a status ledger, a Python lab, its own
`check_package.py`, and a `baseline/` folder of comparison evidence.

```
packages/
├── shared-foundations-learning-edition-01/     77 lessons
├── controlled-joint-learning-edition-02/      116 lessons
├── complete-arm-learning-edition-03/           61 lessons
├── wheeled-robot-learning-edition-04/          28 lessons
├── mobile-manipulation-learning-edition-05/    10 lessons
├── repeatable-work-system-learning-edition-06/  6 lessons  ← newest, see §9.4
├── robotics-curriculum-v3/          the reviewed specification
├── robotics-coverage-blueprint/     earlier planning
└── …-batch-01/ folders              the pre-v3 content batches
```

### 2.5 `Maps/` — generated exports and personal maps (ignored by Git)

| File | Kind | Written by | Read by |
| --- | --- | --- | --- |
| `Robotics-v3/Robotics-v3-Preview.json` | generated | `build-preview.mjs --write` | `apply-lessons.mjs` (first run only) |
| `Robotics-v3/Robotics-v3-Lessons.json` | **generated — the live export** | `apply-lessons.mjs --write` | the app, the tests, `apply-lessons.mjs` itself |
| `Robotics-v3/Content-Import-Ledger.csv` | generated | `apply-lessons.mjs --write` | a person, in a spreadsheet |
| `Robotics-v3/Integration-Summary.json` | generated | `apply-lessons.mjs --write` | a person, or the next edition's author |
| `Robotics-v3/Preview-Notes.md`, `Content-Completion-Ledger.csv` | generated, older | earlier runs | reference only |
| `Skill-Solar-System.json` | **yours** | you, via Save map | the app |
| `*-with-prerequisites.json` | yours | earlier merges | the app, optional tests |

> The live export is rewritten in place by every `--write`. It is *not* a backup — see §11.5.

### 2.6 Everything else

- **`dist/`** — generated by `npm run build`; what Electron actually loads. Safe to delete.
- **`tests/`** — tracked. §8.
- **`coverage-inventory/`** — tracked planning documents, described by its own `README.md`.
- **`Archive/`** — older project versions and maps. Ignored. Nothing reads it.
- **`.e2e-baseline/`, `.e2e-c1/`** — snapshot copies of the project (`desktop`, `dist`, `src`,
  `tests`, `package.json`). *I could not determine what created these or whether anything still
  uses them* — nothing in `package.json` or `tests/` refers to them.
- **`Tasks/`** — a single untracked `TASKS.md`. Not referenced by any code. Left alone.
- **`*.cmd`** — Windows double-click helpers: `Setup-Windows.cmd` (install + build),
  `Launch-Windows.cmd` (start), `Build-Portable-Windows.cmd` (package an `.exe`), `Rebuild-Windows.cmd`.
- **`.gitattributes`** — forces Unix line endings everywhere except `.cmd`/`.bat`, which need Windows
  ones or `cmd.exe` misreads them.

---

## 3. Application architecture

### 3.1 Two processes

> **Term: process.** One running program. Electron apps use two, with a guarded door between them.

**The main process** (`desktop/main.cjs`) is the one with real power: it can open windows and touch
the disk. It creates a 1500×960 window and loads `dist/index.html`.

**The renderer process** is the window's contents — the page, the 3D view, all of `src/`. It is
deliberately caged. `desktop/main.cjs` gives it:

```js
webPreferences: { preload: …, contextIsolation: true, nodeIntegration: false, sandbox: true }
```

In plain terms: the page cannot read or write files, cannot reach the network, cannot open new
windows (`setWindowOpenHandler` denies every attempt), and cannot navigate away (`will-navigate` is
prevented). It can only ask the main process to do things, through one narrow door.

### 3.2 The door between them

`desktop/preload.cjs` is 8 lines and exposes exactly three functions as `window.desktop`:

| Function | What it asks for |
| --- | --- |
| `saveMap(content, options)` | Show a Save dialog and write this text |
| `proficiency.load(family)` | Read the answer record for this atlas family |
| `proficiency.save(family, text)` | Write that record |

Every handler in `main.cjs` checks `event.sender === win.webContents` first — a request from
anywhere but this window is refused. Saves are capped at 10 MB, records at 5 MB
(`desktop/proficiency-store.cjs`), and a record is parsed and checked to be the right *format* and
the right *family* before it is written.

### 3.3 Build and run

```sh
npm install       # once — downloads Electron and three.js
npm run build     # bundles src/ into dist/
npm start         # launches the app
```

`scripts/build.mjs` is seven lines. It uses **esbuild** to follow every `import` starting from
`src/app.js`, flatten the whole graph (including the `three` 3D library) into one file
`dist/app.js`, then copies `index.html` and `style.css` across unchanged.

**The build is not automatic.** Editing anything under `src/` has no effect until you run
`npm run build` again.

### 3.4 How the map is rendered

`src/viewer.js` builds a `three.js` scene. For each node it creates one sphere, coloured by domain
(or by proficiency when that toggle is on), positioned at the node's `position`. For each visible
edge it draws a line — dashed for `supports`, solid otherwise — with a cone arrowhead unless the
link is `related`.

Names are **not** drawn in 3D. They are ordinary HTML elements floating above the canvas, positioned
each frame by projecting the sphere's location onto the screen (`src/nameplates.js`), so a name
shrinks and grows with its sphere instead of staying a fixed size.

Three display-only controls never touch stored data:

- **Sphere spacing** multiplies coordinates on the way to the screen and divides on the way back
  (`src/spacing.js`).
- **Labels** and **Selected connections only** change visibility alone.
- **Proficiency colouring** recolours spheres and starts the pulse (`src/pulse.js`) for skills
  marked Yes.

### 3.5 How lesson cards are rendered

Two layers, deliberately separated:

1. **`src/lesson.js` decides what to show.** It returns plain data — a list of sections, each with
   labelled blocks. It contains no screen code at all, which is why it can be tested without a
   browser.
2. **`src/app.js` draws it.** `fillDetails()` builds the card; `lessonCard()` turns each section
   into an expandable panel; `revealBlock()` builds a question with its answer behind a button.

A card with an authored lesson shows: the heading, a status line naming the edition, a line saying
extended practice is still pending, the lesson's own scope sentence, then **six collapsible
sections, all closed**:

| Section | Source fields |
| --- | --- |
| Explanation and worked example | `explanation`, `worked_example` |
| Why this matters and what it builds on | `why_it_matters` + prerequisites **read from the map's edges** |
| Practice question | `practice.question`, answer behind **Show answer** |
| Boundary or misconception check | `boundary_case`, its own separate **Show answer** |
| Full demonstration and evidence | `full_demonstration`, the whole `assessment_contract`, `assessment_rule`, `evidence_policy` |
| References and remaining learning work | `references`, `required_future_work` |

Then "Where it sits", the connection list, and the proficiency buttons — the same as any other map.

Three details worth knowing:

- **Prerequisites shown on the card come from the graph, not from the lesson text**
  (`prerequisiteLinks()` in `src/app.js`), so the card can never contradict the map. Each is a
  button that moves the card to that subject.
- **Text is never shown twice.** The explanation and worked example move *into* their section rather
  than also appearing above it; the short description is dropped when it merely repeats the title;
  and `assessment_contract.task`, which repeats the demonstration wording in every entry, is shown
  once.
- **Whether real hardware is still required is detected by meaning, not by phrase.** Every edition
  worded `practice_mode` differently. `src/lesson.js` tests for the *idea* with
  `NEEDS_REAL_EVIDENCE`, a pattern matching words like *physical*, *deployed-system*, *hardware*,
  *supervised*. An earlier version matched whole sentences and silently lost the warning when an
  edition rephrased it; a test now asserts every affected entry still produces the line.

**Which authored fields have a renderer, and which do not.**

Rendered: `explanation`, `worked_example`, `practice`, `boundary_case`, `why_it_matters`,
`full_demonstration`, the whole `assessment_contract`, `assessment_rule`, `evidence_policy`,
`references`, `required_future_work`, `instructional_scope`, `practice_mode`, `details`,
`placement_note`.

**Preserved but not rendered anywhere:** `branch`, `planning_id`, `proposed_runtime_id`, `requires`,
`dependency_depth`, `node_contract_sha256`, `content_status`, `proficiency_write`, `name`, `id`.
These travel because `authoring/robotics-v3/lessons.mjs` stores the **entire** supplied lesson
record verbatim as `node.lesson` rather than copying selected fields. Nothing is lost when a future
version learns to display more.

### 3.6 Saving

Every write goes through `writeFileAtomic` in `desktop/save.cjs`: write a temporary file, flush it
to the physical disk, **check its size matches**, then rename it over the target in one step. If
anything fails, the temporary file is deleted and the previous file is untouched. A save interrupted
by a crash or a power cut cannot leave a half-written map.

`main.cjs` also tracks in-flight writes in a `pending` set and delays quitting until they finish.

---

## 4. Data model

### 4.1 The map file

A map is one JSON file. `src/model.js` accepts it only if `schemaVersion` is `1`, `nodes` and
`edges` are lists, and there are at most 5,000 nodes and 20,000 connections.

```
{ schemaVersion, title, nodes[], edges[], metadata{}, layout{}, roboticsV3Preview{} }
```

`layout` is written by `src/vortex.js` and records how the spiral was built. `roboticsV3Preview` is
written by `build-preview.mjs` and holds provenance for the robotics map. Both are carried through
untouched by everything else.

### 4.2 A node, field by field

A real example, trimmed (from `Maps/Robotics-v3/Robotics-v3-Lessons.json`; the same record appears
in full in `authoring/robotics-v3/Edition06-Targets.json`):

```json
{
  "id": "rob3:B-D08",
  "name": "Estimate temperature rise with a lumped model",
  "domain": "Mechanics",
  "subdomain": "Mechanics",
  "nodeKind": "foundation",
  "description": "Estimate temperature rise with a lumped model",
  "details": "LESSON NOT YET AUTHORED. …",
  "position": [517.271, 1728, -258.312],
  "pinned": false,
  "proficiency80": null,
  "icon": "gear",
  "layoutMode": "vortex",
  "placementNote": "foundation entry in the Mechanics branch…",
  "planningId": "B-D08",
  "sourceCandidateId": null,
  "approvedEquivalentToSource": false,
  "tier": null,
  "pathRole": "core endpoint path",
  "feedsMilestones": ["I05"],
  "assessmentMode": "drawing, calculation or supervised fabrication",
  "assessable": true,
  "lessonStatus": "scope and assessment specified; introductory lesson not yet authored",
  "origin": "new foundational definition",
  "skillLevel": 28,
  "contentStatus": "introductory lesson pending"
}
```

**Validated by `src/model.js`** — the app refuses to open a map that breaks these:

| Field | Rule |
| --- | --- |
| `id` | unique, non-empty text, 1–100 characters |
| `name` | 1–120 characters |
| `domain` | one of exactly six: Mathematics, Physics, Mechanics, Electronics, Computing, Robotics |
| `description` | text, under 5,001 characters |
| `details`, `placementNote` | text, at most 12,000 characters |
| `position` | exactly three finite numbers, each within ±100,000 |
| `pinned` | true or false |
| `proficiency80` | `true`, `false`, or `null` — nothing else |
| `skillLevel` | a whole number 1–100, or absent |
| `icon` | a key of `ICONS` in `src/icons.js` |
| `layoutMode` | `saved`, `manual`, `prerequisites` or `vortex` |

**Not validated, carried through untouched.** `subdomain`, `nodeKind`, `planningId`, `tier`,
`pathRole`, `feedsMilestones`, `assessmentMode`, `assessable`, `lessonStatus`, `contentStatus`,
`origin`, `sourceCandidateId`, `approvedEquivalentToSource`, `lesson`, `lessonCard`. `src/model.js`
simply ignores fields it does not know, which is why the content pipeline can add rich data without
touching the validator.

Two fields are worth dwelling on:

- **`domain` vs `subdomain`.** The app supports exactly six domains (they set sphere colour and the
  legend). The robotics curriculum has nineteen *branches*. `build-preview.mjs` maps each branch to
  the nearest domain for colour, and **stores the exact branch name verbatim in `subdomain`**, so no
  curriculum information is lost. The branch is what §9 and the audit group by.
- **`proficiency80`** means "am I at least 80% proficient?" — your answer, three states: yes, no,
  unmarked.

### 4.3 Edges

```json
{ "source": "rob3:K02", "target": "rob3:K03", "type": "prerequisite",
  "rationale": "…", "authorship": "robotics curriculum specification v3" }
```

Three types (`src/model.js`, `TYPES`):

| Type | Meaning | Drawn as | Forces order? |
| --- | --- | --- | --- |
| `prerequisite` | Strict learning order: source must come first | solid line + arrowhead | **yes** |
| `supports` | Helpful preparation, not required | dashed line + arrowhead | no |
| `related` | Connected in subject, no order at all | plain line, no arrowhead | no |

Only `prerequisite` edges affect levels, layout height, cycle checking, the prerequisite-chain
control and the milestone closures. The robotics map has **888 prerequisite and 6 supporting** edges
and no `related` edges.

`rationale` is a sentence explaining *why* the link exists. Every one of the 894 is filled in with
something specific — the audit checked for empty or boilerplate rationales and found none. The card
shows a rationale under its connection when it is longer than 80 characters.

`src/model.js` also rejects self-links, duplicate links of the same type, and links pointing at a
node that does not exist.

### 4.4 Milestones and `feedsMilestones`

`nodeKind` takes four values in this map: `foundation` (254), `outcome` (120), `milestone` (6),
`roadmap` (1).

`feedsMilestones` is a list on each node naming the milestones it contributes to. It is
**descriptive metadata, not a link** — the real structure is the edges. The audit checked both
directions and found them fully consistent: no entry claims a milestone it cannot reach through
prerequisite edges, and no entry in the I05 chain omits `I05`.

### 4.5 Node content states

| State | `contentStatus` | `lessonStatus` | Has `lesson`? |
| --- | --- | --- | --- |
| **Authored** | `introductory lesson authored` | `introductory lesson available; extended lesson and further practice authoring pending` | yes |
| **Pending** | `introductory lesson pending` | `scope and assessment specified; introductory lesson not yet authored` | no |
| **Roadmap** | `roadmap note, not assessed` | `roadmap note; not assessed, and no lesson is planned for it` | no, and none planned |

Set together by `applyLessons` in `authoring/robotics-v3/lessons.mjs`. The roadmap entry also has
`assessable: false`, and its card shows no lesson sections and says it is not an assessed entry.

### 4.6 The ID scheme

Every runtime `id` is the planning ID with a `rob3:` prefix — `B-D08` becomes `rob3:B-D08`. The
prefix isolates this map's identifiers from the original atlas, which uses bare names like `m-vector`.

Counts below are from the map's 381 `planningId` values.

**Lower-case prefixes — foundation subjects, borrowed from the original atlas's naming:**

| | Area | Count |
| --- | --- | ---: |
| `m-` | Mathematics | 90 |
| `c-` | Computing | 63 |
| `p-` | Physics | 25 |
| `e-` | Electronics | 18 |
| `s-` | Mechanics / structures | 8 |

**`B-` — basic/bridging entries, second letter naming the area:** `B-E` Electronics (12),
`B-D` Design/Mechanics (8), `B-P` Physics (7), `B-C` Computing (5), `B-M` Mathematics (5),
`B-S` Systems (2).

**`R-` — reference or supporting entries feeding a specific branch:** `R-M` Mathematics (6),
`R-E` Electronics (2), `R-P` Perception (2), `R-X` Advanced (2), `R-K` Kinematics (1).

**Single capitals — robotics outcome branches:**

| | Branch | Count |
| --- | --- | ---: |
| `D` | CAD, fabrication and mechanical design | 12 |
| `E` | Electrical power, interfaces and measurement | 12 |
| `K` | Robot geometry and kinematics | 12 |
| `S` | Software and embedded implementation | 12 |
| `A` | Actuation and transmissions | 11 |
| `C` | Control and trajectories | 10 |
| `N` | Wheeled mobility and navigation | 10 |
| `P` | Sensing, calibration and estimation | 10 |
| `X` | Advanced pathways | 10 |
| `G` | Manipulation and combined tasks | 8 |
| `V` | Verification, diagnosis and reliability | 7 |
| `Q` | Requirements and systems practice | 6 |
| `I` | Integration milestones | 5 |

*These letter meanings are inferred from the `subdomain` value that every entry with a given prefix
carries — they are consistent across all 381 entries, but I found no file that states the scheme
explicitly.*

---

## 5. Identity and persistence

### 5.1 Two separate identities

They answer different questions and must not be confused.

**`metadata.atlasFamily` — "whose answers are these?"** Maps in the same family share one answer
record. The robotics map declares `robotics-foundations-integration-v3-review`; your original atlas
uses `sss-robotics-foundations-2026-09`. Different families, so an answer in one can never appear in
the other. `src/proficiency.js` (`atlasFamily`) reads it, falling back to a known `datasetId` for
files written before the field existed, and returning `null` — *never share* — otherwise.

**`metadata.datasetKey` — "which map is this review of?"** The robotics map declares
`robotics-curriculum-v3`.

### 5.2 Exactly how the review key is composed

From `mapKey` and `nodeSetKey` in `src/review.js`:

```js
nodeSetKey = "|" + <number of nodes> + "|" + hash(<all node ids, sorted, newline-joined>)
mapKey     = (datasetKey ? "dataset:" + datasetKey : title) + nodeSetKey
```

The hash is an 8-character FNV-1a digest. For the robotics map today the key is:

```
dataset:robotics-curriculum-v3|381|cbb516b3
```

**Which changes would alter the review key:**

| Change | Key changes? |
| --- | --- |
| Adding or deleting a node | **yes** — count and hash both move |
| Renaming a node's `id` | **yes** — the hash moves |
| Changing `metadata.datasetKey` | **yes** — and every saved session for it is orphaned |
| Changing the **title** | **no**, while `datasetKey` is declared |
| Changing the title on a map with **no** `datasetKey` | **yes** — the title *is* the identity |
| Editing lesson text, positions, levels, pins, names, edges, answers | **no** |

This mattered: an earlier import restated the counts in the title and reset every saved review.
`src/review.js` was changed so a declared `datasetKey` takes precedence, and `sameMap()` also accepts
a session whose stored key merely *ends with the same node-set suffix*. That is the **migration**: a
session saved under the old title-based key is recognised by its node set, re-stamped with the new
key, and the old entry replaced rather than left behind (`findSession`, `resumeCheck`,
`storeSession(…, replacedKey)`). A map that declares **no** `datasetKey` behaves exactly as before —
so no other map's behaviour changed.

### 5.3 Where your data actually lives

Confirmed present on this machine: **`%APPDATA%\skill-solar-system\`**
(= `C:\Users\hilli\AppData\Roaming\skill-solar-system`).

| Location | Holds |
| --- | --- |
| `…\skill-solar-system\proficiency\` | **Shared answer records** — one JSON file per atlas family |
| `…\skill-solar-system\Local Storage\` | Chromium's browser storage: the draft map, review sessions, spacing, panel states |
| Wherever you chose | Map JSON files you saved with **Save map** |

The proficiency filename is built by `fileFor` in `desktop/proficiency-store.cjs`: a readable
version of the family name, a dash, and the first 12 hex characters of its SHA-256. Currently one
file exists, `sss-robotics-foundations-2026-09-2eb611994d87.json` — the original atlas. **There is
no file for the robotics-v3 family**, meaning no answer has been recorded in that map through the
real app. (I listed the folder; I did not read the record's contents.)

Four keys live in browser storage, all defined in `src/app.js` and `src/review.js`:

| Key | Holds |
| --- | --- |
| `skill-solar-system-v1` | the whole current map as a draft, re-saved on every change |
| `skill-solar-system-review-v1` | up to 8 review sessions, newest kept |
| `skill-solar-system-spacing` | the sphere-spacing slider |
| `skill-solar-system-panels-v1` | which panels you collapsed |

The draft is a convenience, not a backup — `main.cjs` says so when you close with unsaved changes.
At 2.7 MB the robotics map is near enough to browser-storage limits that `cache()` catches failure
and tells you to save to a file.

---

## 6. Content pipeline

### 6.1 The Edition package format

Each package contains, at minimum:

| File | Role |
| --- | --- |
| `<Name>-Lessons-NN.json` | **authoritative** — `metadata` + `lessons[]` |
| `INTEGRATION.md` | instructions for whoever performs the import |
| `README.md` | what the edition covers |
| `<Name>-Learning-Edition-NN.md` | the same lessons, readable |
| `Study-Sequence.csv`, `Content-Status-Ledger.csv` | reading order; status of all 381 entries |
| `check_package.py` | the package's own self-checks |
| `<something>_lab.py`, `lab-results/` | synthetic exercises and recorded results |
| `baseline/` | **comparison evidence** — the export it was reconciled against |

A lesson record carries 25 fields. The ones the card renders are listed in §3.5.

### 6.2 The applier, step by step

Two files: `authoring/robotics-v3/lessons.mjs` (the logic, no file access) and
`authoring/robotics-v3/apply-lessons.mjs` (the command).

**1. Find the inputs.** `CANDIDATES` lists several paths per input and takes the first that exists,
so a package works whether it sits in `packages/` or where it was unzipped. Every input is
fingerprinted with SHA-256 into the summary.

**2. Choose the base map.** The current export if it exists, otherwise the preview. This carries
forward any later change rather than rebuilding it away.

**3. Match and reconcile, per lesson** (`reconcileLesson`). A lesson is applied **only if all** hold:

- the planning ID exists in the reviewed specification;
- a map node exists with the lesson's `proposed_runtime_id`;
- the specification's `name` matches the lesson's;
- the `requires` lists match exactly;
- the proposed runtime ID matches the specification's;
- the `node_contract_sha256` fingerprint matches one recomputed here;
- `proficiency_write` is `false`.

Anything else is **reported, never forced**.

> The fingerprint hashes the entry's id, name, prerequisites and demonstration, as serialised by
> Python. Python's `json.dumps` puts a space after `,` and `:` and escapes non-ASCII characters;
> JavaScript does neither. `pythonJson` in `lessons.mjs` reproduces Python's bytes exactly so the
> hashes can be compared rather than re-derived.

**4. Detect conflicts.** If a node already holds a lesson and the edition would change it, the
existing record is **kept**, the entry stays authored, the differing field names are recorded in
`existingLessonsKeptOverEdition`, and the lesson is counted as skipped. A later local fix survives a
re-import.

**5. Apply.** Set `details`, `placementNote`, `lessonCard` (a rendering summary) and `lesson` (the
**entire** supplied record, verbatim). Set `contentStatus` and `lessonStatus` for every node, not
just the new ones. Field order is fixed so re-running produces identical bytes.

**6. Restate the title and four metadata keys** — `scope`, `contentEditions`,
`contentStatusPolicy`, `datasetKey`. `atlasFamily` is deliberately never touched.

**7. The gates.** The applier **refuses to write** unless all of these pass:

| Gate | Checks |
| --- | --- |
| `preservationDiff` | 18 node fields, all edges, node order, and every metadata key but the four above |
| Signatures | SHA-256 digests of **node order**, **edges**, **layout**, **proficiency** — each identical before and after. Only the fifth, **lesson payloads**, may move |
| `thisRun.existingPayloadsChanged` | must be empty |
| Counts | authored / pending / roadmap / total must equal the expected numbers |
| Proficiency | same count of answers before and after |
| `atlasFamily` | unchanged |
| Review order | `buildQueue` identical before and after |
| Review sessions | a session built on the old map must resume on the new one at the same position |
| Idempotency | applying the result to itself must change nothing |
| Baseline | against the package's own `baseline/` copy: no existing lesson changed, no preserved field changed |

**8. Write three files** atomically — the map, the ledger, the summary.

### 6.3 Outputs

**The content-import ledger** (`Content-Import-Ledger.csv`), one row per entry with columns:
`runtime_id, planning_id, name, branch, kind, content_status, edition, assessment_mode,
practice_mode, has_practice, has_boundary_case, references, contract_sha256`.

**The integration summary** (`Integration-Summary.json`) holds `sourceRevision` (the Git commit),
input fingerprints, `counts`, `byEdition`, `thisRun`, `signatures`, `sinceSuppliedBaseline`,
`preservation` (including the review-session check), `idempotent`, `limitations` and `result`.

**The tracked written note** is `authoring/robotics-v3/Integration-Summary.md`.

### 6.4 The exact commands

```sh
node authoring/robotics-v3/apply-lessons.mjs            # dry run — reports, writes nothing
node authoring/robotics-v3/apply-lessons.mjs --write    # apply
node authoring/robotics-v3/apply-lessons.mjs --write    # again: must change nothing
```

A dry run exits non-zero if the checks fail, so it is safe to inspect first, always.

---

## 7. Proficiency and review

### 7.1 Recording an answer

Three buttons — **Yes**, **No**, **Clear** — appear on the side panel and on the subject card
(`proficiencyControls` in `src/app.js`). Pressing one runs `commit()`, which: copies the map, sets
`proficiency80`, validates, pushes the old version onto the undo history (50 deep), saves the draft,
writes the change into the shared record, redraws, and reports.

The heading above them reads *"At least 80% proficient?"* with *"Your judgment only. No tests or
automatic scoring."*

### 7.2 The shared record

One JSON file per atlas family, outside any map (§5.3). `src/proficiency.js` holds the rules:

- **Shared answers win** when a map is opened, including a deliberate Clear.
- **A map's own answer initialises** a skill the record has not seen.
- **An unmarked skill never erases** a shared answer.
- **Answers are never inferred** for prerequisites or related skills. The file's opening comment
  says so, and `reconcile()` only ever touches `proficiency80` on the node whose id it matched.

Each entry records its `source` — `console`, `review`, `prerequisite chain`, `imported record`,
`initialized from map`, `adopted from file` — so a bulk pass stays distinguishable later.

### 7.3 Marking a whole prerequisite chain

The card offers *"Mark proficient on all prerequisite skills (N)…"*. It opens a list — it does not
mark anything. `src/prerequisites.js` walks backward over `prerequisite` edges only, grouped by how
many steps down each sits. Every skill is shown with the answer it currently holds; only those the
chosen answer would actually change start ticked. Nothing is written until the confirm button, whose
label names the real count. One Undo reverses the whole pass.

### 7.4 Review sessions

`buildQueue` in `src/review.js` orders skills by **saved height** (ascending — foundations first),
then name, then id. Height comparison uses the map's own saved precision so floating-point noise
cannot split one height.

A session records the queue, position, visited list, skipped list, answers and round. Up to 8 are
kept in browser storage, newest first. `resumeCheck` drops deleted skills, returns undone answers to
the pending list, and refuses to resume if more than 10% of the queue has vanished.

### 7.5 What does **not** change proficiency

Confirmed by reading the code and by end-to-end checks in the real app:

- Importing content — the applier never assigns `proficiency80`, and gates on the answer count and
  signature being unchanged.
- Opening a subject card.
- Expanding any section.
- Pressing **Show answer**. `revealBlock` in `src/app.js` toggles one paragraph's visibility and
  nothing else.
- Following a prerequisite link.
- Opening the prerequisite-chain list, ticking boxes, or cancelling.
- Resuming a review, or scrolling and dragging inside it.
- Running any lab script — none is connected to the app.

**There is no "mark exercise complete" control anywhere in the program**, so there is nothing for an
automatic answer to attach itself to. The only writers are the three manual buttons, the review's
Yes/No, the confirmed prerequisite-chain pass, edit mode, Undo/Redo, and importing a record file.

---

## 8. Testing and verification

### 8.1 Unit tests — `npm test`

> **Term: unit test.** A small check of one piece of logic in isolation, with no window and no
> graphics. Fast — the whole suite runs in under a second.

**205 tests across 27 files: 199 pass, 6 skipped, 0 fail.**

| File | Tests | Covers |
| --- | ---: | --- |
| `robotics-v3-lessons.test.mjs` | 16 | The edition importer, card sections, review migration, the real map |
| `robotics-foundations.test.mjs` | 14 | The Robotics Foundations batch and its merge |
| `material-behavior.test.mjs` | 13 | Material Behavior batch |
| `mechanics-statics.test.mjs` | 13 | Mechanics Statics batch |
| `physics-foundations.test.mjs` | 13 | Physics Foundations batch |
| `camera.test.mjs` | 12 | Zoom, travel and pan-rate maths |
| `computing.test.mjs` | 12 | Computing edition and merge |
| `review.test.mjs` | 11 | Queue order, sessions, answer gating, map identity |
| `model.test.mjs` | 9 | Validation, cycles, levels |
| `dc-circuits.test.mjs` | 9 | DC Circuits batch |
| `proficiency.test.mjs` | 9 | Record rules, reconciliation, merging |
| `prerequisites.test.mjs` | 8 | The chain walk and bulk marking |
| `update.test.mjs` | 8 | Update/versioning behaviour |
| `grid.test.mjs`, `proficiency-store.test.mjs`, `pulse.test.mjs` | 6 each | Grid spacing; storage; pulse maths |
| `find.test.mjs`, `spacing.test.mjs`, `vortex.test.mjs` | 5 each | Search; spacing; spiral layout |
| `highlight.test.mjs`, `interaction.test.mjs`, `nameplates.test.mjs` | 4 each | Highlighting; clicks; label projection |
| `connections.test.mjs`, `orbit.test.mjs`, `placement.test.mjs` | 3 each | Visible edges; orbit; placement |
| `positions.test.mjs`, `save.test.mjs` | 2 each | Coordinates; atomic save |

### 8.2 The six skipped tests, individually

All six skip for the **same reason**: they check a real local map that is not in the repository, so
they only run when an environment variable points at one. None indicates a problem.

| # | File | Test | Skip reason |
| --- | --- | --- | --- |
| 1 | `computing.test.mjs:141` | real atlas: Computing edition is present, consistent, and existing skills are preserved | `set SSS_ATLAS to check a local master atlas` |
| 2 | `dc-circuits.test.mjs:138` | real atlas: the DC batch is present, consistent, and existing skills are preserved | same |
| 3 | `material-behavior.test.mjs:178` | real atlas: the batch is present, consistent, and existing skills are preserved | same |
| 4 | `mechanics-statics.test.mjs:179` | real atlas: the batch is present, consistent, and existing skills are preserved | same |
| 5 | `physics-foundations.test.mjs:187` | real atlas: the batch is present, consistent, and existing skills are preserved | same |
| 6 | `robotics-foundations.test.mjs:189` | real atlas: the batch is present, consistent, and existing skills are preserved | same |

To run them: `SSS_ATLAS=Maps/Skill-Solar-System.json npm test`. (Two further tests in
`robotics-v3-lessons.test.mjs` use the same mechanism but currently **run**, because
`Maps/Robotics-v3/Robotics-v3-Lessons.json` is present.)

### 8.3 End-to-end tests — `npm run test:e2e`

> **Term: end-to-end test.** Launches the *real* Electron app, drives it with real clicks and
> keystrokes, and inspects what actually appears. Slow, and the closest thing to a person using it.

`tests/e2e-harness.mjs` launches the app through `tests/electron-launcher.cjs` in an **isolated
profile** — its own temporary user-data folder, its own proficiency store, and a save dialog
replaced by a fixed path. Your real answers are never touched.

| Script | Checks | Covers |
| --- | ---: | --- |
| `review-e2e.mjs` | 41 | The whole guided review: order, answering, skip, back, resume, undo |
| `shared-e2e.mjs` | 41 | Subject highlighting and the shared proficiency record |
| `orbit-e2e.mjs` | 14 | Click-to-centre and orbit |
| `pulse-e2e.mjs` | 14 | Proficiency colours and the pulse |
| `find-e2e.mjs` | 14 | Find box and collapsible panels |
| `pan-e2e.mjs` | 6 | Held-key panning rate |
| `grid-e2e.mjs` | 5 | The floor grid at distance |
| `prerequisites-e2e.mjs` | 47 (52 with a map) | The prerequisite-chain control |
| `robotics-v3-e2e.mjs` | 498 with a map | Lesson cards, answers, symbols, units, sessions, save/reload |
| `atlas-e2e.mjs`, `dc-`, `physics-`, `material-`, `statics-`, `robotics-atlas-e2e.mjs` | — | Each integrated batch against a real atlas |

Scripts needing a local map print `Skipped: …` and exit cleanly without one.

```sh
npm run test:e2e                                              # 182 checks, no local files needed
SSS_V3_MAP=Maps/Robotics-v3/Robotics-v3-Lessons.json \
  SSS_ATLAS=Maps/Skill-Solar-System.json npm run test:e2e     # the full set
```

### 8.4 Package self-checks

Each edition ships `check_package.py`, run from its own folder. Recorded results: edition 02 **103**,
03 **96**, 04 **78**, 05 **51**. Editions 03–05 need NumPy; 05 also needs SciPy. Run them in a
throwaway Python environment rather than installing into the system Python.

---

## 9. Current state

### 9.1 As committed at `7c95db6`

| | |
| --- | --- |
| Map | 381 nodes, 894 edges, `datasetKey` `robotics-curriculum-v3` |
| Authored introductory cards | **292** |
| Pending assessable | **88** |
| Roadmap | **1** (`X10`) |

| Edition | Cards | Milestone |
| --- | ---: | --- |
| `shared-foundations-01` | 77 | foundations |
| `controlled-joint-02` | 116 | I01 |
| `complete-arm-03` | 61 | I02 |
| `wheeled-robot-04` | 28 | I03 |
| `mobile-manipulation-05` | 10 | I04 |

### 9.2 Chain closure

| Milestone | Chain | Closed? |
| --- | ---: | --- |
| I01 | 185 | yes |
| I02 | 249 | yes |
| I03 | 241 | yes |
| I04 | 291 | yes |
| I05 | 298 | **no at `7c95db6`** — 6 entries short |

### 9.3 The audit

The full structural analysis is **`authoring/robotics-v3/I05-Audit.md`** — the six missing entries
in dependency order, the 82 pending entries outside the chain split by whether any milestone can
reach them, and nine structural observations. It is not duplicated here.

### 9.4 Uncommitted work in the tree at the time of writing

**The working tree is ahead of the last commit.** An **Edition 06** has been created and applied
since the audit. I observed this and did not touch it.

Present but **not committed**:

- `packages/repeatable-work-system-learning-edition-06/` — 6 lessons: exactly `Q06`, `B-D08`, `E11`,
  `V06`, `V07`, `I05`, the six the audit identified.
- Modified: `authoring/robotics-v3/apply-lessons.mjs` (adds `edition06`, a `milestoneClosure`
  helper), `src/lesson.js`, `tests/robotics-v3-lessons.test.mjs`.
- New, untracked: `authoring/robotics-v3/build-edition06-package.mjs`,
  `tests/robotics-v3-edition06-e2e.mjs`.

The **generated export has already been rewritten** by that work:

| | Committed state | Export on disk now |
| --- | --- | --- |
| Title | …292 introductory lessons, 88 pending | …**298** introductory lessons, **82** pending |
| Authored / pending / roadmap | 292 / 88 / 1 | **298 / 82 / 1** |
| Editions | five | **six** |
| I05 chain | 6 short | **closed** |
| SHA-256 | `ad9ba478…` | `687f0916…` |

Two consequences:

- `authoring/robotics-v3/I05-Audit.md` and `Edition06-Targets.json` both cite `ad9ba478…`. Their
  *content* is still correct about what was missing; they now describe a **previous** state.
- `authoring/robotics-v3/Integration-Summary.md` still describes editions 01–05.

I did not verify the Edition 06 import, run its checks, or commit any of it. Its own
`Integration-Summary.json` on disk reports `"result": "passed"` at revision `7c95db6`, but **that is
its claim, not my verification.**

---

## 10. Known limitations and open structural questions

### 10.1 From the audit

Summarised; details in `authoring/robotics-v3/I05-Audit.md`.

- **Thermal is three entries wide** across three different branches, and `B-D08` — a thermal
  calculation — is filed under **Mechanics**, which does not match its subject.
- **Two parallel mechanics tracks.** The applied `B-D0x` entries are authored and on-path; a
  derivational `s-*` block of eight is pending and reachable from no milestone. `B-D05` applies a
  *supplied* beam model, so nothing on the path explains where that model comes from.
- **Planar kinematics `K05`–`K07` is stranded** beneath the spatial case it teaches — and the map
  says so itself, in the `K07 → K10` supporting edge.
- **Five integral-calculus foundations are stranded** while three of the six supporting edges point
  at them from authored, on-path work.
- **`X06` is a milestone that leads nowhere** — no dependents, empty `feedsMilestones`, in no chain.
- **The physics energy and equilibrium thread is absent from every path.**
- **65 entries are reachable from no milestone at all** — about a sixth of the graph, all pending.

### 10.2 Things I noticed in the code

- **No TODO or FIXME markers anywhere** in `src/`, `desktop/`, `authoring/` or `tests/`.
- **`src/knowledge.js` is nearly dead code.** It holds descriptions for the 18 starter subjects, and
  `profileFor` returns them only when a node's id *and* name both match a hard-coded entry. Against
  any real map, including the robotics one, it always returns nothing.
- **`tests/console-smoke.mjs` cannot run.** It imports `playwright`, which is not in
  `package.json`'s dependencies. Not referenced by any npm script — apparently legacy.
- **`.e2e-baseline/` and `.e2e-c1/`** are whole copies of the project. Nothing refers to them.
- **The project lives inside a OneDrive folder.** The export is 2.7 MB and rewritten on every
  import. During this work a `npm test` run failed once with one test failing; **it did not
  reproduce in 26 further consecutive runs**, and I could not identify which test it was. A cloud
  sync touching the map mid-read is a plausible cause, but *I could not confirm it.*
- **A one-off `pulse-e2e` failure** was seen once in a chained end-to-end run
  (`Cannot read properties of null`), and has not recurred.
- **`review-e2e.mjs` with `SSS_ATLAS` set times out**, reproducibly, when it opens the 5.4 MB atlas
  at the end of its long session. The same file opens fine in a fresh session. Pre-existing — it
  reproduces on commits before this year's robotics work.
- **The 10 MB open limit and browser-storage limit are real ceilings.** The robotics map at 2.7 MB
  is comfortable; the original atlas at 5.4 MB is not far off.
- **`app.js` is 536 dense lines** with long single-line statements. It works and is well tested, but
  it is the hardest file here to change safely.
- **Two surprises worth flagging.** First, `src/model.js` validates only a dozen fields and silently
  carries everything else — powerful, but a typo in `contentStatus` would pass unnoticed. Second,
  `Element.append(null)` inserts the literal text "null"; that bug reached the shipped side panel
  once and was caught only by an end-to-end test, not by any validator.

### 10.3 Open structural questions

1. Should `X06` be a sixth integration milestone, or an outcome mislabelled as one?
2. Should the derivational `s-*` mechanics track enter a milestone chain, or stay optional?
3. Should thermal become its own foundation area?
4. Should `K05`–`K07` be required before the spatial kinematics that already depend on the ideas?
5. Should the five stranded calculus entries become prerequisites, given three supporting edges
   already point at them?

---

## 11. How-to recipes

### 11.1 Run the app

```sh
npm install     # first time only
npm run build   # after any change under src/
npm start
```
Or double-click `Setup-Windows.cmd` once, then `Launch-Windows.cmd`.

### 11.2 Run all the tests

```sh
npm run build          # e2e tests drive dist/, so build first
npm test               # 205 unit tests, about one second
npm run test:e2e       # end-to-end, several minutes

# with local maps as well:
SSS_ATLAS=Maps/Skill-Solar-System.json npm test
SSS_V3_MAP=Maps/Robotics-v3/Robotics-v3-Lessons.json \
  SSS_ATLAS=Maps/Skill-Solar-System.json npm run test:e2e
```

### 11.3 Import a new edition

```sh
# 1. Unzip the package into packages/<name>/
# 2. Run its own checks, in a throwaway Python environment
cd packages/<name> && python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python check_package.py && cd ../..

# 3. Register it: add a CANDIDATES entry, extend loadInputs and editions,
#    update `expected`, and add its baseline to BASELINE
#    — all in authoring/robotics-v3/apply-lessons.mjs

# 4. Dry run and READ the output
node authoring/robotics-v3/apply-lessons.mjs

# 5. Apply, then confirm a second run changes nothing
node authoring/robotics-v3/apply-lessons.mjs --write
node authoring/robotics-v3/apply-lessons.mjs --write

# 6. Verify
npm test
SSS_V3_MAP=Maps/Robotics-v3/Robotics-v3-Lessons.json node tests/robotics-v3-e2e.mjs
```

Check in the dry run that `result` is `passed`, `thisRun.existingPayloadsChanged` is empty, the four
non-payload signatures are identical, and the counts match. **Copy the export aside first** (§11.5)
— the applier overwrites it in place.

### 11.4 Export the map

*From the app:* **Save map** writes wherever you choose, atomically.

*From the pipeline:* `apply-lessons.mjs --write` rewrites
`Maps/Robotics-v3/Robotics-v3-Lessons.json`, its ledger and its summary.

Note `Maps/` is excluded from Git, so exports are never committed or pushed.

### 11.5 Back up and restore user data

```sh
# Back up — the whole picture is three places
cp -r "$APPDATA/skill-solar-system/proficiency"    ~/backup/proficiency
cp -r "$APPDATA/skill-solar-system/Local Storage"  ~/backup/local-storage
cp -r Maps                                          ~/backup/Maps
```

| What | Where | Restore by |
| --- | --- | --- |
| Shared answers | `%APPDATA%\skill-solar-system\proficiency\` | copying the files back with the app closed |
| Draft map, review sessions | `%APPDATA%\skill-solar-system\Local Storage\` | copying the folder back with the app closed |
| Saved maps and exports | `Maps\` | copying back, or **Open map** |

Also available in the app: **Export record** writes the shared answers to a JSON file you choose, and
**Import record** reads one back — the safest round trip for answers alone.

### 11.6 Roll back a bad import

The export is regenerated, never hand-edited, so rolling back means rebuilding it.

```sh
# Best: restore the copy you took before importing
cp ~/backup/Robotics-v3-Lessons.json Maps/Robotics-v3/Robotics-v3-Lessons.json

# Otherwise: undo the registration of the bad edition in apply-lessons.mjs
#   (remove its CANDIDATES/loadInputs/editions entries, restore `expected`)
git diff authoring/robotics-v3/apply-lessons.mjs     # review
git checkout -- authoring/robotics-v3/apply-lessons.mjs   # if it was committed before

# Then rebuild from the preview, which carries no lessons at all:
mv Maps/Robotics-v3/Robotics-v3-Lessons.json Maps/Robotics-v3/Robotics-v3-Lessons.bad.json
node authoring/robotics-v3/apply-lessons.mjs          # base becomes the preview again
node authoring/robotics-v3/apply-lessons.mjs --write
```

Your **answers are not at risk** either way: they live in the shared record outside the map, and the
applier never writes them.

---

## Things I could not determine

1. **What created `.e2e-baseline/` and `.e2e-c1/`, and whether anything still uses them.** They are
   copies of `desktop`, `dist`, `src`, `tests` and `package.json`. Nothing in `package.json` or
   `tests/` refers to them.
2. **Which test failed in the single failing `npm test` run**, or why. It did not reproduce in 26
   consecutive runs. OneDrive syncing the 2.7 MB export mid-read is plausible but unconfirmed.
3. **Whether the ID-prefix letters are documented anywhere.** §4.6 is inferred from the `subdomain`
   value of every entry carrying each prefix — consistent across all 381, but I found no file
   stating the scheme.
4. **Whether `tests/console-smoke.mjs` is meant to be revived or deleted.** It needs `playwright`,
   which is not a dependency, and no script runs it.
5. **Whether `src/knowledge.js` is intentionally retained.** It only ever matches the 18 starter
   subjects and returns nothing for any real map.
6. **What `Tasks/TASKS.md` is for.** Untracked and referenced by nothing; I did not open it.
7. **Whether the Edition 06 work in the tree is finished or mid-flight**, and whether its claimed
   `"result": "passed"` holds. I did not run its checks.
8. **Whether the packaged app uses a different user-data folder.** In development it is
   `%APPDATA%\skill-solar-system`, confirmed on disk. `electron-builder` sets `productName` to
   "Skill Solar System", which would normally give `%APPDATA%\Skill Solar System` — I could not
   verify this without building and running the packaged executable.
9. **Whether the review-session migration has ever run against a real saved session.** Every check
   used a planted session in an isolated profile, and no session store for the robotics family
   exists in your real profile.
