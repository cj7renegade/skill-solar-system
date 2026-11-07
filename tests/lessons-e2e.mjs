// Electron checks for AI lessons with a mocked Claude client (tests/electron-launcher.cjs: no request
// leaves the computer): an embedded lesson moves to the store and opens as a reviewed archive; a
// QUANT skill generates a lesson with live progress, answer checking and math; the card badge and
// buttons follow; Mark reviewed, Flag and Regenerate work; offline disables Generate with a reason
// while saved lessons still open; milestones show a checklist; review sessions show the cached
// practice; and no answer ever changes.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check } = checker();
const node = (id, name, extra = {}) => ({ id, name, domain: 'Electronics', description: `About ${name}.`, pinned: false, position: [0, 0, 0], proficiency80: null, ...extra });
const map = {
  schemaVersion: 1, title: 'Lessons test map', metadata: { atlasFamily: 'lessons-test-v1' },
  nodes: [
    node('v', 'Voltage basics', { proficiency80: true, position: [-30, 0, 0], lessonCard: { edition: 'core-lessons-08', demonstration: 'Explain voltage.' }, lesson: { id: 'v', explanation: 'Voltage is potential difference.', worked_example: 'A 9 V battery.', practice: { question: 'What is 1 V?', answer: '1 J/C' }, why_it_matters: 'Everything electrical.' } }),
    node('i', 'Current basics', { proficiency80: true, position: [30, 0, 0] }),
    node('ohm', 'Ohm\'s law', { position: [0, 20, 0], courseCode: 'ELX', helixType: 'QUANT', helixPractice: 'hands-on', helixTier: 'Core' }),
    node('kcl', 'Kirchhoff current law', { position: [20, 30, 0], helixType: 'QUANT' }),
    node('ms', 'First circuit milestone', { nodeKind: 'milestone', position: [0, 45, 0] })
  ],
  edges: [{ source: 'v', target: 'ohm', type: 'prerequisite' }, { source: 'i', target: 'ohm', type: 'prerequisite' }, { source: 'ohm', target: 'kcl', type: 'prerequisite' },
    { source: 'ohm', target: 'ms', type: 'prerequisite' }, { source: 'v', target: 'ms', type: 'prerequisite' }]
};

const app = await launchApp('sss-lessons-', { env: { SSS_GUIDE_FAKE: '1', ANTHROPIC_API_KEY: `sk-ant-api03-${'k'.repeat(40)}` } });
try {
  const { evaluate, click, open, waitFor, pageErrors, dialogs } = app;
  const file = path.join(app.dir, 'Lessons-Test.json');
  writeFileSync(file, JSON.stringify(map, null, 2));
  await open(file);
  const answers = () => evaluate(`JSON.stringify(JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.map(n=>[n.id,n.proficiency80]))`);
  const before = await answers();
  const select = async name => { await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent===${JSON.stringify(name)}).click()`); await sleep(400); };
  const card = () => evaluate(`({badge:document.getElementById('lesson-badge')?.textContent,primary:document.getElementById('lesson-primary')?.textContent,disabled:document.getElementById('lesson-primary')?.disabled,reason:document.getElementById('lesson-unavailable')?.textContent||null,body:!!document.querySelector('#inspector .lesson-section')})`);

  await waitFor(`!JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.some(n=>'lesson' in n||'lessonCard' in n)`);
  check('a lesson embedded in the opened map moves to the lesson store and leaves the map', true);
  await waitFor(`document.getElementById('guide-state').dataset.state==='online'`);
  await select('Voltage basics');
  let c = await card();
  check('a skill with an archived lesson: badge Reviewed, button Open lesson, no lesson body on the card', c.badge === 'Reviewed' && c.primary === 'Open lesson' && !c.body, JSON.stringify(c));
  await click('#lesson-primary', 500);
  check('the archive opens in the lesson viewer with its sections closed', await evaluate(`document.getElementById('lesson-dialog').open && document.querySelectorAll('#lesson-body details.lesson-section').length>=2 && !document.querySelector('#lesson-body details.lesson-section[open]')`));
  await click('#lesson-close', 300);

  await select('Ohm\'s law');
  c = await card();
  check('a skill with no lesson: badge No lesson yet, button Generate lesson (~30 min), enabled', c.badge === 'No lesson yet' && c.primary === 'Generate lesson (~30 min)' && !c.disabled, JSON.stringify(c));
  const shown = dialogs.length;
  await click('#lesson-primary', 50);
  check('Ask before generating: a confirmation states the model, the wait and the rough cost', dialogs.length === shown + 1 && /Claude Sonnet 5\.5.*30–60 seconds.*\$0\.10–0\.25/.test(dialogs.at(-1)), dialogs.at(-1));
  check('a Generating… view with section progress and Cancel appears', await evaluate(`!!document.getElementById('lesson-generating')&&!!document.getElementById('lesson-cancel')&&document.querySelectorAll('.lesson-progress li').length===8`));
  await waitFor(`document.getElementById('lesson-viewer-badge')?.textContent==='AI-generated · not yet reviewed'`, 30000);
  check('the AI lesson opens with the badge AI-generated · not yet reviewed', true);
  check('the QUANT answer check ran and agreed', /5 of 5 practice answers agree/.test(await evaluate(`document.getElementById('lesson-verification').textContent`)));
  check('math is rendered by the bundled KaTeX', await evaluate(`document.querySelectorAll('#lesson-body .katex').length`) > 5);
  check('code blocks render as code', await evaluate(`!!document.querySelector('#lesson-body pre.code-block code')`));
  check('safety comes first after the objectives, open', await evaluate(`[...document.querySelectorAll('#lesson-body details.lesson-section')].slice(0,3).map(d=>d.querySelector('summary').textContent).join('|')`) === 'Objectives|Safety|Explanation');
  const hidden = await evaluate(`(()=>{const d=document.querySelector('#lesson-body details.ai-independentPractice');d.open=true;const a=d.querySelector('.lesson-answer');return a.hidden;})()`);
  await evaluate(`document.querySelector('#lesson-body details.ai-independentPractice button.reveal').click()`);
  check('practice answers stay hidden until Show answer', hidden && await evaluate(`!document.querySelector('#lesson-body details.ai-independentPractice .lesson-answer').hidden`));
  check('the demonstration says it is not satisfied by the lesson', /Not satisfied by this lesson/.test(await evaluate(`document.querySelector('#lesson-body details.ai-demonstration').textContent`)));

  await click('#lesson-mark-reviewed', 600);
  check('Mark reviewed marks the lesson (not the skill)', await evaluate(`document.getElementById('lesson-viewer-badge').textContent`) === 'AI-generated · reviewed by you');
  await click('#lesson-flag', 200);
  await evaluate(`document.getElementById('lesson-flag-note').value='Problem p2 should use mA.';0`);
  await click('#lesson-flag-save', 600);
  check('Flag a problem stores the note with the lesson', await evaluate(`document.getElementById('lesson-viewer-badge').textContent`) === 'Flagged' && /should use mA/.test(await evaluate(`document.getElementById('lesson-notes').textContent`)));
  await click('#lesson-close', 300);
  c = await card();
  check('the card now shows the Flagged badge with Open lesson and Regenerate', c.badge === 'Flagged' && c.primary === 'Open lesson' && await evaluate(`!!document.getElementById('lesson-regenerate')`), JSON.stringify(c));
  const confirmCount = dialogs.length;
  await click('#lesson-regenerate', 50);
  check('Regenerate asks first: replaces the AI lesson, keeps reviewed lessons', dialogs.length === confirmCount + 1 && dialogs.at(-1) === 'Replaces the current AI lesson; reviewed lessons are kept.');
  await waitFor(`document.getElementById('lesson-viewer-badge')?.textContent==='AI-generated · not yet reviewed'`, 30000);
  check('the regenerated lesson replaces the flagged one', true);
  await click('#lesson-close', 300);

  // Milestones show the demonstration checklist instead of a lesson button.
  await select('First circuit milestone');
  check('a milestone shows a demonstration checklist, no Generate button', await evaluate(`!document.getElementById('lesson-primary') && document.querySelectorAll('#demo-checklist li').length===2 && document.querySelectorAll('#demo-checklist li.done').length===1`));

  // Review sessions show the cached lesson's practice.
  await click('#mark-proficiency', 400);
  await evaluate(`document.getElementById('review-unmarked')?.click();0`); await sleep(500);
  const reviewing = await evaluate(`document.getElementById('review-title')?.textContent`);
  if (reviewing === 'Ohm\'s law') {
    await waitFor(`!!document.getElementById('review-practice')`);
    check('the review session shows practice from the cached lesson', /Practice from your lesson \(\d+\)/.test(await evaluate(`document.querySelector('#review-practice summary').textContent`)));
  } else check('the review session shows practice from the cached lesson', false, `review started at ${reviewing}`);
  await evaluate(`document.getElementById('review-pause').click();0`); await sleep(300);

  // Offline: Generate is disabled with a clear reason; saved lessons still open.
  writeFileSync(path.join(app.dir, 'guide-net.json'), JSON.stringify({ up: false }));
  await click('#guide-button', 300);
  await evaluate(`document.getElementById('guide-input').value='hi';0`); await click('#guide-send', 100);
  await waitFor(`document.getElementById('guide-state').dataset.state==='disconnected'`);
  await click('#guide-close', 200);
  await select('Kirchhoff current law'); await sleep(300);
  c = await card();
  check('offline: Generate is disabled and says why', c.disabled === true && /Offline/.test(c.reason), JSON.stringify(c));
  await select('Ohm\'s law');
  await click('#lesson-primary', 600);
  check('offline: the saved AI lesson still opens', await evaluate(`document.getElementById('lesson-viewer-badge')?.textContent`) === 'AI-generated · not yet reviewed');
  await click('#lesson-close', 300);

  check('generating, opening, reviewing and flagging lessons never changed an answer', await answers() === before);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join('\n'));
} finally { await app.stop(); }
console.log('\nLesson checks passed.');
