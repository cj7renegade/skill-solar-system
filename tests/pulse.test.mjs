import test from 'node:test';
import assert from 'node:assert/strict';
import { pulseIntensity, steadyIntensity, pulsingIds, PULSE_PERIOD, PULSE_RANGE } from '../src/pulse.js';

const node = (id, proficiency80) => ({ id, name: id, domain: 'Computing', proficiency80 });
const graph = { nodes: [node('yes', true), node('no', false), node('unmarked', null), node('second-yes', true)] };

test('only skills marked Yes pulse, and only while proficiency colouring is on', () => {
  assert.deepEqual(pulsingIds(graph, true), ['yes', 'second-yes']);
  assert.deepEqual(pulsingIds(graph, false), []);
  assert.deepEqual(pulsingIds(null, true), []);
  assert.deepEqual(pulsingIds({ nodes: [node('a', undefined)] }, true), []);
});

test('choosing which skills pulse never changes the map', () => {
  const before = JSON.stringify(graph);
  pulsingIds(graph, true); pulsingIds(graph, false);
  assert.equal(JSON.stringify(graph), before);
});

test('the glow stays inside its range, rises and falls smoothly, and repeats every period', () => {
  const [low, high] = PULSE_RANGE.plain;
  let previous = pulseIntensity(0);
  assert.ok(Math.abs(previous - low) < 1e-9, 'starts at the low end');
  for (let i = 1; i <= 200; i++) {
    const seconds = i * PULSE_PERIOD / 200, value = pulseIntensity(seconds);
    assert.ok(value >= low - 1e-9 && value <= high + 1e-9, `${value} outside the range`);
    assert.ok(Math.abs(value - previous) < (high - low) / 10, 'no jumps between frames');
    if (i <= 100) assert.ok(value >= previous - 1e-9, 'rises over the first half');
    else assert.ok(value <= previous + 1e-9, 'falls over the second half');
    previous = value;
  }
  assert.ok(Math.abs(pulseIntensity(PULSE_PERIOD / 2) - high) < 1e-9, 'peaks halfway');
  for (const seconds of [0.37, 1.2, 5.5]) assert.ok(Math.abs(pulseIntensity(seconds) - pulseIntensity(seconds + PULSE_PERIOD * 3)) < 1e-9, 'repeats every period');
});

test('a selected sphere pulses brighter, and reduced motion holds a steady middle glow', () => {
  for (const seconds of [0, 0.4, 0.9, 1.4]) assert.ok(pulseIntensity(seconds, true) > pulseIntensity(seconds), 'selected stays brighter');
  assert.ok(steadyIntensity() > PULSE_RANGE.plain[0] && steadyIntensity() < PULSE_RANGE.plain[1]);
  assert.ok(steadyIntensity(true) > steadyIntensity());
  assert.equal(pulseIntensity(NaN), PULSE_RANGE.plain[1]);
});
