// Checks the robotics learning-edition import and the card sections it produces. Runs on a small
// stand-in map so it works without the supplied package; when the package is present locally it
// also checks the real 381-entry map and the real 193 lessons, read-only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { applyLessons, preservationDiff, reconcileLesson, contractHash, pythonJson, STATUS } from '../authoring/robotics-v3/lessons.mjs';
import { lessonSections, hasLesson, contentStatusLine, exerciseKind, demonstrationKind } from '../src/lesson.js';
import { validate } from '../src/model.js';
import { atlasFamily, emptyRecord, recordAnswers, reconcile } from '../src/proficiency.js';

const ROOT = path.resolve(import.meta.dirname, '..');

// One authored entry, one entry whose lesson is still pending and one roadmap note.
const specNode = (id, extra = {}) => ({
  id, branch: 'Mathematics', name: `Skill ${id}`, requires: [], demonstration: `Demonstrate ${id}.`, kind: 'foundation',
  assessment_contract: { mode: 'written calculation', task: `Demonstrate ${id}.`, case_requirements: 'Normal, boundary and error cases.', acceptance: 'Show the working.', evidence_record: ['task and version', 'outcome and limits'], tolerance_policy: 'Set tolerances first.', answer_policy: 'Evidence does not write an answer.', status: 'assessment specification; individual question bank not authored' },
  scope_contract: { learning_target: `Skill ${id}`, completion_evidence: `Demonstrate ${id}.`, boundary: 'Limited to the stated conditions.' },
  runtime_identity: { proposed_id: `rob3:${id}` }, ...extra
});
const spec = { nodes: [specNode('A1'), specNode('A2'), specNode('X9', { kind: 'roadmap' })] };

const lesson = (id, extra = {}) => ({
  id, name: `Skill ${id}`, branch: 'Mathematics', planning_id: id, proposed_runtime_id: `rob3:${id}`, requires: [],
  explanation: `Explanation for ${id}.`, worked_example: `Worked example for ${id}.`,
  details: `Explanation for ${id}.\n\nWorked example for ${id}.`,
  placement_note: `Placement of ${id}.`, why_it_matters: `Prepares for later work on ${id}.`,
  practice: { question: `Practice ${id}?`, answer: `Practice answer ${id}.` },
  boundary_case: { question: `Boundary ${id}?`, answer: `Boundary answer ${id}.` },
  instructional_scope: 'Introductory card only.', required_future_work: 'More varied exercises.',
  evidence_policy: 'No answer is written automatically.', assessment_rule: 'Attempt before reading the key.',
  content_status: 'introductory_lesson_authored', proficiency_write: false, references: [],
  node_contract_sha256: contractHash(spec.nodes.find(n => n.id === id)), ...extra
});

// A map in the shape the preview generator writes, carrying an answer, a pin and a moved position.
const standIn = () => validate({
  schemaVersion: 1, title: 'Stand-in v3 map',
  metadata: { atlasFamily: 'robotics-foundations-integration-v3-review', created: '2026-09-18', scope: 'Planning only.' },
  nodes: spec.nodes.map((n, i) => ({
    id: n.runtime_identity.proposed_id, name: n.name, domain: 'Mathematics', subdomain: n.branch, nodeKind: n.kind,
    description: n.name, details: 'LESSON NOT YET AUTHORED. Planning record.', position: [i * 40, i * 90, 0],
    pinned: i === 1, proficiency80: i === 0 ? true : i === 1 ? false : null, icon: 'calculator', layoutMode: 'vortex',
    placementNote: 'planning placement', planningId: n.id, assessable: n.kind !== 'roadmap', skillLevel: i + 1
  })),
  edges: [{ source: 'rob3:A1', target: 'rob3:A2', type: 'prerequisite', rationale: 'Recorded in the specification.' }]
});
const editions = [{ metadata: { edition: 'shared-foundations-01', authored: '2026-09-18' }, lessons: [lesson('A1')] }];

test('the python contract fingerprint is reproduced exactly, spaces and escapes included', () => {
  assert.equal(pythonJson({ b: 1, a: 'x' }), '{"a": "x", "b": 1}');
  assert.equal(pythonJson(['a', 'b']), '["a", "b"]');
  assert.equal(pythonJson('30° × π'), '"30\\u00b0 \\u00d7 \\u03c0"');
  assert.equal(pythonJson({ id: 'A1', name: 'Skill A1', requires: [], demonstration: 'Demonstrate A1.' }),
    '{"demonstration": "Demonstrate A1.", "id": "A1", "name": "Skill A1", "requires": []}');
  // The same bytes hashed by Python: json.dumps(..., sort_keys=True) of that contract.
  assert.equal(contractHash(spec.nodes[0]), '51c8e32242c744d1029ccc8b016dc07548cd674027c0fba6c456ed49446ceb03');
});

test('the import applies the lesson and leaves everything else exactly as it was', () => {
  const before = standIn();
  const { graph, report } = applyLessons(before, { spec, editions });
  validate(graph);
  assert.deepEqual(preservationDiff(before, graph), []);
  assert.equal(report.counts.imported, 1);
  assert.equal(report.counts.skipped, 0);
  assert.equal(report.counts.authored, 1);
  assert.equal(report.counts.pending, 1);
  assert.equal(report.counts.roadmap, 1);
  const [a1, a2, x9] = graph.nodes;
  assert.equal(a1.contentStatus, STATUS.authored);
  assert.equal(a2.contentStatus, STATUS.pending);
  assert.equal(x9.contentStatus, STATUS.roadmap);
  assert.equal(a1.details, 'Explanation for A1.\n\nWorked example for A1.');
  assert.equal(a1.placementNote, 'Placement of A1.');
  // The answers, the pin, the position, the level and the family all survive untouched.
  assert.equal(a1.proficiency80, true);
  assert.equal(a2.proficiency80, false);
  assert.equal(a2.pinned, true);
  assert.deepEqual(a2.position, [40, 90, 0]);
  assert.equal(atlasFamily(graph), atlasFamily(before));
  // A pending entry keeps its planning text and gains nothing but a status.
  assert.equal(a2.details, 'LESSON NOT YET AUTHORED. Planning record.');
  assert.equal(hasLesson(a2), false);
});

test('the import is idempotent: a second pass changes nothing', () => {
  const once = applyLessons(standIn(), { spec, editions }).graph;
  const twice = applyLessons(once, { spec, editions }).graph;
  assert.equal(JSON.stringify(twice), JSON.stringify(once));
});

test('every authored field travels, including ones the card does not render', () => {
  const extra = lesson('A1', { dependency_depth: 4, branch: 'Mathematics', unlisted_future_field: 'kept verbatim' });
  const { graph } = applyLessons(standIn(), { spec, editions: [{ metadata: { edition: 'shared-foundations-01', authored: '2026-09-18' }, lessons: [extra] }] });
  assert.equal(graph.nodes[0].lesson.unlisted_future_field, 'kept verbatim');
  assert.equal(graph.nodes[0].lesson.dependency_depth, 4);
  assert.deepEqual(graph.nodes[0].lesson, extra);
});

test('a lesson that no longer matches the reviewed contract is reported, not forced in', () => {
  const stale = lesson('A1', { node_contract_sha256: 'f'.repeat(64) });
  const renamed = lesson('A2', { name: 'Renamed skill' });
  const { graph, report } = applyLessons(standIn(), { spec, editions: [{ metadata: { edition: 'e', authored: '2026-09-20' }, lessons: [stale, renamed] }] });
  assert.equal(report.counts.imported, 0);
  assert.equal(report.counts.skipped, 2);
  assert.equal(report.conflicted.length, 2);
  assert.match(report.conflicted[0].problems.join(' '), /contract fingerprint/);
  assert.match(report.conflicted[1].problems.join(' '), /name differs/);
  assert.equal(hasLesson(graph.nodes[0]), false);
  assert.equal(graph.nodes[0].details, 'LESSON NOT YET AUTHORED. Planning record.');
});

test('a lesson asking for a proficiency write is refused', () => {
  const pushy = lesson('A1', { proficiency_write: true });
  const outcome = reconcileLesson(pushy, { specNode: spec.nodes[0], node: standIn().nodes[0], edition: 'e' });
  assert.match(outcome.problems.join(' '), /never writes answers/);
});

test('the import changes nothing about how the shared record reconciles', () => {
  const before = standIn();
  const record = recordAnswers(emptyRecord('robotics-foundations-integration-v3-review'), [{ id: 'rob3:A1', value: true }], { source: 'test', now: '2026-09-20T00:00:00.000Z' });
  const original = reconcile(before, record, { now: '2026-09-20T00:00:00.000Z' });
  const imported = reconcile(applyLessons(before, { spec, editions }).graph, record, { now: '2026-09-20T00:00:00.000Z' });
  // Same skills touched, same answers, same record revision: the lessons are invisible to sharing.
  assert.deepEqual(imported.applied, original.applied);
  assert.deepEqual(imported.adopted, original.adopted);
  assert.deepEqual(imported.record, original.record);
  assert.deepEqual(imported.graph.nodes.map(n => n.proficiency80), original.graph.nodes.map(n => n.proficiency80));
});

test('the card sections read the authored fields and hide what is missing', () => {
  const { graph } = applyLessons(standIn(), { spec, editions });
  const sections = lessonSections(graph.nodes[0]);
  assert.deepEqual(sections.map(s => s.key), ['explanation', 'why', 'practice', 'boundary', 'demonstration', 'references']);
  const explanation = sections[0].blocks;
  assert.deepEqual(explanation.map(b => b.label), ['Explanation', 'Worked example']);
  const practice = sections[2].blocks.find(b => b.type === 'reveal');
  assert.equal(practice.question, 'Practice A1?');
  assert.equal(practice.answer, 'Practice answer A1.');
  const boundary = sections[3].blocks.find(b => b.type === 'reveal');
  assert.equal(boundary.question, 'Boundary A1?');
  assert.notEqual(boundary.answer, practice.answer);
  // The assessment contract is rendered as labelled text, never as an object.
  const demonstration = sections[4].blocks;
  assert.ok(demonstration.every(b => b.type !== 'text' || typeof b.text === 'string'));
  assert.ok(demonstration.some(b => b.label === 'What must be demonstrated' && b.text === 'Demonstrate A1.'));
  assert.ok(demonstration.some(b => b.type === 'list' && b.label === 'Evidence to record' && b.items.length === 2));
  // The task repeats the demonstration wording in this specification, so it is shown once.
  assert.equal(demonstration.filter(b => b.text === 'Demonstrate A1.').length, 1);
  assert.ok(!JSON.stringify(sections).includes('[object Object]'));
  // No section at all for an entry with no authored lesson.
  assert.deepEqual(lessonSections(graph.nodes[1]), []);
  assert.equal(contentStatusLine(graph.nodes[1]), 'Introductory lesson pending');
  assert.match(contentStatusLine(graph.nodes[0]), /^Introductory lesson authored · shared foundations, edition 01/);
});

test('a lesson with no references or answer keys drops those parts rather than showing empty ones', () => {
  const bare = lesson('A1', { references: [], required_future_work: '', practice: { question: 'Only a question?', answer: '' }, boundary_case: { question: '', answer: '' } });
  const { graph } = applyLessons(standIn(), { spec, editions: [{ metadata: { edition: 'e', authored: '2026-09-20' }, lessons: [bare] }] });
  const keys = lessonSections(graph.nodes[0]).map(s => s.key);
  assert.ok(!keys.includes('references'));
  assert.ok(!keys.includes('boundary'));
  assert.ok(keys.includes('practice'));
});

test('introductory exercises, simulations and physical demonstrations are named apart', () => {
  const node = kind => ({ lesson: {}, lessonCard: { practiceMode: kind, assessmentContract: { mode: 'drawing, calculation or supervised fabrication' } } });
  assert.match(exerciseKind(node('introductory paper/code/design exercise; complete the stated demonstration separately')), /on paper, in code or as a design/);
  assert.match(exerciseKind(node('paper/code preparation; physical or target-device evidence required for full demonstration')), /physical or target-device evidence/);
  assert.match(exerciseKind(node(null)), /^Introductory exercise\./);
  assert.match(demonstrationKind(node(null)), /^Physical work/);
  assert.match(demonstrationKind({ lessonCard: { assessmentContract: { mode: 'runnable code or trace' } } }), /^Software/);
  assert.equal(demonstrationKind({ lessonCard: { assessmentContract: { mode: 'some future mode' } } }), 'Assessed as: some future mode.');
  assert.equal(demonstrationKind({}), null);
});

// The real package, when it has been extracted locally.
const REAL_MAP = path.join(ROOT, 'Maps', 'Robotics-v3', 'Robotics-v3-Lessons.json');
test('the integrated robotics v3 map carries all 193 lessons and 187 pending entries', { skip: existsSync(REAL_MAP) ? false : 'Maps/Robotics-v3/Robotics-v3-Lessons.json is not present' }, () => {
  const graph = validate(JSON.parse(readFileSync(REAL_MAP, 'utf8')));
  assert.equal(graph.nodes.length, 381);
  assert.equal(graph.edges.length, 894);
  assert.equal(atlasFamily(graph), 'robotics-foundations-integration-v3-review');
  const authored = graph.nodes.filter(n => n.contentStatus === STATUS.authored);
  assert.equal(authored.length, 193);
  assert.equal(graph.nodes.filter(n => n.contentStatus === STATUS.pending).length, 187);
  assert.equal(graph.nodes.filter(n => n.contentStatus === STATUS.roadmap).length, 1);
  assert.equal(graph.nodes.filter(n => n.proficiency80 != null).length, 0);
  assert.equal(new Set(authored.map(n => n.lessonCard.edition)).size, 2);
  assert.equal(authored.filter(n => n.lessonCard.edition === 'shared-foundations-01').length, 77);
  assert.equal(authored.filter(n => n.lessonCard.edition === 'controlled-joint-02').length, 116);
  for (const node of authored) {
    const sections = lessonSections(node);
    assert.ok(sections.length >= 5, `${node.id} has only ${sections.length} sections`);
    assert.equal(node.details, `${node.lesson.explanation.trim()}\n\n${node.lesson.worked_example.trim()}`, `${node.id} details should be the explanation and worked example`);
    assert.ok(sections.find(s => s.key === 'practice').blocks.some(b => b.type === 'reveal' && b.answer), `${node.id} has no practice answer`);
    assert.ok(sections.find(s => s.key === 'boundary').blocks.some(b => b.type === 'reveal' && b.answer), `${node.id} has no boundary answer`);
    assert.ok(!JSON.stringify(sections).includes('[object Object]'), `${node.id} renders an object`);
  }
  // Every entry says what content it has, and no lesson claims a proficiency write.
  assert.ok(graph.nodes.every(n => typeof n.contentStatus === 'string' && n.contentStatus));
  assert.ok(authored.every(n => n.lesson.proficiency_write === false));
});
