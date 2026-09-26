// End-to-end check in the real Electron app that held-key panning crosses the same map distance
// every second however far in the camera is, and that very close up it is capped rather than
// collapsing back to a crawl. Distances are read from the nameplate scale, which is pixels per
// world unit at the sphere's depth, so a pan measured in pixels converts to map units.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { PAN_SPHERES_PER_SECOND } from '../src/camera.js';

const SPACING = 70; // the generated map uses one spacing throughout, so the expected rate is known
const { check, passed } = checker();
const app = await launchApp('sss-pan-e2e-');
try {
  const { evaluate, open, click, send, canvasCenter, sphereOnScreen, pageErrors } = app;
  // Wide enough that the steady rate applies well before the close-range cap takes over: the two
  // meet at PAN_SPHERES_PER_SECOND / PAN_CLOSE_CAP spacings out, about 500 units here.
  const nodes = [];
  for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++)
    nodes.push({ id: `p${i}-${j}`, name: `Sphere ${i} ${j}`, domain: 'Physics', description: 'A sphere.', details: '', position: [(i - 12) * SPACING, 200 + (j - 12) * SPACING, 0], pinned: false, proficiency80: null, icon: 'motion', placementNote: '', layoutMode: 'saved' });
  const map = path.join(app.dir, 'grid.json');
  writeFileSync(map, JSON.stringify({ schemaVersion: 1, title: 'Pan test map', edges: [], nodes }));
  await open(map);
  await click('#home', 700);

  const height = await evaluate(`document.getElementById('canvas').getBoundingClientRect().height`);
  const tangent = Math.tan(43 / 2 * Math.PI / 180);
  // The sphere closest to the middle of the view stays on screen through a short pan.
  const centreMost = async () => {
    const mid = await canvasCenter();
    return evaluate(`(()=>{const host=document.getElementById('labels').getBoundingClientRect();let best=null,d=1e9;
      for(const e of document.querySelectorAll('#labels .node-label')){if(e.hidden)continue;
      const x=host.left+parseFloat(e.style.left),y=host.top+parseFloat(e.style.top),n=Math.hypot(x-${mid.x},y-${mid.y});
      if(n<d){d=n;best=e.textContent.split(' · ')[0]}}return best})()`);
  };
  // Panning is blocked while a control has focus, so release it before holding the key.
  const hold = async ms => {
    await evaluate(`document.activeElement&&document.activeElement.blur();0`);
    const base = { key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...base }); await sleep(ms);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base }); await sleep(250);
  };
  // Map units per second covered by a held key, with the depth it was measured at. Close up the
  // view sweeps thousands of pixels a second, so the hold has to be short enough to keep the
  // reference sphere on screen; the rate is per second either way.
  const rate = async (ms = 300) => {
    const name = await centreMost(); if (!name) return null;
    const before = await sphereOnScreen(name); if (!before) return null;
    await hold(ms);
    const after = await sphereOnScreen(name); if (!after) return null;
    const pixels = Math.hypot(after.x - before.x, after.y - before.y);
    return { units: pixels / before.scale / (ms / 1000), depth: height / (2 * before.scale * tangent) };
  };
  const report = (value, extra = '') => value ? `${Math.round(value.units)} units/s at depth ${Math.round(value.depth)}${extra}` : 'the reference sphere left the screen during the pan';
  const zoom = async notches => { const mid = await canvasCenter(); for (let i = 0; i < notches; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: mid.x, y: mid.y, deltaX: 0, deltaY: -120 }); await sleep(14); } await sleep(400); };

  const steady = PAN_SPHERES_PER_SECOND * SPACING;
  const overview = await rate();
  check('panning at the overview covers the steady map rate', overview && Math.abs(overview.units - steady) / steady < 0.2, `${Math.round(overview?.units)} of ${steady} units/s at depth ${Math.round(overview?.depth)}`);
  await zoom(12);
  const closer = await rate();
  check('zoomed in, it still covers the same map rate', closer && Math.abs(closer.units - steady) / steady < 0.2, `${Math.round(closer?.units)} of ${steady} units/s at depth ${Math.round(closer?.depth)}`);
  check('the two rates match, so crossing the map takes the same time at either zoom', closer.depth < overview.depth * 0.6 && Math.abs(closer.units - overview.units) / overview.units < 0.25, `${Math.round(overview.units)} vs ${Math.round(closer.units)} units/s across a ${(overview.depth / closer.depth).toFixed(1)}x zoom change`);

  // Very close up the cap takes over: slower than the steady rate, but far above the old policy,
  // which moved 0.7 navigation distances a second and bottomed out at 0.7 x spacing.
  await zoom(20);
  const close = await rate(80);
  const wasBefore = 0.7 * SPACING;
  check('close up the rate is capped below the steady rate', close && close.units < steady, report(close));
  check('but close-up panning no longer crawls', close.units > 3 * wasBefore, `${Math.round(close.units)} units/s against ${Math.round(wasBefore)} under the old policy`);
  // The cap's ceiling is proportional to the orbit distance, which this test cannot observe: the
  // sphere nearest the middle of the view can sit far closer than the orbit target. The formula,
  // its proportionality, and the crossover are checked in tests/camera.test.mjs, which has the
  // inputs directly; here only the behaviour either side of the cap is asserted.
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} pan-rate checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally { app.close(); }
