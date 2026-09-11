// Subject halos are sized in the world, never in screen pixels: a halo shrinks and grows with its
// sphere at every distance. Its visible outer diameter, including the soft glow, is at most
// HALO_MAX_DIAMETER_RATIO times the sphere's rendered diameter, measured on screen under
// perspective (a sphere seen off-centre or up close projects larger than its world radius suggests).
export const HALO_MAX_DIAMETER_RATIO = 2;
// Sphere geometry radius in world units, and the size of the selected sphere relative to others.
export const SPHERE_RADIUS = 8;
export const SELECTED_SPHERE_SCALE = 1.35;

// Outer radius (world units) of the halo around a sphere of radius sphereRadius whose centre is at
// center in camera space (camera at the origin looking down −z). The halo's projected extent along
// its longest axis equals ratio × the sphere's; 0 means no halo because the sphere is not wholly in
// front of the camera. Mirrors haloRadius() in HALO_VERTEX_SHADER.
//
// A sphere seen at angle θ from the view axis with angular radius α projects to an ellipse whose
// major axis is sin 2α / (cos²θ − sin²α) focal lengths. Setting the halo's major axis to ratio × the
// sphere's and solving for sin²α gives u below, in a form that stays accurate for tiny angles.
export function haloRadius(sphereRadius, center, ratio = HALO_MAX_DIAMETER_RATIO) {
  const [x, y, z] = center, d2 = x * x + y * y + z * z;
  if (!(sphereRadius > 0) || !(d2 > 0) || z >= 0) return 0;
  const s = sphereRadius * sphereRadius / d2, k = z * z / d2;
  if (s >= 1 || k - s <= 1e-4) return 0;
  const t = ratio * 2 * Math.sqrt(s * (1 - s)) / (k - s);
  const u = k * k * t * t / (2 + k * t * t + 2 * Math.sqrt(1 + k * (1 - k) * t * t));
  if (k - u <= 1e-4) return 0;
  return Math.min(ratio * sphereRadius, Math.sqrt(d2 * u));
}

// Brightness across the halo, from the sphere's edge (0) to the halo's outer edge (1): a clear gap
// beside the sphere, a ring, then a glow that has faded to nothing at the outer edge.
export function haloAlpha(rho) {
  const x = Math.min(1, Math.max(0, rho)), step = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  return step(0.12, 0.38, x) * (1 - step(0.45, 1, x));
}

export const HALO_VERTEX_SHADER = `
uniform float ratio;
uniform float sphereRadius;
varying vec3 vPoint;
varying vec3 vCenter;
varying float vInner;
varying float vOuter;
float haloRadius(float r, vec3 c) {
  float d2 = dot(c, c);
  if (c.z >= 0.0) return 0.0;
  float s = r * r / d2, k = c.z * c.z / d2;
  if (s >= 1.0 || k - s <= 1e-4) return 0.0;
  float t = ratio * 2.0 * sqrt(s * (1.0 - s)) / (k - s);
  float u = k * k * t * t / (2.0 + k * t * t + 2.0 * sqrt(1.0 + k * (1.0 - k) * t * t));
  if (k - u <= 1e-4) return 0.0;
  return min(ratio * r, sqrt(d2 * u));
}
void main() {
  vec4 center = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  // The instance matrix carries the sphere's own scale (1 or the selection scale).
  float inner = sphereRadius * length(instanceMatrix[0].xyz);
  float outer = haloRadius(inner, center.xyz);
  vec3 point = center.xyz + mat3(modelViewMatrix) * normalize(position) * outer;
  vPoint = point; vCenter = center.xyz; vInner = inner; vOuter = outer;
  gl_Position = projectionMatrix * vec4(point, 1.0);
}`;

export const HALO_FRAGMENT_SHADER = `
uniform vec3 color;
uniform float opacity;
varying vec3 vPoint;
varying vec3 vCenter;
varying float vInner;
varying float vOuter;
float band(float a, float b, float v) { return smoothstep(a, b, v); }
void main() {
  // Closest approach of this pixel's view ray to the sphere centre: vInner at the sphere's
  // silhouette and vOuter at the halo's. Stable at overview distances, unlike an angle.
  float reach = length(cross(vCenter, normalize(vPoint)));
  float rho = clamp((reach - vInner) / max(vOuter - vInner, 1e-6), 0.0, 1.0);
  float alpha = band(0.12, 0.38, rho) * (1.0 - band(0.45, 1.0, rho));
  gl_FragColor = vec4(color, alpha * opacity);
  #include <colorspace_fragment>
}`;
