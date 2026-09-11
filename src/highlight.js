// Subject (domain) highlighting is display state only: it never changes the map, the selection,
// or the camera. Matching uses each node's own domain field.
import { DOMAINS } from './model.js';

export const SUBJECTS = Object.keys(DOMAINS);

export function domainCounts(graph) {
  const counts = Object.fromEntries(SUBJECTS.map(domain => [domain, 0]));
  for (const node of graph.nodes) if (node.domain in counts) counts[node.domain]++;
  return counts;
}

export function toggleSubject(active, domain) {
  const next = new Set(active);
  if (next.has(domain)) next.delete(domain); else if (SUBJECTS.includes(domain)) next.add(domain);
  return next;
}

// Highlights for subjects the loaded map does not contain are dropped (for example after opening another map).
export function pruneSubjects(active, graph) {
  const counts = domainCounts(graph);
  return new Set([...active].filter(domain => counts[domain] > 0));
}

export function highlightedIds(graph, active) {
  return graph.nodes.filter(node => active.has(node.domain)).map(node => node.id);
}
