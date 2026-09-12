// End-to-end check in the real Electron app: with proficiency colouring on, skills marked Yes are
// green and pulse in brightness and colour, while every other skill is a steady red. Brightness and
// colour are measured from screenshots of each sphere over one pulse period.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { screenshot } from './e2e-pixels.mjs';
import { PULSE_PERIOD } from '../src/pulse.js';

const { check, passed } = checker();
const app = await launchApp('sss-pulse-e2e-');
try {
  const { send, evaluate, open, click, sphereOnScreen, pageErrors } = app;
  const node = (id, name, proficiency80, position) => ({ id, name, domain: 'Computing', description: `${name}.`, details: '', position, pinned: false, proficiency80, icon: 'code', placementNote: '', layoutMode: 'saved' });
  const file = path.join(app.dir, 'pulse.json');
  writeFileSync(file, JSON.stringify({ schemaVersion: 1, title: 'Pulse test map', edges: [], nodes: [
    node('y', 'Marked yes', true, [-120, 200, 0]), node('n', 'Marked no', false, [0, 200, 0]), node('u', 'Unmarked', null, [120, 200, 0])] }));
  await open(file);
  await click('#home', 400);
  const mean = image => { let sum = 0; for (let i = 0; i < image.data.length; i += image.channels) sum += image.data[i] + image.data[i + 1] + image.data[i + 2]; return sum / (image.width * image.height * 3); };
  // Average of the brightest pixels in the clip, which is the sphere rather than the background.
  const sphereColour = image => {
    const pixels = [];
    for (let i = 0; i < image.data.length; i += image.channels) pixels.push([image.data[i], image.data[i + 1], image.data[i + 2]]);
    pixels.sort((a, b) => (b[0] + b[1] + b[2]) - (a[0] + a[1] + a[2]));
    const top = pixels.slice(0, Math.max(4, Math.round(pixels.length * 0.15)));
    return top.reduce((t, p) => [t[0] + p[0] / top.length, t[1] + p[1] / top.length, t[2] + p[2] / top.length], [0, 0, 0]).map(v => Math.round(v));
  };
  // Samples one sphere across a full pulse period and reports its dimmest and brightest moments.
  async function sample(name) {
    const p = await sphereOnScreen(name);
    if (!p) throw Error(`${name} is not on screen`);
    const half = Math.max(6, Math.round(8 * p.scale * 1.1));
    const clip = { x: Math.round(p.x - half), y: Math.round(p.y - half), width: half * 2, height: half * 2 };
    const frames = [];
    for (let i = 0; i < 8; i++) { const image = (await screenshot(send, clip)).image; frames.push({ level: mean(image), colour: sphereColour(image) }); await sleep(PULSE_PERIOD * 1000 / 8); }
    frames.sort((a, b) => a.level - b.level);
    return { swing: frames.at(-1).level - frames[0].level, dim: frames[0].colour, bright: frames.at(-1).colour };
  }
  const greenish = c => c[1] > c[0] * 1.2 && c[1] > c[2] * 1.05;
  const reddish = c => c[0] > c[1] * 1.2 && c[0] > c[2] * 1.05;

  const before = await sample('Marked yes');
  check('nothing pulses while proficiency colouring is off', before.swing < 3, `swing ${before.swing.toFixed(2)}`);
  await click('#show-proficiency', 400);
  const yes = await sample('Marked yes'), no = await sample('Marked no'), unmarked = await sample('Unmarked');
  check('a skill marked Yes pulses with proficiency colouring on', yes.swing > 8, `swing ${yes.swing.toFixed(2)}`);
  check('a skill marked No stays steady', no.swing < 3, `swing ${no.swing.toFixed(2)}`);
  check('an unmarked skill stays steady', unmarked.swing < 3, `swing ${unmarked.swing.toFixed(2)}`);
  check('a skill marked Yes is green', greenish(yes.dim), `rgb ${yes.dim}`);
  check('a skill marked No is red', reddish(no.dim), `rgb ${no.dim}`);
  check('an unanswered skill is red too, not grey', reddish(unmarked.dim), `rgb ${unmarked.dim}`);
  check('the pulsing colour travels from green towards pale tea green', yes.bright[0] > yes.dim[0] + 10 && yes.bright[2] > yes.dim[2] + 10, `${yes.dim} -> ${yes.bright}`);
  check('the pulse is a glow on the sphere, not a growing halo', await evaluate(`Number(document.getElementById('labels').dataset.highlighted||0)`) === 0);
  await click('#show-proficiency', 400);
  const after = await sample('Marked yes');
  check('switching proficiency colouring off stops the pulse', after.swing < 3, `swing ${after.swing.toFixed(2)}`);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} proficiency pulse checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally { app.close(); }
