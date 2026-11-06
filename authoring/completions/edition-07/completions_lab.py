"""Synthetic exercises for Robotics Completions, Learning Edition 07.

Standard library only. Every worked example and practice answer in the eight lessons is recomputed
here, so a number on a card is checked rather than just written. Nothing here talks to hardware,
writes a proficiency answer or demonstrates a robot.

    python completions_lab.py --output lab-results
"""
import argparse, json, math, statistics
from pathlib import Path

SCOPE = 'Synthetic calculations only; no physical robot, sensor or joint is measured, and no proficiency is written.'


# m-inverse -------------------------------------------------------------------------------------
def inverse_linear(a, b):
    """Inverse of f(x) = a*x + b, which is one-to-one only when a is not zero."""
    if a == 0:
        raise ValueError('a constant function has no inverse')
    return lambda y: (y - b) / a


def inverse_square(y, branch):
    """Inverse of x**2 on a stated half of the real line: 'nonnegative' or 'nonpositive'."""
    if y < 0:
        raise ValueError('x**2 never takes a negative value')
    if branch not in ('nonnegative', 'nonpositive'):
        raise ValueError('state which half of the domain the inverse returns')
    return math.sqrt(y) if branch == 'nonnegative' else -math.sqrt(y)


# m-invtrig -------------------------------------------------------------------------------------
def direction_deg(x, y):
    """Direction angle of the point (x, y) in (-180, 180] degrees, using both components."""
    if x == 0 and y == 0:
        raise ValueError('the zero vector has no direction')
    return math.degrees(math.atan2(y, x))


# p-work ----------------------------------------------------------------------------------------
def work(force, displacement):
    """Work by a constant force along a straight displacement: the dot product, in joules."""
    if len(force) != len(displacement):
        raise ValueError('force and displacement need the same dimension')
    return sum(f * d for f, d in zip(force, displacement))


# K05 -------------------------------------------------------------------------------------------
def planar_fk(l1, l2, q1, q2, tool=(0.0, 0.0)):
    """Tool pose (x, y, phi) of a planar two-link arm. q2 is relative to link 1; angles in radians,
    counterclockwise positive from the base x axis. tool = (a, b) is a fixed offset in link 2's frame:
    a along the link, b perpendicular to it."""
    if l1 <= 0 or l2 <= 0:
        raise ValueError('link lengths must be positive')
    phi = q1 + q2
    wx = l1 * math.cos(q1) + l2 * math.cos(phi)
    wy = l1 * math.sin(q1) + l2 * math.sin(phi)
    a, b = tool
    return (wx + a * math.cos(phi) - b * math.sin(phi), wy + a * math.sin(phi) + b * math.cos(phi), phi)


# K06 -------------------------------------------------------------------------------------------
REACH_TOLERANCE = 1e-12


def planar_ik(l1, l2, x, y):
    """Both regular inverse-kinematic branches for a wrist target (x, y). Raises when the target is
    out of reach; returns one solution at the reach boundary, where the branches coincide."""
    r2 = x * x + y * y
    if r2 == 0 and l1 == l2:
        raise ValueError('target at the base with equal links: q1 is arbitrary (infinitely many solutions)')
    c2 = (r2 - l1 * l1 - l2 * l2) / (2 * l1 * l2)
    if c2 > 1 + REACH_TOLERANCE or c2 < -1 - REACH_TOLERANCE:
        raise ValueError(f'target out of reach: cos(q2) would be {c2:.4f}')
    # Within rounding of the reach boundary the two branches are one solution (q2 = 0 or pi).
    if abs(abs(c2) - 1) <= REACH_TOLERANCE:
        c2 = math.copysign(1.0, c2)
    solutions = []
    branches = [math.acos(c2)] if abs(c2) == 1 else [math.acos(c2), -math.acos(c2)]
    for q2 in branches:
        q1 = math.atan2(y, x) - math.atan2(l2 * math.sin(q2), l1 + l2 * math.cos(q2))
        solutions.append((math.atan2(math.sin(q1), math.cos(q1)), q2))
    return solutions


def within_limits(q, limits):
    return all(lo <= v <= hi for v, (lo, hi) in zip(q, limits))


# K07 -------------------------------------------------------------------------------------------
def planar_jacobian(l1, l2, q1, q2):
    s1, c1, s12, c12 = math.sin(q1), math.cos(q1), math.sin(q1 + q2), math.cos(q1 + q2)
    return [[-l1 * s1 - l2 * s12, -l2 * s12], [l1 * c1 + l2 * c12, l2 * c12]]


def jacobian_velocity(l1, l2, q, qdot):
    j = planar_jacobian(l1, l2, *q)
    return tuple(j[i][0] * qdot[0] + j[i][1] * qdot[1] for i in range(2))


def finite_difference_velocity(l1, l2, q, qdot, h, central=True):
    """Tip velocity estimated by moving the joints a small time step h along qdot."""
    def tip(t):
        x, y, _ = planar_fk(l1, l2, q[0] + t * qdot[0], q[1] + t * qdot[1])
        return x, y
    if central:
        a, b = tip(h), tip(-h)
        return tuple((a[i] - b[i]) / (2 * h) for i in range(2))
    a, b = tip(h), tip(0)
    return tuple((a[i] - b[i]) / h for i in range(2))


def determinant(j):
    return j[0][0] * j[1][1] - j[0][1] * j[1][0]


# P11 -------------------------------------------------------------------------------------------
def chi_square_gate(dimension, false_alarm):
    """Chi-square threshold for a measurement of dimension 1 or 2 at a stated false-alarm rate."""
    if not 0 < false_alarm < 1:
        raise ValueError('the false-alarm rate must be between 0 and 1')
    if dimension == 1:
        z = statistics.NormalDist().inv_cdf(1 - false_alarm / 2)
        return z * z
    if dimension == 2:
        return -2 * math.log(false_alarm)
    raise ValueError('this lab covers measurement dimensions 1 and 2 only')


def nis(innovation, s_diagonal):
    """Normalized innovation squared for an innovation with diagonal covariance S."""
    if any(v <= 0 for v in s_diagonal):
        raise ValueError('innovation covariance must be positive')
    return sum(v * v / s for v, s in zip(innovation, s_diagonal))


def scalar_filter_sequence(measurements, x0, p0, q, r, false_alarm=0.05):
    """A scalar random-walk filter that gates each measurement before using it. Rejected
    measurements are logged, not used; the state is predicted as usual."""
    gate = chi_square_gate(1, false_alarm)
    x, p, log = x0, p0, []
    for k, z in enumerate(measurements):
        p = p + q
        s = p + r
        value = (z - x) ** 2 / s
        accepted = value <= gate
        if accepted:
            gain = p / s
            x, p = x + gain * (z - x), (1 - gain) * p
        log.append(dict(step=k, z=z, nis=value, accepted=accepted))
    return log


def synthetic_innovation_run(steps, true_r, assumed_r, seed=7, outliers=()):
    """Measurements of a fixed value 0 with noise of variance true_r; the filter assumes assumed_r."""
    import random
    rng = random.Random(seed)
    z = [rng.gauss(0, math.sqrt(true_r)) for _ in range(steps)]
    for k, v in outliers:
        z[k] = v
    return scalar_filter_sequence(z, 0.0, 1.0, 0.0, assumed_r)


# A12 -------------------------------------------------------------------------------------------
def joint_trace(backlash_deg, periodic_deg, harmonic, angles_deg, direction):
    """Output-minus-input error of a joint driven in one direction: half the backlash lags behind
    the input in the direction of travel, plus a periodic error from misalignment."""
    lag = -direction * backlash_deg / 2
    return [lag + periodic_deg * math.sin(harmonic * math.radians(a)) for a in angles_deg]


def classify_joint(forward, reverse, angles_deg, resolution_deg):
    """Separates a dead band at reversal (backlash) from an error that repeats with shaft angle
    (misalignment), from forward and reverse traces over full revolutions."""
    width = [f - r for f, r in zip(forward, reverse)]
    dead_band = statistics.fmean(width)
    spread = max(width) - min(width)
    mean_error = [(f + r) / 2 for f, r in zip(forward, reverse)]
    periodic = (max(mean_error) - min(mean_error)) / 2
    found = []
    if abs(dead_band) > resolution_deg:
        found.append('backlash')
    if periodic > resolution_deg:
        found.append('misalignment')
    return dict(dead_band_deg=abs(dead_band), dead_band_spread_deg=spread, periodic_amplitude_deg=periodic,
                causes=found or ['neither above resolution'])


# -----------------------------------------------------------------------------------------------
def experiments():
    d = math.radians
    results = dict(scope=SCOPE, physical_robot_demonstrated=False, proficiency_written=False)

    f_inv = inverse_linear(2, 3)
    p_inv = inverse_linear(0.25, -1.25)
    results['m-inverse'] = dict(worked_f_inverse_of_11=f_inv(11), worked_sqrt_branch=[inverse_square(9, 'nonnegative'), inverse_square(9, 'nonpositive')],
                                practice_inverse_of_2=p_inv(2), practice_forward_of_13=(13 - 5) / 4)

    results['m-invtrig'] = dict(worked_arctan_ratio=math.degrees(math.atan(3 / -3)), worked_atan2=direction_deg(-3, 3),
                                worked_radius=math.hypot(-3, 3), practice_atan2=direction_deg(-2, -2 * math.sqrt(3)),
                                practice_arctan_ratio=math.degrees(math.atan((-2 * math.sqrt(3)) / -2)),
                                boundary_angles_with_sine_half=[math.degrees(math.asin(0.5)), 180 - math.degrees(math.asin(0.5))])

    pull = (20 * math.cos(d(30)), 20 * math.sin(d(30)))
    results['p-work'] = dict(worked_pull_components=pull, worked_work=work(pull, (3, 0)), worked_normal_force_work=work((0, 40), (3, 0)),
                             practice_friction_work=work((-50, 0), (4, 0)), boundary_holding_work=work((0, 98.1), (0, 0)))

    arm = (0.4, 0.3)
    worked = planar_fk(*arm, d(30), d(45), tool=(0.1, 0))
    wrist = planar_fk(*arm, d(30), d(45))
    results['K05'] = dict(worked_wrist=wrist[:2], worked_tool=worked[:2], worked_phi_deg=math.degrees(worked[2]),
                          check_zero=planar_fk(*arm, 0, 0, tool=(0.1, 0))[:2], check_straight_up=planar_fk(*arm, d(90), 0, tool=(0.1, 0))[:2],
                          practice_tool=planar_fk(*arm, d(90), d(-90), tool=(0.1, 0))[:2],
                          boundary_wrong_phi_deg=math.degrees(d(30) + d(75)))

    limits = [(d(-10), d(180)), (d(-150), d(150))]
    sols = planar_ik(*arm, 0.5, 0.3)
    results['K06'] = dict(worked_cos_q2=(0.34 - 0.16 - 0.09) / 0.24,
                          worked_solutions_deg=[[math.degrees(a), math.degrees(b)] for a, b in sols],
                          worked_fk_check=[planar_fk(*arm, *s)[:2] for s in sols],
                          worked_within_limits=[within_limits(s, limits) for s in sols],
                          practice_solutions_deg=[[math.degrees(a), math.degrees(b)] for a, b in planar_ik(*arm, 0, 0.5)],
                          reach_boundary_solutions=len(planar_ik(*arm, 0.7, 0)),
                          boundary_cos_q2=(0.75 ** 2 - 0.16 - 0.09) / 0.24)

    q, qdot = (d(30), d(45)), (0.5, -0.2)
    results['K07'] = dict(worked_jacobian=planar_jacobian(*arm, *q), worked_velocity=jacobian_velocity(*arm, q, qdot),
                          worked_central_difference=finite_difference_velocity(*arm, q, qdot, 1e-6),
                          worked_determinant=determinant(planar_jacobian(*arm, *q)),
                          practice_jacobian=planar_jacobian(*arm, 0, 0), practice_determinant=determinant(planar_jacobian(*arm, 0, 0)),
                          boundary_large_step=finite_difference_velocity(*arm, q, qdot, 0.5, central=False),
                          boundary_small_step=finite_difference_velocity(*arm, q, qdot, 1e-4, central=False))

    honest = synthetic_innovation_run(200, 0.01, 0.01, outliers=[(50, 0.6), (120, -0.5)])
    tuned_too_tight = synthetic_innovation_run(200, 0.01, 0.0025)
    results['P11'] = dict(gate_1d_5pct=chi_square_gate(1, 0.05), gate_2d_5pct=chi_square_gate(2, 0.05),
                          worked_s=0.04 + 0.01, worked_nis=[nis([0.3], [0.05]), nis([0.6], [0.05])],
                          practice_nis=nis([0.3, 0.3], [0.04, 0.09]),
                          sequence_rejected_steps=[e['step'] for e in honest if not e['accepted']],
                          sequence_rejection_rate=sum(not e['accepted'] for e in honest) / len(honest),
                          mistuned_rejection_rate=sum(not e['accepted'] for e in tuned_too_tight) / len(tuned_too_tight),
                          mistuned_mean_nis=statistics.fmean(e['nis'] for e in tuned_too_tight))

    angles = list(range(0, 360, 15))
    w_fwd, w_rev = joint_trace(0.6, 0.15, 2, angles, +1), joint_trace(0.6, 0.15, 2, angles, -1)
    p_fwd, p_rev = joint_trace(0.0, 0.2, 1, angles, +1), joint_trace(0.0, 0.2, 1, angles, -1)
    b_fwd, b_rev = joint_trace(0.5, 0.0, 1, angles, +1), joint_trace(0.5, 0.0, 1, angles, -1)
    results['A12'] = dict(worked=classify_joint(w_fwd, w_rev, angles, 0.02), practice=classify_joint(p_fwd, p_rev, angles, 0.02),
                          backlash_only=classify_joint(b_fwd, b_rev, angles, 0.02))
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--output', default='lab-results')
    out = Path(parser.parse_args().output)
    out.mkdir(parents=True, exist_ok=True)
    (out / 'Lab-Results.json').write_text(json.dumps(experiments(), indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {out / "Lab-Results.json"}')


if __name__ == '__main__':
    main()
