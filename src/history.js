// How many Undo (and Redo) steps to keep. Each step holds a whole copy of the map, and a copy takes
// about as much memory as the map's saved text: the capacity study measured +27.6 MB per step for a
// 27.5-million-character map and +72 MB per step for a 73.7-million-character one, and a
// 10,000-skill map with lessons crashed the page after 47 steps. So the number of steps follows the
// map's size instead of a fixed 50: small maps keep 50, very large maps keep at least 5.
export const UNDO_BUDGET_CHARS = 500_000_000;
export const MAX_UNDO_STEPS = 50;
export const MIN_UNDO_STEPS = 5;

export function undoLimit(mapChars) {
  if (!Number.isFinite(mapChars) || mapChars <= 0) return MAX_UNDO_STEPS;
  return Math.max(MIN_UNDO_STEPS, Math.min(MAX_UNDO_STEPS, Math.floor(UNDO_BUDGET_CHARS / mapChars)));
}

// Drops the oldest steps until the list fits. Returns the same list.
export function trimHistory(steps, limit) {
  while (steps.length > limit) steps.shift();
  return steps;
}
