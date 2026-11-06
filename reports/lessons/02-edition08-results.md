# Lessons 02 — Edition 08 results (Tasks 3–6)

Edition 08, built on 2026-11-05 from the specifications JC approved at Checkpoint A (E1–E5 as
recommended). **It is waiting for JC's go or no-go at Checkpoint B1.** Until then the result exists
only as `C:\sss-scratch\lessons\Robotics-Atlas.json`. Nothing in `Maps/` was written. The working map
(`7c418655…`), the old master, the V3 export and the shared answer record (`23471d5c…`) are unchanged;
their SHA-256 was checked before and after every task.

## Before and after

| | Working map now | **With Edition 08** |
| --- | ---: | ---: |
| Skills / connections | 1,955 / 5,783 | **1,955 / 5,783**, unchanged |
| Answers in the file | 308 | **308**, unchanged |
| Lessons | 306 | **329** (306 on V3 entries + 23 on master skills) |
| I05 path with a card | 305 of 328 | **328 of 328** |
| Core skills with a card | 306 of 351 | **329 of 351** |
| SHA-256 | `7c418655…375892a` | `e91a4292…772f81e` |

**The I05 path is now complete:** every skill the I05 milestone depends on has a card. Only the 21
Group B lessons (Part 2) and `r-singular` remain in the core.

## The lessons

- **Read them in** `authoring/lessons/edition-08/Core-Learning-Edition-08.md`. The answers are
  folded away, as on the cards.
- **23 lessons** for the 17 frame and planar-arm steps and the six physics and mathematics skills,
  in dependency order.
- **Real-hardware evidence:** all 23 say *not needed* (E4); every demonstration works from stated values.
- **Overlap with K05–K07 (E5):** the eight planar-arm steps each teach only their own step, with a
  0.5 m / 0.25 m arm; the Edition 07 cards use 0.4 m / 0.3 m. Each names the outcome card it
  prepares for. No Edition 07 card changed.
- **Checked, not just written:** `core_lab.py` recomputes every worked example and answer, and
  `check_package.py` passes **79 checks**, including that each number appears in the text and that
  every lesson's prerequisites equal the map's own.

## The importer (Task 3)

Lessons on master skills needed one new ability: these skills have no planning id, and the importer
forbids adding one. An approved master-skill specification entry (`master_skill: true`) is now matched
by the skill's own id, and every other check is the same: name, prerequisites, contract fingerprint,
no proficiency write. A master skill that gains a lesson:
- keeps its own text in `atlasDetails` and `atlasPlacementNote`;
- gets a content status;
- gets no planning id.

Every earlier target behaves exactly as before. The dry runs on the V3 export, the completions map
and the working map passed with their old counts before Edition 08 was written. Seven new unit tests
cover the matching and its refusals:
- a lesson for an unapproved master skill;
- an entry not marked as a master skill;
- a drifted prerequisite list or demonstration;
- a proficiency write;
- a master entry meeting a skill that has a planning id.

## The import (Task 5)

`apply-lessons.mjs --target C:\sss-scratch\lessons\Robotics-Atlas.json --write` passed:
- 23 gained, 306 unchanged, 0 skipped, 0 conflicts;
- 31 evidence statements from lessons (8 from Edition 07, 23 from Edition 08), 0 from the
  unreviewed overrides table;
- 0 existing lessons and 0 existing cards changed;
- node order, connections, layout, levels and answers identical (every signature except the lesson
  payloads);
- a review session survives; a second run touches nothing.

## Tests (Task 6)

- **Unit tests:** 260 pass, 0 fail, 6 skipped (the long-standing skips).
- **New end-to-end check, `tests/core-lessons-e2e.mjs`** (11 checks, pass). It opens the map in an
  isolated profile holding a correctly named copy of JC's record, and confirms:
  - every skill and connection arrives;
  - the 23 cards sit on master skills;
  - all 328 skills on the I05 path have a card;
  - answers match the record (311 entries) and no new card arrives with an answer;
  - all 23 cards render their sections, name their edition and show no hardware line, while an older
    flagged card still shows its line;
  - no draft warning, no page errors.
- **Full end-to-end suite** with every map supplied: **796 checks pass, 0 fail.**
- `src/lesson.js` names the edition on its cards: "core lessons, edition 08".

## Review sessions

The skill set is unchanged, so **a review in progress on the working map resumes on this map**. The
importer checked this on the real map.

## Checkpoint B1 — what JC does

1. **Read the 23 lessons** in `authoring/lessons/edition-08/Core-Learning-Edition-08.md`. Anything to
   change, say so. The text is in `lessons-source.json`, and the checks re-run.
2. **Save first** if the app holds unsaved work.
3. **Open `C:\sss-scratch\lessons\Robotics-Atlas.json`** with **Open map**. Open a few cards, for example
   *Construct a rotation matrix from one frame's axes expressed in another*, *Electric charge and
   conservation* or *Identify lost instantaneous motion directions at a planar arm singularity*.
4. Say **go** or **no-go**.

On **go** (Task 7):
- the current `Maps/Robotics-Atlas.json` is copied to `Maps/Backups/2026-11-05-before-edition08/`;
- the finished map replaces it;
- Part 1's pull request is opened and merged.
