// Screenshots for docs/screenshots/ai-lessons/: the skill card in each lesson state and the lesson
// viewer, using the real lessons generated in docs/samples/ (copied into a test profile; no request
// leaves the computer: the Guide runs the scripted client of tests/electron-launcher.cjs).
//   SSS_HELIX_MAP=<copy of Maps/Humanoid-Helix-Atlas.json> node tests/lesson-screens.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { launchApp, sleep } from './e2e-harness.mjs';

if (!process.env.SSS_HELIX_MAP) { console.log('Skipped: set SSS_HELIX_MAP to the helix map.'); process.exit(0); }
const require = createRequire(import.meta.url);
const { createLessonStore } = require('../desktop/lesson-store.cjs');
const root = path.resolve(import.meta.dirname, '..'), out = path.join(root, 'docs', 'screenshots', 'ai-lessons');
mkdirSync(out, { recursive: true });

// A test profile holding the sample lessons, plus one archived lesson from the real store's backup map.
const dir = mkdtempSync(path.join(tmpdir(), 'sss-lesson-shots-'));
const store = createLessonStore(path.join(dir, 'userdata', 'lessons'));
for (const f of readdirSync(path.join(root, 'docs', 'samples')).filter(f => f.endsWith('.json') && f !== 'run-summary.json')) {
  const { context, ...record } = JSON.parse(readFileSync(path.join(root, 'docs', 'samples', f), 'utf8'));
  await store.put(record);
}
const app = await launchApp('sss-lesson-shots-', { dir, env: { SSS_GUIDE_FAKE: '1', ANTHROPIC_API_KEY: `sk-ant-api03-${'s'.repeat(40)}` } });
const shot = async name => { const { data } = await app.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(out, name), Buffer.from(data, 'base64')); console.log(`saved ${name}`); };
try {
  const { evaluate, click, open, waitFor } = app;
  const file = path.join(dir, 'Humanoid-Helix-Atlas.json'); copyFileSync(process.env.SSS_HELIX_MAP, file);
  // The archived lessons come from the pre-migration backup, as in the real store.
  const backup = JSON.parse(readFileSync(path.join(root, 'backups', 'pre-ai-lessons', 'Humanoid-Helix-Atlas.json'), 'utf8'));
  const { archiveRecord } = require('../desktop/lesson-store.cjs');
  for (const n of backup.nodes.filter(n => n.lesson).slice(0, 400)) await store.put(archiveRecord(backup.metadata.atlasFamily, n, '2026-11-06T00:00:00Z'));
  await open(file); await sleep(1500);
  await waitFor(`document.getElementById('guide-state').dataset.state==='online'`);
  const select = async id => { await evaluate(`(()=>{const n=[...document.querySelectorAll('.node-item')].find(b=>b.title.startsWith(${JSON.stringify(backup.nodes.find(n => n.id === id)?.name ?? id)}));n.click();})()`); await sleep(900); };
  await select('m-trig'); await shot('01-card-ai-lesson.png');
  await click('#lesson-primary', 900); await shot('02-viewer-ai-lesson-top.png');
  await evaluate(`(()=>{const d=document.querySelector('#lesson-body details.ai-independentPractice');d.open=true;d.querySelector('button.reveal').click();d.scrollIntoView();})()`); await sleep(300);
  await shot('03-viewer-practice-answer-shown.png');
  await click('#lesson-close', 300);
  await select('hx-elx-soldering-tht'); await click('#lesson-primary', 900); await shot('04-viewer-hands-on-safety.png');
  await evaluate(`(()=>{const d=document.querySelector('#lesson-body details.ai-demonstration');d.open=true;d.scrollIntoView();})()`); await sleep(300); await shot('05-viewer-demonstration-not-satisfied.png');
  await click('#lesson-close', 300);
  await select('m-count'); await shot('06-card-reviewed-archive.png');
  await click('#lesson-primary', 900); await shot('07-viewer-reviewed-archive.png'); await click('#lesson-close', 300);
  await select('c-train-inference'); await shot('08-card-no-lesson-yet.png');
  await select('rob3:I01'); await shot('09-card-milestone-checklist.png');
  await click('#file-menu', 200); await click('#lessons-open', 700); await shot('10-lesson-settings.png'); await click('#lessons-close', 300);
  writeFileSync(path.join(dir, 'guide-net.json'), JSON.stringify({ up: false }));
  await evaluate(`window.dispatchEvent(new Event('online'))`);
  await click('#guide-button', 300); await evaluate(`document.getElementById('guide-input').value='hi';0`); await click('#guide-send', 100);
  await waitFor(`document.getElementById('guide-state').dataset.state==='disconnected'`); await click('#guide-close', 300);
  await select('c-train-inference'); await shot('11-card-offline-generate-disabled.png');
} finally { await app.stop(); }
