// Screenshots of the app in both themes for docs/screenshots/cyberpunk/: map overview, learner HUD,
// skill card, lesson viewer (the real sample lessons of docs/samples, seeded into a test profile) and
// a warning dialog. No request leaves the computer.
//   SSS_HELIX_MAP=<copy of Maps/Humanoid-Helix-Atlas.json> node tests/theme-screens.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { launchApp, sleep } from './e2e-harness.mjs';

if (!process.env.SSS_HELIX_MAP) { console.log('Skipped: set SSS_HELIX_MAP to the helix map.'); process.exit(0); }
const require = createRequire(import.meta.url);
const { createLessonStore } = require('../desktop/lesson-store.cjs');
const root = path.resolve(import.meta.dirname, '..'), out = path.join(root, 'docs', 'screenshots', 'cyberpunk');
mkdirSync(out, { recursive: true });
const dir = mkdtempSync(path.join(tmpdir(), 'sss-theme-shots-'));
const store = createLessonStore(path.join(dir, 'userdata', 'lessons'));
for (const f of readdirSync(path.join(root, 'docs', 'samples')).filter(f => f.endsWith('.json') && f !== 'run-summary.json')) {
  const { context, ...record } = JSON.parse(readFileSync(path.join(root, 'docs', 'samples', f), 'utf8'));
  await store.put(record);
}
const app = await launchApp('sss-theme-shots-', { dir, env: { SSS_GUIDE_FAKE: '1', ANTHROPIC_API_KEY: `sk-ant-api03-${'t'.repeat(40)}` } });
const shot = async name => { const { data } = await app.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(out, name), Buffer.from(data, 'base64')); console.log(`saved ${name}`); };
try {
  const { evaluate, click, open, waitFor } = app;
  const file = path.join(dir, 'Humanoid-Helix-Atlas.json'); copyFileSync(process.env.SSS_HELIX_MAP, file);
  await open(file); await sleep(1500);
  const theme = async t => { await evaluate(`(()=>{const a=JSON.parse(localStorage.getItem('helixskill-appearance-v1')||'{}');a.theme='${t}';localStorage.setItem('helixskill-appearance-v1',JSON.stringify(a));document.documentElement.dataset.theme='${t}';})()`); await sleep(600); };
  const select = async name => { await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.title.startsWith(${JSON.stringify(name)})).click()`); await sleep(1000); };
  for (const t of ['classic', 'cyberpunk']) {
    await theme(t);
    await evaluate(`document.getElementById('home').click()`); await sleep(1200);
    await shot(`app-${t}-01-map-overview.png`);
    await select('Right-triangle trigonometry'); await shot(`app-${t}-02-hud-and-skill-card.png`);
    await click('#lesson-primary', 1200); await shot(`app-${t}-03-lesson-viewer.png`);
    await click('#lesson-close', 300);
    await select('Solder through-hole components'); await click('#lesson-primary', 1200);
    await shot(`app-${t}-04-lesson-safety.png`);
    await click('#lesson-close', 300);
  }
  // A warning dialog (Cyberpunk: the HUD danger modal; Classic uses the system's own dialog).
  await theme('cyberpunk');
  await evaluate(`document.getElementById('edit-mode').click()`); await sleep(400);
  await evaluate(`document.getElementById('reset').scrollIntoView();document.getElementById('reset').click()`); await sleep(500);
  await shot('app-cyberpunk-05-warning-dialog.png');
  await evaluate(`document.getElementById('confirm-cancel').click()`); await sleep(300);
  await evaluate(`document.getElementById('edit-mode').click()`); await sleep(300);
  await click('#file-menu', 200); await click('#settings-open', 400); await shot('app-cyberpunk-06-settings.png');
  await evaluate(`document.getElementById('settings-bloom').click()`); await click('#settings-close', 300);
  await select('Right-triangle trigonometry'); await evaluate(`document.getElementById('fly-to-selected').click()`); await sleep(2000);
  await shot('app-cyberpunk-07-selected-reticle-bloom.png');
  await click('#file-menu', 200); await click('#settings-open', 400); await evaluate(`document.getElementById('settings-bloom').click()`); await click('#settings-close', 300);
  await evaluate(`document.getElementById('front').click()`); await sleep(1500);
  await shot('app-cyberpunk-08-milestones-front.png');
} finally { await app.stop(); }
