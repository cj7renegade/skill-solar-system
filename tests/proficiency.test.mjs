import test from 'node:test';
import assert from 'node:assert/strict';
import { atlasFamily, emptyRecord, validateRecord, recordAnswers, reconcile, diffProficiency, mergeImport, adoptFileAnswers, recordSummary, RECORD_FORMAT } from '../src/proficiency.js';

const node = (id, domain, proficiency80 = null) => ({ id, name: `Skill ${id}`, domain, description: `About ${id}`, details: `Details of ${id}`, pinned: false, position: [id.length, 64, 3], skillLevel: 4, proficiency80 });
const family = { atlasFamily: 'test-family' };
const master = () => ({ schemaVersion: 1, title: 'Master', metadata: family, nodes: [node('m1', 'Mathematics', true), node('m2', 'Mathematics'), node('p1', 'Physics'), node('e1', 'Electronics')], edges: [{ source: 'm1', target: 'm2', type: 'prerequisite' }] });
const sub = () => ({ schemaVersion: 1, title: 'Math sub-map', metadata: family, nodes: [node('m1', 'Mathematics'), node('m2', 'Mathematics', true), node('p1', 'Physics')], edges: [] });
// How the app uses these functions: open = validate then reconcile; answer = change the map, then record the diff.
const open = (graph, record) => reconcile(graph, record, { map: graph.title, now: 'T' });
const answer = (graph, record, id, value) => {
  const next = { ...graph, nodes: graph.nodes.map(n => n.id === id ? { ...n, proficiency80: value } : n) };
  return { graph: next, record: recordAnswers(record, diffProficiency(graph, next), { source: 'console', map: graph.title, now: 'T' }) };
};
const value = (graph, id) => graph.nodes.find(n => n.id === id).proficiency80;

test('atlas family comes from explicit metadata or a known dataset id, never from ids alone', () => {
  assert.equal(atlasFamily({ metadata: { atlasFamily: 'my-atlas/v1' } }), 'my-atlas/v1');
  assert.equal(atlasFamily({ metadata: { datasetId: 'sss-robotics-foundations-2026-09' } }), 'sss-robotics-foundations-2026-09');
  assert.equal(atlasFamily({ metadata: { datasetId: 'some-other-dataset' } }), null);
  assert.equal(atlasFamily({ nodes: [] }), null);
  assert.equal(atlasFamily({ metadata: { atlasFamily: '../escape' } }), null);
  assert.equal(atlasFamily({ metadata: { atlasFamily: 'explicit', datasetId: 'sss-robotics-foundations-2026-09' } }), 'explicit');
});

test('with no shared record, explicit Yes and No in a map initialize it; unmarked skills do not', () => {
  const map = master(), opened = open(map, emptyRecord('test-family'));
  assert.deepEqual(opened.adopted, ['m1']);
  assert.deepEqual(opened.applied, []);
  assert.equal(opened.record.entries.m1.value, true);
  assert.equal(opened.record.entries.m1.source, 'initialized from map');
  assert.ok(!('m2' in opened.record.entries));
  assert.equal(opened.graph, map, 'nothing to apply, so the map is returned unchanged');
});

test('Yes, No, and Clear propagate from a sub-map to the master and back', () => {
  let record = open(master(), emptyRecord('test-family')).record;
  let s = open(sub(), record); record = s.record;
  assert.equal(value(s.graph, 'm1'), true, 'master answer reaches the sub-map');
  for (const choice of [true, false, null]) {
    ({ graph: s.graph, record } = answer(s.graph, record, 'p1', choice));
    const m = open(master(), record);
    assert.equal(value(m.graph, 'p1'), choice, `sub-map ${choice} reaches the master`);
  }
  let m = open(master(), record);
  ({ graph: m.graph, record } = answer(m.graph, record, 'm2', false));
  assert.equal(value(open(sub(), record).graph, 'm2'), false, 'master answer returns to the sub-map');
});

test('older map snapshots cannot overwrite shared answers, and unmarked skills never erase them', () => {
  let record = recordAnswers(emptyRecord('test-family'), [{ id: 'm2', value: false }, { id: 'm1', value: null }], { source: 'console', now: 'T' });
  const s = open(sub(), record);
  assert.equal(value(s.graph, 'm2'), false, 'the sub-map file still says Yes, the shared No wins');
  assert.deepEqual(s.applied, ['m2'], 'm1 is unmarked in the file and Cleared in the record, so only m2 changes');
  const m = open(master(), record);
  assert.equal(value(m.graph, 'm1'), null, 'an explicit Clear overrides an older embedded Yes');
  record = recordAnswers(record, [{ id: 'p1', value: true }], { source: 'console', now: 'T' });
  assert.equal(value(open(master(), record).graph, 'p1'), true, 'unmarked in the file, Yes shared');
  assert.equal(open(master(), record).record, record, 'nothing to initialize, record unchanged');
});

test('reversing an answer records the reversal, so the reversed answer does not return', () => {
  let record = open(master(), emptyRecord('test-family')).record;
  const before = open(sub(), record); record = before.record;
  const after = answer(before.graph, record, 'p1', true);
  const undone = recordAnswers(after.record, diffProficiency(after.graph, before.graph), { source: 'undo', now: 'T' });
  assert.equal(undone.entries.p1.value, null, 'explicitly cleared, not removed');
  assert.equal(value(open(master(), undone).graph, 'p1'), null);
  const redone = recordAnswers(undone, diffProficiency(before.graph, after.graph), { source: 'redo', now: 'T' });
  assert.equal(value(open(master(), redone).graph, 'p1'), true);
});

test('reconciling changes only proficiency; every other map field is preserved', () => {
  const record = recordAnswers(emptyRecord('test-family'), [{ id: 'm2', value: true }, { id: 'e1', value: false }], { source: 'console', now: 'T' });
  const original = master(), { graph } = open(original, record);
  const strip = g => JSON.stringify({ ...g, nodes: g.nodes.map(n => ({ ...n, proficiency80: undefined })) });
  assert.equal(strip(graph), strip(original));
  assert.equal(graph.nodes.find(n => n.id === 'p1'), original.nodes.find(n => n.id === 'p1'), 'untouched nodes are reused as they are');
  assert.deepEqual(diffProficiency(original, graph).map(c => c.id).sort(), ['e1', 'm2']);
  assert.deepEqual(diffProficiency(original, { ...original, nodes: [...original.nodes, node('new', 'Robotics', true)] }), [], 'added skills are not changes');
});

test('records validate strictly and stay separate per atlas family', () => {
  const good = { format: RECORD_FORMAT, version: 1, family: 'test-family', revision: 3, entries: { m1: { value: true, revision: 2 }, m2: { value: null } } };
  const valid = validateRecord(good, 'test-family');
  assert.equal(valid.entries.m2.value, null);
  assert.throws(() => validateRecord(good, 'another-family'), /belongs to atlas family/);
  assert.throws(() => validateRecord({ ...good, format: 'x' }), /not a Skill Solar System proficiency record/);
  assert.throws(() => validateRecord({ ...good, entries: { m1: { value: 'yes' } } }), /Yes, No, or Clear/);
  assert.throws(() => validateRecord({ ...good, family: '../x' }), /valid atlas family/);
  assert.throws(() => mergeImport(emptyRecord('test-family'), validateRecord({ ...good, family: 'other' })), /belongs to atlas family/);
});

test('import replaces shared answers only for skills in the imported record', () => {
  const current = recordAnswers(emptyRecord('test-family'), [{ id: 'm1', value: true }, { id: 'm2', value: false }, { id: 'p1', value: true }], { source: 'console', now: 'T' });
  const incoming = validateRecord({ format: RECORD_FORMAT, version: 1, family: 'test-family', entries: { m1: { value: true }, m2: { value: null }, e1: { value: false } } });
  const merged = mergeImport(current, incoming, { now: 'T2' });
  assert.deepEqual({ added: merged.added, changed: merged.changed, unchanged: merged.unchanged }, { added: 1, changed: 1, unchanged: 1 });
  assert.deepEqual(Object.fromEntries(Object.entries(merged.record.entries).map(([id, e]) => [id, e.value])), { m1: true, m2: null, p1: true, e1: false });
  assert.equal(merged.record.revision, current.revision + 1);
});

test('adopting a file explicitly sets every skill in it, and summaries count values', () => {
  const record = adoptFileAnswers(emptyRecord('test-family'), new Map([['m1', true], ['m2', null], ['p1', false]]), { map: 'Master', now: 'T' });
  assert.deepEqual(recordSummary(record), { total: 3, yes: 1, no: 1, cleared: 1 });
  assert.equal(record.entries.m2.source, 'adopted from file');
  assert.equal(value(open(master(), record).graph, 'm1'), true);
});
