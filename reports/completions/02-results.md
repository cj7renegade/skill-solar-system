# Completions 02 — Results (Tasks 3–7)

The robotics completions, built on 2026-11-05 from the working map and the items JC approved at
Checkpoint A (`01-new-skills.md`: C1 (a), C2 required, C3 optional, C4 yes, C5 Claude Code).
**JC said go at Checkpoint B on 2026-11-05**, and it is now the working map, `Maps/Robotics-Atlas.json`. The map it replaced is in `Maps/Backups/2026-11-05-before-completions/` (Task 8). Before the go, nothing in `Maps/` was written, and the working map (`f307121c…`) was unchanged.
The old master, the V3 export and the shared answer record (`23471d5c…`) are still unchanged;
their SHA-256 was checked before and after every task.

## Before and after

| | Previous working map | **Finished map (working map now)** |
| --- | ---: | ---: |
| Skills | 1,918 | **1,920** (+ `P11`, `A12`) |
| Connections | 5,708 | **5,714** (4,327 prerequisite, 177 supports, 1,210 related) |
| Answers in the file | 308 | **308**, unchanged |
| Lessons | 298 | **306** |
| V3 entries pending / roadmap | 82 / 1 | **76 / 1** |
| Levels used | 1–82 | **1–82** |
| File size | 7.8 MB | **7.9 MB** (7,854,547 bytes) |
| SHA-256 | `f307121c…db047c` | `ba823b0d…4719f8c` |

## What was added

**Two skills**, appended as pending V3 entries, starting unmarked:

| Skill | Prerequisites | Leads to | Level |
| --- | --- | --- | ---: |
| `rob3:P11` Detect an inconsistent measurement innovation | `P08` (+ `m-hypothesis` supports) | `P09`, so I03–I05 (required) | 61 |
| `rob3:A12` Distinguish coupling misalignment from backlash | `A09`, `D08` | `V05` (supports only, optional) | 58 |

**Eight lessons (Edition 07):** `m-inverse`, `m-invtrig`, `p-work`, `K05`, `K06`, `K07`, `P11`, `A12`.
Every V3 entry in the I05 chain now has a card (305 of 305). The chain's 23 master-only skills still
have none. They are step 7's first batch (C1).

**Milestone lists:** `feedsMilestones` was recalculated on the 9 skills where it disagreed with the
edges.

## Levels moved

Recalculated with the app's own level and spiral code. Nothing is pinned.

| | Same level | Moved up | Moved down | Largest change | Position changed |
| --- | ---: | ---: | ---: | ---: | ---: |
| Existing skills (1,918) | 1,914 | 4 | 0 | 3 | 22 |

**JC will barely see a change.** The spiral is the same apart from 22 spheres near the new skills.

## The lessons

- **Where to read them:** `authoring/completions/edition-07/Robotics-Completions-Learning-Edition-07.md`.
  The practice answers are folded away, as on the cards.
- **Written in this repository** (C5), in the Edition 06 format: 25 fields plus decision 14's
  `requires_physical_evidence` and `evidence_kind`.
- **Real-hardware evidence:** all eight say *not needed*, because each full demonstration works from
  stated values or generated data. `A12` is the closest call. Measuring a real joint is listed as
  remaining work on its card.
- **Checked, not just written:** `completions_lab.py` recomputes every worked example and answer.
  `check_package.py` passes **87 checks**, including that each number the lab computes appears in
  the lesson text. The lab caught one bug of its own before the text was final: rounding at the
  edge of reach gave two solutions where there is one.

## The importer (Task 6)

`apply-lessons.mjs --target C:\sss-scratch\completions\Robotics-Atlas.json --write` passed:
- 8 gained, 298 unchanged, 0 skipped, 0 conflicts;
- node order, edges, layout and answers identical;
- a review session survives the import; a second run touches nothing.

**One importer change JC should know about.** As built, the import would also have written the
evidence-overrides table onto all 298 existing cards. That table is still waiting for JC's
card-by-card review (the 44 flagged cards), and the merge deliberately kept it off the cards. Nothing
on screen would have changed, because the table matches the old wording, but it would have quietly
undone that decision. The importer now applies the table only when asked
(`--with-evidence-overrides`), and refuses to write if an existing card summary changes without it.
On the V3 export and on the current working map it still passes exactly as before (298/82).

## Tests (Task 7)

- **Unit tests:** 246 pass, 0 fail, 6 skipped (the long-standing skips). That includes 10 new tests
  in `tests/completions.test.mjs` covering every rule and gate, the real build and the Edition 07 import.
- **New end-to-end check, `tests/completions-e2e.mjs`** (27 checks, pass). It opens the finished map
  in an isolated profile holding a correctly named copy of JC's shared record, and confirms:
  - all 1,920 skills and 5,714 connections arrive;
  - every answer shown matches the record (311 entries), including JC's `rob3:B-C01` Yes;
  - `P11` and `A12` start unmarked;
  - all 8 Edition 07 cards render, name their edition and show no hardware line;
  - an older card that needs real evidence still shows the line, so its absence above means something;
  - no draft warning and no page errors.
- **Full end-to-end suite** with the V3 export, the working map and the finished map supplied:
  **775 checks pass, 0 fail.** The 6 optional sub-map checks were skipped, as before.
- **One existing test changed**, in `tests/merged-atlas-e2e.mjs`. "No new V3 entry arrives with an
  answer" was written before JC had answered any V3 skill, and JC's real `rob3:B-C01` answer now fails
  it. It now checks that a V3 entry shows only an answer the record holds.
- **A note on the record copy:** the app finds a record by its file name, so a test copy must keep the
  original name. The first run here used another name. The app then started with an empty record,
  and the one answer only the record holds was missing. The check above caught it, and the run was
  repeated with the right name.

## Review sessions

The finished map has two more skills, so its review key changes
(`dataset:robotics-atlas-merged|1920|…`). **A guided review saved on the working map will not resume
on the finished map;** a review there starts fresh. The answers are not affected, because they live
in the shared record.

## Checkpoint B — what JC does

1. **Read the eight lessons** in `authoring/completions/edition-07/Robotics-Completions-Learning-Edition-07.md`.
   Anything to change, say so. The text is in `lessons-source.json`, and the checks re-run.
2. **Save first.** If the app holds unsaved work, save it to a file, because opening another map
   replaces the app's draft.
3. **Open `C:\sss-scratch\completions\Robotics-Atlas.json`** with the app's normal **Open map**. It
   uses the master's answer family, so your answers appear on it.
4. **Look around.** Open the cards on `K05`, `K06`, `K07`, `P11` and `A12`. `P11` sits between
   `P08` and `P09`; `A12` sits after `A09` and `D08`.
5. Say **go** or **no-go**.

On **go** (Task 8):
- the current `Maps/Robotics-Atlas.json` is copied to `Maps/Backups/` with the date in its name;
- the finished map replaces it;
- the pull request is opened and merged.
