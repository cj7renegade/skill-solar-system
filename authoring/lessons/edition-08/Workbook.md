# Core Lessons - Workbook (Edition 08)

Synthetic exercises that go with the 23 cards. `core_lab.py` computes every answer. None of them
measures a real robot, sensor or circuit, and none marks a skill. The planar arm throughout has
L1 = 0.5 m and L2 = 0.25 m.

## Frames and transforms

1. **Counting coordinates (`sss-rob-serial-dof`).** Count the coordinates of the pick-and-place arm
   and the gantry, and the four-bar linkage's mobility, 3 * (n - 1) - 2 * j.
2. **Frame labels (`sss-rob-frame-labels`).** Re-place the lidar obstacle in the map with the lidar
   rotated 0 deg and 90 deg.
3. **Rotation columns and checks (`sss-rob-rotation-columns`, `sss-rob-rotation-check`).** Build
   R_AB for 90 deg and 180 deg about z, convert vectors both ways, and classify a rotation, a
   reflection and a scaled matrix.
4. **Points and directions (`sss-rob-point-direction`).** Convert a point, a displacement, a velocity
   and gravity between the same two frames.
5. **Composition and inversion (`sss-rob-compose`, `sss-rob-inverse`).** Compose the planar
   shoulder-camera chain in both orders; invert a transform correctly and with -t, and compare the
   round trips.

## The planar arm

6. **Conventions and tasks (`sss-rob-joint-conventions`, `sss-rob-task-coordinates`).** Convert
   relative and absolute angles; find both configurations for (0.6, 0.2) and their tool angles.
7. **Reach, forward and inverse kinematics (`sss-rob-planar-reach`, `sss-rob-planar-fk`,
   `sss-rob-planar-ik`).** Test five targets against the ring; compute the tip at (60, -30),
   (0, 0), (0, 90) and (90, 90); solve (0.6, 0.2), (0.5, 0.25) and (0.75, 0).
8. **Tool and verification (`sss-rob-tool-offset`, `sss-rob-ik-verification`).** Place the
   gripper tip at two poses; verify four candidates against a 1 mm tolerance and the stated limits.
9. **Jacobian, rates and singularity (`sss-rob-position-jacobian`, `sss-rob-joint-to-tip-rate`,
   `sss-rob-planar-singularity`).** Evaluate J at three poses, the tip velocity for two rate vectors,
   and det(J) across q2.

## Physics and mathematics

10. **Charge, field and potential (`p-charge`, `p-electricfield`, `p-potentialelectric`).** The
    rubbed rod, the touching spheres, the two-charge force, the midpoint field and the plate field.
11. **Logarithms, identities and derivatives (`m-log`, `m-trigidentity`, `m-transdiff`).** Each
    worked example and practice answer, including the degree-versus-radian slopes.
