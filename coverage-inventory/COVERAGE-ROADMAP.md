# Skill Solar System — coverage inventory, revision 1

This is the expansion roadmap, not another small content patch. It inventories all six existing domains, identifies representative existing anchors, and proposes outcomes to investigate before authoring. It does not certify any domain complete. The uploaded master is a historical baseline; Claude’s latest local map must be reconciled after its current task finishes.

## Baseline and delivered work

| Domain | Uploaded node count | Interpretation |
|---|---:|---|
| Mathematics | 1221 | Detailed imports; duplicate and prerequisite audit needed |
| Physics | 181 | Mixed coverage; broad nodes require decomposition |
| Electronics | 79 | Mixed coverage; broad nodes require decomposition |
| Mechanics | 74 | Mixed coverage; broad nodes require decomposition |
| Robotics | 27 | Mixed coverage; broad nodes require decomposition |
| Computing | 104 | Mixed coverage; broad nodes require decomposition |

Counts measure nodes, not independent competencies or percentage completion. Mathematics includes multiple named subdomains and imported naming conventions; quantity alone does not establish completeness.

| Delivered batch | New nodes | New edges |
|---|---:|---:|
| sss-dc-batch-01 | 26 | 84 |
| sss-physics-foundations-batch-01 | 19 | 61 |
| sss-mechanics-statics-batch-01 | 11 | 36 |
| sss-material-behavior-batch-01 | 10 | 32 |

If all four are integrated unchanged, the baseline would become 1,752 nodes and 5,095 edges. This is a conditional total, not verified live app state.

## How to read the inventory

Existing anchors are exact IDs verified in the uploaded master. Candidate outcomes are proposed review targets, not findings that those abilities are absent everywhere. Existing broad descriptions may already mention them; the question is whether they deserve independent proficiency marking. Cross-domain anchors are deliberate reuse opportunities. No branch is marked complete.

## Mathematics

| Branch | Current assessment | Existing anchors | Candidate outcomes to review |
|---|---|---|---|
| Number and algebra foundations | Detailed coverage; reconcile before expanding | `m-ratio`, `m-equation`, `m-sign` | Check duplicate representations across imported math collections; Verify prerequisite paths needed by new engineering skills |
| Calculus and linear algebra | Detailed coverage; targeted dependency audit | `m-slope`, `m-vector` | Audit mathematical prerequisites for transforms and Jacobians; Reuse equivalent existing operations instead of adding robotics-labeled copies |
| Existing named mathematics branches | Inventory present; no completeness certification | `m-ratio` | Review all mathematics subdomains in the supplied index; Audit probability and numerical prerequisites when estimation and control branches are authored |
## Physics

| Branch | Current assessment | Existing anchors | Candidate outcomes to review |
|---|---|---|---|
| Measurement and uncertainty | Mixed broad and granular coverage | `p-uncertainty`, `px-calibrate`, `px-randomerror` | Separate repeatability from bias correction; Interpret calibration residuals; Propagate a stated sensor uncertainty into a derived quantity |
| Kinematics and forces | Mixed coverage; foundation batch authored | `p-motiongraph`, `p-newton`, `p-relative` | Transform one-dimensional motion between observers; Choose a valid motion interval and initial conditions; Check coupled-body force models |
| Work energy momentum | Mixed broad and granular coverage | `p-energy`, `p-collision`, `px-impulse-graph` | Choose the system for an energy balance; Distinguish internal dissipation from energy transfer; Test when momentum conservation applies |
| Rotation and vibration | Mixed broad and granular coverage | `p-rotdynamics`, `p-rolling`, `p-damping` | Write a fixed-axis torque balance; Combine rolling translation and rotation; Relate damping parameters to a transient response |
| Fluids and thermal systems | Mixed broad and granular coverage | `p-bernoulli`, `p-firstlaw`, `p-cycle` | Check assumptions before a Bernoulli calculation; Track sign conventions in a thermal energy balance; Distinguish static pressure and flow losses |
| Fields induction and waves | Mixed broad and granular coverage | `p-induction`, `p-wave`, `px-back-emf` | Compare flux change mechanisms; Connect back EMF to actuator operating conditions; Interpret phase and propagation delay |
| Optics and modern physics | Mixed coverage; application-dependent expansion | `p-lens`, `p-photon`, `px-rayleigh` | Audit image-formation prerequisites for camera models; Separate optical resolution and pixel sampling; Expand modern physics only for a stated application |
## Electronics

| Branch | Current assessment | Existing anchors | Candidate outcomes to review |
|---|---|---|---|
| DC circuit analysis | Broad coverage plus DC batch authored | `e-nodal`, `e-thevenin`, `e-superposition` | Handle dependent sources in an equivalent circuit; Check superposition limits for power calculations; Verify a solution using independent circuit balances |
| Transient and AC response | Broad coverage; decompose | `e-rc`, `e-rl`, `e-phasor`, `e-resonant` | Determine capacitor initial and final voltage; Determine inductor initial and final current; Interpret poles damping and resonance from a stated model |
| Semiconductors and switching | Broad coverage; decompose | `e-diode`, `e-mosfet`, `e-bjt` | Choose a valid device approximation; Check switch voltage and current limits; Distinguish conduction loss and switching loss |
| Analog sensing and amplification | Broad coverage; decompose | `e-opamp`, `e-differential`, `e-comparator` | Check amplifier input and output range; Select gain from a sensor signal range; Determine hysteresis switching thresholds |
| Digital timing and conversion | Broad coverage; decompose | `e-timing`, `e-adc`, `e-sampling` | Check setup and hold timing; Convert ADC codes with a stated reference; Choose sample rate and anti-alias filtering for a signal band |
| Power and motor drives | Broad coverage; decompose | `e-hbridge`, `e-gatedrive`, `e-powerbudget` | Trace motor current during drive and recirculation; Distinguish dead time from duty cycle; Budget peak and continuous supply demand |
| Instrumentation and sensor interfaces | Broad coverage; decompose | `e-scope`, `e-multimeter`, `e-encoder`, `e-imu` | Choose a probe connection and measurement reference; Decode encoder direction and counts; Interpret sensor saturation and range limits |
| PCB layout and interference | Broad coverage; decompose | `e-pcb`, `e-grounding`, `e-decoupling` | Trace high-current return loops; Separate schematic correctness from layout effects; Plan test points for diagnosing a board |
## Mechanics

| Branch | Current assessment | Existing anchors | Candidate outcomes to review |
|---|---|---|---|
| Statics and load transfer | Broad coverage plus statics batch authored | `s-load`, `s-beamforces` | Replace a distributed load with an equivalent resultant; Solve selected truss joints; Check a load path through separate component diagrams |
| Stress strain and material response | Broad coverage plus material-response batch authored | `s-stress`, `s-strain`, `s-tensile` | Distinguish shear stress from normal stress on a selected plane; Use Poisson response under explicit constraints; Identify the limits of a uniaxial material model |
| Members deformation and stability | Broad coverage; decompose | `s-bending`, `s-deflection`, `s-buckling` | Choose a bending axis and section property; Separate deflection limits from strength limits; Check effective-length assumptions in a buckling model |
| Failure and durability | Broad coverage; decompose | `s-fatigue`, `s-fracture`, `s-concentration` | Distinguish nominal and peak stress; Describe a fatigue load cycle; Distinguish yielding from crack-driven failure |
| Material families and processing | Broad coverage; decompose | `s-steel`, `s-heattreat`, `s-polymer`, `s-composite` | Tie a property claim to material condition; Distinguish fiber direction effects from isotropic response; Relate processing choices to dimensional change |
| Joints manufacturing and tolerances | Broad coverage; decompose | `s-fastener`, `s-welding`, `s-fits`, `s-stack` | Separate preload and externally applied load; Build a functional datum scheme; Trace a worst-case dimensional stack |
| Thermal and environmental behavior | Broad coverage; decompose | `s-thermalexpand`, `s-thermalresist`, `s-corrosion` | Calculate differential expansion between joined parts; Model a thermal contact path; Identify conditions needed for galvanic coupling |
## Robotics

| Branch | Current assessment | Existing anchors | Candidate outcomes to review |
|---|---|---|---|
| Frames and rigid motion | Broad coverage; decompose | `r-frame`, `r-rigid` | Distinguish a point from a displacement vector; Compose transforms in the correct order; Invert a rigid transform; State the frame in which a velocity is expressed |
| Configuration and kinematics | Broad coverage; decompose | `r-dof`, `r-configuration`, `r-forward`, `r-inverse` | Distinguish task space and joint space; Calculate a planar arm pose from joint values; Identify multiple inverse-kinematic solutions; Check joint-limit feasibility |
| Jacobians statics and dynamics | Broad coverage; decompose | `r-jacobian`, `r-singular`, `r-staticload`, `r-dynamics` | Map joint rates to end-effector velocity; Identify loss of motion directions; Map a tool load into joint torques; Separate inertia gravity and velocity-dependent model terms |
| Actuation and transmissions | Broad coverage; decompose | `r-transmission`, `r-actuator`, `r-compliance` | Translate motor speed and torque through a gear ratio; Check a motor operating point; Separate backlash from elastic compliance; Account for reflected inertia |
| Trajectories and feedback | Broad coverage; decompose | `r-trajectory`, `r-feedback`, `r-pid`, `r-statespace`, `r-observe` | Distinguish a geometric path from a timed trajectory; Recognize actuator saturation and integral windup; Interpret a sampled response; Check model controllability assumptions |
| Estimation and sensor fusion | Broad coverage; decompose | `r-estimation`, `r-fusion` | Distinguish state prediction and measurement correction; Represent correlated uncertainty; Detect an inconsistent measurement innovation; Handle asynchronous observations |
| Perception localization and navigation | Broad coverage; decompose | `r-cameramodel`, `r-navigation` | Distinguish camera intrinsics and extrinsics; Propagate wheel odometry; Recognize localization drift; Separate mapping from localization |
| Planning and manipulation | Broad coverage; decompose | `r-planning`, `r-grasp` | Check collision for a candidate configuration; Distinguish path search and trajectory feasibility; Represent a friction-constrained contact; Check grasp assumptions |
| System integration and validation | Broad coverage; decompose | `r-system`, `r-thermal`, `r-structure` | Write a subsystem interface contract; Allocate timing power and thermal budgets; Define a measurable integration acceptance check; Trace a fault across sensing control and actuation |
| Robot fault handling | No dedicated branch record identified; related coverage exists | `r-system`, `c-watchdog` | Define detection and recovery behavior for a lost sensor; Distinguish a controlled stop from loss of power |
| Calibration and identification | No dedicated branch record identified; related coverage exists | `r-cameramodel`, `e-calibration`, `r-dynamics` | Separate sensor calibration from robot parameter identification; Design an experiment to estimate an uncertain model parameter |
| Mechanical machine elements | No dedicated branch record identified; related coverage exists | `r-transmission`, `s-wear` | Choose bearing load directions in a conceptual assembly; Distinguish coupling misalignment from backlash |
## Computing

| Branch | Current assessment | Existing anchors | Candidate outcomes to review |
|---|---|---|---|
| Programming and development practice | Foundation edition present; granularity review | `c-functions`, `c-testing`, `c-debugging`, `c-git-branches` | Write a function with a clear input-output contract; Design a boundary-case test; Reduce a failure to a reproducible example |
| Algorithms and numerical computing | Foundation edition present; granularity review | `c-graph-code`, `c-code-cost`, `c-floats` | Choose a graph representation for a robot problem; Identify numerical cancellation; Separate algorithm cost from measured latency |
| Systems memory and concurrency | Foundation edition present; granularity review | `c-allocation`, `c-synchronization`, `c-deadlock` | Explain object ownership across a task boundary; Detect a shared-state race; Analyze a lock-order cycle |
| Networking embedded and real time | Foundation edition present; granularity review | `c-framing`, `c-interrupts`, `c-rt-scheduling` | Recover message boundaries after malformed input; Bound interrupt work; Recognize priority inversion in a task schedule |
| Robot software and integration | Foundation edition present; granularity review | `c-transforms`, `c-control-loop`, `c-time-sync`, `c-replay-testing` | Validate transform conventions in software; Handle stale sensor timestamps; Replay a recorded fault deterministically |
| Machine learning for robots | Foundation edition present; application-dependent depth | `c-evaluation`, `c-overfitting`, `c-model-deployment` | Prevent train-test leakage; Choose a metric for an asymmetric error cost; Check inference latency against a robot deadline |

## Existing subdomain inventory

This preserves the baseline’s names exactly; capitalization variants are not automatically merged. Subdomains are categories, not proof of detailed branch coverage.

### Mathematics

- Absolute Value: 11 nodes
- Algebra and functions: 29 nodes
- Calculus: 26 nodes
- Complex Numbers: 16 nodes
- Conic Sections: 27 nodes
- Contextual Applications of Calculus: 21 nodes
- Definite Integrals: 20 nodes
- Differential Equations: 9 nodes
- Differential equations and transforms: 13 nodes
- Differentiation: 31 nodes
- Equations & Inequalities: 50 nodes
- Exponential Functions: 18 nodes
- Exponentials & Logarithms: 30 nodes
- Exponents & Radicals: 32 nodes
- Fractions: 41 nodes
- Functions: 37 nodes
- Geometry: 35 nodes
- Geometry Fundamentals: 27 nodes
- Geometry and trigonometry: 16 nodes
- Inequalities: 20 nodes
- Integration Techniques: 28 nodes
- Introduction to Calculus: 30 nodes
- Limits & Continuity: 32 nodes
- Linear Algebra: 37 nodes
- Linear algebra: 26 nodes
- Logic and discrete structures: 16 nodes
- Multivariable calculus: 16 nodes
- Number Systems: 12 nodes
- Number foundations: 22 nodes
- Parametric & Polar Coordinates: 15 nodes
- Polygons: 21 nodes
- Polynomials: 48 nodes
- Probability: 20 nodes
- Probability & Combinatorics: 21 nodes
- Probability and statistics: 24 nodes
- Quadratics: 31 nodes
- Radical & Rational Expressions: 17 nodes
- Radical & Rational Functions: 29 nodes
- Ratios & Percentages: 47 nodes
- Sequences: 18 nodes
- Sequences and Series: 22 nodes
- Statistics: 14 nodes
- The Number System: 31 nodes
- Trigonometry: 78 nodes
- Two-Variable Equations: 29 nodes
- Vectors: 28 nodes
### Physics

- Advanced dynamic models: 5 nodes
- Electric fields: 6 nodes
- Energy and momentum: 10 nodes
- Fields, waves, and light: 17 nodes
- Fluids: 6 nodes
- Fluids and thermal physics: 12 nodes
- Forces: 8 nodes
- Kinematics: 11 nodes
- Magnetism: 7 nodes
- Measurement: 8 nodes
- Measurement and modeling: 7 nodes
- Modern physics: 11 nodes
- Optics: 8 nodes
- Rotation and oscillation: 20 nodes
- Thermal: 10 nodes
- Translational mechanics: 29 nodes
- Waves: 6 nodes
### Electronics

- AC circuits and signals: 12 nodes
- DC circuit foundations: 19 nodes
- Digital logic and conversion: 8 nodes
- Robotics electronics practice: 24 nodes
- Semiconductors and analog circuits: 16 nodes
### Mechanics

- Material families and processing: 30 nodes
- Materials mechanics: 25 nodes
- Materials structure and bonding: 12 nodes
- Materials thermodynamics: 7 nodes
### Robotics

- Integrated robotics foundations: 27 nodes
### Computing

- Computer architecture: 11 nodes
- Data structures and algorithms: 13 nodes
- Development practice: 14 nodes
- Embedded and real-time: 11 nodes
- Machine learning foundations: 10 nodes
- Networking: 8 nodes
- Programming foundations: 13 nodes
- Robotics software: 10 nodes
- Systems programming: 14 nodes

## Expansion sequence

1. Robotics frames, transforms, configuration, and basic kinematics. Establish explicit conventions and audit mathematical dependencies first.
2. Actuation and transmissions, with the electrical-drive and mechanical-member skills they need.
3. Trajectories and feedback control, including practical implementation constraints.
4. Sensing, calibration, estimation, and perception.
5. Localization, planning, manipulation, and integration fault handling.
6. Extend supporting physics, electronics, materials, and computing branches as dependency reviews expose meaningful gaps. Specialized branches remain explicit rather than being implied by a broad overview.

Each wave may require multiple substantive branch packages. There is no fixed ten-skill ceiling, no equal-count quota, and no claim that these waves exhaust every robotics specialty.

## Definition of a completed branch review

- Its scope and exclusions are explicit.
- Each candidate outcome is mapped to an existing skill, a justified new skill, or an explicit deferral.
- A new skill has a distinct observable ability that can reasonably receive a different self-mark from its neighbors.
- Each new skill has two descriptive paragraphs, a self-reflection criterion, source references, and concise placement reasoning.
- Prerequisites are justified, references resolve, and duplicate meanings are reviewed—not only duplicate names.
- Shared skills are reused across domains; overview Yes values are never propagated automatically.
- Remaining gaps and model limitations are listed. App import/export, layout, and proficiency preservation are verified separately.

## Source checkpoints

The inventory is an editorial planning document grounded primarily in the uploaded atlas. These external references cross-check broad scope; they are not an exhaustive curriculum comparison.

- [Northwestern Modern Robotics overview](https://hades.mech.northwestern.edu/index.php/Modern_Robotics): distinguishes system-level robotics coverage from implementation-level mechatronics.
- [Foundations of Robot Motion](https://modernrobotics.northwestern.edu/nu-gm-book-resource/foundations-of-robot-motion/): supports beginning the robotics expansion with spatial motion and configuration concepts.
- [MIT Circuits and Electronics syllabus](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/syllabus/): cross-checks analysis, dynamic response, device models, and measurement as separate competencies.

Source checkpoints accessed 2026-09-14. Detailed source review remains part of each future branch package.
