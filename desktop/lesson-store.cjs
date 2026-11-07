// The lesson store: lessons kept outside map files, one JSON file per node and kind, under
// <root>/<mapKey>/. A node can have one reviewed archive (moved out of a map file, content
// byte-identical) and one AI-generated lesson; they are separate files, so generating or
// regenerating a lesson can never overwrite an archive. Used by the app (main process) and by the
// migration and restore scripts. Writes are atomic and run one at a time per file.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { writeFileAtomic } = require('./save.cjs');

const FORMAT = 'helixskill-lesson';
const KINDS = { archive: 'reviewed-archive', ai: 'ai-generated' };
const STATUSES = ['reviewed', 'unreviewed', 'flagged'];
const KEY = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/;
const MAX_BYTES = 2_000_000;

const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const readable = text => text.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
function check(name, value) { if (typeof value !== 'string' || !KEY.test(value)) throw Error(`Invalid ${name}.`); }
function folderFor(root, mapKey) { check('map key', mapKey); return path.join(root, `${readable(mapKey)}-${sha(mapKey).slice(0, 12)}`); }
function fileFor(root, mapKey, nodeId, kind) {
  check('node id', nodeId);
  if (!KINDS[kind]) throw Error('Invalid lesson kind.');
  return path.join(folderFor(root, mapKey), `${readable(nodeId)}-${sha(nodeId).slice(0, 12)}.${kind}.json`);
}

// A record is checked before it is written and when it is read: the right format, ids that match
// its place in the store, a known source and status, and content present.
function validRecord(record, mapKey, nodeId, kind) {
  return record?.format === FORMAT && record.version === 1 && record.mapKey === mapKey && record.nodeId === nodeId
    && record.source === KINDS[kind] && STATUSES.includes(record.status) && record.content && typeof record.content === 'object';
}

function createLessonStore(root) {
  const queues = new Map();
  const serial = (file, job) => { const run = (queues.get(file) || Promise.resolve()).catch(() => {}).then(job); queues.set(file, run); return run; };

  async function read(mapKey, nodeId, kind) {
    const file = fileFor(root, mapKey, nodeId, kind);
    let text;
    try { text = await fs.readFile(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    const record = JSON.parse(text);
    if (!validRecord(record, mapKey, nodeId, kind)) throw Error(`The stored lesson for ${nodeId} is not valid.`);
    return record;
  }
  // Both lessons of one node: { archive, ai }, either may be null.
  async function get(mapKey, nodeId) { return { archive: await read(mapKey, nodeId, 'archive'), ai: await read(mapKey, nodeId, 'ai') }; }
  function put(record) {
    const kind = record?.source === KINDS.archive ? 'archive' : record?.source === KINDS.ai ? 'ai' : null;
    if (!kind || !validRecord(record, record.mapKey, record.nodeId, kind)) throw Error('Invalid lesson record.');
    const text = JSON.stringify(record, null, 2) + '\n';
    if (Buffer.byteLength(text) > MAX_BYTES) throw Error('Lesson record too large.');
    const file = fileFor(root, record.mapKey, record.nodeId, kind);
    return serial(file, async () => { await fs.mkdir(path.dirname(file), { recursive: true }); await writeFileAtomic(file, text); return record; });
  }
  // Only an AI lesson can be removed; an archive is never deleted by the app.
  function removeAi(mapKey, nodeId) { const file = fileFor(root, mapKey, nodeId, 'ai'); return serial(file, () => fs.rm(file, { force: true })); }
  // Every lesson of one map key, as a short index for cards: nodeId -> { archive, ai: { status, promptVersion, model, createdAt } }.
  async function list(mapKey) {
    const dir = folderFor(root, mapKey), out = {};
    let names = [];
    try { names = await fs.readdir(dir); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    for (const name of names) {
      const kind = name.endsWith('.archive.json') ? 'archive' : name.endsWith('.ai.json') ? 'ai' : null;
      if (!kind) continue;
      let record;
      try { record = JSON.parse(await fs.readFile(path.join(dir, name), 'utf8')); } catch { continue; }
      if (!validRecord(record, mapKey, record?.nodeId, kind)) continue;
      const entry = out[record.nodeId] ??= { archive: null, ai: null };
      entry[kind] = { status: record.status, promptVersion: record.promptVersion ?? null, model: record.model ?? null, createdAt: record.createdAt ?? null };
    }
    return out;
  }
  // Every record file under the root (for export), as [relative path, text].
  async function files() {
    const out = [];
    let dirs = [];
    try { dirs = await fs.readdir(root, { withFileTypes: true }); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    for (const d of dirs) if (d.isDirectory()) for (const name of await fs.readdir(path.join(root, d.name))) if (/\.(archive|ai)\.json$/.test(name)) out.push([`${d.name}/${name}`, await fs.readFile(path.join(root, d.name, name), 'utf8')]);
    return out;
  }
  return { root, get, read, put, removeAi, list, files, fileFor: (mapKey, nodeId, kind) => fileFor(root, mapKey, nodeId, kind) };
}

// The archive record for a lesson moved out of a map file: the two fields, verbatim.
function archiveRecord(mapKey, node, createdAt) {
  const content = {};
  if (node.lesson !== undefined) content.lesson = node.lesson;
  if (node.lessonCard !== undefined) content.lessonCard = node.lessonCard;
  return { format: FORMAT, version: 1, nodeId: node.id, mapKey, source: KINDS.archive, status: 'reviewed', promptVersion: null, model: null,
    createdAt, inputHash: null, tokensIn: 0, tokensOut: 0, content, userNotes: '', verification: null };
}

module.exports = { createLessonStore, archiveRecord, validRecord, fileFor, folderFor, FORMAT, KINDS, STATUSES, sha };
