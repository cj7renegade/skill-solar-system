import test from 'node:test';
import assert from 'node:assert/strict';
import { gridLevel, gridSpacing, gridBlend, GRID_BASE, GRID_STEP, GRID_TARGET_PIXELS, GRID_SHADER } from '../src/grid.js';

// World units per pixel, from a close inspection of one sphere out to a whole atlas on screen.
const zooms = Array.from({ length: 400 }, (_, i) => 0.02 * 1.05 ** i);

test('close up the grid keeps its finest spacing', () => {
  for (const perPixel of [0.001, 0.05, 0.2, 0.8]) {
    assert.equal(gridSpacing(perPixel), GRID_BASE);
    assert.equal(gridBlend(perPixel), 0);
  }
});

test('spacing steps up by whole levels as the camera pulls back, and never shrinks', () => {
  let previous = 0;
  for (const perPixel of zooms) {
    const spacing = gridSpacing(perPixel);
    assert.ok(spacing >= previous, `spacing fell at ${perPixel}`);
    const level = Math.round(Math.log(spacing / GRID_BASE) / Math.log(GRID_STEP));
    assert.ok(Number.isInteger(level) && level >= 0, `spacing ${spacing} is not a level of ${GRID_BASE}`);
    assert.ok(Math.abs(spacing - GRID_BASE * GRID_STEP ** level) < 1e-6);
    previous = spacing;
  }
  assert.ok(gridSpacing(zooms.at(-1)) > gridSpacing(zooms[0]) * 1000, 'far views use a much coarser grid');
});

test('a readable grid is always on screen: cells never collapse below a few pixels', () => {
  for (const perPixel of zooms) {
    const finePixels = gridSpacing(perPixel) / perPixel, coarsePixels = finePixels * GRID_STEP;
    // The finer level may thin out to a fifth of the target, but the coarser one is always visible.
    assert.ok(finePixels >= GRID_TARGET_PIXELS / GRID_STEP - 1e-9, `${finePixels.toFixed(1)} px cells at ${perPixel}`);
    assert.ok(coarsePixels >= GRID_TARGET_PIXELS - 1e-9, `${coarsePixels.toFixed(1)} px cells at ${perPixel}`);
    // Once the grid is subdividing, cells stay within one step of the target. Closer than that it
    // stops subdividing on purpose, so cells simply grow rather than shimmering.
    if (gridLevel(perPixel) > 0) assert.ok(coarsePixels <= GRID_TARGET_PIXELS * GRID_STEP + 1e-9, `${coarsePixels.toFixed(1)} px cells at ${perPixel}`);
  }
});

test('the blend runs from 0 to 1 within a level, so the finer subdivision fades out smoothly', () => {
  for (const perPixel of zooms) {
    const blend = gridBlend(perPixel);
    assert.ok(blend >= 0 && blend < 1, `${blend} at ${perPixel}`);
  }
  // Just below a step the finer grid has faded almost entirely; just above, the next one starts fresh.
  const boundary = GRID_BASE * GRID_STEP / GRID_TARGET_PIXELS;
  assert.ok(gridBlend(boundary * 0.999) > 0.99);
  assert.ok(gridBlend(boundary * 1.001) < 0.01);
  assert.equal(gridSpacing(boundary * 1.001), GRID_BASE * GRID_STEP);
});

test('impossible inputs fall back to the finest spacing instead of breaking the shader', () => {
  for (const perPixel of [0, -5, NaN, Infinity]) {
    assert.equal(gridLevel(perPixel), 0);
    assert.equal(gridSpacing(perPixel), GRID_BASE);
  }
});

test('the shader uses the same constants and functions as the tested code', () => {
  assert.match(GRID_SHADER, new RegExp(`const float GRID_BASE = ${GRID_BASE.toFixed(1)}`));
  assert.match(GRID_SHADER, new RegExp(`const float GRID_STEP = ${GRID_STEP.toFixed(1)}`));
  assert.match(GRID_SHADER, new RegExp(`const float GRID_TARGET = ${GRID_TARGET_PIXELS.toFixed(1)}`));
  for (const fn of ['gridLevel', 'gridSpacing', 'gridBlend']) assert.match(GRID_SHADER, new RegExp(`float ${fn}\\(float perPixel\\)`));
});
