// End-to-end checks for the UX upgrade (docs/ux-upgrade-plan.md) in the real app, in an isolated
// profile. The helix map is opened with every answer cleared, so the learner state starts empty.
//
//   SSS_HELIX_MAP=<copy of Maps/Humanoid-Helix-Atlas.json> SSS_ATLAS_MAP=<copy of Maps/Robotics-Atlas.json> node tests/learner-e2e.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

if (!process.env.SSS_HELIX_MAP) { console.log('Skipped: set SSS_HELIX_MAP to the helix map.'); process.exit(0); }
const { check, passed } = checker();
const helix = JSON.parse(readFileSync(process.env.SSS_HELIX_MAP, 'utf8'));
for (const n of helix.nodes) n.proficiency80 = null;
const prerequisiteCount = new Map(helix.nodes.map(n => [n.id, 0]));
for (const e of helix.edges) if (e.type === 'prerequisite') prerequisiteCount.set(e.target, prerequisiteCount.get(e.target) + 1);
const entry = new Set(helix.nodes.filter(n => !prerequisiteCount.get(n.id)).map(n => n.name));

const app = await launchApp('sss-learner-');
try {
  const { evaluate, open, pageErrors } = app;
  const text = id => evaluate(`document.getElementById(${JSON.stringify(id)})?.textContent ?? null`);
  const nextNames = () => evaluate(`[...document.querySelectorAll('#hud-next .hud-next-name')].map(e=>e.textContent)`);
  const frontierCount = () => evaluate(`Number(document.getElementById('labels').dataset.frontier)`);
  const unmarked = path.join(app.dir, 'Helix-Unmarked.json');
  writeFileSync(unmarked, JSON.stringify(helix));
  await open(unmarked);

  // Phase 1: the HUD.
  check('the HUD shows the active target, defaulting to the lowest incomplete milestone', await evaluate(`document.getElementById('hud-target')?.value`) === 'rob3:I01');
  const first = await nextNames();
  check('with nothing marked, Next up lists only entry-level skills', first.length > 0 && first.every(name => entry.has(name)), first.join(' | '));
  check('with nothing marked, the frontier glow covers exactly the entry skills', await frontierCount() === entry.size, `${await frontierCount()}`);
  const before = await text('hud-progress');
  await evaluate(`document.querySelector('#hud-next .hud-next-item').click()`); await sleep(500);
  check('a Next up item selects its skill', await evaluate(`document.querySelector('#inspector h3')?.textContent`) === first[0]);
  await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.textContent==='Yes').click()`); await sleep(500);
  const after = await nextNames();
  check('marking it proficient updates the HUD progress without a reload', (await text('hud-progress')) !== before, `${before} -> ${await text('hud-progress')}`);
  check('and Next up and the glow move on', !after.includes(first[0]) && await frontierCount() !== entry.size, after.slice(0, 3).join(' | '));
  await evaluate(`(()=>{const s=document.getElementById('hud-target');s.value='hx-sys-ms-i08';s.dispatchEvent(new Event('change'));})()`); await sleep(500);
  check('the target can be changed, and the choice holds across renders', await evaluate(`document.getElementById('hud-target').value`) === 'hx-sys-ms-i08');
  check('no page errors on the helix map', !pageErrors.length, pageErrors.slice(0, 2).join(' | '));

  if (process.env.SSS_ATLAS_MAP) {
    const atlas = path.join(app.dir, 'Robotics-Atlas.json');
    writeFileSync(atlas, readFileSync(process.env.SSS_ATLAS_MAP));
    await open(atlas);
    const options = await evaluate(`[...document.querySelectorAll('#hud-target option')].map(o=>o.value)`);
    check('the Robotics Atlas gets a HUD over its own five milestones', JSON.stringify(options) === JSON.stringify(['rob3:I01', 'rob3:I02', 'rob3:I03', 'rob3:I04', 'rob3:I05']), options.join(' '));
    check('no page errors on the Robotics Atlas', !pageErrors.length, pageErrors.slice(0, 2).join(' | '));
  }
  console.log(`\n${passed.length} checks passed.`);
} finally {
  await app.stop();
}
