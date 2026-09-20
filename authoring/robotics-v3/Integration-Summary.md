# Robotics learning editions 01–05 — integration summary

Return note for the next authoring edition, answering the handoffs in each package's
`INTEGRATION.md` under `packages/shared-foundations-learning-edition-01`,
`…-controlled-joint-learning-edition-02`, `…-complete-arm-learning-edition-03`,
`…-wheeled-robot-learning-edition-04` and `…-mobile-manipulation-learning-edition-05`.

## Source revision

**Actual HEAD at import: `fd4337181b9bd186431870f583d67857e48e4efd`** (the edition 04 integration).

Edition 05's package was authored when the last independently reviewed export was edition 03's
(254 cards), with edition 04 "awaiting returned integration evidence". Edition 04 had in fact been
integrated here at `fd43371`; the reconciliation below establishes that at payload level rather than
by count, as the handoff requires.

## Edition 04 reconciliation — required before applying edition 05

Edition 05 ships three pieces of comparison evidence. All three are byte-identical to what this
repository used, so the comparison is against the package's own bytes:

| Package file | sha256 | Matches |
| --- | --- | --- |
| `baseline/Confirmed-Edition03-Export.json` | `f91c910a…` | the export this repo produced for edition 03 |
| `baseline/Wheeled-Robot-Lessons-04.json` | `12bbfccd…` | the edition 04 patch this repo imported |
| `baseline/Robotics-Reviewed-Specification.json` | `2cb33332…` | the reviewed specification every edition uses |

Payload-level result, comparing the working export against both:

| Check | Result |
| --- | --- |
| Edition 03's 254 lesson payloads present in the current map | **254 / 254**, byte-identical |
| …missing | **0** |
| …differing | **0** |
| Edition 04's 28 lesson payloads present | **28 / 28**, byte-identical to the supplied patch |
| …missing / differing / contract drift | **0 / 0 / 0** |
| Entries labelled `wheeled-robot-04` | 28 |
| Node order, edges, layout, proficiency signatures vs. the confirmed edition 03 export | **identical** (only the payload signature differs, as 28 lessons were added) |
| Starting state | **381 nodes · 282 authored · 98 pending · 1 roadmap**, `datasetKey` `robotics-curriculum-v3`, 0 proficiency answers |

**Edition 04 was complete and correct. No remedial work was needed, and nothing was overwritten.**
All ten edition 05 targets were found in both the specification and the map, all still `introductory
lesson pending`, with matching names, prerequisites, runtime IDs, contract fingerprints and
demonstrations, and none already authored. No conflicts to report.

## Edition 05 import

| | |
| --- | --- |
| Supplied | 10 |
| **New this import** | **10** — `R-P02`, `R-M05`, `P04`, `P10`, `P05`, `G05`, `G06`, `G07`, `G08`, `I04` |
| Existing payloads unchanged | **282** (0 changed) |
| Skipped | 0 |
| Conflicting | 0 |
| Entries relabelled | 10 (those same entries, pending → available) |
| Nodes untouched by the run | 371 |
| Final state | **381 nodes · 292 authored · 88 pending · 1 roadmap** |

Per-edition attribution, read off the map: 77 + 116 + 61 + 28 + 10 = 292.

The **I04 closure contains 291 entries and none lacks an introductory card**, verified by walking the
map's own prerequisite edges from `rob3:I04`. Exactly one authored card lies outside that chain,
matching the package. The I01 (185), I02 (249) and I03 (241) closures remain complete.

All ten new payloads are byte-identical to `Mobile-Manipulation-Lessons-05.json`. All 282 prior
payloads are byte-identical to their originating packages.

## Preservation results

Signatures taken before and after the applying run:

| Signature | Before | After | |
| --- | --- | --- | --- |
| Node order | `ecce612d64610b6f` | `ecce612d64610b6f` | unchanged |
| Edges (all 894) | `b8b7adc67be1a47a` | `b8b7adc67be1a47a` | unchanged |
| Layout (positions, levels, pins, layout mode) | `5ee2c72fe83b52b7` | `5ee2c72fe83b52b7` | unchanged |
| Proficiency | `32acee5a0d94029a` | `32acee5a0d94029a` | unchanged |
| Lesson payloads | `abb13735e63a4990` | `7af5a92bc3087e56` | changed — the ten additions, as intended |

| What | Result | How |
| --- | --- | --- |
| Node identities, names, domains, planning IDs, node kinds | **preserved** | field-by-field over all 381 nodes |
| Prerequisite and support edges | **preserved** | all 894 byte-identical |
| Positions, levels, pins, layout mode, node order | **preserved** | signature above, plus field-by-field |
| Manual proficiency values | **preserved** — 0 before, 0 after | the patch never assigns `proficiency80`; signature identical |
| Manual proficiency behaviour | **preserved** | Yes/No/Clear still mark one skill and reach the shared record (Electron) |
| Shared record | **not touched** | never opened by the importer; `atlasFamily` unchanged |
| `metadata.datasetKey` | **preserved** as `robotics-curriculum-v3` | compared; the importer fails on a change |
| Review-session identity | **preserved outright** | key `dataset:robotics-curriculum-v3\|381\|cbb516b3` **identical before and after**; the title restates the counts and the key does not follow it |
| Review queue position | **preserved** | a session built pre-import resumes post-import on the same skill, position, visited and skipped lists, no missing entries — checked by the importer and again in Electron against a planted session |
| Review order | **preserved** | `buildQueue` identical before and after |
| Original Skill Solar System map | **preserved** | never opened for writing; its copy verified unchanged after the app opened it |
| Supplied packages vs. generated exports | **kept separate** | packages under `packages/`, generated artefacts under `Maps/Robotics-v3/` |

## Verification performed

**Package checks.** `python manipulation_lab.py --output lab-results` then `python check_package.py`
in a dedicated environment: **51 checks passed** (NumPy 2.3.5, SciPy 1.17.0, in a throwaway virtual
environment under the session scratchpad; the machine's Python was not modified). Editions 02, 03
and 04 still pass their own checks from their new locations: 103, 96 and 78.

**Import.** Dry run reviewed first, then `--write`; the applier refuses to write unless every check
passes. Result **passed**. Running it again is a **no-op**: byte-identical output
(`ad9ba478…`), `thisRun` reporting 0 entries gained and 0 nodes touched.

**Repository gates.** `npm test` — 205 tests, 199 passing, 6 pre-existing skips, 0 failures.
`npm run test:e2e` — 182 checks across the map-independent suites.
`node tests/prerequisites-e2e.mjs` — 52 checks. `node tests/robotics-atlas-e2e.mjs` — 19 checks
against the real atlas and its Robotics sub-map.

**Electron.** `node tests/robotics-v3-e2e.mjs` — **498 checks** in the real app, isolated profile and
isolated proficiency store:

- 381 entries, 292 / 88 / 1 statuses intact, no answers, title stating the counts it holds.
- **Twenty-five** representative cards, each opening with every section closed, correct section
  titles, full two-paragraph details shown once, prerequisites matching the map's edges, both
  questions, both answers hidden until their own control is pressed, hide again, the demonstration
  and assessment contract as readable text with no JSON, the exercise/physical distinction, and the
  available-versus-pending labels:
  - **edition 05**: `rob3:R-P02`, `rob3:P04`, `rob3:P05`, `rob3:G05`, `rob3:G08`, `rob3:I04`
  - rechecked: `rob3:B-M04`, `rob3:P08`, `rob3:P09`, `rob3:N01`, `rob3:N06`, `rob3:N08`, `rob3:I03`
    (edition 04); `rob3:K03`, `rob3:m-jacobian`, `rob3:K10`, `rob3:K11`, `rob3:G04`, `rob3:I02`
    (edition 03); `rob3:m-trig`, `rob3:c-bitwise`, `rob3:E02`, `rob3:B-D05` (edition 01);
    `rob3:C03`, `rob3:I01` (edition 02)
- **A pending card**: says "No introductory lesson for this entry yet", offers no empty sections,
  keeps its planning text and its manual proficiency controls.
- **The roadmap card** (`rob3:X10`): no lesson sections, "not an assessed entry, and no lesson is
  planned for it", never presented as assessable.
- **Mathematical symbols and units**: `×`, `²`, `→` surviving into the DOM; `rob3:N01`'s `0.05 m`,
  `0.3 m`, `2 rad/s`, `0.1 m/s` reading exactly as authored in both explanation and revealed answer.
- **Retained unrendered fields**: `node_contract_sha256` and `dependency_depth` confirmed present in
  saved node data after Save and reopen.
- **Review-session continuity**: a session planted in the app's own review store resumes at the same
  skill and position, re-keyed on the dataset with the old entry replaced, not duplicated.
- **Manual proficiency**: marking one skill Yes reaches the shared record and leaves its
  prerequisites alone; opening cards, following prerequisite links, revealing answers and resuming a
  review change nothing, in the map, the draft and the shared record.
- Save and reopen retaining all 292 lessons and the one answer given; the original atlas (1769
  skills) still opening with its cards unchanged and its copy unmodified.

## Checks not available

- **No hardware of any kind.** No camera, no arm, no base, no gripper, no floor. No real feature
  detection, correspondences or extrinsics; no physical stop, hold, grasp, release or recovery.
- **The synthetic lab is not a robot.** Its perception, base-placement and pick-and-place exercises
  are numerical fixtures. It demonstrates no physical mobile manipulator and is wired to nothing.
- **The user's own storage was never opened.** Every app check ran in an isolated profile with its
  own proficiency store and review store. Whether a review session exists in the user's real profile
  is unknown; the continuity check used a planted session.
- **No learner assessment.** Nothing here establishes proficiency, mastery, or that extended
  instruction is complete for any entry.

## Changed files

Tracked:

- `src/lesson.js` — edition 05's reader-facing name.
- `authoring/robotics-v3/apply-lessons.mjs` — edition 05 as an input, its baseline in the comparison
  list, expected counts, and three new summary sections: `thisRun` (what the run changed in the
  export it started from), `signatures` (graph, layout, proficiency and payload digests before and
  after, now part of the pass/fail gate) and `byEdition` (per-edition attribution read off the map,
  which stays meaningful after a no-op re-run).
- `tests/robotics-v3-lessons.test.mjs` — edition 05 counts, its named cards, the I04 closure.
- `tests/robotics-v3-e2e.mjs` — the six edition 05 cards.
- `authoring/robotics-v3/Integration-Summary.md` — this file.

Generated, under the ignored `Maps/Robotics-v3/`:

- `Robotics-v3-Lessons.json` — the export, 2.7 MB, sha256
  `ad9ba478b15bc2841c63c47b9e1d3c366f09910c00c119572ca01c5b2cdd3e53`.
- `Content-Import-Ledger.csv` — one row per entry, sha256 `6707469a…`.
- `Integration-Summary.json` — the machine-readable summary.

Supplied, under the ignored `packages/`:

- `packages/mobile-manipulation-learning-edition-05/` — the package, moved out of `Maps/` after the
  import was verified, with its baseline, lab and checks unchanged. Source packages and generated
  exports stay in separate trees; the applier finds inputs in either place.

## Limitations

- These are **introductory cards and synthetic exercises**. Extended lesson and practice authoring is
  still pending for **every** entry, including all 292 that have a card. No skill is mastered.
- 88 assessable entries still have no introductory lesson. One roadmap entry is not assessed and no
  lesson is planned for it.
- Introductory coverage of the I04 chain is a content fact about the map. It is not proficiency, and
  the mobile-manipulation milestone has not been demonstrated on any robot.
- Nothing in the application writes a proficiency answer by itself. The only writers are the
  Yes / No / Clear controls, the guided review, and the prerequisite-chain control, which lists every
  skill, writes nothing until confirmed, and is reversed by one Undo.
- The export is 2.7 MB, within the app's 10 MB limit; Save, reopen and the draft cache were exercised
  at that size.
- Pre-existing and unrelated: `node tests/review-e2e.mjs` with `SSS_ATLAS` set times out opening the
  5.4 MB atlas at the end of its long session; the same file opens correctly in a fresh session. A
  `pulse-e2e` flake was seen once in a chained run and has not recurred.
- An untracked `Tasks/` directory is present in the working tree. It is not part of this integration
  and was left alone.
