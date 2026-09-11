// End-to-end check of the guided proficiency review in the real Electron app (real WebGL viewer,
// real input events over the Chrome DevTools Protocol; no stubs). Run `npm run build` first, then
// `npm run test:e2e`. Set SSS_ATLAS=<path> to also exercise a large local map: it is opened
// read-only in an isolated profile, and any save goes to a temporary folder.
import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check, passed } = checker();
const app = await launchApp('sss-review-e2e-');
const dir = app.dir;

// Small fixture: three skills at the bottom (two share a name), two at 64, two at 128; one Yes and one No already marked.
const long = topic => Array.from({ length: 9 }, (_, i) => `Sentence ${i + 1} about ${topic} adds one more detail so that the description is long enough to scroll inside the review dialog.`).join(' ');
const skill = (id, name, y, proficiency80, x) => ({ id, name, domain: 'Mathematics', description: `Short summary of ${name}.`, details: `${long(name)}\n\n${long(`${name} in practice`)}`, position: [x, y, (x % 3) * 40], pinned: false, proficiency80, skillLevel: 1 + y / 64, layoutMode: 'saved', icon: 'function', placementNote: '' });
const nodes = [skill('z', 'Zeta', 64, null, 40), skill('b2', 'Beta', 0, null, 80), skill('a', 'Alpha', 0, null, 0), skill('b1', 'Beta', 0, null, 160), skill('y', 'Yes already', 128, true, 200), skill('n', 'No already', 64, false, 240), skill('top', 'Top', 128, null, 120)];
const fixture = (title, list) => ({ schemaVersion: 1, title, nodes: list, edges: list.some(n => n.id === 'top') ? [{ source: 'a', target: 'top', type: 'prerequisite' }] : [] });
const write = (name, data) => { const file = path.join(dir, name); writeFileSync(file, JSON.stringify(data, null, 2)); return file; };
const mapA = write('review-test.json', fixture('Review test map', nodes));
const mapB = write('other-map.json', fixture('Another test map', nodes));
const mapA2 = write('review-test-edited.json', fixture('Review test map', nodes.filter(n => n.id !== 'y')));
const empty = write('empty.json', { schemaVersion: 1, title: 'Empty test map', nodes: [], edges: [] });

try {
  const { send, evaluate, waitFor, open, mouse, center, click, key, labels, selectedLabel, pageErrors } = app;
  const title = () => evaluate(`document.querySelector('#review-title')?.textContent ?? null`);
  const reviewOpen = () => evaluate(`document.getElementById('review-dialog').open`);
  const values = () => evaluate(`Object.fromEntries(JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.map(n=>[n.id,n.proficiency80]))`);

  // --- Entry, order, and highlighting
  await open(mapA);
  await click('#mark-proficiency');
  check('HUD button opens the review dialog', await reviewOpen());
  check('start view offers Continue unmarked (5) as the focused default', await evaluate(`document.activeElement.id==='review-unmarked'&&/\\(5\\)/.test(document.activeElement.textContent)`));
  await click('#review-unmarked');
  check('review starts at the lowest skill, ties by name then id', await title() === 'Alpha');
  check('the reviewed skill is highlighted on the map', await selectedLabel() === 'Alpha');
  check('the review shows no placeholder text such as null or undefined', await evaluate(`!/\\bnull\\b|undefined/.test(document.getElementById('review-body').textContent)`));
  check('progress shows overall and in-height position', await evaluate(`/Skill 1 of 5/.test(document.querySelector('.review-progress').textContent)&&/1 of 3 at this height/.test(document.querySelector('.review-progress').textContent)`));

  // --- Background camera controls are blocked; scrolling, dragging, and keys never answer
  const before = await labels(), valuesBefore = JSON.stringify(await values());
  const backdrop = { x: 40, y: 400 };
  for (let i = 0; i < 6; i++) await mouse('mouseWheel', backdrop, { deltaX: 0, deltaY: -120 });
  await mouse('mousePressed', backdrop, { button: 'right', buttons: 2, clickCount: 1 }); await mouse('mouseMoved', { x: 240, y: 420 }, { button: 'right', buttons: 2 }); await mouse('mouseReleased', { x: 240, y: 420 }, { button: 'right', buttons: 0, clickCount: 1 });
  await mouse('mousePressed', backdrop, { button: 'left', buttons: 1, clickCount: 1 }); await mouse('mouseMoved', { x: 300, y: 300 }, { button: 'left', buttons: 1 }); await mouse('mouseReleased', { x: 300, y: 300 }, { button: 'left', buttons: 0, clickCount: 1 });
  await key('ArrowRight', 8); await key('w', 8); await sleep(300);
  check('wheel, drags, arrows, and WASD over the backdrop leave the camera unchanged', await labels() === before);
  check('the dialog stays open on the same skill', await reviewOpen() && await title() === 'Alpha');
  const text = await center('#review-text');
  const scroll0 = await evaluate(`document.getElementById('review-text').scrollTop`);
  for (let i = 0; i < 3; i++) await mouse('mouseWheel', text, { deltaX: 0, deltaY: 120 });
  await sleep(200);
  const scroll1 = await evaluate(`document.getElementById('review-text').scrollTop`);
  await evaluate(`(()=>{const t=document.getElementById('review-text');t.scrollTop=0;t.focus();return 0})()`); await key('ArrowDown', 4);
  const scroll2 = await evaluate(`document.getElementById('review-text').scrollTop`);
  check('description scrolls with the wheel and arrow keys', scroll1 > scroll0 && scroll2 > 0, `wheel ${scroll0} -> ${scroll1}; arrows 0 -> ${scroll2}`);
  const t0 = await center('#review-text p:last-child');
  await mouse('mousePressed', { x: t0.x - 150, y: t0.y }, { button: 'left', buttons: 1, clickCount: 1 }); await mouse('mouseMoved', { x: t0.x + 150, y: t0.y }, { button: 'left', buttons: 1 }); await mouse('mouseReleased', { x: t0.x + 150, y: t0.y }, { button: 'left', buttons: 0, clickCount: 1 });
  check('description text can be selected', (await evaluate(`String(getSelection())`)).length > 5);
  const yes = await center('.review-answer.yes');
  await mouse('mousePressed', yes, { button: 'left', buttons: 1, clickCount: 1 }); await mouse('mouseMoved', { x: yes.x + 260, y: yes.y - 200 }, { button: 'left', buttons: 1 }); await mouse('mouseReleased', { x: yes.x + 260, y: yes.y - 200 }, { button: 'left', buttons: 0, clickCount: 1 });
  await sleep(450);
  check('dragging off an answer button does not answer', await title() === 'Alpha' && JSON.stringify(await values()) === valuesBefore);
  check('camera still unchanged after scrolling and selecting in the dialog', await labels() === before);

  // --- One deliberate answer marks exactly one skill
  await mouse('mousePressed', yes, { button: 'left', buttons: 1, clickCount: 1 }); await mouse('mouseReleased', yes, { button: 'left', buttons: 0, clickCount: 1 });
  await mouse('mousePressed', yes, { button: 'left', buttons: 1, clickCount: 2 }); await mouse('mouseReleased', yes, { button: 'left', buttons: 0, clickCount: 2 });
  await sleep(500);
  let v = await values();
  check('a double-click on Yes answers one skill and advances once', v.a === true && v.b1 === null && await title() === 'Beta');
  check('the map highlight follows the review', await selectedLabel() === 'Beta');
  check('the map is marked dirty as a local draft', /Local draft/.test(await evaluate(`document.getElementById('dirty').textContent`)));
  await key('Enter', 6);
  v = await values();
  check('repeated Enter with focus on the skill title records nothing', v.b1 === null && await title() === 'Beta');
  await evaluate(`document.querySelector('.review-answer.no').focus()`); await key('Enter', 6); await sleep(450);
  v = await values();
  check('Enter on a focused answer button answers once, even with key repeat', v.b1 === false && v.b2 === null && await title() === 'Beta');
  check('the second Beta (by id) follows the first', await evaluate(`/Skill 3 of 5/.test(document.querySelector('.review-progress').textContent)`));

  // --- Skip, Back, replacing an answer, Escape pause, and Resume
  await click('#review-skip');
  check('Skip advances to the next height without answering', await title() === 'Zeta' && (await values()).b2 === null && await evaluate(`/Height 2 of 3/.test(document.querySelector('.review-progress').textContent)`));
  await click('#review-back'); await click('#review-back');
  check('Back returns to an answered skill and shows its current answer', await title() === 'Beta' && await evaluate(`document.querySelector('.review-answer.no').classList.contains('current')&&/Current answer: No/.test(document.querySelector('.review-existing').textContent)`));
  check('Back keeps the existing answer', (await values()).b1 === false);
  await click('.review-answer.yes');
  check('a new answer replaces the old one and advances', (await values()).b1 === true && await title() === 'Beta' && await evaluate(`/Skill 3 of 5/.test(document.querySelector('.review-progress').textContent)`));
  await key('Escape');
  check('Escape pauses without answering and returns focus to the HUD button', !(await reviewOpen()) && (await values()).b2 === null && await evaluate(`document.activeElement.id==='mark-proficiency'`));
  await click('#mark-proficiency');
  check('Resume is offered for the unfinished review', await evaluate(`!!document.getElementById('review-resume')`));
  await click('#review-resume');
  check('Resume continues at the same skill', await title() === 'Beta' && await evaluate(`/Skill 3 of 5/.test(document.querySelector('.review-progress').textContent)`));
  await click('#review-skip'); await click('.review-answer.no'); await click('.review-answer.yes');
  check('the end view distinguishes a review ended with skipped skills', /1 skipped skill/.test(await title()));
  await click('#review-skipped');
  check('skipped skills can be reviewed afterwards', await title() === 'Beta');
  await click('.review-answer.yes');
  check('the end view reports a complete review', /complete/i.test(await title()));
  v = await values();
  check('answers are Yes, No, and unchanged exactly as given', JSON.stringify(v) === JSON.stringify({ z: false, b2: true, a: true, b1: true, y: true, n: false, top: true }), JSON.stringify(v));
  await click('#review-close');
  check('closing returns focus to the HUD button', await evaluate(`document.activeElement.id==='mark-proficiency'`));

  // --- Only proficiency changes; answers survive Save map and reopen
  await click('#save', 800);
  await waitFor(`/saved to file/i.test(document.getElementById('status').textContent)`);
  const saved = JSON.parse(readFileSync(path.join(dir, 'saved.json'), 'utf8')), original = JSON.parse(readFileSync(mapA, 'utf8'));
  check('the saved file holds the answers', saved.nodes.find(n => n.id === 'b1').proficiency80 === true && saved.nodes.find(n => n.id === 'z').proficiency80 === false);
  const strip = g => JSON.stringify({ ...g, nodes: g.nodes.map(n => ({ ...n, proficiency80: null })) });
  check('nothing but proficiency changed (text, positions, levels, pins, edges)', strip(saved) === strip(original));
  await open(path.join(dir, 'saved.json'));
  await click('#mark-proficiency');
  check('after reopening, every skill is answered and Review all is offered', await evaluate(`!document.getElementById('review-unmarked')&&!document.getElementById('review-resume')&&!!document.getElementById('review-all')&&/already has an answer/.test(document.getElementById('review-body').textContent)`));

  // --- Map isolation, deleted skills, and Undo
  await click('#review-all');
  check('Review all includes answered skills', await title() === 'Alpha' && await evaluate(`/Skill 1 of 7/.test(document.querySelector('.review-progress').textContent)`));
  await click('#review-skip'); await click('.review-answer.no');
  await click('#review-pause');
  await open(mapB); await click('#mark-proficiency');
  check('a different map does not offer the other map\'s review', await evaluate(`!document.getElementById('review-resume')`));
  await key('Escape');
  await open(mapA2); await click('#mark-proficiency');
  check('the same map with a deleted skill can still resume', await evaluate(`!!document.getElementById('review-resume')`));
  await click('#review-resume');
  check('the deleted skill is reported and the position is kept', await title() === 'Beta' && /removed from the map/.test(await evaluate(`document.getElementById('review-status').textContent`)) && await evaluate(`/Skill 3 of 6/.test(document.querySelector('.review-progress').textContent)`));
  await click('.review-answer.yes');
  await click('#review-pause');
  await evaluate(`document.getElementById('edit-mode').click()`); await sleep(200);
  await click('#undo'); await sleep(200);
  await evaluate(`document.getElementById('edit-mode').click()`); await sleep(200);
  check('Undo reverts the last review answer in the map', (await values()).b2 === null);
  await click('#mark-proficiency'); await click('#review-resume');
  check('after Undo, resuming reports the undone answer as pending again', /undone/.test(await evaluate(`document.getElementById('review-status').textContent`)));
  await key('Escape');
  await open(empty); await click('#mark-proficiency');
  check('an empty map shows a clear message with only Close', /no skills to review/.test(await evaluate(`document.getElementById('review-body').textContent`)) && await evaluate(`!document.getElementById('review-unmarked')&&!document.getElementById('review-all')`));
  await key('Escape');

  // --- Optional: a large local map, opened read-only in this isolated profile
  if (process.env.SSS_ATLAS) {
    await open(process.env.SSS_ATLAS);
    const atlas = JSON.parse(readFileSync(process.env.SSS_ATLAS, 'utf8'));
    await click('#mark-proficiency');
    const unmarked = atlas.nodes.filter(n => n.proficiency80 !== true && n.proficiency80 !== false).length;
    check('atlas: unmarked count matches the file', await evaluate(`document.getElementById('review-unmarked')?.textContent ?? ''`).then(t => t.includes(`(${unmarked})`)), `${unmarked} unmarked`);
    await click('#review-all');
    const lowest = [...atlas.nodes].sort((a, b) => a.position[1] - b.position[1] || a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || (a.id < b.id ? -1 : 1))[0];
    check('atlas: Review all starts with the lowest skill', await title() === lowest.name, lowest.name);
    const startedAt = Date.now(); await click('.review-answer.no', 0); await waitFor(`document.querySelector('#review-title')?.textContent!==${JSON.stringify(lowest.name)}`);
    check('atlas: an answer applies and advances promptly', true, `${Date.now() - startedAt} ms including draft caching`);
    await sleep(450); await click('#review-back');
    check('atlas: Back shows the recorded answer', await evaluate(`/Current answer: No/.test(document.querySelector('.review-existing')?.textContent ?? '')`));
    const draftOk = await evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.length`);
    check('atlas: the local draft still caches the whole map', draftOk === atlas.nodes.length, `${draftOk} nodes`);
    await key('Escape');
  }
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} end-to-end checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally {
  app.close();
}
