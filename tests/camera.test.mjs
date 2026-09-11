import test from 'node:test';
import assert from 'node:assert/strict';
import { panOffset, nearestAhead, typicalSpacing, navigationDistance, keyPanAmount, wheelPixels, wheelMove, MAX_FRAME_SECONDS, MAX_WHEEL_PIXELS } from '../src/camera.js';

test('panning moves camera and target by the same offset and keeps diagonal speed equal', () => {
  const right = [0, 0, -1], up = [0, 1, 0], camera = [20, 10, 0], target = [0, 0, 0];
  const delta = panOffset(right, up, 1, 0, 5);
  assert.deepEqual(delta, [0, 0, -5]);
  const moved = camera.map((v, i) => v + delta[i]), aim = target.map((v, i) => v + delta[i]);
  assert.deepEqual(moved.map((v, i) => v - aim[i]), camera.map((v, i) => v - target[i]));
  assert.ok(Math.abs(Math.hypot(...panOffset(right, up, 1, 1, 5)) - 5) < 1e-9);
  assert.ok(panOffset(right, up, -1, -1, 5).every((v, i) => Math.abs(v + panOffset(right, up, 1, 1, 5)[i]) < 1e-12));
});

test('a stale orbit target near the camera does not slow movement when the spheres are far away', () => {
  const spheres = [[0, 0, -500], [60, 0, -500], [0, 0, 40]]; // the sphere behind the camera is ignored
  const nearest = nearestAhead(spheres, [0, 0, 0], [0, 0, -1], 8);
  assert.equal(nearest, 492);
  assert.equal(navigationDistance({ nearest, orbit: 30, spacing: 60, extent: 7000 }), 492);
});

test('close inspection is floored at typical spacing; overview motion is capped by map extent', () => {
  assert.equal(navigationDistance({ nearest: 5, orbit: 30, spacing: 62, extent: 7000 }), 62);
  assert.equal(navigationDistance({ nearest: 50000, orbit: 50000, spacing: 62, extent: 7000 }), 14000);
  assert.equal(navigationDistance({ nearest: Infinity, orbit: 400, spacing: null, extent: 0 }), 400);
  assert.equal(nearestAhead([[0, 0, 50]], [0, 0, 0], [0, 0, -1]), 50, 'falls back to any sphere when none is ahead');
});

test('typical spacing is the median nearest-neighbour distance', () => {
  const grid = [];
  for (let x = 0; x < 10; x++) for (let z = 0; z < 10; z++) grid.push([x * 60, 0, z * 60]);
  assert.equal(typicalSpacing(grid), 60);
  assert.equal(typicalSpacing([[0, 0, 0]]), null);
  assert.equal(typicalSpacing([[1, 1, 1], [1, 1, 1]]), null);
});

test('held-key panning is time based and ignores long frame gaps', () => {
  assert.ok(Math.abs(keyPanAmount(100, 0.02) - 2 * keyPanAmount(100, 0.01)) < 1e-12);
  assert.equal(keyPanAmount(100, 3), keyPanAmount(100, MAX_FRAME_SECONDS));
  assert.equal(keyPanAmount(100, -1), 0);
  assert.ok(keyPanAmount(62, 1 / 60) > 0.5, 'one frame at close range still moves');
});

test('wheel input is normalized for line, page, pinch and oversized deltas', () => {
  assert.equal(wheelPixels({ deltaY: 3, deltaMode: 1 }), 48);
  assert.equal(wheelPixels({ deltaY: -1, deltaMode: 2 }, 120), -120);
  assert.equal(wheelPixels({ deltaY: 2, ctrlKey: true }), 20);
  assert.equal(wheelPixels({ deltaY: -5000 }), -MAX_WHEEL_PIXELS);
  assert.equal(wheelPixels({}), 0);
});

test('wheel travel near the orbit limit continues forward without crossing the target', () => {
  let orbit = 30, travelled = 0;
  for (let i = 0; i < 20; i++) {
    const move = wheelMove(-100, { orbit, distance: 62, minDistance: 30, maxDistance: 20000 });
    assert.ok(move.camera > 0);
    orbit = orbit - move.camera + move.target;
    travelled += move.camera;
    assert.ok(orbit >= 30 - 1e-9, 'target stays ahead of the camera');
  }
  assert.ok(travelled > 62, `travelled ${travelled}`);
  const biggest = wheelMove(wheelPixels({ deltaY: -1e6 }), { orbit: 1000, distance: 500, minDistance: 30, maxDistance: 20000 });
  assert.ok(biggest.camera < 1000 * 0.18, 'one event cannot jump');
});

test('wheel out then in restores the orbit distance and respects the maximum', () => {
  const out = wheelMove(100, { orbit: 1000, distance: 500, minDistance: 30, maxDistance: 20000 });
  const orbit = 1000 - out.camera;
  const back = wheelMove(-100, { orbit, distance: 500, minDistance: 30, maxDistance: 20000 });
  assert.ok(Math.abs(orbit - back.camera - 1000) < 1e-9);
  assert.equal(wheelMove(100, { orbit: 20000, distance: 500, minDistance: 30, maxDistance: 20000 }).camera, -0);
});
