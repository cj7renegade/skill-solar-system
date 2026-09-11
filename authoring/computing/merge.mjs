// Adds the Computing edition to an atlas without moving or rewriting existing skills, and derives
// the Computing-with-prerequisites sub-map. Pure functions: callers decide what to write.
import { validate, levels, clone } from '../../src/model.js';
import { referenceLevels, arrangeVortex } from '../../src/vortex.js';
import { EDITION, REFERENCES, CHECKLIST, BEYOND_CHECKLIST, edition } from './index.mjs';

export const SUBMAP_TITLE = 'Skill Solar System / Computing + prerequisites';
export const edgeKey = e => JSON.stringify(e.type === 'related' ? [e.type, ...[e.source, e.target].sort()] : [e.type, e.source, e.target]);
const listNames = names => names.length <= 2 ? names.join(' and ') : `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;

// Reader-facing placement in two sentences, built from the node's recorded prerequisites.
function placementNote(graph, node, depth) {
  const names = new Map(graph.nodes.map(n => [n.id, n.name]));
  const inputs = graph.edges.filter(e => e.type === 'prerequisite' && e.target === node.id).map(e => names.get(e.source));
  if (!inputs.length) return `Reference level ${node.skillLevel}/100: it has no recorded prerequisites, so it starts the Computing strand of the spiral. The level is an editorial dependency rank, not a difficulty rating or your proficiency.`;
  const basis = node.skillLevel === 1 + 3 * depth ? `1 + 3 × its prerequisite depth of ${depth}` : `its prerequisite depth of ${depth}, raised to stay above its highest prerequisite`;
  return `Reference level ${node.skillLevel}/100 comes from ${basis}, placing it in the Computing strand above ${listNames(inputs)}. The level is an editorial dependency rank, not a difficulty rating or your proficiency.`;
}

export function mergeComputing(atlas, content = edition(), { today = EDITION.created } = {}) {
  validate(atlas);
  const graph = clone(atlas), existing = new Map(atlas.nodes.map(n => [n.id, n])), added = [], refreshed = [];
  for (const n of content.nodes) {
    const old = existing.get(n.id);
    if (old && old.domain !== 'Computing') throw Error(`${n.id} already exists as a ${old.domain} skill.`);
    const urls = [...new Set(n.refs.flatMap(key => { if (!REFERENCES[key]) throw Error(`${n.id} cites unknown reference ${key}.`); return REFERENCES[key].urls; }))];
    const node = { id: n.id, name: n.name, domain: 'Computing', subdomain: n.subdomain, nodeKind: 'skill', description: n.description, details: n.details,
      position: [0, 0, 0], pinned: false, proficiency80: null, icon: n.icon, layoutMode: 'vortex', placementNote: '',
      sourceRefs: n.refs, referenceURLs: urls,
      sourceAlignment: 'Authored scope; coverage and accuracy checked against the listed public curricula and official documentation. Not a lesson-level match.',
      descriptionStatus: `Original reference text written ${today}; no source lesson text was imported.` };
    if (old) {
      // A rerun refreshes authored text but keeps everything the user or the layout owns.
      Object.assign(node, { position: old.position, pinned: old.pinned, proficiency80: old.proficiency80 ?? null, layoutMode: old.layoutMode, skillLevel: old.skillLevel });
      graph.nodes[graph.nodes.findIndex(x => x.id === n.id)] = node; refreshed.push(n.id);
    } else { graph.nodes.push(node); added.push(n.id); }
  }
  const ids = new Set(graph.nodes.map(n => n.id)), seen = new Set(graph.edges.map(edgeKey)), newEdges = [], duplicates = [];
  for (const e of content.edges) {
    for (const end of [e.source, e.target]) if (!ids.has(end)) throw Error(`Connection ${e.source} → ${e.target} points to missing skill ${end}.`);
    if (!e.rationale?.trim()) throw Error(`Connection ${e.source} → ${e.target} has no rationale.`);
    const key = edgeKey(e);
    if (seen.has(key)) { duplicates.push(key); continue; }
    seen.add(key); graph.edges.push(e); newEdges.push(e);
  }
  validate(graph); // rejects prerequisite cycles
  // Levels: new skills get 1 + 3 × depth, raised above any prerequisite; saved levels are kept.
  const fresh = new Set(added), depth = levels(graph);
  const ranks = referenceLevels(graph, true);
  const levelConflicts = graph.nodes.filter(n => !fresh.has(n.id) && n.skillLevel != null && ranks.get(n.id) !== n.skillLevel).map(n => ({ id: n.id, saved: n.skillLevel, needed: ranks.get(n.id) }));
  for (const n of graph.nodes) if (fresh.has(n.id)) n.skillLevel = ranks.get(n.id);
  // Coordinates: only the new skills are placed, in the Computing ribbon of the existing spiral.
  const arranged = new Map(arrangeVortex(graph).nodes.map(n => [n.id, n.position]));
  for (const n of graph.nodes) if (fresh.has(n.id)) n.position = arranged.get(n.id);
  for (const n of graph.nodes) if (fresh.has(n.id) || refreshed.includes(n.id)) n.placementNote = placementNote(graph, n, depth.get(n.id));
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  // Summary counts describe the whole edition as it now stands in the map, so a rerun reports the same.
  const crossDomain = content.edges.filter(e => byId.get(e.source).domain !== 'Computing' || byId.get(e.target).domain !== 'Computing');
  const reused = [...new Set(crossDomain.flatMap(e => [e.source, e.target]).filter(id => byId.get(id).domain !== 'Computing'))].sort();
  const maxLevel = Math.max(...graph.nodes.map(n => n.skillLevel ?? 1));
  if (graph.levelModel?.usedRange && maxLevel > graph.levelModel.usedRange[1]) graph.levelModel.usedRange = [graph.levelModel.usedRange[0], maxLevel];
  const count = type => content.edges.filter(e => e.type === type).length;
  graph.computingExpansion = {
    edition: EDITION.id, version: EDITION.version, created: EDITION.created,
    addedSkills: graph.nodes.filter(n => n.domain === 'Computing').length, reusedSkills: reused,
    approach: 'Original skills, descriptions, and editorial relationships for a coherent Computing foundation edition aimed at robotics. Not exhaustive and not an official curriculum graph; prerequisites are necessary at each skill\'s stated scope, supports are useful preparation, and related links carry no order.',
    placement: 'New skills sit in the Computing ribbon of the existing spiral at 1 + 3 × prerequisite depth. Existing skills, coordinates, pins, levels, and proficiency were not changed.',
    connections: { prerequisite: count('prerequisite'), supports: count('supports'), related: count('related'), crossDomain: crossDomain.length },
    checklist: CHECKLIST, beyondChecklist: BEYOND_CHECKLIST,
    referenceRegister: REFERENCES,
    referencePolicy: 'References record where coverage and accuracy were checked. They are stored separately from the authored descriptions and relationship rationales; no source text was copied, and course listing order was not treated as a prerequisite.'
  };
  validate(graph);
  return { graph, report: { added, refreshed, newEdges: newEdges.length, duplicates, crossDomain: crossDomain.length, reused, levelConflicts, maxLevel } };
}

// The sub-map: every Computing skill plus its full prerequisite closure, copied unchanged from the
// master, with every master connection whose two ends are both included.
export function computingSubmap(master, title = SUBMAP_TITLE) {
  const incoming = new Map(master.nodes.map(n => [n.id, []]));
  for (const e of master.edges) if (e.type === 'prerequisite') incoming.get(e.target).push(e.source);
  const keep = new Set(), stack = master.nodes.filter(n => n.domain === 'Computing').map(n => n.id);
  while (stack.length) { const id = stack.pop(); if (keep.has(id)) continue; keep.add(id); stack.push(...incoming.get(id)); }
  const sub = {};
  for (const [key, value] of Object.entries(master)) sub[key] = key === 'title' ? title : key === 'nodes' ? master.nodes.filter(n => keep.has(n.id)) : key === 'edges' ? master.edges.filter(e => keep.has(e.source) && keep.has(e.target)) : value;
  return validate(clone(sub));
}

// Minimum distance from each listed node to every other node, for spacing checks.
export function clearance(graph, ids) {
  const wanted = new Set(ids);
  let nearest = { distance: Infinity };
  for (const a of graph.nodes) if (wanted.has(a.id)) for (const b of graph.nodes) if (b.id !== a.id) {
    const d = Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1], a.position[2] - b.position[2]);
    if (d < nearest.distance) nearest = { distance: d, a: a.id, b: b.id };
  }
  return nearest;
}
