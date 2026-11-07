// The lesson store and the migration of embedded lessons: dry run, apply (backup, archives, rewritten
// maps), and the restore round trip, on fixture maps in a temporary folder. Real maps are not touched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { stripLessons, restoreLessons, planMap, sha256, graphFingerprint } from '../scripts/lesson-migration.mjs';
import { migrate } from '../scripts/migrate-lessons-to-store.mjs';
import { restore } from '../scripts/restore-lessons.mjs';

const require = createRequire(import.meta.url);
const { createLessonStore, archiveRecord } = require('../desktop/lesson-store.cjs');

const node = (id, extra = {}) => ({ id, name: `Skill ${id}`, domain: 'Robotics', description: 'd', position: [1, 2, 3], pinned: false, proficiency80: null, ...extra });
const lesson = id => ({ id, explanation: `Explain ${id} — “quotes”, ünïcode, 1e-3 and 0.1+0.2`, practice: { question: 'q?', answer: 'a' }, references: [{ url: 'https://example.org', use: 'u' }] });
const card = id => ({ edition: 'core-lessons-08', demonstration: `Demo ${id}`, assessmentContract: { mode: 'written calculation', evidence_record: ['x'] } });
function fixture(family = 'fam-a') {
  return { schemaVersion: 1, title: 'Fixture', metadata: { atlasFamily: family },
    nodes: [node('a:1', { lessonCard: card('a'), lesson: lesson('a'), course: 'X', proficiency80: true }), node('b', { proficiency80: false }), node('c', { lesson: lesson('c'), lessonCard: card('c'), helixLevel: 4 })],
    edges: [{ source: 'a:1', target: 'c', type: 'prerequisite' }] };
}
const dir = () => mkdtempSync(path.join(tmpdir(), 'sss-lessons-'));

test('store: archives and AI lessons are separate files, validated, listed per map key', async () => {
  const store = createLessonStore(dir());
  const record = archiveRecord('fam-a', fixture().nodes[0], '2026-11-06T00:00:00Z');
  await store.put(record);
  await store.put({ ...record, source: 'ai-generated', status: 'unreviewed', promptVersion: 'v1', content: { objectives: [] } });
  const both = await store.get('fam-a', 'a:1');
  assert.equal(both.archive.source, 'reviewed-archive'); assert.equal(both.ai.status, 'unreviewed');
  assert.deepEqual(Object.keys(await store.list('fam-a')), ['a:1']);
  assert.equal((await store.list('fam-a'))['a:1'].ai.promptVersion, 'v1');
  await store.removeAi('fam-a', 'a:1');
  assert.equal((await store.get('fam-a', 'a:1')).ai, null); assert.ok((await store.get('fam-a', 'a:1')).archive, 'the archive is kept');
  assert.throws(() => store.put({ ...record, status: 'proficient' }), /Invalid lesson record/);
  assert.throws(() => store.put({ ...record, nodeId: '../x' }), /Invalid/);
  assert.deepEqual(await store.list('nothing-here'), {});
});

test('strip and restore: only the two fields move, and the file comes back byte-identical', () => {
  const text = JSON.stringify(fixture(), null, 2) + '\n';
  const out = stripLessons(text, 'now');
  assert.equal(out.records.length, 2); assert.equal(out.format, 'pretty'); assert.equal(out.mapKey, 'fam-a');
  assert.deepEqual(out.positions, { 'a:1': { lessonCard: 7, lesson: 8 }, c: { lesson: 7, lessonCard: 8 } });
  assert.ok(!out.text.includes('"lesson"') && !out.text.includes('lessonCard'));
  assert.deepEqual(graphFingerprint(JSON.parse(out.text)), graphFingerprint(fixture()), 'graph, answers and every other field unchanged');
  const records = new Map(out.records.map(r => [r.nodeId, JSON.parse(JSON.stringify(r))]));
  assert.equal(JSON.stringify(records.get('a:1').content.lesson), JSON.stringify(fixture().nodes[0].lesson));
  const back = restoreLessons(out.text, out.format, out.positions, id => records.get(id));
  assert.equal(back.restored, 2); assert.equal(back.text, text);
  // compact files keep their format too
  const compact = JSON.stringify(fixture());
  assert.equal(restoreLessons(stripLessons(compact, 'now').text, 'compact', stripLessons(compact, 'now').positions, id => records.get(id)).text, compact);
  assert.throws(() => stripLessons(JSON.stringify(fixture(), null, 4), 'now'), /format/);
});

test('migration: dry run changes nothing; apply backs up, archives and rewrites; restore round-trips', async () => {
  const work = dir(), store = path.join(work, 'store'), backup = path.join(work, 'backup');
  const a = path.join(work, 'A.json'), b = path.join(work, 'B.json'), none = path.join(work, 'None.json');
  const textA = JSON.stringify(fixture(), null, 2) + '\n', textB = JSON.stringify({ ...fixture(), title: 'Sub-map' }, null, 2) + '\n';
  const noLessons = JSON.stringify({ ...fixture('fam-b'), nodes: [node('z')], edges: [] }, null, 2) + '\n';
  writeFileSync(a, textA); writeFileSync(b, textB); writeFileSync(none, noLessons);
  const quiet = () => {};

  const dry = await migrate({ apply: false, maps: [a, b, none], store, backup }, quiet);
  assert.equal(dry.total, 4); assert.equal(readFileSync(a, 'utf8'), textA); assert.ok(!existsSync(store) && !existsSync(backup));

  const done = await migrate({ apply: true, maps: [a, b, none], store, backup }, quiet);
  assert.equal(done.moved, 4, 'count moved = nodes that had lessons');
  assert.equal(planMap(readFileSync(a, 'utf8')).lessons, 0);
  assert.equal(readFileSync(none, 'utf8'), noLessons, 'a map without lessons is left byte-identical');
  const sums = readFileSync(path.join(backup, 'SHA256SUMS'), 'utf8');
  for (const t of [textA, textB, noLessons]) assert.ok(sums.includes(sha256(t)), 'every map backed up with its hash');
  const s = createLessonStore(store);
  assert.deepEqual(Object.keys(await s.list('fam-a')).sort(), ['a:1', 'c'], 'a family shares one archive per node');
  assert.equal(JSON.stringify((await s.read('fam-a', 'c', 'archive')).content.lesson), JSON.stringify(fixture().nodes[2].lesson));

  // a second run finds nothing to move and keeps the one-time backup
  const again = await migrate({ apply: true, maps: [a, b, none], store, backup }, quiet);
  assert.equal(again.moved, 0); assert.equal(readdirSync(backup).filter(f => f.endsWith('.json') && f !== 'manifest.json').length, 3);

  const results = await restore({ apply: true, manifest: path.join(backup, 'manifest.json'), store }, quiet);
  assert.ok(results.every(r => r.identical), JSON.stringify(results));
  assert.equal(readFileSync(a, 'utf8'), textA); assert.equal(readFileSync(b, 'utf8'), textB);
});

test('migration refuses to overwrite a different archive for the same node', async () => {
  const work = dir(), store = path.join(work, 'store'), backup = path.join(work, 'backup'), a = path.join(work, 'A.json');
  const other = fixture(); other.nodes[0].lesson.explanation = 'Something else';
  await createLessonStore(store).put(archiveRecord('fam-a', other.nodes[0], 'then'));
  const text = JSON.stringify(fixture(), null, 2) + '\n';
  writeFileSync(a, text);
  await assert.rejects(migrate({ apply: true, maps: [a], store, backup }, () => {}), /different archived lesson/);
  assert.equal(readFileSync(a, 'utf8'), text, 'the map is unchanged');
});
