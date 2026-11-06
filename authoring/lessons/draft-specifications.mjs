// Drafts the lesson specifications for the master-only skills on the I05 path (Tasks/TASKS.md,
// Task 2), for JC's approval at Checkpoint A. Read-only on every map: it writes only
// scope/lessons/master-specifications.json.
//
//   node authoring/lessons/draft-specifications.mjs
//
// Each entry follows the reviewed specification's format (packages/robotics-curriculum-v3/), so a
// lesson can be checked against it the same way. Name and requires come from the map itself; the
// assessment wording for each mode is V3's own, copied from its specification; only the
// demonstration (and, for skills without one, the scope boundary) is drafted here.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const MAP = path.join(ROOT, 'Maps', 'Robotics-Atlas.json');
const SPEC = path.join(ROOT, 'packages', 'robotics-curriculum-v3', 'Robotics-Reviewed-Specification.json');
const OUT = path.join(ROOT, 'scope', 'lessons', 'master-specifications.json');
const FAMILY = 'sss-robotics-foundations-2026-09';

// The drafted demonstrations. Mode: written calculation unless stated.
const DRAFT = {
  'sss-rob-serial-dof': 'Count the configuration coordinates of stated fixed-base open chains of revolute and prismatic joints, label each as an angle or a translation, and identify a stated case (a closed loop or a coupled joint) where the counting rule does not apply.',
  'p-charge': ['calculation and explanation', 'Track charge through stated transfers between objects and around a circuit using conservation and whole multiples of e, and explain why a circuit converts energy rather than consuming charge.'],
  'sss-rob-frame-labels': 'Label the frame of each coordinate tuple in a stated multi-sensor scenario, flag every comparison between tuples in different frames, and explain how different coordinates can describe the same unmoved object.',
  'sss-rob-joint-conventions': 'Write a configuration vector with joint order, units, positive directions and zero references for a stated arm, and convert its joint angles between relative and absolute form.',
  'sss-rob-rotation-columns': 'Build R_AB from frame B\'s unit axes expressed in frame A, use it to convert stated B components into A components, and show that swapping the frame labels gives the transpose.',
  'sss-rob-task-coordinates': 'For stated targets, say whether each specifies position, orientation or both, distinguish it from a joint configuration, and explain why reaching a point does not guarantee every orientation there.',
  'sss-rob-point-direction': 'Convert a point and a free displacement vector between frames with a stated rotation and translation, and show that the difference of two converted points rotates without the translation.',
  'sss-rob-rotation-check': 'Test stated 3x3 matrices for R^T R = I and det R = +1 within a stated tolerance, and classify each as a proper rotation, a reflection or a scaled matrix.',
  'm-log': 'Evaluate and rearrange logarithms using the definition, the product, quotient and power rules and change of base; state the domain restrictions; and reject the invalid split of log(x + y).',
  'sss-rob-planar-reach': 'Test stated targets against |L1 - L2| <= r <= L1 + L2 for a planar two-link arm, and state what a passing test does not establish (joint limits, obstacles, tool orientation).',
  'sss-rob-compose': 'Compose a labeled chain of rigid transforms as T_AC = T_AB T_BC in the correct order, and check the result with a point of known location.',
  'sss-rob-inverse': 'Invert a stated rigid transform as rotation R^T and translation -R^T t, and verify it with a point round trip within a stated tolerance.',
  'sss-rob-planar-fk': 'Compute the tip position and orientation of an ideal planar two-link arm for stated joint angles, and check the method with the straight and right-angle configurations.',
  'm-trigidentity': 'Simplify stated trigonometric expressions and prove stated identities using the Pythagorean, quotient, sum and double-angle identities, and check each result numerically at a test angle.',
  'p-electricfield': ['calculation and explanation', 'Calculate the force between two point charges and the field of one or two point charges with its direction, and state the force on a charge of either sign placed in a given field.'],
  'sss-rob-planar-ik': 'Compute both regular inverse-kinematic branches for a reachable planar two-link target, and identify the boundary and degenerate cases where the formula needs special handling.',
  'sss-rob-tool-offset': 'Append a fixed link-to-tool transform to a chain and compute the tool point in the base frame, rotating a locally expressed offset before adding it.',
  'p-potentialelectric': ['calculation and explanation', 'Calculate energy transfers from potential differences with dU = q dV, relate a potential difference to a uniform field with dV = E d, and state the zero reference used.'],
  'sss-rob-ik-verification': 'Verify stated inverse-kinematic candidates by forward substitution and joint limits with stated tolerances, reject each failing candidate with its reason, and report which checks were and were not performed.',
  'm-transdiff': 'Differentiate exponential, logarithmic and trigonometric functions, with the chain rule, keeping angles in radians, and explain the factor that appears when an angle is measured in degrees.',
  'sss-rob-position-jacobian': 'Derive the 2x2 position Jacobian of a planar two-link arm by partial differentiation of the forward-kinematics equations, and state what its rows and columns mean.',
  'sss-rob-joint-to-tip-rate': 'Calculate the tip velocity from stated joint rates by evaluating the position Jacobian at the current configuration, and show that the same rates give a different velocity at another configuration.',
  'sss-rob-planar-singularity': 'Identify the singular configurations of a planar two-link arm from det J = L1 L2 sin(q2), and describe which instantaneous tip motion is lost there and which remains.'
};
const BOUNDARY = 'Limited to the conditions and method in the demonstration. This entry does not certify broader professional competence or untested hardware.';

const map = JSON.parse(readFileSync(MAP, 'utf8')), spec = JSON.parse(readFileSync(SPEC, 'utf8'));
const byId = new Map(map.nodes.map(n => [n.id, n]));
const parents = new Map();
for (const e of map.edges) if (e.type === 'prerequisite') (parents.get(e.target) || parents.set(e.target, []).get(e.target)).push(e.source);
// The I05 path, and the milestones each skill leads to.
const ancestors = id => { const s = new Set(), st = [id]; while (st.length) for (const p of parents.get(st.pop()) || []) if (!s.has(p)) { s.add(p); st.push(p); } return s; };
const chains = Object.fromEntries(['I01', 'I02', 'I03', 'I04', 'I05'].map(m => [m, ancestors(`rob3:${m}`)]));
const depth = new Map();
const depthOf = id => { if (!depth.has(id)) depth.set(id, Math.max(0, ...(parents.get(id) || []).map(p => depthOf(p) + 1))); return depth.get(id); };
// V3's assessment wording, one template per mode.
const template = mode => { const n = spec.nodes.find(x => x.assessment_contract?.mode === mode); const { task, ...rest } = n.assessment_contract; return rest; };

const targets = [...chains.I05].map(id => byId.get(id)).filter(n => !n.planningId && !n.lesson).sort((a, b) => a.skillLevel - b.skillLevel || a.id.localeCompare(b.id));
const missing = targets.filter(n => !DRAFT[n.id]).map(n => n.id), extra = Object.keys(DRAFT).filter(id => !targets.some(n => n.id === id));
if (missing.length || extra.length) throw Error(`Drafts and the I05 path disagree. Missing: ${missing.join(', ') || 'none'}; not on the path: ${extra.join(', ') || 'none'}.`);

const entries = targets.map(n => {
  const [mode, demonstration] = Array.isArray(DRAFT[n.id]) ? DRAFT[n.id] : ['written calculation', DRAFT[n.id]];
  return {
    id: n.id, branch: n.subdomain, name: n.name,
    requires: (parents.get(n.id) || []).slice(),
    demonstration, kind: 'foundation', origin: 'master skill on the I05 path, core lessons edition 08', tier: 'core',
    existing_candidates: [], proficiency80: null, migration: 'Existing master skill; its id, text and answer are unchanged.',
    dependency_depth: depthOf(n.id), path_role: 'core endpoint path',
    feeds_milestones: Object.keys(chains).filter(m => chains[m].has(n.id)), planning_only: true,
    assessment_contract: { mode, task: demonstration, ...template(mode) },
    scope_contract: { learning_target: n.name, completion_evidence: demonstration, boundary: n.scopeNote ? `${n.scopeNote} ${BOUNDARY}` : BOUNDARY },
    review: { scope_and_prerequisite_pass: 'drafted in core lessons Task 2; awaiting JC at Checkpoint A', decision: 'proposed',
      limits: 'Not independent expert verification; the lesson and reference exercises are authored in Edition 08.' },
    runtime_identity: { proposed_id: n.id, source_candidate_id: null, approved_equivalent_to_source: false, family: FAMILY, proficiency80: null, master_skill: true },
    lesson_status: 'scope and assessment specified; full lesson authoring pending'
  };
});

const out = {
  status: 'draft for JC at Checkpoint A; nothing is built from this file until JC approves it',
  drafted: new Date().toISOString().slice(0, 10),
  baseMap: { file: 'Maps/Robotics-Atlas.json', sha256: createHash('sha256').update(readFileSync(MAP)).digest('hex') },
  note: 'One entry per master-only skill on the I05 path, in the reviewed specification\'s format. name and requires are the map\'s own; the assessment wording is V3\'s for the stated mode; runtime_identity.master_skill marks an entry the importer matches by the skill\'s own id, because these skills have no planning id.',
  entries
};
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote ${entries.length} entries to ${path.relative(ROOT, OUT)}.`);
console.log(entries.map(e => `${e.id} [${e.assessment_contract.mode}] depth ${e.dependency_depth} feeds ${e.feeds_milestones.join(' ')} requires ${e.requires.join(', ')}`).join('\n'));
