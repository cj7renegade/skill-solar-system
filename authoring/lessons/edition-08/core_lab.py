"""Synthetic exercises for Core Lessons, Learning Edition 08 (the I05 path's master skills).

Standard library only. Every worked example and practice answer in the 23 lessons is recomputed
here, so a number on a card is checked rather than just written. Nothing here talks to hardware,
writes a proficiency answer or demonstrates a robot.

    python core_lab.py --output lab-results
"""
import argparse, json, math
from pathlib import Path

SCOPE = 'Synthetic calculations only; no physical robot, sensor or circuit is measured, and no proficiency is written.'
E = 1.602176634e-19          # elementary charge, C
K = 8.99e9                   # Coulomb constant, N m^2 / C^2
L1, L2 = 0.5, 0.25           # the edition's planar arm, m (Edition 07 used 0.4 and 0.3)
d, deg = math.radians, math.degrees


# Small linear algebra -------------------------------------------------------------------------
def matmul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(len(b))) for j in range(len(b[0]))] for i in range(len(a))]


def matvec(a, v):
    return [sum(a[i][k] * v[k] for k in range(len(v))) for i in range(len(a))]


def transpose(a):
    return [list(r) for r in zip(*a)]


def det3(m):
    return (m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
            + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]))


def rot_z(angle_deg):
    c, s = math.cos(d(angle_deg)), math.sin(d(angle_deg))
    return [[c, -s, 0.0], [s, c, 0.0], [0.0, 0.0, 1.0]]


def clean(v, places=10):
    return [round(x, places) + 0.0 for x in v]


# Rigid transforms -----------------------------------------------------------------------------
def to_a(r, t, p_b):
    """A point: p_A = R_AB p_B + t_AB."""
    return [x + y for x, y in zip(matvec(r, p_b), t)]


def free_to_a(r, v_b):
    """A free vector: d_A = R_AB d_B."""
    return matvec(r, v_b)


def invert(r, t):
    rt = transpose(r)
    return rt, [-x for x in matvec(rt, t)]


def is_rotation(m, tol=1e-6):
    """Classifies a 3x3 matrix as a proper rotation, a reflection or neither (for example scaled)."""
    mtm = matmul(transpose(m), m)
    err = max(abs(mtm[i][j] - (1.0 if i == j else 0.0)) for i in range(3) for j in range(3))
    if err > tol:
        return 'not orthonormal', err
    return ('rotation' if det3(m) > 0 else 'reflection'), err


def planar(angle_deg, tx, ty):
    """A planar homogeneous transform (3x3)."""
    c, s = math.cos(d(angle_deg)), math.sin(d(angle_deg))
    return [[c, -s, tx], [s, c, ty], [0.0, 0.0, 1.0]]


# Planar two-link arm --------------------------------------------------------------------------
def fk(q1, q2, l1=L1, l2=L2, tool=(0.0, 0.0)):
    phi = d(q1 + q2)
    x = l1 * math.cos(d(q1)) + l2 * math.cos(phi)
    y = l1 * math.sin(d(q1)) + l2 * math.sin(phi)
    a, b = tool
    return x + a * math.cos(phi) - b * math.sin(phi), y + a * math.sin(phi) + b * math.cos(phi), q1 + q2


REACH_TOL = 1e-12


def reach(x, y, l1=L1, l2=L2):
    r = math.hypot(x, y)
    return r, abs(l1 - l2) - 1e-12 <= r <= l1 + l2 + 1e-12


def ik(x, y, l1=L1, l2=L2):
    """Both regular branches, in degrees; one solution at the reach boundary."""
    r2 = x * x + y * y
    if r2 == 0 and l1 == l2:
        raise ValueError('target at the base with equal links: q1 is arbitrary')
    c2 = (r2 - l1 * l1 - l2 * l2) / (2 * l1 * l2)
    if abs(c2) > 1 + REACH_TOL:
        raise ValueError(f'out of reach: cos(q2) = {c2:.4f}')
    if abs(abs(c2) - 1) <= REACH_TOL:
        c2 = math.copysign(1.0, c2)
    branches = [math.acos(c2)] if abs(c2) == 1 else [math.acos(c2), -math.acos(c2)]
    return [(deg(math.atan2(y, x) - math.atan2(l2 * math.sin(q2), l1 + l2 * math.cos(q2))), deg(q2)) for q2 in branches], c2


def wrap(angle_deg):
    return (angle_deg + 180.0) % 360.0 - 180.0


def verify(candidate, target, limits, tol):
    """Forward substitution, residual against a tolerance, and joint limits after wrapping."""
    q = [wrap(a) for a in candidate]
    x, y, _ = fk(*q)
    residual = math.hypot(x - target[0], y - target[1])
    within = all(lo <= a <= hi for a, (lo, hi) in zip(q, limits))
    return dict(wrapped=q, residual_m=residual, residual_ok=residual <= tol, within_limits=within, accepted=residual <= tol and within)


def jacobian(q1, q2, l1=L1, l2=L2):
    s1, c1, s12, c12 = math.sin(d(q1)), math.cos(d(q1)), math.sin(d(q1 + q2)), math.cos(d(q1 + q2))
    return [[-l1 * s1 - l2 * s12, -l2 * s12], [l1 * c1 + l2 * c12, l2 * c12]]


def det2(j):
    return j[0][0] * j[1][1] - j[0][1] * j[1][0]


# Physics and mathematics ----------------------------------------------------------------------
def coulomb(q1, q2, r):
    return K * abs(q1 * q2) / r ** 2


def point_field(q, r):
    return K * abs(q) / r ** 2


def gruebler(links, joints):
    """Planar mobility of a linkage with one-degree-of-freedom joints, ground counted as a link."""
    return 3 * (links - 1) - 2 * joints


# -----------------------------------------------------------------------------------------------
def experiments():
    res = dict(scope=SCOPE, physical_robot_demonstrated=False, proficiency_written=False)

    res['sss-rob-serial-dof'] = dict(pick_and_place=dict(angles=4, lengths=1, total=5), gantry=dict(angles=1, lengths=3, total=4),
                                     four_bar_mobility=gruebler(4, 4))

    rod = -5.0e10 * E
    res['p-charge'] = dict(rod_charge_nC=rod * 1e9, cloth_charge_nC=-rod * 1e9, total=rod + -rod,
                           charge_through_lamp_C=2.0 * 10, spheres_each_nC=(6 + -2) / 2)

    r90 = rot_z(90)
    res['sss-rob-frame-labels'] = dict(obstacle_in_map=clean([x + y for x, y in zip(matvec(r90, [2.0, 0.5, 0.0]), [5.0, 3.0, 0.0])][:2]),
                                       naive_sum=[7.0, 3.5])

    rel = [20, 30, -10]
    absolute = [sum(rel[:i + 1]) for i in range(3)]
    ab2 = [90, 45, 45]
    res['sss-rob-joint-conventions'] = dict(absolute=absolute, relative_of_90_45_45=[ab2[0]] + [ab2[i] - ab2[i - 1] for i in (1, 2)],
                                            link2_abs_rad_relative_reading=0.5 + 1.0, link2_abs_rad_absolute_reading=1.0)

    res['sss-rob-rotation-columns'] = dict(R_AB=[clean(r) for r in r90], v_A=clean(matvec(r90, [2, 0, 0])),
                                           R_180=[clean(r) for r in rot_z(180)], v_A_180=clean(matvec(rot_z(180), [1, 2, 3])),
                                           wrong_direction=clean(matvec(r90, [0, 2, 0])), right_direction=clean(matvec(transpose(r90), [0, 2, 0])))

    sols, c2 = ik(0.6, 0.2)
    res['sss-rob-task-coordinates'] = dict(target=[0.6, 0.2], branches_deg=[[round(a, 2), round(b, 2)] for a, b in sols],
                                           tool_angles_deg=[round(a + b, 1) for a, b in sols])

    t = [1.0, 2.0, 0.0]
    p0, p1 = to_a(r90, t, [0, 0, 0]), to_a(r90, t, [0.5, 0, 0])
    res['sss-rob-point-direction'] = dict(p_A=clean(p1), d_A=clean(free_to_a(r90, [0.5, 0, 0])), origin_A=clean(p0),
                                          difference=clean([b - a for a, b in zip(p0, p1)]), velocity_A=clean(free_to_a(r90, [0, 0.2, 0])),
                                          gravity_A=clean(free_to_a(r90, [0, 0, -1])))

    r2 = [[1, 0, 0], [0, 1, 0], [0, 0, -1]]
    r3 = [[1.01 if i == j else 0.0 for j in range(3)] for i in range(3)]
    rp = [[0.6, -0.8, 0], [0.8, 0.6, 0], [0, 0, 1]]
    res['sss-rob-rotation-check'] = dict(R1=is_rotation(r90)[0], R2=is_rotation(r2)[0], R2_det=det3(r2), R3=is_rotation(r3)[0],
                                         R3_error=round(is_rotation(r3, tol=1)[1], 4), practice=is_rotation(rp)[0], practice_det=det3(rp),
                                         practice_angle_deg=round(deg(math.atan2(0.8, 0.6)), 2))

    res['m-log'] = dict(log2_10=round(math.log(10) / math.log(2), 2), log10_200_over_2=round(math.log10(200) - math.log10(2), 6),
                        db_1000=10 * math.log10(1000), log3_81=round(math.log(81, 3), 6), e_squared=round(math.e ** 2, 3),
                        log2_plus_log8=round(math.log10(2) + math.log10(8), 3), log10_10=math.log10(10))

    res['sss-rob-planar-reach'] = dict(annulus=[abs(L1 - L2), L1 + L2],
                                       targets={str(p): [round(reach(*p)[0], 3), reach(*p)[1]] for p in [(0.6, 0.2), (0.1, 0.1), (0.7, 0.4), (0, -0.75), (0.2, 0.15)]})

    tab, tbc = planar(0, 0, 0.3), planar(90, 0.2, 0)
    tac, wrong = matmul(tab, tbc), matmul(tbc, tab)
    res['sss-rob-compose'] = dict(T_AC_translation=clean([tac[0][2], tac[1][2]]), point_x=clean(matvec(tac, [0.1, 0, 1])[:2]),
                                  point_y=clean(matvec(tac, [0, 0.1, 1])[:2]), reversed_translation=clean([wrong[0][2], wrong[1][2]]))

    rinv, tinv = invert(r90, t)
    wrong_back = [x + y for x, y in zip(matvec(rinv, p1), [-v for v in t])]
    rs, ts = invert(r3, [0, 0, 0])
    scaled_trip = matvec(rs, matvec(r3, [1, 0, 0]))[0]
    res['sss-rob-inverse'] = dict(t_BA=clean(tinv), round_trip=clean(to_a(rinv, tinv, p1)), wrong_round_trip=clean(wrong_back),
                                  pure_translation_inverse=clean(invert([[1, 0, 0], [0, 1, 0], [0, 0, 1]], [0.3, -0.1, 0.2])[1]),
                                  scaled_round_trip_error_pct=round((scaled_trip - 1) * 100, 2))

    res['sss-rob-planar-fk'] = dict(worked=[round(v, 4) for v in fk(60, -30)], straight=[round(v, 4) for v in fk(0, 0)[:2]],
                                    right_angle=[round(v, 4) for v in fk(0, 90)[:2]], practice=[round(v, 4) for v in fk(90, 90)])

    res['m-trigidentity'] = dict(sin75=round(math.sin(d(75)), 4), sum_formula=round(math.sin(d(45)) * math.cos(d(30)) + math.cos(d(45)) * math.sin(d(30)), 4),
                                 simplify_check=[round(math.sin(0.6) / (2 * math.cos(0.3)), 4), round(math.sin(0.3), 4)],
                                 practice_check=[round(math.cos(1) ** 2 - math.cos(2), 4), round(math.sin(1) ** 2, 4)],
                                 wrong_sum=[round(math.sin(d(60)), 3), round(2 * math.sin(d(30)), 3)])

    field = point_field(2e-6, 0.20)
    res['p-electricfield'] = dict(force_N=round(coulomb(2e-6, -3e-6, 0.10), 2), field_N_per_C=field, electron_force_N=E * field,
                                  midpoint_each=point_field(1e-6, 0.10), midpoint_net=point_field(1e-6, 0.10) - point_field(1e-6, 0.10))

    psols, _ = ik(0.5, 0.25)
    bsols, bc2 = ik(0.75, 0.0)
    res['sss-rob-planar-ik'] = dict(cos_q2=round(c2, 4), branches=[[round(a, 2), round(b, 2)] for a, b in sols],
                                    fk_check=[[round(v, 6) for v in fk(a, b)[:2]] for a, b in sols],
                                    practice=[[round(a, 2), round(b, 2)] for a, b in psols], boundary=[[round(a, 2), round(b, 2)] for a, b in bsols],
                                    boundary_cos=bc2, rounding_case=len(ik(0.75 * (1 + 1e-14), 0)[0]))

    flange = fk(60, -30)
    tip = fk(60, -30, tool=(0.08, 0.02))
    naive = (flange[0] + 0.08, flange[1] + 0.02)
    res['sss-rob-tool-offset'] = dict(tip=[round(v, 4) for v in tip[:2]], naive=[round(v, 4) for v in naive],
                                      error_m=round(math.hypot(naive[0] - tip[0], naive[1] - tip[1]), 4),
                                      at_zero=[round(v, 4) for v in fk(0, 0, tool=(0.08, 0.02))[:2]])

    res['p-potentialelectric'] = dict(battery_J=12 * 0.5, electron_J=5 * E, plates_V_per_m=10 / 0.002,
                                      practice_J=round(0.02 * 9, 4), practice_field=9 / 0.004)

    limits = [(-90, 90), (0, 150)]
    res['sss-rob-ik-verification'] = dict(branch_a=verify(sols[0], (0.6, 0.2), limits, 0.001), branch_b=verify(sols[1], (0.6, 0.2), limits, 0.001),
                                          rounded=verify((-3, 70), (0.6, 0.2), limits, 0.001),
                                          wound=verify((sols[0][0] + 360, sols[0][1]), (0.6, 0.2), limits, 0.001), wound_raw=round(sols[0][0] + 360, 2))

    res['m-transdiff'] = dict(decay_at_half=round(-6 * math.exp(-1), 3), degree_slope_30=round(math.pi / 180 * math.cos(d(30)), 5),
                              degree_factor=round(180 / math.pi, 1), wrong_slope_60=0.5, right_slope_60=round(0.5 * math.pi / 180, 5))

    j = jacobian(60, -30)
    col2 = (j[0][1], j[1][1])
    link2 = (math.cos(d(30)), math.sin(d(30)))
    res['sss-rob-position-jacobian'] = dict(J=[[round(v, 4) for v in r] for r in j], column2_dot_link2=round(col2[0] * link2[0] + col2[1] * link2[1], 12),
                                            column2_length=round(math.hypot(*col2), 4), column1_vs_tip=[round(-flange[1], 4), round(flange[0], 4)],
                                            practice=[[round(v, 4) + 0.0 for v in r] for r in jacobian(0, 90)])

    qd = (0.2, 0.5)
    v = matvec(j, qd)
    v2 = matvec(jacobian(0, 90), qd)
    vs = matvec(j, (0.4, 0))
    res['sss-rob-joint-to-tip-rate'] = dict(v=[round(x, 4) for x in v], v_other=[round(x, 4) for x in v2], shoulder_only=[round(x, 4) for x in vs],
                                            shoulder_speed=round(math.hypot(*vs), 4), tip_distance=round(math.hypot(flange[0], flange[1]), 4))

    js = jacobian(30, 0)
    res['sss-rob-planar-singularity'] = dict(det_at_minus30=round(det2(j), 4), det_formula=round(L1 * L2 * math.sin(d(-30)), 4),
                                             J_stretched=[[round(v, 4) for v in r] for r in js], det_stretched=round(det2(js), 12),
                                             column_ratio=round(js[0][0] / js[0][1], 6), radial_dot_col=round(js[0][1] * math.cos(d(30)) + js[1][1] * math.sin(d(30)), 12),
                                             det_at_90=round(L1 * L2 * math.sin(d(90)), 4))
    return res


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--output', default='lab-results')
    out = Path(parser.parse_args().output)
    out.mkdir(parents=True, exist_ok=True)
    (out / 'Lab-Results.json').write_text(json.dumps(experiments(), indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {out / "Lab-Results.json"}')


if __name__ == '__main__':
    main()
