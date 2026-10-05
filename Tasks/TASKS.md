# TASKS — Skill Solar System — Capacity safety and the hardware-evidence field

Steps 2 and 3 of `reports/scope/07-checkpoint.md` §2, approved by JC on 2026-10-05 ("continue with
all of them"). Step 4 (the Robotics V3 merge) is the first step that changes JC's real data, so it is
**not** in this queue: it gets its own queue and JC's go-ahead.

The previous queue (scope foundation) is preserved in Git: merged in PR #19, its final queue file at
`d5d7a65`.

## Rules for Claude Code (read first, every session)
- Read `docs/PLATFORM.md`, `reports/capacity/05-proposal.md` and `reports/scope/05-decisions.md`
  (decision 14) first.
- Work on branch `capacity-safety`, created from an up-to-date `main`. Never commit to `main`.
  Never force-push. Commit after each task. When every task is done and every test passes, open a
  pull request and merge it (JC asked for this), then update local `main`.
- **Never touch JC's real data.** Every app launch uses the e2e harness's isolated profile, and
  generated maps live only in `C:\sss-scratch\stress\`. `Maps/` is read-only. In particular,
  `apply-lessons.mjs` runs **only as a dry run**: rewriting the Robotics V3 export waits for the
  merge queue.
- Change only what each task names. Keep every existing test passing; change an existing test only
  where a task changes the behaviour it checks, and say so.
- If a STOP condition triggers, mark the task `[BLOCKED]`, write what was found, commit, and stop.
- JC is still learning to read code. Explain anything technical in one plain sentence.

---

## [x] Task 1 — Undo within a memory budget (capacity proposal U1)
**Do:** Replace the fixed 50-step Undo history with a budget. The number of kept steps is
`clamp(floor(budget / map size), 5, 50)`, with a budget of about 500 MB of map text, so small maps
keep 50 steps and very large maps keep fewer. Trim Redo the same way. Put the rule in a small pure
module with unit tests.
**Check:** Unit tests. Regenerate `stress-10000-full` in scratch and repeat the capacity queue's
review-answer test (`reports/capacity/04-raised-limits.md`) on a build with the caps raised
(Task 4): 100 answers must survive, and memory must level off.
**STOP if:** any existing test fails.
**Result:** Done.
- New `src/history.js`: steps kept = clamp(floor(500,000,000 / map characters), 5, 50), used for
  Undo and Redo in `src/app.js`. A small map keeps 50 steps; the 10,000-skill full map
  (73,739,503 characters) keeps 6. New `tests/history.test.mjs` (3 tests).
- Re-run of the capacity review-answer test on `stress-10000-full` (scratch, isolated profile):
  **100 answers survived, no page errors.** Page memory after garbage collection stayed at
  **687–689 MB from answer 10 to answer 100** (567 MB after opening). Before this change the same
  map climbed about 72 MB per answer and the page crashed on answer 48. Time per answer: median
  1.47 s (1.36–1.68 s), no longer rising.

## [x] Task 2 — Make the draft warning visible (proposal S1)
**Do:** When the draft cannot be cached, the warning must stay visible after **Open map**, Undo and
Redo, not be overwritten by the next status message. Add an end-to-end check.
**Result:** Done.
- `src/app.js`: `replace()` (Open map) and `travel()` (Undo/Redo) now add the warning to their own
  status message when `cache()` fails; the edit path uses the same text (`DRAFT_WARNING`).
- New `tests/draft-warning-e2e.mjs` (6 checks, all pass) simulates a full browser storage in the
  isolated profile: the warning shows after Open map, an edit, Undo and Redo, and disappears once
  storage works again.

## [x] Task 3 — Cheaper frames (proposal R1 and R3)
**Do:**
- Show a nameplate only when it is large enough to read (the selected skill's always shows).
- Stop recomputing whole-map values on every frame: the map's reach and the point list used for
  navigation are computed only when positions change.
Do not change camera behaviour.
**Check:** Existing camera, orbit, pan, find, tour and deselect tests pass. Re-measure frame rate on
generated 5k, 10k and 12k maps (with the raised caps) against `04-raised-limits.md`.
**Result:** Done.
- `src/nameplates.js`: `nameplateReadable` hides a name whose text would be under 4 px; the selected
  skill's always shows. `src/viewer.js` checks this before any projection or style work, and writes
  `hidden` only when it changes.
- `src/viewer.js`: the map's reach and the sphere centres used for navigation are computed in
  `updatePositions` (when positions change), not on every frame or camera move. Camera code unchanged.
- Orbit, 10 s, skeleton maps, median of 3 runs, same build process and machine (raw:
  `C:sss-scratchstress	3-before.jsonl`, `t3-after.jsonl`):

  | Map | Before, names on (median / worst 5%) | After, names on | Before, names off | After, names off |
  | --- | --- | --- | --- | --- |
  | 5,000 | 20 / 15 fps | **59.9 / 59.5** | 59.9 / 30 | 59.9 / 59.5 |
  | 10,000 | 10 / 7.5 fps | **59.9 / 29.9** | 29.9 / 20 | 59.9 / 29.9 |
  | 12,000 | 8.6 / 5.4 fps | **59.5 / 29.9** | 20 / 15 | 59.5 / 29.9 |

  About 60 fps is this screen's ceiling. The "names off" gain comes from the R3 caching.
- Not measured after the change: click-to-card. The measuring script finds a sphere to click by its
  visible nameplate, and at the whole-map view none are now large enough to show. Before: 0.27 s at
  5k, 0.55 s at 10k, 0.65 s at 12k.
- `tests/pan-e2e.mjs` (changed because the behaviour it relied on changed): it measures distance with
  nameplates, so it now moves in from Home until they appear, still in the steady-rate range; the
  rates are as before (1,384 and 1,389 of 1,400 units/s). Tour, README and PLATFORM.md mention
  hidden small names. 2 new unit tests in `tests/nameplates.test.mjs`.
- Unit tests 229 / 223 pass / 6 skip / 0 fail. All 12 end-to-end suites pass.

## [x] Task 4 — Raise the size caps to a tested ceiling, with guard tests (proposal step 4)
**Do:**
- One shared set of limits: **25,000 skills, 100,000 connections, 150 MB** to open or save. 150 MB
  is the ceiling the experiment measured working (98.8 MB opened and saved).
- Add unit tests that pin the limits and their messages, and check the desktop save cap matches.
- Make the e2e harness timeouts adjustable for large maps.
- Update PLATFORM.md wherever it states the old limits.
**Result:** Done.
- `LIMITS = { nodes: 25000, edges: 100000, mapBytes: 150_000_000 }` in `src/model.js` is used by
  the validator and the Open map check. `desktop/main.cjs` has `MAX_MAP_BYTES = 150_000_000` for
  saving.
- New `tests/limits.test.mjs` (4 tests): it pins the values and the messages, checks that a
  6,000-skill map now validates, and checks that the save and open caps match, with no `10_000_000`
  left.
- `tests/e2e-harness.mjs` timeouts now follow `SSS_E2E_TIMEOUT_MS` (default 20 s, unchanged).
- PLATFORM.md (§3.2, §4.1, §5.3, §7.1, §10.2), README, a generator comment and a test name were
  updated.
- Unit tests 224 / 218 pass / 6 skip / 0 fail.

## [x] Task 5 — The `requires_physical_evidence` field (decision 14)
**Do:**
- **Card:** when a lesson's card summary says whether real evidence is required, show the hardware
  line from that; otherwise fall back to today's word pattern.
- **Importer:** copy `requires_physical_evidence` and `evidence_kind` from a lesson into its card
  summary. For lessons without the field (editions 01–06), take them from a reviewed table
  `authoring/robotics-v3/evidence-overrides.json`, never by editing a stored lesson. Report every
  lesson that has neither.
- **The table** starts exactly from today's pattern result, so no card changes. Cards whose
  demonstration looks physical but which show no line are listed for JC's review, not changed.
- **Tests:**
  - the field overrides the pattern;
  - the table covers all 298 authored entries and matches today's display;
  - Q06 and V07 stay `true`;
  - the importer copies the field.
- Run `apply-lessons.mjs` as a **dry run only** and record that its gates pass.
**Result:** Done.
- `src/lesson.js`: new `needsRealEvidence(node)`. A boolean `lessonCard.requiresPhysicalEvidence`
  decides; without it, the old word pattern is used, so no card changes today.
- Importer (`lessons.mjs`, `apply-lessons.mjs`): copies `requires_physical_evidence` and
  `evidence_kind` from a lesson into its card summary, or takes them from the table for older
  editions; the report counts each source and lists any lesson with neither. Stored lessons are
  never edited.
- New `authoring/robotics-v3/evidence-overrides.json`: 298 entries made from today's pattern result
  (124 need real evidence, including Q06 and V07). It also lists 44 cards from editions 01–02 whose
  demonstration looks physical but which show no hardware line, **for JC to review**; none changed.
- 3 new tests in `tests/robotics-v3-lessons.test.mjs` (field beats pattern; the table covers all
  298 and matches today's display, Q06 and V07 true; the importer copies the field).
- Dry run: `result: passed`, idempotent, 0 existing payloads changed, evidence 298 from the table
  and 0 missing. The three `Maps/Robotics-v3` files were fingerprinted before and after: unchanged.
  (One fix during the task: the importer's second, idempotency pass was not given the table.)
- Unit tests 227 / 221 pass / 6 skip / 0 fail.

## [x] Task 6 — Measure, document, merge
**Do:**
- Run all unit and end-to-end tests.
- Write `reports/capacity/06-safety-results.md` with before and after numbers.
- Update PLATFORM.md.
- Open a pull request, merge it, and update local `main`.
**Result:** Done.
- Unit tests 229 / 223 pass / 6 skip / 0 fail. End to end: all 12 suites, 237 checks pass (one run
  had a launch hiccup in `shared-e2e.mjs`; the rerun passed; noted in the report).
- `reports/capacity/06-safety-results.md`: before and after for every task.
- PLATFORM.md: file table (new `history.js`, line counts), §2.3 the overrides table, §3.4 hidden
  small names, §3.5 the evidence field, §6.2–6.3 the importer's card fields and `evidence` summary,
  §8.1/§8.3 test counts (the e2e total was stale at 182; it is 237), §10.2 frame rate.
- Real maps unchanged: master `8e170740…`, V3 export `687f0916…` (SHA-256, checked at the end).
- Pull request opened and merged; local `main` updated.
