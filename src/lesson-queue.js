// Pre-generating lessons for the next skills to study: a background queue that writes one lesson at
// a time, stops at the monthly cap or when the connection goes, and can be paused and resumed.
// generate(id) resolves to the main process's result; candidates(n) lists the skills to cover.

export const DEFAULT_BATCH = 10;

// The next skills to prepare: Next up toward the target first, then the rest of the frontier, lowest
// first; skipping milestones, checkpoints and skills that already have a lesson.
export function queueCandidates(state, hasLesson, n = DEFAULT_BATCH, levelOf = node => node.helixLevel ?? node.skillLevel ?? 0) {
  const seen = new Set(), out = [];
  const add = node => { if (node && !seen.has(node.id) && node.nodeKind !== 'milestone' && node.nodeKind !== 'checkpoint' && !hasLesson(node)) { seen.add(node.id); out.push(node.id); } };
  for (const { node } of state.next || []) add(node);
  for (const node of [...state.frontier].map(id => state.index.byId.get(id)).sort((a, b) => levelOf(a) - levelOf(b) || a.name.localeCompare(b.name))) add(node);
  return out.slice(0, n);
}

export function createLessonQueue({ generate, cancel = () => {}, onChange = () => {} }) {
  let items = [], position = 0, running = false, paused = false, stopReason = null, results = [];
  const state = () => ({ running, paused, total: items.length, done: position, current: running ? items[position] ?? null : null, stopReason, results: [...results] });
  const changed = () => onChange(state());

  async function run() {
    if (running) return;
    running = true; paused = false; stopReason = null; changed();
    while (position < items.length && !paused) {
      const id = items[position];
      changed();
      const result = await generate(id);
      if (paused && result?.kind === 'cancelled') break; // the current one was cancelled by Pause: try it again on resume
      results.push({ id, ok: !!result?.ok, message: result?.ok ? null : result?.message || 'Failed' });
      position++;
      if (!result?.ok && (result?.kind === 'unavailable' || result?.kind === 'offline')) { stopReason = result.message; paused = true; break; }
    }
    running = false;
    if (position >= items.length) paused = false;
    changed();
  }
  return {
    start(ids) { if (running) return; items = [...ids]; position = 0; results = []; run(); },
    pause() { if (!running) return; paused = true; stopReason = 'Paused.'; cancel(); changed(); },
    resume() { if (running || position >= items.length) return; run(); },
    state
  };
}
