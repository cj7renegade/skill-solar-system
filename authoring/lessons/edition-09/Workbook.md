# Core Lessons - Workbook (Edition 09)

Synthetic exercises and simulations that go with the 21 cards. `core2_lab.py` computes every answer.
None of them measures a real robot, sensor or circuit, and none marks a skill.

## Probability, statistics and signals

1. **Random variables and sampling (`m-random`, `m-sampling`).** The two-coin count and the die;
   the fleet whose corner robots never upload.
2. **Regression and calibration (`m-regression`, `e-calibration`).** Fit the curved data and read its
   residuals; fit the force-sensor curve and convert 600 counts.
3. **Waves, aliasing and conversion (`p-wave`, `e-sampling`, `e-adc`).** Ultrasonic and radio
   wavelengths; aliases at 200 Hz and 1 kHz sampling; LSB, offset and reference error of two converters.

## Calculus and transforms

4. **Integrals (`m-defintegral`, `m-antiderivative`, `m-ftc`, `m-improper`).** Riemann sums at 3, 6 and
   3000 strips; the joint position from its velocity; F(b) - F(a) with a numerical check; four improper
   integrals, two convergent and two not.
5. **Complex numbers and the Laplace transform (`m-complex`, `m-laplace`).** Products, quotients and the
   square-root trap; the transform of e^(-2t) at s = 1, and y' + 2y = 0.

## Sensing, control and evaluation

6. **IMU and orientation (`e-imu`, `P07`).** Bias drift, tilt readings, the complementary filter's
   steady error, and the accelerometer's error under sideways acceleration.
7. **Models (`A11`, `C07`).** Fit K and tau from a step, test on a second run; simulate the first-order
   model and the unstable one.
8. **Sampled loops (`C08`).** Simulate the proportional loop at four sample times, with and without a
   one-step delay.
9. **State feedback and feedforward (`C09`, `C06`).** Rank checks, closed-loop and observer poles, the
   perturbed model; steady errors with and without feedforward and model error.
10. **SLAM evaluation (`N09`).** Trajectory error and drift from four checkpoints.
