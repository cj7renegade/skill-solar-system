"""Self-checks for Robotics Completions, Learning Edition 07. Run from the package folder:

    python check_package.py

It checks the package against its own baseline/ evidence, recomputes every worked example and
answer with completions_lab.py, and writes Validation-Results.json and lab-results/. It fails at the
first check that does not hold.
"""
from pathlib import Path
import csv, hashlib, json, math, platform, re
import completions_lab as lab

ROOT = Path(__file__).resolve().parent
checks = []


def check(name, ok):
    checks.append(dict(name=name, passed=bool(ok)))
    if not ok:
        raise AssertionError(name)


def close(name, a, b, tol=1e-6):
    check(name, math.isclose(a, b, abs_tol=tol, rel_tol=tol))


def reject(name, fn):
    try:
        fn()
    except (ValueError, TypeError):
        check(name, True)
    else:
        check(name, False)


def load(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))


def sha(name):
    return hashlib.sha256((ROOT / name).read_bytes()).hexdigest()


doc = load('Robotics-Completions-Lessons-07.json')
base = load('baseline/Confirmed-Structure-Map.json')
spec = load('baseline/Robotics-Reviewed-Specification.json')
approved = load('baseline/Approved-New-Skills.json')
targets = load('baseline/Edition07-Targets.json')
meta, new = doc['metadata'], doc['lessons']
ns = {n['id']: n for n in spec['nodes']} | {s['planningId']: s['specification'] for s in approved['skills']}
lesson = {r['id']: r for r in new}
expected = ['m-inverse', 'm-invtrig', 'p-work', 'K05', 'K06', 'K07', 'P11', 'A12']
# Edition 06's 25 fields in its order, then decision 14's two.
FIELDS = ['id', 'explanation', 'worked_example', 'practice', 'boundary_case', 'name', 'branch', 'planning_id', 'proposed_runtime_id', 'requires',
          'dependency_depth', 'node_contract_sha256', 'content_status', 'proficiency_write', 'instructional_scope', 'full_demonstration',
          'assessment_contract', 'practice_mode', 'why_it_matters', 'evidence_policy', 'required_future_work', 'references', 'details',
          'placement_note', 'assessment_rule', 'requires_physical_evidence', 'evidence_kind']
# The card's fallback wording test (src/lesson.js NEEDS_REAL_EVIDENCE), so the field and the words agree.
REAL_EVIDENCE_WORDS = re.compile(r'\b(physical|actual|deployed[-\s]?system|target[-\s]?device|hardware|supervised|on[-\s]robot)\b', re.I)

# The baseline -------------------------------------------------------------------------------
check('structure map fingerprint', sha('baseline/Confirmed-Structure-Map.json') == meta['confirmed_export_sha256'] == targets['source']['sha256'])
check('reviewed specification fingerprint', sha('baseline/Robotics-Reviewed-Specification.json') == meta['baseline_spec_sha256'])
check('approved new skills fingerprint', sha('baseline/Approved-New-Skills.json') == meta['specification_extension_sha256'] and approved['status'] == 'APPROVED')
planned = [n for n in base['nodes'] if n.get('planningId')]
check('baseline counts 1920 skills / 383 planned / 298 lessons / 84 pending / 1 roadmap',
      len(base['nodes']) == 1920 and len(planned) == 383 and sum('lesson' in n for n in base['nodes']) == 298
      and sum(n.get('contentStatus') == 'introductory lesson pending' for n in planned) == 84
      and sum(n.get('contentStatus') == 'roadmap note, not assessed' for n in planned) == 1)
check('dataset and answer family are the merged atlas', base['metadata']['datasetKey'] == meta['dataset_key'] == 'robotics-atlas-merged'
      and base['metadata']['atlasFamily'] == 'sss-robotics-foundations-2026-09')

# The lessons --------------------------------------------------------------------------------
check('exact eight targets in dependency order', [r['id'] for r in new] == expected == [t['planningId'] for t in targets['targets']])
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
      and r['proposed_runtime_id'] == ns[r['id']]['runtime_identity']['proposed_id'] and r['full_demonstration'] == ns[r['id']]['demonstration']
      and r['assessment_contract'] == ns[r['id']]['assessment_contract'] and r['branch'] == ns[r['id']]['branch']
      and r['dependency_depth'] == ns[r['id']]['dependency_depth'] for r in new))
check('contract hashes exact', all(r['node_contract_sha256'] == hashlib.sha256(json.dumps({k: ns[r['id']][k] for k in ['id', 'name', 'requires', 'demonstration']},
      sort_keys=True).encode()).hexdigest() == next(t['nodeContractSha256'] for t in targets['targets'] if t['planningId'] == r['id']) for r in new))
check('target extract agrees with the map', all(t['node'] == next(n for n in base['nodes'] if n['id'] == t['runtimeId']) and 'lesson' not in t['node'] for t in targets['targets']))
check('the lesson text uses ASCII only, as the earlier editions do', all(str(r).isascii() for r in new))

# The I05 chain in the map -------------------------------------------------------------------
parents = {}
for e in base['edges']:
    if e['type'] == 'prerequisite':
        parents.setdefault(e['target'], []).append(e['source'])
chain, stack = set(), ['rob3:I05']
while stack:
    for p in parents.get(stack.pop(), []):
        if p not in chain:
            chain.add(p)
            stack.append(p)
byid = {n['id']: n for n in base['nodes']}
planned_chain = {byid[i]['planningId'] for i in chain if byid[i].get('planningId')} | {'I05'}
old = {n['planningId'] for n in planned if n.get('lesson')}
check('I05 chain has 305 planned entries; the missing ones are the seven required targets', len(planned_chain) == 305
      and planned_chain - old == set(expected) - {'A12'})
check('A12 is optional: outside the I05 chain', 'rob3:A12' not in chain)
check('result is 306 authored / 76 pending / 1 roadmap', len(old | set(expected)) == 306 == meta['cumulative_unique_lessons']
      and 383 - 1 - len(old | set(expected)) == 76 == meta['pending_assessable_after_import'])
check('every specification prerequisite of a target has a lesson', all(set(r['requires']) <= old | set(expected) for r in new))
sequence = list(csv.DictReader((ROOT / 'Study-Sequence.csv').open(encoding='utf-8')))
seen, valid = set(old), True
for row in sequence:
    valid &= set(ns[row['Planning ID']]['requires']) <= seen
    seen.add(row['Planning ID'])
check('study sequence follows dependencies', valid and [r['Planning ID'] for r in sequence] == expected)


# The numbers: recomputed by the lab, and present in the text --------------------------------
def says(pid, field, *texts):
    value = lesson[pid][field]
    body = json.dumps(value) if isinstance(value, dict) else value
    check(f'{pid} {field} states {", ".join(texts)}', all(t in body for t in texts))


results = lab.experiments()
d = math.radians
r = results['m-inverse']
close('m-inverse worked inverse', r['worked_f_inverse_of_11'], 4)
close('m-inverse practice inverse', r['practice_inverse_of_2'], 13)
says('m-inverse', 'practice', '4y + 5', 'f(13) = 2')
reject('m-inverse constant function rejected', lambda: lab.inverse_linear(0, 1))
reject('m-inverse square root of a negative rejected', lambda: lab.inverse_square(-1, 'nonnegative'))
reject('m-inverse unstated branch rejected', lambda: lab.inverse_square(9, 'either'))

r = results['m-invtrig']
close('m-invtrig worked arctan quadrant error', r['worked_arctan_ratio'], -45)
close('m-invtrig worked atan2', r['worked_atan2'], 135)
close('m-invtrig practice atan2', r['practice_atan2'], -120)
close('m-invtrig practice wrong quadrant', r['practice_arctan_ratio'], 60)
says('m-invtrig', 'worked_example', '135 deg', '4.243')
reject('m-invtrig zero vector rejected', lambda: lab.direction_deg(0, 0))

r = results['p-work']
close('p-work worked work', round(r['worked_work'], 1), 52.0)
close('p-work friction', r['practice_friction_work'], -200)
close('p-work holding', r['boundary_holding_work'], 0)
says('p-work', 'worked_example', '17.32', '52.0 J')
reject('p-work mismatched dimensions rejected', lambda: lab.work((1, 2), (1,)))

r = results['K05']
close('K05 wrist x', round(r['worked_wrist'][0], 4), 0.4241)
close('K05 wrist y', round(r['worked_wrist'][1], 4), 0.4898)
close('K05 tool x', round(r['worked_tool'][0], 4), 0.4499)
close('K05 tool y', round(r['worked_tool'][1], 4), 0.5864)
close('K05 zero configuration', r['check_zero'][0], 0.8)
close('K05 straight up', r['check_straight_up'][1], 0.8)
close('K05 practice tool x', r['practice_tool'][0], 0.4)
close('K05 practice tool y', r['practice_tool'][1], 0.4)
says('K05', 'worked_example', '0.4241', '0.4898', '0.4499', '0.5864', '(0.8, 0)')
reject('K05 zero link length rejected', lambda: lab.planar_fk(0, 0.3, 0, 0))

r = results['K06']
close('K06 cos q2', r['worked_cos_q2'], 0.375)
check('K06 two branches with stated angles', [[round(a, 2), round(b, 2)] for a, b in r['worked_solutions_deg']] == [[2.48, 67.98], [59.45, -67.98]])
check('K06 both branches verify by forward kinematics', all(math.isclose(x, 0.5, abs_tol=1e-12) and math.isclose(y, 0.3, abs_tol=1e-12) for x, y in r['worked_fk_check']))
check('K06 both branches within the stated limits', all(r['worked_within_limits']))
check('K06 practice solutions', [[round(a, 2), round(b, 2)] for a, b in r['practice_solutions_deg']] == [[53.13, 90.0], [126.87, -90.0]])
check('K06 reach boundary gives one solution', r['reach_boundary_solutions'] == 1 and len(lab.planar_ik(0.4, 0.3, 0.1, 0)) == 1)
close('K06 out-of-reach cosine', round(r['boundary_cos_q2'], 3), 1.302)
says('K06', 'worked_example', '0.375', '2.48 deg', '59.45 deg', '67.98 deg')
says('K06', 'boundary_case', '1.302')
reject('K06 out of reach rejected, not clipped', lambda: lab.planar_ik(0.4, 0.3, 0.75, 0))
reject('K06 equal links at the base rejected as undetermined', lambda: lab.planar_ik(0.3, 0.3, 0, 0))

r = results['K07']
j = r['worked_jacobian']
check('K07 Jacobian entries', [round(v, 4) for v in j[0] + j[1]] == [-0.4898, -0.2898, 0.4241, 0.0776])
check('K07 Jacobian velocity', [round(v, 4) for v in r['worked_velocity']] == [-0.1869, 0.1965])
check('K07 central difference agrees to 1e-9', all(abs(a - b) < 1e-9 for a, b in zip(r['worked_velocity'], r['worked_central_difference'])))
close('K07 determinant', round(r['worked_determinant'], 4), 0.0849)
check('K07 stretched-out pose is singular with a zero x row', r['practice_determinant'] == 0 and r['practice_jacobian'][0] == [0, 0])
check('K07 large step is about 12% off', 0.10 < abs(r['boundary_large_step'][0] - r['worked_velocity'][0]) / abs(r['worked_velocity'][0]) < 0.13)
check('K07 small step within 1e-5', all(abs(a - b) < 1e-5 for a, b in zip(r['boundary_small_step'], r['worked_velocity'])))
says('K07', 'worked_example', '-0.4898', '0.0776', '(-0.1869, 0.1965)', '0.0849')
says('K07', 'boundary_case', '(-0.2089, 0.1757)', '(-0.18694, 0.19649)')

r = results['P11']
close('P11 1-D 5% gate', round(r['gate_1d_5pct'], 2), 3.84)
close('P11 2-D 5% gate', round(r['gate_2d_5pct'], 2), 5.99)
check('P11 worked NIS', [round(v, 2) for v in r['worked_nis']] == [1.8, 7.2] and r['worked_nis'][0] < r['gate_1d_5pct'] < r['worked_nis'][1])
close('P11 practice NIS', r['practice_nis'], 3.25)
check('P11 both injected outliers rejected', {50, 120} <= set(r['sequence_rejected_steps']))
check('P11 synthetic run rejects 2 outliers and 9 good measurements (5.5%)', len(r['sequence_rejected_steps']) == 11 and r['sequence_rejection_rate'] == 0.055)
check('P11 mistuned run: about 30% rejected', 0.29 < r['mistuned_rejection_rate'] < 0.32)
close('P11 mistuned mean NIS', round(r['mistuned_mean_nis'], 1), 3.9)
says('P11', 'explanation', '3.84', '5.99')
says('P11', 'worked_example', 'NIS = 0.09/0.05 = 1.8', 'NIS = 0.36/0.05 = 7.2', '5.5%')
says('P11', 'boundary_case', '30%', '3.9')
reject('P11 unsupported dimension rejected', lambda: lab.chi_square_gate(3, 0.05))
reject('P11 false-alarm rate outside (0, 1) rejected', lambda: lab.chi_square_gate(1, 1.5))
reject('P11 nonpositive covariance rejected', lambda: lab.nis([0.1], [0]))

r = results['A12']
check('A12 worked: both causes, 0.6 deg band, 0.15 deg periodic', r['worked']['causes'] == ['backlash', 'misalignment']
      and math.isclose(r['worked']['dead_band_deg'], 0.6) and math.isclose(r['worked']['periodic_amplitude_deg'], 0.15) and r['worked']['dead_band_spread_deg'] < 1e-12)
check('A12 practice: misalignment only', r['practice']['causes'] == ['misalignment'] and math.isclose(r['practice']['periodic_amplitude_deg'], 0.2))
check('A12 backlash alone is not called misalignment', r['backlash_only']['causes'] == ['backlash'])
says('A12', 'worked_example', '0.6 deg', '0.15 deg', '24 angles')

check('lab expressly demonstrates no physical robot', results['physical_robot_demonstrated'] is False and results['proficiency_written'] is False
      and 'no physical robot' in results['scope'])

(ROOT / 'lab-results').mkdir(exist_ok=True)
(ROOT / 'lab-results' / 'Lab-Results.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')
report = dict(status='passed', checks_passed=len(checks), checks=checks, python=platform.python_version(),
              unverified=['Independent expert review of the lesson text', 'Measured traces from a real joint for A12, and logged runs from a real estimator for P11',
                          'Any physical I05 milestone and learner proficiency'])
(ROOT / 'Validation-Results.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f'{len(checks)} checks passed under Python {platform.python_version()}.')
