import test from 'node:test';
import assert from 'node:assert/strict';
import { editedPosition } from '../src/model.js';

test('coordinate fields left as shown keep full stored precision', () => {
  const stored = [12.3456, -0.004, 1000.125];
  const shown = stored.map(v => String(Math.round(v * 100) / 100));
  assert.deepEqual(editedPosition(stored, shown), stored);
});

test('edited coordinate fields use the entered value', () => {
  assert.deepEqual(editedPosition([12.3456, 5, 6], ['20', '5', '6.5']), [20, 5, 6.5]);
});
