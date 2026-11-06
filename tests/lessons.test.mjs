// Checks lessons on master skills (step 7): the importer matches an approved master-skill
// specification entry by the skill's own id, reconciles it like any other lesson, keeps the skill's
// own text, and refuses every drift. Synthetic data only, so it runs anywhere.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyLessons, reconcileLesson, contractHash, STATUS } from '../authoring/robotics-v3/lessons.mjs';

const masterEntry = (extra = {}) => ({ id: 'sss-rob-x', name: 'Do the X step', requires: ['m-a'], demonstration: 'Show X.', kind: 'foundation',
  assessment_contract: { mode: 'written calculation', answer_policy: 'No automatic proficiency.' }, scope_contract: { boundary: 'Bounded.' },
  runtime_identity: { proposed_id: 'sss-rob-x', master_skill: true }, ...extra });
const lessonFor = (entry, extra = {}) => ({ id: entry.id, explanation: 'Explain.', worked_example: 'Example.', name: entry.name, planning_id: entry.id,
  proposed_runtime_id: entry.id, requires: entry.requires, node_contract_sha256: contractHash(entry), proficiency_write: false, details: 'Explain.\n\nExample.',
  placement_note: 'Builds on A.', practice_mode: 'Written calculation.', requires_physical_evidence: false, evidence_kind: 'none', ...extra });
const graph = () => ({
  schemaVersion: 1, title: 'Atlas', metadata: { datasetKey: 'robotics-atlas-merged', atlasFamily: 'fam' },
  nodes: [
    { id: 'm-a', name: 'A', planningId: 'm-a', lesson: { id: 'm-a' }, lessonCard: { edition: 'e1' }, contentStatus: STATUS.authored },
    { id: 'sss-rob-x', name: 'Do the X step', details: 'Master text.', placementNote: 'Master note.', proficiency80: null },
    { id: 'sss-rob-y', name: 'Untouched master skill', details: 'Stays.' }
  ],
  edges: [{ source: 'm-a', target: 'sss-rob-x', type: 'prerequisite' }]
});
const run = (entries = [masterEntry()], lessons = [lessonFor(masterEntry())]) =>
  applyLessons(graph(), { spec: { nodes: entries }, editions: [{ metadata: { edition: 'core-lessons-08', authored: '2026-11-05' }, lessons }], merged: true });

test('an approved master-skill lesson is matched by the skill\'s own id and applied', () => {
  const { graph: out, report } = run();
  assert.deepEqual(report.conflicted, []);
  assert.deepEqual(report.applied, ['sss-rob-x']);
  assert.equal(report.counts.masterSkillLessons, 1);
  const x = out.nodes.find(n => n.id === 'sss-rob-x');
  assert.equal(x.lessonCard.edition, 'core-lessons-08');
  assert.equal(x.lessonCard.requiresPhysicalEvidence, false);
  assert.equal(x.contentStatus, STATUS.authored);
  assert.equal(x.planningId, undefined);          // no planning id is added
  assert.equal(x.proficiency80, null);
});

test('the skill keeps its own text, and a second application changes nothing', () => {
  const { graph: out } = run();
  const x = out.nodes.find(n => n.id === 'sss-rob-x');
  assert.equal(x.atlasDetails, 'Master text.');
  assert.equal(x.atlasPlacementNote, 'Master note.');
  assert.equal(x.details, 'Explain.\n\nExample.');
  const again = applyLessons(out, { spec: { nodes: [masterEntry()] }, editions: [{ metadata: { edition: 'core-lessons-08', authored: '2026-11-05' }, lessons: [lessonFor(masterEntry())] }], merged: true });
  assert.equal(JSON.stringify(again.graph), JSON.stringify(out));
  assert.equal(again.graph.nodes.find(n => n.id === 'sss-rob-x').atlasDetails, 'Master text.');
});

test('other master skills pass through untouched', () => {
  const { graph: out } = run();
  assert.deepEqual(out.nodes.find(n => n.id === 'sss-rob-y'), graph().nodes[2]);
});

test('a lesson for a master skill without an approved entry is refused', () => {
  const { report } = run([], [lessonFor(masterEntry())]);
  assert.match(report.conflicted[0].problems.join(), /no specification entry/);
  assert.equal(report.counts.masterSkillLessons, 0);
});

test('an entry not marked as a master skill does not reach a skill without a planning id', () => {
  const plain = masterEntry({ runtime_identity: { proposed_id: 'sss-rob-x' } });
  const { report } = run([plain], [lessonFor(plain)]);
  assert.match(report.conflicted[0].problems.join(), /no map node/);
});

test('a drifted requires list, demonstration or proficiency write is refused', () => {
  const entry = masterEntry(), node = graph().nodes[1];
  assert.match(reconcileLesson(lessonFor(entry, { requires: ['m-a', 'm-b'] }), { specNode: entry, node }).problems.join(), /prerequisites differ/);
  assert.match(reconcileLesson(lessonFor(entry), { specNode: { ...entry, demonstration: 'Other.' }, node }).problems.join(), /fingerprint/);
  assert.match(reconcileLesson(lessonFor(entry, { proficiency_write: true }), { specNode: entry, node }).problems.join(), /proficiency write/);
});

test('a master-skill entry that meets a skill with a planning id is refused', () => {
  const entry = masterEntry();
  assert.match(reconcileLesson(lessonFor(entry), { specNode: entry, node: { id: 'sss-rob-x', name: 'Do the X step', planningId: 'Z' } }).problems.join(), /matched a node with planning id Z/);
});
