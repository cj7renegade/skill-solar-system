# Capacity 02 — Synthetic map generator (Task 2)

## 1. Shape of the real maps (measured, read-only)

A read-only script parsed `Maps/Skill-Solar-System.json` and `Maps/Robotics-v3/Robotics-v3-Lessons.json`
and printed **numbers only**. No names, text, ids or answers were printed, copied or written. The
SHA-256 of both files was checked before and after every read and was unchanged
(`04821f06…` master, `687f0916…` export). Answers were not looked at.

### Master atlas: 1,769 skills

| Measure | Value |
| --- | --- |
| File size | 5,397,564 bytes pretty-printed (**3,051 bytes per skill**); 4,687,768 bytes compact |
| Connections | 5,142 (**2.91 per skill**) |
| Mix | prerequisite 3,822 (74.3%), supports 187 (3.6%), related 1,133 (22.0%) |
| Prerequisites per skill (incoming) | 0: 5 · 1: 221 · 2: 1,063 · 3: 448 · 4: 29 · 5: 3 (mean 2.16) |
| Skills each one leads to (outgoing prerequisites) | 0: 1,268 (72%) · 1–2: 296 · 3–5: 86 · 6–10: 53 · 11–50: 49 · >50: 17. Top ten: 196, 183, 134, 106, 95, 92, 77, 72, 68, 67 |
| Prerequisites within the same domain | 89.8% |
| Prerequisite depth (longest chain below a skill) | **max 23**, mean 9.49, median 9, p90 15, p99 19 |
| Depth histogram (depth: skills) | 0:5 1:6 2:9 3:31 4:139 5:86 6:103 7:182 8:285 9:181 10:145 11:80 12:90 13:94 14:77 15:124 16:40 17:40 18:20 19:15 20:10 21:4 22:2 23:1 |
| Reference levels | 1–70 (median 28); all skills `vortex` layout; largest coordinate 4,416 |
| Domains | Mathematics 1,221 (69%), Physics 200, Electronics 105, Computing 104, Mechanics 95, Robotics 44; 99 distinct subdomains |
| Text lengths, mean (median, max) | name 38 (35, 93) · description 108 (109, 240) · details 786 (778, 1,323) · placement note 329 (346, 347) |
| Other node fields | about 582 bytes compact per skill of editorial fields (`sourceAlignment`, `editorialProfile`, `sourceLessons` …) |
| Connection text | rationale on 33% of connections (mean 126 characters); `reasonRef` on 67%; mean connection 161 bytes compact |

### Robotics V3 export: 381 entries, 298 lessons

| Measure | Value |
| --- | --- |
| File size | 2,762,626 bytes (7,251 bytes per entry) |
| Connections | 894 (2.35 per entry): 888 prerequisite, 6 supports |
| Prerequisite depth | max 23, mean 9.96 |
| **Lesson payload per authored entry** (compact JSON of `lesson` + `lessonCard` + `details` + `placementNote`) | **mean 5,640 bytes**, p10 4,594, median 5,701, p90 6,477, max 8,810 |
| Whole authored entry | mean 6,397 bytes compact; unauthored entry 2,179 |
| Lesson fields | 21 (`explanation`, `worked_example`, `practice{question,answer}`, `boundary_case{…}`, `references[{url,use}]` …); `lessonCard` holds 8, including the `assessmentContract` object |

**Depth is the same (23) in both maps**, even though one is 4.6 times bigger than the other.
This supports the Task 1 finding: depth grows with how many layers a subject stacks, not with
how many skills there are.

## 2. The generator — `authoring/stress/generate-stress-map.mjs`

```
node authoring/stress/generate-stress-map.mjs --nodes 10000 --variant full [--seed 1] [--out C:\sss-scratch\stress]
```

| Requirement | How it is met |
| --- | --- |
| Deterministic | A seeded random generator (mulberry32), no clock. The same nodes, variant and seed give **byte-identical files**: `stress-10000-full.json` regenerated into a separate folder had the same SHA-256 (`7986c01c…`), and the unit test checks it |
| Realistic shape | Depths follow the master's depth histogram; domains follow its mix; incoming prerequisites per skill follow its histogram; 89.8% same-domain prerequisites. Parents are chosen in proportion to (links already given + 1)², which reproduces the few heavily used foundations. Supports and related links are added in the master's ratios. Text lengths follow the master's means |
| **No prerequisite loops** | By construction: every prerequisite runs from a lower depth to a higher one. Checked with the app's own `levels()` on every map, which throws "Prerequisite cycle detected" on any loop. It also checks that every skill's computed depth equals its planned depth |
| Levels and positions | The same arithmetic as `src/vortex.js` (`referenceLevels`, `arrangeVortex`), so maps look as if **Arrange level spiral** had been run. It is repeated in the generator because the app's functions call `validate()`, which refuses maps above 5,000 skills |
| Clearly synthetic | ids `syn:00001`…; names `Synthetic skill 00001 …`; subdomains `Synthetic Mathematics 07`; all text is the sentence "Synthetic stress-test text with no real content."; `metadata.syntheticNotice` says so |
| Own atlas family | `metadata.atlasFamily = "stress-test-synthetic"`, and `datasetKey = "stress-test-synthetic-<N>-<variant>"`, so review sessions never mix sizes |
| Every answer null | `proficiency80: null` on every skill (0 answers in every file) |
| Two variants | **skeleton:** master-like cards (name, description, details, placement note, and a `syntheticProfile` field standing in for the editorial fields). **full:** the same, plus a Robotics-V3-shaped `lesson` and `lessonCard` on every skill, with `contentStatus` and `lessonStatus` set as for an authored entry |
| Safe output | Refuses to write inside the repository or inside `%OneDrive%` (`checkOutputFolder`); default `C:\sss-scratch\stress\` |

**Two calibrated values**, labelled as such in the code:

- `otherFields: 770` sets the editorial-field stand-in so a saved skeleton map matches the master's
  bytes per skill. Result: **3,047 vs 3,051**.
- The lesson-share factor `0.43` makes the lesson payload match Robotics V3. Result: **mean 5,625 vs
  5,640 bytes**, p10 5,110 vs 4,594, p90 6,138 vs 6,477.
- The synthetic spread is narrower than the real one, and the largest synthetic lesson is 6,422
  bytes against 8,810.

### Same size as the master, generated vs real

| | Real master | Generated (1,769 skeleton, seed 1) |
| --- | ---: | ---: |
| Connections | 5,142 | 5,129 |
| prerequisite / supports / related | 3,822 / 187 / 1,133 | 3,812 / 187 / 1,130 |
| Incoming prerequisites 1 / 2 / 3 / 4 / 5 | 221 / 1,063 / 448 / 29 / 3 | 214 / 1,073 / 458 / 17 / 2 |
| Skills leading nowhere | 1,268 | 1,134 |
| Skills leading to >50 | 17 | 16 |
| Largest out-degree | 196 | 202 |
| Depth max / mean | 23 / 9.49 | 23 / 9.49 |
| Highest level | 70 | 70 |
| Largest coordinate | 4,416 | 4,416 |
| Bytes per skill (pretty) | 3,051 | 3,047 |
| Passes the app's `validate()` | yes | yes |

**Known simplification.** The generator keeps the master's depth distribution at every size. It
models an atlas that grows in **breadth**, so levels stay at 70 and no generated map tests the
100-level limit. A deliberately deeper curriculum would need a depth-scaling option, which was not
built because the task did not ask for one. The level question is treated analytically in the
proposal.

## 3. Generated maps — `C:\sss-scratch\stress\`

Outside the repository and outside OneDrive; never committed. SHA-256s are in
`C:\sss-scratch\stress\SHA256SUMS.txt`.

| File | Skills | Connections (per skill) | prerequisite / supports / related | Size pretty (as saved) | Size compact (draft cache) | Largest coordinate | Generated in |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| `stress-2000-skeleton.json` | 2,000 | 5,862 (2.93) | 4,357 / 213 / 1,292 | 6,108,306 | 5,503,369 | 4,416 | 0.05 s |
| `stress-2000-full.json` | 2,000 | 5,801 (2.90) | 4,312 / 211 / 1,278 | 16,459,196 | 14,745,219 | 4,416 | 0.09 s |
| `stress-5000-skeleton.json` | 5,000 | 14,447 (2.89) | 10,739 / 525 / 3,183 | 15,228,571 | 13,726,480 | 6,202 | 0.13 s |
| `stress-5000-full.json` | 5,000 | 14,436 (2.89) | 10,730 / 525 / 3,181 | 41,165,244 | 36,878,900 | 6,272 | 0.29 s |
| `stress-8000-skeleton.json` | 8,000 | 23,091 (2.89) | 17,163 / 840 / 5,088 | 24,363,334 | 21,962,075 | 9,408 | 0.28 s |
| `stress-8000-full.json` | 8,000 | 23,190 (2.90) | 17,237 / 843 / 5,110 | 65,911,360 | 59,046,583 | 9,379 | 0.53 s |
| `stress-10000-skeleton.json` | 10,000 | 29,044 (2.90) | 21,588 / 1,056 / 6,400 | 30,495,130 | 27,482,917 | 11,479 | 0.36 s |
| `stress-10000-full.json` | 10,000 | 29,046 (2.90) | 21,590 / 1,056 / 6,400 | 82,317,267 | 73,739,503 | 11,498 | 0.69 s |
| `stress-12000-skeleton.json` | 12,000 | 34,962 (2.91) | 25,987 / 1,271 / 7,704 | 36,622,243 | 33,001,522 | 13,788 | 0.50 s |
| `stress-12000-full.json` | 12,000 | 34,819 (2.90) | 25,881 / 1,266 / 7,672 | 98,795,418 | 88,500,418 | 13,798 | 0.88 s |

Every file: deepest chain 23, highest level 70, 0 answers, family `stress-test-synthetic`.

**What the sizes already say, before opening anything:**

- **Only `stress-2000-skeleton.json` (6.1 MB) is under the 10 MB open cap** (`app.js:232`). Every
  other file is expected to be rejected on size alone. Task 3 records the exact message.
- **At 10,000 skills, connections are 29,044**, well over the 20,000-connection cap (`model.js:60`),
  even for a map that fits the 5,000-skill cap by count. The 8,000 maps are over it too.
- The largest spiral coordinate grows from 4,416 to 13,798: rows of peers push outward, as
  predicted in `01-limits-inventory.md` §D. That is still far inside ±100,000.

## 4. Unit test — `tests/stress-generator.test.mjs`

A new file; no existing test changed. Four tests, all passing (0.28 s):

1. The same size, variant and seed give byte-identical maps; a different seed does not.
2. Skeleton and full maps at 2,000 skills pass the **app's own `validate()`**. Each test also
   checks: 2,000 unique ids, every answer null, synthetic ids and names, family
   `stress-test-synthetic`, all three link types, lessons only in the full variant, and that
   `lessonSections` renders a synthetic lesson.
3. A 6,000-skill map (above today's cap) is loop-free through `levels()`, holds 6,000 skills, and
   keeps levels ≤ 100.
4. `checkOutputFolder` refuses the repository's `Maps/` and a folder inside OneDrive.

`npm test` is now **211 tests: 205 pass, 6 skipped (the same `SSS_ATLAS` six), 0 fail**.
