// Shared integration for supplied content batches. A batch is content, not a map: it carries no
// positions, levels, or answers, and this module supplies them from the atlas it is merging into.
// Nothing that already exists is moved, renamed, or re-answered, and applying a batch twice changes
// nothing. Callers decide what to write.
import { validate, levels, clone, DOMAINS } from '../src/model.js';
import { referenceLevels } from '../src/vortex.js';

// Authoring-only fields: the batches state these are requests, not runtime data.
const AUTHORING_ONLY = ['layoutRequest'];
const OVERVIEW_POLICY = 'The broader overview skills are kept exactly as they were. Their links to these narrower abilities are related links recording scope overlap: they carry no learning order and never transfer an answer. Node totals are not counts of independent competencies.';
const LAYOUT_REQUEST_HANDLING = 'The batch\'s layoutRequest is authoring-only and is not copied into map data; levels and coordinates were derived here after reconciliation.';
const SOURCE_POLICY = 'Sources record where coverage and facts were checked. Descriptions, skill boundaries, and relationship rationales are original editorial authoring, not a publisher dependency map.';

export const edgeKey = e => JSON.stringify(e.type === 'related' ? [e.type, ...[e.source, e.target].sort()] : [e.type, e.source, e.target]);
export const normalizeName = name => String(name).toLowerCase().split(/\s+/).join(' ');

// Places new skills in the spiral the atlas already uses, in rows beyond the ones their domain and
// level occupy, so every existing sphere keeps its exact saved coordinates.
function placeNewSkills(graph, fresh) {
  const groups = new Map();
  for (const node of graph.nodes) {
    const key = `${node.domain}:${node.skillLevel}`;
    if (!groups.has(key)) groups.set(key, { taken: 0, added: [] });
    const group = groups.get(key);
    if (fresh.has(node.id)) group.added.push(node); else group.taken++;
  }
  for (const [key, group] of groups) {
    if (!group.added.length) continue;
    const level = Number(key.slice(key.lastIndexOf(':') + 1)), domain = key.slice(0, key.lastIndexOf(':'));
    const t = (level - 1) / 99, center = Object.keys(DOMAINS).indexOf(domain) * Math.PI / 3 + t * Math.PI * 4;
    const baseRadius = 420 + 580 * t, arc = Math.PI / 3 * 0.76;
    const columns = Math.max(3, Math.floor(baseRadius * arc / 62));
    const firstFreeRow = Math.ceil(group.taken / columns);
    group.added.sort((a, b) => (a.subdomain || '').localeCompare(b.subdomain || '') || a.id.localeCompare(b.id));
    group.added.forEach((node, i) => {
      const row = Math.floor(i / columns), peersInRow = Math.min(columns, group.added.length - row * columns);
      const theta = center + ((i % columns + 0.5) / peersInRow - 0.5) * arc, radius = baseRadius + (firstFreeRow + row) * 70;
      node.position = [Math.cos(theta) * radius, (level - 1) * 64, Math.sin(theta) * radius].map(v => Math.round(v * 1000) / 1000);
      node.layoutMode = 'vortex';
    });
  }
}

function toSkill(record, batch, today, expansion) {
  const urls = [...new Set(record.sourceRefs.map(key => {
    if (!batch.sources[key]) throw Error(`${record.id} cites unknown source ${key}.`);
    return batch.sources[key].url;
  }))];
  const skill = {
    id: record.id, name: record.name, domain: record.domain, subdomain: record.subdomain, nodeKind: 'skill',
    description: record.description, details: record.details,
    position: [0, 0, 0], pinned: false, proficiency80: null, icon: record.icon, layoutMode: 'vortex',
    placementNote: record.placementNote,
    sourceRefs: record.sourceRefs, referenceURLs: urls,
    proficiencyReference: record.proficiencyReference, scopeNote: record.scopeNote,
    contentAuthorship: record.contentAuthorship, authoringOrigin: record.authoringOrigin,
    sourceAlignment: 'Authored scope checked against the listed public references; not an official prerequisite graph.',
    descriptionStatus: `Original editorial text supplied by ${expansion.edition} and integrated ${today}; no source text was imported.`
  };
  for (const field of AUTHORING_ONLY) if (field in skill) delete skill[field];
  return skill;
}

// `expansion` names the batch and the top-level key its record is written under; `placement` says in
// one sentence where the new skills went; `extra` adds batch-specific notes to that record.
export function mergeBatch(atlas, batch, { expansion, expansionKey, placement, extra = {}, today = expansion.created } = {}) {
  validate(atlas);
  const graph = clone(atlas), existing = new Map(atlas.nodes.map(n => [n.id, n]));
  const byName = new Map(atlas.nodes.map(n => [normalizeName(n.name), n]));
  // A name already used by a different skill is a scope question for a person, never an overwrite.
  const nameConflicts = batch.nodes.filter(r => byName.has(normalizeName(r.name)) && byName.get(normalizeName(r.name)).id !== r.id)
    .map(r => ({ batchId: r.id, existingId: byName.get(normalizeName(r.name)).id, name: r.name }));
  if (nameConflicts.length) throw Error(`Names already used by other skills: ${nameConflicts.map(c => `${c.name} (${c.existingId})`).join('; ')}`);

  const added = [], refreshed = [];
  for (const record of batch.nodes) {
    const old = existing.get(record.id);
    if (old && old.domain !== record.domain) throw Error(`${record.id} already exists as a ${old.domain} skill.`);
    const skill = toSkill(record, batch, today, expansion);
    if (old) {
      // A rerun refreshes authored text and keeps everything the user or the layout owns.
      Object.assign(skill, { position: old.position, pinned: old.pinned, proficiency80: old.proficiency80 ?? null, layoutMode: old.layoutMode, skillLevel: old.skillLevel });
      graph.nodes[graph.nodes.findIndex(n => n.id === record.id)] = skill;
      refreshed.push(record.id);
    } else { graph.nodes.push(skill); added.push(record.id); }
  }

  const ids = new Set(graph.nodes.map(n => n.id)), seen = new Set(graph.edges.map(edgeKey));
  const newEdges = [], duplicates = [];
  for (const edge of batch.edges) {
    for (const end of [edge.source, edge.target]) if (!ids.has(end)) throw Error(`Connection ${edge.source} → ${edge.target} points to missing skill ${end}.`);
    if (!edge.rationale?.trim()) throw Error(`Connection ${edge.source} → ${edge.target} has no rationale.`);
    const key = edgeKey(edge);
    if (seen.has(key)) { duplicates.push(key); continue; }
    seen.add(key); graph.edges.push({ source: edge.source, target: edge.target, type: edge.type, authorship: edge.authorship, rationale: edge.rationale }); newEdges.push(edge);
  }
  validate(graph); // rejects prerequisite cycles and duplicate edges

  // Levels come from recorded prerequisite depth and must stay above every prerequisite. Saved
  // levels are preserved, so only the new skills receive one.
  const fresh = new Set(added);
  for (const node of graph.nodes) if (fresh.has(node.id)) delete node.skillLevel;
  const depth = levels(graph), ranks = referenceLevels(graph, true);
  const levelConflicts = graph.nodes.filter(n => !fresh.has(n.id) && n.skillLevel != null && ranks.get(n.id) !== n.skillLevel)
    .map(n => ({ id: n.id, saved: n.skillLevel, needed: ranks.get(n.id) }));
  for (const node of graph.nodes) if (fresh.has(node.id)) node.skillLevel = ranks.get(node.id);
  placeNewSkills(graph, fresh);

  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const external = [...new Set(batch.edges.flatMap(e => [e.source, e.target]).filter(id => !batch.nodes.some(n => n.id === id)))].sort();
  const count = type => batch.edges.filter(e => e.type === type).length;
  const maxLevel = Math.max(...graph.nodes.map(n => n.skillLevel ?? 1));
  if (graph.levelModel?.usedRange && maxLevel > graph.levelModel.usedRange[1]) graph.levelModel.usedRange = [graph.levelModel.usedRange[0], maxLevel];
  graph[expansionKey] = {
    edition: expansion.edition, version: expansion.version, batchDate: batch.date ?? null, integrated: today,
    scope: batch.scope ?? null,
    addedSkills: graph.nodes.filter(n => n.authoringOrigin === expansion.origin).length,
    reusedSkills: external,
    connections: { prerequisite: count('prerequisite'), supports: count('supports'), related: count('related') },
    overviewMappings: batch.overviewMappings,
    overviewPolicy: OVERVIEW_POLICY,
    placement,
    layoutRequestHandling: LAYOUT_REQUEST_HANDLING,
    sources: batch.sources,
    sourcePolicy: SOURCE_POLICY,
    ...extra
  };
  validate(graph);
  return { graph, report: { added, refreshed, newEdges: newEdges.length, duplicates, nameConflicts, levelConflicts, external, maxLevel, depthRange: added.length ? [Math.min(...added.map(id => depth.get(id))), Math.max(...added.map(id => depth.get(id)))] : [], levelRange: added.length ? [Math.min(...added.map(id => byId.get(id).skillLevel)), Math.max(...added.map(id => byId.get(id).skillLevel))] : [] } };
}

// Every batch skill in the master plus the full prerequisite ancestry, copied unchanged.
export function batchSubmap(master, batch, title) {
  const incoming = new Map(master.nodes.map(n => [n.id, []]));
  for (const edge of master.edges) if (edge.type === 'prerequisite') incoming.get(edge.target).push(edge.source);
  const seeds = batch.nodes.map(n => n.id).filter(id => incoming.has(id));
  const keep = new Set(), stack = [...seeds];
  while (stack.length) { const id = stack.pop(); if (keep.has(id)) continue; keep.add(id); stack.push(...incoming.get(id)); }
  const sub = {};
  for (const [key, value] of Object.entries(master)) sub[key] = key === 'title' ? title
    : key === 'nodes' ? master.nodes.filter(n => keep.has(n.id))
    : key === 'edges' ? master.edges.filter(e => keep.has(e.source) && keep.has(e.target)) : value;
  return validate(clone(sub));
}

// Closest approach between any listed skill and any other, for spacing checks.
export function clearance(graph, ids) {
  const wanted = new Set(ids);
  let nearest = { distance: Infinity };
  for (const a of graph.nodes) if (wanted.has(a.id)) for (const b of graph.nodes) if (b.id !== a.id) {
    const d = Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1], a.position[2] - b.position[2]);
    if (d < nearest.distance) nearest = { distance: d, a: a.id, b: b.id };
  }
  return nearest;
}
