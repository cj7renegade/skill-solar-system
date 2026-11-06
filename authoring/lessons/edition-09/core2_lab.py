"""Synthetic exercises for Core Lessons, Learning Edition 09 (the core outside the I05 path).

Standard library only. Every worked example and practice answer in the 21 lessons is recomputed
here, including the small simulations the runnable-code entries describe. Nothing here talks to
hardware, writes a proficiency answer or demonstrates a robot.

    python core2_lab.py --output lab-results
"""
import argparse, cmath, json, math, random
from pathlib import Path

SCOPE = 'Synthetic calculations and simulations only; no physical robot, sensor or circuit is measured, and no proficiency is written.'


def fit_line(xs, ys):
    """Ordinary least squares y = a*x + b, with residuals and R^2."""
    n = len(xs); mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs); sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    a = sxy / sxx; b = my - a * mx
    res = [y - (a * x + b) for x, y in zip(xs, ys)]
    r2 = 1 - sum(r * r for r in res) / sum((y - my) ** 2 for y in ys)
    return a, b, res, r2


def riemann_left(f, a, b, n):
    h = (b - a) / n
    return sum(f(a + i * h) for i in range(n)) * h


def midpoint(f, a, b, n=20000):
    h = (b - a) / n
    return sum(f(a + (i + 0.5) * h) for i in range(n)) * h


def alias(f, fs):
    """Apparent frequency of a sampled sinusoid, folded into [0, fs/2]."""
    r = f % fs
    return min(r, fs - r)


def euler_first_order(a, b, u, t_end, dt=1e-4):
    """x' = -a*x + b*u from x = 0."""
    x, t = 0.0, 0.0
    while t < t_end - 1e-12:
        x += dt * (-a * x + b * u); t += dt
    return x


def p_loop(kt, steps, delay=False):
    """Integrator plant under proportional control, sampled: x+ = x - K*T*x (or x_{k-1} with a one-step delay)."""
    xs = [1.0, 1.0]
    for _ in range(steps):
        xs.append(xs[-1] - kt * (xs[-2] if delay else xs[-1]))
    return xs


def complementary(bias, dt, alpha, steps):
    """Roll held at 0; the gyro reads only its bias and the accelerometer reads the true 0."""
    e = 0.0
    for _ in range(steps):
        e = alpha * (e + bias * dt)
    return e


def char_poly2(a):
    """s^2 - tr(A) s + det(A) for a 2x2 matrix."""
    return [1.0, -(a[0][0] + a[1][1]), a[0][0] * a[1][1] - a[0][1] * a[1][0]]


def roots2(p):
    _, b, c = p
    disc = cmath.sqrt(b * b - 4 * c)
    return sorted([(-b + disc) / 2, (-b - disc) / 2], key=lambda z: (z.real, z.imag))


def rank2(m, tol=1e-12):
    det = m[0][0] * m[1][1] - m[0][1] * m[1][0]
    if abs(det) > tol:
        return 2
    return 1 if any(abs(v) > tol for row in m for v in row) else 0


def experiments():
    R = dict(scope=SCOPE, physical_robot_demonstrated=False, proficiency_written=False)

    R['m-random'] = dict(pmf=[0.25, 0.5, 0.25], cdf_at_1=0.75, die_at_least_5=round(2 / 6, 4), die_cdf_3=0.5)

    R['p-wave'] = dict(air_mm=round(343 / 40000 * 1000, 1), water_mm=round(1480 / 40000 * 1000, 1), radio_m=3e8 / 2.4e9)

    true_mean = (160 * 21.0 + 40 * 15.0) / 200
    R['m-sampling'] = dict(true_mean=true_mean, sample_mean=21.0, overstatement=round(21.0 - true_mean, 2))

    R['e-sampling'] = dict(alias_180_at_200=alias(180, 200), alias_60_at_200=alias(60, 200), alias_1200_at_1000=alias(1200, 1000))

    z1, z2 = complex(3, 4), complex(1, -2)
    R['m-complex'] = dict(product=[(z1 * z2).real, (z1 * z2).imag], quotient=[round((z1 / z2).real, 10), round((z1 / z2).imag, 10)], modulus=abs(z1),
                          square=[(complex(2, 1) ** 2).real, (complex(2, 1) ** 2).imag], sqrt_product=(cmath.sqrt(-4) * cmath.sqrt(-9)).real)

    v = lambda t: 2 * t
    R['m-defintegral'] = dict(exact=midpoint(v, 0, 3), left_3=riemann_left(v, 0, 3, 3), left_6=riemann_left(v, 0, 3, 6), left_3000=round(riemann_left(v, 0, 3, 3000), 3),
                              signed=round(midpoint(lambda x: x - 1, 0, 2), 9), distance=round(midpoint(lambda x: abs(x - 1), 0, 2), 6))

    a, b, res, r2 = fit_line([0, 1, 2, 3, 4], [0.1, 1.0, 3.9, 9.1, 16.0])
    R['m-regression'] = dict(slope=round(a, 2), intercept=round(b, 2), residuals=[round(r, 2) for r in res], r2=round(r2, 3))

    x = lambda t: t ** 3 - 2 * t + 5
    R['m-antiderivative'] = dict(x_at_2=x(2), derivative_check=round((x(2 + 1e-6) - x(2 - 1e-6)) / 2e-6, 6), cos_check=round(0.5 * math.sin(2 * 0.7) + 1, 6))

    R['m-ftc'] = dict(exact=(9 + 3) - (1 + 1), numeric=round(midpoint(lambda s: 2 * s + 1, 1, 3), 6), sin_0_pi=round(midpoint(math.sin, 0, math.pi), 6),
                      naive_wrong=(-1 / 1) - (-1 / -1))

    R['m-improper'] = dict(exp_decay=round(midpoint(lambda t: math.exp(-2 * t), 0, 40, 200000), 6), inv_square=round(midpoint(lambda s: 1 / s ** 2, 1, 1e4, 2000000), 3),
                           inv_sqrt=2.0, inv_sqrt_numeric=round(midpoint(lambda s: 1 / math.sqrt(s), 1e-10, 1, 400000), 2),
                           inv_x_partial=[round(math.log(10 ** k), 2) for k in (2, 4, 6)])

    R['e-adc'] = dict(codes=2 ** 10, lsb_mV=round(5.0 / 1024 * 1000, 2), code_at_2v5=round(2.5 / (5.0 / 1024)), offset_mV=round(3 * 5.0 / 1024 * 1000, 1),
                      lsb_16_uV=round(2.5 / 65536 * 1e6, 1), ref_error_mV=0.005 * 2.5 * 1000)

    lap = midpoint(lambda t: math.exp(-2 * t) * math.exp(-1 * t), 0, 40, 200000)
    R['m-laplace'] = dict(transform_at_s1=round(lap, 6), formula_at_s1=round(1 / (1 + 2), 6), ode_y_at_0_5=round(3 * math.exp(-1), 4))

    raw, ref = [100, 405, 712, 1020, 1330], [0, 10, 20, 30, 40]
    g, o, cres, cr2 = fit_line(raw, ref)
    R['e-calibration'] = dict(gain=round(g, 5), offset=round(o, 3), residuals=[round(r, 3) for r in cres], max_residual=round(max(abs(r) for r in cres), 3),
                              reading_600=round(g * 600 + o, 2))

    tau_check = euler_first_order(5, 10, 1, 0.2)
    unstable = euler_first_order(-2, 1, 1, 2.0)
    R['C07'] = dict(pole=-5, tau=0.2, final=10 / 5, simulated_at_tau=round(tau_check, 3), predicted_at_tau=round(2 * (1 - math.exp(-1)), 3),
                    unstable_pole=2, unstable_at_2s=round(unstable, 1))

    R['e-imu'] = dict(heading_error_rad=0.02 * 60, heading_error_deg=round(math.degrees(0.02 * 60), 1), tilt_y=round(9.81 * math.sin(math.radians(30)), 3),
                      tilt_z=round(9.81 * math.cos(math.radians(30)), 3), practice_deg=0.5 * 10)

    stable, unstab = p_loop(0.5, 20), p_loop(2.5, 20)
    d_ok, d_bad = p_loop(0.5, 40, delay=True), p_loop(1.2, 40, delay=True)
    nd_12 = p_loop(1.2, 40)
    R['C08'] = dict(limit_T=2 / 10, factor_at_0_05=1 - 0.5, factor_at_0_25=1 - 2.5, stable_after_20=round(abs(stable[-1]), 6), unstable_after_20=round(abs(unstab[-1]), 1),
                    delay_ok_after_40=round(abs(d_ok[-1]), 6), delay_bad_after_40=round(abs(d_bad[-1]), 1), no_delay_1_2_after_40=round(abs(nd_12[-1]), 6),
                    delay_limit_T=1 / 10, noise_jitter=10 * 0.01)

    R['P07'] = dict(drift_100s=0.01 * 100, filter_error=round(complementary(0.01, 0.01, 0.98, 20000), 4), filter_formula=round(0.98 * 0.01 * 0.01 / 0.02, 4),
                    accel_tilt_deg=round(math.degrees(math.atan(2 / 9.81)), 1), practice_drift=0.005 * 60)

    ts = [0.01 * k for k in range(1, 40)]
    w = [120 * (1 - math.exp(-t / 0.05)) for t in ts]
    slope, _, _, _ = fit_line(ts, [math.log(1 - wi / 120) for wi in w])
    R['A11'] = dict(K=120 / 6, tau_fit=round(-1 / slope, 4), at_tau=round(120 * (1 - math.exp(-1)), 1), predict_3V=20 * 3, test_error_pct=round((60 - 57) / 60 * 100, 1),
                    practice_K=90 / 9)

    A, B, C = [[0, 1], [0, 0]], [0, 1], [1, 0]
    ctrb = [[B[0], A[0][0] * B[0] + A[0][1] * B[1]], [B[1], A[1][0] * B[0] + A[1][1] * B[1]]]
    obsv = [C, [C[0] * A[0][0] + C[1] * A[1][0], C[0] * A[0][1] + C[1] * A[1][1]]]
    obsv_v = [[0, 1], [0 * A[0][0] + 1 * A[1][0], 0 * A[0][1] + 1 * A[1][1]]]
    acl = [[0, 1], [-4, -4]]
    aobs = [[-8, 1], [-16, 0]]
    pert = [[0, 1], [-4 / 1.2, -4 / 1.2]]
    R['C09'] = dict(ctrb_rank=rank2(ctrb), obsv_rank=rank2(obsv), obsv_velocity_rank=rank2(obsv_v),
                    closed_loop_poles=[[round(z.real, 6), round(z.imag, 6)] for z in roots2(char_poly2(acl))],
                    observer_poles=[[round(z.real, 6), round(z.imag, 6)] for z in roots2(char_poly2(aobs))],
                    perturbed_poles=[[round(z.real, 3), round(z.imag, 3)] for z in roots2(char_poly2(pert))])

    def steady(k_true, v_ff, kp, r):
        return (k_true * v_ff + k_true * kp * r) / (1 + k_true * kp)
    R['C06'] = dict(fb_only_exact_error=round(100 - steady(20, 0, 0.05, 100), 2), fb_only_mismatch_error=round(100 - steady(18, 0, 0.05, 100), 2),
                    ff_exact_error=round(100 - steady(20, 5, 0.05, 100), 6), ff_mismatch_error=round(100 - steady(18, 5, 0.05, 100), 2),
                    ff_alone_mismatch=18 * 5)

    err = [(0.1, 0), (0.2, 0.1), (0.3, -0.1), (0.4, 0.2)]
    ate = math.sqrt(sum(x * x + y * y for x, y in err) / len(err))
    R['N09'] = dict(ate=round(ate, 4), final_error=round(math.hypot(*err[-1]), 4), drift_pct=round(math.hypot(*err[-1]) / 50 * 100, 2), practice_ate=0.05)
    return R


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--output', default='lab-results')
    out = Path(parser.parse_args().output)
    out.mkdir(parents=True, exist_ok=True)
    (out / 'Lab-Results.json').write_text(json.dumps(experiments(), indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {out / "Lab-Results.json"}')


if __name__ == '__main__':
    main()
