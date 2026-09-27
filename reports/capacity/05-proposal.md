# Capacity 05 — Re-architecture proposal for 10,000+ skills (Task 5)

**This is a proposal. Nothing in it is built.** JC decides the design. The build-out becomes a later
queue.

Every **measured** number comes from `00`–`04` in this folder, on one machine (Ryzen 7 9800X3D,
RTX 3090, 59 Hz display, so about 60 fps is the most any measurement can show). Anything about what a
fix *would* achieve is an **estimate**, marked as such. Each estimate can be checked by re-running
`authoring/stress/measure-app.mjs` on the same generated maps.

Words used below:

- **Size of work.** *Small*: a few hours, one or two files. *Medium*: a few days, several files and
  new tests. *Large*: a week or more, a new data format or a new rendering approach.
- **Draw call.** One separate instruction to the graphics card. Thousands per frame is slow even on a
  fast card.
- **Instancing.** Drawing thousands of identical shapes (spheres) with a single draw call. Each copy
  gets its own position and colour.

## Where things stand

| At 10,000 skills | Today | With only the caps raised (experiment) |
| --- | --- | --- |
| Can the map be opened? | **No**: "Map files must be smaller than 10 MB." (10 MB holds about 3,300 skeleton skills or 1,200 with lessons) | Yes, in 1.6–2.1 s |
| Orbiting frame rate | — | **10 fps** (worst 5%: 7.5). 30 fps with nameplates off |
| Clicking a sphere → card | — | 0.70–0.84 s |
| Each review answer | — | **1.05 s**. With lessons, 1.5–2.8 s and **the page crashes at answer 48** |
| Draft cache | — | Works for skeleton maps. **Fails for lesson maps ≥ 8,000**, silently when the map is opened |
| Levels | not reached: deepest chain 23, levels up to 70 | same |

The three biggest problems, in the order they hurt:

1. **Rendering.** It is too slow to navigate at 8,000 skills and above.
2. **Whole-map copies on every change, with a 50-deep Undo history.** They make answers slow, and
   they crash the page on large maps with lessons.
3. **Storage of the draft.** It hits the browser-storage ceiling and fails without saying so.

The file-size and count caps come fourth. They are the first thing you hit, but the cheapest to fix.

---

## 1. One file or many

**Evidence.**

- Today every large map is refused by the 10 MB check (`03-current-app.md`).
- With the caps raised, a single file of **98.8 MB (12,000 skills with lessons) opened in 2.55 s and
  saved in 1.47 s**, with no errors (`04-raised-limits.md`).
- **None of the problems measured in Task 4 comes from the file being one file.** They come from what
  the app does with the whole map once it is in memory:
  - drawing every skill every frame;
  - copying the whole map on every change;
  - storing the whole map as one draft.
- Lesson payloads are about 63% of a full map's bytes: 8,230 against 3,050 bytes per skill
  (`03-current-app.md`).

| Option | What it means | Size | Trade-offs | Risk to existing data |
| --- | --- | --- | --- | --- |
| **A. One file, raised caps** | Keep today's format. Raise the caps to a deliberate ceiling with headroom, for example 25,000 skills, 100,000 connections, 200 MB. Add tests that guard the new numbers (none guard the old ones today, `01` G8) | Small | Simplest, and **measured to work** once the other problems are fixed. Every save rewrites the whole file (1–1.5 s at 10–12k), and OneDrive re-syncs the whole file each time. Two people editing different subjects cannot merge their work | **Very low.** Same format, same ids and same `atlasFamily`, so answers, review keys (`datasetKey\|count\|hash`), positions and levels are untouched. The Robotics V3 importer is unaffected |
| **B. One file per subject, plus an index** | An index file names the atlas, its `atlasFamily` and `datasetKey`, and lists subject files. Each subject file holds its skills. Connections between subjects live in the index, or in the file of the skill they point to. The app loads them all together | Large | Saves only the subject that changed, and makes subject-by-subject authoring and review possible. **But it does not make the app faster:** all files are still loaded into one map in memory. It needs a new loader, cross-file validation (no loop can span files; no missing targets), a new save path, and changes to every `authoring/apply-*.mjs` merge script and to the tests that read one file | **Medium.** Answers are safe if every id and the `atlasFamily` stay exactly the same. The review key stays the same only if the whole atlas is loaded; opening one subject alone gives a different key and a separate review. Needs a one-time conversion of the real master, the first time the real map would be rewritten, which must be proven reversible |
| **C. One file for structure, lesson content alongside** | The map file keeps skills, connections, positions and levels. Lesson payloads go into a companion file (or one per edition), keyed by skill id, loaded when a card is opened | Medium | Shrinks the map in memory by about 60–65% for lesson maps. That makes the draft and Undo copies correspondingly smaller (**estimate**, from the measured byte split), and keeps editions as separate files, which the Robotics V3 packages already are. Card opening needs the companion file | **Low to medium.** Structure, answers and review keys are unchanged. The Robotics V3 importer writes the lesson half to its own file instead of into `node.lesson`, and its preservation gates (signatures of node order, edges, layout and proficiency) still apply to the structure file |

**Recommendation: A now. Keep C as the next step if lesson-heavy maps become the norm. Do not do
B yet.**

The measurements show one big file is not what breaks; B is a large project that fixes none of the
measured problems. B becomes worth it only if the atlas is authored subject-by-subject by different
people, or if OneDrive syncing of a 30–100 MB file on every save proves to be a real problem. The
latter is a separate question on the NOT-QUEUED list.

---

## 2. Rendering: 10,000+ spheres, connections and nameplates

**Evidence** (`04-raised-limits.md`, nameplates on / off):

| Skills | 2,000 | 5,000 | 8,000 | 10,000 | 12,000 |
| --- | ---: | ---: | ---: | ---: | ---: |
| fps with nameplates on | 60 | 30 | 15 | 10 | 8.6 |
| fps with nameplates off | 60 | 60 | 30 | 30 | 20 |

**Two causes, each about half the frame time at 10,000:**

- **Nameplates.** One HTML element per skill is repositioned on every camera move: up to 30,000
  style writes per frame (`01` C2). Switching them off doubles the frame rate.
- **One draw call per sphere,** each with its own material (`01` B1), plus loops over every sphere
  on every frame (`01` B6, B7).

Frame cost depended only on the number of skills, not on lesson size.

| Option | What it means | Size | Trade-offs | Risk to data |
| --- | --- | --- | --- | --- |
| **R1. Show only readable nameplates** | Skip nameplates whose sphere is smaller than a few pixels on screen (at **Fit**, spheres are about 1 px, `03`), or show only the nearest few hundred. Reuse elements instead of creating one per skill | Small | Names appear as you fly closer, which is also easier to read than 10,000 overlapping names. **Estimate:** close to the "nameplates off" row, about 30 fps at 10,000. To be measured | None (display only) |
| **R2. Instanced spheres** | Draw all spheres with one `InstancedMesh`, with a colour per instance. The app already does this for highlight halos (`viewer.js:46`). Clicking uses three.js's instance picking. The pulse updates instance colours | Medium | One draw call instead of 10,000. **Estimate:** together with R1, 60 fps at 10,000 on this machine, to be measured. The pulse and selection-highlight code must be rewritten | None (display only; positions are read, never written) |
| **R3. Remove per-frame whole-map loops** | Compute the map's reach and extent only when positions change (`viewer.js:190`). Look up the nearest sphere ahead with a spatial grid, or only when the camera stops (`camera.js:33`) | Small | Small gain alone; needed so R1 and R2 are not held back | None |
| **R4. Merge connection lines** | Draw all visible connections as one line batch and one batch of arrowheads | Medium | Only matters with "Selected connections only" switched **off**. That was **not measured**; by the code it would be about 51,700 draw calls at 10,000: 29,044 lines plus 22,644 arrowheads, because related links have none (`01` B2) | None |
| **R5. Level of detail** | Show whole subjects or strands as clusters from far away, and individual spheres close up | Large | Best visual result for 50,000+, but not needed for 10,000–12,000 | None |

**Recommendation: R1 + R3 first (small, biggest measured lever), then R2.** Re-measure after each.
Keep R4 until someone turns on all connections at scale, and R5 until well beyond 12,000.

**Also: stop rebuilding everything on every click.** Click-to-card is 0.70–0.84 s at 10,000 because
`render()` rebuilds the whole scene and the whole side list (`01` B3, E2). The list filter costs
146–155 ms per keystroke, while the Find box stays at about 20 ms because it shows only 8 results.

- **Update in place:** change only the selected sphere and its neighbours. *Medium.*
- **Draw only visible list rows:** a "virtual" list. *Small to medium.*
- **Data risk:** none.

---

## 3. Storage: draft, review sessions and answers

**Evidence.**

- The **draft** (the whole map as compact JSON in one browser-storage value) was cached up to 36.9 M
  characters.
- The **measured ceiling for one value is 52.3 M characters.**
- 8,000 / 10,000 / 12,000-skill lesson maps (59–89 M characters) **are not cached**. The warning is
  **overwritten on open** (`app.js:91`) and appears only after the next change.
- **Review sessions** are about 12 characters per skill (120 K at 10,000), up to 8 kept. They are not
  a problem.
- **Answers** live in one JSON file per atlas family on disk: 1.8 MB for 10,000 answers (`01` A5,
  measured). The 5 MB cap is reached at about 27,000 answers.

| Option | What it means | Size | Trade-offs | Risk to data |
| --- | --- | --- | --- | --- |
| **S1. Say it out loud** | Show the "Draft cache unavailable" warning when a map is opened too (keep it visible, not overwritten) | Small | Fixes the silent part only | None |
| **S2. Draft on disk** | Keep the draft as a file in the app's own folder (`%APPDATA%\skill-solar-system\drafts\`). It would be written atomically through the same door the answer records already use (`desktop/proficiency-store.cjs` pattern), instead of browser storage | Medium | No browser ceiling. Writes happen in the background, so they don't block the page. It is covered by the new `Backup-User-Data.cmd`, which copies that whole folder. Needs one new bridge function and a one-time move of any existing draft | **Low.** On first start, the new version reads the old draft from browser storage, writes it to disk, and only then removes the old one. Answers are not involved |
| **S3. Smaller drafts** | Store only what differs from the last opened or saved file, instead of the whole map | Medium to large | Very small drafts, but recovering a draft then needs the original file, and that is fragile if the file moved | Medium (recovery depends on two things) |
| **Review sessions** | Keep in browser storage | — | Measured small | — |
| **Answers** | Keep today's per-family file. Raise the 5 MB cap to about 20 MB only if an atlas passes about 25,000 answered skills | Small, later | Already separate from maps, which is exactly right at scale | None now |

**Recommendation: S1 immediately (small), then S2.** Leave review sessions and answers where they are.

---

## 4. Levels: does the 1–100 range need to grow?

**Evidence.**

- Levels come from the **depth of prerequisite chains, not the number of skills** (`01` §D).
- **Both real maps have a deepest chain of 23**, although one is 4.6 times larger. The master reaches
  level 70 (`02`).
- A chain deeper than 99 steps throws "needs more than 100 distinct levels" (`vortex.js:5`).
- Chains deeper than 33 already squeeze the spacing (`step = min(3, 99/depth)`).

| Option | What it means | Size | Trade-offs | Risk to saved levels |
| --- | --- | --- | --- | --- |
| **L1. Keep 1–100** | No change. Add a notice when the deepest chain passes about 66, so the limit is visible before it bites | Small | Enough for an atlas that grows in breadth, which the real maps do | None |
| **L2. Raise the ceiling (for example 1–1,000)** | Change the validator (`model.js:69`), the arrange code (`vortex.js:5,12`), the height scale, the inspector field, and the tests that assert 100 (`vortex.test.mjs:12,27–29`) | Small to medium | Needed only for a deliberately deep curriculum. The spiral gets taller unless height per level is scaled | **Low.** Every existing saved level (1–100) stays valid and unchanged. Levels change only if someone presses **Recalculate levels**, which already asks first |

**Recommendation: L1 now; L2 only when a real chain approaches 66 steps.** Existing saved levels are
safe either way.

---

## 5. Tests that need new size assumptions

| Test | Today's assumption | Change needed |
| --- | --- | --- |
| None | The 5,000 / 20,000 / 10 MB caps have **no test at all** (`01` G8) | Add unit tests that pin the new caps and messages, so they cannot drift silently |
| `tests/e2e-harness.mjs:42, 54, 35` | 20 s per step and per debug call; 30 s to start | Make these adjustable (for example an environment variable), so large-map runs report slowness instead of timing out |
| `tests/review-e2e.mjs` with `SSS_ATLAS` | Already times out on the 5.4 MB atlas (PLATFORM.md §10.2) | Revisit after the whole-map-copy fix, which is its likely cause (**estimate**) |
| `tests/robotics-v3-e2e.mjs` | Avoids sending the whole map over the debug protocol, because 5 MB "stalls the connection" | Keep that pattern. Every new large-map test should read small values, as `measure-app.mjs` does |
| `tests/vortex.test.mjs:12, 27–29` | Levels 1–100; 101-step chain throws | Change only if L2 is chosen |
| Any e2e test that reads `#labels .node-label` (the tools in this queue use it to find spheres) | One nameplate element per skill | Update if R1 hides or pools nameplates |
| New | — | A **size regression test** on a generated 10,000-skill skeleton map (`authoring/stress/generate-stress-map.mjs`): opens under the cap, a review answer below a time budget, memory flat after N answers. Assert counts that do not depend on the machine, such as draw calls (`renderer.info`), not fps |

---

## Also measured: the whole-map copy per change (the crash)

This is not one of the five required topics, but it is the **only thing that crashed**, so it gets its
own recommendation.

**Evidence.** Every change or answer copies the whole map about three times, and keeps one copy for
Undo, up to 50 (`app.js:86`).

| Map | Per review answer | Memory |
| --- | --- | --- |
| 10,000 skeleton | 1.05 s | +27.6 MB, levelling off at 1.55 GB after exactly 50 |
| 10,000 with lessons | 1.5 s rising to 2.8 s | +72 MB; **page crashed at answer 48 (3.94 GB)** |

| Option | What it means | Size | Trade-offs | Risk to data |
| --- | --- | --- | --- | --- |
| **U1. Undo within a memory budget** | Keep Undo steps until they would pass, say, 500 MB, instead of a fixed 50 | Small | **Stops the crash** (the plateau becomes the budget). Fewer Undo steps on huge maps | None: Undo only |
| **U2. A fast path for answers** | Recording Yes/No changes one field on one skill. Update it in place, and validate only that skill, instead of copying and re-validating the whole map | Medium | **Estimate:** answer time from about 1 s to tens of milliseconds at 10,000. The shared-record write (`shareChanges`) must still see the before and after values, so this needs careful tests | **Medium: answers.** The answer path must keep writing the shared record exactly as today. Existing tests (`proficiency`, `review`, `shared-e2e`) cover it and must pass unchanged |
| **U3. Undo as changes, not copies** | Store what each step changed (and how to reverse it), not a full map | Medium to large | Small memory, fast. Every editing action needs a matching undo record | Low to medium: Undo and Redo behaviour must be re-tested |

**Recommendation: U1 immediately; then U2; U3 only if editing (not answering) is also slow at scale.**

---

## Recommended build order

**Before any step: run `Backup-User-Data.cmd`.** Steps 1–3 change app code only and are developed
and measured against generated maps in `C:\sss-scratch\stress\`.

| Step | Work | Size | Touches JC's real data? | Checked by |
| --- | --- | --- | --- | --- |
| 1 | **Safety:** U1 (Undo memory budget) and S1 (visible draft warning) | Small | No | A 10,000-lesson map survives 100 answers; the warning shows on open |
| 2 | **Rendering, cheap half:** R1 (readable nameplates only) and R3 (no per-frame whole-map loops) | Small | No | fps at 5k / 10k / 12k against `04` |
| 3 | **Responsiveness:** U2 (answer fast path), in-place selection, virtual list | Medium | No: runs only on synthetic and reference maps. Answers are the risk area, so all proficiency, review and shared-record tests must pass unchanged | Answer time and click-to-card against `04` |
| 4 | **Raise the caps (A)** to a tested ceiling, with guard tests; widen the e2e harness timeouts | Small | **Not rewritten.** The real master is already under today's caps and keeps the same format; nothing is converted | Unit tests plus the Task 4 measurements on `main` |
| 5 | **R2 (instanced spheres)** | Medium | No | fps at 10k / 12k |
| 6 | **S2 (draft on disk)** | Medium | **Yes: the first time JC's real app profile is touched.** On first start of this version, an existing draft moves from browser storage (`%APPDATA%\skill-solar-system\Local Storage\`) to a draft file in the same folder. Take a backup first; the move must copy before it removes | A planted old-style draft is recovered in an isolated profile before any real launch |
| 7 | *Optional:* **C (lesson content alongside the map)** | Medium | **Yes: the first time JC's real map files would be rewritten** (a one-time conversion). It must round-trip: converting and joining back gives the same skills, connections, positions, levels and answers, checked by the same signatures the Robotics V3 importer uses | Round-trip check on a scratch copy first |
| — | *Not recommended now:* **B (one file per subject)**, R4, R5, L2 | — | — | Revisit when needed |

**When JC's real data is first touched:**

- **Steps 1–5:** never. They are app-code changes measured on synthetic maps. Opening the real master
  in the new version reads it exactly as today.
- **Step 6:** the first change to the real **app profile** (the draft moves).
- **Step 7:** the first rewrite of real **map files**, and only if C is chosen.

**Answer records are never converted by any step.**
