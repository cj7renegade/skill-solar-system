# Merge 02 — Results (Tasks 3–6)

The merged Robotics Atlas, built on 2026-10-10 from the master atlas, the Robotics V3 export and the
crosswalk JC approved at Checkpoint A (`01-crosswalk.md`, A1–A8 accepted as recommended).
**It is waiting for JC's go or no-go at Checkpoint B.** Until then it exists only as
`C:\sss-scratch\merge\Robotics-Atlas.json`. Nothing in `Maps/` was written, and neither source map
nor the shared answer record changed (SHA-256 checked before and after every step).

## Before and after

| | Master | Robotics V3 | **Merged** |
| --- | ---: | ---: | ---: |
| Skills | 1,769 | 381 | **1,918** |
| Connections | 5,142 | 894 | **5,708** (4,323 prerequisite, 175 supports, 1,210 related) |
| Answers in the file | 309 | 0 | **308** |
| Lessons | 0 | 298 | **298** |
| Levels used | 1–70 | 1–70 | **1–82** |
| File size | 5.4 MB | 2.8 MB | **7.8 MB** |
| Answer family | `sss-robotics-foundations-2026-09` (by `datasetId`) | `…-v3-review` | `sss-robotics-foundations-2026-09` (declared) |
| `datasetKey` | none | `robotics-curriculum-v3` | `robotics-atlas-merged` |

- **1,918** = 1,769 − 26 retired overviews + 175 new V3 entries.
- **The 2 same-ability entries** (`B-E02`, `B-E03`) live on `e-current` and `e-voltage`.
- **Answers.** All 309 of the master's answers are carried by unchanged ids, except `c-variables`,
  which takes the shared record's Clear (A1). That Clear is what the app already showed, so **no answer
  JC sees changes**. The 175 new entries start unmarked.
- **Lessons.** 150 land on shared master skills, 2 on the same-ability skills, and 146 on new `rob3:`
  entries. Each is checked byte for byte against the V3 export. A shared skill that took a card keeps
  its master text in `atlasDetails` and `atlasPlacementNote`, so nothing is lost.
- **Connections.** 339 V3 connections already existed in the master and were not doubled, and 3 related
  links were skipped because the two skills were already linked.

## What was retired

The 26 broad `r-*` overviews listed in `01-crosswalk.md` A5, each replaced by the V3 outcomes it
summarized. Their connections:
- 4 were re-pointed to the outcome that takes over;
- 35 were carried as *supports* onto it;
- the rest were dropped, as approved.

`r-singular` stays. The list is also recorded inside the map under `roboticsV3Merge.retiredOverviews`.

## Decisions applied

| Decision | In the merged map |
| --- | --- |
| 6 | 26 overviews retired, `r-singular` kept |
| 7 | `X06` is an outcome |
| 10 | `K05`–`K07` are prerequisites of `K08`, `K10` and `K11`, and the master's planar `sss-rob-*` steps are prerequisites of `K01`–`K07` |
| 11 | The three calculus links stay *supports* |
| 12 | `B-D08` is filed in S7, *Thermal and environmental behavior* |
| A6 | `m-order` takes V3's name and prerequisites; `m-power → m-order` is the one master prerequisite removed outside the overviews |

## Levels moved (Task 4)

Levels are recalculated by the app's own level and spiral code. Nothing is pinned.

| | Same level | Moved up | Moved down | Largest change | Position changed |
| --- | ---: | ---: | ---: | ---: | ---: |
| Master skills (1,743 kept) | 1,143 | 280 | 320 | 12 | 1,370 |
| V3 entries (381) | 267 | 114 | 0 | 30 | 343 |

The highest level rises from 70 to 82, because the merged chains are deeper. **JC will see the
spiral rearranged:** most spheres sit in a new place, and V3 robotics outcomes sit higher, on top of
the master's foundations.

## Milestone chains

| | I01 | I02 | I03 | I04 | I05 |
| --- | ---: | ---: | ---: | ---: | ---: |
| In V3 | 185 | 249 | 241 | 291 | 298 |
| In the merged atlas | 189 | 279 | 252 | 319 | 326 |

Every V3 entry below each milestone is still below it (a merge gate). The chains grew because master
skills (the planar-arm steps, and the master prerequisites of shared skills) now feed them. Every V3
entry in the I05 chain keeps its card.

## Performance (Task 4)

Measured in an isolated profile with `authoring/stress/measure-app.mjs`, 3 runs each, against a scratch copy of the current master:

| | Master | Merged |
| --- | --- | --- |
| Open | 0.36 s | 0.43–0.49 s |
| Moving the camera, names on and off | 59.9 fps | 59.9 fps |
| Arrange spiral | 0.27–0.31 s | 0.33–0.34 s |
| Save | 0.15–0.17 s | 0.17–0.20 s |
| Start a review | 0.21–0.24 s | 0.20–0.21 s |
| Memory | about 647 MB | about 683 MB |

Click-to-card time was not measured: the script cannot pick a sphere at the whole-map view
(`reports/capacity/06-safety-results.md` §4). The measured file was the build before placement notes
were added, which made it 0.3% larger.

## The lesson importer (Task 5)

`apply-lessons.mjs --target C:\sss-scratch\merge\Robotics-Atlas.json` passes:
- 298 lessons reconcile, with 0 conflicts and 0 payloads changed;
- node order, connections, layout and answers are identical;
- the I05 chain is closed, a review session survives, and the run is idempotent.

One pending difference has nothing to do with the merge. The evidence statements in
`evidence-overrides.json` have not yet been written onto any card, in the V3 export or here. They wait
for JC's review of the 44 flagged cards.

## Tests (Task 6)

- **Unit tests:** see the Task 6 result in `Tasks/TASKS.md`. `tests/merge.test.mjs` has 13 tests,
  covering each rule and gate, levels, and the importer on the merged atlas.
- **New end-to-end check, `tests/merged-atlas-e2e.mjs`** (12 checks, pass). It opens the merged atlas
  in an isolated profile holding a copy of JC's shared record, and confirms:
  - all 1,918 skills and 5,708 connections arrive;
  - every answer shown matches the record (310 entries), and skills outside the record keep the file's answer;
  - no new entry has an answer;
  - a V3 card renders on a shared master skill (`m-count`), a new outcome (`K03`) and a same-ability skill (`e-current`);
  - no draft warning, no page errors.
- **Full end-to-end suite:** see the Task 6 result in `Tasks/TASKS.md`.

## Review sessions

The merged atlas has a new set of skills, and so a new review key
(`dataset:robotics-atlas-merged|1918|…`). **A guided review saved for the master or the V3 map will
not resume on the merged atlas.** A review there starts fresh. The answers themselves are not
affected: they live in the shared record, not in the session. Old sessions still resume on the old maps.

## Checkpoint B — what JC does

1. **Save first.** If the app holds unsaved work, save it to a file. Opening another map replaces
   the app's draft.
2. Open `C:\sss-scratch\merge\Robotics-Atlas.json` with the app's normal **Open map**. It uses the
   master's answer family, so your answers appear on it.
3. Look around. The robotics area now has the granular V3 outcomes, the I01–I05 milestones are there,
   and the spiral has been rearranged.
4. Say **go** or **no-go**.

On **go** (Task 7):
- the merged map is copied to `Maps/Robotics-Atlas.json` (a new file; the old master and V3 export are not touched);
- it becomes the importer's default;
- the pull request is opened and merged.

The backup (`Backup-User-Data.cmd`, app closed) must be taken first.
