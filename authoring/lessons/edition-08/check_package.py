"""Self-checks for Core Lessons, Learning Edition 08. Run from the package folder:

    python check_package.py

It checks the package against its own baseline/ evidence, recomputes every worked example and
answer with core_lab.py, and writes Validation-Results.json and lab-results/. It fails at the first
check that does not hold.
"""
from pathlib import Path
import csv, hashlib, json, math, platform, re
import core_lab as lab

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


doc = load('Core-Lessons-08.json')
base = load('baseline/Confirmed-Working-Map.json')
master = load('baseline/Master-Specifications.json')
targets = load('baseline/Edition08-Targets.json')
meta, new = doc['metadata'], doc['lessons']
ns = {e['id']: e for e in master['entries']}
lesson = {r['id']: r for r in new}
byid = {n['id']: n for n in base['nodes']}
FIELDS = ['id', 'explanation', 'worked_example', 'practice', 'boundary_case', 'name', 'branch', 'planning_id', 'proposed_runtime_id', 'requires',
          'dependency_depth', 'node_contract_sha256', 'content_status', 'proficiency_write', 'instructional_scope', 'full_demonstration',
          'assessment_contract', 'practice_mode', 'why_it_matters', 'evidence_policy', 'required_future_work', 'references', 'details',
          'placement_note', 'assessment_rule', 'requires_physical_evidence', 'evidence_kind']
AUTHORED = ['explanation', 'worked_example', 'practice', 'boundary_case', 'practice_mode', 'required_future_work']
# The card's fallback wording test (src/lesson.js NEEDS_REAL_EVIDENCE), so the field and the words agree.
REAL_EVIDENCE_WORDS = re.compile(r'\b(physical|actual|deployed[-\s]?system|target[-\s]?device|hardware|supervised|on[-\s]robot)\b', re.I)

# The baseline -------------------------------------------------------------------------------
check('working map fingerprint', sha('baseline/Confirmed-Working-Map.json') == meta['confirmed_export_sha256'] == targets['source']['sha256'] == master['baseMap']['sha256'])
check('approved master specifications fingerprint', sha('baseline/Master-Specifications.json') == meta['master_specifications_sha256'] and master['status'] == 'APPROVED')
check('baseline counts 1955 skills / 306 lessons', len(base['nodes']) == 1955 and sum('lesson' in n for n in base['nodes']) == 306 == meta['expected_prior_lessons'])
check('dataset and answer family are the merged atlas', base['metadata']['datasetKey'] == meta['dataset_key'] == 'robotics-atlas-merged'
      and base['metadata']['atlasFamily'] == 'sss-robotics-foundations-2026-09')

# The lessons --------------------------------------------------------------------------------
check('exactly the 23 approved skills, one lesson each', [r['id'] for r in new] == [t['id'] for t in targets['targets']] and set(lesson) == set(ns) and len(new) == 23)
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
check('names ids prerequisites demonstrations and contracts exact', all(r['name'] == ns[r['id']]['name'] == byid[r['id']]['name']
      and r['requires'] == ns[r['id']]['requires'] and r['proposed_runtime_id'] == r['id'] == r['planning_id'] == ns[r['id']]['runtime_identity']['proposed_id']
      and r['full_demonstration'] == ns[r['id']]['demonstration'] and r['assessment_contract'] == ns[r['id']]['assessment_contract']
      and r['branch'] == ns[r['id']]['branch'] and r['dependency_depth'] == ns[r['id']]['dependency_depth'] for r in new))
check('every entry is a master skill with no planning id in the map', all(ns[i]['runtime_identity'].get('master_skill') is True and 'planningId' not in byid[i] for i in ns))
check('contract hashes exact', all(r['node_contract_sha256'] == hashlib.sha256(json.dumps({k: ns[r['id']][k] for k in ['id', 'name', 'requires', 'demonstration']},
      sort_keys=True).encode()).hexdigest() for r in new))
parents = {}
for e in base['edges']:
    if e['type'] == 'prerequisite':
        parents.setdefault(e['target'], []).append(e['source'])
check('requires is the map\'s own prerequisite list', all(sorted(r['requires']) == sorted(parents.get(r['id'], [])) for r in new))
check('target extract agrees with the map, and no target has a lesson yet', all(t['node'] == byid[t['id']] and 'lesson' not in t['node'] for t in targets['targets']))
check('the authored text uses ASCII only', all(all(str(r[k]).isascii() for k in AUTHORED) for r in new))

# The I05 chain in the map, master-only skills included -----------------------------------------
chain, stack = {'rob3:I05'}, ['rob3:I05']
while stack:
    for p in parents.get(stack.pop(), []):
        if p not in chain:
            chain.add(p)
            stack.append(p)
missing = {i for i in chain if 'lesson' not in byid[i]}
check('I05 chain has 328 skills; the ones without a card are exactly the 23 targets', len(chain) == 328 and missing == set(ns))
old = {n['id'] for n in base['nodes'] if 'lesson' in n}
check('every prerequisite of a target has a lesson or is an earlier target', all(set(r['requires']) <= old | set(ns) for r in new))
sequence = list(csv.DictReader((ROOT / 'Study-Sequence.csv').open(encoding='utf-8')))
seen, valid = set(old), True
for row in sequence:
    valid &= set(ns[row['Skill']]['requires']) <= seen
    seen.add(row['Skill'])
check('study sequence follows dependencies', valid and [r['Skill'] for r in sequence] == [r['id'] for r in new])
check('result is 329 lessons', len(old | set(ns)) == 329 == meta['cumulative_unique_lessons'])


# The numbers: recomputed by the lab, and present in the text --------------------------------
def says(pid, field, *texts):
    value = lesson[pid][field]
    body = json.dumps(value) if isinstance(value, dict) else value
    check(f'{pid} {field} states {", ".join(texts)}', all(t in body for t in texts))


R = lab.experiments()
r = R['sss-rob-serial-dof']
check('serial-dof counts', r['pick_and_place']['total'] == 5 and r['gantry'] == dict(angles=1, lengths=3, total=4) and r['four_bar_mobility'] == 1)
says('sss-rob-serial-dof', 'worked_example', '5 configuration coordinates', '4 angles')
says('sss-rob-serial-dof', 'boundary_case', '3 * (4 - 1) - 2 * 4 = 1')

r = R['p-charge']
close('rod charge -8.0 nC', round(r['rod_charge_nC'], 1), -8.0)
check('charge conserved', r['total'] == 0 and r['spheres_each_nC'] == 2.0 and r['charge_through_lamp_C'] == 20.0)
says('p-charge', 'worked_example', '-8.0 nC', '20 C')

check('frame-labels rotated obstacle', R['sss-rob-frame-labels']['obstacle_in_map'] == [4.5, 5.0])
says('sss-rob-frame-labels', 'practice', '(4.5, 5.0)')

r = R['sss-rob-joint-conventions']
check('joint conventions conversions', r['absolute'] == [20, 50, 40] and r['relative_of_90_45_45'] == [90, -45, 0] and r['link2_abs_rad_relative_reading'] == 1.5)
says('sss-rob-joint-conventions', 'worked_example', '20, 50 and 40 deg')

r = R['sss-rob-rotation-columns']
check('rotation columns', r['v_A'] == [0, 2, 0] and r['v_A_180'] == [-1, -2, 3] and r['wrong_direction'] == [-2, 0, 0] and r['right_direction'] == [2, 0, 0])
says('sss-rob-rotation-columns', 'boundary_case', '(-2, 0, 0)', '(2, 0, 0)')

r = R['sss-rob-task-coordinates']
check('task coordinates branches and tool angles', r['branches_deg'] == [[-3.3, 69.51], [40.17, -69.51]] and r['tool_angles_deg'] == [66.2, -29.3])
says('sss-rob-task-coordinates', 'worked_example', '(-3.30, 69.51)', '(40.17, -69.51)', '66.2 deg', '-29.3 deg')

r = R['sss-rob-point-direction']
check('point and direction', r['p_A'] == [1.0, 2.5, 0] and r['d_A'] == [0, 0.5, 0] and r['difference'] == [0, 0.5, 0] and r['velocity_A'] == [-0.2, 0, 0] and r['gravity_A'] == [0, 0, -1])
says('sss-rob-point-direction', 'worked_example', '(1.0, 2.5, 0)', '(0, 0.5, 0)')

r = R['sss-rob-rotation-check']
check('rotation check classifications', r['R1'] == 'rotation' and r['R2'] == 'reflection' and r['R3'] == 'not orthonormal' and r['practice'] == 'rotation')
close('scaled error', r['R3_error'], 0.0201)
close('practice angle', r['practice_angle_deg'], 53.13)
says('sss-rob-rotation-check', 'worked_example', '0.0201')

r = R['m-log']
check('logarithms', r['log2_10'] == 3.32 and r['log10_200_over_2'] == 2 and r['db_1000'] == 30 and r['log3_81'] == 4 and r['e_squared'] == 7.389 and r['log2_plus_log8'] == 1.204)
says('m-log', 'worked_example', '3.32', '30 dB')

r = R['sss-rob-planar-reach']
check('reach ring and targets', r['annulus'] == [0.25, 0.75] and r['targets']['(0.6, 0.2)'] == [0.632, True] and r['targets']['(0.1, 0.1)'] == [0.141, False]
      and r['targets']['(0.7, 0.4)'] == [0.806, False] and r['targets']['(0, -0.75)'][1] and r['targets']['(0.2, 0.15)'][1])
says('sss-rob-planar-reach', 'worked_example', '0.632 m', '0.141 m', '0.806 m')

r = R['sss-rob-compose']
check('composition', r['T_AC_translation'] == [0.2, 0.3] and r['point_x'] == [0.2, 0.4] and r['point_y'] == [0.1, 0.3] and r['reversed_translation'] == [-0.1, 0])
says('sss-rob-compose', 'worked_example', '(0.2, 0.4)', '(-0.1, 0)')

r = R['sss-rob-inverse']
check('inverse', r['t_BA'] == [-2.0, 1.0, 0] and r['round_trip'] == [0.5, 0, 0] and r['wrong_round_trip'] == [1.5, -3.0, 0] and r['pure_translation_inverse'] == [-0.3, 0.1, -0.2])
close('scaled round trip', r['scaled_round_trip_error_pct'], 2.01)
says('sss-rob-inverse', 'worked_example', '(-2.0, 1.0, 0)', '(1.5, -3.0, 0)')

r = R['sss-rob-planar-fk']
check('forward kinematics', r['worked'] == [0.4665, 0.558, 30] and r['straight'] == [0.75, 0] and r['right_angle'] == [0.5, 0.25] and r['practice'] == [-0.25, 0.5, 180])
says('sss-rob-planar-fk', 'worked_example', '0.4665 m', '0.5580 m', '(0.75, 0)', '(0.5, 0.25)')

r = R['m-trigidentity']
check('identities', r['sin75'] == r['sum_formula'] == 0.9659 and r['simplify_check'][0] == r['simplify_check'][1] == 0.2955 and r['practice_check'][0] == r['practice_check'][1] == 0.7081)
says('m-trigidentity', 'worked_example', '0.9659', '0.2955')

r = R['p-electricfield']
close('Coulomb force', r['force_N'], 5.39)
close('field to 2 significant figures', round(r['field_N_per_C'], -4), 4.5e5)
close('electron force', round(r['electron_force_N'], 15), 7.2e-14)
check('midpoint cancels', r['midpoint_net'] == 0 and round(r['midpoint_each'], -4) == 9.0e5)
says('p-electricfield', 'worked_example', '5.39 N', '4.5e5 N/C', '7.2e-14 N')

r = R['sss-rob-planar-ik']
check('inverse kinematics', r['cos_q2'] == 0.35 and r['branches'] == [[-3.3, 69.51], [40.17, -69.51]] and r['fk_check'] == [[0.6, 0.2], [0.6, 0.2]]
      and r['practice'] == [[0.0, 90.0], [53.13, -90.0]] and r['boundary'] == [[0.0, 0.0]] and r['rounding_case'] == 1)
says('sss-rob-planar-ik', 'worked_example', '0.35', '(-3.30, 69.51)', '(40.17, -69.51)')
reject('out of reach rejected', lambda: lab.ik(0.8, 0.0))
reject('equal links at the base rejected', lambda: lab.ik(0.0, 0.0, 0.3, 0.3))

r = R['sss-rob-tool-offset']
check('tool offset', r['tip'] == [0.5258, 0.6153] and r['naive'] == [0.5465, 0.578] and r['error_m'] == 0.0427 and r['at_zero'] == [0.83, 0.02])
says('sss-rob-tool-offset', 'worked_example', '0.5258 m', '0.6153 m', '0.0427 m')

r = R['p-potentialelectric']
check('potential', r['battery_J'] == 6 and round(r['electron_J'], 21) == 8.01e-19 and r['plates_V_per_m'] == 5000 and r['practice_J'] == 0.18 and r['practice_field'] == 2250)
says('p-potentialelectric', 'worked_example', '6 J', '8.0e-19 J', '5000 V/m')

r = R['sss-rob-ik-verification']
check('verification verdicts', r['branch_a']['accepted'] and not r['branch_b']['accepted'] and r['branch_b']['residual_ok'] and not r['branch_b']['within_limits']
      and not r['rounded']['accepted'] and round(r['rounded']['residual_m'] * 1000, 1) == 5.0 and r['wound']['accepted'] and r['wound_raw'] == 356.7)
says('sss-rob-ik-verification', 'worked_example', '5.0 mm')
says('sss-rob-ik-verification', 'practice', '356.70', '-3.30')

r = R['m-transdiff']
check('derivatives', r['decay_at_half'] == -2.207 and r['degree_slope_30'] == 0.01511 and r['degree_factor'] == 57.3 and r['right_slope_60'] == 0.00873)
says('m-transdiff', 'worked_example', '-2.207', '0.01511')

r = R['sss-rob-position-jacobian']
check('position Jacobian', r['J'] == [[-0.558, -0.125], [0.4665, 0.2165]] and r['column2_dot_link2'] == 0 and r['column2_length'] == 0.25
      and r['column1_vs_tip'] == [-0.558, 0.4665] and r['practice'] == [[-0.25, -0.25], [0.5, 0.0]])
says('sss-rob-position-jacobian', 'worked_example', '[[-0.5580, -0.1250], [0.4665, 0.2165]]')

r = R['sss-rob-joint-to-tip-rate']
check('tip rates', r['v'] == [-0.1741, 0.2016] and r['v_other'] == [-0.175, 0.1] and r['shoulder_only'] == [-0.2232, 0.1866] and r['shoulder_speed'] == 0.2909 and r['tip_distance'] == 0.7273)
says('sss-rob-joint-to-tip-rate', 'worked_example', '(-0.1741, 0.2016)', '(-0.175, 0.1)')

r = R['sss-rob-planar-singularity']
check('singularity', r['det_at_minus30'] == r['det_formula'] == -0.0625 and r['det_stretched'] == 0 and r['column_ratio'] == 3 and r['radial_dot_col'] == 0 and r['det_at_90'] == 0.125)
says('sss-rob-planar-singularity', 'worked_example', '-0.0625', '[[-0.375, -0.125], [0.6495, 0.2165]]')

check('lab expressly demonstrates no physical robot', R['physical_robot_demonstrated'] is False and R['proficiency_written'] is False and 'no physical robot' in R['scope'])

(ROOT / 'lab-results').mkdir(exist_ok=True)
(ROOT / 'lab-results' / 'Lab-Results.json').write_text(json.dumps(R, indent=2) + '\n', encoding='utf-8')
report = dict(status='passed', checks_passed=len(checks), checks=checks, python=platform.python_version(),
              unverified=['Independent expert review of the lesson text', 'Any physical I05 milestone and learner proficiency'])
(ROOT / 'Validation-Results.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(f'{len(checks)} checks passed under Python {platform.python_version()}.')
