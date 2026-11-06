// Screenshots for the UX upgrade (docs/ux-upgrade-plan.md), taken in the real app in an isolated
// profile, on scratch copies of the maps. Runs against the UI before and after each phase: steps the
// current UI lacks (path mode, plan view) are skipped, not failed.
//
//   SSS_HELIX_MAP=<copy> SSS_ATLAS_MAP=<copy> SSS_SHOT_TAG=phase1 node tests/ux-screens.mjs
import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launchApp, sleep } from './e2e-harness.mjs';

if (!process.env.SSS_HELIX_MAP) { console.log('Skipped: set SSS_HELIX_MAP.'); process.exit(0); }
const TAG = process.env.SSS_SHOT_TAG || 'shot';
const SHOTS = path.join(path.resolve(import.meta.dirname, '..'), 'docs', 'screenshots', 'ux-upgrade');
mkdirSync(SHOTS, { recursive: true });
const map = JSON.parse(readFileSync(process.env.SSS_HELIX_MAP, 'utf8'));
const parents = new Map(map.nodes.map(n => [n.id, 0]));
for (const e of map.edges) if (e.type === 'prerequisite') parents.set(e.target, parents.get(e.target) + 1);
// A few skills to mark Yes: the entry skills, then one skill each of them unlocks.
const roots = map.nodes.filter(n => !parents.get(n.id));
const MARK = [...roots, ...roots.map(r => map.nodes.find(n => map.edges.some(e => e.type === 'prerequisite' && e.source === r.id && e.target === n.id))).filter(Boolean)];

const app = await launchApp('sss-ux-');
try {
  const { evaluate, open, send, pageErrors } = app;
  const shot = async name => { await sleep(700); const { data } = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, `${TAG}-${name}.png`), Buffer.from(data, 'base64')); console.log(`  screenshot ${TAG}-${name}.png`); };
  const has = selector => evaluate(`!!document.querySelector(${JSON.stringify(selector)})`);
  const toggle = (id, value) => evaluate(`(()=>{const e=document.getElementById('${id}');if(!e)return false;e.checked=${value};e.dispatchEvent(new Event('change'));return true;})()`);
  const select = name => evaluate(`(()=>{const b=[...document.querySelectorAll('.node-item')].find(b=>b.dataset.name===${JSON.stringify(name)}||b.textContent===${JSON.stringify(name)});if(!b)return false;b.click();return true;})()`);
  const markYes = name => evaluate(`(()=>{const b=[...document.querySelectorAll('#inspector button')].find(b=>b.textContent==='Yes');if(!b)return false;b.click();return true;})()`);
  const fit = async () => { await evaluate(`document.getElementById('home').click()`); await sleep(500); };
  const deselect = async () => { await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`); await sleep(300); };

  const helixMap = path.join(app.dir, 'Humanoid-Helix-Atlas.json');
  copyFileSync(process.env.SSS_HELIX_MAP, helixMap);
  await open(helixMap); await fit();
  await shot('01-helix-course-view');
  for (const n of MARK) { if (await select(n.name)) { await sleep(150); await markYes(n.name); await sleep(150); } }
  console.log(`  marked ${MARK.length} skills Yes`);
  await deselect(); await fit();
  await shot('02-hud-with-progress');
  await toggle('show-proficiency', true); await sleep(300);
  await shot('03-helix-proficiency-view');
  await toggle('show-proficiency', false);
  const NEW_SKILL = map.nodes.find(n => n.id === 'hx-act-harmonic-drive');
  await select(NEW_SKILL.name); await sleep(400);
  await shot('04-selected-skill-panel');
  if (await has('#path-to-selected')) {
    await evaluate(`document.getElementById('path-to-selected').click()`); await sleep(900);
    await shot('05-path-mode');
    if (await has('#plan-toggle')) { await evaluate(`document.getElementById('plan-toggle').click()`); await sleep(900); await shot('06-plan-view'); await evaluate(`document.getElementById('plan-toggle').click()`); }
    await evaluate(`document.getElementById('exit-path')?.click()`); await sleep(300);
  }
  await deselect(); await fit();
  if (process.env.SSS_ATLAS_MAP) {
    const atlasMap = path.join(app.dir, 'Robotics-Atlas.json');
    copyFileSync(process.env.SSS_ATLAS_MAP, atlasMap);
    await open(atlasMap); await fit();
    await shot('07-robotics-atlas');
  }
  console.log(pageErrors.length ? `PAGE ERRORS: ${pageErrors.slice(0, 3).join(' | ')}` : 'no page errors');
} finally {
  await app.stop();
}
