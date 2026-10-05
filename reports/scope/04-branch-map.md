# Scope 04 — The branch map (Task 4)

Read-only on both maps (unchanged afterwards). Data: `scope/branches.json`; summary table:
`docs/SCOPE.md` §7.

## Method

1. **Branches.** The coverage roadmap's 43 branches, plus three branches that Robotics V3 has and
   the roadmap does not: S8 *Mechanical design, CAD and fabrication* (V3's "CAD, fabrication and
   mechanical design", 12 entries), R13 *Integration milestones* and R14 *Advanced pathways*. The
   roadmap's three "no dedicated branch" Robotics rows (fault handling, calibration and
   identification, machine elements) became R10–R12. Each branch has a written boundary and
   exclusions (`docs/SCOPE.md` §7).
2. **Existing skills.** Every master skill was placed by its subdomain, or by its id where a
   subdomain spans several branches (for example "Robotics electronics practice" and "Materials
   mechanics"). Every V3 entry with no master id was placed by planning id. Result: **all
   1,769 master skills and all 177 V3-only entries are placed**, none twice
   (the script checks both).
3. **Candidate outcomes.** For each of the roadmap's 132 candidate outcomes, a script listed the
   three closest skills by shared words across both maps. **Each was then reviewed by hand** against
   skill names and V3 descriptions. Word matches were often coincidental (for example "Solve
   selected truss joints" matched "Adhesive joints"), so the mapping is a judgement, recorded with
   the skills it rests on. Every cited skill id was checked to exist.
4. **Status** is computed from the mapping: covered, partial, audit needed, or missing (§7 of the
   scope). "Covered after the V3 merge" means at least one covering skill exists only in V3.

## Totals

| Candidate mapping | Count | Share |
| --- | ---: | ---: |
| Covered by an existing skill | 86 | 65% |
| …of which only by a Robotics V3 entry | 27 | |
| Split a distinct skill out of a broad existing one | 34 | 26% |
| Proposed new skill | 4 | 3% |
| Planning task, not a skill | 7 | 5% |
| Deferred | 1 | |
| **Total** | **132** | |

The four proposed new skills:

- *Handle dependent sources in an equivalent circuit* (E1).
- *Verify a solution using independent circuit balances* (E1).
- *Separate optical resolution and pixel sampling* (P7).
- *Distinguish coupling misalignment from backlash* (R12).

| Branch status | Branches |
| --- | ---: |
| Covered in the master today | 7 |
| Covered once V3 is merged | 9 |
| Covered by V3 entries the roadmap never listed | 3 |
| Partial | 24 |
| Audit needed (mathematics) | 3 |
| Missing | 0 |

**No branch is missing.** The robotics branches are the best covered, thanks to V3: the roadmap's
42 robotics candidates are all covered except one split (*detect an inconsistent measurement
innovation*) and one new skill (*coupling misalignment*). **The remaining gaps are mostly in the
foundations**: physics, electronics, mechanics and computing branches whose broad overview skills
("MOSFET switching fundamentals", "Beam bending stress") need distinct, separately markable
abilities split out.

## Estimated size of the finished scope

All figures below are **estimates** built from measured counts.

| | Skills |
| --- | ---: |
| In scope today by prerequisite links (master, Measure B, Task 3) | 324 |
| Plus Robotics V3 entries that are not in the master (arrive with the merge) | 177 |
| **In scope after the merge** | **501** |
| Plus remaining roadmap work: splits and new skills (estimate) | 38–114 |
| **Finished core and extension scope, strict inclusion rule** | **≈ 539–615** |
| If granular decompositions of in-scope overviews also count (Q1 option), add up to the 894 "supporting only" master skills, mostly the maths import | up to ≈ 1509 |
| **Whole atlas, including context skills**, if nothing is removed | **≈ 1,984–2,060** |

**What this means for the app.** The robotics build-and-verify scope is **far smaller than 10,000
skills**: about 540–615 required skills, and about 2,000 in the whole atlas if every context skill
is kept. That fits today's skill-count cap. Whether it fits today's **10 MB file cap** depends on
lessons. At the measured 3,050 bytes per skill without lessons, about 2,000 skills are about 6 MB.
At 8,230 bytes per skill with lessons (`reports/capacity/03-current-app.md`), about 2,000 skills
are about 16 MB, **over the cap**. Task 6 places that point in the wave plan.

**Caveat.** The roadmap's candidates are examples, so deeper authoring could add more than this
estimate. Each content package reports its own counts, and the estimate is updated from them.

## Candidate mapping, branch by branch

### M1 Number and algebra foundations — audit needed

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Check duplicate representations across imported math collections | planning task, not a skill | — |
| Verify prerequisite paths needed by new engineering skills | planning task, not a skill | — |

### M2 Calculus and linear algebra — audit needed

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Audit mathematical prerequisites for transforms and Jacobians | planning task, not a skill | — |
| Reuse equivalent existing operations instead of adding robotics-labeled copies | planning task, not a skill | — |

### M3 Geometry, trigonometry, probability and statistics — audit needed

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Review all mathematics subdomains in the supplied index | planning task, not a skill | — |
| Audit probability and numerical prerequisites when estimation and control branches are authored | planning task, not a skill | — |

### P1 Measurement and uncertainty — covered

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Separate repeatability from bias correction | existing skill | `px-randomerror`, `rob3:V03` |
| Interpret calibration residuals | existing skill | `rob3:R-M01`, `m-regression` |
| Propagate a stated sensor uncertainty into a derived quantity | existing skill | `px-uncertainty-sum`, `px-uncertainty-product` |

### P2 Kinematics and forces — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Transform one-dimensional motion between observers | split a broad skill | `p-relative` |
| Choose a valid motion interval and initial conditions | existing skill | `sss-phys-piecewise-handoff` |
| Check coupled-body force models | existing skill | `sss-phys-uniform-tension-model`, `p-coupled` |

### P3 Work, energy and momentum — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Choose the system for an energy balance | split a broad skill | `p-energy`, `px-fbd-isolate` |
| Distinguish internal dissipation from energy transfer | existing skill | `px-energy-loss` |
| Test when momentum conservation applies | split a broad skill | `p-momentum` |

### P4 Rotation and vibration — covered

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Write a fixed-axis torque balance | existing skill | `p-rotdynamics`, `rob3:A04` |
| Combine rolling translation and rotation | existing skill | `p-rolling` |
| Relate damping parameters to a transient response | existing skill | `p-damping` |

### P5 Fluids and thermal systems — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Check assumptions before a Bernoulli calculation | split a broad skill | `p-bernoulli` |
| Track sign conventions in a thermal energy balance | split a broad skill | `p-firstlaw` |
| Distinguish static pressure and flow losses | existing skill | `px-manometer`, `px-poiseuille` |

### P6 Fields, induction and waves — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Compare flux change mechanisms | split a broad skill | `p-induction`, `p-flux` |
| Connect back EMF to actuator operating conditions | existing skill | `px-back-emf` |
| Interpret phase and propagation delay | split a broad skill | `p-wave` |

### P7 Optics and modern physics — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Audit image-formation prerequisites for camera models | planning task, not a skill | `p-lens`, `rob3:P04` |
| Separate optical resolution and pixel sampling | proposed new skill | `p-diffraction`, `e-sampling` |
| Expand modern physics only for a stated application | deferred | — |

### E1 DC circuit analysis — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Handle dependent sources in an equivalent circuit | proposed new skill | `e-thevenin` |
| Check superposition limits for power calculations | split a broad skill | `e-superposition` |
| Verify a solution using independent circuit balances | proposed new skill | `e-nodal` |

### E2 Transient and AC response — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Determine capacitor initial and final voltage | split a broad skill | `e-rc` |
| Determine inductor initial and final current | existing skill (V3 only) | `rob3:B-E10` |
| Interpret poles damping and resonance from a stated model | split a broad skill | `e-resonant` |

### E3 Semiconductors and switching — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Choose a valid device approximation | split a broad skill | `e-diode` |
| Check switch voltage and current limits | split a broad skill | `e-mosfet`, `rob3:B-E08` |
| Distinguish conduction loss and switching loss | split a broad skill | `e-mosfet` |

### E4 Analog sensing and amplification — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Check amplifier input and output range | split a broad skill | `e-opamp` |
| Select gain from a sensor signal range | existing skill (V3 only) | `rob3:E07` |
| Determine hysteresis switching thresholds | existing skill | `e-comparator` |

### E5 Digital timing and conversion — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Check setup and hold timing | existing skill | `e-timing` |
| Convert ADC codes with a stated reference | split a broad skill | `e-adc` |
| Choose sample rate and anti-alias filtering for a signal band | existing skill | `e-antialias`, `e-sampling` |

### E6 Power and motor drives — covered

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Trace motor current during drive and recirculation | existing skill | `e-hbridge`, `e-flyback` |
| Distinguish dead time from duty cycle | existing skill | `e-gatedrive` |
| Budget peak and continuous supply demand | existing skill | `e-powerbudget`, `rob3:E04` |

### E7 Instrumentation and sensor interfaces — covered (after the V3 merge)

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Choose a probe connection and measurement reference | existing skill | `rob3:E03`, `e-scope` |
| Decode encoder direction and counts | existing skill (V3 only) | `rob3:R-E02` |
| Interpret sensor saturation and range limits | existing skill | `e-piecewise` |

### E8 PCB layout and interference — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Trace high-current return loops | split a broad skill | `e-decoupling`, `e-grounding` |
| Separate schematic correctness from layout effects | existing skill (V3 only) | `rob3:E12` |
| Plan test points for diagnosing a board | split a broad skill | `sss-dc-test-point-choice`, `rob3:E10` |

### S1 Statics and load transfer — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Replace a distributed load with an equivalent resultant | split a broad skill | `s-load` |
| Solve selected truss joints | split a broad skill | `sss-mech-two-force-member`, `sss-mech-joint-transfer` |
| Check a load path through separate component diagrams | existing skill | `sss-mech-joint-transfer` |

### S2 Stress, strain and material response — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Distinguish shear stress from normal stress on a selected plane | existing skill | `s-stress` |
| Use Poisson response under explicit constraints | existing skill | `s-poisson` |
| Identify the limits of a uniaxial material model | split a broad skill | `s-tensile`, `sss-mat-elastic-versus-linear` |

### S3 Members, deformation and stability — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Choose a bending axis and section property | existing skill | `rob3:D09`, `s-bending`, `s-section` |
| Separate deflection limits from strength limits | existing skill | `rob3:D09`, `s-deflection` |
| Check effective-length assumptions in a buckling model | split a broad skill | `s-buckling` |

### S4 Failure and durability — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Distinguish nominal and peak stress | split a broad skill | `s-concentration`, `sss-mat-current-area-stress` |
| Describe a fatigue load cycle | existing skill | `s-fatigue` |
| Distinguish yielding from crack-driven failure | split a broad skill | `s-plastic`, `s-fracture`, `s-failurecriterion` |

### S5 Material families and processing — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Tie a property claim to material condition | existing skill | `s-steel` |
| Distinguish fiber direction effects from isotropic response | split a broad skill | `s-composite` |
| Relate processing choices to dimensional change | split a broad skill | `s-heattreat`, `s-additive`, `rob3:D10` |

### S6 Joints, manufacturing and tolerances — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Separate preload and externally applied load | existing skill | `s-fastener` |
| Build a functional datum scheme | split a broad skill | `s-fits`, `rob3:D03` |
| Trace a worst-case dimensional stack | existing skill | `s-stack`, `rob3:D06` |

### S7 Thermal and environmental behavior — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Calculate differential expansion between joined parts | split a broad skill | `s-thermalexpand` |
| Model a thermal contact path | existing skill | `s-thermalresist` |
| Identify conditions needed for galvanic coupling | existing skill | `s-corrosion` |

### C1 Programming and development practice — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Write a function with a clear input-output contract | split a broad skill | `c-functions` |
| Design a boundary-case test | split a broad skill | `c-testing` |
| Reduce a failure to a reproducible example | existing skill | `rob3:S10`, `c-debugging` |

### C2 Algorithms and numerical computing — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Choose a graph representation for a robot problem | existing skill | `c-graph-code` |
| Identify numerical cancellation | split a broad skill | `c-floats`, `m-numerror` |
| Separate algorithm cost from measured latency | existing skill | `rob3:S09`, `c-code-cost` |

### C3 Systems, memory and concurrency — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Explain object ownership across a task boundary | split a broad skill | `c-allocation` |
| Detect a shared-state race | existing skill | `c-race-conditions` |
| Analyze a lock-order cycle | existing skill | `c-deadlock` |

### C4 Networking, embedded and real time — covered

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Recover message boundaries after malformed input | existing skill | `c-framing` |
| Bound interrupt work | existing skill | `rob3:S09`, `c-interrupts` |
| Recognize priority inversion in a task schedule | existing skill | `c-rt-scheduling` |

### C5 Robot software and integration — covered

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Validate transform conventions in software | existing skill | `c-transforms` |
| Handle stale sensor timestamps | existing skill | `rob3:P02`, `c-time-sync` |
| Replay a recorded fault deterministically | existing skill | `c-replay-testing` |

### C6 Machine learning for robots — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Prevent train-test leakage | split a broad skill | `c-evaluation` |
| Choose a metric for an asymmetric error cost | split a broad skill | `c-evaluation` |
| Check inference latency against a robot deadline | existing skill | `c-model-deployment` |

### R1 Frames and rigid motion — covered (after the V3 merge)

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Distinguish a point from a displacement vector | existing skill | `sss-rob-point-direction` |
| Compose transforms in the correct order | existing skill | `sss-rob-compose`, `rob3:K03` |
| Invert a rigid transform | existing skill | `sss-rob-inverse`, `rob3:K03` |
| State the frame in which a velocity is expressed | existing skill (V3 only) | `rob3:K09` |

### R2 Configuration and kinematics — covered

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Distinguish task space and joint space | existing skill | `sss-rob-task-coordinates`, `rob3:K04` |
| Calculate a planar arm pose from joint values | existing skill | `sss-rob-planar-fk`, `rob3:K05` |
| Identify multiple inverse-kinematic solutions | existing skill | `sss-rob-planar-ik`, `rob3:K06` |
| Check joint-limit feasibility | existing skill | `sss-rob-ik-verification` |

### R3 Jacobians, statics and dynamics — covered

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Map joint rates to end-effector velocity | existing skill | `sss-rob-joint-to-tip-rate`, `rob3:K07` |
| Identify loss of motion directions | existing skill | `sss-rob-planar-singularity` |
| Map a tool load into joint torques | existing skill | `rob3:K09`, `rob3:A03`, `r-staticload` |
| Separate inertia gravity and velocity-dependent model terms | existing skill | `rob3:X01`, `r-dynamics` |

### R4 Actuation and transmissions — covered (after the V3 merge)

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Translate motor speed and torque through a gear ratio | existing skill (V3 only) | `rob3:A01`, `rob3:A02`, `rob3:B-P07` |
| Check a motor operating point | existing skill (V3 only) | `rob3:A07`, `rob3:A06` |
| Separate backlash from elastic compliance | existing skill | `r-compliance`, `rob3:A09` |
| Account for reflected inertia | existing skill (V3 only) | `rob3:A05` |

### R5 Trajectories and feedback — covered (after the V3 merge)

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Distinguish a geometric path from a timed trajectory | existing skill | `rob3:C05`, `rob3:G04`, `r-trajectory` |
| Recognize actuator saturation and integral windup | existing skill (V3 only) | `rob3:C03` |
| Interpret a sampled response | existing skill (V3 only) | `rob3:C01`, `rob3:C08` |
| Check model controllability assumptions | existing skill (V3 only) | `rob3:C09` |

### R6 Estimation and sensor fusion — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Distinguish state prediction and measurement correction | existing skill | `rob3:P08`, `r-estimation` |
| Represent correlated uncertainty | existing skill | `m-covariance`, `rob3:P03`, `rob3:R-M04` |
| Detect an inconsistent measurement innovation | split a broad skill | `rob3:P09`, `rob3:P08` |
| Handle asynchronous observations | existing skill (V3 only) | `rob3:P02` |

### R7 Perception, localization and navigation — covered (after the V3 merge)

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Distinguish camera intrinsics and extrinsics | existing skill | `rob3:P04`, `rob3:R-P02`, `r-cameramodel` |
| Propagate wheel odometry | existing skill (V3 only) | `rob3:N02` |
| Recognize localization drift | existing skill (V3 only) | `rob3:N05`, `rob3:N02` |
| Separate mapping from localization | existing skill (V3 only) | `rob3:N04`, `rob3:N05`, `rob3:N09` |

### R8 Planning and manipulation — covered (after the V3 merge)

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Check collision for a candidate configuration | existing skill (V3 only) | `rob3:G03` |
| Distinguish path search and trajectory feasibility | existing skill (V3 only) | `rob3:N06`, `rob3:G04` |
| Represent a friction-constrained contact | existing skill (V3 only) | `rob3:R-P01` |
| Check grasp assumptions | existing skill (V3 only) | `rob3:G01` |

### R9 System integration and validation — covered (after the V3 merge)

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Write a subsystem interface contract | existing skill (V3 only) | `rob3:Q02` |
| Allocate timing power and thermal budgets | existing skill | `rob3:Q04`, `e-powerbudget` |
| Define a measurable integration acceptance check | existing skill (V3 only) | `rob3:Q05`, `rob3:V01` |
| Trace a fault across sensing control and actuation | existing skill (V3 only) | `rob3:V05` |

### R10 Robot fault handling and safety — covered (after the V3 merge)

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Define detection and recovery behavior for a lost sensor | existing skill (V3 only) | `rob3:S08`, `rob3:V02` |
| Distinguish a controlled stop from loss of power | existing skill (V3 only) | `rob3:A10` |

### R11 Calibration and identification — covered (after the V3 merge)

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Separate sensor calibration from robot parameter identification | existing skill (V3 only) | `rob3:P10` |
| Design an experiment to estimate an uncertain model parameter | existing skill (V3 only) | `rob3:A11` |

### R12 Mechanical machine elements — partial

| Candidate outcome | Mapping | Skills |
| --- | --- | --- |
| Choose bearing load directions in a conceptual assembly | existing skill (V3 only) | `rob3:D08` |
| Distinguish coupling misalignment from backlash | proposed new skill | `rob3:A09`, `rob3:D08` |
