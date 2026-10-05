# Skill Solar System — skill scope

**Status: draft for JC's review** (scope queue, branch `scope-foundation`, 2026-10-05). Sections
marked **open** are decisions for JC. Nothing in this document changes a map. It says what the
atlas must eventually contain, so content packages and the app can be built toward it.

## 1. The goal

> **Someone who works through the atlas can design, build, program, integrate and verify working
> robots**: robot arms, wheeled robots and mobile manipulators, from first numeracy up to a
> verified, repeatable robotic work system, with advanced pathways labelled separately.

This is the scope JC chose on 2026-10-04 ("robotics build-and-verify"). It matches the reviewed
Robotics V3 specification's own scope: *"Arms, wheeled robots, stationary-base mobile manipulation;
advanced extensions separately labeled."*

**Where it starts.** It assumes a person can read the instructional language and use a computer.
Basic numeracy, units and computer use are **skills inside** the atlas. No college mathematics or
physics is assumed: the atlas teaches it where a robot needs it. This is the V3 specification's
entry assumption.

**What "done" means for the atlas.** Every milestone in §3 has a complete prerequisite chain. Every
skill in those chains passes the inclusion test (§2) and the granularity rule (§2.3), and has at
least an introductory card. "Done" describes content, never what a person knows: answers stay the
reader's own.

## 2. The inclusion test

### 2.1 When a skill belongs

A skill is **in scope** if any one of these holds:

| Tier | Rule | Example |
| --- | --- | --- |
| **Core outcome** | An observable robotics ability on the path to a core milestone (I01–I05, §3) | "Solve planar two-link forward kinematics" |
| **Extension outcome** | An observable robotics ability on an advanced pathway (X01–X09, §3) | "Implement force or impedance control" |
| **Foundation** | A **prerequisite**, directly or through a chain of prerequisite links, of any core or extension outcome. This is how mathematics, physics, electronics, mechanics and computing qualify | "Multiply matrices", "Apply Kirchhoff's current law" |
| **Context** (**open**, see §5 Q1) | Linked to in-scope skills only by *supports* or *related* links, or not linked at all | Many general-mathematics topics imported from a course catalogue |

A skill **qualifies through the map's own links**. A mathematics skill is in scope because a robotics
outcome needs it, not because it is mathematics. The test is mechanical once the links exist, so it
can be measured (Task 3 does this for today's master).

### 2.2 What does not qualify by itself

- **A subject being "useful"** without a stated dependency. If it is really needed, the dependency is
  recorded as a prerequisite link with a rationale; otherwise it is context.
- **Tool and product skills** (a particular CAD program, robot framework or microcontroller brand)
  as separate skills. The underlying ability is the skill; tools appear in its lesson and
  demonstration. (**Open**, see Q5.)
- **Overview skills that only group others.** They may stay as orientation, but do not count toward
  coverage (Q6).

### 2.3 Granularity rule

From the coverage roadmap's definition of a completed branch review: **a skill is a distinct
observable ability that can reasonably receive a different self-mark from its neighbours.** Two
abilities that a learner would always answer the same way are one skill. One "skill" that hides
abilities a learner would answer differently should be split.

## 3. The backbone: milestones that define "done"

### 3.1 Core milestones (from Robotics V3)

| Id | Milestone | Prerequisite chain today (V3) |
| --- | --- | ---: |
| I01 | Integrate and verify a controlled joint | 185 entries |
| I02 | Integrate and verify a robot arm | 249 |
| I03 | Integrate and verify an autonomous wheeled robot | 241 |
| I04 | Integrate a perception-guided mobile manipulator | 291 |
| I05 | Verify a repeatable robotic work system | 298 |

Each is a physical integration and verification task. V3 already closes all five chains with
introductory cards (PLATFORM.md §9). The master atlas does not yet carry these milestones; they arrive
with the later V3 merge.

### 3.2 Extension pathways (from Robotics V3, labelled separately)

| Id | Pathway | Note |
| --- | --- | --- |
| X01 | Model coupled multi-joint dynamics | |
| X02 | Implement force or impedance control | |
| X03 | Coordinate base and arm motion simultaneously | |
| X04 | Apply model-predictive control | |
| X05 | Evaluate learned robot perception | |
| X06 | Compare learned policies with nonlearned baselines | Marked as a *milestone* but leads nowhere: an open structural question (PLATFORM.md §10.3) |
| X07 | Coordinate multiple mobile robots | |
| X08 | Design a human-facing robot interaction | |
| X09 | Develop compliant or dexterous manipulation | |
| X10 | *Roadmap note:* legged, humanoid or aerial systems | Not assessed; outside the current scope (§4) |

### 3.3 Candidate capabilities the roadmap names that V3 may not cover

The coverage roadmap lists three Robotics branches with *"no dedicated branch record identified"*.
Task 4 checks each against V3's branches before anyone proposes a new milestone:

- **Robot fault handling:** detection and recovery for a lost sensor; a controlled stop versus loss
  of power.
- **Calibration and identification:** separating sensor calibration from robot parameter
  identification; designing an experiment to estimate an uncertain parameter.
- **Mechanical machine elements:** bearing load directions; coupling misalignment versus backlash.

## 4. Exclusions

**Proposed; JC to confirm.**

| Out of scope | Why |
| --- | --- |
| Legged, humanoid and aerial robots (V3's X10) | A separate specialization with its own dynamics and safety case; can be added as a future pathway |
| Production-scale manufacturing, supply chains and business | The atlas stops at building and verifying a working system, not mass-producing it |
| Formal regulatory certification (for example CE or UL marking) | Safe practice and hazard awareness are in scope as skills; certification procedure is not |
| Research frontiers beyond the X pathways | Added only when a pathway is defined and reviewed |
| Tool and product training as standalone skills | See §2.2 and Q5 |

## 5. Open boundary questions for JC

Each has options and a recommendation; the decision brief (`reports/scope/05-decisions.md`) adds the
measured evidence from Tasks 3 and 4.

| # | Question | Options | Recommendation |
| --- | --- | --- | --- |
| Q1 | **General mathematics not on any robotics path.** The master holds 1,221 mathematics skills, many imported from a general course catalogue. How many sit on a robotics path is measured in Task 3 | (a) keep everything, marking off-path skills as *context*; (b) move off-path skills to a separate "general mathematics" atlas family; (c) delete them | **(a)**: nothing is lost, answers stay attached, and the context tier keeps them out of coverage counts. Revisit when capacity work lands |
| Q2 | **How deep the mathematics goes** (for example calculus and linear algebra beyond what an outcome uses) | (a) only as deep as an in-scope outcome needs; (b) a full undergraduate sequence | **(a)**. Depth follows the outcomes; the X pathways pull in more where they need it |
| Q3 | **Whether the X pathways are part of "done"** | (a) core milestones only; (b) core plus every X pathway | **(a) for "done"**, with X pathways as labelled extensions authored after the core |
| Q4 | **Safety and ethics** | (a) as skills inside the branches that need them (stop categories, guarding, risk assessment); (b) a separate branch | **(a)**, plus a short cross-cutting list so nothing is missed |
| Q5 | **Tools** (a CAD program, a robot software framework, a microcontroller family) | (a) inside lessons only; (b) as optional context skills | **(a)**. Abilities, not products, are skills |
| Q6 | **Two layers in today's Robotics domain**: 27 broad `r-*` overviews above 17 granular `sss-rob-*` skills | (a) keep overviews as orientation, outside coverage counts; (b) split them into granular skills; (c) retire them at the V3 merge | **(a) now, (c) at the merge.** Decide per skill when the crosswalk is done |

## 6. How the scope is kept

- **This file is the source of truth** for what the atlas covers. `scope/branches.json` is the same
  branch list as data (filled in by Task 4).
- **Only JC changes the scope.** A change is made by a pull request that edits this file and adds a
  line to the change log below. Claude Code may propose changes but never merges them.
- **Every content package names the scope branch it fills**, and reports the roadmap's coverage
  items: outcomes addressed, skills reused, new skills, remaining gaps, sources and verification.
- **Coverage is measured, not declared.** The tier of every skill (§2.1) is computed from the map's
  links, as in `reports/scope/03-master-vs-scope.md`.

### Change log

| Date | Change | By |
| --- | --- | --- |
| 2026-10-04 | Scope set to robotics build-and-verify; V3 merges later; scope work first | JC |
| 2026-10-05 | First draft of this document | Claude Code (scope queue Task 2) |

## 7. Branch map

**46 branches** in six domains: the coverage roadmap's 43, plus three that Robotics V3
has and the roadmap lacks (S8 mechanical design, CAD and fabrication; R13 integration milestones; R14
advanced pathways). The data, with every skill id, is in `scope/branches.json`. The evidence and the
mapping of all 132 roadmap candidates are in `reports/scope/04-branch-map.md`.

| Status | Branches |
| --- | ---: |
| Covered in the master today | 7 |
| Covered once Robotics V3 is merged | 9 |
| Covered by V3 entries the roadmap never listed (S8, R13, R14) | 3 |
| Partial: at least one skill to split out or add | 24 |
| Audit needed: the three mathematics branches, where the roadmap lists only review tasks | 3 |
| Missing: no existing skill at all | 0 |

Of the roadmap's 132 candidate outcomes, **86 are already covered** by an existing skill
(27 of them only by a Robotics V3 entry), **34 need a distinct skill split out of
a broad one**, **4 need a new skill**, 7 are planning tasks rather than skills, and
1 is deferred.

| Id | Branch | Status | Master skills (in scope) | V3-only entries (lessons pending) | Roadmap candidates: existing / split / new / planning | Remaining work (estimate) |
| --- | --- | --- | ---: | ---: | --- | ---: |
| M1 | Number and algebra foundations | audit needed | 606 (44) | 2 (1) | 0 / 0 / 0 / 2 | 0 |
| M2 | Calculus and linear algebra | audit needed | 332 (44) | 4 | 0 / 0 / 0 / 2 | 0 |
| M3 | Geometry, trigonometry, probability and statistics | audit needed | 283 (23) | 5 | 0 / 0 / 0 / 2 | 0 |
| P1 | Measurement and uncertainty | **covered** | 15 (6) | 1 | 3 / 0 / 0 / 0 | 0 |
| P2 | Kinematics and forces | partial | 67 (14) | 3 | 2 / 1 / 0 / 0 | 1–3 |
| P3 | Work, energy and momentum | partial | 10 (0) | 1 | 1 / 2 / 0 / 0 | 2–6 |
| P4 | Rotation and vibration | **covered** | 25 (10) | 3 | 3 / 0 / 0 / 0 | 0 |
| P5 | Fluids and thermal systems | partial | 28 (5) | 0 | 1 / 2 / 0 / 0 | 2–6 |
| P6 | Fields, induction and waves | partial | 36 (11) | 0 | 1 / 2 / 0 / 0 | 2–6 |
| P7 | Optics and modern physics | partial | 19 (0) | 0 | 0 / 0 / 1 / 1 (+1 deferred) | 1–3 |
| E1 | DC circuit analysis | partial | 45 (12) | 9 | 0 / 1 / 2 / 0 | 3–9 |
| E2 | Transient and AC response | partial | 12 (1) | 3 (1) | 1 / 2 / 0 / 0 | 2–6 |
| E3 | Semiconductors and switching | partial | 8 (2) | 2 | 0 / 3 / 0 / 0 | 3–9 |
| E4 | Analog sensing and amplification | partial | 8 (1) | 1 (1) | 2 / 1 / 0 / 0 | 1–3 |
| E5 | Digital timing and conversion | partial | 11 (8) | 1 | 2 / 1 / 0 / 0 | 1–3 |
| E6 | Power and motor drives | **covered** | 9 (4) | 6 | 3 / 0 / 0 / 0 | 0 |
| E7 | Instrumentation and sensor interfaces | **covered after the V3 merge** | 8 (3) | 2 | 3 / 0 / 0 / 0 | 0 |
| E8 | PCB layout and interference | partial | 4 (1) | 2 (1) | 1 / 2 / 0 / 0 | 2–6 |
| S1 | Statics and load transfer | partial | 13 (2) | 0 | 1 / 2 / 0 / 0 | 2–6 |
| S2 | Stress, strain and material response | partial | 20 (5) | 2 | 2 / 1 / 0 / 0 | 1–3 |
| S3 | Members, deformation and stability | partial | 7 (3) | 1 | 2 / 1 / 0 / 0 | 1–3 |
| S4 | Failure and durability | partial | 6 (3) | 1 | 1 / 2 / 0 / 0 | 2–6 |
| S5 | Material families and processing | partial | 32 (7) | 0 | 1 / 2 / 0 / 0 | 2–6 |
| S6 | Joints, manufacturing and tolerances | partial | 5 (1) | 1 | 2 / 1 / 0 / 0 | 1–3 |
| S7 | Thermal and environmental behavior | partial | 12 (7) | 1 | 2 / 1 / 0 / 0 | 1–3 |
| S8 | Mechanical design, CAD and fabrication | covered by V3 (not in the roadmap) | 1 (1) | 13 (1) | — | 0 |
| C1 | Programming and development practice | partial | 27 (19) | 5 | 1 / 2 / 0 / 0 | 2–6 |
| C2 | Algorithms and numerical computing | partial | 13 (5) | 0 | 2 / 1 / 0 / 0 | 1–3 |
| C3 | Systems, memory and concurrency | partial | 25 (13) | 1 | 2 / 1 / 0 / 0 | 1–3 |
| C4 | Networking, embedded and real time | **covered** | 19 (11) | 5 (1) | 3 / 0 / 0 / 0 | 0 |
| C5 | Robot software and integration | **covered** | 10 (7) | 5 (1) | 3 / 0 / 0 / 0 | 0 |
| C6 | Machine learning for robots | partial | 10 (8) | 0 | 1 / 2 / 0 / 0 | 2–6 |
| R1 | Frames and rigid motion | **covered after the V3 merge** | 8 (8) | 4 | 4 / 0 / 0 / 0 | 0 |
| R2 | Configuration and kinematics | **covered** | 12 (12) | 6 (2) | 4 / 0 / 0 / 0 | 0 |
| R3 | Jacobians, statics and dynamics | **covered** | 7 (7) | 3 (1) | 4 / 0 / 0 / 0 | 0 |
| R4 | Actuation and transmissions | **covered after the V3 merge** | 3 (3) | 9 | 4 / 0 / 0 / 0 | 0 |
| R5 | Trajectories and feedback | **covered after the V3 merge** | 5 (5) | 10 (4) | 4 / 0 / 0 / 0 | 0 |
| R6 | Estimation and sensor fusion | partial | 2 (2) | 6 (1) | 3 / 1 / 0 / 0 | 1–3 |
| R7 | Perception, localization and navigation | **covered after the V3 merge** | 2 (2) | 14 (1) | 4 / 0 / 0 / 0 | 0 |
| R8 | Planning and manipulation | **covered after the V3 merge** | 2 (2) | 8 | 4 / 0 / 0 / 0 | 0 |
| R9 | System integration and validation | **covered after the V3 merge** | 2 (2) | 12 | 4 / 0 / 0 / 0 | 0 |
| R10 | Robot fault handling and safety | **covered after the V3 merge** | 0 (0) | 5 | 2 / 0 / 0 / 0 | 0 |
| R11 | Calibration and identification | **covered after the V3 merge** | 0 (0) | 2 (1) | 2 / 0 / 0 / 0 | 0 |
| R12 | Mechanical machine elements | partial | 0 (0) | 1 | 1 / 0 / 1 / 0 | 1–3 |
| R13 | Integration milestones (I01–I05) | covered by V3 (not in the roadmap) | 0 (0) | 5 | — | 0 |
| R14 | Advanced pathways (X01–X09) | covered by V3 (not in the roadmap) | 0 (0) | 12 (11) | — | 0 |

"Status" is computed. **Covered** means every roadmap candidate maps to an existing skill.
**Partial** means at least one candidate needs a split or a new skill. **Audit needed** means the
roadmap lists only review tasks for that branch. **Missing** means no existing skill at all.
"Remaining work" is an **estimate**: at least one skill per split or new candidate, and up to about
three, because the roadmap's candidates are examples, not a complete list.

### Branch boundaries

- **M1 Number and algebra foundations.** Number, fractions, ratios and percentages, units-free algebra, equations and inequalities, functions, exponents and logarithms, polynomials, sequences, complex numbers, logic. *Excludes:* Number theory, proof-based algebra and contest techniques with no robotics use.
- **M2 Calculus and linear algebra.** Limits, derivatives and integrals, differential equations and transforms, multivariable calculus, vectors, matrices and the numerical methods robots use with them. *Excludes:* Real-analysis proofs; abstract algebra beyond matrices.
- **M3 Geometry, trigonometry, probability and statistics.** Geometry, trigonometry, conic and polar forms, probability, statistics and the estimation mathematics used by sensing and control. *Excludes:* Euclidean proof; probability theory beyond what estimation and evaluation need.
- **P1 Measurement and uncertainty.** Measuring, units and prefixes, random and systematic error, calibration, uncertainty propagation. *Excludes:* Metrology standards bodies and accreditation.
- **P2 Kinematics and forces.** Motion description and graphs, frames of observation, Newtonian forces, free-body models, friction and contact. *Excludes:* Relativistic mechanics.
- **P3 Work, energy and momentum.** Work, power, energy balances, dissipation, momentum and impulse.
- **P4 Rotation and vibration.** Torque, moments, rotational dynamics, rolling, oscillation, damping and resonance.
- **P5 Fluids and thermal systems.** Pressure, flow and losses, heat transfer basics, thermal energy balances. *Excludes:* Computational fluid dynamics.
- **P6 Fields, induction and waves.** Electric and magnetic fields, induction and back EMF, waves, phase and delay. *Excludes:* Field theory beyond lumped devices.
- **P7 Optics and modern physics.** Image formation, resolution and sampling for cameras; modern physics only where a sensor needs it. *Excludes:* Modern physics with no stated robotics application.
- **E1 DC circuit analysis.** Circuits, sources, Ohm and Kirchhoff, networks and equivalents, dividers, DC power and measurement, DC diagnosis.
- **E2 Transient and AC response.** RC and RL transients, phasors, AC power, filters, resonance, inductive current paths. *Excludes:* Radio-frequency design.
- **E3 Semiconductors and switching.** Diodes, transistors as switches, device limits, conduction and switching loss. *Excludes:* Device physics and IC design.
- **E4 Analog sensing and amplification.** Op-amp circuits, gain and range, comparators and hysteresis, active filters, sensor signal conditioning.
- **E5 Digital timing and conversion.** Logic and timing, sampling and aliasing, ADC and DAC conversion, digital buses and interfaces. *Excludes:* Digital IC and FPGA design.
- **E6 Power and motor drives.** PWM, H-bridges and drivers, gate drive and dead time, regulators and converters, batteries, power budgets, protection and thermal operation.
- **E7 Instrumentation and sensor interfaces.** Meters and oscilloscopes, calibration, encoders, IMUs, Hall and bridge sensors, wiring harnesses.
- **E8 PCB layout and interference.** Board layout, grounding and return paths, decoupling and shielding, test points and board diagnosis. *Excludes:* High-speed signal-integrity engineering.
- **S1 Statics and load transfer.** Load paths, free-body diagrams of structures, distributed loads, joints and two-force members, trusses.
- **S2 Stress, strain and material response.** Normal and shear stress and strain, elastic and plastic response, Poisson effects, tensile testing, creep.
- **S3 Members, deformation and stability.** Torsion, bending, section properties, deflection, buckling, finite-element use and checks. *Excludes:* Writing finite-element solvers.
- **S4 Failure and durability.** Failure criteria, stress concentration, fracture, fatigue, wear, safety factors and design margins.
- **S5 Material families and processing.** Metals, polymers, ceramics and composites, structure and bonding, processing routes and their effect on properties. *Excludes:* Materials research and alloy design.
- **S6 Joints, manufacturing and tolerances.** Fasteners and preload, welding and adhesives, fits, datums, tolerance stacks.
- **S7 Thermal and environmental behavior.** Thermal expansion and resistance, lumped thermal models, conduction and convection, corrosion and coatings, materials thermodynamics.
- **S8 Mechanical design, CAD and fabrication.** Reading and making CAD parts, assemblies and drawings, workholding and tools, fabrication, inspection, material and process selection for robot parts. *Excludes:* Training in a particular CAD product (inside lessons only).
- **C1 Programming and development practice.** Files and text, first programs, algorithms, functions and contracts, testing, debugging, version control, reproducible builds.
- **C2 Algorithms and numerical computing.** Data structures, graphs, cost and latency, floating point and numerical error. *Excludes:* Algorithm research.
- **C3 Systems, memory and concurrency.** Computer architecture, memory and ownership, processes and threads, races and deadlock. *Excludes:* Operating-system kernel development.
- **C4 Networking, embedded and real time.** Microcontroller I/O, interrupts, timed acquisition, device communication, real-time scheduling, message framing, secure remote access.
- **C5 Robot software and integration.** Robot programs, messages and coordinate conventions, state machines, logging and replay, simulation, software integration. *Excludes:* A particular robot framework as a skill (inside lessons only).
- **C6 Machine learning for robots.** Evaluation and leakage, metrics, overfitting, deploying models under robot constraints. *Excludes:* Training large models; ML research.
- **R1 Frames and rigid motion.** Frames and conventions, rotations and their representations, points versus directions, composing and inverting rigid transforms.
- **R2 Configuration and kinematics.** Degrees of freedom, configuration, task and joint space, forward and inverse kinematics, joint limits.
- **R3 Jacobians, statics and dynamics.** Velocity Jacobians, singularities, mapping loads to joint torques, spatial motion and force, dynamic model terms.
- **R4 Actuation and transmissions.** Transmissions and ratios, torque and losses, reflected inertia, encoders on joints, actuator and driver selection, backlash and compliance.
- **R5 Trajectories and feedback.** Timed trajectories, feedback and PID in practice, saturation and windup, sampled control, feedforward, state feedback and observers.
- **R6 Estimation and sensor fusion.** Sensor calibration, noise and covariance, timing alignment, inertial orientation, state estimation and fusion, innovation checks.
- **R7 Perception, localization and navigation.** Camera models and calibration, depth and pose estimation, differential drive, odometry, maps, localization, route planning, path tracking, obstacles, SLAM evaluation.
- **R8 Planning and manipulation.** Collision geometry, motion planning and timing, contact and grasp, grippers, pick-and-place, mobile manipulation.
- **R9 System integration and validation.** Requirements, interfaces and budgets, staged commissioning, verification and fault injection, diagnosis, reliability trials, configuration control, handover.
- **R10 Robot fault handling and safety.** Hazard identification and protective functions, bounded fault response, lost-sensor detection and recovery, stop and restart, holding and power-loss behavior. *Excludes:* Formal safety certification procedures.
- **R11 Calibration and identification.** Robot parameter identification versus sensor calibration, identifying actuator models, designing identification experiments.
- **R12 Mechanical machine elements.** Bearings and shaft supports, couplings and misalignment, joint modules. *Excludes:* Machine-element design standards in full.
- **R13 Integration milestones (I01–I05).** The five physical build-and-verify milestones that define "done" (docs/SCOPE.md §3.1).
- **R14 Advanced pathways (X01–X09).** Labelled extensions beyond the core (docs/SCOPE.md §3.2); X10 is a roadmap note and out of scope. *Excludes:* Legged, humanoid and aerial systems (X10).
