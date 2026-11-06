# Robotics Completions - Workbook (Edition 07)

Synthetic exercises that go with the eight cards. `completions_lab.py` computes every answer here.
None of them measures a real robot, sensor or joint, and none marks a skill.

## Foundations

1. **Inverse functions (`m-inverse`).** Invert `f(x) = 2x + 3`, `f(x) = (x - 5)/4` and `x^2` on each
   half of the real line. Check each by substituting back both ways. Try `inverse_linear(0, 1)` and
   see it refused.
2. **Inverse trigonometry (`m-invtrig`).** Compare `arctan(y/x)` with `atan2(y, x)` for points in all
   four quadrants, including `(-3, 3)` and `(-2, -3.464)`. Confirm that `(0, 0)` is refused.
3. **Work (`p-work`).** Compute the work of a 20 N pull at 30 deg over 3 m, of friction over 4 m, and
   of a holding force with no motion.

## Planar arm (L1 = 0.4 m, L2 = 0.3 m, tool 0.1 m)

4. **Forward kinematics (`K05`).** Compute the tool pose at `(30, 45)`, `(0, 0)`, `(90, 0)` and
   `(90, -90)` deg. Check the two known poses first.
5. **Inverse kinematics (`K06`).** Solve for `(0.5, 0.3)` and `(0, 0.5)`, verify every branch by forward
   kinematics and the limits `q1` in [-10, 180] deg, `q2` in [-150, 150] deg. Then try `(0.7, 0)`
   (one solution), `(0.75, 0)` (out of reach) and equal links at the base (undetermined).
6. **Jacobian (`K07`).** Compare `J * qdot` with central and one-sided finite differences at
   `h = 0.5`, `1e-4` and `1e-6` s, and find the determinant at `(30, 45)` and `(0, 0)` deg.

## Estimation and drive faults

7. **Innovation gating (`P11`).** Compute the 5% gates for one and two dimensions, the worked and
   practice NIS values, and run the 200-step scalar filter twice. In the honest run the noise is
   modelled correctly and outliers are injected at steps 50 and 120. In the mistuned run R is a
   quarter of the true variance. Compare the rejection rates and the mean NIS.
8. **Backlash or misalignment (`A12`).** Generate forward and reverse traces with backlash only,
   misalignment only, and both, and classify them at a 0.02 deg resolution.

## What a real demonstration adds

The full demonstrations of these eight entries work from stated values or generated data, so none
needs real-hardware evidence. Doing the same work on real equipment is still worth doing, and is
listed under *Remaining work* on each card: logged estimator runs for P11, and measured joint traces
with a stated instrument and resolution for A12.
