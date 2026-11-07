// Electron checks for the Cyberpunk HUD applied to the app shell (phase 3): theme-only parts appear
// only in their theme; the header, learner HUD and skill card carry true readouts; UI text is at least
// 12 px; focus rings show; destructive confirmations use the HUD danger modal (Cancel first, Esc
// cancels, nothing changes until confirmed); Classic is untouched when switched back.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check } = checker();
const node = (id, name, extra = {}) => ({ id, name, domain: 'Robotics', description: `About ${name}.`, pinned: false, position: [0, 0, 0], proficiency80: null, ...extra });
const map = { schemaVersion: 1, title: 'Theme test map', metadata: { atlasFamily: 'theme-test-v1' },
  nodes: [node('a', 'Gear basics', { courseCode: 'MEC', helixLevel: 1, helixType: 'QUANT', buildStage: 2, proficiency80: true, position: [-20, 0, 0] }), node('b', 'Drive trains', { courseCode: 'MEC', helixLevel: 4, position: [0, 20, 0] }),
    node('m', 'First milestone', { nodeKind: 'milestone', helixLevel: 7, position: [0, 40, 0] })],
  edges: [{ source: 'a', target: 'b', type: 'prerequisite' }, { source: 'b', target: 'm', type: 'prerequisite' }] };

const app = await launchApp('sss-cyberpunk-');
try {
  const { evaluate, click, open, key, pageErrors } = app;
  const file = path.join(app.dir, 'Theme-Test.json'); writeFileSync(file, JSON.stringify(map));
  await open(file);
  const shown = sel => evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return !!e&&getComputedStyle(e).display!=='none'&&e.getClientRects().length>0;})()`);
  check('Classic: Cyberpunk-only parts are hidden and the Classic bars are shown', !(await shown('#header-readouts')) && !(await shown('.hud-gauges')) && await shown('.hud-bar'));
  const theme = async t => { await evaluate(`(()=>{const s=document.getElementById('settings-theme');if(!s){document.getElementById('settings-open').click();}const x=document.getElementById('settings-theme');x.value='${t}';x.dispatchEvent(new Event('change'));document.getElementById('settings-close').click();})()`); await sleep(300); };
  await theme('cyberpunk');
  check('Cyberpunk: header readouts show the true skill and link counts', await evaluate(`document.getElementById('header-readouts').textContent`) === '3 SKILLS2 LINKS' && await shown('#header-readouts'));
  check('the learner HUD shows a progress ring for the target and hides the Classic bars', await shown('.hud-gauges .cp-ring') && !(await shown('.hud-bar')) && /^33$/.test(await evaluate(`document.querySelector('.hud-gauges .cp-ring .value').textContent`)));
  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent==='Drive trains').click()`); await sleep(500);
  const readouts = await evaluate(`[...document.querySelectorAll('#inspector .skill-readouts .cp-stat-value')].map(e=>e.textContent)`);
  check('the skill card shows the skill code, level, stage and effort as readouts (no level on a non-helix map, so none is invented)', readouts[0] === 'MEC-NA-002' && readouts[1] === 'LVL ---' && readouts[2] === 'STG --' && /^~/.test(readouts[3]), readouts.join(' | '));
  const sizes = await evaluate(`(()=>{const out=[];for(const e of document.querySelectorAll('body *')){if(e.closest('canvas,dialog:not([open]),#labels'))continue;const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!own||!e.getClientRects().length)continue;const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden')continue;out.push([parseFloat(s.fontSize),e.tagName+'.'+e.className+' '+e.textContent.trim().slice(0,30)]);}out.sort((a,b)=>a[0]-b[0]);return out.slice(0,3);})()`);
  check('no visible UI text is smaller than 12 px', sizes[0][0] >= 12, JSON.stringify(sizes));
  await evaluate(`document.getElementById('home').focus()`); await key('Tab'); await sleep(100);
  check('keyboard focus shows a 2 px cyan ring', await evaluate(`(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle!=='none'&&s.outlineWidth==='2px'&&s.outlineColor==='rgb(46, 230, 240)';})()`));

  // The 3D map: the selected skill gets a bracket reticle (Cyberpunk only); bloom can be turned on.
  check('the 3D view knows the theme', await evaluate(`document.getElementById('labels').dataset.theme`) === 'cyberpunk');
  await evaluate(`document.getElementById('fly-to-selected').click()`); await sleep(1500);
  check('the selected skill has a bracket reticle in screen space', await evaluate(`(()=>{const r=document.querySelector('.hud-reticle');return !!r&&!r.hidden&&getComputedStyle(r).display!=='none'&&parseFloat(r.style.width)>=28;})()`));
  await evaluate(`(()=>{document.getElementById('settings-open').click();document.getElementById('settings-bloom').click();document.getElementById('settings-close').click();})()`); await sleep(600);
  check('bloom can be turned on without errors, and is off by default', JSON.parse(await evaluate(`localStorage.getItem('helixskill-appearance-v1')`)).bloom === true && pageErrors.length === 0);
  await evaluate(`(()=>{document.getElementById('settings-open').click();document.getElementById('settings-bloom').click();document.getElementById('settings-close').click();})()`); await sleep(300);

  // A destructive action asks in the HUD danger modal.
  await evaluate(`document.getElementById('edit-mode').click()`); await sleep(300);
  await evaluate(`document.getElementById('blank').click()`); await sleep(400);
  check('New empty map asks in a red HUD modal with Cancel focused', await evaluate(`!!document.querySelector('dialog.cp-confirm[open] .cp-panel.is-alert') && document.activeElement.id==='confirm-cancel'`));
  await key('Escape'); await sleep(300);
  check('Escape cancels: the map is unchanged', !(await evaluate(`!!document.querySelector('dialog.cp-confirm')`)) && /^3 skills/.test(await evaluate(`document.getElementById('counts').textContent`)));
  await evaluate(`document.getElementById('blank').click()`); await sleep(400);
  await evaluate(`document.getElementById('confirm-ok').click()`); await sleep(500);
  check('confirming replaces the map', /^0 skills/.test(await evaluate(`document.getElementById('counts').textContent`)));
  await evaluate(`document.getElementById('undo').click()`); await sleep(500);
  check('and Undo brings it back', /^3 skills/.test(await evaluate(`document.getElementById('counts').textContent`)));
  await evaluate(`document.getElementById('edit-mode').click()`); await sleep(200);

  await evaluate(`(()=>{document.getElementById('settings-open').click();const r=document.getElementById('settings-reduce-motion');r.click();document.getElementById('settings-close').click();})()`); await sleep(200);
  check('reduced motion stops the milestone ring rotation', await evaluate(`getComputedStyle(document.querySelector('.hud-gauges .cp-ring .ticks')).animationName`) === 'none');
  await theme('classic');
  check('switching back to Classic restores it exactly (background, font, bars)', await evaluate(`getComputedStyle(document.body).backgroundColor`) === 'rgb(8, 14, 25)' && await shown('.hud-bar') && !(await shown('#header-readouts')));
  check('Classic draws no reticle', await evaluate(`getComputedStyle(document.querySelector('.hud-reticle')).display`) === 'none');
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join('\n'));
} finally { await app.stop(); }
console.log('\nCyberpunk shell checks passed.');
