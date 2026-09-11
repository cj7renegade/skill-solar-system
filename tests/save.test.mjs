import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const { writeFileAtomic } = createRequire(import.meta.url)('../desktop/save.cjs');
const folder = () => mkdtempSync(path.join(tmpdir(), 'sss-save-'));

test('a save replaces the whole file and leaves no temporary file behind', async () => {
  const dir = folder(), target = path.join(dir, 'map.json'), content = JSON.stringify({ text: 'é'.repeat(200000) });
  writeFileSync(target, 'previous map');
  await writeFileAtomic(target, content);
  assert.equal(readFileSync(target, 'utf8'), content);
  assert.deepEqual(readdirSync(dir), ['map.json']);
});

test('a save that cannot complete leaves the existing file untouched', async () => {
  const dir = folder(), blocked = path.join(dir, 'map.json');
  mkdirSync(blocked); // a folder where the file should go: the final rename must fail
  await assert.rejects(writeFileAtomic(blocked, '{"new":true}'));
  assert.ok(statSync(blocked).isDirectory());
  assert.deepEqual(readdirSync(dir), ['map.json'], 'temporary file removed');
  await assert.rejects(writeFileAtomic(path.join(dir, 'missing-folder', 'map.json'), '{}'));
});
