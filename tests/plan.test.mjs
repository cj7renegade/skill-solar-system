import test from 'node:test';
import assert from 'node:assert/strict';
import { planLayout, PLAN } from '../src/plan.js';
import { prerequisiteIndex } from '../src/learner.js';

const node = (id, courseCode) => ({ id, name: id, courseCode, domain: 'Robotics', position: [0, 0, 0], proficiency80: null });
const graph = {
  nodes: [node('a', 'MTH'), node('b', 'PHY'), node('c', 'MTH'), node('d', 'ACT'), node('e', 'PHY'), node('out', 'MTH')],
  edges: [['a', 'c'], ['b', 'c'], ['c', 'd'], ['b', 'e'], ['out', 'a']].map(([source, target]) => ({ source, target, type: 'prerequisite' }))
};

test('the plan puts each skill in the column of its depth inside the set, one lane per course', () => {
  const plan = planLayout(graph, ['a', 'b', 'c', 'd', 'e'], prerequisiteIndex(graph), ['MTH', 'PHY', 'ACT']);
  const at = Object.fromEntries(plan.nodes.map(n => [n.id, n]));
  // 'out' is outside the set, so a starts in the first column
  assert.deepEqual(['a', 'b', 'c', 'd', 'e'].map(id => (at[id].x - PLAN.left) / PLAN.column), [0, 0, 1, 2, 1]);
  assert.deepEqual(plan.lanes.map(l => l.course), ['MTH', 'PHY', 'ACT']);
  assert.equal(plan.columns, 3);
  for (const [s, t] of plan.edges) assert.ok(at[s].x < at[t].x, `${s} -> ${t} runs forward`);
  assert.equal(plan.edges.length, 4);
  const lane = course => plan.lanes.find(l => l.course === course);
  for (const n of plan.nodes) { const l = lane(n.node.courseCode); assert.ok(n.y >= l.y && n.y < l.y + l.height, `${n.id} sits in its course lane`); }
});
