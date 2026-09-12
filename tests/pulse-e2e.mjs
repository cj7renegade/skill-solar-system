// End-to-end check in the real Electron app: while proficiency colouring is on, a skill marked Yes
// pulses and nothing else does. Brightness is measured from screenshots of each sphere over one
// pulse period, so it tests what is actually rendered.
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
  // Brightest minus dimmest reading of one sphere, sampled across a full pulse period.
  async function swing(name) {
    const p = await sphereOnScreen(name);
    if (!p) throw Error(`${name} is not on screen`);
    const half = Math.max(6, Math.round(8 * p.scale * 1.1));
    const clip = { x: Math.round(p.x - half), y: Math.round(p.y - half), width: half * 2, height: half * 2 };
    const readings = [];
    for (let i = 0; i < 8; i++) { readings.push(mean((await screenshot(send, clip)).image)); await sleep(PULSE_PERIOD * 1000 / 8); }
    return { swing: Math.max(...readings) - Math.min(...readings), readings };
  }

  const before = await swing('Marked yes');
  check('nothing pulses while proficiency colouring is off', before.swing < 3, `swing ${before.swing.toFixed(2)}`);
  await click('#show-proficiency', 400);
  const yes = await swing('Marked yes'), no = await swing('Marked no'), unmarked = await swing('Unmarked');
  check('a skill marked Yes pulses with proficiency colouring on', yes.swing > 8, `swing ${yes.swing.toFixed(2)}`);
  check('a skill marked No stays steady', no.swing < 3, `swing ${no.swing.toFixed(2)}`);
  check('an unmarked skill stays steady', unmarked.swing < 3, `swing ${unmarked.swing.toFixed(2)}`);
  check('the pulse is a glow on the sphere, not a growing halo', await evaluate(`Number(document.getElementById('labels').dataset.highlighted||0)`) === 0);
  await click('#show-proficiency', 400);
  const after = await swing('Marked yes');
  check('switching proficiency colouring off stops the pulse', after.swing < 3, `swing ${after.swing.toFixed(2)}`);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} proficiency pulse checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally { app.close(); }
