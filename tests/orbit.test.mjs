import test from 'node:test';
import assert from 'node:assert/strict';
import { centerOn, wheelMove } from '../src/camera.js';

const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

test('centering on a sphere moves only the orbit target when the camera is far enough away', () => {
  const view = centerOn([100, 50, 400], [20, 10, 0], 30);
  assert.deepEqual(view, { camera: [100, 50, 400], target: [20, 10, 0] });
});

test('a camera closer than the orbit limit steps back along the same line, so the view never flips', () => {
  const sphere = [0, 0, 0], view = centerOn([0, 0, 10], sphere, 30);
  assert.ok(near(view.camera, [0, 0, 30]));
  assert.deepEqual(view.target, sphere);
  assert.ok(near(centerOn(sphere, sphere, 30).camera, [0, 0, 30]), 'a camera exactly at the sphere still gets a valid view');
});

test('wheel travel toward an anchored sphere stops at the orbit limit and never moves the target', () => {
  let orbit = 400;
  for (let i = 0; i < 200; i++) {
    const move = wheelMove(-120, { orbit, distance: 60, minDistance: 30, maxDistance: 20000, anchored: true });
    assert.equal(move.target, 0);
    orbit -= move.camera;
    assert.ok(orbit >= 30 - 1e-9);
  }
  assert.ok(Math.abs(orbit - 30) < 1e-6, `settles at the limit, got ${orbit}`);
  const free = wheelMove(-120, { orbit: 30, distance: 60, minDistance: 30, maxDistance: 20000 });
  assert.ok(free.camera > 0 && free.target > 0, 'without an anchor, travel continues forward');
  assert.deepEqual(wheelMove(120, { orbit: 30, distance: 60, minDistance: 30, maxDistance: 20000, anchored: true }), wheelMove(120, { orbit: 30, distance: 60, minDistance: 30, maxDistance: 20000 }), 'zooming out is unchanged');
});
