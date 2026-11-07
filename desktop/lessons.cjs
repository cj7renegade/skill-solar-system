// Lessons in the main process: the lesson store (desktop/lesson-store.cjs) behind IPC, and taking in
// lessons still embedded in an opened map (an older file, or a draft from before the migration) as
// reviewed archives so the page can drop them from the map. Generation is added in phase 3.
const { createLessonStore, archiveRecord } = require('./lesson-store.cjs');

function createLessons({ dir }) {
  const store = createLessonStore(dir);

  // Embedded lessons from the page: each becomes an archive unless one is stored already. Returns the
  // ids whose stored archive matches exactly, which the page may then remove from its copy of the map.
  async function absorb(mapKey, nodes) {
    if (!Array.isArray(nodes) || nodes.length > 50_000) throw Error('Invalid lessons.');
    const now = new Date().toISOString(), safe = [];
    for (const node of nodes) {
      if (!node || typeof node.id !== 'string' || (node.lesson === undefined && node.lessonCard === undefined)) continue;
      const record = archiveRecord(mapKey, node, now);
      const existing = await store.read(mapKey, node.id, 'archive');
      if (!existing) await store.put(record);
      const stored = existing || await store.read(mapKey, node.id, 'archive');
      if (JSON.stringify(stored.content) === JSON.stringify(record.content)) safe.push(node.id);
    }
    return safe;
  }

  return { store, get: store.get, list: store.list, absorb };
}

module.exports = { createLessons };
