# Humanoid Protocol Droid Helix — import notes

The new map `Maps/Humanoid-Helix-Atlas.json` merges the Robotics Atlas with the humanoid helix
extension. It is **import, schema mapping, layout and display only**: no skill or prerequisite link
was authored, renamed or deleted. This file records every mapping decision. Where the brief was
ambiguous, the option that preserves existing data was taken, and it is marked **Decision**.

Edition 1 was built 2026-11-05 and merged in PR #26. **Edition 2** was built 2026-11-06 on branch
`humanoid-helix-map`, not pushed or merged. The counts below are edition 2's.

## Edition 2 (2026-11-06)

JC supplied a new extension, `Humanoid-Helix-Extension 2.json` (`3d66d2e6…`), with the same brief.
Against edition 1's extension (`e8cdd13b…`) it only adds things:
- **274 new skills**, all physics (PHY): electrostatics through magnetic circuits, rigid-body
  mechanics, oscillation, heat, fluids, acoustics, optics, plus 4 physics checkpoints. Total: 1,741
  new nodes (1,670 skills, 67 checkpoints, 4 milestones).
- **857 new edges**: 225 "New (physics feeds)", 609 "New" and 23 "New (checkpoint)". Total: 6,355.
- **No skill or edge removed**, and no name, stage, level, course or description changed. 595
  existing humanoid skills changed only in depth, helix or prerequisites: 560 have deeper chains
  below them, and 133 gained prerequisites (none lost one).
- The longest chain grows from 61 to 81, so the top level goes from 184 to 244.

Decisions for edition 2:
- **Decision: same key and answer family (`humanoid-helix-v1`).** The answer record is named after
  the family alone (`desktop/proficiency-store.cjs`), and progress is keyed by skill id. Edition 2
  removes no id, so keeping the key keeps every answer already given on the helix map, including
  the copied `rob3:B-C01`. A new key would have started an empty record and left those answers
  behind. `datasetVersion` is now `2.0`, `created` stays 2026-11-05, `updated` is 2026-11-06, and
  `metadata.humanoidHelixImport.edition` is 2. The Robotics Atlas's keys are untouched.
- **Decision: the extension file is replaced in place.** `imports/humanoid-helix/Humanoid-Helix-Extension.json`
  is now edition 2's file, byte-identical to `Humanoid-Helix-Extension 2.json` at the root. Edition
  1's file stays in Git history, and its SHA-256 is in the Inputs table. Edition 1's built map was
  saved to `C:\sss-scratch\humanoid\edition1\` (`31f64afc…`).
- **The workbook was not re-exported.** The root `Humanoid-Skill-Helix-Taxonomy.xlsx` is still
  edition 1's: the same size, dated 2026-11-05, open in Excel, and it has 3,422 rows, not the 3,696
  the brief describes. The import copy is unchanged (`89968c1e…`). So:
  - **Decision: Atlas skills' `helixLevel` comes from the merged graph**, 1 + 3 × depth, not from the
    sheet. Twelve physics feeds now point into Atlas skills, so 611 sheet rows (Atlas and humanoid)
    no longer match the graph: for example, `p-lagrangian` 46 → 52 and `s-bending` 43 → 49. The
    graph's value is what the height shows, and validation now checks every skill's `helixLevel`
    against it. New skills keep the extension's `helix`, which matches the graph for all 1,741.
  - **Decision: On Humanoid Path is `true` for the 274 skills that are not in the sheet.** Every one
    of the 1,467 humanoid skills in the sheet is on the path, and each of the 274 leads to I08 or I09
    (check 13). This is recorded in `metadata.humanoidHelixImport.onPathNotInSheet`.
  - The course, build stage and tier of Atlas skills still come from the sheet. All 1,955 rows are
    present, and the extension changes no Atlas skill's stage.
  - *Your call:* re-export the workbook from the desktop app and re-run `extract_taxonomy.py` (after
    closing Excel). The build will then use the new sheet, and the validator's sheet note should drop
    to 0.
- **The prerequisites check (check 12)** now allows the "physics feeds" and "checkpoint" edges into a
  skill on top of its `prereqs`, as the brief says. In this file every such edge is already listed in `prereqs`
  (0 extras), so the check is as strict as before.
- **Validation check 18 (new):** every skill's `helixLevel` equals 1 + 3 × its depth in the merged
  graph.

## Inputs

| Input | Where | SHA-256 |
| --- | --- | --- |
| Robotics Atlas (read-only) | `Maps/Robotics-Atlas.json` | `1212ad46654fb84f9bccdd71446fec025f5f19753cb65efcca0f0e024714b452`, unchanged before and after |
| Extension (edition 2) | `imports/humanoid-helix/Humanoid-Helix-Extension.json` | `3d66d2e6750c…`, byte-identical to `Humanoid-Helix-Extension 2.json` at the repository root. Edition 1: `e8cdd13b6418…` |
| Taxonomy workbook (reference) | `imports/humanoid-helix/Humanoid-Skill-Helix-Taxonomy.xlsx` | recorded in the map's `metadata.humanoidHelixImport.sources` |
| Full Taxonomy sheet, extracted | `imports/humanoid-helix/Full-Taxonomy.json` | made by `authoring/humanoid-helix/extract_taxonomy.py`; records the workbook's SHA-256 |

- **Decision: copies in `imports/humanoid-helix/`.** The files were at the repository root, not in
  `imports/humanoid-helix/`. They were copied there, and the originals were left untouched and
  uncommitted.
- **Decision: the workbook copy.** The root workbook was locked by Excel, which had it open. The
  copy was taken earlier in the session, when the file could still be read. The build checks
  `Full-Taxonomy.json` against that copy's fingerprint.
- **The Skill Code column is never used as an identifier.** Every join is on Node ID. All 3,422 sheet
  rows match a skill in the map; the 274 skills added in edition 2 are not in the sheet (see Edition 2).

## How to rebuild and check

```sh
python authoring/humanoid-helix/extract_taxonomy.py      # only after the workbook changes
node authoring/humanoid-helix/build-helix-map.mjs         # writes Maps/Humanoid-Helix-Atlas.json
node scripts/validate-humanoid-helix.mjs                  # fails loudly and stops on any problem
```

## Atlas nodes (1,955)

Every existing field is unchanged and in its original order: id, name, details, lessons, lesson
cards, source references, `proficiency80`, `skillLevel`, `layoutMode`, and so on. Only the position
is recomputed, and five fields are added from the Full Taxonomy sheet:

| Field | From | Notes |
| --- | --- | --- |
| `course` | Course | the course name |
| `courseCode` | Course → code | from the extension's 16 `courses` pairs |
| `buildStage` | Build Stage | the stage number 1–7. **Decision:** the 298 Atlas skills whose stage reads "Enrichment" (exactly the 298 off the humanoid path) get `null`; the stage names are in `metadata.humanoidHelixImport.buildStages` |
| `onHumanoidPath` | On Humanoid Path | Yes → `true`, No → `false` |
| `helixLevel` | 1 + 3 × depth in the merged graph | edition 1 took the sheet's Helix Level, which then matched the graph; edition 2 computes it, because the sheet predates the physics feeds |

- **Decision: where an Atlas skill's tier goes.** The brief asks for the Core/Enrichment level of
  Atlas skills, but allows only five added fields. The tier (the Level column: Core, Working,
  Specialist, Enrichment, Checkpoint, Milestone) is therefore stored for Atlas skills in
  `metadata.humanoidHelixImport.atlasTiers`, keyed by id. The level filter reads it from there. New
  skills carry it as their own field, `helixTier`. *Your decision:* to make it a sixth field on Atlas
  nodes too, add it in `build-helix-map.mjs`, and allow it in `scripts/validate-humanoid-helix.mjs`
  check 4.
- **`skillLevel` is not changed** on Atlas skills; it keeps the Atlas's 1–100 rank. Height uses
  `helixLevel`.

## New nodes (1,741)

| Map field | From the extension | Notes |
| --- | --- | --- |
| `id`, `name`, `description` | id, name, description | as given (longest name 87 characters, longest description 205) |
| `details` | description | as suggested |
| `domain` | course | **Decision**, below |
| `subdomain` | subject | |
| `nodeKind` | kind | skill, checkpoint or milestone |
| `skillLevel`, `helixLevel` | helix | as suggested; the map declares the range 1–244 |
| `assessmentMode` | practice and type | written + QUANT → `written calculation`; written + QUAL → `documented scenario`; code → `runnable code or trace`; hands-on → `supervised demonstration`; design → `drawing, calculation or supervised fabrication` |
| `assessable` | kind | `true` except the 4 milestones |
| `contentStatus`, `lessonStatus` | — | `introductory lesson pending`; `no lesson yet` |
| `contentAuthorship` | — | `Editorial humanoid taxonomy, Nov 2026` |
| `course`, `courseCode`, `buildStage`, `onHumanoidPath` | course, stage; the sheet's On Humanoid Path (`true` for the 274 not in the sheet) | the five added fields |
| `helixTier`, `helixType`, `helixPractice` | level, type, practice | kept so no source value is lost |
| `proficiency80` | — | `null`. **Decision**, below |
| `pinned`, `icon`, `layoutMode`, `placementNote`, `position` | — | the schema's neutral defaults: `false`, the domain's icon, `vortex` (as every Atlas node), `''`, and the layout's position |

- **Decision: `domain` is one of the app's six domains, not the course name.** The app refuses any
  map with a domain outside Mathematics, Physics, Mechanics, Electronics, Computing and Robotics
  (`src/model.js`), so `domain = course name` would make the map unopenable. Each course takes the
  domain all of its Atlas skills already use:

  | | Courses |
  | --- | --- |
  | Mathematics | MTH |
  | Physics | PHY |
  | Mechanics | MAT, MEC |
  | Electronics | ELX, PWR |
  | Computing | EMB, CST, AIL |
  | Robotics | ACT, KDC, LOC, MAN, PER, HRI, SYS |

  PWR and HRI have no Atlas skills to take a domain from; they were given Electronics and Robotics. The
  course itself is in `course` and `courseCode`, and the helix map colours and filters by course.
  *Your decision:* whether to extend the app to 16 domains instead. That would be a wider change, to
  validation, highlights and the inspector.
- **Decision: `proficiency80` is `null` (unmarked).** In this schema `false` is a real No answer,
  and `null` is "not marked". The app colours both red when proficiency colouring is on. Writing
  `false` would record 1,741 answers nobody gave, so the brief's "not proficient" is taken as unmarked.
- `supervised demonstration` is not one of the six assessment modes the card already names, so the
  card shows it as "Assessed as: supervised demonstration."

## Edges

All 5,783 Atlas edges are unchanged and in order. All 6,355 extension edges are added after them as
`{source, target, type: "prerequisite", authorship: "editorial", rationale: "<origin>: added by the humanoid helix taxonomy (Nov 2026)"}`:
- 3,958 with origin "New";
- 1,756 "New (math rewiring)";
- 225 "New (physics feeds)" (12 of them into Atlas skills);
- 416 "New (checkpoint)".

None duplicates an Atlas edge. Some point into existing Atlas skills, as intended: the maths rewiring,
the checkpoints feeding `rob3:I01`–`rob3:I04`, and bridges such as those into `rob3:D01` and
`rob3:D03`.

## Metadata and identity

- `title`: "HelixSkill — Humanoid Protocol Droid Helix".
- **Its own key and answer family:** `datasetKey`, `atlasFamily` and `datasetId` are all
  `humanoid-helix-v1`. Neither `robotics-curriculum-v3` nor the Robotics Atlas's
  `robotics-atlas-merged` / `sss-robotics-foundations-2026-09` is changed or reused. The originals
  are recorded in `metadata.humanoidHelixImport.originalMap`.
- `metadata.courses`: the 16 `[code, name]` pairs in the extension's order.
- `metadata.humanoidHelixImport` holds:
  - the inputs and their SHA-256;
  - the counts;
  - the course-to-domain table, the stage names and the Atlas tiers;
  - the list of added fields.
- `levelModel`: the same 1 + 3 × depth rule, now over the merged graph. The longest chain is 81, so
  the range and used range are 1–244, and `helixScaling` explains the height scale.
- Every other top-level key of the Atlas (its expansion and merge records) is kept as it is.

## Answers and review history: copied, never moved

- **Answers.** The map has its own answer family, so marking a skill here never changes the Robotics
  Atlas.
  - The 308 answers saved in the Atlas skills' fields travel in the file. On first open the app adopts
    them into the new family's record: a copy.
  - One answer existed only in the Robotics Atlas's shared record, not in any file: `rob3:B-C01` = Yes
    (2026-11-05). **At JC's request it was copied on 2026-11-05** with
    `authoring/humanoid-helix/copy-answers.mjs --write`:
    - a backup was taken first (`HelixSkill Backups\2026-11-05_231624`);
    - the helix family's record (`humanoid-helix-v1-066fb7ce10c8.json`) was created as the app's first
      open would create it (308 answers adopted from the file), plus the copy, for 309 entries;
    - the Robotics Atlas record is unchanged (`23471d5c…`);
    - opening the map in an isolated profile with that record shows `rob3:B-C01` as Yes.
- **Review history.** Review sessions are keyed by the map's key and skill set, so none carries over;
  a review on the new map starts fresh.

## Layout: the helix

`src/helix.js`, used only by maps whose `layout.type` is `helix`:
- **Height:** helix level, scaled so level 244 sits where level 100 sits on other maps (6,336 units,
  26.07 per level). So the camera, grid and navigation behave as on every other map.
- **Angle:** each of the 16 courses has its own sector, in the course order above, and all sectors
  wind upward through two turns. A course therefore reads as one band. Skills sharing a course and
  level fan across the sector, then into outward rows. The radius widens with height, from 700 to
  1,600 units.
- **Milestones:** the 9 milestones (`rob3:I01`–`I05`, `hx-sys-ms-i06`–`i09`) sit on the central axis
  as larger octahedra. **Decision:** the sheet also marks `rob3:X10` (the legged/aerial roadmap note)
  as a milestone. The brief's list and the map's `nodeKind` (`roadmap`) do not, so it gets no axis
  marker.
- **Checkpoints:** the 67 `nodeKind: checkpoint` skills are smaller spheres.
- **Pins:** pinned skills keep their place (none is pinned today).
- **Arrange buttons:** on this map, both rebuild the helix. The six-domain spiral's 100-level scale
  cannot hold it.

## Display (helix maps only)

- **Colour:** spheres and list dots use the 16 course colours, with hues evenly spaced in course
  order. The six-domain subject highlights still work.
- **Legend:** four filters and the course key, scrolling inside its panel. The filters are:
  - course;
  - build stage 1–7, or "No stage";
  - On humanoid path;
  - level: Core, Working, Specialist, Enrichment, Checkpoint or Milestone.

  They combine, show "Showing N of 3,696 skills", and only dim the other skills: the map, the
  selection and the answers are never changed.
- **Cards** show the course and "Helix level N/244", and the placement and position text describe the
  helix band.
- **Map list:** the file sits in `Maps/`, so it appears in "Your maps". It is not made the default.

Every other map is unaffected. Edition 2 changed no app code: only the map, the build and validation
scripts, and the helix tests. The full end-to-end suite (807 checks) passed for edition 1.

## Validation output (`node scripts/validate-humanoid-helix.mjs`, edition 2)

```
PASS node count is 3,696 (1,955 Atlas + 1,741 new) (3696)
PASS node ids are unique
PASS every Atlas and extension id is present
PASS prerequisite edge count is 10,741 (4,386 Atlas + 6,355 new) (10741)
PASS every edge source and target exists
PASS no duplicate edges (12138 edges)
PASS every Atlas edge is present unchanged, in order
PASS every extension edge is present as a prerequisite
PASS no prerequisite cycles (topological sort succeeds) (3696 sorted)
PASS the longest prerequisite chain is 81 (81)
PASS every Atlas node is identical to the original except the five added fields and position (1,955 nodes)
PASS every new node's prerequisites in the map equal its prereqs, plus physics-feed and checkpoint edges into it (1,741 nodes; 0 have feed edges beyond prereqs)
PASS every non-Atlas node reaches hx-sys-ms-i08 or hx-sys-ms-i09 (1,741 nodes)
PASS Maps/Robotics-Atlas.json is byte-identical to the build's input (1212ad46654fb84f)
PASS the new map has its own dataset key and answer family
PASS the app's own validator accepts the map
PASS new nodes start unmarked and with no lesson
PASS every skill's helixLevel equals 1 + 3 x its depth in the merged graph (top level 244)

NOTE extension helix/depth values that differ from the merged graph: 0
NOTE spreadsheet Helix Level / Prereq Depth values that differ from the merged graph: 611 (e.g. p-lagrangian 46 vs 52; s-beamforces 40 vs 46; s-bending 43 vs 49)
NOTE new skills not in the spreadsheet (On Humanoid Path set to true): 274, all true

All 18 checks passed.
```

The built map: 12,370,505 bytes, SHA-256 `cf4d051ccd96ed500ac220840e4bc1739133aecb56fbe6a4e18a332c7c1d138d`.

## Performance

Measured with `authoring/stress/measure-app.mjs`, 3 runs each, isolated profile, scratch copies. The
Robotics Atlas and edition 1 columns are from 2026-11-05.

| | Robotics Atlas | Helix, edition 1 | Helix, edition 2 |
| --- | --- | --- | --- |
| Skills / connections | 1,955 / 5,783 | 3,422 / 11,281 | 3,696 / 12,138 |
| Open | 0.44–0.47 s | 0.75–0.82 s | 0.79–0.82 s |
| Moving the camera | 56.8 fps (worst 5%: 54.6–54.9) | 56.8 fps (worst 5%: 54.6–54.9) | 59.9 fps (worst 5%: 59.5) |
| Arrange | 0.34–0.35 s (spiral) | 0.53–0.56 s (helix) | 0.60–0.65 s (helix) |
| Save | 0.18–0.20 s | 0.30–0.33 s | 0.31–0.33 s |
| Start a review | 0.21–0.22 s | 0.33–0.35 s | 0.35–0.37 s |
| Memory at the end | 708–712 MB | 904–951 MB | 1,018–1,041 MB |
| File size | 7.9 MB | 11.8 MB | 12.4 MB |

Edition 2 stays smooth. The frame rates from the two days are not directly comparable, because
the Robotics Atlas was not measured again today: 59.9 fps is the display's limit. By default the app draws only the selected
skill's connections, which is already the brief's fallback.

**All connections at once is the one weak spot.** This was measured on edition 1 and not again.
With "Selected connections only" unticked, edition 1 took 1.9 s to draw all 11,281 lines. Orbiting
then ran at a 56 fps median but stuttered, with the worst 5% of frames at 89 ms. Edition 2 has 8%
more lines, so expect the same or slightly worse. The cause is that every line is its own drawable
object. Batching them would fix it, but that changes the renderer for every map, so it was left.
*Your decision.*
## Screenshots (`docs/screenshots/humanoid-helix/`, retaken for edition 2)

| File | Shows |
| --- | --- |
| `01-helix-overview.png` | the whole helix, the filters and the course key |
| `02-filter-course-actuation.png` | course filter: Actuation & Power Transmission (128 skills) |
| `03-filter-milestones.png` | level filter: milestones on the axis |
| `04-card-rob3-K05.png` | an Atlas skill's card with its lesson |
| `05-card-hx-act-harmonic-drive.png` | a new skill's card: no lesson, "Helix level 76/244" |
| `06-robotics-atlas-unchanged.png` | the Robotics Atlas, still the six-domain spiral |
| `07-card-hx-em-field-lines.png` | an edition 2 physics skill's card: no lesson, "Helix level 34/244" |
