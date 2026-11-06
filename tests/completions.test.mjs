// Checks the robotics completions structure step (authoring/completions/add-skills.mjs). Runs on a
// small synthetic map so it works anywhere; when the real working map is present locally it also
// builds the real result, read-only, and checks its gates and counts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { addSkills, gates, arrange, plan, nodeFor, pendingDetails, placementNote, milestonesFed, specificationExtension } from '../authoring/completions/add-skills.mjs';
import { validate } from '../src/model.js';
import { applyLessons, reconcileLesson, contractHash } from '../authoring/robotics-v3/lessons.mjs';
import { needsRealEvidence, EDITION_NAMES } from '../src/lesson.js';
import { arrangeVortex } from '../src/vortex.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const node = (id, extra = {}) => ({ id, name: `Skill ${id}`, domain: 'Robotics', description: `About ${id}.`, position: [0, 0, 0], pinned: false, proficiency80: null, ...extra });
const v3 = (id, extra = {}) => node(`rob3:${id}`, { planningId: id, nodeKind: 'outcome', feedsMilestones: [], ...extra });
const edge = (source, target, type = 'prerequisite') => ({ source, target, type });

// A filter (P08) feeding a fusion skill (P09) and the milestone; a backlash skill (A09) and a
// bearing skill (D08); a diagnosis skill (V05). P09's milestone list is deliberately stale.
const base = () => arrangeVortex(validate({
  schemaVersion: 1, title: 'Atlas', metadata: { atlasFamily: 'fam', datasetKey: 'key' }, layout: { type: 'vortex' },
  nodes: [node('m-hypothesis', { proficiency80: true }), v3('P08', { proficiency80: false, lesson: { id: 'P08' }, lessonCard: { edition: 'e' } }),
    v3('P09', { feedsMilestones: ['I05'] }), v3('A09'), v3('D08'), v3('V05'), v3('I05', { nodeKind: 'milestone', feedsMilestones: ['I05'] })],
  edges: [edge('rob3:P08', 'rob3:P09'), edge('rob3:P09', 'rob3:I05'), edge('rob3:A09', 'rob3:V05'), edge('rob3:D08', 'rob3:V05'), edge('rob3:V05', 'rob3:I05')]
}), { recalculate: true });

const spec = (id, branch, requires) => ({ id, branch, name: `New ${id}`, requires, demonstration: `Do ${id}.`, kind: 'outcome', tier: 'core', path_role: 'core endpoint path',
  feeds_milestones: [], migration: 'New outcome; no source skill.', existing_candidates: [], scope_contract: { learning_target: `New ${id}`, completion_evidence: `Do ${id}.`, boundary: 'Bounded.' },
  assessment_contract: { mode: 'written calculation', task: `Do ${id}.` }, runtime_identity: { proposed_id: `rob3:${id}` }, origin: 'test' });
const approved = (extra = {}) => ({
  status: 'APPROVED', approval: { by: 'JC', date: '2026-11-05', accepted: ['C1'] }, baseMap: {},
  skills: [
    { planningId: 'P11', runtimeId: 'rob3:P11', required: true, specification: spec('P11', 'Sensing, calibration and estimation', ['P08']),
      edges: [{ source: 'rob3:P08', target: 'rob3:P11', type: 'prerequisite', rationale: 'r' }, { source: 'rob3:P11', target: 'rob3:P09', type: 'prerequisite', rationale: 'r' }, { source: 'm-hypothesis', target: 'rob3:P11', type: 'supports', rationale: 'r' }] },
    { planningId: 'A12', runtimeId: 'rob3:A12', required: false, specification: spec('A12', 'Actuation and transmissions', ['A09', 'D08']),
      edges: [{ source: 'rob3:A09', target: 'rob3:A12', type: 'prerequisite', rationale: 'r' }, { source: 'rob3:D08', target: 'rob3:A12', type: 'prerequisite', rationale: 'r' }, { source: 'rob3:A12', target: 'rob3:V05', type: 'supports', rationale: 'r' }] }
  ],
  ...extra
});
const build = (atlas = base(), a = approved()) => arrange(addSkills(atlas, a), atlas).graph;

test('nothing is built until the new skills are approved', () => {
  assert.throws(() => plan({ ...approved(), status: 'DRAFT' }), /not approved/);
  assert.throws(() => addSkills(base(), { ...approved(), approval: undefined }), /Checkpoint A/);
});

test('the new skills are appended unmarked, with their approved connections, and everything else is kept', () => {
  const atlas = base(), out = build(atlas);
  assert.deepEqual(out.nodes.map(n => n.id), [...atlas.nodes.map(n => n.id), 'rob3:P11', 'rob3:A12']);
  assert.deepEqual(out.edges.slice(0, atlas.edges.length), atlas.edges);
  assert.equal(out.edges.length, atlas.edges.length + 6);
  for (const id of ['rob3:P11', 'rob3:A12']) { const n = out.nodes.find(x => x.id === id); assert.equal(n.proficiency80, null); assert.equal(n.lesson, undefined); assert.equal(n.contentStatus, 'introductory lesson pending'); }
  assert.equal(out.nodes.find(n => n.id === 'm-hypothesis').proficiency80, true);
  assert.equal(out.nodes.find(n => n.id === 'rob3:P08').proficiency80, false);
  assert.deepEqual(out.nodes.find(n => n.id === 'rob3:P08').lesson, { id: 'P08' });
  assert.deepEqual(out.metadata, atlas.metadata);
  assert.deepEqual(gates(atlas, out, approved()), []);
});

test('feedsMilestones is recalculated from the edges, and a milestone lists itself', () => {
  const out = build();
  const fed = id => out.nodes.find(n => n.id === id).feedsMilestones;
  assert.deepEqual(fed('rob3:P11'), ['I05']);   // required, through P09
  assert.deepEqual(fed('rob3:A12'), []);        // optional: a supports link feeds no milestone
  assert.deepEqual(fed('rob3:I05'), ['I05']);
  assert.equal(out.nodes.find(n => n.id === 'm-hypothesis').feedsMilestones, undefined);   // master-only skills get no list
  assert.deepEqual(out.roboticsCompletions.feedsMilestonesCorrected, ['rob3:P08', 'rob3:A09', 'rob3:D08', 'rob3:V05']);
  assert.deepEqual(milestonesFed(out)('rob3:A09'), ['I05']);
});

test('the gates refuse a changed answer, a lost or extra connection, a changed lesson or field, and a wrong required status', () => {
  const atlas = base(), good = build(atlas);
  const broken = change => { const g = structuredClone(good); change(g); return gates(atlas, g, approved()); };
  assert.match(broken(g => { g.nodes[0].proficiency80 = null; }).join(), /Answer changed on m-hypothesis/);
  assert.match(broken(g => { g.edges.splice(0, 1); }).join(), /connection changed or was lost/);
  assert.match(broken(g => { g.edges.push(edge('rob3:A09', 'rob3:P09')); }).join(), /other than the approved/);
  assert.match(broken(g => { g.nodes[1].lesson = { id: 'other' }; }).join(), /Lesson changed on rob3:P08/);
  assert.match(broken(g => { g.nodes[1].name = 'Renamed'; }).join(), /rob3:P08: name changed/);
  assert.match(broken(g => { g.nodes.find(n => n.id === 'rob3:P11').proficiency80 = true; }).join(), /New skill rob3:P11 has an answer/);
  assert.match(broken(g => { g.nodes.find(n => n.id === 'rob3:P09').feedsMilestones = []; }).join(), /feedsMilestones of rob3:P09 disagrees/);
  const asRequired = approved(); asRequired.skills[1].required = true;
  assert.match(gates(atlas, good, asRequired).join(), /rob3:A12 is not in the I05 chain, but it was approved as required/);
});

test('a loop through a new skill is refused', () => {
  const looped = approved();
  looped.skills[0].edges.push({ source: 'rob3:P09', target: 'rob3:P08', type: 'prerequisite', rationale: 'r' });
  assert.throws(() => build(base(), looped));
});

test('the specification extension is the approved records, for the lesson importer', () => {
  const ext = specificationExtension(approved());
  assert.deepEqual(ext.map(s => s.id), ['P11', 'A12']);
  assert.deepEqual(ext[1].requires, ['A09', 'D08']);
});

const ATLAS = path.join(ROOT, 'Maps', 'Robotics-Atlas.json');
const APPROVED = path.join(ROOT, 'scope', 'completions', 'new-skills.json');
const SPEC = path.join(ROOT, 'packages', 'robotics-curriculum-v3', 'Robotics-Reviewed-Specification.json');
const realAvailable = existsSync(ATLAS) && existsSync(APPROVED);
// The map the new skills were approved against: the working map until Task 8 replaced it, then its
// dated backup. Found by the fingerprint the approval records.
const BASE = realAvailable && [ATLAS, path.join(ROOT, 'Maps', 'Backups', '2026-11-05-before-completions', 'Robotics-Atlas.json')]
  .find(f => existsSync(f) && createHash('sha256').update(readFileSync(f)).digest('hex') === JSON.parse(readFileSync(APPROVED, 'utf8')).baseMap.sha256);

// Compared against the map the new skills were approved against, where P07 and A11 were still pending;
// they have lessons since Edition 09.
test('a new skill is worded like the existing pending V3 entries', { skip: !(BASE && existsSync(SPEC)) && 'needs the base map and the V3 specification' }, () => {
  const atlas = JSON.parse(readFileSync(BASE, 'utf8')), v3spec = JSON.parse(readFileSync(SPEC, 'utf8'));
  // The two new skills' branches; each had one entry still pending.
  for (const id of ['P07', 'A11']) {
    const entry = v3spec.nodes.find(n => n.id === id), mapNode = atlas.nodes.find(n => n.planningId === id);
    assert.equal(mapNode.lesson, undefined);
    assert.equal(pendingDetails(entry), mapNode.details, id);
    assert.equal(placementNote(entry), mapNode.placementNote, id);
    const ours = nodeFor(entry), keys = Object.keys(ours);
    assert.deepEqual(keys, Object.keys(mapNode).filter(k => keys.includes(k)), `field order for ${id}`);
    for (const k of ['domain', 'icon', 'nodeKind', 'tier', 'pathRole', 'assessmentMode', 'lessonStatus', 'contentStatus']) assert.deepEqual(ours[k], mapNode[k], ` ${k}`);
  }
});

test('the real base map: every gate passes and a rebuild gives identical bytes', { skip: !BASE && 'needs the map the new skills were approved against' }, () => {
  const atlas = JSON.parse(readFileSync(BASE, 'utf8')), a = JSON.parse(readFileSync(APPROVED, 'utf8'));
  const out = build(atlas, a);
  assert.deepEqual(gates(atlas, out, a), []);
  assert.equal(out.nodes.length, 1920);
  assert.equal(out.edges.length, 5714);
  assert.equal(out.nodes.filter(n => n.proficiency80 != null).length, 308);
  assert.equal(out.nodes.filter(n => n.lesson).length, 298);
  assert.equal(JSON.stringify(build(atlas, a)), JSON.stringify(out));
  assert.deepEqual(out.nodes.find(n => n.id === 'rob3:P11').feedsMilestones, ['I03', 'I04', 'I05']);
  assert.deepEqual(out.nodes.find(n => n.id === 'rob3:K05').feedsMilestones, ['I02', 'I04', 'I05']);
});

const EDITION07 = path.join(ROOT, 'authoring', 'completions', 'edition-07', 'Robotics-Completions-Lessons-07.json');
const importAvailable = BASE && existsSync(SPEC) && existsSync(EDITION07);

test('Edition 07 imports onto the structure map: 8 lessons, nothing else changed, evidence from the lessons', { skip: !importAvailable && 'needs the base map, the V3 specification and Edition 07' }, () => {
  const atlas = JSON.parse(readFileSync(BASE, 'utf8')), a = JSON.parse(readFileSync(APPROVED, 'utf8'));
  const v3spec = JSON.parse(readFileSync(SPEC, 'utf8')), edition = JSON.parse(readFileSync(EDITION07, 'utf8'));
  const structure = build(atlas, a);
  const spec = { ...v3spec, nodes: [...v3spec.nodes, ...specificationExtension(a)] };
  const { graph, report } = applyLessons(structure, { spec, editions: [edition], merged: true });
  assert.deepEqual(report.conflicted, []);
  assert.deepEqual(report.applied, ['m-inverse', 'm-invtrig', 'p-work', 'rob3:K05', 'rob3:K06', 'rob3:K07', 'rob3:P11', 'rob3:A12']);
  assert.equal(report.counts.authored, 306);
  assert.equal(report.counts.pending, 76);
  assert.deepEqual(report.evidence, { lesson: 8, overrides: 0, missing: [] });
  const before = new Map(structure.nodes.map(n => [n.id, n]));
  const changed = graph.nodes.filter(n => JSON.stringify(n) !== JSON.stringify(before.get(n.id))).map(n => n.id);
  assert.deepEqual(changed.sort(), [...report.applied].sort());
  assert.deepEqual(graph.edges, structure.edges);
  for (const id of report.applied) {
    const n = graph.nodes.find(x => x.id === id);
    assert.equal(n.proficiency80, null);
    assert.equal(n.lessonCard.edition, 'robotics-completions-07');
    assert.equal(n.lessonCard.requiresPhysicalEvidence, false);
    assert.equal(needsRealEvidence(n), false);
  }
  assert.ok(EDITION_NAMES['robotics-completions-07']);
  // Re-applying changes nothing.
  assert.equal(JSON.stringify(applyLessons(graph, { spec, editions: [edition], merged: true }).graph), JSON.stringify(graph));
});

test('an Edition 07 lesson is refused if it drifts from its approved record', { skip: !importAvailable && 'needs the base map, the V3 specification and Edition 07' }, () => {
  const a = JSON.parse(readFileSync(APPROVED, 'utf8')), edition = JSON.parse(readFileSync(EDITION07, 'utf8'));
  const specNode = specificationExtension(a).find(s => s.id === 'P11'), lesson = edition.lessons.find(l => l.id === 'P11');
  const node = { id: 'rob3:P11', name: specNode.name, planningId: 'P11' };
  assert.equal(lesson.node_contract_sha256, contractHash(specNode));
  assert.deepEqual(reconcileLesson(lesson, { specNode, node, edition: 'e' }).problems, []);
  assert.match(reconcileLesson({ ...lesson, requires: ['P08', 'P09'] }, { specNode, node, edition: 'e' }).problems.join(), /prerequisites differ/);
  assert.match(reconcileLesson(lesson, { specNode: { ...specNode, demonstration: 'Something else.' }, node, edition: 'e' }).problems.join(), /fingerprint/);
  assert.match(reconcileLesson({ ...lesson, proficiency_write: true }, { specNode, node, edition: 'e' }).problems.join(), /proficiency write/);
});
// Later steps (the foundation splits) add skills to the working map, so this checks that the
// completions are contained in it rather than that it is exactly the completions map.
test('the working map holds the finished completions: the import is already applied', { skip: !(realAvailable && importAvailable) && 'needs the working map and the base map' }, () => {
  const working = JSON.parse(readFileSync(ATLAS, 'utf8'));
  if (BASE === ATLAS) return;   // before Task 8 the working map is still the base
  assert.ok(working.nodes.length >= 1920);
  assert.ok(working.nodes.some(n => n.id === 'rob3:A12'));
  assert.ok(working.nodes.filter(n => n.lesson).length >= 306);   // later editions add lessons
  assert.equal(working.nodes.filter(n => n.lessonCard?.edition === 'robotics-completions-07').length, 8);
  assert.equal(working.nodes.find(n => n.id === 'rob3:P11').proficiency80, null);
});