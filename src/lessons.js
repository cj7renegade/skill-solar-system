// The page's side of the lesson store. Lessons are not in map files any more: they are kept by the
// main process per map key (the atlas family) and read through getLesson(node). A map that still
// embeds lessons (an older file or draft) keeps working: its lessons are read from the node, and
// handed to the store as reviewed archives so they can leave the map.
// Nothing here reads or writes proficiency: a lesson existing, opening or finishing says nothing
// about what the learner knows.
import { atlasFamily } from './proficiency.js';
import { datasetKey } from './review.js';

export const LESSON_FIELDS = ['lesson', 'lessonCard'];
export const lessonKey = graph => atlasFamily(graph) || datasetKey(graph) || 'default';
export const embeddedLesson = node => LESSON_FIELDS.some(k => node?.[k] !== undefined)
  ? { source: 'reviewed-archive', status: 'reviewed', embedded: true, content: Object.fromEntries(LESSON_FIELDS.filter(k => node[k] !== undefined).map(k => [k, node[k]])) } : null;

// What the card's badge says, from a node's index entry ({ archive, ai }) and any embedded lesson.
// An AI lesson, when there is one, is the one the card opens; the archive is kept beside it.
export function lessonState(entry, embedded = null, promptVersion = null) {
  const archive = !!(entry?.archive || embedded), ai = entry?.ai || null;
  if (ai) {
    const label = ai.status === 'flagged' ? 'Flagged' : ai.status === 'reviewed' ? 'Reviewed' : 'AI-generated · unreviewed';
    return { kind: ai.status === 'flagged' ? 'flagged' : ai.status === 'reviewed' ? 'reviewed' : 'unreviewed', label, has: true, ai: true, archive,
      outdated: !!promptVersion && ai.promptVersion !== promptVersion };
  }
  if (archive) return { kind: 'reviewed', label: 'Reviewed', has: true, ai: false, archive, outdated: false };
  return { kind: 'none', label: 'No lesson yet', has: false, ai: false, archive: false, outdated: false };
}

// bridge: window.desktop.lessons (absent in a plain browser, where only embedded lessons exist).
export function createLessonIndex(bridge) {
  let key = null, entries = {}, loading = null, version = 0;
  const records = new Map();
  const listeners = new Set();
  const changed = () => { version++; for (const f of listeners) f(); };

  async function load(graph, force = false) {
    const next = lessonKey(graph);
    if (!bridge || (next === key && !force)) return loading;
    key = next; records.clear();
    loading = bridge.list(key).then(list => { if (key === next) { entries = list || {}; changed(); } }, () => { entries = {}; });
    return loading;
  }
  // Both lessons of a node: { archive, ai }. The archive falls back to lessons still in the map.
  async function getLesson(graph, node) {
    const embedded = embeddedLesson(node);
    if (!bridge) return { archive: embedded, ai: null };
    const k = lessonKey(graph), id = `${k}\u0000${node.id}`;
    if (!records.has(id)) records.set(id, bridge.get(k, node.id).catch(() => ({ archive: null, ai: null })));
    const stored = await records.get(id);
    return { archive: stored.archive || embedded, ai: stored.ai };
  }
  function state(graph, node, promptVersion = null) {
    return lessonState(lessonKey(graph) === key ? entries[node.id] : null, embeddedLesson(node), promptVersion);
  }
  // Lessons still embedded in the map go to the store; resolves to the ids safe to remove from the map.
  async function absorb(graph) {
    const nodes = graph.nodes.filter(embeddedLesson);
    if (!bridge || !nodes.length) return [];
    const k = lessonKey(graph);
    const ids = await bridge.absorb(k, nodes.map(n => ({ id: n.id, ...embeddedLesson(n).content })));
    if (k === key) await load(graph, true);
    return ids;
  }
  // After a lesson is written (phases 3–5), forget the cached copy and reload the index.
  function invalidate(graph, nodeId) { records.delete(`${lessonKey(graph)}\u0000${nodeId}`); return load(graph, true); }

  return { load, getLesson, state, absorb, invalidate, onChange: f => listeners.add(f), version: () => version, key: () => key };
}
