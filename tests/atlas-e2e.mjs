// Optional end-to-end check of a real expanded atlas in the Electron app, using copies (the
// originals are never opened for writing). Set SSS_ATLAS to the master and SSS_SUBMAP to its
// Computing sub-map; set SSS_SHOTS to a folder to keep screenshots for visual review.
import { copyFileSync, readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { screenshot } from './e2e-pixels.mjs';

if (!process.env.SSS_ATLAS || !process.env.SSS_SUBMAP) { console.log('Skipped: set SSS_ATLAS and SSS_SUBMAP to check a real atlas.'); process.exit(0); }
const { check, passed } = checker();
const app = await launchApp('sss-atlas-e2e-');
const shots = process.env.SSS_SHOTS; if (shots) mkdirSync(shots, { recursive: true });
const keep = async name => { if (shots) writeFileSync(path.join(shots, `${name}.png`), (await screenshot(app.send)).png); };
try {
  const { evaluate, open, click, wheel, canvasCenter, selectedLabel, labels, pageErrors } = app;
  const master = path.join(app.dir, 'atlas-master.json'), sub = path.join(app.dir, 'atlas-computing.json');
  copyFileSync(process.env.SSS_ATLAS, master); copyFileSync(process.env.SSS_SUBMAP, sub);
  const data = JSON.parse(readFileSync(master, 'utf8')), subData = JSON.parse(readFileSync(sub, 'utf8'));
  const computing = data.nodes.filter(n => n.domain === 'Computing');
  const value = id => evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.find(n=>n.id===${JSON.stringify(id)})?.proficiency80`);
  const highlighted = () => evaluate(`Number(document.getElementById('labels').dataset.highlighted||0)`);
  const status = () => evaluate(`document.getElementById('status').textContent`);
  const record = () => { const dir = path.join(app.dir, 'userdata', 'proficiency'); return existsSync(dir) ? JSON.parse(readFileSync(path.join(dir, readdirSync(dir)[0]), 'utf8')) : null; };
  const settled = () => app.waitFor(`!/saving/.test(document.getElementById('sync-state').textContent)`);

  await open(master);
  check('the expanded master opens with every skill', await evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.length`) === data.nodes.length, await status());
  check('the Computing legend entry counts every Computing skill', await evaluate(`document.querySelector('[data-subject="Computing"] .legend-count').textContent`) === String(computing.length) && !(await evaluate(`document.querySelector('[data-subject="Computing"]').disabled`)));
  await click('#home', 500);
  const scene = await labels();
  await click('[data-subject="Computing"]', 400);
  check('highlighting Computing marks all its skills and moves nothing', await highlighted() === computing.length && await labels() === scene && await selectedLabel() === null);
  await keep('01-overview-computing-highlighted');

  // A skill card for a Computing skill.
  const target = computing.find(n => n.id === 'c-control-loop') || computing[0];
  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent===${JSON.stringify(target.name)}).click()`); await sleep(500);
  check('selecting a Computing skill keeps the highlight on', await selectedLabel() === target.name && await highlighted() === computing.length);
  const middle = await canvasCenter();
  await wheel(-120, 40, middle); await sleep(300);
  await keep('02-close-selected-computing');
  check('the side panel shows the skill\'s one-sentence summary', (await evaluate(`document.getElementById('inspector').innerText`)).includes(target.description));
  await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.textContent==='Read subject details').click()`); await sleep(400);
  const card = await evaluate(`document.getElementById('details-body').innerText`);
  check('the skill card shows both paragraphs and where it sits in the Computing strand', await evaluate(`document.getElementById('details-dialog').open`) && target.details.split('\n\n').every(p => card.includes(p.slice(0, 60))) && /Computing strand/.test(card), card.slice(0, 120));
  await keep('03-skill-card');
  await click('#details-close', 300);

  // Guided review starts from the lowest unmarked skill, by saved height, then name, then id.
  const unmarked = data.nodes.filter(n => n.proficiency80 !== true && n.proficiency80 !== false);
  const first = [...unmarked].sort((a, b) => a.position[1] - b.position[1] || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))[0];
  await click('#mark-proficiency', 400);
  check('the review offers every unmarked skill, Computing included', await evaluate(`document.getElementById('review-unmarked')?.textContent.includes('(${unmarked.length})')`), `${unmarked.length} unmarked`);
  await click('#review-unmarked', 400);
  check('the review starts at the lowest unmarked skill', await evaluate(`document.getElementById('review-title').textContent`) === first.name, first.name);
  await keep('04-guided-review');
  await click('.review-answer.yes', 600); await click('#review-pause', 300); await settled();
  check('a review answer goes to the shared record', record()?.entries[first.id]?.value === true);

  // Switching to the Computing sub-map keeps the highlight and the shared answer.
  await open(sub);
  check('the Computing sub-map opens with the highlight still on', await evaluate(`document.querySelector('[data-subject="Computing"]').getAttribute('aria-pressed')==='true'`) && await highlighted() === subData.nodes.filter(n => n.domain === 'Computing').length);
  const inSub = subData.nodes.some(n => n.id === first.id);
  if (inSub) check('the answer given in the master shows in the sub-map', await value(first.id) === true);
  const probe = subData.nodes.find(n => n.domain === 'Computing' && n.id !== first.id);
  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent===${JSON.stringify(probe.name)}).click()`); await sleep(300);
  await evaluate(`[...document.querySelectorAll('#inspector .proficiency-controls button')].find(b=>b.textContent==='No').click()`); await sleep(300); await settled();
  await keep('05-computing-submap');
  await open(master);
  check('an answer given in the sub-map shows in the master', await value(probe.id) === false);
  check('the copied originals were not changed', readFileSync(master, 'utf8') === readFileSync(process.env.SSS_ATLAS, 'utf8') && readFileSync(sub, 'utf8') === readFileSync(process.env.SSS_SUBMAP, 'utf8'));
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} real-atlas checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally { app.close(); }
