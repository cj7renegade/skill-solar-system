// Moving embedded lessons out of map files and back. Shared by scripts/migrate-lessons-to-store.mjs
// and scripts/restore-lessons.mjs, and tested on fixtures (tests/lesson-migration.test.mjs).
//
// Only the two lesson fields of a node move (`lesson`, `lessonCard`). Everything else in the map
// keeps its bytes: the file is re-serialized in its own format, nodes keep their key order, and
// each removed key's position is recorded so restore puts it back exactly.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { atlasFamily } from '../src/proficiency.js';
import { datasetKey } from '../src/review.js';

const require = createRequire(import.meta.url);
const { archiveRecord } = require('../desktop/lesson-store.cjs');

export const LESSON_FIELDS = ['lesson', 'lessonCard'];
export const sha256 = text => createHash('sha256').update(text).digest('hex');
// The key lessons are stored under: the atlas family, so sub-maps of one family share lessons.
export const lessonMapKey = graph => atlasFamily(graph) || datasetKey(graph) || 'default';

// The file's own serialization, so a rewrite changes only the removed fields.
const FORMATS = { pretty: map => JSON.stringify(map, null, 2) + '\n', prettyBare: map => JSON.stringify(map, null, 2), compact: map => JSON.stringify(map) };
export function detectFormat(text, map) {
  for (const [name, write] of Object.entries(FORMATS)) if (write(map) === text) return name;
  return null;
}
export const serialize = (map, format) => FORMATS[format](map);

const hasLesson = node => LESSON_FIELDS.some(k => node[k] !== undefined);

// What a migration of one map file would do, without changing anything.
export function planMap(text) {
  const map = JSON.parse(text), format = detectFormat(text, map);
  const nodes = map.nodes.filter(hasLesson);
  return { map, format, mapKey: lessonMapKey(map), lessons: nodes.length, nodes: map.nodes.length, edges: map.edges.length };
}

// Removes the lesson fields. Returns the new text, the archive records and, per node, where each
// removed key sat in the node's key order.
export function stripLessons(text, createdAt) {
  const { map, format, mapKey } = planMap(text);
  if (!format) throw Error('This map file is not in a format the migration can rewrite byte for byte.');
  const records = [], positions = {};
  for (const node of map.nodes) {
    if (!hasLesson(node)) continue;
    records.push(archiveRecord(mapKey, node, createdAt));
    const keys = Object.keys(node);
    positions[node.id] = Object.fromEntries(LESSON_FIELDS.filter(k => node[k] !== undefined).map(k => [k, keys.indexOf(k)]));
    for (const k of LESSON_FIELDS) delete node[k];
  }
  return { text: serialize(map, format), map, format, mapKey, records, positions };
}

// Puts the fields back at their recorded positions from the archive records.
export function restoreLessons(text, format, positions, recordFor) {
  const map = JSON.parse(text);
  let restored = 0;
  for (const node of map.nodes) {
    const where = positions[node.id];
    if (!where) continue;
    const record = recordFor(node.id);
    if (!record) throw Error(`No archived lesson for ${node.id}.`);
    const entries = Object.entries(node);
    for (const [key, index] of Object.entries(where).sort((a, b) => a[1] - b[1])) {
      if (!(key in record.content)) throw Error(`The archive for ${node.id} has no ${key}.`);
      entries.splice(index, 0, [key, record.content[key]]);
    }
    for (const k of Object.keys(node)) delete node[k];
    Object.assign(node, Object.fromEntries(entries));
    restored++;
  }
  return { text: serialize(map, format), restored };
}

// What must not change: every node's id, position, levels, course and answer, and every edge.
export function graphFingerprint(map) {
  const nodes = map.nodes.map(n => { const rest = { ...n }; for (const k of LESSON_FIELDS) delete rest[k]; return rest; });
  return { nodes: map.nodes.length, edges: map.edges.length, hash: sha256(JSON.stringify({ nodes, edges: map.edges, layout: map.layout ?? null })),
    proficiency: sha256(JSON.stringify(map.nodes.map(n => [n.id, n.proficiency80 ?? null]))) };
}
