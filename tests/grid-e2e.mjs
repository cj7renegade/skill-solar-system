// End-to-end check in the real Electron app: the floor grid stays visible as the camera pulls back.
// A strip of empty floor is sampled from screenshots, and the brightest grid line is compared with
// the floor colour around it. Before the grid became adaptive, that difference collapsed from about
// 47 to 13 once the camera was far out; it now holds near 70.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { screenshot } from './e2e-pixels.mjs';

const { check, passed } = checker();
const app = await launchApp('sss-grid-e2e-');
try {
  const { evaluate, open, click, wheel, canvasCenter, pageErrors } = app;
  const node = (id, name, position) => ({ id, name, domain: 'Computing', description: `${name}.`, details: '', position, pinned: false, proficiency80: null, icon: 'code', placementNote: '', layoutMode: 'saved' });
  const file = path.join(app.dir, 'grid.json');
  writeFileSync(file, JSON.stringify({ schemaVersion: 1, title: 'Grid test map', edges: [], nodes: [node('a', 'One', [0, 200, 0]), node('b', 'Two', [300, 400, -200])] }));
  await open(file);
  await click('#home', 600);
  // Empty floor: right of the spheres and above the map tools, so only the grid varies here.
  async function floorStrip() {
    const box = await evaluate(`(()=>{const r=document.getElementById('canvas').getBoundingClientRect();return {x:Math.round(r.left+r.width*0.62),y:Math.round(r.top+r.height*0.66),w:Math.round(r.width*0.26),h:Math.round(r.height*0.10)}})()`);
    const { image } = await screenshot(app.send, { x: box.x, y: box.y, width: box.w, height: box.h });
    let brightest = 0, darkest = 255;
    for (let i = 0; i < image.data.length; i += image.channels) {
      const value = (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3;
      brightest = Math.max(brightest, value); darkest = Math.min(darkest, value);
    }
    return brightest - darkest; // how far the brightest grid line rises above the floor
  }

  const fitted = await floorStrip();
  check('the grid is visible when the map is fitted', fitted > 25, `lines stand ${fitted.toFixed(1)} above the floor`);
  const middle = await canvasCenter();
  await wheel(120, 60, middle); await sleep(500);
  const far = await floorStrip();
  check('the grid is still clearly visible when zoomed far out', far > 35, `lines stand ${far.toFixed(1)} above the floor`);
  check('pulling back does not fade the floor away', far > fitted * 0.5, `${far.toFixed(1)} far against ${fitted.toFixed(1)} fitted`);
  await wheel(-120, 60, middle); await sleep(500);
  const back = await floorStrip();
  check('the grid is still there after coming back in', back > 25, `lines stand ${back.toFixed(1)} above the floor`);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} floor grid checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally { app.close(); }
