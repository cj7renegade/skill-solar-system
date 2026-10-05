# Scope 03 — The master atlas measured against the scope (Task 3)

Read-only. A script (kept outside the repository) read the master's and Robotics V3's ids, names,
domains, subdomains and connections. No answers, positions or lesson text were read, and both maps
were unchanged afterwards. The per-skill result is in `scope/master-tiers.json`.

## Method

The inclusion test (`docs/SCOPE.md` §2.1) is applied through the map's own connections:

| Tier | Rule |
| --- | --- |
| **seed** | A robotics skill: the starting points |
| **on path** | A *prerequisite* of a seed, directly or through any chain of prerequisite links: a **foundation** |
| **supporting only** | Not on a path, but linked to a seed or an on-path skill by a *supports* or *related* link |
| **not connected** | None of the above |

The master does not yet contain V3's milestones, so it is measured twice:

- **Measure A:** seeds are the master's own **44 Robotics skills**.
- **Measure B:** seeds are those 44 **plus the 204 master skills that Robotics V3 already reuses
  under the same id**. V3 includes them because its milestone chains need them, so this
  approximates the atlas after the V3 merge.

## Results

| | Measure A | Measure B |
| --- | ---: | ---: |
| Seeds | 44 | 248 |
| On a robotics path (foundations) | 201 | 76 |
| **In scope (seeds + on path)** | **245 (14%)** | **324 (18%)** |
| Supporting only | 864 | 894 |
| Not connected | 660 | 551 |

### By domain (Measure B)

| Domain | Skills | In scope (seed + on path) | Supporting only | Not connected |
| --- | ---: | ---: | ---: | ---: |
| Mathematics | 1,221 | **111 (9%)** | 786 | 324 |
| Physics | 200 | 46 (23%) | 43 | 111 |
| Electronics | 105 | 32 (30%) | 18 | 55 |
| Mechanics | 95 | 28 (29%) | 27 | 40 |
| Robotics | 44 | 44 (100%) | 0 | 0 |
| Computing | 104 | **63 (61%)**: all through V3; Measure A finds **0** | 20 | 21 |

### By origin of the skills (Measure B)

| Id family | What it is | Skills | In scope | Supporting only | Not connected |
| --- | --- | ---: | ---: | ---: | ---: |
| `mf-skill-*` | **A general-mathematics course import** (37 subdomains, such as Conic Sections, Polygons, Fractions) | **1,033** | **0** | 773 | 260 |
| `m-*` | Mathematics overview skills | 188 | 111 | 13 | 64 |
| `p-*`, `px-*` | Physics overviews and extensions | 82 + 99 | 46 + 0 | 14 + 15 | 22 + 84 |
| `e-*` | Electronics | 79 | 32 | 7 | 40 |
| `s-*` | Mechanics and materials | 74 | 28 | 11 | 35 |
| `c-*` | Computing edition | 104 | 63 | 20 | 21 |
| `r-*` | Robotics overviews | 27 | 27 | 0 | 0 |
| `sss-rob-*` | Robotics wave 1 (frames and kinematics) | 17 | 17 | 0 | 0 |
| `sss-dc-*`, `sss-phys-*`, `sss-mech-*`, `sss-mat-*` | The four granular batches | 26 + 19 + 11 + 10 | **0** | 41 | 25 |

## What the numbers mean

1. **Most of the master is outside the robotics paths as currently linked: 82% (Measure B).** The
   largest part is the **general-mathematics import (1,033 skills, 58% of the whole atlas), none of
   which is on a path.** It has its own network of 2,394 prerequisite links among its own skills. It
   connects to the rest of the atlas only through **related** links: 998 of its 1,033 skills are
   related-linked to an `m-*` overview skill.
2. **That is partly a linking pattern, not only a scope gap.** Each import skill typically sits
   *under* an overview: for example, granular derivative skills under `m-derivative`. When the
   overview is on a robotics path, the granular skills beneath it teach the same in-scope topic in
   finer steps, but a *related* link does not carry the inclusion test. The same applies to the four
   granular batches (DC circuits, physics, statics, materials): **66 skills authored for robotics
   preparation, none on a path**, because they hang off overviews by soft links.
   **This is a refinement for open question Q1** (`docs/SCOPE.md` §5). One option is a fifth rule:
   *"a granular decomposition of an in-scope overview is in scope"*. It needs an explicit
   "decomposes" relationship or a reviewed list, because a related link alone cannot tell
   decomposition from mere relevance. That option is set out in the decision brief.
3. **Computing reaches robotics only through V3.** None of the master's 104 computing skills is a
   prerequisite of a master robotics skill. V3 uses 63 of them. In the master, the link from
   programming to robotics is missing.
4. **The master's robotics layer is thin and broad.** It has 27 overview `r-*` skills and 17
   granular wave-1 skills. V3 has 129 granular robotics outcomes, none of which exists in the master
   (Task 1).

## The master's Robotics skills and the V3 milestones they would serve

Each master robotics skill is matched to the **closest V3 branch by its name**. That is a
**judgement for planning, not a verified crosswalk**. The milestones listed are the ones that V3
branch's own entries feed (from V3's `feedsMilestones`).

| V3 branch (milestones its entries feed) | Master Robotics skills | Count |
| --- | --- | ---: |
| Robot geometry and kinematics (I02, I03, I04, I05) | `r-frame`, `r-rigid`, `r-dof`, `r-configuration`, `r-forward`, `r-inverse`, `r-jacobian`, `r-singular`, `r-staticload`, and all 17 `sss-rob-*` (frame labels, rotation columns and checks, point vs direction, compose, inverse, serial DOF, joint conventions, task coordinates, planar FK, tool offset, planar reach, planar IK, IK verification, position Jacobian, joint-to-tip rate, planar singularity) | 26 |
| Control and trajectories (I01–I05) | `r-trajectory`, `r-feedback`, `r-pid`, `r-statespace`, `r-observe` | 5 |
| Actuation and transmissions (I01–I05) | `r-transmission`, `r-actuator`, `r-compliance` | 3 |
| Sensing, calibration and estimation (mostly I03–I05) | `r-estimation`, `r-fusion`, `r-cameramodel` | 3 |
| Wheeled mobility and navigation (I03–I05) | `r-navigation`, `r-planning` | 2 |
| Manipulation and combined tasks (I02, I04, I05) | `r-grasp` | 1 |
| CAD, fabrication and mechanical design (I01–I05) | `r-structure` | 1 |
| Electrical power, interfaces and measurement (I01–I05) | `r-thermal` | 1 |
| Requirements and systems practice (I01–I05) | `r-system` | 1 |
| Advanced pathways (X01 coupled dynamics) | `r-dynamics` | 1 |
| **Total** | | **44** |

**Not represented in the master at all:** V3's Software and embedded implementation, and
Verification, diagnosis and reliability (as robotics outcomes), and the five integration milestones
themselves.

## Duplicate candidates within the master

- **No two skills have the same name.**
- **7 near-identical names** were found, comparing skills in the same domain but different
  subdomains, with at least 80% of words in common:

| Overlap | Skill | Skill | Ruling suggested |
| ---: | --- | --- | --- |
| 1.00 | `m-ftc` Fundamental theorem of calculus (Calculus) | `mf-skill-82b750…` The Fundamental Theorem of Calculus (Definite Integrals) | **Likely the same ability** at overview and granular level |
| 1.00 | `m-substitution` Integration by substitution (Calculus) | `mf-skill-6ed4f3…` Integration Using Substitution (Integration Techniques) | **Likely the same ability** |
| 0.80 | Solving Systems of Nonlinear Equations Using Graphs | Solving Systems of Nonlinear Equations | Different method; probably distinct |
| 0.80 | The Domain and Range of Transformed Functions | Domain and Range of Transformed Reciprocal Functions | General vs a special case; distinct |
| 0.80 | Differentiating Reciprocal Trigonometric Functions | Differentiating **Inverse** Reciprocal Trigonometric Functions | Distinct |
| 0.80 | Polar Equations of Circles Centered at the Origin | Equations of Circles Centered at the Origin | Distinct coordinate systems |
| 0.80 | Integration Using Inverse Trigonometric Functions | Integration by Substitution With Inverse Trigonometric Functions | Overlapping; review |

**The bigger duplication pattern is structural, not by name.** 998 import skills are related-linked
to `m-*` overviews: the roadmap's "duplicate representations across imported math collections".
Whether an overview and its granular skills are both kept, both marked, or one retired is part of
Q1 and Q6. Merging nothing here.

## Outcome

Task 3 complete. Both real maps unchanged (`8e170740…`, `687f0916…`).
