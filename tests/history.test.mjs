// The Undo budget: how many whole-map copies are kept, by map size.
import test from 'node:test';
import assert from 'node:assert/strict';
import { undoLimit, trimHistory, MAX_UNDO_STEPS, MIN_UNDO_STEPS, UNDO_BUDGET_CHARS } from '../src/history.js';

test('small and ordinary maps keep the full 50 steps', () => {
  assert.equal(MAX_UNDO_STEPS, 50);
  assert.equal(undoLimit(0), 50, 'before the first save the size is unknown: keep the usual 50');
  assert.equal(undoLimit(4_659_156), 50, 'the master atlas as a draft (measured)');
  assert.equal(undoLimit(7_600_000), 50, 'the merged atlas estimate');
});

test('very large maps keep fewer steps, never fewer than five', () => {
  assert.equal(undoLimit(27_482_917), 18, 'the 10,000-skill skeleton map');
  assert.equal(undoLimit(73_739_503), 6, 'the 10,000-skill map with lessons, which crashed at 47 steps');
  assert.equal(undoLimit(135_000_000), MIN_UNDO_STEPS, 'a map at the 150 MB file cap');
  for (const size of [1, 1e6, 1e7, 1e8, 1e9]) {
    const steps = undoLimit(size);
    assert.ok(steps >= MIN_UNDO_STEPS && steps <= MAX_UNDO_STEPS);
    assert.ok(steps === MIN_UNDO_STEPS || steps * size <= UNDO_BUDGET_CHARS, 'the kept copies fit the budget');
  }
});

test('trimming drops the oldest steps first', () => {
  const steps = [1, 2, 3, 4, 5, 6, 7];
  assert.equal(trimHistory(steps, 5), steps);
  assert.deepEqual(steps, [3, 4, 5, 6, 7]);
  assert.deepEqual(trimHistory([1, 2], 5), [1, 2]);
});
