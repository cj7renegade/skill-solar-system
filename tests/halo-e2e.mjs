// End-to-end check in the real Electron app: subject halos are sized with their spheres, never in
// screen pixels. Rendered pixels are measured from screenshots. The sphere's disc is what changes
// colour when proficiency colouring is switched on, and the halo is what highlighting adds. Both
// are measured close up, at medium distance, and at overview, selected and unselected, and at
// another display spacing.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { screenshot, diffBox, pixel } from './e2e-pixels.mjs';
import { HALO_MAX_DIAMETER_RATIO } from '../src/halo.js';

const { check, passed } = checker();
const app = await launchApp('sss-halo-e2e-');
try {
  const { send, evaluate, open, click, clickAt, wheel, sphereOnScreen, canvasCenter, selectedLabel, labels, pageErrors } = app;
  const node = (id, name, domain, position) => ({ id, name, domain, description: `${name}.`, details: '', position, pinned: false, proficiency80: null, icon: 'code', placementNote: '', layoutMode: 'saved' });
  const file = path.join(app.dir, 'halo.json');
  writeFileSync(file, JSON.stringify({ schemaVersion: 1, title: 'Halo test map', edges: [], nodes: [node('probe', 'Probe', 'Computing', [0, 300, 0]), node('side', 'Neighbour', 'Physics', [700, 300, -300]), node('low', 'Low', 'Mathematics', [-900, 0, 600])] }));
  await open(file);
  await click('#home', 400);
  const middle = await canvasCenter();
  const checked = id => evaluate(`document.getElementById('${id}').checked`);
  const setChecked = async (id, on) => { if (await checked(id) !== on) await click(`#${id}`, 250); };
  const lit = () => evaluate(`document.querySelector('[data-subject="Computing"]').getAttribute('aria-pressed')==='true'`);
  const highlight = async on => { if (await lit() !== on) await click('[data-subject="Computing"]', 250); };

  // One measurement: sphere and halo sizes in screenshot pixels around the probe sphere.
  async function measure() {
    await setChecked('show-labels', true); await sleep(120);
    const p = await sphereOnScreen('Probe');
    if (!p) throw Error('probe sphere is not on screen');
    const box = await evaluate(`(()=>{const r=document.getElementById('canvas').getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom}})()`);
    const radius = 8 * p.scale * ((await selectedLabel()) === 'Probe' ? 1.35 : 1), half = Math.max(30, Math.ceil(radius * 2.6));
    const x = Math.max(box.left, Math.floor(p.x - half)), y = Math.max(box.top, Math.floor(p.y - half));
    const clip = { x, y, width: Math.min(box.right, p.x + half) - x, height: Math.min(box.bottom, p.y + half) - y };
    await setChecked('show-labels', false); await highlight(false); await setChecked('show-proficiency', false); await sleep(250);
    const plain = (await screenshot(send, clip)).image;
    await setChecked('show-proficiency', true); await sleep(250);
    const grey = (await screenshot(send, clip)).image;
    await highlight(true); await sleep(250);
    const greyLit = (await screenshot(send, clip)).image;
    await setChecked('show-proficiency', false); await sleep(250);
    const colourLit = (await screenshot(send, clip)).image;
    await highlight(false); await setChecked('show-labels', true); await sleep(120);
    const sphere = diffBox(plain, grey), halo = diffBox(plain, colourLit);
    // Colour halfway across the ring, with proficiency colouring on: it must be the subject colour.
    const ring = sphere.count ? pixel(greyLit, sphere.cx + sphere.width * 0.71, sphere.cy) : null;
    return { sphere, halo, ring, expectedRadius: radius };
  }
  const ratio = m => Math.max(m.halo.width / m.sphere.width, m.halo.height / m.sphere.height);
  const describe = m => `sphere ${m.sphere.width}×${m.sphere.height} px, halo ${m.halo.width}×${m.halo.height} px, ratio ${ratio(m).toFixed(3)}`;
  // Anti-aliasing can add at most a pixel on each side of a tiny sphere; larger spheres get no allowance.
  const within = m => ratio(m) <= HALO_MAX_DIAMETER_RATIO + (m.sphere.width < 16 ? 2 / m.sphere.width : 0);

  const overview = await measure();
  check('overview: the halo is drawn and stays within 2x the sphere', overview.halo.count > 0 && within(overview), describe(overview));

  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent==='Probe').click()`); await sleep(500);
  check('selecting the probe centres it', (await selectedLabel()) === 'Probe');
  for (let i = 0; i < 80 && (await sphereOnScreen('Probe')).scale * 8 * 1.35 < 25; i++) await wheel(-120, 1, middle);
  const medium = await measure();
  check('medium distance, selected: within 2x the enlarged sphere', within(medium) && medium.sphere.width >= 30, describe(medium));
  check('the halo is clearly visible beyond the sphere', ratio(medium) > 1.4, describe(medium));
  for (let i = 0; i < 120 && (await sphereOnScreen('Probe')).scale * 8 * 1.35 < 95; i++) await wheel(-120, 1, middle);
  const close = await measure();
  check('close range, selected: within 2x the enlarged sphere', within(close) && close.sphere.width >= 120, describe(close));
  const grew = close.halo.width / medium.halo.width, sphereGrew = close.sphere.width / medium.sphere.width;
  check('the halo grows in proportion with its sphere', Math.abs(grew / sphereGrew - 1) < 0.08, `halo x${grew.toFixed(2)}, sphere x${sphereGrew.toFixed(2)}`);
  check('the halo keeps the subject colour under proficiency colouring', close.ring && close.ring[2] - close.ring[0] > 40, `ring rgb ${close.ring}`);

  // Highlighting leaves the camera, selection, and labels as they were.
  const scene = await labels();
  await highlight(true); await sleep(250);
  check('highlighting moves nothing and keeps the selection', await labels() === scene && (await selectedLabel()) === 'Probe');
  await highlight(false); await sleep(200);

  // The selection alone draws no halo: switching the highlight on adds pixels outside the sphere.
  check('selection and highlighting look different', close.halo.width > close.sphere.width * 1.3 && close.halo.count > close.sphere.count, describe(close));

  // Unselected at the same camera: the halo follows the smaller, unselected sphere.
  const blank = await evaluate(`(()=>{const r=document.getElementById('canvas').getBoundingClientRect();return {x:r.left+70,y:r.top+r.height*0.45}})()`);
  await clickAt(blank, 500);
  const unselected = await measure();
  check('close range, unselected: within 2x the sphere, and smaller than when selected', (await selectedLabel()) === null && within(unselected) && unselected.halo.width < close.halo.width, describe(unselected));

  // Another display spacing moves spheres but never resizes them or their halos.
  await evaluate(`(()=>{const s=document.getElementById('sphere-spacing');s.value='3';s.dispatchEvent(new Event('input'));s.dispatchEvent(new Event('change'));})()`); await sleep(400);
  await click('#home', 400);
  const spaced = await measure();
  check('overview at spacing 3: within 2x the sphere', spaced.halo.count > 0 && within(spaced), describe(spaced));
  await click('#reset-spacing', 300);

  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} halo checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally { app.close(); }
