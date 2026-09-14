// Optional end-to-end check of the integrated DC Circuits batch in the real Electron app, using
// copies of the local maps in an isolated profile with its own proficiency store, so the user's real
// answers are never touched. Set SSS_ATLAS to the master and SSS_DC_SUBMAP to the DC sub-map; set
// SSS_SHOTS to a folder to keep screenshots.
import { copyFileSync, readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { screenshot } from './e2e-pixels.mjs';
import { loadBatch } from '../authoring/dc-circuits/merge.mjs';

if (!process.env.SSS_ATLAS || !process.env.SSS_DC_SUBMAP) { console.log('Skipped: set SSS_ATLAS and SSS_DC_SUBMAP to check the integrated DC batch.'); process.exit(0); }
const { check, passed } = checker();
const batch = loadBatch();
const app = await launchApp('sss-dc-atlas-');
const shots = process.env.SSS_SHOTS; if (shots) mkdirSync(shots, { recursive: true });
const keep = async name => { if (shots) writeFileSync(path.join(shots, `${name}.png`), (await screenshot(app.send)).png); };
try {
  const { evaluate, open, click, wheel, key, canvasCenter, selectedLabel, sphereOnScreen, labels, pageErrors } = app;
  const master = path.join(app.dir, 'atlas-master.json'), sub = path.join(app.dir, 'atlas-dc.json');
  copyFileSync(process.env.SSS_ATLAS, master); copyFileSync(process.env.SSS_DC_SUBMAP, sub);
  const data = JSON.parse(readFileSync(master, 'utf8')), subData = JSON.parse(readFileSync(sub, 'utf8'));
  const electronics = data.nodes.filter(n => n.domain === 'Electronics');
  const dc = data.nodes.filter(n => batch.nodes.some(r => r.id === n.id));
  const value = id => evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.find(n=>n.id===${JSON.stringify(id)})?.proficiency80`);
  const highlighted = () => evaluate(`Number(document.getElementById('labels').dataset.highlighted||0)`);
  const record = () => { const dir = path.join(app.dir, 'userdata', 'proficiency'); return existsSync(dir) ? JSON.parse(readFileSync(path.join(dir, readdirSync(dir)[0]), 'utf8')) : null; };
  const settled = () => app.waitFor(`!/saving/.test(document.getElementById('sync-state').textContent)`);

  await open(master);
  check('the integrated master opens with every skill', await evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.length`) === data.nodes.length, `${data.nodes.length} skills`);
  check('all 26 DC skills are present and unmarked in the file', dc.length === 26 && dc.every(n => n.proficiency80 === null));
  check('the Electronics legend counts the DC additions', await evaluate(`document.querySelector('[data-subject="Electronics"] .legend-count').textContent`) === String(electronics.length), `${electronics.length} Electronics`);
  await click('#home', 600);
  await click('[data-subject="Electronics"]', 400);
  check('highlighting Electronics marks every skill in it, DC included', await highlighted() === electronics.length);
  await keep('01-dc-overview-electronics');

  // Find skill reaches the new branch, and the card shows the authored content.
  const target = dc.find(n => n.id === 'sss-dc-divider-loaded');
  await evaluate(`(()=>{const f=document.getElementById('find-skill');f.focus();f.value='divider';f.dispatchEvent(new Event('input'));})()`); await sleep(400);
  const options = await evaluate(`[...document.querySelectorAll('#find-results button')].map(b=>b.textContent.replace('Electronics','').trim()).join('|')`);
  check('Find skill reaches the DC branch', options.includes(target.name), options.slice(0, 140));
  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent===${JSON.stringify(target.name)}).click()`); await sleep(600);
  check('selecting a DC skill centres it', await selectedLabel() === target.name);
  const middle = await canvasCenter(), spot = await sphereOnScreen(target.name);
  check('its sphere sits at the view centre after selection', Math.hypot(spot.x - middle.x, spot.y - middle.y) < 8, `${Math.round(Math.hypot(spot.x - middle.x, spot.y - middle.y))} px`);
  await wheel(-120, 35, middle); await sleep(300);
  await keep('02-dc-skill-close');
  await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.textContent==='Read subject details').click()`); await sleep(400);
  const card = await evaluate(`document.getElementById('details-body').innerText`);
  check('the DC skill card shows both paragraphs and where it sits', target.details.split('\n\n').every(p => card.includes(p.slice(0, 60))) && /Electronics strand|strand of the spiral/.test(card), card.slice(0, 120));
  await keep('03-dc-skill-card');
  await click('#details-close', 300);

  // Guided review offers the new skills, and answers travel to the sub-map, in this profile only.
  const unmarked = data.nodes.filter(n => n.proficiency80 !== true && n.proficiency80 !== false);
  await click('#mark-proficiency', 400);
  check('the review counts the unmarked skills, DC included', await evaluate(`document.getElementById('review-unmarked')?.textContent.includes('(${unmarked.length})')`), `${unmarked.length} unmarked`);
  await key('Escape'); await sleep(200);
  const probe = dc.find(n => n.id === 'sss-dc-nodes'), overview = 'e-schematic';
  const overviewBefore = data.nodes.find(n => n.id === overview).proficiency80;
  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent===${JSON.stringify(probe.name)}).click()`); await sleep(300);
  await evaluate(`[...document.querySelectorAll('#inspector .proficiency-controls button')].find(b=>b.textContent==='Yes').click()`); await sleep(300); await settled();
  check('a DC skill can be marked, and the answer reaches the isolated shared record', await value(probe.id) === true && record()?.entries[probe.id]?.value === true);
  check('marking a narrower skill leaves its overview answer alone', await value(overview) === overviewBefore, `${overview} = ${await value(overview)}`);
  await open(sub);
  check('the DC sub-map opens with its prerequisite closure', await evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.length`) === subData.nodes.length, `${subData.nodes.length} skills`);
  check('the answer given in the master shows in the sub-map', await value(probe.id) === true);
  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent===${JSON.stringify(probe.name)}).click()`); await sleep(300);
  await evaluate(`[...document.querySelectorAll('#inspector .proficiency-controls button')].find(b=>b.textContent==='Clear').click()`); await sleep(300); await settled();
  await keep('04-dc-submap');
  await open(master);
  check('clearing it in the sub-map clears it in the master', await value(probe.id) === null);
  check('the copied originals were not changed', readFileSync(master, 'utf8') === readFileSync(process.env.SSS_ATLAS, 'utf8') && readFileSync(sub, 'utf8') === readFileSync(process.env.SSS_DC_SUBMAP, 'utf8'));
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} DC integration checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally { app.close(); }
