// Matching for the Find skill box. Pure and case-insensitive: names that begin with the query come
// first, then names that contain it, each group in alphabetical order, capped so the list stays short.
export const FIND_LIMIT = 8;
export function findSkills(nodes, query, limit = FIND_LIMIT) {
  const text = String(query ?? '').trim().toLowerCase();
  if (!text) return [];
  const begins = [], contains = [];
  for (const node of nodes ?? []) {
    const name = String(node?.name ?? '').toLowerCase();
    if (name.startsWith(text)) begins.push(node);
    else if (name.includes(text)) contains.push(node);
  }
  const byName = (a, b) => a.name.localeCompare(b.name);
  return [...begins.sort(byName), ...contains.sort(byName)].slice(0, Math.max(0, limit));
}
