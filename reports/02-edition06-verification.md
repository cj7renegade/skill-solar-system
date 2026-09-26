# 02 — Edition 06 verification (Task 2) — BLOCKED

Run 2026-09-26 on branch `edition-06-integration` at `c942b93`, Node v24.15.0, Python 3.13.13.
Every result below was measured in this session. Nothing is copied from
`authoring/robotics-v3/Edition06-Integration-Summary.md`, which is the importer's own record.

**Stopped at step 7: `tests/robotics-v3-e2e.mjs` fails, in 4 of 4 runs.** Everything before that
passed. The Edition 06 end-to-end test and the manual Electron card check were **not run**.

## Summary

| # | Check | Result |
| --- | --- | --- |
| 1 | Package's own checks (`check_package.py`) | **pass**: 33 / 33 |
| 2 | Importer dry run | **pass**: `result: passed`, nothing written |
| 3 | `--write` rerun (idempotency) | **pass**: export SHA-256 unchanged |
| 4 | 292 prior payloads unchanged | **pass**: 0 changed |
| 5 | Six new entries, I05 closure | **pass**: exactly the six; 298 / 298 have lessons |
| 6 | Edges, positions, levels, pins, `proficiency80` | **pass**: identical |
| 7a | `npm run build` | **pass** |
| 7b | `npm test` | **pass**: 205 tests, 199 pass, 6 skip, 0 fail |
| 7c | `SSS_V3_MAP=… node tests/robotics-v3-e2e.mjs` | **FAIL**: 4 of 4 runs |
| 7d | `SSS_V3_MAP=… node tests/robotics-v3-edition06-e2e.mjs` | not run (stopped) |
| 8 | Electron card check (Q06, B-D08, E11, V06, V07, I05, prior, pending, X10) | not run (stopped) |

## 1. Package self-checks

`packages/…-edition-06/check_package.py` writes `Validation-Results.json` into its own folder, and
importing its lab would create `__pycache__` there. TASKS.md forbids editing anything under
`packages/`. So the package was copied to a scratch folder and run there, in a fresh `venv`
created in the scratch folder. `requirements.txt` lists no third-party packages.

- Output: `"status": "passed"`, `"checks_passed": 33`, Python 3.13.13; exit code 0.
- The generated `Validation-Results.json` is byte-identical to the one shipped in the package.
- SHA-256 of all 16 package files was the same before and after, so the package is untouched.

## 2. Importer dry run — `node authoring/robotics-v3/apply-lessons.mjs`

Exit 0. It printed "Dry run: nothing written", and the export, ledger and summary hashes were
unchanged afterwards.

| Field | Value |
| --- | --- |
| `result` | `passed` |
| `counts` | mapNodes 381, lessonsSupplied 298, imported 298, skipped 0, keptExistingOverEdition 0, authored 298, pending 82, roadmap 1 |
| `thisRun.existingPayloadsChanged` | `[]` (empty) |
| `thisRun` otherwise | 298 → 298 lessons, 0 nodes touched, 381 untouched |
| `i05Closure` | 298 entries, `missingCards: []`, `closed: true` |
| `sinceSuppliedBaseline` | against `ad9ba478…` (package `baseline/`): 292 → 298, 6 gained, `existingLessonsChanged: []`, `preservedFieldsChanged: []` |
| `preservation` | no problems; answers 0 → 0; edges, positions, levels, pins and node order unchanged; review order unchanged; review session preserved, key `dataset:robotics-curriculum-v3|381|cbb516b3` before and after |
| `idempotent` | `true` |

Signatures before = after:

| Signature | Value | Same? |
| --- | --- | --- |
| nodeOrder | `ecce612d64610b6f` | yes |
| edges | `b8b7adc67be1a47a` | yes |
| layout | `5ee2c72fe83b52b7` | yes |
| proficiency | `32acee5a0d94029a` | yes |
| lessonPayloads | `e4cad6a3825ff756` | yes (no new payloads this run, because Edition 06 was already applied) |

## 3. Idempotency — `node authoring/robotics-v3/apply-lessons.mjs --write`

Exit 0, `result: passed`.

| File | Before | After |
| --- | --- | --- |
| `Robotics-v3-Lessons.json` (export) | `687f0916…fc11` | `687f0916…fc11` — **identical** |
| `Content-Import-Ledger.csv` | `fb0e3e6c…0047` | `fb0e3e6c…0047` — identical |
| `Integration-Summary.json` | `4d467156…7cda` | `0de1b053…4536` |

The machine summary differs only in `generated` (2026-09-20 → 2026-09-26) and `sourceRevision`
(`7c95db6…` → `c942b93…`). With those two fields removed, the old and new summaries are identical.
The backup in `backups/pre-edition06-commit-20260926-163529/` still holds the original.

## 4–6. Independent comparison

A separate script that imports no project code compared the live export against (a) the Task 1
backup and (b) the true pre-Edition-06 export, `ad9ba478b15bc2841c63c47b9e1d3c366f09910c00c119572ca01c5b2cdd3e53`
(`packages/…-edition-06/baseline/Confirmed-Edition05-Export.json`, the same hash as the committed state).

| | Backup vs now | Pre-Edition-06 vs now |
| --- | --- | --- |
| Export SHA-256 | identical (`687f0916…`) | `ad9ba478…` → `687f0916…` |
| Node order, edges, `layout` | identical | identical |
| `position`, `skillLevel`, `pinned`, `proficiency80`, `layoutMode`, `id`, `name`, `domain`, `subdomain`, `nodeKind`, `planningId`, `feedsMilestones` | 0 differences | 0 differences |
| Prior lesson payloads changed (`lesson`, `lessonCard`, `details`) | 0 of 298 | **0 of 292** |
| Newly authored | none | exactly `Q06`, `B-D08`, `E11`, `V06`, `V07`, `I05` |
| Node fields that changed at all | none | on those 6 only: `details`, `placementNote`, `lessonStatus`, `contentStatus`, `lessonCard`, `lesson` |
| Metadata keys changed | none | `scope`, `contentEditions` (both allowed by the importer's rules) |
| Proficiency answers in the map | 0 / 0 | 0 / 0 |
| `datasetKey` / `atlasFamily` | unchanged | unchanged |

**I05 closure**, computed from the map's own `prerequisite` edges: **298 entries, 0 missing an
introductory lesson**. Counts: 298 authored / 82 pending / 1 roadmap (`X10`, `assessable: false`).
All six new entries have `contentStatus` "introductory lesson authored" and edition
`repeatable-work-system-06`, and each `practice_mode` names the physical/actual evidence still needed.

## 7. Build and tests

- `npm run build`: exit 0, "Offline renderer built in dist."
- `npm test`: 205 tests, 199 pass, **0 fail**, 6 skipped. The six skips are the six
  "real atlas" tests that need `SSS_ATLAS` (PLATFORM.md §8.2). The test
  "the integrated robotics v3 map carries all 298 lessons and 82 pending entries" ran and passed.
- **`tests/robotics-v3-e2e.mjs` with `SSS_V3_MAP=Maps/Robotics-v3/Robotics-v3-Lessons.json`: FAILED.**

| Run | Exit | Checks passed first | Failure |
| --- | ---: | ---: | --- |
| 1 | 1 | 1 ("the imported map opens with every entry (381 entries)") | `AssertionError: the authored and pending counts survive the open 292 / 88 / 1` at `tests/robotics-v3-e2e.mjs:68` |
| 2 | 1 | 1 | same |
| 3 | 1 | 1 | same |
| 4 | 1 | 1 | same |

**Likely cause (observed, not fixed):** `tests/robotics-v3-e2e.mjs:35` hard-codes
`const EXPECT = { authored: 292, pending: 88, roadmap: 1, nodes: 381 };`. The file was last changed
in `382eb4c` (Edition 05) and is not among the Edition 06 changes. The Edition 06 work updated the
matching unit test (`tests/robotics-v3-lessons.test.mjs`, 292/88 → 298/82) but not this end-to-end
test. The export correctly holds 298 / 82 / 1, so the test's expectation is out of date. The failure
is deterministic, not the intermittent OneDrive one. Updating a test is not an edit TASKS.md lists,
so it was left for JC.

After the failed runs: the export is still `687f0916…fc11`, the proficiency record is still
`4cda601b…e6d0`, and the working tree is unchanged. The test runs in an isolated profile (§8.3).

## Not run because of the stop

- `SSS_V3_MAP=… node tests/robotics-v3-edition06-e2e.mjs`
- The Electron card check. Note for when it runs: `robotics-v3-edition06-e2e.mjs` opens the six new
  cards and checks sections, hidden answers and that revealing an answer records no proficiency.
  It does **not** check the rendered status lines or the hardware-evidence line, and it does not
  open a prior, pending or roadmap card. Those need a separate check.

## Decision needed from JC

Should `tests/robotics-v3-e2e.mjs:35` be updated to `authored: 298, pending: 82`, and committed with
the Edition 06 test changes in Task 4, commit 1? Task 2 would then be rerun from step 7.
