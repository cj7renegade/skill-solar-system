# Capacity 06 — Safety results, before and after

Queue `capacity-safety` (steps 2 and 3 of `reports/scope/07-checkpoint.md` §2), run 2026-10-05.
Everything here was measured on the same machine as `00-baseline.md` (Ryzen 7 9800X3D, RTX 3090,
59 Hz display, so **about 60 fps is the ceiling**). Every run used a fresh isolated profile, and
every map was generated in `C:\sss-scratch\stress\`. No real map or real profile was opened.

## Summary

| What | Before | After |
| --- | --- | --- |
| Largest map that opens and saves | 5,000 skills, 10 MB | **25,000 skills, 100,000 connections, 150 MB** |
| Answering a review on the 10,000-skill full map | memory +72 MB per answer, **page crashed on answer 48** | **100 answers, memory flat at 687–689 MB** |
| Draft warning when browser storage is full | hidden by the next message after Open map, Undo or Redo | **stays visible** after each (checked end to end) |
| Moving the camera, names on, 5,000 / 10,000 / 12,000 skills | 20 / 10 / 8.6 fps | **59.9 / 59.9 / 59.5 fps** |
| Whether a card needs real hardware | guessed from wording only | **stated by the lesson or a reviewed table**, wording as fallback; no card changed |

## 1. Size caps (Task 4)

`LIMITS = { nodes: 25000, edges: 100000, mapBytes: 150_000_000 }` in `src/model.js`; the desktop save
cap `MAX_MAP_BYTES` in `desktop/main.cjs` is the same 150 MB, and a unit test keeps them equal.
150 MB is the ceiling `04-raised-limits.md` measured working (a 98.8 MB map opened and saved).
The draft in browser storage still tops out at about 52 million characters; larger maps open and
save normally but are not cached as a draft, and the app says so (§3).

## 2. Undo within a memory budget (Task 1)

Every answer or edit keeps a copy of the whole map for Undo. Before, 50 copies were kept whatever
the map's size. Now `src/history.js` keeps `clamp(floor(500,000,000 / map characters), 5, 50)`:
50 steps for any ordinary map (the robotics map is 2.7 MB), 6 for the 10,000-skill full map
(73,739,503 characters).

Review-answer test on `stress-10000-full` (the same test as `04-raised-limits.md`, run to 100):

| | Before (`04`) | After |
| --- | --- | --- |
| Answers survived | 47 | **100** |
| Page memory | 0.63 GB → 3.94 GB at answer 47, then crash | 567 MB after opening; **687 MB at answer 10, 688 MB at answer 100** |
| Time per answer | 1.5 s rising to 2.8 s | median 1.47 s (1.36–1.68 s), not rising |
| Page errors | page process died | none |

Raw: `C:\sss-scratch\stress\t1-undo-budget.json`.

## 3. Draft warning stays visible (Task 2)

When the draft cannot be stored, Open map, Undo and Redo now add *"Draft cache unavailable: save the
map to a JSON file now."* to their own message instead of replacing it. `tests/draft-warning-e2e.mjs`
fills browser storage on purpose inside the isolated profile and checks the warning after each
action, and that it disappears once storage works again (6 checks, pass).

## 4. Cheaper frames (Task 3)

Two changes, both display only:

- **Names too small to read are not drawn** (`nameplateReadable` in `src/nameplates.js`: text under
  4 px). They appear as the camera comes closer. The selected skill's name always shows.
- **Whole-map values are no longer recomputed each frame.** The map's reach and the list of sphere
  centres used for navigation speed are computed when positions change.

Orbit for 10 s, skeleton maps (frame cost is the same for skeleton and full maps, `04` §1), median
of 3 runs each, before and after on this branch:

| Map | Names on: before → after (median / worst 5%) | Names off: before → after |
| --- | --- | --- |
| 5,000 | 20 / 15 → **59.9 / 59.5** | 59.9 / 30 → 59.9 / 59.5 |
| 10,000 | 10 / 7.5 → **59.9 / 29.9** | 29.9 / 20 → 59.9 / 29.9 |
| 12,000 | 8.6 / 5.4 → **59.5 / 29.9** | 20 / 15 → 59.5 / 29.9 |

Raw: `C:\sss-scratch\stress\t3-before.jsonl`, `t3-after.jsonl`.

**Not measured after the change:** the time from clicking a sphere to its card. The measuring script
finds a sphere to click by its visible name, and at the whole-map view no name is large enough to
show any more. Before the change it was 0.27 s at 5,000, 0.55 s at 10,000 and 0.65 s at 12,000;
the code path it measures (rebuilding the whole scene on a click) did not change, so it is expected
to be the same. Measuring it again needs the script to pick a sphere another way.

## 5. The hardware-evidence field (Task 5)

- A lesson may now say `requires_physical_evidence` (true/false) and `evidence_kind`. The importer
  copies them into the card summary; the card uses them first and the old word pattern only as a
  fallback.
- Editions 01–06 do not carry the field, so `authoring/robotics-v3/evidence-overrides.json` gives it
  for all 298 authored entries. It was made from the pattern's current result (124 true, including
  `Q06` and `V07`), so **no card changes**. It lists 44 entries from editions 01–02 whose
  demonstration looks physical but which show no hardware line: **these are for JC to review**, and
  none was changed.
- Importer dry run: `result: passed`, idempotent, 0 existing lesson payloads changed, all
  signatures identical, evidence 298 from the table and 0 missing. The three `Maps/Robotics-v3`
  files had the same SHA-256 before and after: **nothing was written**. Writing the field into the
  real export waits for the V3 merge queue.

## 6. Tests

- Unit: 229 tests, 223 pass, 6 skipped (the same six as before, needing local files), 0 fail.
- End to end: all 12 suites pass, 237 checks, in isolated profiles. In one of the final runs the
  app window for `shared-e2e.mjs` did not start within the harness's 30 s wait; an immediate rerun
  passed everything. The harness's start wait is unchanged from `main`, so this is a launch hiccup
  that predates this queue (a likely cause is the random debug port colliding with the previous
  test's still-closing app). Worth hardening in a later queue.
- One existing test changed because the behaviour it relied on changed: `tests/pan-e2e.mjs` measures
  distance with names, so it now moves in from Home until names appear before measuring. The rates
  it checks are unchanged (1,384 and 1,389 of 1,400 units/s).

## What is still open

- **Click to card** is still a whole-scene rebuild (proposal "update in place").
- **Instanced spheres** (proposal R2) were not needed to reach 60 fps at 12,000 on this machine; a
  weaker graphics card may still need them.
- **Drafts above about 52 million characters** are not cached; the warning makes this visible, but
  a different draft store would remove the limit.
- **The 44 evidence-review cards** wait for JC.
