# Capacity 01 — Inventory of limits and scale-sensitive code (Task 1)

Read-only. Every entry comes from reading the code at `c5c5e4c` (file:line cited). "Expected effect
at 10,000" is a **prediction from the code**, not a measurement. Tasks 3 and 4 measure these.
The one measurement in this task is marked **(measured)**.

Terms used below:

- **O(N):** the work grows in step with the number of skills. Twice the skills, twice the work.
- **Draw call:** one separate instruction to the graphics card. Thousands per frame is expensive
  even on a fast GPU.

## A. Hard limits: things that reject a map or a file outright

| # | What | Where | Current value | Expected effect at 10,000 skills |
| --- | --- | --- | --- | --- |
| A1 | Max skills per map | `src/model.js:60` | **5,000** nodes | **Rejected:** "This version supports at most 5,000 nodes and 20,000 connections." Applies to every map the app opens, including the draft it restores at start-up (`app.js:28`) |
| A2 | Max connections per map | `src/model.js:60` | **20,000** edges | Rejected once edges exceed 20,000. The Robotics V3 map has 2.3 edges per skill and the master is measured in Task 2. At 2.3 per skill, 10,000 skills is about 23,000 edges, which is **over the cap** |
| A3 | Open-file size | `src/app.js:232` | **10,000,000 bytes** ("Map files must be smaller than 10 MB.") | The master is 5,397,564 bytes for 1,769 skills (about 3.05 KB per skill, file size from `reports/05-housekeeping.md`). At that density **10 MB is about 3,300 skills**. A 10,000-skill map would be about 30 MB, or far more with lessons, so it is **rejected before parsing** |
| A4 | Save size (main process) | `desktop/main.cjs:26` | **10,000,000 bytes** ("Invalid save request.") | Save writes pretty-printed JSON (`app.js:233`, `JSON.stringify(graph,null,2)`), which is larger than a compact file. A map that opens could still **fail to save** |
| A5 | Answer-record size, write | `desktop/proficiency-store.cjs:27` | **5,000,000 bytes** | **(measured)** 10,000 answers in the app's own record format, built with `recordAnswers` from `src/proficiency.js` using synthetic ids, is **1,825,173 bytes** (183 bytes each). **Fits.** The cap is reached at about 27,000 answers, sooner with longer ids |
| A6 | Answer-record size, import | `src/app.js:307` | **5,000,000 bytes** | Same as A5 |
| A7 | Answer-record entry count | `src/proficiency.js:31` | **50,000** entries | Not reached at 10,000 |
| A8 | Text lengths per skill | `src/model.js:63–71` | id ≤ 100, name ≤ 120, description ≤ 5,000, details and placement note ≤ 12,000 characters | Per skill, not per map, so unaffected by count. A long lesson is stored in `lesson`, which is not length-checked (§4.2) |
| A9 | Coordinates | `src/model.js:74` | each within **±100,000** | See D3. Only reached if one domain has thousands of skills at the same level |
| A10 | Reference levels | `src/model.js:69`, `src/vortex.js:5,12` | `skillLevel` whole number **1–100**. Arranging throws "needs more than 100 distinct levels" when the longest prerequisite chain exceeds 99 steps | See §D |
| A11 | Browser-storage quota (draft, sessions, panel state) | Chromium, not app code | not set by the app; **measured in Task 3** | `cache()` (`app.js:35`) stores the whole map as compact JSON on every change. It catches the failure and says "Draft cache unavailable". The robotics map already comes near it (PLATFORM.md §5.3). A 10,000-skill draft is expected **not to fit** |

## B. Rendering (`src/viewer.js`)

| # | What | Where | How it works today | Expected effect at 10,000 |
| --- | --- | --- | --- | --- |
| B1 | Spheres | `viewer.js:141–144` | **One `Mesh` and one `MeshStandardMaterial` per skill**, sharing one geometry (`:25`, 24×16 segments, 768 triangles). Materials are `transparent:true`, so three.js sorts them by depth every frame | **10,000 draw calls** and a 10,000-item sort per frame. Only the halos use instancing today (`:46`, `InstancedMesh`), which proves the technique works here |
| B2 | Connection lines and arrowheads | `viewer.js:148–161` | Per visible edge: **one `Line` + its own geometry + its own material**, and for non-`related` edges **one cone `Mesh` + its own geometry + material** | With "Selected connections only" on (the default, `index.html`), only the selected skill's edges are drawn: cheap. With it **off**, every edge is drawn: about 23,000 edges means **up to about 46,000 draw calls**. Expected to be unusable |
| B3 | Full rebuild on every selection | `app.js:30` (sphere click) and `app.js:107` (list click) → `render()` `app.js:93` → `viewer.setGraph` `viewer.js:239` | `setGraph` deep-copies the whole map (`JSON.parse(JSON.stringify)`), then `rebuild()` (`:137`) disposes **every** sphere, material, line and nameplate and creates them again | A click-to-card delay that grows with N. Also 10,000 material creations per click |
| B4 | Rebuild while dragging | `viewer.js:223` | In edit mode, every `pointermove` while dragging a sphere calls `rebuild()` | Dragging becomes a slideshow at large N |
| B5 | Picking (clicking a sphere) | `viewer.js:215, 224` | `Raycaster.intersectObjects(objects)`: a bounding-sphere test against every sphere, then triangles for hits | O(N) per click. Expected to stay in milliseconds at 10,000 |
| B6 | Per-frame whole-map work | `viewer.js:190` | `draw()` computes `Math.max(1000,...objects.map(o=>o.position.length()))`: every sphere, every frame | O(N) per frame. Spreading 10,000 values is fine; very large N (around 100,000+) risks a "too many arguments" error |
| B7 | Navigation distance | `viewer.js:114`, `camera.js:33` | `nearestAhead` checks every sphere. It runs on every OrbitControls `change` (`:118–120`), i.e. every orbit frame, and on every wheel event | O(N) per orbit frame, on top of B6 |
| B8 | Typical spacing | `viewer.js:171`, `camera.js:44` | Samples 256 spheres against all N | 256 × N ≈ 2.6 million distance checks per rebuild at 10,000. Tens of milliseconds, only when positions change |
| B9 | Selection lookups | `viewer.js:90` (`meshFor`: `objects.find`) | Linear search, run on every wheel event through `anchored()` | O(N) per wheel event |
| B10 | Undo and edit rebuilds | `viewer.js:172–180` | `updatePositions` loops every sphere and visible connection | O(N) |

## C. Nameplates (`src/viewer.js`, `src/nameplates.js`)

| # | What | Where | How it works today | Expected effect at 10,000 |
| --- | --- | --- | --- | --- |
| C1 | One HTML element per skill | `viewer.js:145` | A `div.node-label` per skill in `#labels`, recreated on every rebuild (B3) | 10,000 DOM elements, recreated per click |
| C2 | Repositioned every camera move | `viewer.js:197–208` | For **every** label, each frame the camera moves: a 3D projection, a matrix multiply, `nameplateProjection` (`nameplates.js:4`), then **three style writes** (`left`, `top`, `transform`) | **Likely the largest per-frame cost:** up to 30,000 style writes per frame, then browser layout and paint of 10,000 elements. Labels behind the camera are hidden, but still visited. Labels can be switched off (`show-labels`), which the measurement should also try |

## D. Levels and the spiral (`src/vortex.js`)

- **How levels are derived.** `referenceLevels` (`vortex.js:3–16`) takes the prerequisite depth
  (longest chain of `prerequisite` links below a skill, `model.js:89–108`). With `maximum` the
  deepest depth, `step = min(3, 99/maximum)`, a new level is `1 + floor(step × depth)`, and each
  skill must sit at least one level above every prerequisite. **Any chain deeper than 99 steps
  throws** (`vortex.js:5`), and so does any skill that cannot fit below 100 (`:12`).
- **What decides it is chain depth, not skill count.** Adding skills side by side costs no
  levels. Only longer chains of prerequisites do. For reference: the Robotics V3 map has 381
  entries and its **deepest entry is 22 prerequisite steps** from a root
  (`authoring/robotics-v3/I05-Audit.md`, headline). The master's measured depth is in Task 2.
- **Estimate for 10,000.** If a larger atlas keeps the same kind of structure (foundations, then
  applied layers), depth grows with how many layers a subject stacks, not with how many skills
  sit beside each other. A 10,000-skill atlas made of today's subjects, extended in breadth, would
  likely stay well under 99 steps. A deliberately deep curriculum, such as a university
  mathematics sequence authored step by step, could pass 99. **This is a judgement, not a
  measurement.** Task 2 measures the real master's depth and depth distribution, and the generator
  reproduces it.
- **Level spacing is already squeezed.** Once the deepest chain is over 33 steps, `step` drops
  below 3, so neighbouring depths share nearby levels. Past 99 there is no room at all.
- **Height and radius.** Height is `(level − 1) × 64` (`:37`): at most 6,336 units. Peers at the
  same domain and level fill 3 to 12 columns (`:32`), then add rows **70 units further out per
  row** (`:36`). A domain with, say, 1,000 skills at one level would need about 200 rows, reaching
  about 14,000 units out. That is still inside ±100,000 (A9) but visually far outside the spiral.
  Radius would pass ±100,000 only with about 4,200+ peers in one group.
- **Cost.** `arrangeVortex` is a sort plus a few passes, then `validate`, so O(N log N). Expected to
  be fast. It goes through `replace`/`commit` (`app.js:225`), so it also pays the whole-map copy
  costs in §F. Measured in Task 3.

## E. Search, lists, review, highlighting, prerequisite chain

| # | What | Where | Current behaviour | Expected effect at 10,000 |
| --- | --- | --- | --- | --- |
| E1 | Find box | `src/find.js:4–15` | One pass over all names per keystroke, then sort the matches; shows 8 | O(N) per keystroke. Fine |
| E2 | Side-panel list | `app.js:103–110` | On **every** `render()` (every click, answer and edit): filters all names, sorts with `localeCompare`, **deletes and recreates one button per skill** | 10,000 buttons rebuilt per click, plus an O(N log N) locale sort |
| E3 | List search box | `app.js:153` | Rebuilds the whole list on every keystroke | Same as E2, per keystroke |
| E4 | Edit-mode connection target | `app.js:149` | A `<select>` with **an `<option>` for every other skill**, rebuilt on every render in edit mode | 10,000 options per render in edit mode |
| E5 | Inspector connections | `app.js:139–141` | Filters all edges, then `graph.nodes.find` twice per edge | O(E + N × degree). Small |
| E6 | Card details | `app.js:462–463, 504–505` | Builds a name map of all nodes and filters all edges per open | O(N + E) per card. Fine |
| E7 | Review queue | `src/review.js:25–29` | Sorts every skill by height, name (`localeCompare`), id | O(N log N) once per session start |
| E8 | Review progress | `src/review.js:97–103` | On every step: filters the whole queue for answered items, builds height keys for all nodes, collects distinct heights and the whole height group | O(N) **per answer** |
| E9 | Review session storage | `src/review.js:152–154` | Each session stores its **full queue of ids** (and visited list) as JSON in browser storage. Up to 8 sessions are kept, all in one key | About 10,000 ids × about 20 characters ≈ 200 KB per session, up to 8, **sharing the browser-storage quota with the draft** (A11) |
| E10 | Answering in a review | `app.js:523` → `commit` (§F) | Each answer is a full map commit | Every answer pays the §F costs |
| E11 | Highlighting | `src/highlight.js`, `viewer.js:34–57` | One pass over the nodes; halos are **instanced** | Fine |
| E12 | Prerequisite chain | `src/prerequisites.js:15–43` | Builds an index of all edges, then a breadth-first walk | O(E) per open. Fine |
| E13 | Pulse | `viewer.js:65–81` | Every frame, loops the spheres marked Yes and edits their materials | O(answered-Yes) per frame. Fine, because the materials are separate (B1). Instancing would need per-instance colour instead |

## F. Whole-map copies on every change (`src/app.js`)

| # | What | Where | Current behaviour | Expected effect at 10,000 |
| --- | --- | --- | --- | --- |
| F1 | Every change or answer | `app.js:86` (`commit`) | Deep copy of the map (`clone`, a JSON round trip, `model.js:8`) → mutate → `normalize` (validate + another copy + validate) → **another copy pushed to history** → `cache()` (serialise the whole map to browser storage) → `render()` (B3 + E2) | At least 3 full copies, 2 validations, 1 serialisation and 1 full rebuild **per click of Yes/No**. Expected to take seconds at 10,000 with lessons |
| F2 | Undo history | `app.js:86, 91` | **Up to 50 full copies** of the map kept in memory (`history`), plus `redo` | Memory about 50 × the in-memory map size. **Likely the first out-of-memory failure** with lesson-sized payloads (heap limit 3,586 MB, `00-baseline.md`) |
| F3 | Draft cache | `app.js:35` | Whole map as compact JSON into browser storage on every change | See A11 |
| F4 | Start-up draft restore | `app.js:28` | Parses and normalises the stored draft before anything is shown | Adds to start-up time; fails on the A1 cap if the draft is too big |

## G. Tests that assume today's sizes

| # | What | Where | Assumption |
| --- | --- | --- | --- |
| G1 | End-to-end waits | `tests/e2e-harness.mjs:54` | `waitFor` gives up after **20 s**. Opening a map waits for "Opened …" through it (`:59`). A large map that takes longer is reported as a timeout, not a slow open |
| G2 | Debug-protocol replies | `tests/e2e-harness.mjs:42` | Every CDP call must answer within **20 s**. A long `evaluate` on a large map fails |
| G3 | App start | `tests/e2e-harness.mjs:35` | 150 × 200 ms = **30 s** for the window to appear |
| G4 | Known large-map timeout | PLATFORM.md §10.2 | `review-e2e.mjs` with `SSS_ATLAS` already times out opening the 5.4 MB atlas late in its session |
| G5 | Whole-graph transfer | `tests/robotics-v3-e2e.mjs` (comment above `fromDraft`) | The tests avoid returning the whole graph over the debug protocol because 5 MB "stalls the connection" |
| G6 | Level range | `tests/vortex.test.mjs:12, 27–29` | Asserts levels 1–100, that a 101-step chain throws "more than 100", and that level 100 is the top |
| G7 | Camera limits | `tests/camera.test.mjs:90–106`, `tests/orbit.test.mjs:22–30` | Use `maxDistance: 20000`, the viewer's default (`viewer.js:19`), which `draw()` raises for larger maps (`:193`) |
| G8 | Node cap | none | **No test asserts the 5,000 / 20,000 caps or the 10 MB limits**, so raising them breaks no unit test, and nothing guards them |

## Ranking for measurement

Predicted in the order they will be hit as the map grows, all to be confirmed by Tasks 3 and 4:

1. **The 10 MB open/save cap (A3, A4):** hit near 3,300 skills at today's density.
2. **The 5,000-skill and 20,000-connection caps (A1, A2).**
3. **Browser-storage quota for the draft (A11)**, which fails softly with a message.
4. **Per-frame nameplate and draw-call cost (C2, B1)**, as frame rate.
5. **Whole-map copies and the 50-deep history (F1, F2)**, as click latency and memory.
6. **Full rebuild per selection (B3, E2)**, as click-to-card latency.
7. **Levels (A10)**: only if chains pass 99 steps, which depends on depth, not count.
