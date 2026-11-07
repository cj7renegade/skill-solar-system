// The pre-generate queue (candidates, one at a time, pause and resume, stopping at the cap or when
// offline) and the lesson store's zip export and import (round trip; import only adds).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { queueCandidates, createLessonQueue } from '../src/lesson-queue.js';
import { prerequisiteIndex, frontier, nextUp } from '../src/learner.js';

const require = createRequire(import.meta.url);
const { writeZip, readZip } = require('../desktop/zip.cjs');
const { createLessons } = require('../desktop/lessons.cjs');
const { archiveRecord } = require('../desktop/lesson-store.cjs');

const node = (id, extra = {}) => ({ id, name: `Skill ${id}`, domain: 'Robotics', description: '', position: [0, 0, 0], proficiency80: null, ...extra });
const graph = { nodes: [node('a', { helixLevel: 1 }), node('b', { helixLevel: 1 }), node('c', { helixLevel: 1, nodeKind: 'checkpoint' }), node('d', { helixLevel: 4 }), node('m', { helixLevel: 7, nodeKind: 'milestone' })],
  edges: [{ source: 'a', target: 'd', type: 'prerequisite' }, { source: 'd', target: 'm', type: 'prerequisite' }] };
const state = () => { const index = prerequisiteIndex(graph), front = frontier(graph, index); return { index, frontier: front, next: nextUp(graph, 'm', { index, front }) }; };
const tick = () => new Promise(r => setTimeout(r, 0));

test('candidates: next up first, then the frontier; no milestones, checkpoints or skills with lessons', () => {
  assert.deepEqual(queueCandidates(state(), () => false, 10), ['a', 'b']);
  assert.deepEqual(queueCandidates(state(), n => n.id === 'a', 10), ['b']);
  assert.deepEqual(queueCandidates(state(), () => false, 1), ['a']);
});

test('the queue runs one at a time, pauses and resumes, and stops when generating becomes unavailable', async () => {
  const calls = [], results = { a: { ok: true }, b: { ok: true }, c: { ok: false, kind: 'unavailable', message: 'This month\'s lesson budget is used up.' }, d: { ok: true } };
  let release;
  const q = createLessonQueue({ generate: id => { calls.push(id); return id === 'b' ? new Promise(r => { release = () => r(results.b); }) : Promise.resolve(results[id]); } });
  q.start(['a', 'b', 'c', 'd']);
  await tick(); await tick();
  assert.equal(q.state().running, true); assert.deepEqual(calls, ['a', 'b'], 'one at a time');
  q.pause(); release(); await tick(); await tick();
  assert.equal(q.state().running, false); assert.equal(q.state().done, 2); assert.equal(q.state().stopReason, 'Paused.');
  q.resume(); await tick(); await tick();
  assert.deepEqual(calls, ['a', 'b', 'c'], 'stops at the cap'); assert.match(q.state().stopReason, /budget/); assert.equal(q.state().done, 3);
});

test('zip: round trip with CRC checks', () => {
  const zip = writeZip([['a.json', '{"x":1}'], ['dir/ü.json', 'é'.repeat(1000)]]);
  assert.deepEqual(readZip(zip).map(([n, d]) => [n, d.toString('utf8')]), [['a.json', '{"x":1}'], ['dir/ü.json', 'é'.repeat(1000)]]);
  const bad = Buffer.from(zip); bad[40] ^= 0xff;
  assert.throws(() => readZip(bad)); assert.throws(() => readZip(Buffer.from('not a zip')), /Not a zip/);
});

test('export and import the lesson store: everything comes across, and import never replaces a lesson', async () => {
  const from = createLessons({ dir: mkdtempSync(path.join(tmpdir(), 'sss-exp-')) }), to = createLessons({ dir: mkdtempSync(path.join(tmpdir(), 'sss-imp-')) });
  const arch = archiveRecord('fam', { id: 'n1', lesson: { x: 1 }, lessonCard: { y: 2 } }, 't');
  await from.store.put(arch);
  await from.store.put({ ...arch, nodeId: 'n2', source: 'ai-generated', status: 'unreviewed', promptVersion: 'lesson-v1', model: 'claude-sonnet-5-5', content: { title: 'AI' } });
  await to.store.put({ ...arch, nodeId: 'n2', source: 'ai-generated', status: 'reviewed', promptVersion: 'lesson-v1', model: 'claude-haiku-5-5', content: { title: 'Mine' } });
  const zip = await from.exportZip();
  const r = await to.importZip(zip);
  assert.deepEqual(r, { added: 1, same: 0, keptExisting: 1, invalid: 0 });
  assert.equal((await to.get('fam', 'n2')).ai.content.title, 'Mine', 'the existing lesson is kept');
  assert.deepEqual((await to.get('fam', 'n1')).archive.content, arch.content);
  assert.deepEqual(await to.importZip(zip), { added: 0, same: 1, keptExisting: 1, invalid: 0 });
  await assert.rejects(to.importZip(writeZip([['x.json', '{}']])), /not a HelixSkill lesson export/);
});
