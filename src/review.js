// Guided proficiency review: queue order, session state, answer gating, and map identity.
// Pure functions only; the dialog lives in review-dialog.js. Answers themselves are stored in the
// map's proficiency80 field (true = Yes, false = No); the session only tracks review progress.

export const isUnmarked = value => value !== true && value !== false;

// Saved heights are compared at the map's own saved precision (layouts round to 0.001), so
// floating-point noise never splits one height and no wider banding merges different heights.
export function heightPrecision(nodes, cap = 3) {
  let places = 0;
  for (const n of nodes) {
    const text = String(n.position[1]);
    if (/e/i.test(text)) return cap;
    const dot = text.indexOf('.');
    if (dot >= 0) places = Math.max(places, text.length - dot - 1);
    if (places >= cap) return cap;
  }
  return places;
}
export const heightKey = (y, precision) => Math.round(y * 10 ** precision);
const byName = (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' });

// Ascending saved Y (not array order, camera, or display spacing), then name, then id.
export function buildQueue(graph, mode = 'unmarked') {
  const precision = heightPrecision(graph.nodes);
  return graph.nodes
    .filter(n => mode === 'all' || isUnmarked(n.proficiency80))
    .map(n => ({ id: n.id, name: n.name, key: heightKey(n.position[1], precision) }))
    .sort((a, b) => a.key - b.key || byName(a.name, b.name) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(n => n.id);
}

function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
// A map may declare a stable identity for its review sessions. Without one, the title is the
// identity, which is what every map written before this field did; a retitled map then starts a
// new review. A map that declares one may be retitled — to restate a content count, say — and its
// saved review continues, because the declared key and the node set say it is the same dataset.
const DATASET_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
export function datasetKey(graph) {
  const key = graph?.metadata?.datasetKey;
  return typeof key === 'string' && DATASET_KEY.test(key) ? key : null;
}
// The node set alone, as a key suffix. A session saved before a dataset key was declared is found
// by this suffix, so the progress survives the change rather than being silently discarded.
export function nodeSetKey(graph) {
  const ids = graph.nodes.map(n => n.id).sort();
  return `|${ids.length}|${hash(ids.join('\n'))}`;
}
// Identity of the loaded map: its declared dataset key, else its title, plus the set of node ids
// (stable across edits to text or layout).
export function mapKey(graph) {
  const key = datasetKey(graph);
  return `${key ? `dataset:${key}` : graph.title || ''}${nodeSetKey(graph)}`;
}
// Whether a stored session belongs to this map. A map with a declared dataset key matches its own
// key or any session saved over the same node set; otherwise the title must match, as before.
function sameMap(s, graph) {
  const key = datasetKey(graph);
  if (!key) return (graph.title || '') === s.title;
  return s.dataset === key || String(s.map || '').endsWith(nodeSetKey(graph));
}

export function startSession(graph, mode, now = Date.now()) {
  return { version: 1, map: mapKey(graph), dataset: datasetKey(graph), title: graph.title || '', mode, queue: buildQueue(graph, mode), position: 0, visited: [], skipped: [], answers: {}, round: 1, updated: now };
}
export const currentId = s => s.queue[s.position] ?? null;
export const isFinished = s => s.position >= s.queue.length;
export const isUnfinished = s => !isFinished(s) || s.skipped.length > 0;

// Each transition acts only on the skill currently shown; stale or repeated input returns the same session.
export function answer(s, id, value, now = Date.now()) {
  if (currentId(s) !== id || typeof value !== 'boolean') return s;
  return { ...s, position: s.position + 1, visited: [...s.visited, s.position], skipped: s.skipped.filter(x => x !== id), answers: { ...s.answers, [id]: value }, updated: now };
}
export function skip(s, id, now = Date.now()) {
  if (currentId(s) !== id) return s;
  return { ...s, position: s.position + 1, visited: [...s.visited, s.position], skipped: s.skipped.includes(id) ? s.skipped : [...s.skipped, id], updated: now };
}
export function back(s, now = Date.now()) {
  if (!s.visited.length) return s;
  return { ...s, position: s.visited.at(-1), visited: s.visited.slice(0, -1), updated: now };
}
// A new round over the skipped skills, in their original queue order.
export function reviewSkipped(s, now = Date.now()) {
  if (!s.skipped.length) return s;
  const order = new Map(s.queue.map((id, i) => [id, i]));
  const queue = [...s.skipped].sort((a, b) => order.get(a) - order.get(b));
  return { ...s, queue, position: 0, visited: [], skipped: [], round: s.round + 1, updated: now };
}

export function progress(s, graph) {
  const id = currentId(s);
  const answered = s.queue.filter(x => x in s.answers).length;
  const result = { position: Math.min(s.position + 1, s.queue.length), total: s.queue.length, answered, skipped: s.skipped.length, height: null };
  if (id === null) return result;
  const precision = heightPrecision(graph.nodes);
  const keys = new Map(graph.nodes.map(n => [n.id, heightKey(n.position[1], precision)]));
  const key = keys.get(id), heights = [...new Set(s.queue.map(x => keys.get(x)))], group = s.queue.filter(x => keys.get(x) === key);
  result.height = { index: heights.indexOf(key) + 1, count: heights.length, positionInHeight: group.indexOf(id) + 1, sizeOfHeight: group.length };
  return result;
}

// Validates a stored session against the loaded map. Sessions never carry over to a different map
// or to one with mostly different nodes. Deleted nodes are dropped, and answers that were
// undone since (the map shows the skill unmarked again) return to the pending list.
export function resumeCheck(s, graph) {
  if (!s || s.version !== 1 || !Array.isArray(s.queue)) return { ok: false, reason: 'none' };
  if (!sameMap(s, graph)) return { ok: false, reason: 'different-map' };
  const nodes = new Map(graph.nodes.map(n => [n.id, n]));
  const queue = s.queue.filter(id => nodes.has(id));
  if (!queue.length || s.queue.length - queue.length > Math.max(3, Math.floor(s.queue.length * 0.1))) return { ok: false, reason: 'map-changed' };
  const missing = s.queue.filter(id => !nodes.has(id));
  const index = new Map(queue.map((id, i) => [id, i]));
  const next = s.queue.slice(s.position).find(id => nodes.has(id));
  const position = next === undefined ? queue.length : index.get(next);
  const visited = s.visited.map(i => index.get(s.queue[i])).filter(i => i !== undefined && i < position);
  const answers = {}, undone = [];
  for (const [id, value] of Object.entries(s.answers)) {
    if (!nodes.has(id)) continue;
    if (isUnmarked(nodes.get(id).proficiency80)) { if (index.has(id) && index.get(id) < position) undone.push(id); }
    else answers[id] = nodes.get(id).proficiency80 === value ? value : nodes.get(id).proficiency80;
  }
  const skipped = [...new Set([...s.skipped.filter(id => index.has(id)), ...undone])].sort((a, b) => index.get(a) - index.get(b));
  // The resumed session is restamped with this map's current identity and title, so a session
  // carried across a rename is stored under the new key and the old one is replaced, not left behind.
  return { ok: true, missing, undone, session: { ...s, map: mapKey(graph), dataset: datasetKey(graph), title: graph.title || '', queue, position, visited, skipped, answers } };
}

// One deliberate answer marks exactly one skill: it must name the skill on screen and arrive after
// the previous answer's lock period, which absorbs double-clicks and key repeat.
export function createAnswerGate(lockMs = 400) {
  let last = -Infinity;
  return {
    accept(shownId, currentSkillId, time) {
      if (shownId === null || shownId !== currentSkillId || time - last < lockMs) return false;
      last = time;
      return true;
    },
    reset() { last = -Infinity; }
  };
}

export const REVIEW_STORE = 'skill-solar-system-review-v1';
export function loadSessions(storage) {
  try { const value = JSON.parse(storage.getItem(REVIEW_STORE) || '{}'); return value && typeof value.sessions === 'object' && value.sessions ? value.sessions : {}; }
  catch { return {}; }
}
function writeSessions(storage, sessions, limit) {
  const keep = Object.entries(sessions).sort(([, a], [, b]) => b.updated - a.updated).slice(0, limit);
  try { storage.setItem(REVIEW_STORE, JSON.stringify({ sessions: Object.fromEntries(keep) })); return true; }
  catch { return false; }
}
export function storeSession(storage, s, replacedKey = null, limit = 8) {
  const sessions = loadSessions(storage);
  if (replacedKey && replacedKey !== s.map) delete sessions[replacedKey];
  sessions[s.map] = s;
  return writeSessions(storage, sessions, limit);
}
export function dropSession(storage, key, limit = 8) {
  const sessions = loadSessions(storage);
  delete sessions[key];
  return writeSessions(storage, sessions, limit);
}
// The unfinished session for this map, if any: an exact identity match first, then a session that
// belongs to the same map (same declared dataset or same node set; failing that, the same title)
// whose queue still matches after deleted nodes are removed.
export function findSession(storage, graph) {
  const sessions = loadSessions(storage), key = mapKey(graph);
  const candidates = Object.values(sessions).filter(s => s.map === key || sameMap(s, graph)).sort((a, b) => (b.map === key) - (a.map === key) || b.updated - a.updated);
  for (const stored of candidates) {
    const check = resumeCheck(stored, graph);
    if (check.ok && isUnfinished(check.session)) return { ...check, storedKey: stored.map };
  }
  return null;
}
