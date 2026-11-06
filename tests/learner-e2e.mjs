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
  // Phase 2: the course key isolates a course or a family; a second click clears it.
  const faded = () => evaluate(`Number(document.getElementById('labels').dataset.faded)`);
  const isolate = key => evaluate(`document.querySelector('#legend [data-isolate="${key}"]').click()`).then(() => sleep(500));
  const total = helix.nodes.length, act = helix.nodes.filter(n => n.courseCode === 'ACT').length;
  const body = helix.nodes.filter(n => ['MEC', 'ACT', 'PWR'].includes(n.courseCode)).length;
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`); await sleep(400);
  await isolate('course:ACT');
  check('clicking a course isolates it: every other skill fades', await faded() === total - act, `${await faded()} faded`);
  check('the course row shows its skill count and % proficient', /^ACT · .*128 · \d+%$/.test(await evaluate(`document.querySelector('#legend [data-isolate="course:ACT"]').textContent`)));
  await isolate('course:ACT');
  check('clicking it again clears the isolation', await faded() === 0);
  await isolate('family:body');
  check('clicking a family header isolates the whole family', await faded() === total - body, `${await faded()} faded`);
  await isolate('family:body');
  await evaluate(`(()=>{const e=document.getElementById('show-proficiency');e.checked=true;e.dispatchEvent(new Event('change'));})()`); await sleep(400);
  const states = await evaluate(`[...document.querySelectorAll('#legend .legend-item')].map(e=>e.textContent).filter(t=>/Proficient|Not marked|Marked No|ready to study/.test(t))`);
  check('the proficiency key names gold, grey, slate and the glow, with no red/green pair', states.length === 4, states.join(' | '));
  await evaluate(`(()=>{const e=document.getElementById('show-proficiency');e.checked=false;e.dispatchEvent(new Event('change'));})()`);
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
