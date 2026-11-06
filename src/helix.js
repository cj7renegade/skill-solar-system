// The helix layout and its course-based display, used only by maps whose layout type is 'helix'
// (Maps/Humanoid-Helix-Atlas.json). Every other map keeps the vortex, the six domain colours and the
// original markers: nothing here runs unless isHelixMap(graph) is true.
//
// Height is the helix level, 1 + 3 x the longest prerequisite chain below a skill. Around the axis,
// each course owns an equal angular sector, in the course order the map declares, and the sectors
// wind upward together, so a course reads as one band. Milestones sit on the central axis.
import { clone, levels, validate } from './model.js';

export const isHelixMap = graph => graph?.layout?.type === 'helix';

// The map's courses in order, as [code, name] pairs (metadata.courses).
export const helixCourses = graph => graph?.metadata?.courses ?? [];

// One colour per course: hues evenly spaced around the colour wheel, in course order, at the
// lightness the six domain colours use, so 16 bands stay distinguishable on the dark background.
export function courseColors(courses) {
  const out = {};
  courses.forEach(([code], i) => { out[code] = hsl(i * 360 / courses.length + 20, 68, 66); });
  return out;
}
function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

// A skill's tier (Core, Working, Specialist, Enrichment, Checkpoint, Milestone): new skills carry it
// as helixTier; Atlas skills, whose fields stay unchanged, have it in the import's lookup table.
export const tierOf = (graph, node) => node.helixTier ?? graph?.metadata?.humanoidHelixImport?.atlasTiers?.[node.id] ?? null;

// The helix level from the map's own prerequisites, for every skill.
export function helixLevels(graph) {
  const depth = levels(graph), out = new Map();
  for (const [id, d] of depth) out.set(id, 1 + 3 * d);
  return out;
}

// The filters a helix map offers. An empty value means "any".
export const HELIX_FILTERS = ['course', 'stage', 'path', 'tier'];
export function matchesHelixFilters(graph, node, filters = {}) {
  if (filters.course && node.courseCode !== filters.course) return false;
  if (filters.stage && String(node.buildStage ?? 'none') !== String(filters.stage)) return false;
  if (filters.path && String(node.onHumanoidPath === true) !== filters.path) return false;
  if (filters.tier && tierOf(graph, node) !== filters.tier) return false;
  return true;
}
export const activeFilters = filters => HELIX_FILTERS.filter(k => filters?.[k]);

// The vertical range the vortex uses (100 levels x 64), kept for the helix so the camera, grid and
// navigation scale exactly as on other maps: the top level sits at the same height as level 100.
export const HELIX_HEIGHT = 99 * 64;
const TURNS = 2;

export function arrangeHelix(graph) {
  validate(graph);
  const result = clone(graph), level = helixLevels(result);
  const courses = helixCourses(result).map(([code]) => code);
  const sector = 2 * Math.PI / Math.max(1, courses.length);
  const top = Math.max(2, ...level.values()), perLevel = HELIX_HEIGHT / (top - 1);
  const groups = new Map(), axis = [];
  for (const n of result.nodes) {
    if (n.pinned) continue;
    if (n.nodeKind === 'milestone') { axis.push(n); continue; }
    const key = `${n.courseCode}:${level.get(n.id)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(n);
  }
  for (const peers of groups.values()) {
    peers.sort((a, b) => (a.subdomain || '').localeCompare(b.subdomain || '') || a.id.localeCompare(b.id));
    const lv = level.get(peers[0].id), t = (lv - 1) / (top - 1);
    const index = Math.max(0, courses.indexOf(peers[0].courseCode));
    const center = index * sector + t * TURNS * 2 * Math.PI;
    const baseRadius = 700 + 900 * t, arc = sector * 0.8;
    const columns = Math.max(2, Math.floor(baseRadius * arc / 58));
    peers.forEach((n, i) => {
      const row = Math.floor(i / columns), count = Math.min(columns, peers.length - row * columns);
      const theta = center + ((i % columns + 0.5) / count - 0.5) * arc, radius = baseRadius + row * 60;
      n.position = [Math.cos(theta) * radius, (lv - 1) * perLevel, Math.sin(theta) * radius].map(v => Math.round(v * 1000) / 1000);
    });
  }
  // Milestones on the central axis, one above another; two at the same level step apart sideways.
  const used = new Map();
  for (const n of axis.sort((a, b) => level.get(a.id) - level.get(b.id) || a.id.localeCompare(b.id))) {
    const lv = level.get(n.id), k = used.get(lv) || 0; used.set(lv, k + 1);
    n.position = [k * 40, (lv - 1) * perLevel, 0];
  }
  result.layout = { type: 'helix', version: 1, turns: TURNS, heightPerLevel: Math.round(perLevel * 1e6) / 1e6, topLevel: top,
    courseOrder: courses,
    levelMeaning: 'Helix level = 1 + 3 x the longest prerequisite chain below a skill; height scales so the top level sits where level 100 does on other maps. Not proficiency or a standardized difficulty scale.' };
  return validate(result);
}
