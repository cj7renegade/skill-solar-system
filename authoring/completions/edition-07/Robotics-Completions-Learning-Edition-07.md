# Robotics Completions - Learning Edition 07

8 introductory cards: the six V3 entries the merge left in the I05 chain without a lesson, and the two new skills P11 and A12. They do not mark proficiency and demonstrate no physical robot. Every number in a worked example or an answer is recomputed by completions_lab.py.

## m-inverse - Inverse functions

**Prerequisites:** m-function, m-equation

**Why it matters:** Prepares for Inverse trigonometry and quadrants.

A function f has an inverse on a domain when it is one-to-one there: each output comes from exactly one input. The inverse f^-1 undoes f, so f^-1(f(x)) = x for every x in the domain and f(f^-1(y)) = y for every y in the range. To find it, write y = f(x), solve for x in terms of y, and state the inverse's domain (the range of f) and its range (the domain of f). When f is not one-to-one, restrict its domain to a piece where it is, and say which piece: that choice decides which input the inverse returns. Check an inverse by substituting back in both directions.

**Worked example:** f(x) = 2x + 3. Write y = 2x + 3 and solve: x = (y - 3)/2, so f^-1(y) = (y - 3)/2. Check: f(4) = 11 and f^-1(11) = 4. For g(x) = x^2 the equation g(x) = 9 has two solutions, 3 and -3, so g has no inverse on all real numbers. Restricted to x >= 0 the inverse is sqrt(y) and returns 3; restricted to x <= 0 it is -sqrt(y) and returns -3. Either inverse accepts only y >= 0.

**Practice:** Find the inverse of f(x) = (x - 5)/4 and check it with x = 13.

<details><summary>Practice answer</summary>

y = (x - 5)/4 gives x = 4y + 5, so f^-1(y) = 4y + 5. Check: f(13) = 2 and f^-1(2) = 13.

</details>

**Boundary or misconception check:** A sensor reports the square of a signed position, s = p^2. It reads 9. What was p?

<details><summary>Boundary answer</summary>

It cannot be decided from s alone: p = 3 and p = -3 both give 9. Undoing the square needs a stated restriction (for example p >= 0) or a second piece of information such as the sign.

</details>

**Full demonstration:** Reverse a one-to-one mapping and restrict the domain when needed.

**Evidence expectations:** Record steps; check the result by substitution, an independent calculation or an explicit identity; state domains and units when applicable. Record task and version; inputs and assumptions; work or implementation; reference result or measurement method; outcome and limits.

**Real-hardware evidence needed:** no

**Practice mode:** Written calculation, checked by substitution in the lab.

**Remaining work:** Varied practice with rational, exponential and piecewise functions; inverse functions in units conversions and sensor calibrations.

## m-invtrig - Inverse trigonometry and quadrants

**Prerequisites:** m-trig, m-inverse

**Why it matters:** Prepares for Solve and verify planar inverse kinematics.

arcsin, arccos and arctan each return one principal angle: arcsin and arctan in [-90, 90] deg, arccos in [0, 180] deg. A ratio alone loses the quadrant. tan(theta) = y/x is the same for the points (1, 1) and (-1, -1), and sin(theta) = 0.5 holds for both 30 and 150 deg. When both components x and y are known, atan2(y, x) returns the direction of the point (x, y) in (-180, 180] deg, using the signs of both to pick the quadrant. atan2(0, 0) has no meaning: the zero vector has no direction. Check a recovered angle by computing r*cos(theta) and r*sin(theta), with r = sqrt(x^2 + y^2), and comparing them with x and y, signs included. Watch the order: atan2 takes y first in most libraries.

**Worked example:** Find the direction of the point (-3, 3). arctan(3/(-3)) = arctan(-1) = -45 deg, which points to (3, -3), the wrong quadrant. atan2(3, -3) = 135 deg. Check: r = sqrt(18) = 4.243; r*cos(135 deg) = -3 and r*sin(135 deg) = 3, matching both components.

**Practice:** Find the direction angle of the point (-2, -2*sqrt(3)) = (-2, -3.464).

<details><summary>Practice answer</summary>

atan2(-3.464, -2) = -120 deg (equivalently 240 deg). arctan(-3.464/-2) = arctan(sqrt(3)) = 60 deg is the opposite direction. Check: r = 4, 4*cos(-120 deg) = -2 and 4*sin(-120 deg) = -3.464.

</details>

**Boundary or misconception check:** You know sin(theta) = 0.5. Is theta = 30 deg?

<details><summary>Boundary answer</summary>

Not necessarily: 150 deg has the same sine. A stated range for theta or the cosine's sign decides. This is the same ambiguity that gives a two-link arm two elbow solutions.

</details>

**Full demonstration:** Recover angles from ratios and resolve the quadrant ambiguity using both components.

**Evidence expectations:** Record steps; check the result by substitution, an independent calculation or an explicit identity; state domains and units when applicable. Record task and version; inputs and assumptions; work or implementation; reference result or measurement method; outcome and limits.

**Real-hardware evidence needed:** no

**Practice mode:** Written calculation, checked against atan2 in the lab.

**Remaining work:** Varied practice in all four quadrants, angle wrapping across +/-180 deg, and inverse trigonometry inside kinematic and navigation formulas.

## p-work - Work by a constant force

**Prerequisites:** p-newton, m-dot

**Why it matters:** Prepares for Kinetic energy and work-energy balance and Gravitational and spring potential energy.

A constant force F acting on an object that moves through a straight displacement d does work W = F . d = |F| |d| cos(theta), where theta is the angle between them. Only the component of the force along the displacement counts. W is positive when that component points along the motion (the force adds energy to the object), negative when it points against it, and zero when the force is perpendicular to the motion or there is no motion. Work is measured in joules, 1 J = 1 N*m; a joule of work is not a newton-metre of torque, even though the units multiply out the same. State the system (which object) and which force before computing, because each force does its own work.

**Worked example:** A rope pulls a cart with 20 N at 30 deg above the horizontal while the cart rolls 3 m along level ground. Components: F = (17.32, 10.0) N, d = (3, 0) m, so W = 17.32 * 3 + 10.0 * 0 = 52.0 J, the same as 20 * 3 * cos(30 deg). The vertical part of the pull does no work, and neither does the ground's normal force, because both are perpendicular to the motion.

**Practice:** Friction of 50 N opposes a block sliding 4 m. How much work does friction do on the block?

<details><summary>Practice answer</summary>

W = 50 * 4 * cos(180 deg) = -200 J. The negative sign means friction removes 200 J from the block's motion, turning it into heat.

</details>

**Boundary or misconception check:** You hold a 10 kg box still at shoulder height for a minute. How much work does your holding force do on the box?

<details><summary>Boundary answer</summary>

None: the box does not move, so W = 0. Your muscles still use energy, but this force transfers none to the box. Effort is not mechanical work.

</details>

**Full demonstration:** Calculate energy transfer through the component of force along displacement.

**Evidence expectations:** State system boundary and assumptions; use coherent units; verify signs and physical limiting behavior. Record task and version; inputs and assumptions; work or implementation; reference result or measurement method; outcome and limits.

**Real-hardware evidence needed:** no

**Practice mode:** Written calculation on labeled scenarios, checked against the dot product in the lab.

**Remaining work:** Varied practice with several forces on one object, inclines and lifting; the work-energy theorem and work by a varying force.

## K05 - Solve planar two-link forward kinematics

**Prerequisites:** K03, K04, m-unitcircle

**Why it matters:** Prepares for Solve and verify planar inverse kinematics, Calculate and test a planar Jacobian, Implement general serial-arm forward kinematics, Compute a spatial Jacobian, and Solve numerical inverse kinematics.

A planar two-link arm has link lengths L1 and L2 and joint angles q1 (link 1 from the base x axis) and q2 (link 2 relative to link 1), counterclockwise positive, in radians. The wrist point is x = L1*cos(q1) + L2*cos(q1 + q2), y = L1*sin(q1) + L2*sin(q1 + q2), and link 2 points at phi = q1 + q2. A tool fixed to link 2 with offset a along the link and b perpendicular to it adds a*cos(phi) - b*sin(phi) to x and a*sin(phi) + b*cos(phi) to y; this is composing the arm's transform with the fixed tool transform, in that order. Declare the zero references, the positive direction, the units and whether q2 is relative or absolute before computing. Then verify with configurations whose answer you know: q = (0, 0) puts the tool at (L1 + L2 + a, b), and q = (90 deg, 0) points the arm straight up.

**Worked example:** L1 = 0.4 m, L2 = 0.3 m, a tool 0.1 m beyond the end of link 2 (a = 0.1, b = 0). At q1 = 30 deg, q2 = 45 deg: phi = 75 deg. Wrist: x = 0.4*cos(30) + 0.3*cos(75) = 0.3464 + 0.0776 = 0.4241 m; y = 0.4*sin(30) + 0.3*sin(75) = 0.2000 + 0.2898 = 0.4898 m. Tool: x = 0.4241 + 0.1*cos(75) = 0.4499 m; y = 0.4898 + 0.1*sin(75) = 0.5864 m, pointing at 75 deg. Check: at q = (0, 0) the same formulas give (0.8, 0) m, as expected.

**Practice:** Same arm and tool at q1 = 90 deg, q2 = -90 deg. Where is the tool and which way does it point?

<details><summary>Practice answer</summary>

phi = 0. Wrist: (0.4*0 + 0.3*1, 0.4*1 + 0.3*0) = (0.3, 0.4) m. Tool: (0.3 + 0.1, 0.4) = (0.4, 0.4) m, pointing along +x.

</details>

**Boundary or misconception check:** Your formulas use q2 relative to link 1, but the controller reports link 2's absolute angle, 75 deg, with q1 = 30 deg. What do you substitute for q2?

<details><summary>Boundary answer</summary>

q2 = 75 - 30 = 45 deg. Substituting 75 deg as q2 would put link 2 at 105 deg and give a wrong pose. Joint conventions are stated before computing, not guessed afterwards.

</details>

**Full demonstration:** Calculate tool pose with a fixed offset and verify known configurations.

**Evidence expectations:** Record steps; check the result by substitution, an independent calculation or an explicit identity; state domains and units when applicable. Record task and version; inputs and assumptions; work or implementation; reference result or measurement method; outcome and limits.

**Real-hardware evidence needed:** no

**Practice mode:** Written calculation, checked by the lab's forward-kinematics function and known configurations.

**Remaining work:** Varied practice with other offsets and conventions; the frame and planar-arm steps beneath this entry (sss-rob-*) have their own lessons to come in step 7.

## K06 - Solve and verify planar inverse kinematics

**Prerequisites:** K05, m-invtrig

**Why it matters:** Prepares for Implement general serial-arm forward kinematics, Compute a spatial Jacobian, and Solve numerical inverse kinematics.

Inverse kinematics finds the joint angles that put the wrist at a target (x, y). First check reach: with r^2 = x^2 + y^2, the target is reachable only if |L1 - L2| <= r <= L1 + L2. Then cos(q2) = (r^2 - L1^2 - L2^2)/(2*L1*L2), which gives two regular branches, q2 = +arccos(...) and q2 = -arccos(...) (elbow one way or the other). For each, q1 = atan2(y, x) - atan2(L2*sin(q2), L1 + L2*cos(q2)). Verify every candidate by forward kinematics and against the joint limits; a branch outside the limits is not a solution for this arm. Handle the boundaries explicitly: at r = L1 + L2 or r = |L1 - L2| the two branches meet in one solution (q2 = 0 or 180 deg); with L1 = L2 a target at the base leaves q1 free; outside the reach there is no solution, and the arccos argument must not be clipped to hide that. With a tool offset, subtract it first to get the wrist target.

**Worked example:** L1 = 0.4 m, L2 = 0.3 m, target (0.5, 0.3) m. r^2 = 0.34, inside [0.01, 0.49]. cos(q2) = (0.34 - 0.16 - 0.09)/0.24 = 0.375, so q2 = +67.98 deg or -67.98 deg. atan2(0.3, 0.5) = 30.96 deg and atan2(0.3*sin(67.98), 0.4 + 0.3*0.375) = 28.49 deg. Branch 1: q = (2.48 deg, 67.98 deg). Branch 2: q = (59.45 deg, -67.98 deg). Forward kinematics returns (0.5, 0.3) m for both, and both are inside limits of q1 in [-10, 180] deg and q2 in [-150, 150] deg.

**Practice:** Same arm, target (0, 0.5) m. Find both solutions.

<details><summary>Practice answer</summary>

cos(q2) = (0.25 - 0.25)/0.24 = 0, so q2 = +90 or -90 deg. With q2 = +90: q1 = 90 - atan2(0.3, 0.4) = 90 - 36.87 = 53.13 deg. With q2 = -90: q1 = 90 + 36.87 = 126.87 deg. Check (53.13, 90): x = 0.24 - 0.24 = 0, y = 0.32 + 0.18 = 0.5.

</details>

**Boundary or misconception check:** Same arm, target (0.75, 0) m. A program clips the arccos argument to 1 and reports q = (0, 0). Is that a solution?

<details><summary>Boundary answer</summary>

No. r = 0.75 m exceeds L1 + L2 = 0.7 m, so cos(q2) would be 1.302: the target is out of reach. Clipping hides the failure and returns a pose 0.05 m short. Report the target as unreachable.

</details>

**Full demonstration:** Check reach, compute both regular branches and verify pose and joint limits; handle boundary cases explicitly.

**Evidence expectations:** Record steps; check the result by substitution, an independent calculation or an explicit identity; state domains and units when applicable. Record task and version; inputs and assumptions; work or implementation; reference result or measurement method; outcome and limits.

**Real-hardware evidence needed:** no

**Practice mode:** Written calculation, with every branch checked by forward kinematics in the lab.

**Remaining work:** Varied practice with joint limits that exclude a branch, tool offsets and targets near the reach boundary; the planar reach, IK and verification steps beneath this entry (sss-rob-*) have their own lessons to come in step 7.

## K07 - Calculate and test a planar Jacobian

**Prerequisites:** K05, m-partial, R-M03, R-M02

**Why it matters:** Prepares for Implement general serial-arm forward kinematics, Compute a spatial Jacobian, and Solve numerical inverse kinematics.

The Jacobian J of a planar two-link arm maps joint rates to tip velocity: v = J * qdot. With s1 = sin(q1), c1 = cos(q1), s12 = sin(q1 + q2), c12 = cos(q1 + q2): J = [[-L1*s1 - L2*s12, -L2*s12], [L1*c1 + L2*c12, L2*c12]]. Test it against finite differences: move the joints a small time h along qdot, compute the tip by forward kinematics, and divide the change by h. A central difference, (p(q + h*qdot) - p(q - h*qdot))/(2h), converges faster than a one-sided one. If h is too large the estimate carries truncation error; if it is far too small, rounding error grows; shrink h until the estimate settles. det(J) = L1*L2*sin(q2), so the arm is singular when q2 = 0 or 180 deg (stretched out or folded back). There the two columns are parallel, the tip cannot move along the arm's radial direction at any finite joint rate, and asking for that motion demands unbounded rates nearby.

**Worked example:** L1 = 0.4 m, L2 = 0.3 m, q = (30 deg, 45 deg), qdot = (0.5, -0.2) rad/s. J = [[-0.4898, -0.2898], [0.4241, 0.0776]]. v = (-0.4898*0.5 + 0.2898*0.2, 0.4241*0.5 - 0.0776*0.2) = (-0.1869, 0.1965) m/s. A central difference with h = 1e-6 s gives the same values to 1e-9 m/s. det(J) = 0.12*sin(45 deg) = 0.0849, away from zero, so this pose is not singular.

**Practice:** Same arm at q = (0, 0). What is J, and can the tip move in +x?

<details><summary>Practice answer</summary>

J = [[0, 0], [0.7, 0.3]] and det(J) = 0: the arm is stretched out along x and singular. The first row is zero, so no joint rates move the tip in x; it can only move in y.

</details>

**Boundary or misconception check:** With the worked example's values, a one-sided finite difference with h = 0.5 s gives (-0.2089, 0.1757) m/s, about 12% off J*qdot. Is the Jacobian wrong?

<details><summary>Boundary answer</summary>

Not shown yet. h = 0.5 s moves the joints by 14 deg, far from small, so truncation error is expected. With h = 1e-4 s the one-sided estimate is (-0.18694, 0.19649), within 1e-5 of J*qdot. Shrink the step until the estimate converges before blaming either.

</details>

**Full demonstration:** Compare Jacobian velocity with finite differences and explain a singular configuration.

**Evidence expectations:** Record steps; check the result by substitution, an independent calculation or an explicit identity; state domains and units when applicable. Record task and version; inputs and assumptions; work or implementation; reference result or measurement method; outcome and limits.

**Real-hardware evidence needed:** no

**Practice mode:** Written calculation and a synthetic finite-difference comparison in the lab.

**Remaining work:** Varied practice near singular poses, velocity limits and the inverse rate problem; the planar Jacobian and singularity steps beneath this entry (sss-rob-*) have their own lessons to come in step 7.

## P11 - Detect an inconsistent measurement innovation

**Prerequisites:** P08

**Why it matters:** Prepares for Fuse nonlinear mobile-robot measurements.

When a filter receives a measurement z, the innovation nu = z - H*x_pred is how far the measurement is from what the filter predicted, and S = H*P_pred*H^T + R is the covariance the filter expects that gap to have. The normalized innovation squared, NIS = nu^T * S^-1 * nu, measures the gap in units of its own expected spread. If the motion model, the noise values and the timing are right, NIS follows a chi-square distribution with m degrees of freedom, m being the measurement's dimension. A gate rejects a measurement whose NIS exceeds a threshold fixed before the trial from m and a chosen false-alarm rate alpha: for alpha = 0.05 the threshold is 3.84 for m = 1 and 5.99 for m = 2. Even a perfect filter then rejects about alpha of good measurements. A rejection says only that measurement and prediction disagree. The fault may be the sensor (an outlier, a dropout read as zero) or the prediction (a wrong model, Q or R set too small, stale timing). Log each rejection rather than dropping it silently: a filter that keeps rejecting stops correcting and can drift away.

**Worked example:** Scalar position: the prediction is 2.0 m with variance P = 0.04 m^2, H = 1 and R = 0.01 m^2, so S = 0.05 m^2. Gate: m = 1, alpha = 0.05, threshold 3.84. Measurement 2.3 m: nu = 0.3, NIS = 0.09/0.05 = 1.8, accepted. Measurement 2.6 m: nu = 0.6, NIS = 0.36/0.05 = 7.2, rejected and logged. In the lab's 200-step synthetic run, both injected outliers are rejected, along with 9 good measurements: a 5.5% rejection rate against the 5% expected.

**Practice:** A 2-D measurement has innovation nu = (0.3, 0.3) m and S = diag(0.04, 0.09) m^2. With a 5% gate, accept or reject?

<details><summary>Practice answer</summary>

NIS = 0.3^2/0.04 + 0.3^2/0.09 = 2.25 + 1.00 = 3.25. The m = 2 threshold is 5.99, so accept.

</details>

**Boundary or misconception check:** Over 200 steps, 30% of measurements fail a 5% gate, spread across every sensor, and the average NIS is about 3.9 for a 1-D measurement. Are all the sensors faulty?

<details><summary>Boundary answer</summary>

Unlikely. Consistent NIS averages about m = 1. A high rate across every sensor points at the filter: here R was set to a quarter of the true noise variance (the lab's mistuned run). Re-examine R, Q, the model and the timing before blaming the sensors.

</details>

**Full demonstration:** For a stated linear Gaussian filter, compute each measurement's innovation and innovation covariance, form the normalized innovation squared, and compare it with a chi-square gate fixed in advance from the measurement dimension and a stated false-alarm rate; classify a synthetic sequence that includes injected outliers, and explain why a rejected measurement alone does not distinguish a sensor fault from a wrong noise or motion model.

**Evidence expectations:** Record steps; check the result by substitution, an independent calculation or an explicit identity; state domains and units when applicable. Record task and version; inputs and assumptions; work or implementation; reference result or measurement method; outcome and limits.

**Real-hardware evidence needed:** no

**Practice mode:** Written calculation and a synthetic gated filter run in the lab.

**Remaining work:** Varied practice with correlated S, higher dimensions and gating inside the nonlinear estimator of P09; checking NIS over logged runs.

## A12 - Distinguish coupling misalignment from backlash

**Prerequisites:** A09, D08

**Why it matters:** Prepares for Diagnose integrated failures (optional preparation).

Two faults can both make an output shaft disagree with its motor. Backlash is clearance in the drive: when the input reverses, the output stays still until the clearance is taken up. It shows up as a dead band at each reversal, of about the same width whatever the shaft angle, and it causes no error during steady rotation in one direction. Misalignment is two shafts that do not line up, offset sideways or meeting at an angle. Through a coupling it causes an error, a load or a vibration that repeats with shaft angle, once or twice per revolution depending on the coupling and the kind of misalignment, and it adds side load on the bearings. It causes no dead band of its own. To separate them, record the output against the input over full revolutions in each direction, and reverse at several shaft angles under light load. A dead band of constant width means backlash. An error that repeats per revolution and is the same in both directions means misalignment. Both can be present together. Compliance (twist under load, as in A09) can look like either at a single point, so compare at light and full load.

**Worked example:** A joint is traced every 15 deg over one revolution in each direction. At every angle the two traces are 0.6 deg apart, each lagging the input in its direction of travel: a 0.6 deg dead band, the same at all 24 angles. The average of the two traces varies as 0.15 deg * sin(2*theta), repeating twice per revolution, and the support bearing runs warmer than its neighbour. Conclusion: backlash of 0.6 deg and a misalignment error of 0.15 deg amplitude, both present. The lab's classifier reports the same from the generated traces.

**Practice:** During steady rotation the output error is +0.2 deg at 90 deg, -0.2 deg at 270 deg and 0 at 0 and 180 deg, the same in both directions. Reversals at any angle show no dead band above the 0.02 deg resolution. Which fault?

<details><summary>Practice answer</summary>

Misalignment (or eccentricity): an error repeating once per revolution, the same in both directions, with no dead band. Any backlash is below the measurement resolution.

</details>

**Boundary or misconception check:** At one shaft angle you reverse direction and measure 0.5 deg of lost motion. Is that backlash?

<details><summary>Boundary answer</summary>

Not yet. At a single angle, a misalignment error and twist under load can also look like lost motion. Repeat the reversal at several shaft angles and at light load. A width that stays the same at every angle is backlash.

</details>

**Full demonstration:** Given a motor, coupling and output shaft with stated measurements of output angle against input angle over full revolutions and at direction reversals, plus shaft-support load or vibration readings, attribute the error to backlash (a dead band at reversal, independent of shaft angle), misalignment (an error and radial load that repeat once or twice per revolution, with no dead band) or both; name the measurement that would separate them when the data cannot.

**Evidence expectations:** State system boundary and assumptions; use coherent units; verify signs and physical limiting behavior. Record task and version; inputs and assumptions; work or implementation; reference result or measurement method; outcome and limits.

**Real-hardware evidence needed:** no

**Practice mode:** Explanation and calculation on generated angle traces, classified in the lab.

**Remaining work:** Measuring a real joint's traces with a stated instrument and resolution, alignment and runout checks, and the effect of coupling type; coupling selection and alignment procedure are outside this entry.
