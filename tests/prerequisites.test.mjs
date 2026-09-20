// Checks the prerequisite chain a skill card offers to mark in one pass. The chain is read from
// the map's own prerequisite edges; nothing here writes or infers an answer.
import test from 'node:test';
import assert from 'node:assert/strict';
import { prerequisiteChain, chainSummary, defaultSelection, pendingChanges, stepLabel } from '../src/prerequisites.js';
import { validate, normalize } from '../src/model.js';
import { buildQueue } from '../src/review.js';

const node = (id, name, extra = {}) => ({ id, name, domain: 'Computing', description: '', details: '', position: [0, 0, 0], pinned: false, proficiency80: null, icon: 'code', layoutMode: 'manual', ...extra });
const edge = (source, target, type = 'prerequisite') => ({ source, target, type });

// The example from the request: modules rests on functions, which rests on expressions, which rests
// on order of operations and variables. Two branches converge, and one link is only "supports".
const sample = () => normalize(validate({
  schemaVersion: 1, title: 'Chain map',
  nodes: [
    node('modules', 'Modules and imports'),
    node('functions', 'Functions, parameters, and return values'),
    node('expressions', 'Expressions and operators'),
    node('order', 'Order of operations for basic arithmetic'),
    node('variables', 'Variables and assignment', { proficiency80: true }),
    node('naming', 'Naming things clearly', { proficiency80: false }),
    node('style', 'Code style', { domain: 'Mathematics' }),
    node('later', 'Packaging and distribution')
  ],
  edges: [
    edge('functions', 'modules'), edge('naming', 'modules'),
    edge('expressions', 'functions'),
    edge('order', 'expressions'), edge('variables', 'expressions'),
    edge('style', 'modules', 'supports'), edge('modules', 'later')
  ]
}));

test('the chain reaches every skill underneath, nearest first, most fundamental last', () => {
  const chain = prerequisiteChain(sample(), 'modules');
  assert.deepEqual(chain.map(s => s.name), [
    'Functions, parameters, and return values',
    'Naming things clearly',
    'Expressions and operators',
    'Order of operations for basic arithmetic',
    'Variables and assignment'
  ]);
  assert.deepEqual(chain.map(s => s.steps), [1, 1, 2, 3, 3]);
  // A supporting link is not learning order, so Code style is not in the chain.
  assert.ok(!chain.some(s => s.id === 'style'));
  // Nor is anything the skill leads to.
  assert.ok(!chain.some(s => s.id === 'later'));
  // Nor the skill itself.
  assert.ok(!chain.some(s => s.id === 'modules'));
});

test('the chain carries each skill\'s current answer, and summarises them', () => {
  const chain = prerequisiteChain(sample(), 'modules');
  assert.equal(chain.find(s => s.id === 'variables').proficiency80, true);
  assert.equal(chain.find(s => s.id === 'naming').proficiency80, false);
  assert.equal(chain.find(s => s.id === 'functions').proficiency80, null);
  assert.deepEqual(chainSummary(chain), { total: 5, yes: 1, no: 1, unmarked: 3, depth: 3 });
  assert.deepEqual(chainSummary([]), { total: 0, yes: 0, no: 0, unmarked: 0, depth: 0 });
});

test('a skill with nothing underneath offers no chain', () => {
  assert.deepEqual(prerequisiteChain(sample(), 'variables'), []);
  assert.deepEqual(prerequisiteChain(sample(), 'nobody'), []);
});

test('a shared prerequisite is listed once, at its shortest distance', () => {
  const graph = normalize(validate({
    schemaVersion: 1, title: 'Diamond',
    nodes: ['top', 'left', 'right', 'base'].map(id => node(id, id)),
    edges: [edge('left', 'top'), edge('right', 'top'), edge('base', 'left'), edge('base', 'right'), edge('base', 'top')]
  }));
  const chain = prerequisiteChain(graph, 'top');
  assert.equal(chain.filter(s => s.id === 'base').length, 1);
  assert.equal(chain.find(s => s.id === 'base').steps, 1, 'reachable directly, so one step, not two');
});

test('the tick marks only what the chosen answer would change, and the reader can change that', () => {
  const chain = prerequisiteChain(sample(), 'modules');
  const yes = defaultSelection(chain, true);
  assert.ok(!yes.has('variables'), 'already Yes, so reconfirming it would do nothing');
  assert.equal(yes.size, 4);
  assert.deepEqual(pendingChanges(chain, yes, true).sort(), ['expressions', 'functions', 'naming', 'order']);
  // Ticking a skill that already holds the answer still changes nothing.
  assert.deepEqual(pendingChanges(chain, new Set(['variables']), true), []);
  // Clear is an answer too: it removes the two that hold one.
  assert.deepEqual(pendingChanges(chain, defaultSelection(chain, null), null).sort(), ['naming', 'variables']);
  // Unticking everything leaves nothing to do.
  assert.deepEqual(pendingChanges(chain, new Set(), true), []);
});

test('marking a chain changes those skills and nothing else in the map', () => {
  const before = sample();
  const chain = prerequisiteChain(before, 'modules');
  const ids = new Set(pendingChanges(chain, defaultSelection(chain, true), true));
  // What the dialog's commit does.
  const after = normalize(validate({ ...before, nodes: before.nodes.map(n => ids.has(n.id) ? { ...n, proficiency80: true } : n) }));
  assert.equal(after.nodes.find(n => n.id === 'modules').proficiency80, null, 'the skill the chain belongs to is untouched');
  assert.equal(after.nodes.find(n => n.id === 'style').proficiency80, null, 'a supporting skill is untouched');
  assert.equal(after.nodes.find(n => n.id === 'later').proficiency80, null, 'a skill above is untouched');
  assert.equal(after.nodes.find(n => n.id === 'naming').proficiency80, true, 'a No becomes Yes when it was checked');
  for (const n of after.nodes) {
    const was = before.nodes.find(x => x.id === n.id);
    assert.deepEqual({ ...n, proficiency80: null }, { ...was, proficiency80: null }, `${n.id}: only proficiency changes`);
  }
  assert.deepEqual(after.edges, before.edges);
  assert.deepEqual(buildQueue(after, 'all'), buildQueue(before, 'all'), 'review order is unaffected');
});

test('the step headings read as distance below the skill', () => {
  assert.equal(stepLabel(1), 'Direct prerequisites');
  assert.equal(stepLabel(2), '2 steps further down');
});

test('a deep chain terminates and stays ordered', () => {
  const depth = 200;
  const graph = normalize(validate({
    schemaVersion: 1, title: 'Long chain',
    nodes: Array.from({ length: depth }, (_, i) => node(`k${i}`, `Skill ${String(i).padStart(3, '0')}`)),
    edges: Array.from({ length: depth - 1 }, (_, i) => edge(`k${i}`, `k${i + 1}`))
  }));
  const chain = prerequisiteChain(graph, `k${depth - 1}`);
  assert.equal(chain.length, depth - 1);
  assert.equal(chain[0].id, `k${depth - 2}`);
  assert.equal(chain.at(-1).id, 'k0');
  assert.equal(chain.at(-1).steps, depth - 1);
});
