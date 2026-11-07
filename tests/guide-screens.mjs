// Screenshots of the AI Guide for docs/screenshots/ai-guide/, with the scripted client from
// tests/electron-launcher.cjs (no request leaves the computer). Uses a copy of the helix map:
//   SSS_HELIX_MAP=<copy of Maps/Humanoid-Helix-Atlas.json> node tests/guide-screens.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, sleep } from './e2e-harness.mjs';

if (!process.env.SSS_HELIX_MAP) { console.log('Skipped: set SSS_HELIX_MAP to the helix map.'); process.exit(0); }
const out = path.join(import.meta.dirname, '..', 'docs', 'screenshots', 'ai-guide');
mkdirSync(out, { recursive: true });
const app = await launchApp('sss-guide-shots-', { env: { SSS_GUIDE_FAKE: '1', ANTHROPIC_API_KEY: '' } });
const shot = async name => { const { data } = await app.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(out, name), Buffer.from(data, 'base64')); console.log(`saved ${name}`); };
try {
  const { evaluate, click, open, waitFor } = app;
  const file = path.join(app.dir, 'Humanoid-Helix-Atlas.json');
  copyFileSync(process.env.SSS_HELIX_MAP, file);
  await open(file); await sleep(1500);
  await shot('01-offline-no-key.png');
  await click('#guide-button', 400);
  await shot('02-settings-no-key.png');
  await evaluate(`document.getElementById('guide-key').value='sk-ant-api03-${'s'.repeat(40)}';0`);
  await click('#guide-save-key', 300);
  await waitFor(`document.getElementById('guide-state').dataset.state==='online'`);
  await click('#guide-settings-toggle', 300);
  await shot('03-online-starters.png');
  await click('#guide-starters .guide-starter', 100);
  await waitFor(`document.querySelector('#guide-log .guide-reply .guide-link')`); await sleep(300);
  await shot('04-answer-with-links.png');
  writeFileSync(path.join(app.dir, 'guide-net.json'), JSON.stringify({ up: false }));
  await evaluate(`document.getElementById('guide-input').value='Plan my week';0`);
  await click('#guide-send', 100);
  await waitFor(`document.getElementById('guide-state').dataset.state==='disconnected'`); await sleep(300);
  await shot('05-disconnected.png');
  await click('#guide-close', 300);
  await shot('06-disconnected-app-still-working.png');
} finally { await app.stop(); }
