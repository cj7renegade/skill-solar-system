// The map size limits: their values, their messages, and that every place enforcing them agrees.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { LIMITS, validate } from '../src/model.js';
import { generateStressMap } from '../authoring/stress/generate-stress-map.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

test('the limits are 25,000 skills, 100,000 connections and 150 MB', () => {
  assert.deepEqual(LIMITS, { nodes: 25000, edges: 100000, mapBytes: 150_000_000 });
});

test('a map over the skill or connection limit is refused with a message naming both limits', () => {
  const message = /at most 25,000 nodes and 100,000 connections/;
  assert.throws(() => validate({ schemaVersion: 1, nodes: new Array(LIMITS.nodes + 1).fill({}), edges: [] }), message);
  assert.throws(() => validate({ schemaVersion: 1, nodes: [], edges: new Array(LIMITS.edges + 1).fill({}) }), message);
});

test('a map above the old 5,000-skill limit is now accepted', () => {
  const graph = generateStressMap({ nodes: 6000 });
  assert.equal(validate(graph).nodes.length, 6000);
});

test('opening and saving use the same file-size limit', () => {
  const main = readFileSync(path.join(ROOT, 'desktop', 'main.cjs'), 'utf8');
  const saved = Number(main.match(/const MAX_MAP_BYTES = ([\d_]+);/)[1].replace(/_/g, ''));
  assert.equal(saved, LIMITS.mapBytes, 'desktop/main.cjs save cap');
  assert.match(main, /Buffer\.byteLength\(content\) > MAX_MAP_BYTES/);
  const app = readFileSync(path.join(ROOT, 'src', 'app.js'), 'utf8');
  assert.match(app, /if\(size>LIMITS\.mapBytes\)throw Error\(`Map files must be smaller than \$\{LIMITS\.mapBytes\/1_000_000\} MB\.`\)/);
  assert.ok(!/10_000_000/.test(app) && !/10_000_000/.test(main), 'the old 10 MB cap is gone');
});
