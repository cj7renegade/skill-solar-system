import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRecordStore } from '../src/proficiency-store.js';
import { emptyRecord, recordAnswers } from '../src/proficiency.js';
const { createProficiencyStore } = createRequire(import.meta.url)('../desktop/proficiency-store.cjs');

const folder = () => path.join(mkdtempSync(path.join(tmpdir(), 'sss-record-')), 'proficiency');
const withAnswer = (family, id, value) => recordAnswers(emptyRecord(family), [{ id, value }], { source: 'console', now: 'T' });
// The renderer adapter over the desktop store, as the preload bridge wires them.
const bridgeTo = store => ({ load: family => store.load(family), save: (family, text) => store.save(family, text) });

test('a saved record survives a restart (a new store on the same folder)', async () => {
  const dir = folder(), first = createRecordStore(bridgeTo(createProficiencyStore(dir)));
  assert.equal(await first.load('test-family'), null, 'absent before the first answer');
  await first.save('test-family', withAnswer('test-family', 'm1', null));
  const restarted = createRecordStore(bridgeTo(createProficiencyStore(dir)));
  const loaded = await restarted.load('test-family');
  assert.equal(loaded.entries.m1.value, null, 'an explicit Clear is kept, not dropped');
  assert.equal(readdirSync(dir).length, 1, 'one file, no temporary files left');
});

test('families are stored in separate files and a record cannot be saved under another family', async () => {
  const dir = folder(), store = createProficiencyStore(dir);
  await store.save('family-a', JSON.stringify(withAnswer('family-a', 'x', true)));
  await store.save('family-b', JSON.stringify(withAnswer('family-b', 'x', false)));
  assert.equal(JSON.parse(await store.load('family-a')).entries.x.value, true);
  assert.equal(JSON.parse(await store.load('family-b')).entries.x.value, false);
  assert.notEqual(store.fileFor('family-a'), store.fileFor('family-b'));
  await assert.rejects(store.save('family-a', JSON.stringify(withAnswer('family-b', 'x', true))), /does not match/);
  await assert.rejects(store.save('../escape', '{}'), /Invalid atlas family/);
  await assert.rejects(store.load('bad family name'), /Invalid atlas family/);
});

test('writes run in order, and a rejected write leaves the previous record intact', async () => {
  const dir = folder(), store = createProficiencyStore(dir);
  await Promise.all([store.save('f', JSON.stringify(withAnswer('f', 'a', true))), store.save('f', JSON.stringify(withAnswer('f', 'a', false)))]);
  assert.equal(JSON.parse(await store.load('f')).entries.a.value, false, 'the later write wins');
  await assert.rejects(store.save('f', 'not json'), /Invalid proficiency record/);
  assert.equal(JSON.parse(await store.load('f')).entries.a.value, false);
});

test('a failed write is reported instead of silently succeeding', async () => {
  const dir = folder();
  writeFileSync(dir, 'a file where the record folder should be');
  const store = createRecordStore(bridgeTo(createProficiencyStore(dir)));
  await assert.rejects(store.save('f', withAnswer('f', 'a', true)));
  assert.equal(readFileSync(dir, 'utf8'), 'a file where the record folder should be');
});

test('a record that exists but cannot be read is an error, not an empty record', async () => {
  const dir = folder(), desktop = createProficiencyStore(dir);
  mkdirSync(desktop.fileFor('f'), { recursive: true }); // a folder where the record file should be
  await assert.rejects(createRecordStore(bridgeTo(desktop)).load('f'));
});

test('outside Electron the adapter keeps records in local storage and validates them', async () => {
  const data = new Map(), storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  const store = createRecordStore(null, storage);
  await store.save('f', withAnswer('f', 'a', true));
  assert.equal((await store.load('f')).entries.a.value, true);
  data.set('skill-solar-system-proficiency:f', JSON.stringify({ format: 'wrong' }));
  await assert.rejects(store.load('f'), /not a Skill Solar System proficiency record/);
});
