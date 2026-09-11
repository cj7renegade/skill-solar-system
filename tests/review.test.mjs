import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, validate, clone } from '../src/model.js';
import { buildQueue, heightPrecision, startSession, currentId, answer, skip, back, reviewSkipped, isFinished, isUnfinished, progress, resumeCheck, createAnswerGate, storeSession, findSession, dropSession, loadSessions, mapKey, REVIEW_STORE } from '../src/review.js';

const node = (id, name, y, proficiency80 = null) => ({ id, name, domain: 'Mathematics', description: '', pinned: false, proficiency80, position: [0, y, 0] });
const map = (nodes, title = 'Test map') => ({ schemaVersion: 1, title, nodes, edges: [] });
const memory = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), data }; };
// A small atlas: three skills at the bottom, two at 64, one at 128, one Yes and one No already marked.
const sample = () => map([
  node('z', 'Zeta', 64), node('b2', 'Beta', 0), node('a', 'Alpha', 0), node('b1', 'Beta', 0),
  node('y', 'Yes already', 128, true), node('n', 'No already', 64, false), node('top', 'Top', 128)
]);

test('queue ascends by saved Y, then name, then id, regardless of array order', () => {
  const g = sample();
  assert.deepEqual(buildQueue(g, 'all'), ['a', 'b1', 'b2', 'n', 'z', 'top', 'y']);
  const shuffled = { ...g, nodes: [...g.nodes].reverse() };
  assert.deepEqual(buildQueue(shuffled, 'all'), buildQueue(g, 'all'));
});

test('heights equal at the map saved precision are one height; real differences are not merged', () => {
  const g = map([node('p', 'P', 1920.0004), node('q', 'Q', 1920), node('r', 'R', 1920.125), node('s', 'S', 1919.999)]);
  assert.equal(heightPrecision(g.nodes), 3);
  assert.deepEqual(buildQueue(g, 'all'), ['s', 'p', 'q', 'r']);
  assert.equal(heightPrecision([node('i', 'I', 64), node('j', 'J', 128)]), 0);
});

test('unmarked mode includes only null or missing answers; false is an answered No', () => {
  const g = sample(); delete g.nodes[0].proficiency80;
  assert.deepEqual(buildQueue(g, 'unmarked'), ['a', 'b1', 'b2', 'z', 'top']);
  assert.ok(!buildQueue(g, 'unmarked').includes('n'));
  assert.deepEqual(buildQueue(map([]), 'unmarked'), []);
});

test('every skill at one height is visited before a higher height; skipped skills stay pending', () => {
  const g = sample();
  let s = startSession(g, 'unmarked', 1);
  assert.equal(currentId(s), 'a');
  s = skip(s, 'a'); s = answer(s, 'b1', true); s = answer(s, 'b2', false);
  assert.equal(currentId(s), 'z', 'height 0 finished before height 64');
  assert.deepEqual(s.skipped, ['a']);
  s = answer(s, 'z', true); s = answer(s, 'top', false);
  assert.ok(isFinished(s) && isUnfinished(s), 'ended with skipped skills');
  s = reviewSkipped(s);
  assert.deepEqual(s.queue, ['a']);
  s = answer(s, 'a', true);
  assert.ok(isFinished(s) && !isUnfinished(s), 'all answered');
});

test('answers advance exactly once; stale or repeated input is ignored', () => {
  let s = startSession(sample(), 'all');
  const after = answer(s, 'a', true);
  assert.equal(currentId(after), 'b1');
  assert.equal(answer(after, 'a', false), after, 'a second answer for the previous skill does nothing');
  assert.equal(answer(s, 'a', 'yes'), s, 'only true or false');
  assert.equal(skip(after, 'a'), after);
  const gate = createAnswerGate(400);
  assert.equal(gate.accept('a', 'a', 1000), true);
  assert.equal(gate.accept('a', 'b1', 1010), false, 'double-click targets a skill no longer shown');
  assert.equal(gate.accept('b1', 'b1', 1100), false, 'rapid repeat inside the lock period');
  assert.equal(gate.accept('b1', 'b1', 1500), true);
  assert.equal(gate.accept(null, null, 5000), false);
});

test('back returns to the previous skill without deleting its answer; a new answer replaces it', () => {
  let s = startSession(sample(), 'all');
  s = answer(s, 'a', true); s = skip(s, 'b1');
  s = back(s);
  assert.equal(currentId(s), 'b1');
  s = back(s);
  assert.equal(currentId(s), 'a');
  assert.equal(s.answers.a, true, 'answer kept');
  s = answer(s, 'a', false);
  assert.equal(s.answers.a, false);
  assert.equal(currentId(s), 'b1');
  assert.equal(back(startSession(sample(), 'all')).position, 0);
});

test('progress reports overall position and position within the current height', () => {
  let s = startSession(sample(), 'all');
  s = answer(s, 'a', true);
  const p = progress(s, sample());
  assert.deepEqual({ position: p.position, total: p.total, answered: p.answered }, { position: 2, total: 7, answered: 1 });
  assert.deepEqual(p.height, { index: 1, count: 3, positionInHeight: 2, sizeOfHeight: 3 });
});

test('pause and resume restore the same position for the same map only', () => {
  const store = memory(), g = sample();
  let s = startSession(g, 'unmarked', 10); s = answer(s, 'a', true); s = skip(s, 'b1');
  g.nodes.find(n => n.id === 'a').proficiency80 = true; // the app records each answer in the map
  assert.ok(storeSession(store, s));
  const found = findSession(store, g);
  assert.equal(currentId(found.session), 'b2');
  assert.deepEqual(found.session.skipped, ['b1']);
  assert.equal(findSession(store, map(clone(g).nodes, 'Another map')), null, 'different map title');
  const unrelated = map([node('q1', 'Q', 0), node('q2', 'Q2', 1)], 'Test map');
  assert.equal(findSession(store, unrelated), null, 'same title but different skills');
  dropSession(store, s.map);
  assert.equal(findSession(store, g), null);
});

test('resume drops deleted skills and returns undone answers to the pending list', () => {
  const g = map(Array.from({ length: 20 }, (_, i) => node(`k${i}`, `Skill ${String(i).padStart(2, '0')}`, i)));
  let s = startSession(g, 'all');
  for (const id of ['k0', 'k1', 'k2']) s = answer(s, id, true);
  const edited = clone(g);
  edited.nodes = edited.nodes.filter(n => n.id !== 'k5');
  for (const id of ['k0', 'k2']) edited.nodes.find(n => n.id === id).proficiency80 = true;
  const check = resumeCheck(s, edited);
  assert.ok(check.ok);
  assert.deepEqual(check.missing, ['k5']);
  assert.deepEqual(check.undone, ['k1'], 'k1 is unmarked in the map again (Undo)');
  assert.deepEqual(check.session.skipped, ['k1']);
  assert.equal(currentId(check.session), 'k3');
  assert.equal(check.session.map, mapKey(edited));
  assert.ok(!check.session.queue.includes('k5'));
});

test('answers persist through export and import as true, false, and unmarked', () => {
  const g = normalize(sample());
  let s = startSession(g, 'unmarked');
  const next = clone(g);
  for (const [id, value] of [['a', true], ['b1', false]]) { s = answer(s, id, value); next.nodes.find(n => n.id === id).proficiency80 = value; }
  const reopened = normalize(validate(JSON.parse(JSON.stringify(next, null, 2))));
  const value = id => reopened.nodes.find(n => n.id === id).proficiency80;
  assert.equal(value('a'), true); assert.equal(value('b1'), false); assert.equal(value('b2'), null); assert.equal(value('n'), false);
  assert.deepEqual(buildQueue(reopened, 'unmarked'), ['b2', 'z', 'top']);
  for (const n of reopened.nodes) { const before = g.nodes.find(x => x.id === n.id); assert.deepEqual({ ...n, proficiency80: null }, { ...before, proficiency80: null }, 'only proficiency changes'); }
});

test('sessions for different maps are kept apart, and storage failures are reported', () => {
  const store = memory(), one = sample(), two = map([node('m1', 'M1', 0), node('m2', 'M2', 5)], 'Second map');
  storeSession(store, skip(startSession(one, 'all', 1), 'a'));
  storeSession(store, startSession(two, 'all', 2));
  assert.equal(Object.keys(loadSessions(store)).length, 2);
  assert.equal(currentId(findSession(store, one).session), 'b1');
  assert.equal(currentId(findSession(store, two).session), 'm1');
  store.setItem(REVIEW_STORE, '{not json');
  assert.deepEqual(loadSessions(store), {});
  const full = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
  assert.equal(storeSession(full, startSession(one, 'all')), false);
});
