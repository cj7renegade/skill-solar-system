# Mechanics Statics Batch 01 — coverage

Scope: ideal planar rigid-body statics and member-level load transfer. This is a focused batch, not the full Mechanics expansion.

| New skill | Self-reflection criterion |
|---|---|
| Replace ideal planar supports with their allowed reaction components | I can draw the allowed reactions for a roller, pin, and fixed support, including an inclined roller surface. |
| Replace an equal-and-opposite force couple with its signed moment | I can find the signed moment of a couple and explain why changing the moment center does not remove it. |
| Move a force to another point using an equivalent force-and-couple system | I can relocate a planar force and supply the correct compensating couple without changing its external static effect. |
| Solve reactions of a stable pin-and-roller beam under point loads | I can determine all reactions for a pin-and-roller beam with known point loads and check whether contact remains possible. |
| Solve the force and moment reactions of a planar cantilever | I can calculate a cantilever support moment as well as its force reactions, including a separately applied couple. |
| Audit a proposed planar reaction solution using force and moment residuals | I can check a supplied reaction solution and distinguish a balanced equation set from a physically adequate model. |
| Detect unrestrained planar rigid-body motion from support geometry | I can identify an unrestrained motion in a simple support arrangement even when the number of reactions looks sufficient. |
| Recognize when support reactions require deformation compatibility | I can explain why a stable overconstrained support model needs stiffness and compatibility information beyond equilibrium. |
| Recognize the conditions for an ideal two-force member | I can decide whether the two-force shortcut applies and draw the resulting end-force directions. |
| Transfer a known joint force between separate member diagrams | I can carry a solved joint force into the next member diagram with the correct signs and no double counting. |
| Calculate internal normal force, shear, and bending moment at one beam cut | I can isolate one side of a beam cut and solve its internal force and moment resultants with a declared sign convention. |

## Reuse and granularity

Reuse px-torque-sign for signed torque, p-equilibrium for general force/moment balance, px-fbd-isolate for system boundaries, px-thirdlaw-pairs for interaction pairs, and s-beamforces for complete diagrams. Preserve s-load as an overview. Pin-and-roller reactions and cantilever reactions remain separate because the latter introduces an unknown support couple; section resultants are narrower than constructing complete diagrams. Candidate name uniqueness is checked automatically; semantic overlap must also be reviewed against the current local atlas.

## Deferred

- Distributed-load resultants and centroids
- Truss joint and section methods
- Stress and strain decomposition
- Material behavior and failure
- Three-dimensional statics
- Buckling and deformation compatibility calculations

## Source references

Engineering Statics: Open & Interactive. Accessed 2026-09-14. Original descriptions are editorial; no source diagrams or exercises are reproduced.

- supports: [Free-body diagrams](https://engineeringstatics.org/Chapter_05-free-body-diagrams.html)
- couples: [Couples](https://engineeringstatics.org/Chapter_04-couples.html)
- equivalence: [Equivalent transformations](https://engineeringstatics.org/equivalent-tranformations.html)
- equations: [Equations of equilibrium](https://engineeringstatics.org/Chapter_05-equations-of-equilibrium.html)
- reactions: [2D rigid body equilibrium](https://engineeringstatics.org/Chapter_05-2d-rigid-body-equilibrium.html)
- stability: [Stability and determinacy](https://engineeringstatics.org/Chapter_05-stability-and-determinacy.html)
- members: [Frames and machines](https://engineeringstatics.org/frames-and-machines.html)
- transfer: [Interactions between members](https://engineeringstatics.org/Chapter_06-interactions-between-members.html)
- internal: [Internal forces at a point](https://engineeringstatics.org/internal_force_at_point.html)
