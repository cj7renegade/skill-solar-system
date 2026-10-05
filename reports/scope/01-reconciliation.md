# Scope 01 — Reconciling the coverage inventory with today's maps (Task 1)

Read-only, following `coverage-inventory/CLAUDE-HANDOFF.md` steps 1–3. A script (kept outside the
repository, as this queue adds only documents and planning data) read ids, names, domains,
subdomains and connections from the two real maps and the inventory. It did not read answers,
positions or lesson text. Both maps' SHA-256 were checked unchanged afterwards. Full data:
`scope/reconciliation.json`.

## What the inventory was measured against

The inventory (dated 2026-09-14) records a baseline of **1,686 skills and 4,882 connections**, with
SHA-256 `8397d3f9…`. That is the fingerprint of `Maps/Archived maps/Skill-Solar-System-Math-Academy-Marked.json`
(recorded in `reports/08-archive.md`). So the roadmap describes the atlas as it was in that archived
copy. The archived file itself was not opened.

## Then and now

| | Inventory baseline (14 Sep) | Master today | Change |
| --- | ---: | ---: | ---: |
| Skills | 1,686 | 1,769 | **+83** |
| Connections | 4,882 | 5,142 | **+260** |
| Skills removed | — | — | **0** |
| Skills renamed (same id, new name) | — | — | **0** |
| Skills moved to another domain or subdomain | — | — | **0** |

| Domain | Baseline | Today | Added |
| --- | ---: | ---: | ---: |
| Mathematics | 1,221 | 1,221 | 0 |
| Physics | 181 | 200 | +19 |
| Electronics | 79 | 105 | +26 |
| Mechanics | 74 | 95 | +21 |
| Robotics | 27 | 44 | +17 |
| Computing | 104 | 104 | 0 |

**Every one of the 83 new skills comes from a delivered content batch**, and every batch is fully
integrated: all of its skills and all of its connections are present.

| Batch | In the inventory? | Skills (present) | Connections (present) | New subdomains |
| --- | --- | ---: | ---: | --- |
| `sss-dc-batch-01` | yes, "integration unverified" | 26 (26) | 84 (84) | DC interpretation, resistance, networks, dividers, power, measurement, diagnosis |
| `sss-physics-foundations-batch-01` | yes, "unverified" | 19 (19) | 61 (61) | Motion interpretation, graphs, models; Free-fall interpretation; Force interpretation, models, equations |
| `sss-mechanics-statics-batch-01` | yes, "unverified" | 11 (11) | 36 (36) | Planar statics and load transfer |
| `sss-material-behavior-batch-01` | yes, "unverified" | 10 (10) | 32 (32) | Material behavior and tensile testing |
| `robotics-foundations-batch-01` | **no**, delivered after the inventory | 17 (17) | 47 (47) | Frames and kinematics foundations |

- The inventory's four batches total 66 skills and 213 connections, exactly as it predicted ("1,752
  nodes and 5,095 edges" if integrated). The fifth batch is the roadmap's **expansion wave 1**
  (frames, transforms, configuration, basic kinematics), already delivered: 17 skills and 47 connections.
- The computing edition (104 `c-*` skills) was already in the baseline.
- **The inventory's "local integration unverified" status for all four batches can now be updated
  to "integrated and verified by id and connection".**

## Branch anchors

All **124** skill ids that the roadmap names (the inventory's `existingAnchors` plus every id written
in `COVERAGE-ROADMAP.md`) **exist in today's master**. None is missing or renamed.

## Overlap between the master and Robotics V3 (preparation for the later merge)

Robotics V3 ids are the planning id with a `rob3:` prefix. Many planning ids reuse the master's own
ids (`rob3:m-trig` ↔ `m-trig`).

| | V3 entries |
| --- | ---: |
| Planning id equals a master id | **204** (203 with the same name; `m-order`: "Order of operations" in the master vs "…for basic arithmetic" in V3) |
| No id match, but an identical name in the master | 0 |
| **No exact counterpart in the master** | **177** |

| V3 branch | Entries | Same id in master | No exact counterpart |
| --- | ---: | ---: | ---: |
| Mathematics | 101 | 90 | 11 |
| Computing | 68 | 63 | 5 |
| Physics | 33 | 25 | 8 |
| Electronics | 32 | 18 | 14 |
| Mechanics | 16 | 8 | 8 |
| Systems practice | 2 | 0 | 2 |
| **All 13 robotics branches** (requirements, kinematics, power, CAD, actuation, control, software, sensing, manipulation, verification, mobility, advanced, milestones) | 129 | **0** | **129** |

**Reading this:**

- V3's **foundations** largely reuse master skills: 204 of its 252 maths, computing, physics,
  electronics, mechanics and systems entries.
- V3's **robotics** is entirely its own: none of its 129 robotics entries shares an id or a name with
  the master's 44 Robotics skills.
- The master's Robotics domain is two layers. **27 broad `r-*` skills** ("Forward kinematics",
  "Inverse kinematics", "Grasping and contact mechanics") are overviews. **17 granular `sss-rob-*`
  skills** (wave 1) sit underneath them.
- V3's robotics entries are granular, assessable outcomes (for example `K05 Solve planar two-link
  forward kinematics`, `K11 Solve numerical inverse kinematics`).

**Suggested counterparts.** Matching names by shared words finds **35 candidate pairs** for the 177
(7 with at least half their words in common). They are listed in `scope/reconciliation.json` →
`v3SuggestedCounterparts`. **They are suggestions only, and several are coincidences**:

| Plausible | Coincidence |
| --- | --- |
| `B-E02 Interpret current as charge flow rate` ~ `e-current` | `X07 Coordinate multiple mobile robots` ~ `r-frame Robot coordinate frames` |
| `K11 Solve numerical inverse kinematics` ~ `r-inverse` | `C07 Analyze a linear control model` ~ `mf-skill-… Modeling With Linear Equations` |
| `A09 Measure backlash and compliance` ~ `r-compliance` | |
| `K04 Distinguish configuration, workspace and constraints` ~ `sss-rob-task-coordinates` | |

A real crosswalk needs a meaning-by-meaning review. It is listed as a merge prerequisite in the Task 5
decision brief.

## Outcome

The inventory is reconciled: **+83 skills, 0 removed or renamed, all batches present, all 124
anchors present.** Task 1 complete.
