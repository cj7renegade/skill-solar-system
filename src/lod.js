// Level of detail for large maps. Zoomed out, each subject (course + subject on helix maps, domain +
// subject elsewhere) is drawn as one cluster sphere at its skills' centre, sized by skill count, with
// a gold core whose volume is the share marked proficient. Zoomed in, the individual skills return.
// Display only: no position is computed into the map, and nothing here changes an answer.
import * as THREE from 'three';
import { DOMAINS } from './model.js';

export const LOD_MIN_NODES = 400;        // smaller maps always show every skill
// Detail shows when the camera is closer to the map than this fraction of the map's size.
export const LOD_NEAR = 0.45;
export const clusterKey = n => `${n.courseCode ?? n.domain}|${n.subdomain || '—'}`;

export function clusterData(graph, place) {
  const groups = new Map();
  for (const n of graph.nodes) {
    if (n.nodeKind === 'milestone') continue;
    const key = clusterKey(n);
    if (!groups.has(key)) groups.set(key, { key, name: n.subdomain || n.domain, course: n.courseCode ?? null, domain: n.domain, ids: [], sum: [0, 0, 0], yes: 0 });
    const g = groups.get(key), p = place(n);
    g.ids.push(n.id); g.sum[0] += p[0]; g.sum[1] += p[1]; g.sum[2] += p[2]; if (n.proficiency80 === true) g.yes++;
  }
  return [...groups.values()].map(g => ({ ...g, count: g.ids.length, centre: g.sum.map(v => v / g.ids.length), radius: 24 + 13 * Math.sqrt(g.ids.length), done: g.yes / g.ids.length }));
}

// Two instanced meshes: a translucent shell in the subject's colour, and a gold core.
const shellGeometry = new THREE.SphereGeometry(1, 20, 14), coreGeometry = new THREE.SphereGeometry(1, 14, 10);
export function clusterMeshes(clusters, palette) {
  const shell = new THREE.InstancedMesh(shellGeometry, new THREE.MeshStandardMaterial({ roughness: .5, metalness: .1, transparent: true, opacity: .55, depthWrite: false }), Math.max(1, clusters.length));
  const core = new THREE.InstancedMesh(coreGeometry, new THREE.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xf2c14e, emissiveIntensity: .35, roughness: .3, transparent: true, opacity: 1 }), Math.max(1, clusters.length));
  const m = new THREE.Matrix4(), color = new THREE.Color();
  clusters.forEach((c, i) => {
    m.makeScale(c.radius, c.radius, c.radius).setPosition(...c.centre); shell.setMatrixAt(i, m);
    shell.setColorAt(i, color.set((c.course && palette?.[c.course]) || DOMAINS[c.domain] || '#9aa4b2'));
    const r = c.done > 0 ? c.radius * Math.cbrt(c.done) * .92 : 0;   // the core's volume is the proficient share
    m.makeScale(r || 1e-4, r || 1e-4, r || 1e-4).setPosition(...c.centre); core.setMatrixAt(i, m);
  });
  shell.count = core.count = clusters.length;
  shell.instanceMatrix.needsUpdate = core.instanceMatrix.needsUpdate = true;
  if (shell.instanceColor) shell.instanceColor.needsUpdate = true;
  shell.computeBoundingSphere(); core.computeBoundingSphere();
  core.raycast = () => {};
  return { shell, core };
}

// Whether the camera is close enough for individual skills: distance from the camera to the map's
// bounding box, against the map's size.
export function wantsDetail(cameraPosition, box, nodeCount) {
  if (nodeCount < LOD_MIN_NODES || box.isEmpty()) return true;
  const size = box.getSize(new THREE.Vector3()).length();
  return box.distanceToPoint(cameraPosition) < LOD_NEAR * size;
}

// Picks which labels to show this frame: candidates in priority order (always-shown first, then
// nearest), each a screen rectangle; a label is placed only if it overlaps none already placed, up to
// the budget. Returns the set of placed candidates.
export const LABEL_BUDGET = 60;
export function placeLabels(candidates, budget = LABEL_BUDGET) {
  const placed = [], shown = new Set();
  let counted = 0;   // the budget counts labels placed by priority, not the ones that must always show
  for (const c of candidates) {
    if (!c.always && counted >= budget) continue;
    const r = c.rect;
    if (!c.always && placed.some(q => r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h && q.y < r.y + r.h)) continue;
    placed.push(r); shown.add(c); if (!c.always) counted++;
  }
  return shown;
}
