# I05 audit — what the repeatable-work-system milestone still needs

Read-only audit. No lesson or map data was changed by producing it.

**Subject:** `rob3:I05` — *Verify a repeatable robotic work system*, an `Integration milestones`
entry, core tier, reference level 67, currently `introductory lesson pending`.

**Source:** `Maps/Robotics-v3/Robotics-v3-Lessons.json`, sha256
`ad9ba478b15bc2841c63c47b9e1d3c366f09910c00c119572ca01c5b2cdd3e53` — 381 nodes, 894 connections
(888 prerequisite, 6 supporting), `datasetKey` `robotics-curriculum-v3`, title *Robotics curriculum
v3 — 292 introductory lessons, 88 pending*. Walked backward over `prerequisite` edges only;
`supports` and `related` are not learning order and were not followed.

**Headline.** The I05 chain holds **298 of the 381 entries**. **292 are authored and 6 are not** —
and those 292 are the entire authored corpus, so every introductory lesson written so far sits on
the I05 path. The deepest entry is 22 prerequisite steps from a root. The chain is acyclic, has
three sensible entry points, and **no authored card sits above an unauthored prerequisite**: the six
gaps are a clean frontier at the top, not holes in the middle.

Introductory coverage is a fact about content. It is not proficiency, and nothing here says a robot
has been built or a skill demonstrated.

---

## 1. Entries in the I05 chain that still lack an introductory lesson

Six, grouped by foundation area and listed in dependency order (depth = longest prerequisite path
from a root). They form one nearly linear thread, and every prerequisite of every one of them is
already authored — so all six are immediately writable.

### Mechanics

| Depth | ID | Entry | Assessed as |
| --- | --- | --- | --- |
| 9 | `B-D08` | Estimate temperature rise with a lumped model | drawing, calculation or supervised fabrication |

Rests on *Calculate DC power and energy*, *Temperature and thermal equilibrium*, *Rearranging
formulas* — all authored.

### Requirements and systems practice

| Depth | ID | Entry | Assessed as |
| --- | --- | --- | --- |
| 8 | `Q06` | Maintain configuration and interface changes | documented scenario |

Rests on *Define subsystem interfaces*, *Version control with Git commits* — both authored.

### Electrical power, interfaces and measurement

| Depth | ID | Entry | Assessed as |
| --- | --- | --- | --- |
| 11 | `E11` | Evaluate thermal operation | circuit analysis or supervised measurement |

Rests on *Design a low-voltage power budget* (authored) and `B-D08` (above).

### Verification, diagnosis and reliability

| Depth | ID | Entry | Assessed as |
| --- | --- | --- | --- |
| 18 | `V06` | Run reliability and duty-cycle trials | documented scenario |
| 19 | `V07` | Document service and handover | documented scenario |

`V06` rests on *Evaluate accuracy and repeatability*, *Demonstrate stop and restart behavior* (both
authored) and `E11`. `V07` rests on `Q06`, *Diagnose integrated failures* (authored) and `V06`.

### Integration milestones

| Depth | ID | Entry | Assessed as |
| --- | --- | --- | --- |
| 22 | `I05` | Verify a repeatable robotic work system | documented scenario |

Rests on *Integrate a perception-guided mobile manipulator* (`I04`, authored), `V06` and `V07`.

### The thread, in one picture

```
Q06  ─────────────────────────────────────┐
                                          ▼
B-D08 ──► E11 ──────► V06 ──────────────► V07 ──► I05
                       ▲                           ▲
      (authored: accuracy/repeatability,     (authored: I04)
       stop/restart, diagnose failures)
```

I05 adds exactly seven entries beyond the I04 closure (291 → 298). One of them, *Temperature and
thermal equilibrium*, is already authored; the other six are the list above. So **six cards close
introductory coverage of the whole I05 chain.**

---

## 2. Pending cards outside the I05 chain

82 pending entries plus the one roadmap note lie outside. They split into two groups that deserve
different treatment.

### 2a. Reachable from `X06`, not from I05 — 17 entries

A self-contained machine-learning branch feeding *Compare learned policies with nonlearned
baselines*.

| Area | Entries |
| --- | --- |
| Advanced pathways | `R-X01` imitation-learning task · `R-X02` reinforcement-learning task · `X05` evaluate learned robot perception · `X06` compare learned policies with nonlearned baselines |
| Computing | `c-datasets` · `c-train-inference` · `c-classification` · `c-ml-regression` · `c-evaluation` · `c-overfitting` · `c-gradient-descent` · `c-neural-networks` |
| Mathematics | `m-random` · `m-sampling` · `m-regression` · `m-gradient` |
| Software and embedded implementation | `S11` validate a simulation model |

### 2b. Reachable from no milestone at all — 65 entries

Roughly a sixth of the graph. Every one is pending; none is required by anything that leads to a
milestone. Listed by area, ascending reference level.

**Mathematics (13)** — `m-boolean` · `B-M01` compare and order measured numbers · `m-inverse` ·
`m-invtrig` · `m-complex` · `m-defintegral` · `m-numericalint` · `m-antiderivative` · `m-ftc` ·
`m-improper` · `m-lagrange` · `m-multichain` · `m-laplace`

**Electronics (12)** — `e-sampling` · `e-nodal` · `e-rc` · `e-adc` · `e-gates` · `e-opamp` ·
`B-E11` evaluate a simple RC input filter · `e-latch` · `e-timing` · `e-calibration` · `e-bus` ·
`e-imu`

**Mechanics (8)** — `s-strain` · `s-load` · `s-stress` · `s-section` · `s-elastic` · `s-beamforces` ·
`s-bending` · `s-deflection`

**Physics (7)** — `p-wave` · `p-work` · `p-equilibrium` · `p-kinetic` · `p-potential` · `p-energy` ·
`p-lagrangian`

**Advanced pathways (7)** — `X01` coupled multi-joint dynamics · `X02` force or impedance control ·
`X04` model-predictive control · `X09` compliant or dexterous manipulation · `X07` multiple mobile
robots · `X03` simultaneous base and arm motion · `X08` human-facing robot interaction

**Control and trajectories (4)** — `C06` model-based feedforward · `C07` analyze a linear control
model · `C08` evaluate sampling, delay and noise · `C09` state feedback and an observer

**Computing (4)** — `c-packets` · `c-ip-addressing` · `c-linux-admin` · `c-serial-drivers`

**Robot geometry and kinematics (3)** — `K05` planar two-link forward kinematics · `K06` planar
inverse kinematics · `K07` planar Jacobian

**Electrical power, interfaces and measurement (2)** — `E07` condition a sensor signal ·
`E12` design and inspect a simple interface PCB

**One each** — `A11` identify a simple actuator model (Actuation) · `D12` validate a structural model
(CAD) · `P07` estimate orientation from inertial data (Sensing) · `S12` restrict and recover remote
robot access (Software) · `N09` evaluate a SLAM pipeline (Wheeled mobility)

### 2c. The roadmap note

`X10` *Future specialization scope: legged, humanoid or aerial systems* — correctly marked
`roadmap note, not assessed`, `assessable: false`, no lesson planned. Not a gap.

---

## 3. Structurally suspect

### 3.1 The thermal thread is three entries wide and two of them are unwritten

`p-temperature` (Physics, authored) → `B-D08` (Mechanics, pending) → `E11` (Electrical power,
pending) is the map's **entire** treatment of heat. `V06` then asks the learner to record
temperatures across a duty-cycle trial. Three entries across three branches is thin for something
the milestone depends on, and `B-D08` — a lumped thermal-resistance calculation — is filed under
**Mechanics**, which does not match its subject. Nothing is broken; it is worth a deliberate decision
about whether thermal deserves its own foundation area before these cards are written.

### 3.2 Two parallel mechanics tracks, only one of them reachable

The authored track is `B-D01`–`B-D08`, applied and design-oriented; `B-D05` is explicitly *"Apply a
**supplied** beam stress and deflection model"*. A second, derivational track — `s-load`, `s-stress`,
`s-strain`, `s-elastic`, `s-section`, `s-beamforces`, `s-bending`, `s-deflection` — is entirely
pending and reachable from no milestone. The consequence: **nothing on the I05 path explains where
the supplied beam model comes from.** `B-D05` and `s-deflection` also overlap by name almost exactly.
This reads as a deliberate routing choice rather than an error, but it is the largest single block of
stranded foundations in the graph.

### 3.3 Planar kinematics is stranded beneath the spatial case it teaches

`K05` (planar FK), `K06` (planar IK) and `K07` (planar Jacobian) are pending and unreachable, while
`K08` (general serial-arm FK), `K10` (spatial Jacobian) and `K11` (numerical IK) are authored and on
the path. The map itself notices the tension: the supporting edge `K07 → K10` is rationalised
*"Planar Jacobians are an instructive worked example for the spatial case."* The special case is
acknowledged as useful preparation and then not required. `K06` and `K11` also overlap by name.

### 3.4 The integral-calculus thread is stranded, and `supports` is carrying the weight

`m-defintegral`, `m-antiderivative`, `m-ftc`, `m-improper` and `m-numericalint` are all unreachable
from any milestone, yet two of the six supporting edges in the whole graph point from them into
authored, on-path work: `m-defintegral → C03` (*"Continuous-time integral interpretation extends the
sampled implementation"*) and `m-numericalint → N10` (*"General quadrature provides deeper error
analysis"*). Same pattern for `Derivative as local rate → C03`. The curriculum reaches PID and
odometry through discrete-sampled reasoning and leaves continuous calculus optional — defensible,
but it means five calculus foundations sit outside every path while three `supports` edges quietly
point at them.

### 3.5 `X06` is a milestone that leads nowhere

`X06` *Compare learned policies with nonlearned baselines* is `nodeKind: milestone`, but its
`feedsMilestones` is empty, nothing depends on it, and it is not in any integration chain. It is the
only terminal milestone in the map. Either it is a sixth integration milestone that has not been
wired into the sequence, or it is an advanced outcome mislabelled as a milestone. Worth resolving
before anyone reads milestone counts off the map.

### 3.6 The physics energy thread is absent from the path

`p-work`, `p-kinetic`, `p-potential`, `p-energy`, `p-equilibrium` and `p-lagrangian` are all
unreachable, while actuation, transmissions and control content that would ordinarily rest on energy
and equilibrium reasoning is authored and on-path. `p-equilibrium` (force and torque equilibrium) in
particular is a foundation one would expect beneath statics-flavoured work. Flagged as a possible
missing foundation rather than a defect — the authored entries may well stand on their own.

### 3.7 Name overlaps worth a second look

| | | Both on the I05 path? |
| --- | --- | --- |
| `B-D05` Apply a supplied beam stress and deflection model | `s-deflection` Beam deflection | no — only `B-D05` |
| `m-chain` Chain rule | `m-multichain` Multivariable chain rule | no — only `m-chain` |
| `K06` Solve and verify planar inverse kinematics | `K11` Solve numerical inverse kinematics | no — only `K11` |
| `R-X01` imitation-learning task | `R-X02` reinforcement-learning task | no — both outside |
| `I02` Integrate and verify a robot arm | `I03` Integrate and verify an autonomous wheeled robot | yes — a false positive; different subjects, parallel phrasing |

### 3.8 Six sets of three siblings share one identical prerequisite

Six groups of three entries each declare exactly one, identical prerequisite — for example *Run and
inspect a first program*, *Record a reproducible procedure* and *Terminal navigation and commands*
all hang off *Navigate files and edit plain text*, and similarly beneath *Addition and subtraction*,
*Expressions and operators*, *Integer powers*, *Firmware structure, build, and flashing* and
*Derivative as local rate*. This is normal fan-out from a foundation, not an error. Noted only
because it means those triples carry no ordering between them, so a reading sequence has to be
chosen by the author rather than read off the graph.

### 3.9 Load-bearing entries

`m-ratio` *Ratios and unit rates* has **23** dependents and `m-function` *Functions, domains, and
ranges* has 10 — both authored and on-path. `I01` has the most prerequisites of any entry at 13.
Nothing wrong; worth knowing which entries a change would ripple through.

---

## What came back clean

These were checked and found sound, and are recorded so a later audit need not re-derive them:

- **No prerequisite cycles.** The 888 prerequisite edges form a DAG; longest chain 22.
- **No gaps below authored content.** Not one authored card depends on an entry that lacks a lesson.
- **No contradictory link types.** No pair is joined by both a prerequisite and a supporting edge,
  and no supporting edge runs against the direction of an existing dependency.
- **Every edge has a specific rationale.** Zero empty, zero left at the generic specification default.
- **`feedsMilestones` agrees with the graph, in both directions.** No entry claims to feed a
  milestone it cannot reach, and no entry in the I05 chain omits `I05` from its list.
- **Three entry points, all genuine foundations** — `m-count` (counting and place value), `B-C01`
  (navigate files and edit plain text), `B-S01` (describe an observable task and its limits).
- **No duplicate names** anywhere in the map.

---

## Scope of this audit

Derived entirely from the exported map's own nodes and edges. Not assessed here: whether any
pending entry's *content* would be worth writing, whether the authored cards are pedagogically
sufficient, and anything about the learner. No lesson was authored, no map data was changed, and no
application state was opened.
