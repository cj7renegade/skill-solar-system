# TASKS — Skill Solar System — Capacity: stress test and re-architecture proposal

Goal: find out exactly what stops the app from holding **10,000 skills**, measure it, and propose
fixes. **This queue measures and proposes. It does not re-architect anything.** JC decides the
design from the proposal, and the build-out becomes a later queue.

## Rules for Claude Code (read first, every session)
- Read `docs/PLATFORM.md` first. It is the reference for how this repo works.
- Work top to bottom, one task at a time. Start at the first unchecked box.
- Work on branch `capacity-stress-test`, created from an up-to-date `main`. Never commit to `main`.
  Never merge. Never force-push. Never open or approve a pull request.
- The only exception is Task 4's throwaway branch `experiment/raised-limits`, described there.
- When a task is done: check its box, fill in its **Result** line, commit, and move on.
- If a STOP condition triggers, do NOT continue. Write what you found under **Result**, mark the
  task `[BLOCKED]`, commit, and end the session. If the branch for this queue does not exist yet,
  do not commit anywhere; just report.
- **Never touch JC's real data.** Every app launch uses the e2e harness's isolated profile. Never
  read from or write to `%APPDATA%\skill-solar-system\`, never open or modify anything in `Maps/`
  except reading `Maps/Skill-Solar-System.json` and the Robotics V3 export for statistics in Task 2.
- **Large generated files go outside the repo and outside OneDrive**, in `C:\sss-scratch\stress\`.
  Never commit generated maps.
- Synthetic maps must use their own atlas family `stress-test-synthetic`, so they can never share
  an answer record with a real map, and every synthetic node's `proficiency80` must be `null`.
- Do not change `src/`, `desktop/` or existing tests on this branch. Task 4's experiment branch is
  the only place limits may be raised.
- Environment: Windows, project at `C:\Users\hilli\OneDrive\Desktop\Skill Solar System`. Commands in
  PLATFORM.md are bash syntax; translate them for your shell without changing what they do.
- JC is still learning to read code. Explain anything technical in one plain sentence.

---

## [x] Task 0 — Starting state (read-only, except updating local main)
**Do:**
- `git fetch origin`. Confirm `origin/main` contains the housekeeping work (branch
  `housekeeping-2026-09`), i.e. JC has merged that pull request.
- Confirm the working tree is clean apart from `Tasks/TASKS.md`. Switch to `main`,
  `git pull --ff-only`, then create `capacity-stress-test`.
- Run `npm run build` and `npm test` and record the baseline result.
- Record the machine: CPU, RAM, GPU and driver, display resolution, Windows version, Node and
  Electron versions. Frame rates depend on hardware, so every later number needs this context.
- Create `C:\sss-scratch\stress\` and confirm it is not inside OneDrive.
- Write `reports/capacity/00-baseline.md`.
**STOP if:** housekeeping is not merged into `origin/main`; there are other uncommitted changes;
`git pull --ff-only` refuses; or tests fail.
**Result:** Done.
- Housekeeping is merged: `origin/main` = `c5c5e4c` (PR #16) and contains `f14c8c3`. The tree was
  clean apart from this file.
- Local `main` was fast-forwarded with `git fetch origin main:main`, because `git switch main`
  refuses with the TASKS.md edit. `capacity-stress-test` was created from `main` at `c5c5e4c`.
- Build passed; `npm test` 207 / 201 pass / 6 skip / 0 fail.
- Machine: Ryzen 7 9800X3D, 31.2 GB RAM, RTX 3090 (driver 32.0.15.9186, the GPU the app uses),
  1920×1080 at 59 Hz (so about 60 fps is the ceiling), Windows 11 26200, Node 24.15.0,
  Electron 44.2.0.
- `C:\sss-scratch\stress\` was created and is not in OneDrive.
See `reports/capacity/00-baseline.md`.

## [x] Task 1 — Inventory every limit and scale-sensitive spot (read-only)
**Do:** Read the code and list, with file and line, every place that caps size or will slow down
as skills grow. At minimum check:
- node, connection and text-length limits in `src/model.js`;
- the 10 MB open/save cap and 5 MB answer-record cap in `desktop/`;
- where the draft map and review sessions are stored (browser storage has its own size ceiling);
- how spheres, connection lines and arrowheads are created in `src/viewer.js` (one object per
  sphere or shared/instanced), and how picking (clicking a sphere) works;
- how nameplates are created and repositioned each frame (`src/nameplates.js`, `src/viewer.js`);
- the spiral and level code (`src/vortex.js`) and the **`skillLevel` range of 1–100**: estimate
  whether a 10,000-skill map with deeper prerequisite chains would need more than 100 levels,
  given how levels are currently derived from prerequisite depth;
- search, the prerequisite-chain walk, the review queue, highlighting, and the side-panel lists;
- e2e test timeouts that assume today's sizes.
For each, note what it is, the current value, and the expected effect at 10,000 skills.
Write `reports/capacity/01-limits-inventory.md`.
**Result:** Done. The report has seven groups (A–G) with file:line, current value and predicted
effect.
- Hard caps: 5,000 nodes / 20,000 edges (`model.js:60`); 10 MB open (`app.js:232`) and save
  (`main.cjs:26`), about 3,300 skills at the master's density; 5 MB record, which fits 10,000
  answers (measured 1.83 MB); levels 1–100 (throws past 99 chain steps, which depends on depth,
  not count).
- Scale costs: one mesh and material per sphere; one DOM nameplate per skill repositioned every
  camera frame; a full scene and list rebuild on every click; 3+ whole-map copies per answer; a
  50-deep full-copy Undo history; review progress O(N) per answer.
- No test guards the caps. The e2e harness gives up at 20 s.
See `reports/capacity/01-limits-inventory.md`.

## [x] Task 2 — Build a synthetic map generator
**Do:**
- Measure the real atlas's shape from `Maps/Skill-Solar-System.json` (read-only), without copying
  any of its content: connections per skill, the mix of prerequisite / supports / related links,
  prerequisite depth distribution, domain mix, and text-field lengths. Also measure lesson payload
  size from `Maps/Robotics-v3/Robotics-v3-Lessons.json`.
- Add `authoring/stress/generate-stress-map.mjs`. It must be deterministic (same seed, same file),
  produce maps with that realistic shape, guarantee no prerequisite loops, give every node a clearly
  synthetic id and name, use atlas family `stress-test-synthetic`, and leave every answer `null`.
- Generate into `C:\sss-scratch\stress\`, at **2,000 / 5,000 / 8,000 / 10,000 / 12,000** skills,
  each in two variants: **skeleton** (like today's master cards) and **full** (with lesson-sized
  payloads). 12,000 gives headroom above the target.
- Add a small unit test for the generator (determinism, no loops, requested counts, family, null
  answers). Record each generated file's size and connection count.
- Write `reports/capacity/02-generator.md`.
**Result:** Done.
- The master's shape was measured read-only (hashes unchanged): 2.91 links per skill (74/4/22%
  prerequisite/supports/related), depth max 23, 3,051 bytes per skill. V3 lessons average 5,640
  bytes.
- `authoring/stress/generate-stress-map.mjs` is deterministic (the regenerated 10k-full has the same
  SHA-256), loop-free by construction and checked with `levels()`, uses the family
  `stress-test-synthetic`, and leaves every answer null. At 1,769 skills it reproduces the master
  closely (5,129 vs 5,142 links, same depth, levels, radius and bytes per skill).
- Ten maps were written to `C:\sss-scratch\stress\`, from 6.1 MB (2k skeleton) to 98.8 MB (12k
  full); 10k = 29,044 links. Only the 2k skeleton is under the 10 MB open cap.
- New test `tests/stress-generator.test.mjs` (4 tests) passes; `npm test` is 211 / 205 pass / 6 skip
  / 0 fail.
See `reports/capacity/02-generator.md`.

## [x] Task 3 — Measure the app as it is today
**Do:** Using the e2e harness in an isolated profile, try to open each generated map. For each:
- If it is rejected, record which limit rejected it and the exact message.
- If it opens, measure (3 runs each, report the median): time to open and first frame; memory used
  by the app; frame rate while orbiting for 10 seconds (median and worst 5%); time from clicking a
  sphere to its card showing; search time; time for **Arrange level spiral**; save time and file
  size; whether the draft map saves successfully; time to start a review session.
- Also measure a copy of the real 1,769-skill master **in scratch** (copy it to scratch first,
  change its atlas family to `stress-test-synthetic` and clear its answers in the copy only; never
  open the real file) as today's reference point.
Write `reports/capacity/03-current-app.md` with one table per size.
**STOP if:** any run touches a real profile or real map. Performance failures are results, not
STOP conditions.
**Result:** Done; no real profile or real map was touched.
- Tool: `authoring/stress/measure-app.mjs`, which uses the isolated launcher and a fresh temporary
  profile per run, and refuses repo, OneDrive or APPDATA paths.
- Opens today: only the reference master copy (1,769) and the 2,000-skill skeleton. Everything
  else is rejected instantly by "Could not open map: Map files must be smaller than 10 MB." That
  check runs first, so the 5,000-skill and 20,000-connection caps are never reached. 10 MB holds
  about 3,300 skeleton skills or about 1,200 with lessons.
- What opens is fast. Medians of 3: open 0.30–0.36 s, orbit 60 fps (the display ceiling) with
  labels on and off, click-to-card 148–172 ms, arrange 258–308 ms, save 150–161 ms, review start
  191–201 ms, and the draft saves (5.5 M characters).
- Private memory grows from about 0.5 GB to 0.9 GB over one run.
See `reports/capacity/03-current-app.md`.

## [ ] Task 4 — Measure past today's limits (throwaway experiment)
**Do:**
- Create branch `experiment/raised-limits` from `capacity-stress-test`. On it, change **only the
  numeric caps** found in Task 1 (for example 50,000 skills, 150,000 connections, 150 MB file size),
  nothing else. Record the exact diff.
- Rebuild and repeat Task 3's measurements for the sizes that were rejected. Record what breaks
  next once the caps are gone: slow frames, storage failures, freezes, crashes.
- This branch is **never merged**. Push it so the measurements are reproducible, and label it in
  the report as an experiment. Switch back to `capacity-stress-test` and rebuild afterwards.
- Write `reports/capacity/04-raised-limits.md` on `capacity-stress-test`.
**Result:**

## [ ] Task 5 — Write the re-architecture proposal (no implementation)
**Do:** Write `reports/capacity/05-proposal.md` in plain language. For each bottleneck found in
Tasks 1–4:
- the measured evidence;
- two or three ways to fix it, with trade-offs and a rough size of work (small / medium / large);
- the risk each option carries for existing data: answers, review sessions, dataset keys,
  positions and levels, and the Robotics V3 import pipeline;
- a recommendation.
It must directly address:
1. **One file vs. many:** keep a single map file with raised limits, or split the atlas into one
   file per subject plus a small index file that loads them together with cross-file links.
2. **Rendering:** drawing 10,000+ spheres, connections and nameplates at a usable frame rate.
3. **Storage:** where the draft map, review sessions and answers should live at this size.
4. **Levels:** whether the 1–100 `skillLevel` range needs to grow, and what that means for
   existing saved levels.
5. **Tests:** which existing tests need new size assumptions.
End with a recommended build order, with the point at which JC's real maps would first be touched.
**Result:**

## [ ] Task 6 — Push and summarize
**Do:**
- Confirm no generated map, nothing from `Maps/`, `packages/`, `backups/`, `Archive/` or any
  answer or session data is in any commit.
- Push `capacity-stress-test`. Do not open a pull request.
- End with the plain-language summary: tasks finished or stopped and why, the three biggest
  bottlenecks in order, your recommended design in two or three sentences, branch and commit IDs,
  and every report file written.
**Result:**

---

## NOT QUEUED — needs JC's decision first
- Implementing any part of the proposal.
- Moving the repository out of OneDrive (scratch files already live outside it for this queue).
- The five structural questions in PLATFORM.md §10.3.
- Merging Robotics V3 into the master atlas; the `m-logic` answer conflict.
- Cleaning up merged branches.
