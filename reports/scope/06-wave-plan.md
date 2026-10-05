# Scope 06 — Wave plan and capacity checkpoint (Task 6)

An ordered list of work that takes the atlas from today to the finished scope (`docs/SCOPE.md`),
built from the branch map (`scope/branches.json`, `reports/scope/04-branch-map.md`). Skill counts
per package are **estimates**: at least one skill per split or new roadmap candidate, up to about
three. Every package reports its real counts when done, and this plan is updated from them.

## How the roadmap's order changes after measuring

The coverage roadmap (14 Sep) ordered six waves, robotics first:

1. frames and kinematics;
2. actuation;
3. control;
4. sensing and perception;
5. localization, planning and integration;
6. supporting foundations.

The measurements change that order in three ways:

- **Wave 1 is already done.** The 17 `sss-rob-*` skills (frames, transforms, planar kinematics) are
  in the master and in scope (Task 1).
- **Roadmap waves 2–5 are already covered by Robotics V3.** In the branch map, R1–R11 are covered
  except one split (R6) and the R12 machine-elements gap. But the coverage is in V3, not the master:
  9 branches are "covered once V3 is merged". So **the V3 merge is the single largest step**: it
  brings 177 skills and 298 introductory lessons into the master.
- **The remaining roadmap gaps are almost all in the foundations.** 34 of the 38 split or new
  candidates are in physics, electronics, mechanics and computing.

## The plan

| Order | Package | Branches | New skills (estimate) | Depends on | Touches JC's real data? |
| ---: | --- | --- | ---: | --- | --- |
| 0 | **Decisions.** JC answers `reports/scope/05-decisions.md` (Q1–Q6, X06, K05–K07, calculus, duplicates, the evidence field) | all | 0 | — | no |
| 1 | **Capacity checkpoint:** capacity steps 1–4 from `reports/capacity/05-proposal.md` (Undo memory budget, visible draft warning, cheaper rendering, raised and tested file cap) | app | 0 | the decision to merge `capacity-stress-test` | no: app code only |
| 2 | **Robotics V3 merge** (the merge checklist in `05-decisions.md` §D): crosswalk, id policy, one atlas family, `m-logic` and every other differing answer decided by JC, recalculated levels, re-based import pipeline | R1–R14, S8 and every foundation branch V3 touches | **+177** (V3 entries with no master id) | 0, 1 | **yes: the first change to JC's real master and answer record.** Back up first |
| 3 | **Robotics completions**: R6 *inconsistent measurement innovation* (split); R12 *coupling misalignment vs backlash* (new); K05–K07 made prerequisites (if decided); the pending V3 lessons in scope | R6, R12, R2, R5, R7 | 2–6 | 2 | yes (master map) |
| 4 | **Electronics foundation splits** (e.g. dependent sources, capacitor initial/final voltage, conduction vs switching loss, ADC codes, return loops) | E1, E2, E3, E4, E5, E8 | 12–36 | 2 | yes |
| 5 | **Mechanics foundation splits** (distributed loads, truss joints, uniaxial-model limits, buckling assumptions, nominal vs peak stress, yield vs fracture, fibre direction, processing and dimensions, datum schemes, differential expansion) | S1–S7 | 10–30 | 2 | yes |
| 6 | **Physics foundation splits** (observer transforms, energy-balance systems, momentum conservation limits, Bernoulli assumptions, thermal sign conventions, flux mechanisms, phase and delay; resolution vs pixel sampling) | P2, P3, P5, P6, P7 | 8–24 | 2 | yes |
| 7 | **Computing foundation splits** (function contracts, boundary tests, numerical cancellation, ownership across tasks, leakage, asymmetric metrics) | C1, C2, C3, C6 | 6–18 | 2 | yes |
| 8 | **Mathematics audit**: duplicate rulings, and the "decomposes" relationship if Q1 (b) is chosen | M1–M3 | 0 (reclassifies up to 894 existing skills) | 0 | yes, if links are added |
| 9 | **Extension pathways** X01–X09, after the core is solid (Q3) | R14 | lessons for 11 entries | 2–7 | yes |

Roadmap waves 1–6 map onto this plan as follows:

| Roadmap wave | Where it is now |
| --- | --- |
| 1 | Done |
| 2–5 | Package 2, with the completions in package 3 |
| 6 | Packages 4–8 |

Packages 4–7 can run in any order once package 2 has landed. The order above follows the
dependency direction (electronics and mechanics feed actuation, power and structure).

## Capacity checkpoint

**The atlas never reaches 3,000 skills in this scope.**

| Point | Skills |
| --- | ---: |
| Master today | 1,769 |
| After the V3 merge | 1,946 |
| With every split and new skill (estimate) | about 1,984–2,060 |

All of these are inside today's 5,000-skill cap, and well inside the range where the app was
measured fast: 60 fps and 0.15–0.17 s per click at 1,769–2,000 skills
(`reports/capacity/03-current-app.md`).

**The limit that does bind is the 10 MB file cap, because of lessons.** File size can be estimated
from measured densities:

- **Skills:** 3,050 bytes per skill without lessons (the master).
- **Lessons:** plus 5,640 bytes per lesson (the V3 mean).

The model was checked against the real V3 export: it predicts 2.84 MB for 381 entries with 298
lessons, against 2.76 MB measured (within 3%).

| Point in the plan | Skills | Lessons | Estimated file size | Share of the 10 MB cap |
| --- | ---: | ---: | ---: | ---: |
| Today: the master as saved | 1,769 | 0 | 5.40 MB (measured) | 54% |
| After package 2 (V3 merge) | 1,946 | 298 | ≈ 7.6 MB | **≈ 76%** |
| After packages 3–7, skills only | ≈ 1,984–2,060 | 298 | ≈ 7.7–8.0 MB | ≈ 80% |
| With an introductory lesson on every required skill | ≈ 1,984–2,060 | ≈ 540–615 | ≈ 9.1–9.75 MB | **≈ 91–98%** |
| If Q1 (b) brings up to 894 more skills into scope, with lessons | | | well over 10 MB | over the cap |

**At the merged size, only about 720 lessons fit under 10 MB in total, and V3 already has 298.**

**So the checkpoint is package 1, before the merge.** Capacity steps 1–4 must land before package 2.
Step 4 (raise the file cap to a tested ceiling, with guard tests) is what this scope strictly needs.
Steps 1–3 keep the app comfortable as it grows:

- Undo would otherwise copy an 8–10 MB map up to 50 times.
- The draft cache was measured to fail silently on open for much larger maps.

The merge itself is also where JC's real data is first touched, so doing the safety work first
means the first real change happens on the stronger app.

**Alternatives, if the capacity work is to wait:**

| Option | Effect |
| --- | --- |
| Merge V3 without lessons on the master skills it shares | Skeleton merge: ≈ 5.9 MB. Keeps lessons in the V3 file until capacity lands, but the merged atlas has no lesson cards for a while |
| `docs/SCOPE.md` Q1 (c): move the general-mathematics import to its own atlas family | Removes about 1,033 skills (≈ 3.2 MB) from the robotics atlas |

## Running totals (estimates)

| After package | Skills | Required skills in scope | Introductory lessons |
| --- | ---: | ---: | ---: |
| today | 1,769 | 324 (Measure B) | 0 in the master (298 in V3) |
| 2 (merge) | 1,946 | 501 | 298 |
| 3 | 1,948–1,952 | 503–507 | 298 + pending V3 lessons authored |
| 4–7 | ≈ 1,984–2,060 | ≈ 539–615 | toward one per required skill |
| 8 (if Q1 (b)) | same | up to ≈ 1,500 counted | — |

## Outcome

Task 6 complete. The capacity checkpoint is **before the V3 merge** (package 1). The atlas stays
under 3,000 skills; the 10 MB file cap is the real constraint.
