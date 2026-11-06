"""Self-checks for Core Lessons, Learning Edition 09. Run from the package folder:

    python check_package.py

It checks the package against its own baseline/ evidence, recomputes every worked example, answer
and simulation with core2_lab.py, and writes Validation-Results.json and lab-results/. It fails at
the first check that does not hold.
"""
from pathlib import Path
import csv, hashlib, json, math, platform, re
import core2_lab as lab

ROOT = Path(__file__).resolve().parent
checks = []


def check(name, ok):
    checks.append(dict(name=name, passed=bool(ok)))
    if not ok:
        raise AssertionError(name)


def close(name, a, b, tol=1e-6):
    check(name, math.isclose(a, b, abs_tol=tol, rel_tol=tol))


def load(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))


def sha(name):
    return hashlib.sha256((ROOT / name).read_bytes()).hexdigest()


doc = load('Core-Lessons-09.json')
base = load('baseline/Confirmed-Working-Map.json')
spec = load('baseline/Robotics-Reviewed-Specification.json')
targets = load('baseline/Edition09-Targets.json')
meta, new = doc['metadata'], doc['lessons']
ns = {n['id']: n for n in spec['nodes']}
lesson = {r['id']: r for r in new}
byid = {n['id']: n for n in base['nodes']}
byplan = {n['planningId']: n for n in base['nodes'] if n.get('planningId')}
FIELDS = ['id', 'explanation', 'worked_example', 'practice', 'boundary_case', 'name', 'branch', 'planning_id', 'proposed_runtime_id', 'requires',
          'dependency_depth', 'node_contract_sha256', 'content_status', 'proficiency_write', 'instructional_scope', 'full_demonstration',
          'assessment_contract', 'practice_mode', 'why_it_matters', 'evidence_policy', 'required_future_work', 'references', 'details',
          'placement_note', 'assessment_rule', 'requires_physical_evidence', 'evidence_kind']
AUTHORED = ['explanation', 'worked_example', 'practice', 'boundary_case', 'practice_mode', 'required_future_work']
REAL_EVIDENCE_WORDS = re.compile(r'\b(physical|actual|deployed[-\s]?system|target[-\s]?device|hardware|supervised|on[-\s]robot)\b', re.I)

# The baseline -------------------------------------------------------------------------------
check('working map fingerprint', sha('baseline/Confirmed-Working-Map.json') == meta['confirmed_export_sha256'] == targets['source']['sha256'])
check('reviewed specification fingerprint', sha('baseline/Robotics-Reviewed-Specification.json') == meta['baseline_spec_sha256'])
check('baseline counts 1955 skills / 329 lessons', len(base['nodes']) == 1955 and sum('lesson' in n for n in base['nodes']) == 329 == meta['expected_prior_lessons'])
check('dataset and answer family are the merged atlas', base['metadata']['datasetKey'] == meta['dataset_key'] == 'robotics-atlas-merged'
      and base['metadata']['atlasFamily'] == 'sss-robotics-foundations-2026-09')

# The lessons --------------------------------------------------------------------------------
check('exactly 21 lessons, matching the targets', [r['id'] for r in new] == [t['planningId'] for t in targets['targets']] and len(new) == 21)
check('every lesson has the 27 fields in order', all(list(r) == FIELDS for r in new))
check('details equal explanation plus worked example', all(r['details'] == r['explanation'] + '\n\n' + r['worked_example'] for r in new))
check('all cards manual proficiency only', all(r['proficiency_write'] is False and 'proficiency' in r['assessment_contract']['answer_policy'].lower()
                                              and 'manual' in r['assessment_rule'].lower() for r in new) and meta['proficiency_write'] is False)
check('all introductory fields populated', all(all(str(r[k]).strip() for k in ['explanation', 'worked_example', 'why_it_matters', 'full_demonstration',
      'required_future_work', 'placement_note', 'assessment_rule', 'practice_mode', 'evidence_policy', 'instructional_scope'])
      and all(r[k][f].strip() for k in ['practice', 'boundary_case'] for f in ['question', 'answer']) for r in new))
check('evidence fields stated on every lesson (decision 14)', all(isinstance(r['requires_physical_evidence'], bool)
      and r['evidence_kind'] in ('physical', 'deployed-system', 'supervised-measurement', 'none') for r in new))
check('evidence field agrees with practice_mode', all(r['requires_physical_evidence'] == bool(REAL_EVIDENCE_WORDS.search(r['practice_mode']))
      and (r['evidence_kind'] == 'none') == (not r['requires_physical_evidence']) for r in new))
check('names ids prerequisites demonstrations and contracts exact', all(r['name'] == ns[r['id']]['name'] and r['requires'] == ns[r['id']]['requires']
      and r['proposed_runtime_id'] == ns[r['id']]['runtime_identity']['proposed_id'] and r['planning_id'] == r['id']
      and r['full_demonstration'] == ns[r['id']]['demonstration'] and r['assessment_contract'] == ns[r['id']]['assessment_contract']
      and r['branch'] == ns[r['id']]['branch'] and r['dependency_depth'] == ns[r['id']]['dependency_depth'] for r in new))
check('contract hashes exact', all(r['node_contract_sha256'] == hashlib.sha256(json.dumps({k: ns[r['id']][k] for k in ['id', 'name', 'requires', 'demonstration']},
      sort_keys=True).encode()).hexdigest() for r in new))
check('every lesson finds its map entry by planning id, with no lesson yet', all(r['id'] in byplan and 'lesson' not in byplan[r['id']] and byplan[r['id']]['name'] == r['name'] for r in new))
check('target extract agrees with the map', all(t['node'] == byid[t['runtimeId']] for t in targets['targets']))
check('the authored text uses ASCII only', all(all(str(r[k]).isascii() for k in AUTHORED) for r in new))

# The core in the map ------------------------------------------------------------------------
parents = {}
for e in base['edges']:
    if e['type'] == 'prerequisite':
        parents.setdefault(e['target'], []).append(e['source'])
def is_extension(n):
    return re.match(r'^rob3:X\d', n['id']) or n.get('subdomain') == 'Advanced pathways' or str(n.get('planningId', '')).startswith('R-X')
core = {n['id'] for n in base['nodes'] if n['domain'] == 'Robotics' and not is_extension(n)}
stack = list(core)
while stack:
    for p in parents.get(stack.pop(), []):
        if p not in core:
            core.add(p)
            stack.append(p)
missing = {i for i in core if 'lesson' not in byid[i]}
target_ids = {byplan[r['id']]['id'] for r in new}
check('the core has 351 skills; without a card are exactly the 21 targets and r-singular', len(core) == 351 and missing == target_ids | {'r-singular'})
old = {n['planningId'] for n in base['nodes'] if n.get('planningId') and 'lesson' in n}
check('every prerequisite of a target has a lesson or is an earlier target', all(set(r['requires']) <= old | set(lesson) for r in new))
sequence = list(csv.DictReader((ROOT / 'Study-Sequence.csv').open(encoding='utf-8')))
seen, valid = set(old), True
for row in sequence:
    valid &= set(ns[row['Planning ID']]['requires']) <= seen
    seen.add(row['Planning ID'])
check('study sequence follows dependencies', valid and [r['Planning ID'] for r in sequence] == [r['id'] for r in new])
check('result is 350 lessons', 329 + len(new) == 350 == meta['cumulative_unique_lessons'])


# The numbers: recomputed by the lab, and present in the text --------------------------------
def says(pid, field, *texts):
    value = lesson[pid][field]
    body = json.dumps(value) if isinstance(value, dict) else value
    check(f'{pid} {field} states {", ".join(texts)}', all(t in body for t in texts))


R = lab.experiments()
r = R['m-random']; check('random variable', r['pmf'] == [0.25, 0.5, 0.25] and r['cdf_at_1'] == 0.75 and r['die_at_least_5'] == 0.3333 and r['die_cdf_3'] == 0.5)
says('m-random', 'worked_example', '0.75')
r = R['p-wave']; check('wavelengths', r['air_mm'] == 8.6 and r['water_mm'] == 37.0 and r['radio_m'] == 0.125)
says('p-wave', 'worked_example', '8.6 mm', '37.0 mm')
r = R['m-sampling']; check('fleet bias', r['true_mean'] == 19.8 and r['overstatement'] == 1.2)
says('m-sampling', 'worked_example', '19.8 h', '1.2 h')
r = R['e-sampling']; check('aliases', r['alias_180_at_200'] == 20 and r['alias_60_at_200'] == 60 and r['alias_1200_at_1000'] == 200)
says('e-sampling', 'worked_example', '20 Hz')
r = R['m-complex']; check('complex arithmetic', r['product'] == [11, -2] and r['quotient'] == [-1, 2] and r['modulus'] == 5 and r['square'] == [3, 4] and r['sqrt_product'] == -6)
says('m-complex', 'worked_example', '11 - 2i', '-1 + 2i')
r = R['m-defintegral']; close('integral', r['exact'], 9); check('Riemann sums', r['left_3'] == 6 and r['left_6'] == 7.5 and r['left_3000'] == 8.997 and r['signed'] == 0 and r['distance'] == 1)
says('m-defintegral', 'worked_example', '6.0 m', '7.5 m', '8.997 m', '9 m')
r = R['m-regression']; check('regression', r['slope'] == 3.99 and r['intercept'] == -1.96 and r['residuals'] == [2.06, -1.03, -2.12, -0.91, 2.0] and r['r2'] == 0.916)
says('m-regression', 'worked_example', '3.99x - 1.96', '0.916', '2.06, -1.03, -2.12, -0.91 and 2.0')
r = R['m-antiderivative']; check('antiderivative', r['x_at_2'] == 9 and r['derivative_check'] == 10)
says('m-antiderivative', 'worked_example', '= 9 rad')
r = R['m-ftc']; check('fundamental theorem', r['exact'] == 10 and r['numeric'] == 10 and r['sin_0_pi'] == 2 and r['naive_wrong'] == -2)
says('m-ftc', 'worked_example', '= 10')
r = R['m-improper']; check('improper integrals', r['exp_decay'] == 0.5 and r['inv_square'] == 1.0 and r['inv_sqrt_numeric'] == 2.0 and r['inv_x_partial'] == [4.61, 9.21, 13.82])
says('m-improper', 'worked_example', '0.5', '4.61', '9.21', '13.82')
r = R['e-adc']; check('converter', r['codes'] == 1024 and r['lsb_mV'] == 4.88 and r['code_at_2v5'] == 512 and r['offset_mV'] == 14.6 and r['lsb_16_uV'] == 38.1 and r['ref_error_mV'] == 12.5)
says('e-adc', 'worked_example', '4.88 mV', '14.6 mV')
r = R['m-laplace']; check('Laplace', r['transform_at_s1'] == r['formula_at_s1'] == 0.333333 and r['ode_y_at_0_5'] == 1.1036)
says('m-laplace', 'worked_example', '0.3333', '1.1036')
r = R['e-calibration']; check('calibration', r['gain'] == 0.03252 and r['offset'] == -3.2 and r['residuals'] == [-0.052, 0.029, 0.046, 0.029, -0.052] and r['reading_600'] == 16.31)
says('e-calibration', 'worked_example', '0.03252 N/count * raw - 3.2 N', '-0.052, 0.029, 0.046, 0.029 and -0.052')
says('e-calibration', 'practice', '16.31 N')
r = R['C07']; check('first-order model', r['pole'] == -5 and r['tau'] == 0.2 and r['final'] == 2 and r['simulated_at_tau'] == r['predicted_at_tau'] == 1.264 and r['unstable_at_2s'] == 26.8)
says('C07', 'worked_example', '1.264')
says('C07', 'practice', '26.8')
r = R['e-imu']; check('IMU', r['heading_error_rad'] == 1.2 and r['heading_error_deg'] == 68.8 and r['tilt_y'] == 4.905 and r['tilt_z'] == 8.496 and r['practice_deg'] == 5)
says('e-imu', 'worked_example', '1.2 rad (68.8 deg)', '4.905', '8.496')
r = R['C08']; check('sampled loop', r['limit_T'] == 0.2 and r['factor_at_0_05'] == 0.5 and r['factor_at_0_25'] == -1.5 and r['stable_after_20'] < 1e-5
                    and round(r['unstable_after_20']) == 3325 and r['delay_ok_after_40'] < 1e-5 and round(r['delay_bad_after_40']) == 41 and r['no_delay_1_2_after_40'] < 1e-5
                    and r['delay_limit_T'] == 0.1 and math.isclose(r['noise_jitter'], 0.1))
says('C08', 'worked_example', '0.5', '-1.5', '3325', 'T = 0.2 s', 'T = 0.1 s')
says('C08', 'practice', 'about 41 times')
r = R['P07']; check('orientation', r['drift_100s'] == 1.0 and r['filter_error'] == r['filter_formula'] == 0.0049 and r['accel_tilt_deg'] == 11.5 and math.isclose(r['practice_drift'], 0.3))
says('P07', 'worked_example', '1.0 rad', '0.0049 rad', '11.5 deg')
r = R['A11']; check('actuator model', r['K'] == 20 and r['tau_fit'] == 0.05 and r['at_tau'] == 75.9 and r['predict_3V'] == 60 and r['test_error_pct'] == 5.0 and r['practice_K'] == 10)
says('A11', 'worked_example', '75.9 rad/s', '60 rad/s', '5.0%')
r = R['C09']; check('state feedback', r['ctrb_rank'] == 2 and r['obsv_rank'] == 2 and r['obsv_velocity_rank'] == 1 and r['closed_loop_poles'] == [[-2, 0], [-2, 0]]
                    and r['observer_poles'] == [[-4, 0], [-4, 0]] and r['perturbed_poles'] == [[-1.667, -0.745], [-1.667, 0.745]])
says('C09', 'worked_example', '-2, -2', '-4, -4')
says('C09', 'boundary_case', '-1.667 +/- 0.745i')
r = R['C06']; check('feedforward', r['fb_only_exact_error'] == 50 and r['fb_only_mismatch_error'] == 52.63 and r['ff_exact_error'] == 0 and r['ff_mismatch_error'] == 5.26 and r['ff_alone_mismatch'] == 90)
says('C06', 'worked_example', '50 rad/s', '5.26 rad/s', '52.63 rad/s')
r = R['N09']; check('trajectory error', r['ate'] == 0.3 and r['final_error'] == 0.4472 and r['drift_pct'] == 0.89 and r['practice_ate'] == 0.05)
says('N09', 'worked_example', '0.3 m', '0.4472 m', '0.89%')

check('lab expressly demonstrates no physical robot', R['physical_robot_demonstrated'] is False and R['proficiency_written'] is False and 'no physical robot' in R['scope'])

(ROOT / 'lab-results').mkdir(exist_ok=True)
(ROOT / 'lab-results' / 'Lab-Results.json').write_text(json.dumps(R, indent=2) + '\n', encoding='utf-8')
report = dict(status='passed', checks_passed=len(checks), checks=checks, python=platform.python_version(),
              unverified=['Independent expert review of the lesson text', 'Real sensor, motor and dataset measurements for e-calibration, e-imu, A11 and N09', 'Learner proficiency'])
(ROOT / 'Validation-Results.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f'{len(checks)} checks passed under Python {platform.python_version()}.')
