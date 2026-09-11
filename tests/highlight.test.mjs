import test from 'node:test';
import assert from 'node:assert/strict';
import { SUBJECTS, domainCounts, toggleSubject, pruneSubjects, highlightedIds } from '../src/highlight.js';

const node = (id, domain) => ({ id, name: id, domain });
// A mathematics sub-map that also contains a physics prerequisite.
const mathSubMap = { title: 'Mathematics sub-map', nodes: [node('m1', 'Mathematics'), node('m2', 'Mathematics'), node('p1', 'Physics')], edges: [] };
const master = { title: 'Master', nodes: [...mathSubMap.nodes, node('r1', 'Robotics'), node('e1', 'Electronics')], edges: [] };

test('subjects match each node\'s own domain, not the map it sits in', () => {
  assert.deepEqual(highlightedIds(mathSubMap, new Set(['Physics'])), ['p1']);
  assert.deepEqual(highlightedIds(mathSubMap, new Set(['Mathematics'])), ['m1', 'm2']);
  assert.deepEqual(domainCounts(mathSubMap), { Mathematics: 2, Physics: 1, Mechanics: 0, Electronics: 0, Computing: 0, Robotics: 0 });
  assert.deepEqual(SUBJECTS, ['Mathematics', 'Physics', 'Mechanics', 'Electronics', 'Computing', 'Robotics']);
});

test('several subjects can be highlighted; toggling again removes one; clearing removes all', () => {
  let active = toggleSubject(new Set(), 'Mathematics');
  active = toggleSubject(active, 'Robotics');
  assert.deepEqual(highlightedIds(master, active), ['m1', 'm2', 'r1']);
  active = toggleSubject(active, 'Mathematics');
  assert.deepEqual([...active], ['Robotics']);
  assert.deepEqual([...toggleSubject(active, 'Not a subject')], ['Robotics']);
  assert.deepEqual(highlightedIds(master, new Set()), []);
});

test('highlights for subjects missing from a newly opened map are dropped', () => {
  const active = new Set(['Robotics', 'Physics', 'Computing']);
  assert.deepEqual([...pruneSubjects(active, mathSubMap)], ['Physics']);
  assert.deepEqual([...pruneSubjects(active, { nodes: [], edges: [] })], []);
});

test('highlighting never changes the map', () => {
  const before = JSON.stringify(master);
  highlightedIds(master, new Set(SUBJECTS)); domainCounts(master); pruneSubjects(new Set(SUBJECTS), master);
  assert.equal(JSON.stringify(master), before);
});
