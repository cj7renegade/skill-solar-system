// Readouts for the Cyberpunk HUD: short monospace codes that always say something true about the
// open map. No fake serials, hex or lorem: every value here is computed from the map itself.

// A skill code like MTH-QNT-022: the course (or domain) code, the skill type (QNT quantitative,
// QL qualitative, NA not stated), and the skill's place in its course, counted lowest helix level first
// (then by name), so it is stable for a given map.
const TYPE_CODE = { QUANT: 'QNT', QUAL: 'QL' };
const QUANT_MODES = /written calculation|calculation and explanation/i;
export const typeOf = node => node.helixType ?? (QUANT_MODES.test(node.assessmentMode || '') ? 'QUANT' : node.assessmentMode ? 'QUAL' : null);
const courseOf = node => (node.courseCode || node.domain || 'GEN').slice(0, 3).toUpperCase();

export function skillCodes(graph) {
  const byCourse = new Map();
  for (const n of graph.nodes) { const c = courseOf(n); if (!byCourse.has(c)) byCourse.set(c, []); byCourse.get(c).push(n); }
  const codes = new Map();
  for (const [course, nodes] of byCourse) {
    nodes.sort((a, b) => (a.helixLevel ?? a.skillLevel ?? 0) - (b.helixLevel ?? b.skillLevel ?? 0) || a.name.localeCompare(b.name) || (a.id < b.id ? -1 : 1));
    nodes.forEach((n, i) => codes.set(n.id, `${course}-${TYPE_CODE[typeOf(n)] ?? 'NA'}-${String(i + 1).padStart(3, '0')}`));
  }
  return codes;
}
export const pad3 = n => String(n).padStart(3, '0');
export const levelReadout = node => node.helixLevel != null ? `LVL ${pad3(node.helixLevel)}` : node.skillLevel != null ? `LVL ${pad3(node.skillLevel)}` : 'LVL ---';
export const stageReadout = node => node.buildStage != null ? `STG-${String(node.buildStage).padStart(2, '0')}` : 'STG --';
export const countReadout = n => n.toLocaleString('en');
// Local date and time, as the learner's clock shows them.
const two = n => String(n).padStart(2, '0');
export const timeReadout = (d = new Date()) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;
