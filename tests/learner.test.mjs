import test from 'node:test';
import assert from 'node:assert/strict';
import { frontier, remainingPath, effortHours, totalHours, studyOrder, nextUp, defaultTarget, finalMilestone, targetProgress, milestones, formatHours, HOURS } from '../src/learner.js';

// a and b are entry skills; c needs both; d needs c; M1 needs d; e is unrelated; M2 needs M1 and e.
const node = (id, extra = {}) => ({ id, name: id.toUpperCase(), domain: 'Robotics', position: [0, 0, 0], proficiency80: null, ...extra });
const fixture = (marks = {}) => ({
  nodes: [
    node('a', { helixLevel: 1 }), node('b', { helixLevel: 1, helixTier: 'Working' }),
    node('c', { helixLevel: 4, helixTier: 'Specialist', helixPractice: 'hands-on' }), node('d', { helixLevel: 7 }),
    node('e', { helixLevel: 1, helixTier: 'Enrichment' }),
    node('m1', { helixLevel: 10, nodeKind: 'milestone' }), node('m2', { helixLevel: 13, nodeKind: 'milestone' }),
    node('k', { helixLevel: 4, nodeKind: 'checkpoint' })
  ].map(n => ({ ...n, proficiency80: marks[n.id] ?? null })),
  edges: [
    { source: 'a', target: 'c', type: 'prerequisite' }, { source: 'b', target: 'c', type: 'prerequisite' },
    { source: 'c', target: 'd', type: 'prerequisite' }, { source: 'd', target: 'm1', type: 'prerequisite' },
    { source: 'm1', target: 'm2', type: 'prerequisite' }, { source: 'e', target: 'm2', type: 'prerequisite' },
    { source: 'a', target: 'k', type: 'prerequisite' },
    { source: 'e', target: 'd', type: 'supports' }, { source: 'e', target: 'a', type: 'related' }
  ]
});

test('frontier: entry skills with nothing marked; supporting and related links are not prerequisites', () => {
  assert.deepEqual([...frontier(fixture())].sort(), ['a', 'b', 'e']);
});

test('frontier moves up as skills are marked Yes, and No is not proficient', () => {
  assert.deepEqual([...frontier(fixture({ a: true }))].sort(), ['b', 'e', 'k']);
  assert.deepEqual([...frontier(fixture({ a: true, b: true }))].sort(), ['c', 'e', 'k']);
  assert.deepEqual([...frontier(fixture({ a: true, b: false }))].sort(), ['b', 'e', 'k']);
  // a milestone becomes frontier when everything below it is proficient
  assert.ok(frontier(fixture({ a: true, b: true, c: true, d: true })).has('m1'));
});

test('remaining path: non-proficient ancestors plus the target, and empty once the target is done', () => {
  assert.deepEqual([...remainingPath(fixture(), 'm1')].sort(), ['a', 'b', 'c', 'd', 'm1']);
  assert.deepEqual([...remainingPath(fixture({ a: true, c: true }), 'm1')].sort(), ['b', 'd', 'm1']);
  assert.deepEqual([...remainingPath(fixture(), 'a')], ['a']);              // an entry skill is its own path
  assert.equal(remainingPath(fixture({ a: true }), 'a').size, 0);
  assert.equal(remainingPath(fixture(), 'missing').size, 0);
});

test('effort estimate: tier defaults, unknown tier counts as Core, hands-on doubles, kinds override', () => {
  const g = fixture(), by = id => g.nodes.find(n => n.id === id);
  assert.equal(effortHours(g, by('a')), HOURS.Core);           // no tier recorded
  assert.equal(effortHours(g, by('b')), 3);
  assert.equal(effortHours(g, by('c')), 10);                   // Specialist 5, hands-on x2
  assert.equal(effortHours(g, by('e')), 1.5);
  assert.equal(effortHours(g, by('m1')), 40);
  assert.equal(effortHours(g, by('k')), 3);
  assert.equal(totalHours(g, remainingPath(g, 'm1')), 2 + 3 + 10 + 2 + 40);
  assert.equal(formatHours(57), '~57 h'); assert.equal(formatHours(1.5), '~1.5 h'); assert.equal(formatHours(1234.4), '~1,234 h');
});

test('study order is topological, lowest level first among ready skills, and ignores outside prerequisites', () => {
  const g = fixture(), order = studyOrder(g, remainingPath(g, 'm2'));
  assert.deepEqual(order, ['a', 'b', 'e', 'c', 'd', 'm1', 'm2']);
  for (const e of g.edges.filter(e => e.type === 'prerequisite')) if (order.includes(e.source) && order.includes(e.target)) assert.ok(order.indexOf(e.source) < order.indexOf(e.target));
  assert.deepEqual(studyOrder(g, ['d', 'm1']), ['d', 'm1']);   // c is outside the set and does not block d
});

test('targets: the milestone chain, the lowest incomplete milestone, and the final milestone', () => {
  assert.deepEqual(milestones(fixture()).map(n => n.id), ['m1', 'm2']);
  assert.equal(defaultTarget(fixture()), 'm1');
  assert.equal(defaultTarget(fixture({ m1: true })), 'm2');
  assert.equal(defaultTarget(fixture({ m1: true, m2: true })), 'm2');
  assert.equal(finalMilestone(fixture()), 'm2');
  assert.equal(defaultTarget({ nodes: [node('x')], edges: [] }), null);
});

test('progress and next up toward a target', () => {
  const g = fixture({ a: true }), p = targetProgress(g, 'm1');
  assert.deepEqual({ prerequisites: p.prerequisites, proficient: p.proficient, percent: p.percent, complete: p.complete }, { prerequisites: 4, proficient: 1, percent: 20, complete: false });
  assert.equal(p.hoursLeft, 3 + 10 + 2 + 40);
  // b is the only frontier skill on m1's path; k and e are frontier but not on it
  assert.deepEqual(nextUp(g, 'm1').map(x => x.node.id), ['b']);
  // on m2's path, e (level 1) and b (level 1) tie on level; b unlocks more of the path
  assert.deepEqual(nextUp(fixture(), 'm2').map(x => x.node.id), ['a', 'b', 'e']);
});
