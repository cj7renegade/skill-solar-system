import test from 'node:test';
import assert from 'node:assert/strict';
import { starter } from '../src/starter.js';
import { normalize, arrange, placementSummary } from '../src/model.js';
import { arrangeVortex } from '../src/vortex.js';

const sentences = text => text.split(/(?<=\.)\s+(?=[A-Z])/).length;

test('placement summary is at most two sentences and names only directly connected subjects', () => {
  for (const g of [normalize(starter), arrange(normalize(starter)), arrangeVortex(normalize(starter))]) {
    for (const n of g.nodes) {
      const text = placementSummary(g, n);
      assert.ok(sentences(text) <= 2, text);
      assert.doesNotMatch(text, /Position \(|\blevel\b|\d/i, text);
      const adjacent = new Set(g.edges.filter(e => e.source === n.id || e.target === n.id).flatMap(e => [e.source, e.target]));
      for (const other of g.nodes) if (other.id !== n.id && !adjacent.has(other.id)) assert.ok(!text.includes(other.name), `${n.name} mentions ${other.name}`);
    }
  }
});

test('summary follows real prerequisites, missing prerequisites, manual positions, and pins', () => {
  const g = normalize(starter);
  const calculus = g.nodes.find(n => n.id === 'calculus'), arithmetic = g.nodes.find(n => n.id === 'arithmetic');
  assert.match(placementSummary(g, calculus), /builds on Algebra/);
  assert.match(placementSummary(g, arithmetic), /no recorded prerequisites.*leads to Algebra/);
  arithmetic.layoutMode = 'manual';
  assert.match(placementSummary(g, arithmetic), /positioned by hand/);
  arithmetic.pinned = true;
  assert.match(placementSummary(g, arithmetic), /pinned/);
  const spiral = arrangeVortex(normalize(starter));
  assert.match(placementSummary(spiral, spiral.nodes.find(n => n.id === 'calculus')), /Mathematics strand of the spiral, it builds on Algebra/);
});

test('long prerequisite lists are shortened and old verbose notes are not repeated', () => {
  const g = normalize(starter);
  const integration = g.nodes.find(n => n.id === 'integration');
  for (const id of ['control', 'kinematics', 'actuation', 'perception']) g.edges.find(e => e.source === id && e.target === 'integration').type = 'prerequisite';
  integration.placementNote = 'At release, reference level 60/100 was provisional and was calculated as 1 + 3 × recorded prerequisite depth.';
  const text = placementSummary(g, integration);
  assert.match(text, /and 2 more/);
  assert.ok(!text.includes('provisional'));
});
