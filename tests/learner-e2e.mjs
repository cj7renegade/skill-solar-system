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
  // Phase 3: the milestone spine, stage rings, height ruler and course band labels.
  await evaluate(`document.getElementById('home').click()`); await sleep(600);
  const structure = kind => evaluate(`[...document.querySelectorAll('#structure-labels .structure-label.${kind}')].filter(e=>!e.hidden).map(e=>e.textContent)`);
  const milestoneLabels = await structure('milestone');
  check('every milestone is labelled on the spine, I01 to I09', milestoneLabels.length === 9 && ['I01', 'I05', 'I06', 'I09'].every(code => milestoneLabels.some(t => t.startsWith(code))), milestoneLabels.map(t => t.slice(0, 3)).join(' '));
  check('the active target is marked on the spine', await evaluate(`document.querySelector('#structure-labels .milestone.active')?.textContent.startsWith('I08')`));
  check('the height ruler has level ticks and says what height means', (await structure('ruler')).length >= 10 && /not difficulty/i.test(await evaluate(`document.querySelector('#structure-labels .ruler-title').textContent + document.getElementById('layout-summary').title`)));
  check('stage rings are labelled', (await evaluate(`document.querySelectorAll('#structure-labels .stage').length`)) >= 2);
  const courseLabels = await structure('course');
  check('most course bands are labelled where they face the camera', courseLabels.length >= 8, `${courseLabels.length} of 16 shown`);

  // Phase 4: subject clusters zoomed out, individual skills with a label budget zoomed in.
  const lod = () => evaluate(`document.getElementById('labels').dataset.lod`);
  // Nameplates on screen: drawn, and inside the map view (off-screen ones are positioned but unseen).
  const visibleSkillLabels = () => evaluate(`(()=>{const v=document.getElementById('labels').getBoundingClientRect();return [...document.querySelectorAll('#labels .node-label')].filter(e=>!e.hidden).map(e=>{const r=e.getBoundingClientRect();return {t:e.textContent,x:r.left,y:r.top,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top};}).filter(r=>r.cx>=v.left&&r.cx<=v.right&&r.cy>=v.top&&r.cy<=v.bottom);})()`);
  check('zoomed out, the map shows subject clusters', await lod() === 'clusters');
  const clusterNames = Number(await evaluate(`document.getElementById('cluster-labels').dataset.shown`));
  check('zoomed out, readable subject names replace the dot cloud', clusterNames >= 12, `${clusterNames} subject names`);
  const overviewLabels = await visibleSkillLabels(), nextNow = await nextNames();
  check('zoomed out, only Next up skills keep a skill nameplate', overviewLabels.length > 0 && overviewLabels.every(l => nextNow.includes(l.t)), `${overviewLabels.length}: ${overviewLabels.map(l => l.t).slice(0, 3).join(' | ')}`);
  const target = await evaluate(`(()=>{const e=[...document.querySelectorAll('#cluster-labels .cluster-label')].find(e=>!e.hidden);const r=e.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),name:e.textContent};})()`);
  await app.clickAt(target, 1200);
  check('clicking a cluster flies in until its skills appear', await lod() === 'skills', target.name);
  // Labels that must always show (the selection and Next up) may touch each other; every other label keeps clear.
  const keep = new Set([...nextNow, await evaluate(`document.querySelector('#labels .node-label.selected')?.textContent ?? ''`)]);
  const near = await visibleSkillLabels(), overlaps = near.some((a, i) => near.some((b, j) => j > i && !(keep.has(a.t) && keep.has(b.t)) && a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1));
  check('zoomed in, skill nameplates stay within the budget and never overlap', near.length > 0 && near.length <= 60 + 8 && !overlaps, `${near.length} shown`);
  await evaluate(`document.getElementById('home').click()`); await sleep(800);
  check('fitting the map again returns to clusters', await lod() === 'clusters');

  // Phase 5: path mode and the 2D plan.
  const goal = helix.nodes.find(n => n.id === 'hx-act-harmonic-drive');
  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>(b.dataset.name||b.textContent)===${JSON.stringify(goal.name)}).click()`); await sleep(500);
  await evaluate(`document.getElementById('path-to-selected').click()`); await sleep(900);
  const summary = await text('path-summary');
  check('Path to this shows what is left: skills, hours and courses', new RegExp(`^To reach ${goal.name}: [\\d,]+ skills? left · ~[\\d,.]+ h · \\d+ courses?$`).test(summary), summary);
  const pathSize = Number(await evaluate(`document.getElementById('labels').dataset.path`)), links = Number(await evaluate(`document.getElementById('labels').dataset.pathLinks`));
  check('the map lights the path and draws only the links inside it', pathSize > 1 && links > 0 && Number(summary.match(/: ([\d,]+) skill/)[1].replace(/,/g, '')) === pathSize, `${pathSize} skills, ${links} links`);
  const steps = await evaluate(`[...document.querySelectorAll('#path-steps .path-step')].map(e=>e.dataset.id)`), position = new Map(steps.map((id, i) => [id, i]));
  const ordered = helix.edges.every(e => e.type !== 'prerequisite' || !position.has(e.source) || !position.has(e.target) || position.get(e.source) < position.get(e.target));
  check('the step list is a valid study order (every prerequisite first)', ordered && (steps[steps.length - 1] === goal.id || steps.length === 150), `${steps.length} steps shown`);
  await evaluate(`document.getElementById('plan-toggle').click()`); await sleep(1200);
  const planNodes = await evaluate(`document.querySelectorAll('#plan-body .plan-node').length`);
  check('the 2D plan shows every skill on the path, in course lanes', !(await evaluate(`document.getElementById('plan-view').hidden`)) && planNodes === pathSize && (await evaluate(`document.querySelectorAll('#plan-body .plan-lane').length`)) >= 1, `${planNodes} nodes`);
  const planPick = await evaluate(`(()=>{const g=document.querySelector('#plan-body .plan-node');g.dispatchEvent(new MouseEvent('click',{bubbles:true}));return g.getAttribute('aria-label');})()`); await sleep(700);
  check('clicking a skill in the plan selects it in both views', await evaluate(`document.querySelector('#inspector h3')?.textContent`) === planPick && await evaluate(`!!document.querySelector('#plan-body .plan-node.selected')`), planPick);
  await app.key('Escape'); await sleep(400);
  check('Esc closes the plan first', await evaluate(`document.getElementById('plan-view').hidden`) && !(await evaluate(`document.getElementById('path-card').hidden`)));
  await app.key('Escape'); await sleep(600);
  check('a second Esc leaves path mode', await evaluate(`document.getElementById('path-card').hidden`) && Number(await evaluate(`document.getElementById('labels').dataset.path`)) === 0);

  // Phase 6: the Today view, the skill list order and the skill card.
  await app.key('Escape'); await sleep(500);
  const today = await evaluate(`({next:[...document.querySelectorAll('#today-next .hud-next-name')].map(e=>e.textContent),recent:[...document.querySelectorAll('#today-recent .hud-next-name')].map(e=>e.textContent),placeholder:document.querySelector('#inspector .empty')!==null})`);
  check('with nothing selected, the panel shows Today: Next up and recently studied, no empty placeholder', today.next.length >= 5 && today.recent.includes(first[0]) && !today.placeholder, `${today.next.length} next, recent: ${today.recent.join(' | ')}`);
  check('the list and its search speak of skills', await evaluate(`document.getElementById('search').placeholder`) === 'Find a skill…');
  check('the list puts ready skills first by default', await evaluate(`document.querySelector('#node-list .node-item .dot').classList.contains('ready')`));
  await evaluate(`(()=>{const s=document.getElementById('list-sort');s.value='az';s.dispatchEvent(new Event('change'));})()`); await sleep(400);
  const az = await evaluate(`[...document.querySelectorAll('#node-list .node-item')].slice(0,5).map(e=>e.dataset.name)`);
  check('A–Z stays available', JSON.stringify(az) === JSON.stringify([...az].sort((a, b) => a.localeCompare(b))), az.join(' | '));
  await evaluate(`(()=>{const s=document.getElementById('list-sort');s.value='suggested';s.dispatchEvent(new Event('change'));})()`);
  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.dataset.name===${JSON.stringify(goal.name)}).click()`); await sleep(500);
  const chips = await evaluate(`[...document.querySelectorAll('#inspector .skill-chips .chip')].map(e=>e.textContent)`);
  check('the skill card shows course, helix level, stage, level and ~hours', chips.some(c => c.startsWith('ACT · ')) && chips.some(c => /^Helix level \d+\/244$/.test(c)) && chips.some(c => c.startsWith('Stage ')) && chips.some(c => /^~[\d.]+ h$/.test(c)), chips.join(' | '));
  check('with Path to this, Fly to and the details button', await evaluate(`['open-details','path-to-selected','fly-to-selected'].every(id=>document.getElementById(id))`));
  const cardLinks = await evaluate(`({pre:[...document.querySelectorAll('#card-prerequisites .skill-link')].map(b=>b.textContent),unlocks:[...document.querySelectorAll('#card-unlocks .skill-link')].map(b=>b.textContent),dots:document.querySelectorAll('#card-prerequisites .dot').length})`);
  check('the card lists its prerequisites (with answer colours) and what it unlocks', cardLinks.pre.length + cardLinks.unlocks.length >= 2 && cardLinks.dots === cardLinks.pre.length, `${cardLinks.pre.length} + ${cardLinks.unlocks.length}`);
  check('the lesson badge and button are on the card, with no lesson body', await evaluate(`!!document.getElementById('lesson-badge')&&!!document.getElementById('lesson-primary')&&!document.querySelector('#inspector .lesson-section')`));
  const other = cardLinks.pre[0] || cardLinks.unlocks[0];
  await evaluate(`[...document.querySelectorAll('#inspector .skill-link')].find(b=>b.textContent===${JSON.stringify(other)}).click()`); await sleep(700);
  check('clicking a prerequisite or unlock selects it', await evaluate(`document.querySelector('#inspector h3')?.textContent`) === other, other);

  // Phase 7: header, status, menus, risky actions and text size.
  check('the header names the open map, and the version lives in the tour', await text('header-map') === helix.title && !/0\.4\.0/.test(await evaluate(`document.querySelector('header').textContent`)));
  check('the status bar counts skills and links', await text('counts') === `${helix.nodes.length.toLocaleString('en')} skills · ${helix.edges.length.toLocaleString('en')} links`, await text('counts'));
  check('one save indicator', /^(Saved ✓|Saving…)$/.test(await text('dirty')), await text('dirty'));
  check('Save map is under the File menu, not a highlighted button', await evaluate(`document.getElementById('file-menu-items').hidden && !document.getElementById('save').classList.contains('primary') && document.getElementById('file-menu-items').contains(document.getElementById('save'))`));
  await evaluate(`document.getElementById('file-menu').click()`); await sleep(200);
  check('the File menu opens', await evaluate(`!document.getElementById('file-menu-items').hidden`));
  await app.key('Escape'); await sleep(200);
  check('the display settings sit in the View popover', await evaluate(`['show-labels','selected-connections','show-proficiency','show-groups','sphere-spacing'].every(id=>document.getElementById('view-popover').contains(document.getElementById(id)))`));
  check('layout tools are hidden outside edit mode', await evaluate(`document.querySelector('.layout-tools').hidden`));
  await evaluate(`(()=>{const e=document.getElementById('edit-mode');e.checked=true;e.dispatchEvent(new Event('change'));})()`); await sleep(500);
  check('and appear in edit mode', await evaluate(`!document.querySelector('.layout-tools').hidden`));
  await evaluate(`(()=>{const e=document.getElementById('edit-mode');e.checked=false;e.dispatchEvent(new Event('change'));})()`); await sleep(500);
  const small = await evaluate(`[...document.querySelectorAll('body *')].filter(e=>{if(!e.offsetParent&&e.tagName!=='BODY')return false;const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());return own&&parseFloat(getComputedStyle(e).fontSize)<11;}).map(e=>(e.id||e.className||e.tagName)+':'+getComputedStyle(e).fontSize).slice(0,8)`);
  check('no visible text is smaller than 11 px', !small.length, small.join(' | '));
  check('no page errors on the helix map', !pageErrors.length, pageErrors.slice(0, 2).join(' | '));

  if (process.env.SSS_ATLAS_MAP) {
    const atlas = path.join(app.dir, 'Robotics-Atlas.json');
    writeFileSync(atlas, readFileSync(process.env.SSS_ATLAS_MAP));
    await open(atlas);
    const options = await evaluate(`[...document.querySelectorAll('#hud-target option')].map(o=>o.value)`);
    check('the Robotics Atlas gets a HUD over its own five milestones', JSON.stringify(options) === JSON.stringify(['rob3:I01', 'rob3:I02', 'rob3:I03', 'rob3:I04', 'rob3:I05']), options.join(' '));
    check('the Robotics Atlas labels its milestones but gets no helix rings, ruler or bands', (await evaluate(`document.querySelectorAll('#structure-labels .milestone').length`)) === 5
      && (await evaluate(`document.querySelectorAll('#structure-labels .stage, #structure-labels .ruler, #structure-labels .course').length`)) === 0);
    check('no page errors on the Robotics Atlas', !pageErrors.length, pageErrors.slice(0, 2).join(' | '));
  }
  console.log(`\n${passed.length} checks passed.`);
} finally {
  await app.stop();
}
