import test from 'node:test';
import assert from 'node:assert/strict';
import { bandView, BAND_SQUEEZE } from '../src/helix.js';
import { stageRings, milestoneCode, buildStructure } from '../src/structure.js';

const layout = { type: 'helix', turns: 2, heightPerLevel: 10, topLevel: 11, courseOrder: ['AAA', 'BBB', 'CCC', 'DDD'] };
const helix = (nodes, extra = {}) => ({ nodes, edges: [], layout, metadata: { humanoidHelixImport: { buildStages: { 1: 'Foundations', 2: 'Joint', 3: 'Arm', 7: 'Legs' } } }, ...extra });
const at = (angle, radius, y) => [Math.cos(angle) * radius, y, Math.sin(angle) * radius];

test('band gaps pull a skill toward its sector centre without changing its height or radius', () => {
  const g = helix([]), centre = 0 /* AAA at height 0 */, n = { id: 'a', courseCode: 'AAA', position: at(centre + 0.4, 800, 0) };
  const shown = bandView(g, n);
  assert.ok(Math.abs(Math.atan2(shown[2], shown[0]) - 0.4 * BAND_SQUEEZE) < 1e-9);
  assert.ok(Math.abs(Math.hypot(shown[0], shown[2]) - 800) < 1e-9);
  assert.equal(shown[1], 0);
});

test('band gaps invert exactly, so an edit-mode drag stores the map\'s own coordinates', () => {
  const g = helix([]);
  for (const [code, angle, y] of [['AAA', 0.3, 0], ['BBB', 2.1, 40], ['CCC', -2.9, 95], ['DDD', 3.1, 100]]) {
    const n = { id: code, courseCode: code, position: at(angle, 900, y) };
    const back = bandView(g, n, bandView(g, n), true);
    n.position.forEach((v, i) => assert.ok(Math.abs(v - back[i]) < 1e-6, `${code}: ${n.position} -> ${back}`));
  }
});

test('band gaps leave milestones, unknown courses and non-helix maps exactly where they are', () => {
  const p = at(1, 500, 30);
  assert.deepEqual(bandView(helix([]), { id: 'm', nodeKind: 'milestone', courseCode: 'AAA', position: p }), p);
  assert.deepEqual(bandView(helix([]), { id: 'x', courseCode: 'ZZZ', position: p }), p);
  assert.deepEqual(bandView({ nodes: [], edges: [], layout: { type: 'vortex' } }, { id: 'x', courseCode: 'AAA', position: p }), p);
});

test('stage rings sit where each stage first appears on the path, and close stages share a ring', () => {
  const n = (id, buildStage, helixLevel, onHumanoidPath = true) => ({ id, buildStage, helixLevel, onHumanoidPath, position: [0, 0, 0] });
  const rings = stageRings(helix([n('a', 1, 1), n('b', 2, 4), n('c', 3, 30), n('d', 3, 12), n('e', 7, 61), n('off', 7, 2, false)]));
  assert.deepEqual(rings.map(r => [r.level, r.stages]), [[1, [1, 2]], [12, [3]], [61, [7]]]);
  assert.equal(rings[0].label, 'Stages 1–2 · from Foundations');
  assert.equal(rings[1].label, 'Stage 3 · Arm');
  assert.deepEqual(stageRings({ nodes: [n('a', 1, 1)], edges: [], layout: { type: 'vortex' } }), []);
});

test('milestone codes and labels; maps without milestones or courses get no helix aids', () => {
  assert.equal(milestoneCode({ id: 'rob3:I01' }), 'I01');
  assert.equal(milestoneCode({ id: 'hx-sys-ms-i09' }), 'I09');
  assert.equal(milestoneCode({ id: 'm-vector' }), null);
  const plain = { nodes: [{ id: 'a', name: 'A', position: [0, 0, 0] }], edges: [] };
  const built = buildStructure(plain, n => n.position);
  assert.equal(built.labels.length, 0);
  assert.equal(built.group.children.length, 0);
});
