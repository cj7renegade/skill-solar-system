// The helix's orientation aids, built from the map's own fields and drawn by the viewer: the
// milestone spine on the axis, faint rings where build stages begin, a height ruler, and a label at
// the foot of each course band. Nothing here is selectable or changes the map. Maps without the
// fields (no layout of type helix, no build stages, no courses) simply get fewer aids.
import * as THREE from 'three';
import { isHelixMap, helixCourses, courseColors } from './helix.js';

// "rob3:I01" and "hx-sys-ms-i06" -> "I01" / "I06"; other ids have no short code.
export const milestoneCode = node => /(?:^|[:-])(i\d{2})$/i.exec(node.id)?.[1].toUpperCase() ?? null;
// "Milestone I06: integrate and verify …" -> "Integrate and verify …"
const milestoneTitle = node => { const t = node.name.replace(/^Milestone I\d+\s*(\([^)]*\))?:\s*/i, ''); return t.charAt(0).toUpperCase() + t.slice(1); };

// Stage rings: the helix level where each build stage first appears on the humanoid path (the
// brief's rule). Stages that begin within MERGE levels of each other share one ring and label.
export const STAGE_MERGE = 6;
export function stageRings(graph) {
  if (!isHelixMap(graph)) return [];
  const first = new Map();
  for (const n of graph.nodes) if (n.buildStage != null && n.onHumanoidPath !== false && n.helixLevel != null) first.set(n.buildStage, Math.min(first.get(n.buildStage) ?? Infinity, n.helixLevel));
  const names = graph.metadata?.humanoidHelixImport?.buildStages || {}, rings = [];
  for (const [stage, level] of [...first].sort((a, b) => a[0] - b[0])) {
    const last = rings[rings.length - 1];
    if (last && Math.abs(level - last.level) < STAGE_MERGE) { last.stages.push(stage); continue; }
    rings.push({ level, stages: [stage] });
  }
  for (const r of rings) r.label = r.stages.length === 1 ? `Stage ${r.stages[0]} · ${names[r.stages[0]] ?? ''}`.trim() : `Stages ${r.stages[0]}–${r.stages[r.stages.length - 1]} · from ${names[r.stages[0]] ?? ''}`.trim();
  return rings;
}

// place(node) -> the node's drawn position (display spacing and band gaps applied).
// state: { proficient(id), target }. Returns the scene group and the labels to project each frame.
// theme 'cyberpunk': the spine, stage rings and ruler in thin cyan, the rings with tick marks; Classic
// keeps its original colours.
export function buildStructure(graph, place, { target = null, spacing = 1, theme = 'classic' } = {}) {
  const cp = theme === 'cyberpunk';
  const group = new THREE.Group(), labels = [];
  if (!graph?.nodes.length) return { group, labels };
  const milestones = graph.nodes.filter(n => n.nodeKind === 'milestone').map(n => ({ n, p: new THREE.Vector3(...place(n)) })).sort((a, b) => a.p.y - b.p.y);
  milestones.forEach(({ n, p }, i) => {
    const code = milestoneCode(n);
    const title = milestoneTitle(n), short = n.id === target || title.length <= 34 ? title : `${title.slice(0, 33).trimEnd()}…`;
    labels.push({ kind: 'milestone', text: code ? `${code} · ${short}` : short, position: p, side: i % 2 ? -1 : 1, active: n.id === target, done: n.proficiency80 === true });
  });
  if (!isHelixMap(graph)) return { group, labels };

  // The spine: one line through the milestones, bottom to top.
  if (milestones.length > 1) {
    const spine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(milestones.map(m => m.p)), new THREE.LineBasicMaterial({ color: cp ? 0x2ee6f0 : 0xe9bd79, transparent: true, opacity: cp ? .55 : .75 }));
    spine.raycast = () => {}; group.add(spine);
  }
  // How far the helix reaches at each height, for ring and ruler placement.
  const points = graph.nodes.map(n => place(n)), perLevel = (graph.layout.heightPerLevel || 1) * spacing;
  const reachNear = y => { let r = 0; for (const p of points) if (Math.abs(p[1] - y) < perLevel * 6) r = Math.max(r, Math.hypot(p[0], p[2])); return r || 600 * spacing; };
  const reach = Math.max(...points.map(p => Math.hypot(p[0], p[2])));

  for (const ring of stageRings(graph)) {
    const y = (ring.level - 1) * perLevel, radius = reachNear(y) + 90 * spacing;
    const mesh = new THREE.Mesh(new THREE.RingGeometry(radius - (cp ? 2 : 5) * spacing, radius, 160), new THREE.MeshBasicMaterial({ color: cp ? 0x2ee6f0 : 0x9fb3cc, transparent: true, opacity: cp ? .28 : .22, side: THREE.DoubleSide, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; mesh.raycast = () => {}; group.add(mesh);
    if (cp) { // tick marks on the outer edge: every 6°, a long one every 30°
      const ticks = [];
      for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, long = i % 5 === 0, r2 = radius + (long ? 22 : 10) * spacing;
        ticks.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius), new THREE.Vector3(Math.cos(a) * r2, y, Math.sin(a) * r2)); }
      const tickLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ticks), new THREE.LineBasicMaterial({ color: 0x2ee6f0, transparent: true, opacity: .4, depthWrite: false }));
      tickLines.raycast = () => {}; group.add(tickLines);
    }
    labels.push({ kind: 'stage', text: ring.label, position: new THREE.Vector3(radius, y, 0) });
  }

  // The height ruler: a vertical scale beside the helix with a tick every 20 levels.
  const top = graph.layout.topLevel ?? 1, x = -(reach + 220 * spacing), tick = 30 * spacing;
  const ruler = [new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, (top - 1) * perLevel, 0)];
  for (let level = 1; level <= top; level += level === 1 ? 19 : 20) {
    const y = (level - 1) * perLevel;
    ruler.push(new THREE.Vector3(x - tick, y, 0), new THREE.Vector3(x, y, 0));
    labels.push({ kind: 'ruler', text: `L${level}`, position: new THREE.Vector3(x - tick, y, 0) });
  }
  const rulerLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ruler), new THREE.LineBasicMaterial({ color: cp ? 0x1d9aa3 : 0x7f91a8, transparent: true, opacity: cp ? .7 : .55 }));
  rulerLines.raycast = () => {}; group.add(rulerLines);
  labels.push({ kind: 'ruler-title', text: 'Height = helix level: the longest prerequisite chain below a skill. Not difficulty.', position: new THREE.Vector3(x, (top - 1) * perLevel, 0) });

  // Course band labels. A band winds through two turns, so one fixed anchor is often behind the helix.
  // Each course gets anchors up its band (the centre of its skills at nine heights, pushed outward);
  // the viewer shows the label at the anchor that faces the camera, lowest first on ties.
  const colors = courseColors(helixCourses(graph));
  for (const [code, name] of helixCourses(graph)) {
    const own = graph.nodes.filter(n => n.courseCode === code && n.nodeKind !== 'milestone');
    if (!own.length) continue;
    const lv = own.map(n => n.helixLevel ?? 0).sort((a, b) => a - b), anchors = [];
    for (let q = 0.05; q < 0.95; q += 0.1) {
      const level = lv[Math.floor(q * (lv.length - 1))], near = own.filter(n => Math.abs((n.helixLevel ?? 0) - level) <= 4).map(n => place(n));
      const c = near.reduce((s, p) => [s[0] + p[0] / near.length, s[1] + p[1] / near.length, s[2] + p[2] / near.length], [0, 0, 0]);
      const r = Math.hypot(c[0], c[2]) || 1, out = (r + 120 * spacing) / r;
      anchors.push(new THREE.Vector3(c[0] * out, c[1], c[2] * out));
    }
    labels.push({ kind: 'course', text: `${code} · ${name}`, color: colors[code], position: anchors[0], anchors });
  }  return { group, labels };
}
