# 02 — Edition 06 verification (Task 2) — BLOCKED (second run)

Every result below was measured in this session. Nothing is copied from
`authoring/robotics-v3/Edition06-Integration-Summary.md`, which is the importer's own record of
the import. This report is the independent evidence.

- **Run 1** (at `c942b93`): stopped because `tests/robotics-v3-e2e.mjs` hard-coded the Edition 05
  counts. Kept below as history.
- **Run 2** (at `91b0d41`, with JC's approved one-line test update): every automated check passed.
  The **manual card check found that Q06 and V07 do not show the hardware-evidence line**. Stopped
  again.

Node v24.15.0, Python 3.13.13, Windows 11, project at
`C:\Users\hilli\OneDrive\Desktop\Skill Solar System`.

## Summary (run 2)

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
| 7c | `SSS_V3_MAP=… node tests/robotics-v3-e2e.mjs` | **pass**: 494 checks, 0 failures |
| 7d | `SSS_V3_MAP=… node tests/robotics-v3-edition06-e2e.mjs` | **pass**: 27 checks, 0 failures |
| 8 | Electron card check, 9 cards | **FAIL**: hardware-evidence line missing on **Q06** and **V07** |

## 1. Package self-checks

`check_package.py` writes `Validation-Results.json` into its own folder, and importing its lab would
create `__pycache__` there. TASKS.md forbids editing `packages/`, so each run used a fresh copy of the
package in a scratch folder, with a `venv` also created in scratch. `requirements.txt` lists no
third-party packages.

- Both runs: `"status": "passed"`, `"checks_passed": 33`, Python 3.13.13, exit code 0.
- The generated `Validation-Results.json` is byte-identical to the one shipped in the package.
- SHA-256 of all 16 package files was the same before and after, so the package is untouched.

## 2. Importer dry run — `node authoring/robotics-v3/apply-lessons.mjs`

Exit 0, "Dry run: nothing written"; the export, ledger and summary hashes were unchanged afterwards.
The same values were recorded in both runs.

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

Exit 0, `result: passed`, in both runs.

| File | Before | After |
| --- | --- | --- |
| `Robotics-v3-Lessons.json` (export) | `687f0916…fc11` | `687f0916…fc11` — **identical** |
| `Content-Import-Ledger.csv` | `fb0e3e6c…0047` | `fb0e3e6c…0047` — identical |
| `Integration-Summary.json` | `4d467156…7cda` | rewritten |

The machine summary differs only in `generated` (2026-09-20 → 2026-09-26) and `sourceRevision`
(`7c95db6…` → the commit at the time of the run). With those two fields removed, the old and new
summaries are identical. The original is kept in `backups/pre-edition06-commit-20260926-163529/`.

## 4–6. Independent comparison

A separate script that imports no project code compared the live export against (a) the Task 1
backup and (b) the true pre-Edition-06 export, `ad9ba478b15bc2841c63c47b9e1d3c366f09910c00c119572ca01c5b2cdd3e53`
(`packages/…-edition-06/baseline/Confirmed-Edition05-Export.json`, the same hash as the committed
state). Both runs gave the same results.

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

## 7. Build and tests

### Run 1 (before the test update) — `tests/robotics-v3-e2e.mjs` failed 4 of 4 runs

| Run | Exit | Checks passed first | Failure |
| --- | ---: | ---: | --- |
| 1–4 | 1 | 1 ("the imported map opens with every entry (381 entries)") | `AssertionError: the authored and pending counts survive the open 292 / 88 / 1` at line 68 |

The failure was deterministic, not the intermittent OneDrive one. `npm run build` and `npm test`
(199 pass / 6 skip / 0 fail) had passed in that run.

### Stale-value search (JC's instruction, before editing)

Searched `tests/robotics-v3-e2e.mjs` as committed at HEAD, and every helper it imports
(`tests/e2e-harness.mjs`, `tests/e2e-pixels.mjs`, `src/lesson.js`, `src/review.js`), plus the
launcher `tests/electron-launcher.cjs`. The search covered `292`, `88`, "five" or 5 editions,
`ad9ba478`, `687f0916`, map-title text, `mobile-manipulation`, "edition 05", and card lists.

| File:line | Value | Stale? | Action |
| --- | --- | --- | --- |
| `tests/robotics-v3-e2e.mjs:35` | `EXPECT = { authored: 292, pending: 88, … }` | **yes**: pre-Edition-06 counts | **changed** |
| `tests/robotics-v3-e2e.mjs:69` | title check `data.title.includes(String(EXPECT.authored))` | no: reads the title from the map and counts from `EXPECT` | none (now checks "298 … 82") |
| `tests/robotics-v3-e2e.mjs:194` | `legacyTitle = '… 193 introductory lessons, 187 pending'` | no: a deliberately old title used to test that an earlier review session still resumes (193 = editions 01 + 02). Not the Edition 05 state | none |
| `tests/robotics-v3-e2e.mjs:22–33` | the representative card list (through I04) | no: a list of cards to open, not a statement of state. Adding cards would change what the test checks. The Edition 06 cards are covered by `robotics-v3-edition06-e2e.mjs` | none |
| `tests/robotics-v3-e2e.mjs:50` | "5 MB" | no: the atlas file size, in a comment | none |
| `src/lesson.js:54` | `'mobile-manipulation-05'` display name | no: the Edition 05 cards still exist and need their name | none |
| harness, pixels, `review.js`, launcher | — | no matches | none |

No fingerprint or edition count is hard-coded anywhere. No value was ambiguous.

**The one change, exactly:**

```diff
- const EXPECT = { authored: 292, pending: 88, roadmap: 1, nodes: 381 };
+ const EXPECT = { authored: 298, pending: 82, roadmap: 1, nodes: 381 };
```

No test logic, check or tolerance was changed. This file goes in Task 4's first commit, as JC
instructed.

### Run 2 (after the update)

- `npm run build`: exit 0, "Offline renderer built in dist."
- `npm test`: exit 0; 205 tests, **199 pass, 0 fail, 6 skipped**. The six skips are the six
  "real atlas" tests that need `SSS_ATLAS` (PLATFORM.md §8.2). "The integrated robotics v3 map
  carries all 298 lessons and 82 pending entries" ran and passed.
- `robotics-v3-e2e.mjs`: exit 0, **494 checks passed**, no failures. It includes
  "the authored and pending counts survive the open (298 / 82 / 1)" and "the map title states the
  counts it actually holds (Robotics curriculum v3 — 298 introductory lessons, 82 pending)".
  PLATFORM.md §8.3 says 498 checks; the measured count is 494.
- `robotics-v3-edition06-e2e.mjs`: exit 0, **27 checks passed**, no failures, no page errors.

## 8. Manual card check in the real app — FAILED

A scratch script (not added to the repo) used `tests/e2e-harness.mjs` to launch the real Electron
app in an isolated temporary profile. It opened each card the same way the e2e tests do, opened
every section, and read the card's displayed text.

| Card | Status line shown | "Extended … still to be authored" | Hardware-evidence line | Simulation note | Text* | Sections | Answers hidden / sections closed at open | `proficiency80` after |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- |
| Q06 | Introductory lesson available · repeatable work system, edition 06 · 2026-09-20 | yes | **NO** | yes | yes | 6 | yes / yes | null |
| B-D08 | same | yes | yes | yes | yes | 6 | yes / yes | null |
| E11 | same | yes | yes | yes | yes | 6 | yes / yes | null |
| V06 | same | yes | yes | yes | yes | 6 | yes / yes | null |
| V07 | same | yes | **NO** | yes | yes | 6 | yes / yes | null |
| I05 | same | yes | yes | yes | yes | 6 | yes / yes | null |
| C03 (prior, edition 02) | Introductory lesson available · controlled joint, edition 02 · 2026-09-20 | yes | no — correct: paper/code practice | yes | yes | 6 | yes / yes | null |
| m-boolean (pending) | No introductory lesson for this entry yet | no (correct) | no (correct) | no | — | 0 | — | null |
| X10 (roadmap) | Roadmap note — not an assessed entry, and no lesson is planned for it | no (correct) | no (correct) | no | — | 0 | — | null |

\* Title, the start of the explanation, the practice question and the full demonstration all appear.

After all nine cards: 0 proficiency answers in the app's draft, 0 uncaught page errors.

### The finding

The hardware-evidence line reads *"The full demonstration also needs physical or deployed-system
evidence."* `exerciseKind` in `src/lesson.js` shows it when the entry's `practiceMode` matches
`NEEDS_REAL_EVIDENCE` (`src/lesson.js:22`):

```
/\b(physical|deployed[-\s]?system|target[-\s]?device|hardware|supervised|on[-\s]robot)\b/i
```

Two Edition 06 entries state that real-world evidence is required, but use the word *actual*:

- **Q06**: "Synthetic documentation exercise; reproduce and verify an **actual controlled system** separately."
- **V07**: "Synthetic handover-document review; **actual second-person operation and maintenance handover** remain required."

Measured across the whole export: 298 authored cards, 122 show the line, and exactly **2** (Q06 and
V07) mention *actual* or *real* without triggering it.

**Why no test caught it.** The unit test meant to guard this (`tests/robotics-v3-lessons.test.mjs:262–266`)
chooses which cards to check using the same `NEEDS_REAL_EVIDENCE` pattern. A card that avoids those
words is never checked, which is the failure PLATFORM.md §3.5 describes. The package's own check,
"synthetic and physical evidence separated", and the Edition 06 e2e test both accept "physical" **or
"actual"**, so the package authors treat the two as meaning the same thing. But those checks look at
the lesson data, not at the line the card displays.

**Not changed.** Fixing it means changing `src/lesson.js` (and adding a unit test assertion), which
is not an edit TASKS.md lists.

## State after both runs

The export is still `687f0916…fc11`, and the proficiency record is still `4cda601b…e6d0`. All app
runs used isolated profiles. The only working-tree change from Task 2 is the approved line 35 edit.

## Decision needed from JC

Should `NEEDS_REAL_EVIDENCE` in `src/lesson.js` be widened so Q06 and V07 show the line? One option
is adding `actual`, with a unit test asserting that both entries produce the line. Or are these two
entries acceptable without it? Task 2 would then be rerun from the build step.
