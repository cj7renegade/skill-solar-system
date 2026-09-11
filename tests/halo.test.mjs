import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { HALO_MAX_DIAMETER_RATIO, SPHERE_RADIUS, SELECTED_SPHERE_SCALE, haloRadius, haloAlpha, HALO_VERTEX_SHADER, HALO_FRAGMENT_SHADER } from '../src/halo.js';
import { displayPosition } from '../src/spacing.js';

// Rendered diameter measured independently of haloRadius(): project the sphere's true silhouette
// (the circle where camera rays graze it) through a real perspective camera and take the largest
// distance between projected points, in pixels.
const viewport = { width: 1500, height: 900 };
function camera() { const c = new THREE.PerspectiveCamera(43, viewport.width / viewport.height, 1, 30000); c.updateMatrixWorld(); return c; }
function renderedDiameter(cam, center, radius) {
  const c = new THREE.Vector3(...center), d = c.length();
  if (!(radius > 0) || radius >= d) return 0;
  const axis = c.clone().normalize(), ring = c.clone().multiplyScalar(1 - radius * radius / (d * d)), r = radius * Math.sqrt(d * d - radius * radius) / d;
  const u = new THREE.Vector3(0, 1, 0).cross(axis); if (u.lengthSq() < 1e-9) u.set(1, 0, 0); u.normalize();
  const v = axis.clone().cross(u).normalize(), points = [];
  for (let i = 0; i < 360; i++) {
    const a = i * Math.PI / 180, p = ring.clone().addScaledVector(u, r * Math.cos(a)).addScaledVector(v, r * Math.sin(a));
    if (p.z >= -cam.near) return Infinity;
    p.applyMatrix4(cam.projectionMatrix); points.push([p.x * viewport.width / 2, p.y * viewport.height / 2]);
  }
  let best = 0;
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) best = Math.max(best, Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]));
  return best;
}
// Camera-space centres across the visible frustum: on axis, towards each edge and the corners.
const directions = [[0, 0], [0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9], [0.85, 0.85], [-0.85, -0.85], [0.5, -0.7]];
function centres(cam, distance) {
  const tanY = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), tanX = tanY * cam.aspect;
  return directions.map(([x, y]) => new THREE.Vector3(x * tanX, y * tanY, -1).normalize().multiplyScalar(distance).toArray());
}

test('the maximum halo ratio is one named value of at most 2', () => {
  assert.equal(HALO_MAX_DIAMETER_RATIO, 2);
  assert.match(HALO_VERTEX_SHADER, /uniform float ratio/);
});

test('halo outer diameter is at most 2x the rendered sphere, at every distance, angle and selection scale', () => {
  const cam = camera();
  let worst = 0, shown = 0;
  for (const scale of [1, SELECTED_SPHERE_SCALE]) for (const distance of [26, 30, 40, 60, 120, 400, 1500, 6000, 20000, 60000]) for (const center of centres(cam, distance)) {
    const radius = SPHERE_RADIUS * scale, sphere = renderedDiameter(cam, center, radius);
    if (!Number.isFinite(sphere)) continue;
    const halo = haloRadius(radius, center), outer = renderedDiameter(cam, center, halo);
    if (!halo) continue;
    shown++;
    const ratio = outer / sphere;
    worst = Math.max(worst, ratio);
    assert.ok(ratio <= HALO_MAX_DIAMETER_RATIO + 1e-6, `ratio ${ratio} at distance ${distance}, scale ${scale}, centre ${center.map(v => v.toFixed(1))}`);
    // Not a token halo either: it still reaches close to the limit, so it stays visible.
    assert.ok(ratio >= HALO_MAX_DIAMETER_RATIO - 0.01, `ratio ${ratio} at distance ${distance}`);
  }
  assert.ok(shown > 140, `halos shown in ${shown} cases`);
  assert.ok(worst <= HALO_MAX_DIAMETER_RATIO + 1e-6, `worst ratio ${worst}`);
});

test('a world-sized halo around a close sphere is smaller than 2r, so perspective cannot inflate it', () => {
  const near = haloRadius(SPHERE_RADIUS, [0, 0, -30]), far = haloRadius(SPHERE_RADIUS, [0, 0, -3000]);
  assert.ok(near < 2 * SPHERE_RADIUS && near > 1.5 * SPHERE_RADIUS, `near ${near}`);
  assert.ok(Math.abs(far - 2 * SPHERE_RADIUS) < 1e-3, `far ${far}`);
});

test('the halo has no fixed pixel size and no minimum: its on-screen size follows the sphere', () => {
  const cam = camera();
  const at = distance => renderedDiameter(cam, [0, 0, -distance], haloRadius(SPHERE_RADIUS, [0, 0, -distance]));
  assert.ok(Math.abs(at(2000) / at(4000) - 2) < 1e-3);
  assert.ok(Math.abs(at(20000) / at(40000) - 2) < 1e-3);
  assert.ok(at(100000) < 0.5, `overview halo ${at(100000)} px`);
  assert.ok(at(40) > 200, `close halo ${at(40)} px`);
});

test('the ratio holds under every display spacing, which moves spheres but never resizes them', () => {
  const cam = camera(); cam.position.set(300, 900, 1400); cam.lookAt(0, 600, 0); cam.updateMatrixWorld();
  const stored = [[420, 0, 0], [-250, 640, 380], [120, 1344, -760], [900, 3200, 40]];
  for (const spacing of [0.5, 1, 2, 4]) for (const p of stored) {
    const center = new THREE.Vector3(...displayPosition(p, spacing)).applyMatrix4(cam.matrixWorldInverse).toArray();
    const sphere = renderedDiameter(cam, center, SPHERE_RADIUS);
    if (!Number.isFinite(sphere) || center[2] >= 0) continue;
    const halo = haloRadius(SPHERE_RADIUS, center);
    if (halo) assert.ok(renderedDiameter(cam, center, halo) / sphere <= HALO_MAX_DIAMETER_RATIO + 1e-6);
  }
});

test('no halo is drawn for a sphere that is not wholly in front of the camera', () => {
  for (const center of [[0, 0, 10], [0, 0, -5], [0, 0, -SPHERE_RADIUS], [100, 0, -1], [0, 0, 0]]) assert.equal(haloRadius(SPHERE_RADIUS, center), 0);
});

test('the glow fades to nothing at the outer edge and leaves a gap beside the sphere', () => {
  assert.equal(haloAlpha(0), 0); assert.equal(haloAlpha(1), 0); assert.equal(haloAlpha(1.4), 0);
  assert.ok(haloAlpha(0.42) > 0.9);
  // The shader uses the same profile.
  assert.match(HALO_FRAGMENT_SHADER, /band\(0\.12, 0\.38, rho\) \* \(1\.0 - band\(0\.45, 1\.0, rho\)\)/);
});

test('the shader formula matches the tested JavaScript formula', () => {
  const body = src => src.replace(/\s+/g, ' ');
  for (const piece of ['float t = ratio * 2.0 * sqrt(s * (1.0 - s)) / (k - s);', 'float u = k * k * t * t / (2.0 + k * t * t + 2.0 * sqrt(1.0 + k * (1.0 - k) * t * t));', 'return min(ratio * r, sqrt(d2 * u));']) assert.ok(body(HALO_VERTEX_SHADER).includes(piece), piece);
});
