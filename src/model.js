import { profileFor } from './knowledge.js';
import { ICONS, DOMAIN_ICON } from './icons.js';
export const DOMAINS = {
  Mathematics: '#f0b967', Physics: '#c997fb', Mechanics: '#ef9290',
  Electronics: '#72d7c5', Computing: '#79baff', Robotics: '#e3d889'
};
export const TYPES = ['prerequisite', 'supports', 'related'];
export const clone = value => JSON.parse(JSON.stringify(value));
// Proficiency colouring shows two states only: green for skills marked Yes, red for everything else,
// including skills that have not been answered yet. The answer itself is still Yes, No, or unmarked;
// only the colour groups them.
export const PROFICIENCY_COLORS = { yes:'#32CD32', no:'#ef9290' };
export function proficiencyLabel(value) { return value === true ? 'Yes · at least 80%' : value === false ? 'No · below 80%' : 'Not marked'; }
export function nodeColor(node, proficiency) {
  return proficiency ? PROFICIENCY_COLORS[node.proficiency80 === true ? 'yes' : 'no'] : DOMAINS[node.domain];
}
export function normalize(graph) {
  validate(graph);
  const result = clone(graph);
  for(const node of result.nodes) {
    const profile = profileFor(node);
    node.details ??= profile ? profile.slice(2).join('\n\n') : '';
    node.icon ??= profile?.[0] || DOMAIN_ICON[node.domain];
    node.proficiency80 ??= null;
    node.placementNote ??= '';
    node.layoutMode ??= 'saved';
  }
  return validate(result);
}
export function positionExplanation(graph, node) {
  const names = new Map(graph.nodes.map(n=>[n.id,n.name]));
  const inputs = graph.edges.filter(e=>e.target===node.id && e.type==='prerequisite').map(e=>names.get(e.source));
  const depth = levels(graph).get(node.id);
  const coordinates = node.position.map(v=>Math.round(v*100)/100).join(', ');
  const method = node.layoutMode === 'vortex' ? `Its saved spiral placement uses reference level ${node.skillLevel}/100 for height and domain ribbons for angle. Peers spread outward for spacing. Level is a provisional dependency rank, not measured difficulty. An edited level changes height only after arranging again.` : node.layoutMode === 'prerequisites' ? 'Its last placement used Arrange by prerequisites: domain columns and prerequisite depth set unpinned positions.' : node.layoutMode === 'manual' ? 'Its coordinates were placed manually.' : 'These are saved coordinates; their original placement method is not recorded.';
  const prerequisites = inputs.length ? `Its immediate prerequisites are ${inputs.join(', ')}. Its prerequisite depth is ${depth}.` : 'It has no recorded incoming prerequisite links, so its calculated prerequisite depth is zero. This does not prove that the subject needs no preparation.';
  return `Position (X, Y, Z): ${coordinates}. ${method} ${prerequisites} Supports and related links do not determine automatic height. ${node.pinned ? 'It is pinned against automatic arrangement.' : 'It is not pinned.'} Map height is not a proficiency score.`;
}
export const LEVEL_NOTE = 'Reference levels (1–100) are editorial ranks derived from recorded prerequisites. They set height in the spiral and are separate from your proficiency marking.';
const listNames = names => names.length <= 2 ? names.join(' and ') : `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
// Reader-facing placement in at most two sentences, built only from the node's own edges.
export function placementSummary(graph, node) {
  const names = new Map(graph.nodes.map(n => [n.id, n.name]));
  const linked = (type, end) => graph.edges.filter(e => e.type === type && e[end] === node.id).map(e => names.get(end === 'target' ? e.source : e.target));
  const prerequisites = linked('prerequisite', 'target');
  const builds = prerequisites.length ? `builds on ${listNames(prerequisites)}` : 'has no recorded prerequisites';
  const first = node.layoutMode === 'vortex' ? `In the ${node.domain} strand of the spiral, it ${builds}.`
    : node.layoutMode === 'prerequisites' ? (prerequisites.length ? `In the ${node.domain} column, it sits above ${listNames(prerequisites)}.` : `It starts the ${node.domain} column because it has no recorded prerequisites.`)
    : node.layoutMode === 'manual' ? `It was positioned by hand and ${builds}.`
    : `It keeps a saved position from an earlier layout and ${builds}.`;
  const leads = linked('prerequisite', 'source'), supports = linked('supports', 'source');
  const related = graph.edges.filter(e => e.type === 'related' && (e.source === node.id || e.target === node.id)).map(e => names.get(e.source === node.id ? e.target : e.source));
  const second = node.pinned ? 'It is pinned, so automatic layouts leave it in place.'
    : leads.length ? `It leads to ${listNames(leads)}.` : supports.length ? `It supports ${listNames(supports)}.` : related.length ? `It is related to ${listNames(related)}.` : '';
  return second ? `${first} ${second}` : first;
}
export function validate(graph) {
  if (!graph || graph.schemaVersion !== 1 || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) throw Error('Expected a version 1 Skill Solar System map.');
  if (graph.nodes.length > 5000 || graph.edges.length > 20000) throw Error('This version supports at most 5,000 nodes and 20,000 connections.');
  const ids = new Set();
  for (const n of graph.nodes) {
    if (typeof n.id !== 'string' || !n.id.length || n.id.length > 100 || ids.has(n.id)) throw Error('Node IDs must be unique, nonempty strings.');
    ids.add(n.id);
    if (typeof n.name !== 'string' || !n.name.trim() || n.name.length > 120) throw Error('Each node needs a name of 1–120 characters.');
    if (!Object.hasOwn(DOMAINS, n.domain)) throw Error('Unknown domain.');
    if (typeof n.description !== 'string' || n.description.length > 5000) throw Error('Descriptions must be text under 5,001 characters.');
    if (typeof n.pinned !== 'boolean') throw Error('Pinned must be true or false.');
    if(n.skillLevel !== undefined && n.skillLevel !== null && (!Number.isInteger(n.skillLevel)||n.skillLevel<1||n.skillLevel>100)) throw Error('Reference level must be a whole number from 1 to 100.');
    if (n.proficiency80 !== undefined && n.proficiency80 !== null && typeof n.proficiency80 !== 'boolean') throw Error('Proficiency must be Yes, No, or unmarked.');
    for(const key of ['details','placementNote']) if(n[key] !== undefined && (typeof n[key] !== 'string' || n[key].length>12000)) throw Error(`${key} must be text of at most 12,000 characters.`);
    if(n.icon !== undefined && !Object.hasOwn(ICONS,n.icon)) throw Error('Unknown skill icon.');
    if(n.layoutMode !== undefined && !['saved','manual','prerequisites','vortex'].includes(n.layoutMode)) throw Error('Unknown layout method.');
    if (!Array.isArray(n.position) || n.position.length !== 3 || !n.position.every(v => Number.isFinite(v) && Math.abs(v) <= 100000)) throw Error('Positions require three finite coordinates within ±100,000.');
  }
  const seen = new Set();
  for (const e of graph.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) throw Error('A connection points to a missing node.');
    if (e.source === e.target) throw Error('A node cannot connect to itself.');
    if (!TYPES.includes(e.type)) throw Error('Unknown relationship type.');
    const pair = e.type === 'related' ? [e.source, e.target].sort() : [e.source, e.target];
    const key = JSON.stringify([e.type, ...pair]);
    if (seen.has(key)) throw Error('That connection already exists.');
    seen.add(key);
  }
  levels(graph); // Only prerequisites must form an acyclic graph.
  return graph;
}
export function levels(graph) {
  const indegree = new Map(graph.nodes.map(n => [n.id, 0]));
  const children = new Map(graph.nodes.map(n => [n.id, []]));
  const depth = new Map(graph.nodes.map(n => [n.id, 0]));
  for (const e of graph.edges.filter(e => e.type === 'prerequisite')) {
    children.get(e.source).push(e.target);
    indegree.set(e.target, indegree.get(e.target) + 1);
  }
  const queue = graph.nodes.filter(n => !indegree.get(n.id)).map(n => n.id);
  let visited = 0;
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i]; visited++;
    for (const next of children.get(id)) {
      depth.set(next, Math.max(depth.get(next), depth.get(id) + 1));
      indegree.set(next, indegree.get(next) - 1);
      if (!indegree.get(next)) queue.push(next);
    }
  }
  if (visited !== graph.nodes.length) throw Error('Prerequisite cycle detected. Use supports/related for connections that are not strict learning order.');
  return depth;
}
export function arrange(graph) {
  const result = clone(graph), depth = levels(result), slots = new Map();
  for (const n of [...result.nodes].sort((a,b) => a.id.localeCompare(b.id))) {
    const domain = Object.keys(DOMAINS).indexOf(n.domain);
    const key = `${domain}:${depth.get(n.id)}`;
    const slot = slots.get(key) || 0; slots.set(key, slot + 1);
    if (!n.pinned) { n.position = [(domain - 2.5) * 100 + (slot % 2) * 38, depth.get(n.id) * 90, Math.floor(slot / 2) * 80 - 40]; n.layoutMode='prerequisites'; }
  }
  return result;
}
// Coordinate fields show two decimals; a field left at its shown value keeps the full stored coordinate.
export function editedPosition(stored, values) {
  return values.map((value, i) => Number(value) === Math.round(stored[i] * 100) / 100 ? stored[i] : Number(value));
}
export function removeNode(graph, id) {
  return { ...clone(graph), nodes: graph.nodes.filter(n => n.id !== id).map(clone), edges: graph.edges.filter(e => e.source !== id && e.target !== id).map(clone) };
}
