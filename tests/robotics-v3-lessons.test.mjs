// Checks the robotics learning-edition import and the card sections it produces. Runs on a small
// stand-in map so it works without the supplied package; when the package is present locally it
// also checks the real 381-entry map and the real 193 lessons, read-only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { applyLessons, preservationDiff, reconcileLesson, contractHash, pythonJson, STATUS, LESSON_STATUS, DATASET_KEY } from '../authoring/robotics-v3/lessons.mjs';
import { lessonSections, hasLesson, contentStatusLine, contentPendingLine, exerciseKind, demonstrationKind, NEEDS_REAL_EVIDENCE, EDITION_NAMES } from '../src/lesson.js';
import { prerequisiteChain } from '../src/prerequisites.js';
import { validate } from '../src/model.js';
import { atlasFamily, emptyRecord, recordAnswers, reconcile } from '../src/proficiency.js';
import { startSession, resumeCheck, currentId, answer, skip, mapKey, datasetKey, findSession, storeSession } from '../src/review.js';

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

test('an entry whose lesson was improved later keeps it; the edition does not overwrite it', () => {
  const imported = applyLessons(standIn(), { spec, editions }).graph;
  // A later edit to the authored card, of the kind a fix between editions would make.
  imported.nodes[0].lesson = { ...imported.nodes[0].lesson, explanation: 'A later, better explanation.' };
  const { graph, report } = applyLessons(imported, { spec, editions });
  assert.equal(report.counts.keptExistingOverEdition, 1);
  assert.equal(report.counts.imported, 0);
  assert.deepEqual(report.superseded[0].differingFields, ['explanation']);
  assert.equal(report.superseded[0].planningId, 'A1');
  assert.equal(graph.nodes[0].lesson.explanation, 'A later, better explanation.', 'the newer text is kept');
  assert.equal(graph.nodes[0].contentStatus, STATUS.authored, 'and the entry is still counted as authored');
  assert.match(report.conflicted[0].problems.join(' '), /already carries a different authored lesson/);
});

test('an entry that no edition supplies keeps the lesson it already has', () => {
  const imported = applyLessons(standIn(), { spec, editions }).graph;
  const { graph, report } = applyLessons(imported, { spec, editions: [] });
  assert.equal(report.counts.authored, 1, 'the existing card still counts');
  assert.equal(graph.nodes[0].lesson.explanation, 'Explanation for A1.');
  assert.equal(graph.nodes[0].contentStatus, STATUS.authored);
  assert.equal(graph.nodes[0].lessonStatus, LESSON_STATUS.authored);
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
  assert.equal(contentStatusLine(graph.nodes[1]), 'No introductory lesson for this entry yet');
  assert.match(contentStatusLine(graph.nodes[0]), /^Introductory lesson available · shared foundations, edition 01/);
  // An entry with a card still says what is missing; one without a card makes no such claim.
  assert.match(contentPendingLine(graph.nodes[0]), /Extended lessons and further practice/);
  assert.equal(contentPendingLine(graph.nodes[1]), null);
  assert.equal(contentPendingLine(graph.nodes[2]), null, 'the roadmap note says it once, in the status line');
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
  assert.match(exerciseKind(node('paper/code preparation; physical or target-device evidence required for full demonstration')), /physical or deployed-system evidence/);
  // Edition 03 words the same idea differently; the card must still say evidence is needed.
  assert.match(exerciseKind(node('Paper/code/design preparation. Physical or deployed-system evidence remains necessary where the full demonstration requires it.')), /physical or deployed-system evidence/);
  // Edition 04 rephrases it again, putting the evidence clause the other way round.
  assert.match(exerciseKind(node('Paper/code preparation; full demonstrations require the stated deployed-system or physical evidence.')), /physical or deployed-system evidence/);
  // Preparation with no evidence clause must not gain one.
  assert.match(exerciseKind(node('introductory paper/code/design exercise; complete the stated demonstration separately')), /done separately/);
  assert.match(exerciseKind(node(null)), /^Introductory exercise\./);
  assert.match(demonstrationKind(node(null)), /^Physical work/);
  assert.match(demonstrationKind({ lessonCard: { assessmentContract: { mode: 'runnable code or trace' } } }), /^Software/);
  assert.equal(demonstrationKind({ lessonCard: { assessmentContract: { mode: 'some future mode' } } }), 'Assessed as: some future mode.');
  assert.equal(demonstrationKind({}), null);
});

// The real package, when it has been extracted locally.
const REAL_MAP = path.join(ROOT, 'Maps', 'Robotics-v3', 'Robotics-v3-Lessons.json');
test('the integrated robotics v3 map carries all 282 lessons and 98 pending entries', { skip: existsSync(REAL_MAP) ? false : 'Maps/Robotics-v3/Robotics-v3-Lessons.json is not present' }, () => {
  const graph = validate(JSON.parse(readFileSync(REAL_MAP, 'utf8')));
  assert.equal(graph.nodes.length, 381);
  assert.equal(graph.edges.length, 894);
  assert.equal(atlasFamily(graph), 'robotics-foundations-integration-v3-review');
  assert.equal(datasetKey(graph), DATASET_KEY, 'a stable review identity, so the title can restate the counts');
  const authored = graph.nodes.filter(n => n.contentStatus === STATUS.authored);
  assert.equal(authored.length, 282);
  assert.equal(graph.nodes.filter(n => n.contentStatus === STATUS.pending).length, 98);
  assert.equal(graph.nodes.filter(n => n.contentStatus === STATUS.roadmap).length, 1);
  assert.equal(graph.nodes.filter(n => n.proficiency80 != null).length, 0);
  assert.equal(new Set(authored.map(n => n.lessonCard.edition)).size, 4);
  assert.equal(authored.filter(n => n.lessonCard.edition === 'shared-foundations-01').length, 77);
  assert.equal(authored.filter(n => n.lessonCard.edition === 'controlled-joint-02').length, 116);
  assert.equal(authored.filter(n => n.lessonCard.edition === 'complete-arm-03').length, 61);
  assert.equal(authored.filter(n => n.lessonCard.edition === 'wheeled-robot-04').length, 28);
  // Every edition present has a reader-facing name; an unmapped one would show its raw slug.
  for (const edition of new Set(authored.map(n => n.lessonCard.edition))) assert.ok(EDITION_NAMES[edition], `no reader-facing name for edition ${edition}`);
  // Every entry's lesson status agrees with whether it actually has a card, and the roadmap note
  // is never described as something to be assessed.
  for (const node of graph.nodes) assert.equal(node.lessonStatus, LESSON_STATUS[node.contentStatus === STATUS.authored ? 'authored' : node.contentStatus === STATUS.roadmap ? 'roadmap' : 'pending'], node.id);
  const roadmap = graph.nodes.find(n => n.contentStatus === STATUS.roadmap);
  assert.match(contentStatusLine(roadmap), /not an assessed entry, and no lesson is planned/);
  assert.equal(hasLesson(roadmap), false);
  assert.equal(roadmap.assessable, false);
  // The entries each handoff asks to see are present, authored, and by the edition that wrote them.
  const named = { 'complete-arm-03': ['K03', 'm-jacobian', 'K10', 'K11', 'G04', 'I02'], 'wheeled-robot-04': ['B-M04', 'P08', 'P09', 'N01', 'N06', 'N08', 'I03'] };
  for (const [edition, ids] of Object.entries(named)) for (const planning of ids) {
    const node = graph.nodes.find(n => n.id === `rob3:${planning}`);
    assert.ok(node, `rob3:${planning} is missing`);
    assert.equal(node.contentStatus, STATUS.authored, planning);
    assert.equal(node.lessonCard.edition, edition, planning);
  }
  // Every milestone chain an edition closed still has introductory content all the way down.
  for (const [milestone, size] of [['rob3:I01', 185], ['rob3:I02', 249], ['rob3:I03', 241]]) {
    const closure = [...prerequisiteChain(graph, milestone).map(s => s.id), milestone];
    assert.equal(closure.length, size, `${milestone} closure`);
    const byId = new Map(graph.nodes.map(n => [n.id, n]));
    assert.deepEqual(closure.filter(id => !byId.get(id).lesson), [], `${milestone}: entries with no introductory lesson`);
  }
  // Whatever wording an edition uses, a card whose demonstration still needs real evidence must
  // say so. A new edition that rephrases it is caught here rather than quietly losing the warning.
  const needsEvidence = authored.filter(n => NEEDS_REAL_EVIDENCE.test(n.lessonCard.practiceMode || ''));
  assert.ok(needsEvidence.length > 100, `${needsEvidence.length} entries state that real evidence is required`);
  for (const node of needsEvidence) assert.match(exerciseKind(node), /also needs physical or deployed-system evidence/, node.id);
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

// --- Guided review across a retitled map -------------------------------------------------------
// The previous import restated the counts in the title, which restarted every saved review because
// sessions were keyed on the title. These check the migration that replaced that behaviour.

const reviewMap = (title, metadata = {}) => validate({
  schemaVersion: 1, title, metadata: { atlasFamily: 'robotics-foundations-integration-v3-review', ...metadata },
  nodes: ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({ id, name: `Skill ${id}`, domain: 'Mathematics', description: '', position: [0, i * 10, 0], pinned: false, proficiency80: null, icon: 'calculator', layoutMode: 'vortex' })),
  edges: []
});
const memoryStore = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }; };

test('a review in progress survives the map being retitled once a dataset key is declared', () => {
  const store = memoryStore();
  // A session begun on the map as it was: no dataset key, title carrying the old counts.
  const before = reviewMap('Robotics curriculum v3 — 193 introductory lessons, 187 pending');
  let session = startSession(before, 'unmarked', 1);
  session = skip(session, currentId(session));
  before.nodes.find(n => n.id === 'b').proficiency80 = true;
  session = answer(session, 'b', true);
  const standing = currentId(session), position = session.position;
  assert.ok(storeSession(store, session));

  // The import declares a stable key and restates the counts in the title.
  const after = reviewMap('Robotics curriculum v3 — 254 introductory lessons, 126 pending', { datasetKey: DATASET_KEY });
  after.nodes.find(n => n.id === 'b').proficiency80 = true;
  assert.notEqual(mapKey(before), mapKey(after), 'the storage key does change');

  const found = findSession(store, after);
  assert.ok(found, 'the saved review is still offered after the rename');
  assert.equal(currentId(found.session), standing, 'it resumes on the same skill');
  assert.equal(found.session.position, position, 'at the same queue position');
  assert.deepEqual(found.session.skipped, session.skipped, 'with the same skipped skills');
  assert.deepEqual(found.session.answers, session.answers, 'and the same answers');
  assert.deepEqual(found.session.queue, session.queue, 'over the same queue');
  assert.equal(found.session.map, mapKey(after), 'restamped with the new key');
  assert.equal(found.storedKey, session.map, 'so the old entry is the one replaced, not left behind');
});

test('a declared dataset key does not merge genuinely different maps, and untitled-key maps behave as before', () => {
  const store = memoryStore();
  const one = reviewMap('Dataset one', { datasetKey: DATASET_KEY });
  storeSession(store, skip(startSession(one, 'all', 1), 'a'));
  // Same declared key but a different node set: not the same dataset, so no session is offered.
  const different = validate({ ...reviewMap('Dataset one', { datasetKey: DATASET_KEY }), nodes: [{ id: 'z', name: 'Z', domain: 'Mathematics', description: '', position: [0, 0, 0], pinned: false, proficiency80: null, icon: 'calculator', layoutMode: 'vortex' }] });
  assert.equal(findSession(store, different), null);
  // A map that declares no key keeps the old title-only rule.
  const legacy = reviewMap('Legacy map');
  storeSession(store, skip(startSession(legacy, 'all', 2), 'a'));
  assert.ok(findSession(store, legacy));
  assert.equal(findSession(store, reviewMap('Legacy map renamed')), null);
  assert.equal(datasetKey(legacy), null);
});

test('the real map keeps a review session across this import', { skip: existsSync(REAL_MAP) ? false : 'Maps/Robotics-v3/Robotics-v3-Lessons.json is not present' }, () => {
  const after = validate(JSON.parse(readFileSync(REAL_MAP, 'utf8')));
  // The map as it was before this import: the earlier title and no dataset key.
  const before = { ...after, title: 'Robotics curriculum v3 — 193 introductory lessons, 187 pending', metadata: { ...after.metadata, datasetKey: undefined } };
  let session = startSession(before, 'unmarked', 1);
  session = skip(session, currentId(session));
  const standing = currentId(session);
  const resumed = resumeCheck(session, after);
  assert.ok(resumed.ok, `resume refused: ${resumed.reason}`);
  assert.equal(currentId(resumed.session), standing);
  assert.equal(resumed.session.position, session.position);
  assert.deepEqual(resumed.session.queue, session.queue, 'the queue is unchanged: no node moved, was added or was removed');
  assert.deepEqual(resumed.missing, []);
});
