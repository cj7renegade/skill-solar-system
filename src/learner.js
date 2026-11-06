// Learner state derived from a map: what is proficient, what can be studied next, which milestone
// the learner is working toward, what remains on the way there, and a rough effort estimate.
// Pure functions over the map's own nodes and prerequisite edges. Nothing here writes a map or an
// answer: proficiency stays the reader's manual Yes/No, and lesson availability is never read.
import { tierOf } from './helix.js';

// Proficient means the manual answer Yes, and nothing else.
export const isProficient = node => node?.proficiency80 === true;

// Rough hours per skill by tier; hands-on practice counts double. Always shown as "~" estimates.
export const HOURS = { Core: 2, Working: 3, Specialist: 5, Enrichment: 1.5, Checkpoint: 3, Milestone: 40 };
export const DEFAULT_TIER = 'Core';

// Parents (prerequisites) and children (what each skill unlocks), from prerequisite edges only:
// supporting and related links are not learning order.
export function prerequisiteIndex(graph) {
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const parents = new Map(graph.nodes.map(n => [n.id, []])), children = new Map(graph.nodes.map(n => [n.id, []]));
  for (const e of graph.edges) {
    if (e.type !== 'prerequisite' || !byId.has(e.source) || !byId.has(e.target)) continue;
    parents.get(e.target).push(e.source); children.get(e.source).push(e.target);
  }
  return { byId, parents, children };
}

// Height order for sorting: the helix level where the map has one, else the reference level, else
// the saved height. Lower comes first.
export const levelOf = node => node.helixLevel ?? node.skillLevel ?? node.position?.[1] ?? 0;
const byLevel = (a, b) => levelOf(a) - levelOf(b) || a.name.localeCompare(b.name) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// A frontier skill is not proficient and every prerequisite is; a skill with no prerequisites
// counts. Milestones and checkpoints can be frontier too.
export function frontier(graph, index = prerequisiteIndex(graph)) {
  const out = new Set();
  for (const n of graph.nodes) if (!isProficient(n) && index.parents.get(n.id).every(p => isProficient(index.byId.get(p)))) out.add(n.id);
  return out;
}

// The milestone chain, lowest first.
export function milestones(graph) {
  return graph.nodes.filter(n => n.nodeKind === 'milestone').sort(byLevel);
}
// The default target: the lowest milestone not yet complete, or the top one when all are.
export function defaultTarget(graph) {
  const chain = milestones(graph);
  return (chain.find(n => !isProficient(n)) ?? chain[chain.length - 1])?.id ?? null;
}
// The milestone overall progress is measured against: I08 on the humanoid helix (I09 is optional),
// otherwise the map's top milestone.
export const FINAL_MILESTONE = 'hx-sys-ms-i08';
export function finalMilestone(graph) {
  const chain = milestones(graph);
  return chain.find(n => n.id === FINAL_MILESTONE)?.id ?? chain[chain.length - 1]?.id ?? null;
}

export function ancestors(index, id) {
  const seen = new Set(), stack = [id];
  while (stack.length) for (const p of index.parents.get(stack.pop()) || []) if (!seen.has(p)) { seen.add(p); stack.push(p); }
  return seen;
}

// The remaining path to a target: every non-proficient skill it rests on, plus the target itself
// unless it is already proficient.
export function remainingPath(graph, targetId, index = prerequisiteIndex(graph)) {
  const target = index.byId.get(targetId);
  if (!target) return new Set();
  const out = new Set([...ancestors(index, targetId)].filter(id => !isProficient(index.byId.get(id))));
  if (!isProficient(target)) out.add(targetId);
  return out;
}

export function effortHours(graph, node) {
  if (node.nodeKind === 'milestone') return HOURS.Milestone;
  if (node.nodeKind === 'checkpoint') return HOURS.Checkpoint;
  const base = HOURS[tierOf(graph, node)] ?? HOURS[DEFAULT_TIER];
  return node.helixPractice === 'hands-on' ? base * 2 : base;
}
export const totalHours = (graph, ids, index = prerequisiteIndex(graph)) => [...ids].reduce((sum, id) => sum + effortHours(graph, index.byId.get(id)), 0);
// "~410 h": whole hours from 10 h up, one decimal below.
export const formatHours = hours => `~${hours >= 10 ? Math.round(hours).toLocaleString('en') : Math.round(hours * 10) / 10} h`;

// Progress toward a target: how many of the skills it rests on are proficient, and what is left.
export function targetProgress(graph, targetId, index = prerequisiteIndex(graph)) {
  if (!index.byId.has(targetId)) return null;
  const below = ancestors(index, targetId);
  let proficient = 0;
  for (const id of below) if (isProficient(index.byId.get(id))) proficient++;
  const remaining = remainingPath(graph, targetId, index);
  const all = below.size + 1, done = proficient + (isProficient(index.byId.get(targetId)) ? 1 : 0);
  return { prerequisites: below.size, proficient, remaining, hoursLeft: totalHours(graph, remaining, index), percent: Math.round(100 * done / all), complete: !remaining.size };
}

// How many skills of a set depend on each skill of that set (its descendants inside the set).
export function unlockCounts(index, ids) {
  const set = ids instanceof Set ? ids : new Set(ids), memo = new Map();
  const reach = id => {
    if (memo.has(id)) return memo.get(id);
    const seen = new Set(), stack = [id];
    while (stack.length) for (const c of index.children.get(stack.pop()) || []) if (set.has(c) && !seen.has(c)) { seen.add(c); stack.push(c); }
    memo.set(id, seen.size); return seen.size;
  };
  return reach;
}

// Next up: frontier skills on the remaining path, lowest level first, then those that unlock the
// most of the remaining path.
export function nextUp(graph, targetId, { limit = 8, index = prerequisiteIndex(graph), front = frontier(graph, index) } = {}) {
  const remaining = remainingPath(graph, targetId, index), unlocks = unlockCounts(index, remaining);
  return [...remaining].filter(id => front.has(id)).map(id => index.byId.get(id))
    .sort((a, b) => levelOf(a) - levelOf(b) || unlocks(b.id) - unlocks(a.id) || byLevel(a, b))
    .slice(0, limit).map(n => ({ node: n, hours: effortHours(graph, n), unlocks: unlocks(n.id) }));
}

// A valid study order for a set of skills: every skill after the prerequisites it has inside the set,
// choosing the lowest level first whenever several are ready (Kahn's algorithm with a heap).
export function studyOrder(graph, ids, index = prerequisiteIndex(graph)) {
  const set = ids instanceof Set ? ids : new Set(ids), pending = new Map();
  for (const id of set) pending.set(id, index.parents.get(id).filter(p => set.has(p)).length);
  const heap = [], less = (a, b) => byLevel(index.byId.get(a), index.byId.get(b)) < 0;
  const push = id => { heap.push(id); for (let i = heap.length - 1; i > 0;) { const p = (i - 1) >> 1; if (!less(heap[i], heap[p])) break; [heap[i], heap[p]] = [heap[p], heap[i]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; for (let i = 0; ;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && less(heap[l], heap[m])) m = l; if (r < heap.length && less(heap[r], heap[m])) m = r; if (m === i) break; [heap[i], heap[m]] = [heap[m], heap[i]]; i = m; } } return top; };
  for (const [id, count] of pending) if (!count) push(id);
  const order = [];
  while (heap.length) {
    const id = pop(); order.push(id);
    for (const c of index.children.get(id)) if (pending.has(c) && !pending.set(c, pending.get(c) - 1).get(c)) push(c);
  }
  return order;
}
