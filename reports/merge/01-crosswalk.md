# Merge 01 — The crosswalk (Task 2, draft for JC)

**Status: waiting for JC at Checkpoint A.** Nothing is built from this until JC approves it. The
full data is in `scope/merge/crosswalk.json`, and `authoring/merge/draft-crosswalk.mjs` regenerates
it from the two maps.

JC asked Claude Code to make these decisions by what best serves the platform's goal: one clean,
granular robotics build-and-verify atlas that the rest of the app can grow on. Every item below
therefore has a recommendation. **To approve them all, say "approve the crosswalk".** To change one,
name it.

## What JC needs to answer

| # | Item | Recommendation |
| --- | --- | --- |
| A1 | `c-variables` answer: the file says Yes, the record says Clear | Keep the record's **Not marked** (newer; what the app shows today) |
| A2 | Two same-ability merges: `B-E02` → `e-current`, `B-E03` → `e-voltage` | **Merge** |
| A3 | The other 175 V3 entries | **Add as new skills**, with 10 component and 97 related links |
| A4 | Eight "possibly the same ability" pairs | **Keep both for now**, linked; decide in a later content pass |
| A5 | 27 `r-*` overviews | **Retire 26**, keep `r-singular` |
| A6 | `m-order`: name and prerequisites | **Take V3's** (removes one master connection: `m-power → m-order`) |
| A7 | Other shared-skill differences | **Union**: keep every master prerequisite and add V3's |
| A8 | Decision 11: three calculus *supports* links | **Leave all three as supports** |

## Checked by a simulated merge

The proposals were run through a structure-only merge, without answers, lessons or layout:

- **1,918 skills** (1,769 − 26 retired + 175 new) and **5,718 connections**.
- No prerequisite loop and no connection to a missing skill.
- The longest chain is 27 steps, well under the app's 99.
- Milestones I01–I05 are all present.

Task 3 builds the real map and repeats these checks as hard gates.

## A2 — Two same-ability merges

| V3 entry | Master skill | Evidence |
| --- | --- | --- |
| `B-E02` Interpret current as charge flow rate | `e-current` Current and charge flow | V3's demonstration ("assign a current reference direction") matches the master description. V3 put `B-E02` in `e-current`'s place in the prerequisites of `e-schematic` and `e-resistance`. |
| `B-E03` Interpret voltage between two points | `e-voltage` Voltage references and ground | V3's demonstration ("a node voltage needs a reference; ground is not automatically earth") matches the master description. V3 put `B-E03` in `e-voltage`'s place in four skills' prerequisites. |

- Neither master skill has an answer, so merging them cannot carry an answer onto a new definition.
- V3's lesson goes onto the master skill, and the `rob3:` entry is not added.
- The node keeps `planningId` `B-E02` or `B-E03`, so Task 5's importer and the evidence overrides still find it.

## A3 — The 175 new skills

All 175 are added under their `rob3:` ids. The V3 specification itself marks every one of them
"source equivalence not established", and the lessons are written for the V3 definitions.

- **Components (decision 10).** The master's granular planar skills become prerequisites of the V3
  outcome they make up. Seven more candidates were dropped because another link already implies them.

  | V3 outcome | New prerequisites from the master |
  | --- | --- |
  | K01 Label frames and joint conventions | `sss-rob-frame-labels`, `sss-rob-joint-conventions` |
  | K02 Construct and check rotation matrices | `sss-rob-rotation-check` |
  | K03 Apply, compose and invert rigid transforms | `sss-rob-compose`, `sss-rob-inverse` |
  | K04 Distinguish configuration, workspace and constraints | `sss-rob-task-coordinates` |
  | K05 Solve planar two-link forward kinematics | `sss-rob-planar-fk`, `sss-rob-tool-offset` |
  | K06 Solve and verify planar inverse kinematics | `sss-rob-ik-verification` |
  | K07 Calculate and test a planar Jacobian | `sss-rob-planar-singularity` |

- **Related links (97).** Each links a new V3 entry to the master skill the V3 specification named as
  a candidate, or to the closest master skill judged by meaning. *Related* links show up on the map
  but never force a learning order.

## A4 — Possibly the same ability (kept apart for now)

| V3 entry | Master skill | Why not merged now |
| --- | --- | --- |
| B-M02 Use powers of ten and scientific notation | `m-sci` | `m-sci` holds a **Yes**. Merging would stretch that answer over V3's broader definition (SI prefixes). |
| B-M04 Calculate empirical variance and standard deviation | Variance and Standard Deviation | Same calculation; V3 frames it on measured data |
| B-E05 Calculate DC power and energy | `e-power` | V3 adds energy over time |
| B-E06 Model a battery with stated limits | `e-battery` | Close; V3 is an applied model |
| B-E09 Interpret PWM duty and period | `e-pwm` | Close |
| R-M01 Fit and check a scalar calibration line | `px-calibrate` | V3 adds residual checks and validation |
| B-D06 Apply a stated design margin | `s-safetyfactor` | V3 applies a given margin; the master chooses one |
| E04 Design a low-voltage power budget | `e-powerbudget` | V3 adds voltage sag and runtime |

These follow decision 13: same-ability merges happen in a later content pass, never automatically.

## A5 — The `r-*` overviews (decision 6)

**Retire 26.** Each one is fully covered by granular V3 outcomes. None holds an answer.

| Overview | Taken over by (primary in bold) |
| --- | --- |
| r-frame | **K01**, S06 |
| r-rigid | K02, **K03**, K12 |
| r-dof | **K04** |
| r-configuration | **K04**, G03 |
| r-forward | K05, **K08** |
| r-inverse | K06, **K11** |
| r-jacobian | K07, K09, **K10** |
| r-staticload | **A03**, K09 |
| r-dynamics | **A04**, A11, C06, X01 |
| r-transmission | A01, **A02**, A05 |
| r-actuator | A04, **A06**, A07 |
| r-compliance | **A09** |
| r-trajectory | **C05**, C10, G04 |
| r-feedback | **C01**, C02, C04 |
| r-pid | C02, **C03** |
| r-statespace | **R-M06**, C07 |
| r-observe | **C09** |
| r-estimation | R-M04, P03, **P08** |
| r-fusion | P02, P06, P07, **P09** |
| r-cameramodel | R-P02, **P04**, P05, P10 |
| r-navigation | N01–N04, **N05**, N06–N09 |
| r-planning | G03, **G04**, N06, N08 |
| r-grasp | **G01**, G02, G05 |
| r-thermal | B-D08, **E11** |
| r-structure | **D09**, D10, D11, D12, N10 |
| r-system | Q01, Q02, V01–V07, I01–I04, **I05** |

**Keep `r-singular`** as orientation. No V3 outcome assesses spatial singularity analysis (rank loss
and SVD); K07 covers only the planar case. Its prerequisite `r-jacobian` is retired, so it is replaced by K10.

**What happens to the retired overviews' connections**

- **4 are re-pointed** to the outcome that takes over:
  - `r-rigid → c-transforms` becomes `K03 → c-transforms`.
  - `r-pid → c-control-loop` becomes `C01 → c-control-loop`.
  - `r-dynamics ⇢ c-simulation` becomes `A04 ⇢ c-simulation`.
  - `r-jacobian → r-singular` becomes `K10 → r-singular`.
- **35 become *supports*** onto the primary outcome. These are master skills that were prerequisites
  of a retired overview, such as `p-lens → P04` and `s-wear → A09`. They are added as optional
  preparation so the knowledge isn't lost; making them prerequisites would change the V3 chains.
  6 more are dropped because they are already prerequisites further down the chain.
- **95 are dropped.** These are links between overviews, the overviews' old *supports* and *related*
  links, and the related links to the `sss-rob-*` skills, which become component prerequisites instead.
  Every one is listed in the JSON.

## A6–A7 — The 204 shared skills

- **Names:** the master's, except `m-order`, which takes V3's "Order of operations for basic
  arithmetic" (A6).
- **Descriptions:** the master's, because V3's are copies of the names.
- **Prerequisites:** 9 skills differ.
  - 8 are additions only, so take the **union** (A7): `c-terminal` ← B-C01; `c-values-types` ← B-C02;
    `c-variables` ← B-C03; `c-io` ← B-C05; `p-model` ← B-S01; `c-expressions` ← `m-order`;
    `m-power` ← `m-fracmul`; `c-event-loops` ← `c-loops`, `c-errors`.
  - `m-order` takes **V3's** prerequisites (`m-multiply`, `m-sign`) and drops `m-power` (A6). V3 teaches
    order of operations before powers, and keeping the old edge would contradict its lesson. This is
    the only master prerequisite connection the merge removes outside the overviews.

## A8 — Decision 11

The brief says "three supports into C03 and N10". The data has two into C03 and one into **N02**.

| Link | Recommendation | Why |
| --- | --- | --- |
| `m-defintegral ⇢ C03` | Leave as supports | C03 implements the integral term in sampled form, and R-M02 (sampled accumulation) is already its prerequisite |
| `m-derivative ⇢ C03` | Leave as supports | The derivative term is a finite difference (R-M02) |
| `m-numericalint ⇢ N02` | Leave as supports | Odometry sums sampled increments (R-M02) |

## Already decided, applied in Task 3 (no answer needed)

- Decision 7: `X06` becomes an outcome.
- Decision 10: `K05`–`K07` become prerequisites of `K08`, `K10` and `K11`.
- Decision 12: `B-D08` is filed in S7.

## Before Task 3 can start

1. JC answers A1–A8. "Approve the crosswalk" accepts all eight recommendations.
2. JC closes the app and runs `Backup-User-Data.cmd`.
