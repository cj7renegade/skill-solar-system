# Splits 01 — The new skills (Task 2)

Drafted 2026-11-05. **Waiting for JC at Checkpoint A.** Nothing is built until JC answers D1–D5.
The full drafts are in `scope/splits/new-skills.json`: for each skill, its description, details with a
worked example, an "I can…" statement, a scope note, the granularity argument and every connection
with its reason. Read-only: no map or answer record changed.

## In one view

- **35 new skills** for 36 candidates. One candidate is covered already (D2).
- **69 connections:** 59 prerequisite and 10 supports.
- **None is required.** No new skill joins the I05 chain (it stays at 327), so **step 7's lesson list
  does not grow**.
- **No existing skill, connection or lesson changes**, except that 5 existing skills gain a new
  prerequisite (D3).
- Every example number was worked by hand and re-checked; the floating-point example was run.

## The skills

`*` marks a new prerequisite into an existing skill (D3). "Supports" links are optional preparation.

### Physics (8)

| Id | Name | Built on | Leads to |
| --- | --- | --- | --- |
| `sss-phys-observer-transform` | Transform one-dimensional motion between observers | `sss-phys-coordinate-convention` | `p-relative`* |
| `sss-phys-energy-system` | Choose the system for an energy balance | `px-fbd-isolate`, `p-potential` | `p-energy`* |
| `sss-phys-momentum-conditions` | Test when momentum conservation applies | `p-momentum`, `p-impulse`, `px-fbd-isolate` | `px-collision-inelastic`*, `px-collision-elastic`* |
| `sss-phys-bernoulli-assumptions` | Check assumptions before a Bernoulli calculation | `p-bernoulli` | — |
| `sss-phys-thermal-sign` | Track sign conventions in a thermal energy balance | `p-firstlaw` | — |
| `sss-phys-flux-mechanisms` | Compare flux change mechanisms | `p-induction`, `px-motional-emf` | — |
| `sss-phys-delay-phase` | Convert between time delay and phase shift | `px-wave-phase` (+ `e-sine` supports) | — |
| `sss-phys-resolution-vs-pixels` | Separate optical resolution and pixel sampling | `p-diffraction`, `e-sampling` | supports `rob3:P04` |

### Electronics (12)

| Id | Name | Built on | Leads to |
| --- | --- | --- | --- |
| `sss-elec-dependent-source-thevenin` | Find a Thevenin equivalent with a dependent source | `e-thevenin` | — |
| `sss-elec-superposition-power` | Check superposition limits for power calculations | `e-superposition`, `e-power` | — |
| `sss-elec-circuit-balance-check` | Verify a circuit solution using independent balances | `e-nodal`, `e-kvl`, `e-power` | — |
| `sss-elec-capacitor-initial-final` | Determine a capacitor's initial and final voltage | `e-capacitor`, `e-kvl` | `e-rc`* |
| `sss-elec-poles-damping` | Interpret poles, damping and resonance from a second-order model | `e-resonant`, `px-damping-regimes` | — |
| `sss-elec-diode-approximation` | Choose a valid diode approximation | `e-diode` | — |
| `sss-elec-switch-ratings` | Check a switch's voltage and current limits | `e-mosfet` (+ `rob3:B-E08` supports) | — |
| `sss-elec-switching-loss` | Distinguish conduction loss and switching loss | `e-mosfet` | — |
| `sss-elec-opamp-range` | Check an op-amp's input and output range | `e-opamp` | — |
| `sss-elec-adc-code-conversion` | Convert ADC codes with a stated reference | `e-adc` | — |
| `sss-elec-return-loop` | Trace a high-current return loop | `e-grounding` | supports `e-pcb` |
| `sss-elec-test-point-plan` | Plan test points for diagnosing a board | `sss-dc-test-point-choice`, `e-pcb` (+ `rob3:E10` supports) | — |

### Mechanics (10)

| Id | Name | Built on | Leads to |
| --- | --- | --- | --- |
| `sss-mech-distributed-resultant` | Replace a distributed load with an equivalent resultant | `s-load`, `p-equilibrium` | supports `s-beamforces` |
| `sss-mech-truss-joints` | Solve selected truss joints | `sss-mech-two-force-member`, `sss-mech-joint-transfer` | — |
| `sss-mat-uniaxial-limits` | Identify the limits of a uniaxial material model | `s-tensile`, `sss-mat-elastic-versus-linear` | — |
| `sss-mech-effective-length` | Check effective-length assumptions in a buckling model | `s-buckling` | — |
| `sss-mat-nominal-peak` | Distinguish nominal and peak stress | `s-concentration`, `sss-mat-current-area-stress` | — |
| `sss-mat-yield-vs-crack` | Distinguish yielding from crack-driven failure | `s-plastic`, `s-fracture` (+ `s-failurecriterion` supports) | — |
| `sss-mat-fiber-direction` | Distinguish fibre-direction effects from isotropic response | `s-composite` | — |
| `sss-mat-process-dimensions` | Relate processing choices to dimensional change | `s-additive` (+ `s-heattreat`, `rob3:D10` supports) | — |
| `sss-mech-datum-scheme` | Build a functional datum scheme | `s-fits`, `rob3:D03` | — |
| `sss-mat-differential-expansion` | Calculate differential expansion between joined parts | `s-thermalexpand` | — |

### Computing (5)

| Id | Name | Built on | Leads to |
| --- | --- | --- | --- |
| `sss-comp-function-contract` | Write a function with a clear input-output contract | `c-functions`, `c-errors` | — |
| `sss-comp-boundary-test` | Design a boundary-case test | `c-testing` | — |
| `sss-comp-cancellation` | Identify numerical cancellation | `c-floats` (+ `m-numerror` supports) | — |
| `sss-comp-task-ownership` | Explain object ownership across a task boundary | `c-allocation`, `c-threads` | — |
| `sss-comp-train-test-leakage` | Prevent train-test leakage | `c-evaluation` | — |

## The decisions

### D1 — Id policy
`sss-<area>-<slug>`, as the earlier content batches use: `sss-phys-`, `sss-elec-`, `sss-mech-`,
`sss-mat-` (materials, as in the material-behavior batch) and `sss-comp-`. **Recommended: yes.**

### D2 — One candidate is not added
C6 *Choose a metric for an asymmetric error cost* is already covered. `c-classification` reads
"choose a decision threshold by the cost of each kind of mistake", so a learner would mark the two
the same way, and a new skill would fail the granularity rule. The candidate is recorded as covered
by `c-classification`. **Recommended: do not add.**

### D3 — Five existing skills gain a prerequisite
Where the new skill is clearly the simpler piece of the broad one, it goes *before* it:

| New skill | Becomes a prerequisite of |
| --- | --- |
| `sss-phys-observer-transform` | `p-relative` |
| `sss-phys-energy-system` | `p-energy` |
| `sss-phys-momentum-conditions` | `px-collision-inelastic`, `px-collision-elastic` |
| `sss-elec-capacitor-initial-final` | `e-rc` |

None of these five is in the I05 chain, so nothing becomes required. The other 31 new skills come
*after* the skill they split from. **Recommended: yes.** The alternative is that all 35 come after,
and the map would say a learner can do the broad skill before its simpler part.

### D4 — All 35 optional
No new skill feeds the I05 chain, so none needs a lesson for the robotics path, and step 7 does not
grow. Some could reasonably become required later. For example, `sss-elec-switch-ratings` could feed
`rob3:E09` (motor-driver states). That would add each one to step 7. **Recommended: all optional
now**, and revisit when step 7 is planned.

### D5 — No public reference checked yet
The earlier batches cite public references for each skill (`referenceURLs`). These drafts are
original text from the scope candidates and the skills they split, with the facts checked by hand;
their records say so (`sourceAlignment`). **Recommended: accept as is**, and add references when
their lessons are written in step 7.

## Two drafts to look at closely

- **`sss-phys-thermal-sign`** overlaps most with its source: `p-firstlaw` already says "using a
  clearly stated sign convention". The draft keeps it because the scope review judged it a split, and
  it targets multi-flow balances and converting between textbooks. Dropping it is a fair call too.
- **`sss-comp-boundary-test`**: `c-testing`'s lesson already asks for "normal, boundary and invalid
  inputs". The draft is the systematic version: deriving the boundary set from a specification.

## What JC says

For example: *"D1–D5 as recommended"*, or name any skill to change or drop.
