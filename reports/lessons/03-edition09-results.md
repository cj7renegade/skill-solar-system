# Lessons 03 — Edition 09 results (Tasks 8–10)

Edition 09, built on 2026-11-05 for step 7's Group B (E1–E5 as recommended at Checkpoint A). **JC said go at
Checkpoint B2 on 2026-11-05**, and it is now the working map, `Maps/Robotics-Atlas.json`. The map it
replaced is in `Maps/Backups/2026-11-05-before-edition09/` (Task 11). Before the go, nothing in `Maps/`
was written. The old master, the V3 export and the shared answer record (`23471d5c…`) are unchanged;
their SHA-256 was checked before and after every task.

## Before and after

| | Previous working map | **With Edition 09 (working map now)** |
| --- | ---: | ---: |
| Skills / connections | 1,955 / 5,783 | **1,955 / 5,783**, unchanged |
| Answers in the file | 308 | **308**, unchanged |
| Lessons | 329 | **350** (327 on V3 entries + 23 on master skills) |
| V3 entries still pending | 76 | **55** |
| I05 path with a card | 328 of 328 | **328 of 328** |
| **Core skills with a card** | 329 of 351 | **350 of 351** |
| SHA-256 | `e91a4292…772f81e` | `1212ad46…714b452` |

## Step 7 is complete

**Every core skill now has an introductory lesson**, except `r-singular`, the orientation overview
that Q6 keeps outside the coverage counts. The core is every robotics skill outside the extension
pathways, plus everything those skills need: 351 skills. The 55 V3 entries still pending are outside
the core:
- the 11 extension-pathway entries (step 9);
- the 44 entries no robotics skill needs (context, Q1 (a)).

## The lessons

- **Read them in** `authoring/lessons/edition-09/Core-Learning-Edition-09.md`, in dependency order.
- **21 lessons:**
  - control and estimation: `C06`–`C09`, `P07`, `A11`;
  - SLAM evaluation: `N09`;
  - sensing and electronics: `e-imu`, `e-adc`, `e-calibration`, `e-sampling`;
  - waves: `p-wave`;
  - the integral-calculus thread to the Laplace transform: `m-defintegral`, `m-antiderivative`,
    `m-ftc`, `m-improper`, `m-laplace`;
  - complex numbers: `m-complex`;
  - probability and statistics: `m-random`, `m-sampling`, `m-regression`.
- **The five runnable-code entries** are taught through small simulations, which the lab runs:
  - `C07`: a first-order model and an unstable one;
  - `C08`: sampled loops with and without delay;
  - `C09`: rank checks and pole placement, with a perturbed model;
  - `C06`: feedforward against model error;
  - `N09`: trajectory error and drift.
- **Real-hardware evidence:** all 21 say *not needed*; each demonstration works from stated values,
  data or a model.
  - `e-calibration`, `e-imu`, `A11` and `N09` are the closest calls. Their cards list real
    measurement or recorded datasets as remaining work.
  - The four entries assessed as *circuit analysis or supervised measurement* follow 24 of the 30
    earlier cards in that mode.
- **Checked, not just written:** `core2_lab.py` recomputes every number and simulation, and
  `check_package.py` passes **68 checks**.

**One display issue found, not changed here.** For the *circuit analysis or supervised measurement*
mode, the card's demonstration line always reads "Physical work: … on real hardware"
(`src/lesson.js`). That is so even on cards whose evidence field says no hardware is needed, which is
already true of 24 earlier cards. Rewording that line belongs with JC's review of the 44 evidence
cards.

## The import (Task 10)

The importer applies Edition 09 after Editions 01–08 when its package is present (V3 entries, V3's
specification). `--target C:\sss-scratch\lessons\Robotics-Atlas-09.json --write` passed:
- 21 gained, 329 unchanged, 0 skipped, 0 conflicts;
- 52 evidence statements from lessons, 0 from the unreviewed overrides table;
- 0 existing lessons and 0 existing cards changed;
- every signature except the lesson payloads identical;
- a review session survives; a second run touches nothing.

## Tests

- **Unit tests:** 260 pass, 0 fail, 6 skipped.
- **New end-to-end check, `tests/core-lessons-09-e2e.mjs`** (11 checks, pass):
  - the 21 cards sit on V3 entries;
  - every core skill but `r-singular` has a card;
  - answers match JC's record (311 entries) and no new card arrives with an answer;
  - all 21 cards render with their edition name and no hardware line, while an older flagged card
    still shows its line;
  - no page errors.
- **Full end-to-end suite** with every map supplied: **807 checks pass, 0 fail.**
- `src/lesson.js` names the edition: "core lessons, edition 09".

## Review sessions

The skill set is unchanged, so a review in progress on the working map resumes on this map.

## Checkpoint B2 — what JC does

1. **Read the 21 lessons** in `authoring/lessons/edition-09/Core-Learning-Edition-09.md`.
2. **Save first** if the app holds unsaved work.
3. **Open `C:\sss-scratch\lessons\Robotics-Atlas-09.json`** with **Open map**. Open a few cards, for
   example *Evaluate sampling, delay and noise*, *Design state feedback and an observer* or
   *Inertial measurement units*.
4. Say **go** or **no-go**.

On **go** (Task 11):
- the current `Maps/Robotics-Atlas.json` is copied to `Maps/Backups/2026-11-05-before-edition09/`;
- the finished map replaces it;
- Part 2's pull request is opened and merged.
