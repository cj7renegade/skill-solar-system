// Moves the embedded lessons (`lesson`, `lessonCard`) of map files into the lesson store as reviewed
// archives, then removes the two fields from the maps. Nothing is deleted: a one-time backup of every
// map comes first, every archive is checked to re-serialize identically before its map is rewritten,
// and scripts/restore-lessons.mjs reverses it.
//
//   node scripts/migrate-lessons-to-store.mjs                 dry run: counts only, nothing written
//   node scripts/migrate-lessons-to-store.mjs --apply         migrate the top-level Maps/*.json
//   options: --maps <file> [<file> …]   --store <dir>   --backup <dir>
//
// The store defaults to the app's own: %APPDATA%\skill-solar-system\lessons (Windows).
import { readFileSync, existsSync, mkdirSync, copyFileSync, writeFileSync, readdirSync, statSync, renameSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { planMap, stripLessons, graphFingerprint, sha256 } from './lesson-migration.mjs';

const require = createRequire(import.meta.url);
const { createLessonStore } = require('../desktop/lesson-store.cjs');
const root = path.resolve(import.meta.dirname, '..');

export function defaultStore() {
  const base = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : path.join(os.homedir(), '.config'));
  return path.join(base, 'skill-solar-system', 'lessons');
}
function args(argv) {
  const out = { apply: false, maps: null, store: defaultStore(), backup: path.join(root, 'backups', 'pre-ai-lessons') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') out.apply = true;
    else if (argv[i] === '--store') out.store = path.resolve(argv[++i]);
    else if (argv[i] === '--backup') out.backup = path.resolve(argv[++i]);
    else if (argv[i] === '--maps') { out.maps = []; while (argv[i + 1] && !argv[i + 1].startsWith('--')) out.maps.push(path.resolve(argv[++i])); }
    else throw Error(`Unknown option ${argv[i]}`);
  }
  out.maps ??= readdirSync(path.join(root, 'Maps')).filter(f => f.endsWith('.json') && statSync(path.join(root, 'Maps', f)).isFile()).map(f => path.join(root, 'Maps', f));
  return out;
}

export async function migrate({ apply, maps, store: storeDir, backup }, log = console.log) {
  const plans = maps.map(file => { const text = readFileSync(file, 'utf8'); return { file, text, ...planMap(text) }; });
  log(`${apply ? 'Migrating' : 'Dry run'}: ${plans.length} map file(s); store ${storeDir}`);
  for (const p of plans) log(`  ${path.basename(p.file)}: ${p.nodes} nodes, ${p.edges} edges, ${p.lessons} with lessons → ${p.mapKey}${p.format ? '' : '  (format not rewritable: skipped)'}`);
  const total = plans.reduce((s, p) => s + p.lessons, 0);
  log(`  Total lessons to archive: ${total}`);
  if (!apply) return { applied: false, total, plans: plans.map(p => ({ file: p.file, lessons: p.lessons, mapKey: p.mapKey })) };

  // 1. One-time backup of every map file, with a SHA-256 list. An existing backup is never overwritten.
  mkdirSync(backup, { recursive: true });
  const sumsFile = path.join(backup, 'SHA256SUMS'), sums = existsSync(sumsFile) ? readFileSync(sumsFile, 'utf8') : '';
  const lines = sums.split('\n').filter(Boolean);
  for (const p of plans) {
    const hash = sha256(p.text), name = path.basename(p.file);
    if (lines.some(l => l.startsWith(hash))) continue;
    const target = existsSync(path.join(backup, name)) ? `${name}.${hash.slice(0, 8)}` : name;
    copyFileSync(p.file, path.join(backup, target));
    if (sha256(readFileSync(path.join(backup, target), 'utf8')) !== hash) throw Error(`Backup of ${name} does not match.`);
    lines.push(`${hash}  ${target}`);
  }
  writeFileSync(sumsFile, lines.join('\n') + '\n');
  log(`  Backup: ${backup} (${lines.length} file(s) listed in SHA256SUMS)`);

  // 2. Archive, verify, then rewrite each map.
  const store = createLessonStore(storeDir), createdAt = new Date().toISOString();
  const manifestFile = path.join(backup, 'manifest.json');
  const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : { format: 'helixskill-lesson-migration', store: storeDir, maps: [] };
  let moved = 0;
  const results = [];
  for (const p of plans) {
    if (!p.lessons || !p.format) { results.push({ file: p.file, moved: 0 }); continue; }
    const stripped = stripLessons(p.text, createdAt);
    for (const record of stripped.records) {
      const existing = await store.read(record.mapKey, record.nodeId, 'archive');
      if (existing && JSON.stringify(existing.content) !== JSON.stringify(record.content)) throw Error(`${record.nodeId}: a different archived lesson is already stored for ${record.mapKey}. Nothing was changed in ${path.basename(p.file)}.`);
      if (!existing) await store.put(record);
      const back = await store.read(record.mapKey, record.nodeId, 'archive');
      if (JSON.stringify(back.content) !== JSON.stringify(record.content)) throw Error(`${record.nodeId}: the archived lesson does not re-serialize identically.`);
    }
    const before = graphFingerprint(p.map), after = graphFingerprint(stripped.map);
    if (JSON.stringify(before) !== JSON.stringify(after)) throw Error(`${path.basename(p.file)}: the graph would change. Nothing was written.`);
    if (stripped.map.nodes.some(n => 'lesson' in n || 'lessonCard' in n)) throw Error('Lesson fields remain.');
    writeFileSync(p.file + '.tmp-migrate', stripped.text);
    renameSync(p.file + '.tmp-migrate', p.file);
    manifest.maps = manifest.maps.filter(m => m.file !== p.file);
    manifest.maps.push({ file: p.file, mapKey: stripped.mapKey, format: stripped.format, shaBefore: sha256(p.text), shaAfter: sha256(stripped.text), migratedAt: createdAt, lessons: stripped.records.length, positions: stripped.positions });
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
    moved += stripped.records.length;
    results.push({ file: p.file, moved: stripped.records.length, nodes: after.nodes, edges: after.edges });
    log(`  ${path.basename(p.file)}: moved ${stripped.records.length}; nodes ${after.nodes}, edges ${after.edges}, graph and answers unchanged`);
  }
  if (moved !== total - plans.filter(p => !p.format).reduce((s, p) => s + p.lessons, 0)) throw Error(`Moved ${moved}, expected ${total}.`);
  log(`  Done: ${moved} lessons archived. Manifest: ${manifestFile}`);
  return { applied: true, total, moved, results, manifest: manifestFile };
}

if (process.argv[1]?.endsWith('migrate-lessons-to-store.mjs')) {
  migrate(args(process.argv.slice(2))).catch(error => { console.error(`Migration stopped: ${error.message}`); process.exit(1); });
}
