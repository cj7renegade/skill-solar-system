// Adds the skills JC approved at Checkpoint A (scope/completions/new-skills.json) to the working
// Robotics Atlas. Logic only: no file access. build-completions.mjs is the command around it.
//
// The working map is the base. Every node, field, edge, answer and lesson is kept, in order. The
// approved skills are appended as pending V3-style entries with their approved connections, the
// V3 entries' feedsMilestones lists are recalculated from the edges (C4), and levels and positions
// are recalculated with the app's own level and spiral code. Answers are never inferred: a new
// skill starts unmarked.
import { clone, validate } from '../../src/model.js';
import { arrangeVortex } from '../../src/vortex.js';
import { DOMAIN_ICON } from '../../src/icons.js';
import { LESSON_STATUS, STATUS } from '../robotics-v3/lessons.mjs';

export const MILESTONES = ['I01', 'I02', 'I03', 'I04', 'I05'];
// The app's six domains, by V3 branch (the same mapping as authoring/robotics-v3/build-preview.mjs).
const BRANCH_DOMAIN = { 'Sensing, calibration and estimation': 'Robotics', 'Actuation and transmissions': 'Robotics' };
const AUTHORSHIP = 'robotics completions (approved at Checkpoint A)';
// The only fields of an existing skill this step may change.
const MAY_CHANGE = new Set(['position', 'skillLevel', 'feedsMilestones']);

const line = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const edgeKey = e => JSON.stringify([e.type, ...(e.type === 'related' ? [e.source, e.target].sort() : [e.source, e.target])]);

export function plan(approved) {
  if (approved?.status !== 'APPROVED' || !approved.approval) throw Error('The new skills are not approved. Nothing is built until JC approves them (Checkpoint A).');
  return approved.skills;
}

// The pending-entry text every V3 entry without a lesson carries, worded exactly as
// build-preview.mjs words it, so a new skill reads like the other 82 pending entries.
export function pendingDetails(entry) {
  const scope = entry.scope_contract || {}, assess = entry.assessment_contract || {};
  const body = [];
  if (scope.learning_target) body.push(`Learning target: ${line(scope.learning_target)}`);
  if (scope.completion_evidence) body.push(`Completion evidence: ${line(scope.completion_evidence)}`);
  if (scope.boundary) body.push(`Boundary: ${line(scope.boundary)}`);
  if (assess.mode) body.push(`Assessment mode: ${line(assess.mode)}`);
  if (assess.task) body.push(`Task: ${line(assess.task)}`);
  if (assess.case_requirements) body.push(`Cases required: ${line(assess.case_requirements)}`);
  if (assess.acceptance) body.push(`Acceptance: ${line(assess.acceptance)}`);
  if (assess.status) body.push(`Status: ${line(assess.status)}`);
  if (assess.answer_policy) body.push(`Answer policy: ${line(assess.answer_policy)}`);
  if (entry.migration) body.push(`Lineage: ${line(entry.migration)}`);
  if ((entry.existing_candidates || []).length) body.push(`Existing atlas candidates (not approved as equivalent): ${entry.existing_candidates.join(', ')}`);
  return `LESSON NOT YET AUTHORED. This entry carries its reviewed scope and assessment contract from the v3 curriculum specification. It is a planning record, not a finished lesson.\n\n${body.join('\n')}`;
}

export function placementNote(entry) {
  const bits = [`${entry.kind} entry in the ${entry.branch} branch`];
  if (entry.tier) bits.push(`${entry.tier} tier`);
  if (entry.path_role) bits.push(entry.path_role);
  const feeds = (entry.feeds_milestones || []).join(', ');
  return `${bits.join(', ')}.${feeds ? ` Feeds ${feeds}.` : ''}`;
}

// A new skill, with the same fields in the same order as a pending V3 entry in the working map.
export function nodeFor(entry) {
  const domain = BRANCH_DOMAIN[entry.branch];
  if (!domain) throw Error(`No domain for branch ${entry.branch}.`);
  return {
    id: entry.runtime_identity.proposed_id, name: entry.name, domain, subdomain: entry.branch, nodeKind: entry.kind,
    description: entry.scope_contract?.learning_target || entry.name, details: pendingDetails(entry),
    position: [0, 0, 0], pinned: false, proficiency80: null, icon: DOMAIN_ICON[domain], layoutMode: 'vortex',
    placementNote: placementNote(entry), planningId: entry.id, sourceCandidateId: null, approvedEquivalentToSource: false,
    tier: entry.tier ?? null, pathRole: entry.path_role ?? null, feedsMilestones: entry.feeds_milestones ?? [],
    assessmentMode: entry.assessment_contract?.mode ?? null, assessable: true,
    lessonStatus: LESSON_STATUS.pending, origin: entry.origin ?? null, contentStatus: STATUS.pending
  };
}

// The milestones a skill leads to through prerequisite edges. A milestone lists itself, as every
// V3 milestone already does.
export function milestonesFed(graph) {
  const children = new Map();
  for (const e of graph.edges) if (e.type === 'prerequisite') (children.get(e.source) || children.set(e.source, []).get(e.source)).push(e.target);
  return id => {
    const seen = new Set([id]), stack = [id];
    while (stack.length) for (const t of children.get(stack.pop()) || []) if (!seen.has(t)) { seen.add(t); stack.push(t); }
    return MILESTONES.filter(m => seen.has(`rob3:${m}`));
  };
}

export function addSkills(atlas, approved) {
  const skills = plan(approved);
  const graph = clone(atlas);
  for (const s of skills) graph.nodes.push(nodeFor(s.specification));
  for (const s of skills) for (const e of s.edges) graph.edges.push({ source: e.source, target: e.target, type: e.type, rationale: e.rationale, authorship: AUTHORSHIP });
  // C4: feedsMilestones restated from the edges, on every entry that carries the list.
  const fed = milestonesFed(graph), corrected = [];
  for (const n of graph.nodes) {
    if (!Array.isArray(n.feedsMilestones)) continue;
    const next = fed(n.id);
    if (JSON.stringify(next) !== JSON.stringify(n.feedsMilestones)) { if (!skills.some(s => s.runtimeId === n.id)) corrected.push(n.id); n.feedsMilestones = next; }
  }
  graph.roboticsCompletions = {
    approved: { date: approved.approval.date, by: approved.approval.by, accepted: approved.approval.accepted },
    baseMap: approved.baseMap,
    addedSkills: skills.map(s => ({ planningId: s.planningId, runtimeId: s.runtimeId, name: s.specification.name, required: s.required })),
    addedEdges: skills.flatMap(s => s.edges.map(e => ({ source: e.source, target: e.target, type: e.type }))),
    feedsMilestonesCorrected: corrected
  };
  return graph;
}

// The approved skills as specification records, so the lesson importer can check their lessons
// the same way as V3's own.
export function specificationExtension(approved) {
  return plan(approved).map(s => clone(s.specification));
}

const ancestors = (g, id) => {
  const parents = new Map();
  for (const e of g.edges) if (e.type === 'prerequisite') (parents.get(e.target) || parents.set(e.target, []).get(e.target)).push(e.source);
  const seen = new Set(), stack = [id];
  while (stack.length) for (const q of parents.get(stack.pop()) || []) if (!seen.has(q)) { seen.add(q); stack.push(q); }
  return seen;
};

// The gates. Returns a list of failures; empty means the map may be written.
export function gates(before, after, approved) {
  const fail = [], skills = plan(approved);
  try { validate(after); } catch (error) { fail.push(`The app would refuse the map: ${error.message}`); }
  const byId = new Map(after.nodes.map(n => [n.id, n]));
  for (const key of ['atlasFamily', 'datasetKey', 'datasetId']) if (after.metadata?.[key] !== before.metadata?.[key]) fail.push(`metadata.${key} changed.`);
  // Every node kept in order, with its answer and lesson unchanged.
  if (after.nodes.slice(0, before.nodes.length).map(n => n.id).join() !== before.nodes.map(n => n.id).join()) fail.push('Node order changed or a skill was lost.');
  for (const n of before.nodes) {
    const got = byId.get(n.id);
    if (!got) continue;
    if ((got.proficiency80 ?? null) !== (n.proficiency80 ?? null)) fail.push(`Answer changed on ${n.id}.`);
    if (JSON.stringify(got.lesson) !== JSON.stringify(n.lesson) || JSON.stringify(got.lessonCard) !== JSON.stringify(n.lessonCard)) fail.push(`Lesson changed on ${n.id}.`);
    // Only the layout and the recalculated milestone list may move.
    const others = [...new Set([...Object.keys(n), ...Object.keys(got)])].filter(k => !MAY_CHANGE.has(k) && JSON.stringify(n[k]) !== JSON.stringify(got[k]));
    if (others.length) fail.push(`${n.id}: ${others.join(', ')} changed.`);
  }
  if (after.nodes.length !== before.nodes.length + skills.length) fail.push(`Expected ${before.nodes.length + skills.length} skills, got ${after.nodes.length}.`);
  for (const s of skills) {
    const n = byId.get(s.runtimeId);
    if (!n) { fail.push(`${s.runtimeId} is missing.`); continue; }
    if (n.proficiency80 !== null) fail.push(`New skill ${n.id} has an answer.`);
    if (n.lesson) fail.push(`New skill ${n.id} already has a lesson.`);
  }
  // Every connection kept, exactly the approved ones added, none doubled.
  const keys = after.edges.map(edgeKey);
  if (new Set(keys).size !== keys.length) fail.push('A connection is doubled.');
  if (JSON.stringify(after.edges.slice(0, before.edges.length)) !== JSON.stringify(before.edges)) fail.push('An existing connection changed or was lost.');
  if (after.edges.length !== before.edges.length + skills.reduce((t, s) => t + s.edges.length, 0)) fail.push('Connections other than the approved ones were added.');
  for (const e of after.edges) if (!byId.has(e.source) || !byId.has(e.target)) fail.push(`Connection to a missing skill: ${e.source} → ${e.target}.`);
  // Milestone chains: nothing below a milestone before is lost, and a required skill joins its chain.
  for (const m of MILESTONES) {
    const was = ancestors(before, `rob3:${m}`), now = ancestors(after, `rob3:${m}`);
    const lost = [...was].filter(id => !now.has(id));
    if (lost.length) fail.push(`Milestone ${m} lost ${lost.length} prerequisite(s), e.g. ${lost.slice(0, 3).join(', ')}.`);
  }
  for (const s of skills) {
    const inI05 = ancestors(after, 'rob3:I05').has(s.runtimeId);
    if (inI05 !== s.required) fail.push(`${s.runtimeId} is ${inI05 ? '' : 'not '}in the I05 chain, but it was approved as ${s.required ? 'required' : 'optional'}.`);
  }
  // feedsMilestones agrees with the edges everywhere it is recorded.
  const fed = milestonesFed(after);
  for (const n of after.nodes) if (Array.isArray(n.feedsMilestones) && JSON.stringify(n.feedsMilestones) !== JSON.stringify(fed(n.id))) fail.push(`feedsMilestones of ${n.id} disagrees with its edges.`);
  return fail;
}

// Levels and layout, recalculated as the merge did, with the change measured against the base.
// `record` names the block the report is kept under (the splits tool reuses this).
export function arrange(graph, before, { record = 'roboticsCompletions' } = {}) {
  const arranged = arrangeVortex(graph, { recalculate: true });
  const used = arranged.nodes.map(n => n.skillLevel);
  if (arranged.levelModel) arranged.levelModel = { ...arranged.levelModel, usedRange: [Math.min(...used), Math.max(...used)] };
  const was = new Map(before.nodes.map(n => [n.id, n]));
  let same = 0, up = 0, down = 0, moved = 0, biggest = 0;
  for (const n of arranged.nodes) {
    const old = was.get(n.id); if (!old) continue;
    const d = n.skillLevel - old.skillLevel;
    if (d === 0) same++; else if (d > 0) up++; else down++;
    biggest = Math.max(biggest, Math.abs(d));
    if (n.position.some((v, i) => v !== old.position[i])) moved++;
  }
  const report = {
    levelRange: [Math.min(...used), Math.max(...used)],
    levelRangeBefore: [Math.min(...before.nodes.map(n => n.skillLevel)), Math.max(...before.nodes.map(n => n.skillLevel))],
    pinned: arranged.nodes.filter(n => n.pinned).length,
    existingSkills: { levelSame: same, levelUp: up, levelDown: down, largestLevelChange: biggest, positionChanged: moved },
    newSkills: Object.fromEntries(arranged.nodes.filter(n => !was.has(n.id)).map(n => [n.id, n.skillLevel]))
  };
  arranged[record] = { ...arranged[record], levels: report };
  return { graph: arranged, report };
}
