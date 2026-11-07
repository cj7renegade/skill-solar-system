import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { clusterData, wantsDetail, placeLabels, LOD_MIN_NODES, LABEL_BUDGET } from '../src/lod.js';

const node = (id, extra) => ({ id, name: id, domain: 'Robotics', position: [0, 0, 0], proficiency80: null, ...extra });

test('clusters group skills by course and subject, at their centre, with the proficient share', () => {
  const g = { nodes: [
    node('a', { courseCode: 'ACT', subdomain: 'Gears', position: [0, 0, 0], proficiency80: true }),
    node('b', { courseCode: 'ACT', subdomain: 'Gears', position: [10, 20, 30] }),
    node('c', { courseCode: 'ACT', subdomain: 'Motors', position: [5, 5, 5] }),
    node('d', { domain: 'Physics', subdomain: 'Waves', position: [1, 1, 1] }),
    node('m', { courseCode: 'SYS', subdomain: 'Milestones', nodeKind: 'milestone' })
  ], edges: [] };
  const clusters = clusterData(g, n => n.position), gears = clusters.find(c => c.name === 'Gears');
  assert.deepEqual(clusters.map(c => c.name).sort(), ['Gears', 'Motors', 'Waves']);   // milestones stay on the spine
  assert.deepEqual(gears.centre, [5, 10, 15]);
  assert.equal(gears.count, 2); assert.equal(gears.done, 0.5);
  assert.ok(gears.radius > clusters.find(c => c.name === 'Motors').radius);
});

test('detail shows near the map and on small maps; clusters from far away', () => {
  const box = new THREE.Box3(new THREE.Vector3(-1000, 0, -1000), new THREE.Vector3(1000, 6000, 1000));
  assert.equal(wantsDetail(new THREE.Vector3(0, 3000, 0), box, 3696), true);            // inside the helix
  assert.equal(wantsDetail(new THREE.Vector3(0, 3000, 9000), box, 3696), false);        // the overview
  assert.equal(wantsDetail(new THREE.Vector3(0, 3000, 9000), box, LOD_MIN_NODES - 1), true);
});

test('labels: always-shown ones first, no overlaps, and at most the budget', () => {
  const rect = (x, y) => ({ x, y, w: 50, h: 10 });
  const always = { always: true, rect: rect(0, 0) }, clash = { rect: rect(10, 2) }, clear = { rect: rect(100, 0) };
  const shown = placeLabels([always, clash, clear]);
  assert.ok(shown.has(always) && shown.has(clear) && !shown.has(clash));
  const many = Array.from({ length: 100 }, (_, i) => ({ rect: rect(i * 60, 0) }));
  assert.equal(placeLabels(many).size, LABEL_BUDGET);
});
