// The "Your maps" list: which files it offers, and that it can only read what it offers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const { listMaps, readMap } = createRequire(import.meta.url)('../desktop/map-library.cjs');
const map = title => JSON.stringify({ schemaVersion: 1, title, nodes: [], edges: [] }, null, 2);

function folder() {
  const root = mkdtempSync(path.join(tmpdir(), 'sss-map-library-'));
  const put = (relative, text) => { mkdirSync(path.dirname(path.join(root, relative)), { recursive: true }); writeFileSync(path.join(root, relative), text); };
  put('Skill-Solar-System.json', map('Master "atlas"'));
  put('Robotics-v3/Robotics-v3-Lessons.json', map('Robotics curriculum v3'));
  put('Robotics-v3/Robotics-v3-Preview.json', map('Old preview'));
  put('Robotics-v3/Integration-Summary.json', JSON.stringify({ generated: '2026-09-26', result: 'passed' }));
  put('Archived maps/Old-copy.json', map('Stale answers'));
  put('Backups/2026-09-10/Skill-Solar-System.json', map('Backup'));
  put('Checkpoint-2026-09-13/Master.json', map('Checkpoint'));
  put('Old-root-copies/Physics.json', map('Old root copy'));
  put('Archived maps/../Copy - Copy.json', map('Duplicate'));
  put('notes.txt', 'not a map');
  return root;
}

test('only working maps are offered: archives, backups, checkpoints, copies, previews and reports are not', async () => {
  const maps = await listMaps(folder());
  assert.deepEqual(maps.map(m => m.path), ['Skill-Solar-System.json', 'Robotics-v3/Robotics-v3-Lessons.json']);
  assert.equal(maps[0].title, 'Master "atlas"', 'titles are read, including escaped quotes');
  assert.ok(maps.every(m => m.bytes > 0));
});

test('a map is read only if the list offers it', async () => {
  const root = folder();
  const opened = await readMap(root, 'Robotics-v3/Robotics-v3-Lessons.json');
  assert.equal(opened.name, 'Robotics-v3-Lessons.json');
  assert.equal(JSON.parse(opened.text).title, 'Robotics curriculum v3');
  for (const refused of ['Archived maps/Old-copy.json', '../Skill-Solar-System.json', 'Robotics-v3/Integration-Summary.json', path.join(root, 'Skill-Solar-System.json'), null])
    await assert.rejects(readMap(root, refused), /not in the Maps folder list/, String(refused));
});

test('a missing Maps folder gives an empty list rather than an error', async () => {
  assert.deepEqual(await listMaps(path.join(tmpdir(), 'sss-no-such-maps-folder')), []);
});
