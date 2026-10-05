// The maps offered in the "Your maps" dropdown: map files in the Maps folder and in its working
// subfolders, one level down. Archive, backup and checkpoint folders are never listed: the copies
// there carry stale answers, and opening one could copy those answers into the shared record.
// Only files that start like a Skill Solar System map are listed, so reports and summaries are not.
const fs = require('node:fs/promises');
const path = require('node:path');

const SKIP_FOLDER = /archiv|backup|checkpoint|old-root|copies|rewrite|^notes$/i;
const SKIP_FILE = /( - Copy|-Preview)\.json$/i;
const HEADER_BYTES = 4096;

async function header(file) {
  const handle = await fs.open(file, 'r');
  try {
    const buffer = Buffer.alloc(HEADER_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, HEADER_BYTES, 0);
    const text = buffer.subarray(0, bytesRead).toString('utf8');
    if (!/^\s*\{\s*"schemaVersion"\s*:\s*1\s*,/.test(text)) return null;
    const title = text.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    try { return { title: title ? JSON.parse(`"${title[1]}"`) : '' }; } catch { return { title: '' }; }
  } finally { await handle.close(); }
}

async function mapsIn(root, folder) {
  let entries;
  try { entries = await fs.readdir(path.join(root, folder), { withFileTypes: true }); } catch { return []; }
  const found = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.json') || SKIP_FILE.test(entry.name)) continue;
    const relative = folder ? `${folder}/${entry.name}` : entry.name, file = path.join(root, relative);
    try {
      const info = await header(file);
      if (info) found.push({ path: relative, title: info.title, bytes: (await fs.stat(file)).size });
    } catch {}
  }
  return found;
}

// Top-level maps first, then each working subfolder, each group in name order.
async function listMaps(root) {
  let entries;
  try { entries = await fs.readdir(root, { withFileTypes: true }); } catch { return []; }
  const byPath = (a, b) => a.path.localeCompare(b.path, 'en', { sensitivity: 'base' });
  const maps = (await mapsIn(root, '')).sort(byPath);
  const folders = entries.filter(e => e.isDirectory() && !SKIP_FOLDER.test(e.name)).map(e => e.name).sort();
  for (const folder of folders) maps.push(...(await mapsIn(root, folder)).sort(byPath));
  return maps;
}

// Reads only a map the list itself offers, so a request can never reach any other file.
async function readMap(root, relative) {
  const offered = (await listMaps(root)).find(m => m.path === relative);
  if (typeof relative !== 'string' || !offered) throw Error('That map is not in the Maps folder list.');
  return { name: path.basename(relative), bytes: offered.bytes, text: await fs.readFile(path.join(root, relative), 'utf8') };
}

module.exports = { listMaps, readMap, SKIP_FOLDER, SKIP_FILE };
