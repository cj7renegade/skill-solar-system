// End-to-end check in the real Electron app: clicking a sphere makes it the orbit centre, and it
// stays the centre while orbiting and zooming in, until the user pans or deselects.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check, passed } = checker();
const app = await launchApp('sss-orbit-e2e-');
try {
  const { evaluate, open, clickAt, click, drag, wheel, key, labels, selectedLabel, sphereOnScreen, canvasCenter, pageErrors } = app;
  const names = ['North west', 'North', 'North east', 'West', 'Centre', 'East', 'South west', 'South', 'South east'];
  const map = path.join(app.dir, 'grid.json');
  writeFileSync(map, JSON.stringify({ schemaVersion: 1, title: 'Orbit test map', edges: [], nodes: names.map((name, i) => ({ id: `g${i}`, name, domain: 'Physics', description: `${name} sphere.`, details: '', position: [(i % 3 - 1) * 220, (1 - Math.floor(i / 3)) * 180 + 200, (i % 2) * 60], pinned: false, proficiency80: null, icon: 'motion', placementNote: '', layoutMode: 'saved' })) }));
  await open(map);
  await click('#home', 400);
  const middle = await canvasCenter();
  const offCentre = (p, tolerance = 4) => p && Math.hypot(p.x - middle.x, p.y - middle.y) <= tolerance;
  const distance = p => p ? Math.round(Math.hypot(p.x - middle.x, p.y - middle.y)) : null;
  // The chosen sphere must be away from the view centre and not under an overlay such as the legend.
  const onCanvas = p => evaluate(`document.elementFromPoint(${p.x},${p.y})?.tagName==='CANVAS'`);
  let target = null;
  for (const name of ['North east', 'North west', 'South west', 'South east']) { const p = await sphereOnScreen(name); if (p && distance(p) > 80 && await onCanvas(p)) { target = name; break; } }

  const before = await sphereOnScreen(target);
  check('the chosen sphere starts away from the view centre', distance(before) > 80, `${distance(before)} px away`);
  await clickAt(before, 700);
  check('clicking selects and highlights it', await selectedLabel() === target, target);
  const centred = await sphereOnScreen(target);
  check('the clicked sphere moves to the view centre', offCentre(centred), `${distance(centred)} px from centre`);
  // A selected sphere is drawn 1.35 times larger, and its nameplate scales with it.
  const sizeRatio = centred.scale / 1.35 / before.scale;
  check('the camera turns rather than jumps: the sphere keeps its on-screen size', Math.abs(sizeRatio - 1) < 0.15, `size ratio ${sizeRatio.toFixed(3)} after allowing for the selection highlight`);

  const scene = await labels();
  await drag({ x: middle.x - 160, y: middle.y + 120 }, { x: middle.x + 140, y: middle.y + 60 });
  check('orbiting rotates the view around the selected sphere', await labels() !== scene && offCentre(await sphereOnScreen(target)), `${distance(await sphereOnScreen(target))} px from centre`);
  await drag({ x: middle.x + 100, y: middle.y - 150 }, { x: middle.x - 50, y: middle.y + 100 });
  check('it stays centred through a second orbit', offCentre(await sphereOnScreen(target)), `${distance(await sphereOnScreen(target))} px`);

  const far = await sphereOnScreen(target);
  await wheel(-120, 60, middle);
  const close = await sphereOnScreen(target);
  check('zooming in approaches the selected sphere and stops in front of it', close && close.scale > far.scale * 1.5 && offCentre(close), `scale ${far.scale.toFixed(3)} -> ${close?.scale.toFixed(3)}`);
  await drag({ x: middle.x - 150, y: middle.y + 100 }, { x: middle.x + 150, y: middle.y + 100 });
  check('orbiting at close range still circles the selected sphere', offCentre(await sphereOnScreen(target)), `${distance(await sphereOnScreen(target))} px`);

  await click('#canvas', 0); await key('ArrowRight', 8); await sleep(200);
  const panned = await sphereOnScreen(target);
  check('panning moves the view off the sphere (the anchor is released)', !offCentre(panned, 20), `${distance(panned)} px from centre`);
  const beforeTravel = await labels();
  await wheel(-120, 10, middle);
  check('after panning, the wheel travels freely again', await labels() !== beforeTravel);

  await click('#home', 400);
  const blank = await evaluate(`(()=>{const r=document.getElementById('canvas').getBoundingClientRect();return {x:r.left+70,y:r.top+r.height*0.45}})()`);
  const centreBefore = await sphereOnScreen('Centre');
  await clickAt(blank, 700);
  const centreAfter = await sphereOnScreen('Centre');
  check('clicking empty space clears the selection without moving the camera', await selectedLabel() === null && Math.hypot(centreAfter.x - centreBefore.x, centreAfter.y - centreBefore.y) < 0.5, `unselected sphere moved ${Math.hypot(centreAfter.x - centreBefore.x, centreAfter.y - centreBefore.y).toFixed(2)} px`);

  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent==='South west').click()`); await sleep(500);
  check('choosing a subject in the list centres it too', offCentre(await sphereOnScreen('South west')), `${distance(await sphereOnScreen('South west'))} px`);
  await drag({ x: middle.x - 120, y: middle.y + 80 }, { x: middle.x + 120, y: middle.y - 40 });
  check('and the orbit then circles that subject', offCentre(await sphereOnScreen('South west')), `${distance(await sphereOnScreen('South west'))} px`);

  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} orbit checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally { app.close(); }
