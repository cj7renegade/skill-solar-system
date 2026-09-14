# Robotics foundations — coverage report

This package expands selected operations inside the existing robotics overviews. It is not a complete Robotics curriculum, nor does it complete all spatial kinematics.

| Skill | Self-reflection criterion |
|---|---|
| Label the reference frame of a robot position or direction | I can identify which frame each coordinate tuple belongs to and flag incompatible comparisons. |
| Construct a rotation matrix from one frame’s axes expressed in another | I can build R_AB from labeled axes and use its columns to explain the mapping. |
| Check whether a supplied matrix represents a proper 3D rotation | I can distinguish a proper rotation from a reflection or scaled matrix using explicit checks. |
| Apply translation to a point but not to a free displacement vector | I can convert a point and a free displacement vector without applying the same translation to both. |
| Compose a chain of labeled rigid transforms in the correct order | I can assemble a base-to-sensor transform from a labeled chain without reversing its order. |
| Invert a rigid transform while rotating its translation correctly | I can invert a rigid transform and verify a point round trip. |
| Count independent coordinates of an unconstrained serial joint chain | I can count configuration variables for an independent open chain and identify when the rule no longer applies. |
| Specify joint order, zero references, signs, and units for a configuration | I can explain every entry in a joint configuration and distinguish relative from absolute joint angles. |
| Distinguish joint configuration, task coordinates, and reachable workspace | I can state whether a target specifies position, orientation, or both and distinguish it from joint configuration. |
| Calculate position and orientation of an ideal two-revolute-link planar arm | I can compute the ideal planar tip position and orientation from two joint angles. |
| Include a fixed tool offset after the final link transform | I can locate an offset tool point without confusing local and base coordinates. |
| Check the geometric position reach of an unrestricted planar two-link arm | I can distinguish geometric position reachability from limits, obstacles, and pose feasibility. |
| Calculate both regular inverse-kinematic branches of a planar two-link arm | I can compute both regular position solutions and recognize the named degenerate cases. |
| Verify an inverse-kinematic candidate by forward substitution and joint limits | I can reject a candidate that misses its target or violates a joint limit and state the remaining checks. |
| Derive the Cartesian position Jacobian of a planar two-link arm | I can derive the planar position Jacobian and state the meaning of its rows and columns. |
| Calculate instantaneous planar tip velocity from joint rates | I can calculate tip velocity and explain why the current configuration matters. |
| Identify lost instantaneous motion directions at a planar arm singularity | I can identify the planar singular configurations and explain the local motion restriction. |

## Existing topics retained

r-frame, r-rigid, r-dof, r-configuration, r-forward, r-inverse, r-jacobian, and r-singular remain broad overviews. Their mathematical prerequisites are reused. c-transforms remains the software implementation topic; these additions concern geometric interpretation and calculations. No answers are copied from an overview into a narrower skill.

## Addressed within this package

- Frames: labeling, axis-based orientation, proper-rotation checks, point versus displacement conversion.
- Transforms: composition, inversion, fixed tool offsets.
- Configuration: independent open-chain coordinates, conventions, task versus joint space.
- Planar kinematics: forward pose, geometric position reach, regular inverse branches, candidate verification.
- Local motion: planar position Jacobian, joint-to-tip velocity, singular directions.

## Remaining work

- Moving-observer velocity transformations and spatial twists
- Euler angles, quaternions, exponential coordinates and screw theory
- Closed-chain mobility and loop constraints
- General spatial forward kinematics and DH conventions
- Numerical inverse kinematics and redundancy resolution
- Full spatial Jacobians, manipulability and force mappings
- Dynamics, actuation, controls, perception, planning and integration

These deferrals remain explicit future work; there is no fixed small-batch ceiling or equal-count target across subjects. Next robotics branches can develop spatial motion and numerical kinematics, followed by actuation and feedback.

## References

Northwestern Modern Robotics video supplements; accessed 2026-09-14. Skill boundaries and dependencies are editorial, not the book’s official curriculum graph.

- 0: [3 2 1 rotation matrices part 1 of 2](https://modernrobotics.northwestern.edu/nu-gm-book-resource/3-2-1-rotation-matrices-part-1-of-2/)
- 1: [3 2 1 rotation matrices part 2 of 2](https://modernrobotics.northwestern.edu/nu-gm-book-resource/3-2-1-rotation-matrices-part-2-of-2/)
- 2: [3 3 1 homogeneous transformation matrices](https://modernrobotics.northwestern.edu/nu-gm-book-resource/3-3-1-homogeneous-transformation-matrices/)
- 3: [2 2 degrees of freedom of a robot](https://modernrobotics.northwestern.edu/nu-gm-book-resource/2-2-degrees-of-freedom-of-a-robot/)
- 4: [2 3 2 configuration space representation](https://modernrobotics.northwestern.edu/nu-gm-book-resource/2-3-2-configuration-space-representation/)
- 5: [2 5 task space and workspace](https://modernrobotics.northwestern.edu/nu-gm-book-resource/2-5-task-space-and-workspace/)
- 6: [forward kinematics example](https://modernrobotics.northwestern.edu/nu-gm-book-resource/forward-kinematics-example/)
- 7: [inverse kinematics of open chains](https://modernrobotics.northwestern.edu/nu-gm-book-resource/inverse-kinematics-of-open-chains/)
- 8: [5 1 1 space jacobian](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-1-1-space-jacobian/)
- 9: [5 3 singularities](https://modernrobotics.northwestern.edu/nu-gm-book-resource/5-3-singularities/)
