// Frame rate while orbiting the full Humanoid map in each appearance: Classic, Cyberpunk HUD (bloom
// off, the default) and Cyberpunk HUD with bloom. Same method as authoring/stress/measure-app.mjs:
// frames counted with requestAnimationFrame during a 8-second pointer orbit; prints JSON.
//   SSS_HELIX_MAP=<copy of Maps/Humanoid-Helix-Atlas.json> node tests/theme-fps.mjs
import { copyFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, sleep } from './e2e-harness.mjs';

if (!process.env.SSS_HELIX_MAP) { console.log('Skipped: set SSS_HELIX_MAP to the helix map.'); process.exit(0); }
const percentile = (values, p) => { const s = [...values].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const round = v => Math.round(v * 10) / 10;

const app = await launchApp('sss-theme-fps-');
try {
  const file = path.join(app.dir, 'Humanoid-Helix-Atlas.json'); copyFileSync(process.env.SSS_HELIX_MAP, file);
  await app.open(file); await sleep(2000);
  const appearance = async change => { await app.evaluate(`(()=>{document.getElementById('settings-open').click();${change};document.getElementById('settings-close').click();})()`); await sleep(1200); };
  async function orbit(seconds = 8) {
    await app.evaluate(`document.getElementById('home').click()`); await sleep(800);
    const box = await app.evaluate(`(()=>{const r=document.querySelector('#canvas canvas').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,r:Math.min(r.width,r.height)/5};})()`);
    await app.evaluate(`window.__frames=[];window.__rec=true;(()=>{let last;const f=t=>{if(last!==undefined)__frames.push(t-last);last=t;if(__rec)requestAnimationFrame(f);};requestAnimationFrame(f);})();0`);
    const mouse = (type, x, y, extra = {}) => app.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', ...extra });
    await mouse('mousePressed', box.x + box.r, box.y, { buttons: 1, clickCount: 1 });
    const started = Date.now();
    while (Date.now() - started < seconds * 1000) { const a = (Date.now() - started) / 1000 * Math.PI; await mouse('mouseMoved', box.x + Math.cos(a) * box.r, box.y + Math.sin(a) * box.r * 0.4, { buttons: 1 }); }
    await mouse('mouseReleased', box.x, box.y, { buttons: 0, clickCount: 1 });
    const frames = await app.evaluate(`(()=>{__rec=false;return __frames;})()`);
    const median = percentile(frames, 0.5), worst = percentile(frames, 0.95);
    return { frames: frames.length, medianFps: round(1000 / median), worst5pctFps: round(1000 / worst) };
  }
  // Idle: frames per second with nothing happening (the Cyberpunk idle tick redraws at about 20 fps).
  async function idle(seconds = 4) {
    await app.evaluate(`window.__frames=[];window.__rec=true;(()=>{let last;const f=t=>{if(last!==undefined)__frames.push(t-last);last=t;if(__rec)requestAnimationFrame(f);};requestAnimationFrame(f);})();0`);
    await sleep(seconds * 1000);
    const frames = await app.evaluate(`(()=>{__rec=false;return __frames;})()`);
    return { medianFps: round(1000 / percentile(frames, 0.5)), worst5pctFps: round(1000 / percentile(frames, 0.95)) };
  }
  const set = (id, value) => `(()=>{const x=document.getElementById('${id}');x.value='${value}';x.dispatchEvent(new Event('change'));})()`;
  const results = {};
  results.classic = { orbit: await orbit(), idle: await idle() };
  await appearance(`document.getElementById('settings-theme-cyberpunk').click()`);
  results.cyberpunk = { orbit: await orbit(), idle: await idle() };
  await appearance(`document.getElementById('settings-bloom').click()`);
  results.cyberpunkBloom = { orbit: await orbit(), idle: await idle() };
  await appearance(`document.getElementById('settings-bloom').click()`);
  console.log(JSON.stringify(results, null, 2));
  if (app.pageErrors.length) console.log('page errors:', app.pageErrors);
} finally { await app.stop(); }
