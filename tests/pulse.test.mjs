import test from 'node:test';
import assert from 'node:assert/strict';
import { pulseIntensity, pulseWave, steadyIntensity, pulsingIds, PULSE_PERIOD, PULSE_RANGE, PULSE_COLORS } from '../src/pulse.js';
import { PROFICIENCY_COLORS, nodeColor } from '../src/model.js';

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

test('proficiency colouring is green for Yes and red for everything else', () => {
  assert.equal(nodeColor(node('a', true), true), PROFICIENCY_COLORS.yes);
  assert.equal(nodeColor(node('b', false), true), PROFICIENCY_COLORS.no);
  assert.equal(nodeColor(node('c', null), true), PROFICIENCY_COLORS.no);
  assert.equal(PROFICIENCY_COLORS.yes, '#32CD32');
  assert.equal(Object.keys(PROFICIENCY_COLORS).length, 2, 'no separate colour for unanswered skills');
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

test('the colour travels with the glow, from the marked-Yes green to pale tea green', () => {
  assert.equal(PULSE_COLORS.from, PROFICIENCY_COLORS.yes, 'a pulsing sphere starts at the colour a steady one uses');
  assert.equal(PULSE_COLORS.to, '#DBF3C9');
  assert.equal(pulseWave(0), 0);
  assert.ok(Math.abs(pulseWave(PULSE_PERIOD / 2) - 1) < 1e-9, 'reaches the pale end exactly at the brightest moment');
  for (let i = 0; i <= 100; i++) { const wave = pulseWave(i * PULSE_PERIOD / 100); assert.ok(wave >= 0 && wave <= 1, `${wave} outside 0..1`); }
  // One wave drives both, so colour and brightness can never drift apart.
  const [low, high] = PULSE_RANGE.plain;
  for (const seconds of [0.2, 0.5, 0.9, 1.3]) assert.ok(Math.abs(pulseIntensity(seconds) - (low + (high - low) * pulseWave(seconds))) < 1e-12);
});

test('a selected sphere pulses brighter, and reduced motion holds a steady middle glow', () => {
  for (const seconds of [0, 0.4, 0.9, 1.4]) assert.ok(pulseIntensity(seconds, true) > pulseIntensity(seconds), 'selected stays brighter');
  assert.ok(steadyIntensity() > PULSE_RANGE.plain[0] && steadyIntensity() < PULSE_RANGE.plain[1]);
  assert.ok(steadyIntensity(true) > steadyIntensity());
  assert.equal(pulseIntensity(NaN), PULSE_RANGE.plain[1]);
});
