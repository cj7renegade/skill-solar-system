import test from 'node:test';
import assert from 'node:assert/strict';
import { panOffset, nearestAhead, typicalSpacing, navigationDistance, keyPanAmount, wheelPixels, wheelMove, MAX_FRAME_SECONDS, MAX_WHEEL_PIXELS, PAN_SPHERES_PER_SECOND, PAN_CLOSE_CAP } from '../src/camera.js';

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
  const view = { navigation: 100, orbit: 100, spacing: 70 };
  assert.ok(Math.abs(keyPanAmount(view, 0.02) - 2 * keyPanAmount(view, 0.01)) < 1e-12);
  assert.equal(keyPanAmount(view, 3), keyPanAmount(view, MAX_FRAME_SECONDS));
  assert.equal(keyPanAmount(view, -1), 0);
  assert.ok(keyPanAmount({ navigation: 62, orbit: 62, spacing: 62 }, 1 / 60) > 0.5, 'one frame at close range still moves');
});

// Units per second, undoing the per-frame clamp.
const panRate = view => keyPanAmount(view, MAX_FRAME_SECONDS) / MAX_FRAME_SECONDS;

test('held-key panning covers the same map distance per second at every zoom', () => {
  const spacing = 70, steady = PAN_SPHERES_PER_SECOND * spacing;
  // Overview, far and mid range all cross the map at one rate, so travel time does not depend on zoom.
  for (const depth of [11636, 6972, 3000, 1400, 700]) assert.equal(panRate({ navigation: depth, orbit: depth, spacing }), steady, `at ${depth}`);
  assert.equal(steady / spacing, PAN_SPHERES_PER_SECOND, 'the rate is stated in sphere spacings');
});

test('neither a sphere passing the camera nor a stale orbit target slows a distant view', () => {
  const spacing = 70, steady = PAN_SPHERES_PER_SECOND * spacing;
  assert.equal(panRate({ navigation: spacing, orbit: 1600, spacing }), steady, 'a sphere passing close by must not collapse the rate');
  assert.equal(panRate({ navigation: 1600, orbit: 5, spacing }), steady, 'nor may an orbit target left a few units ahead');
});

test('close up the rate is capped in proportion to the view depth, not collapsed', () => {
  const spacing = 70, closeAt = depth => panRate({ navigation: Math.max(depth, spacing), orbit: depth, spacing });
  // Below the point where the steady rate would sweep the screen, the cap takes over smoothly.
  assert.equal(closeAt(spacing), PAN_CLOSE_CAP * spacing);
  assert.equal(closeAt(2 * spacing), 2 * closeAt(spacing), 'the cap is proportional, so it never collapses');
  assert.ok(closeAt(spacing) < closeAt(1400), 'the cap only ever slows things down');
  // The old policy moved 0.7 navigation distances per second; close range is now several times quicker.
  assert.ok(closeAt(spacing) > 3 * (0.7 * spacing), `close-range rate ${closeAt(spacing)}`);
  // The steady rate and the cap meet where the two are equal; there is no step at the crossover.
  const crossover = PAN_SPHERES_PER_SECOND * spacing / PAN_CLOSE_CAP;
  assert.ok(Math.abs(closeAt(crossover) - PAN_SPHERES_PER_SECOND * spacing) < 1e-9);
});

test('a map with no measurable spacing still pans, using the cap alone', () => {
  assert.equal(panRate({ navigation: 500, orbit: 500, spacing: null }), PAN_CLOSE_CAP * 500);
  assert.equal(panRate({ navigation: 500, orbit: 500, spacing: 0 }), PAN_CLOSE_CAP * 500);
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
