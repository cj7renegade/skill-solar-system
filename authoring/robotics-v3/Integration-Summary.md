# Robotics learning editions 01–04 — integration summary

Return note for the next authoring edition, answering the handoffs in
`packages/shared-foundations-learning-edition-01/INTEGRATION.md`,
`packages/controlled-joint-learning-edition-02/INTEGRATION.md`,
`packages/complete-arm-learning-edition-03/INTEGRATION.md` and
`packages/wheeled-robot-learning-edition-04/INTEGRATION.md`.

## Source revision

**Actual HEAD at import: `ca43f91043087ff255f9793ee27f13a2468c5e1b`.**

The edition 04 package reports `e8cd8dd0c31fd2cf9521221c420de9289c79741c` as the revision it was
built against, taken from the integration summary it was given. HEAD had moved on by one commit
since — `ca43f91`, which added the prerequisite-chain control to the skill card. That commit changed
no map data, and the export the package reconciled against is byte-identical to the one this
repository holds (`f91c910a…`), so nothing was stale and no later work was reverted.

## Dataset identity and ID mapping

Applied to the **dedicated robotics v3 map only**. The original Skill Solar System atlas was not
opened for writing, not patched, and not read for answers.

| | |
| --- | --- |
| Target map | `Maps/Robotics-v3/Robotics-v3-Lessons.json` (381 entries, 894 connections: 888 required, 6 supporting) |
| Base for this run | the current export, patched in place, so any later change to it is carried forward |
| Atlas family | `robotics-foundations-integration-v3-review`, unchanged |
| Review identity | `metadata.datasetKey = robotics-curriculum-v3`, **unchanged** |
| Runtime identity | `rob3:<planning-id>`, exactly each lesson's `proposed_runtime_id`, confirmed against the map |

Identity is checked per lesson: planning id, runtime id, name, required prerequisites and the
`node_contract_sha256` fingerprint must all agree with the reviewed specification before a lesson is
applied. The fingerprint is reproduced byte for byte from Python's `json.dumps(..., sort_keys=True)`.

## Counts

| | |
| --- | --- |
| Supplied by edition 04 | 28 |
| **New this import** | **28** |
| Unchanged existing lesson records | **254** (0 changed) |
| Skipped | 0 |
| Conflicting | 0 |
| Existing lessons kept over an edition | 0 |
| Total after import | **282 authored · 98 assessable pending · 1 roadmap · 381 nodes** |

Measured against the package's own `baseline/Robotics-v3-Lessons.json`, which is byte-identical to
the export this repository produced: 254 → 282 lessons, 28 entries gained one, **0 existing lesson
objects changed**, **0 preserved fields changed**.

All **241 entries in the I03 required chain** now have introductory content — verified by walking
the map's own prerequisite edges from `rob3:I03` and finding no entry without a `lesson`. Forty-one
authored entries lie outside that chain. The I01 (185) and I02 (249) closures are still complete.
These are content counts: not proficiency, and not a demonstrated physical milestone.

## Preservation results

Verified by the importer, which refuses to write unless all of it holds:

| What | Result | How |
| --- | --- | --- |
| Proficiency answers | **preserved** — 0 before, 0 after | counted before and after; the patch never assigns `proficiency80` |
| Shared record | **not touched** | the importer never opens it; `atlasFamily` identical, so the app could not cross to another family |
| Layout: positions, levels, pins, node order | **preserved** | compared field by field on all 381 nodes |
| Connections | **preserved** | all 894 edges byte-identical |
| IDs, names, domains, subdomains, descriptions, planning ids, node kinds, milestone links | **preserved** | same field-by-field comparison |
| `metadata.datasetKey` | **preserved** as `robotics-curriculum-v3` | compared; the importer treats a change to it as a failure |
| Guided-review session identity | **preserved outright** | session key `dataset:robotics-curriculum-v3\|381\|cbb516b3` is **identical before and after**. The title changed; the key did not, because it keys on the dataset and the node set, neither of which moved |
| Guided-review queue position | **preserved** | a session built on the pre-import map, partly worked through, resumes on the post-import map at the same skill, position, visited list and skipped list, with no missing entries |
| Guided-review order | **preserved** | `buildQueue` identical before and after |
| Original Skill Solar System map | **preserved** | never opened for writing; its copy verified unchanged after the app opened it |

Not tested: whether any guided-review session actually exists in this user's own profile. The
migration was exercised against a planted session in an isolated profile and against the real map in
the importer, not against the user's live review store.

## Field mapping

Unchanged from editions 01–03: the verbatim lesson record is stored as `node.lesson`, a reader-facing
summary as `node.lessonCard`, and `details` / `placementNote` are filled from the lesson.
Explanations, worked examples, practice questions, boundary checks, hidden answers, full
demonstrations, evidence guidance and references all travel, including fields the interface does not
render.

One renderer change was needed. Every edition words `practice_mode` differently, and edition 04
words it a fourth way — "full demonstrations require the stated deployed-system or physical
evidence", with the evidence clause the other way round. The card matched whole phrases, so edition
04's wording would have silently dropped the warning that real evidence is still required, and shown
these 28 cards as though paper work finished them. The test is now for the idea rather than the
sentence (`NEEDS_REAL_EVIDENCE` in `src/lesson.js`), and a unit check asserts that every authored
entry whose practice mode mentions real evidence still produces that line — so a fifth wording is
caught rather than quietly lost. `EDITION_NAMES` gained edition 04, with a check that every edition
present has a reader-facing name.

## Verification performed

`node authoring/robotics-v3/apply-lessons.mjs` — dry run first, then `--write`. Result: **passed**.
Idempotent: a second pass over the result changes nothing, and repeated `--write` runs produce
byte-identical files (`672c9508…`).

`npm test` — 205 tests, 199 passing, 6 pre-existing skips, 0 failures.

`node tests/robotics-v3-e2e.mjs` — **390 checks** in the real Electron app, isolated profile and
isolated proficiency store:

- 381 entries, 282 / 98 / 1 statuses intact, no answers, title stating the counts it holds.
- **Nineteen** representative cards, each with every section closed on opening, correct section
  titles, explanation and worked example shown once, prerequisites matching the map's edges, both
  questions, both answers hidden until their own control is pressed, hide again, the demonstration
  and assessment contract as readable text with no JSON, the exercise/simulation/physical
  distinction, and the available-versus-pending labels:
  - edition 04: `rob3:B-M04`, `rob3:P08`, `rob3:P09`, `rob3:N01`, `rob3:N06`, `rob3:N08`, `rob3:I03`
  - rechecked from edition 03: `rob3:K03`, `rob3:m-jacobian`, `rob3:K10`, `rob3:K11`, `rob3:G04`, `rob3:I02`
  - rechecked from edition 01: `rob3:m-trig`, `rob3:c-bitwise`, `rob3:E02`, `rob3:B-D05`
  - rechecked from edition 02: `rob3:C03`, `rob3:I01`
- **Units**: `rob3:N01`'s `0.05 m`, `0.3 m`, `2 rad/s`, `0.1 m/s` and the rest read exactly as
  authored, in the explanation and in the revealed answer.
- **Symbols** (`×`, `²`, `→`) surviving into the DOM.
- Proficiency unchanged after opening cards, following prerequisite links, revealing answers and
  resuming a review — in the map, the draft and the shared record.
- A fully expanded card scrolling inside the dialog; keyboard operation of a section and an answer
  reveal; a prerequisite link moving the card and keeping focus; Escape closing the card.
- An entry with no authored lesson and the roadmap note: no empty sections, planning text intact,
  manual proficiency controls intact, no claim of assessment.
- A review session resuming at the same skill and position after the import.
- A manual answer marking one skill only, reaching the shared record, surviving Save and reopen with
  all 282 lessons and the unmapped fields intact.
- The original atlas (1769 skills) still opening, cards unchanged, copy unmodified.

`node tests/prerequisites-e2e.mjs` — 52 checks, including the chain control against this map.
`node tests/robotics-atlas-e2e.mjs` against the real atlas and its Robotics sub-map — 19 checks.
`npm run test:e2e` — 135 checks in the map-independent suites.

`check_package.py` from each package's new location: edition 02 103 checks, edition 03 96 checks,
edition 04 **78 checks**, all passing. NumPy 2.3.5 lives in a throwaway virtual environment under
the session scratchpad; the machine's Python was not modified.

**Checks not available.** No hardware, wiring, firmware, floor, traction, braking or physical stop
was tested. No robot was operated. The user's live review store and real proficiency record were
never opened — every app check ran in an isolated profile. Whether a session exists in the user's
own profile is unknown.

## Changed files

Tracked, in this integration:

- `src/lesson.js` — wording-independent detection of demonstrations that still need real evidence;
  edition 04's reader-facing name.
- `authoring/robotics-v3/apply-lessons.mjs` — edition 04 as an input, its baseline as the comparison
  point, expected counts, and a limitation note that reflects whether the session key actually moved.
- `tests/robotics-v3-lessons.test.mjs` — edition 04 counts, the named cards, milestone-closure
  checks for I01/I02/I03, the practice-mode coverage guard, the edition-name guard.
- `tests/robotics-v3-e2e.mjs` — the seven edition 04 cards and the units check.
- `authoring/robotics-v3/Integration-Summary.md` — this file.

Local only (under the ignored `Maps/` and `packages/`):

- `Maps/Robotics-v3/Robotics-v3-Lessons.json` — the export, 2.7 MB, sha256
  `672c950865c51eedde6de513d8c1ec84728965b3473fb1ccfcddd1d56bc0d749`.
- `Maps/Robotics-v3/Content-Import-Ledger.csv` — one row per entry.
- `Maps/Robotics-v3/Integration-Summary.json` — the machine-readable form of this summary.
- `packages/wheeled-robot-learning-edition-04/` — the supplied package, moved out of `Maps/` after
  the import was verified, with its baseline, lab results and checks unchanged. The importer finds
  its inputs in either place.

## Limitations

- These are introductory cards. Extended lesson and practice authoring is still pending for **every**
  entry, including all 282 that have a card.
- 98 assessable entries still have no introductory lesson. One roadmap entry is not assessed and no
  lesson is planned for it.
- Full introductory coverage of the I03 chain is a content fact. It says nothing about what the
  learner can do, and the wheeled-robot milestone is not demonstrated.
- Nothing in the application writes a proficiency answer by itself. Opening a card, following a
  prerequisite link, revealing an answer or resuming a review changes nothing. The only writers are
  the Yes / No / Clear controls, the guided review, and the prerequisite-chain control added in
  `ca43f91` — which lists every skill, marks nothing until confirmed, and is reversed by one Undo.
- The labs stay optional offline material, not wired to the app. Both edition 03 and edition 04 need
  NumPy. The edition 04 mobile lab tracks routes against an **ideal true pose**; its state estimation
  and fault supervision are **separate experiments**, not part of the tracking loop. It is not
  validated physical autonomy, has no hardware interface, and must not be connected to one.
- The export is 2.7 MB, within the app's 10 MB limit; Save, reopen and the draft cache were exercised
  at that size.
- One flake seen once: a chained `npm run test:e2e` run failed inside `pulse-e2e` with a page-side
  `Cannot read properties of null (reading 'textContent')`. It did not reproduce on a repeat chained
  run, and that suite passes on its own. The file is untouched by this work.
- Pre-existing and unrelated: `node tests/review-e2e.mjs` with `SSS_ATLAS` set times out opening the
  5.4 MB atlas at the end of its long session; the same file opens correctly in a fresh session.
- A `Robotics-Mobile-Manipulation-Learning-Edition-05.zip` has appeared under `Maps/Robotics-v3/`.
  It is untouched by this task.
