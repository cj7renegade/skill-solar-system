// Checks the synthetic stress-map generator: reproducible, loop-free, the requested size, its own
// atlas family, no answers, and plainly synthetic ids. It never writes a file.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { generateStressMap, checkOutputFolder, ATLAS_FAMILY } from '../authoring/stress/generate-stress-map.mjs';
import { validate, levels } from '../src/model.js';
import { lessonSections } from '../src/lesson.js';

test('the same size, variant and seed give byte-identical maps, and a different seed does not', () => {
  const a = JSON.stringify(generateStressMap({ nodes: 400, variant: 'full', seed: 7 }));
  assert.equal(JSON.stringify(generateStressMap({ nodes: 400, variant: 'full', seed: 7 })), a);
  assert.notEqual(JSON.stringify(generateStressMap({ nodes: 400, variant: 'full', seed: 8 })), a);
});

test('a generated map is a valid map the app would accept, with the requested counts and no answers', () => {
  for (const variant of ['skeleton', 'full']) {
    const graph = generateStressMap({ nodes: 2000, variant });
    validate(graph); // the app's own validator: ids, names, domains, positions, levels, no prerequisite loop
    assert.equal(graph.nodes.length, 2000);
    assert.equal(new Set(graph.nodes.map(n => n.id)).size, 2000);
    assert.ok(graph.nodes.every(n => n.proficiency80 === null), 'every answer is null');
    assert.ok(graph.nodes.every(n => /^syn:\d+$/.test(n.id) && n.name.startsWith('Synthetic skill ')), 'ids and names are plainly synthetic');
    assert.equal(graph.metadata.atlasFamily, ATLAS_FAMILY);
    assert.equal(ATLAS_FAMILY, 'stress-test-synthetic');
    const types = new Set(graph.edges.map(e => e.type));
    assert.deepEqual([...types].sort(), ['prerequisite', 'related', 'supports']);
    if (variant === 'full') {
      assert.ok(graph.nodes.every(n => n.lesson && n.lessonCard && n.contentStatus === 'introductory lesson authored'));
      assert.ok(lessonSections(graph.nodes[0]).length >= 5, 'a synthetic lesson renders like a real one');
    } else assert.ok(graph.nodes.every(n => !n.lesson));
  }
});

test('maps above the old 5,000-skill cap are still loop-free and hold the requested count', () => {
  const graph = generateStressMap({ nodes: 6000 });
  assert.equal(graph.nodes.length, 6000);
  const depth = levels(graph); // throws "Prerequisite cycle detected" on any loop
  assert.equal(depth.size, 6000);
  assert.ok(Math.max(...graph.nodes.map(n => n.skillLevel)) <= 100);
});

test('generated maps may not be written into the repository or OneDrive', () => {
  assert.throws(() => checkOutputFolder(path.resolve(import.meta.dirname, '..', 'Maps')), /inside the repository/);
  if (process.env.OneDrive) assert.throws(() => checkOutputFolder(path.join(process.env.OneDrive, 'stress')), /inside OneDrive/);
});
