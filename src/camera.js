// Camera navigation math. Panning moves the camera and orbit target together, so the
// view angle never changes.
//
// Speed policy: keyboard panning, right-drag panning, and wheel travel scale with a
// navigation distance. It is the distance from the camera to the nearest sphere in
// front of it, not the orbit-target distance, which can be stale (for example, the
// empty centre of a fitted spiral a few units ahead of the camera). The navigation
// distance is clamped between the map's typical sphere spacing, so close inspection
// stays precise without getting stuck, and twice the map's extent, so overview motion
// stays bounded.
export const KEY_PAN_RATE = 0.7;        // navigation distances per second while a key is held
export const MAX_FRAME_SECONDS = 0.05;  // longer frame gaps are ignored to avoid jumps
export const WHEEL_RATE = 0.0008;       // per normalized wheel pixel: a 100 px notch moves ~7.7%
export const MAX_WHEEL_PIXELS = 240;    // one wheel event never moves more than ~17.5%

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const minus = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function panOffset(right, up, horizontal, vertical, amount) {
  const size = Math.hypot(horizontal, vertical) || 1;
  return right.map((value, i) => (value * horizontal + up[i] * vertical) / size * amount);
}

// Distance from the camera to the nearest sphere surface in front of it; any sphere if none is ahead.
export function nearestAhead(points, camera, forward, radius = 0) {
  let ahead = Infinity, any = Infinity;
  for (const point of points) {
    const offset = minus(point, camera), distance = Math.max(0, Math.hypot(...offset) - radius);
    any = Math.min(any, distance);
    if (dot(offset, forward) > 0) ahead = Math.min(ahead, distance);
  }
  return Number.isFinite(ahead) ? ahead : any;
}

// Median nearest-neighbour distance over an evenly strided sample of the spheres.
export function typicalSpacing(points, limit = 256) {
  if (points.length < 2) return null;
  const stride = Math.max(1, Math.floor(points.length / limit)), nearest = [];
  for (let i = 0; i < points.length; i += stride) {
    const [x, y, z] = points[i];
    let best = Infinity;
    for (let j = 0; j < points.length; j++) {
      const dx = points[j][0] - x, dy = points[j][1] - y, dz = points[j][2] - z, squared = dx * dx + dy * dy + dz * dz;
      if (squared > 0 && squared < best) best = squared; // coincident spheres are ignored
    }
    if (Number.isFinite(best)) nearest.push(Math.sqrt(best));
  }
  nearest.sort((a, b) => a - b);
  return nearest.length ? nearest[nearest.length >> 1] : null;
}

export function navigationDistance({ nearest, orbit, spacing, extent, minimum = 30 }) {
  const floor = Math.max(minimum, spacing || 0), ceiling = extent > 0 ? Math.max(floor, 2 * extent) : Infinity;
  return clamp(Number.isFinite(nearest) ? nearest : orbit, floor, ceiling);
}

export function keyPanAmount(distance, seconds) {
  return distance * KEY_PAN_RATE * clamp(seconds, 0, MAX_FRAME_SECONDS);
}

// Mouse wheels report lines or pages on some systems; trackpad pinches arrive as small ctrl+wheel deltas.
export function wheelPixels({ deltaY = 0, deltaMode = 0, ctrlKey = false }, pageHeight = 800) {
  let pixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? pageHeight : 1);
  if (ctrlKey) pixels *= 10;
  return clamp(pixels, -MAX_WHEEL_PIXELS, MAX_WHEEL_PIXELS);
}

// Negative pixels move inward. Near the orbit limit the target is carried forward with the
// camera, so inward travel continues through the atlas instead of stopping or crossing the target.
export function wheelMove(pixels, { orbit, distance, minDistance, maxDistance }) {
  const basis = Math.max(orbit, distance), factor = Math.exp(-Math.abs(pixels) * WHEEL_RATE);
  if (pixels < 0) {
    const step = basis * (1 - factor), remaining = orbit - step;
    return { camera: step, target: Math.max(0, minDistance - remaining) };
  }
  return { camera: -Math.min(basis * (1 / factor - 1), Math.max(0, maxDistance - orbit)), target: 0 };
}
