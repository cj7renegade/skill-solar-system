# Splits 02 — Results (Tasks 3–4)

The foundation splits, built on 2026-11-05 from the working map and the drafts JC approved at
Checkpoint A (`01-new-skills.md`, D1–D5 as recommended). **JC said go at Checkpoint B on 2026-11-05**, and it is now the working map,
`Maps/Robotics-Atlas.json`. The map it replaced is in `Maps/Backups/2026-11-05-before-splits/` (Task 5).
Before the go, nothing in `Maps/` was written. The old master, the V3 export and the shared answer
record (`23471d5c…`) are unchanged; their SHA-256 was checked before and after every task.

## Before and after

| | Previous working map | **Finished map (working map now)** |
| --- | ---: | ---: |
| Skills | 1,920 | **1,955** (+35) |
| Connections | 5,714 | **5,783** (4,386 prerequisite, 187 supports, 1,210 related) |
| Answers in the file | 308 | **308**, unchanged |
| Lessons | 306 | **306**, unchanged |
| I05 chain | 327 | **327**: no new skill is required |
| Levels used | 1–82 | **1–82** |
| File size | 7.85 MB | **7.97 MB** |
| SHA-256 | `ba823b0d…4719f8c` | `7c418655…375892a` |

## The new skills

35 skills, all optional, all unmarked, as approved. The full list with each skill's place in the map
is in `01-new-skills.md`; the records are in `scope/splits/new-skills.json`.

| Domain | New skills | Level range |
| --- | ---: | --- |
| Physics | 8 | 22–52 |
| Electronics | 12 | 49–64 |
| Mechanics | 10 | 25–46 |
| Computing | 5 | 22–43 |

They are master-style records like the earlier content batches: no planning id, so the lesson
importer leaves them alone until step 7 writes their lessons. Each card shows its details and an "I
can…" statement, and no lesson sections.

**Not added:** C6 *Choose a metric for an asymmetric error cost*, already covered by `c-classification` (D2).

## Levels moved

Recalculated with the app's own level and spiral code. Nothing is pinned.

| | Same level | Moved up | Moved down | Largest change | Position changed |
| --- | ---: | ---: | ---: | ---: | ---: |
| Existing skills (1,920) | 1,852 | 68 | 0 | 6 | 234 |

The 68 that moved up sit after the five new prerequisites (D3): `p-relative`, `p-energy`, the two
collision skills and `e-rc`, and the skills built on them. **JC will see a small change:** about 270
spheres in new places, mostly in physics and electronics, and the spiral's overall shape unchanged.

## The scope

Every split and new-skill candidate in physics, electronics, mechanics and computing is now covered.
**No branch is partial any more.**

| | Before | After |
| --- | ---: | ---: |
| Covered branches | 18 | **40** |
| Partial branches | 22 | **0** |
| Audit needed (mathematics, step 8) | 3 | 3 |
| Candidates covered | 88 | **124** of 132 |
| Remaining estimate | 36–108 skills | **0** |

The remaining 8 candidates are 7 planning tasks (6 in mathematics for step 8, and P7's camera-model
prerequisite audit) and 1 deferred item. Updated: `scope/branches.json`, `docs/SCOPE.md` (status
table, the 22 rows, change log) and `docs/PLATFORM.md` §9.1c.

## Performance

Measured in an isolated profile with `authoring/stress/measure-app.mjs`, 3 runs each, against a
scratch copy of the working map:

| | Working map | Finished map |
| --- | --- | --- |
| Open | 0.43 s | 0.44–0.45 s |
| Moving the camera, names on | 59.9 fps (worst 5%: 59.5) | 59.9 fps (worst 5%: 59.5) |
| Arrange spiral | 0.33–0.34 s | 0.33–0.35 s |
| Save | 0.18 s | 0.18–0.20 s |
| Start a review | 0.21 s | 0.21–0.23 s |
| Memory at the end | 687–689 MB | 684–693 MB |

No page errors. Click-to-card time is not measured, for the reason given in
`reports/capacity/06-safety-results.md` §4. Raw data: `C:\sss-scratch\splits\measure.jsonl`.

## Tests

- **Unit tests:** 253 pass, 0 fail, 6 skipped (the long-standing skips). That includes 6 new tests in
  `tests/splits.test.mjs` covering every rule and gate and the real build.
- **New end-to-end check, `tests/splits-e2e.mjs`** (10 checks, pass). It opens the finished map in an
  isolated profile holding a correctly named copy of JC's shared record, and confirms:
  - all 1,955 skills and 5,783 connections arrive;
  - every answer matches the record (311 entries);
  - all 35 new skills start unmarked, and each card shows its own details and no lesson;
  - no draft warning and no page errors.
- **Full end-to-end suite** with the V3 export, the working map and the finished map supplied:
  **785 checks pass, 0 fail.**
- **Shared code:** the completions layout step now takes the name of the record it writes to. A
  rebuild of the step-5 map from its base gives the same bytes as before (`0c0619e9…`).

## Review sessions

The finished map has 35 more skills, so its review key changes. **A guided review saved on the
working map will not resume on the finished map;** a review there starts fresh. The answers are not
affected.

## Checkpoint B — what JC does

1. **Save first.** If the app holds unsaved work, save it to a file, because opening another map
   replaces the app's draft.
2. **Open `C:\sss-scratch\splits\Robotics-Atlas.json`** with the app's normal **Open map**.
3. **Look around.** Search for a few of the new skills, for example *Choose a valid diode
   approximation*, *Solve selected truss joints* or *Prevent train-test leakage*, and read their cards.
4. Say **go** or **no-go**.

On **go** (Task 5):
- the current `Maps/Robotics-Atlas.json` is copied to `Maps/Backups/2026-11-05-before-splits/`;
- the finished map replaces it;
- the pull request is opened and merged.
