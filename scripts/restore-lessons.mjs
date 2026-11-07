// Reverses scripts/migrate-lessons-to-store.mjs: puts each archived lesson back into its map file at
// the key position it had, from the migration manifest and the lesson store. A map that has not
// been edited since the migration comes back byte-identical (its SHA-256 equals the "before" value
// in the manifest); one that was edited since gets its lessons back with the edits kept.
//
//   node scripts/restore-lessons.mjs                 dry run
//   node scripts/restore-lessons.mjs --apply         restore every map in the manifest
//   options: --manifest <file>   --store <dir>
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { restoreLessons, sha256 } from './lesson-migration.mjs';

const require = createRequire(import.meta.url);
const { createLessonStore } = require('../desktop/lesson-store.cjs');
const root = path.resolve(import.meta.dirname, '..');

export async function restore({ apply = false, manifest: manifestFile = path.join(root, 'backups', 'pre-ai-lessons', 'manifest.json'), store: storeDir = null } = {}, log = console.log) {
  if (!existsSync(manifestFile)) throw Error(`No migration manifest at ${manifestFile}.`);
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  const store = createLessonStore(storeDir || manifest.store), results = [];
  for (const entry of manifest.maps) {
    const text = readFileSync(entry.file, 'utf8');
    const records = new Map();
    for (const id of Object.keys(entry.positions)) records.set(id, await store.read(entry.mapKey, id, 'archive'));
    const out = restoreLessons(text, entry.format, entry.positions, id => records.get(id));
    const identical = sha256(out.text) === entry.shaBefore;
    results.push({ file: entry.file, restored: out.restored, identical, unchangedSinceMigration: sha256(text) === entry.shaAfter });
    log(`  ${path.basename(entry.file)}: ${out.restored} lessons ${apply ? 'restored' : 'would be restored'}; ${identical ? 'byte-identical to the pre-migration file' : 'the map was edited since the migration, so it differs from the backup apart from the lessons'}`);
    if (apply) { writeFileSync(entry.file + '.tmp-restore', out.text); renameSync(entry.file + '.tmp-restore', entry.file); }
  }
  return results;
}

if (process.argv[1]?.endsWith('restore-lessons.mjs')) {
  const argv = process.argv.slice(2), opt = { apply: argv.includes('--apply') };
  const at = flag => { const i = argv.indexOf(flag); return i >= 0 ? path.resolve(argv[i + 1]) : undefined; };
  if (at('--manifest')) opt.manifest = at('--manifest');
  if (at('--store')) opt.store = at('--store');
  console.log(opt.apply ? 'Restoring lessons into map files:' : 'Dry run (add --apply to write):');
  restore(opt).catch(error => { console.error(`Restore stopped: ${error.message}`); process.exit(1); });
}
