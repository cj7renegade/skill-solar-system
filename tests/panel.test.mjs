import test from 'node:test';
import assert from 'node:assert/strict';
import { listOrder, recentAnswers } from '../src/panel.js';

const node = (id, helixLevel) => ({ id, name: id, helixLevel, position: [0, 0, 0] });
const nodes = [node('d', 1), node('a', 7), node('c', 4), node('b', 4), node('e', 10)];

test('the skill list puts ready skills first, then recently answered, then lowest level', () => {
  const recent = [{ id: 'e', at: '2026-11-06T10:00:00Z' }, { id: 'a', at: '2026-11-05T10:00:00Z' }];
  assert.deepEqual(listOrder(nodes, { frontier: new Set(['c']), recent }).map(n => n.id), ['c', 'e', 'a', 'd', 'b']);
  assert.deepEqual(listOrder(nodes, { frontier: new Set(['c']), recent, mode: 'az' }).map(n => n.id), ['a', 'b', 'c', 'd', 'e']);
});

test('recent answers come from the shared record, newest first, for skills in this map only', () => {
  const record = { entries: { a: { value: true, updatedAt: '2026-11-05T09:00:00Z' }, gone: { value: true, updatedAt: '2026-11-06T09:00:00Z' }, c: { value: null, updatedAt: '2026-11-06T08:00:00Z' }, d: { value: false } } };
  assert.deepEqual(recentAnswers(record, { nodes }).map(r => r.id), ['c', 'a']);
  assert.deepEqual(recentAnswers(null, { nodes }), []);
});
