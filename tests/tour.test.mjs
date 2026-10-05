// The guided tour's steps: every step is complete, and every place it points at exists on the page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TOUR_STEPS } from '../src/tour.js';

const page = readFileSync(path.join(import.meta.dirname, '..', 'src', 'index.html'), 'utf8');
const exists = selector => selector.startsWith('#') ? page.includes(`id="${selector.slice(1)}"`) : page.includes(`class="${selector.slice(1)}"`) || new RegExp(`class="[^"]*\\b${selector.slice(1)}\\b`).test(page);

test('every tour step has a title and short paragraphs of text', () => {
  assert.ok(TOUR_STEPS.length >= 10);
  for (const step of TOUR_STEPS) {
    assert.ok(step.title && step.title.length <= 40, step.title);
    assert.ok(Array.isArray(step.text) && step.text.length >= 1 && step.text.length <= 3, step.title);
    assert.ok(step.text.every(p => typeof p === 'string' && p.length > 20 && p.length <= 240), step.title);
  }
});

test('every place the tour points at exists on the page', () => {
  for (const step of TOUR_STEPS) for (const selector of [step.target, step.fallback].filter(Boolean)) assert.ok(exists(selector), `${step.title}: ${selector}`);
});

test('the tour covers camera movement, where things are, and good use', () => {
  const all = TOUR_STEPS.map(s => `${s.title} ${s.text.join(' ')}`).join(' ').toLowerCase();
  for (const topic of ['drag', 'right-click', 'scroll', 'right mouse', 'arrow key', 'double-click', 'escape', 'find skill', 'fit map', 'console', 'mark proficiency', 'save map', 'backup-user-data', 'archived maps'])
    assert.ok(all.includes(topic), topic);
});
