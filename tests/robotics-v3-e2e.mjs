// End-to-end check of the imported robotics v3 learning content in the real Electron app, using a
// copy of the map in an isolated profile with its own proficiency store, so the user's real
// answers are never touched.
//
//   SSS_V3_MAP=Maps/Robotics-v3/Robotics-v3-Lessons.json node tests/robotics-v3-e2e.mjs
//
// Set SSS_ATLAS to also confirm the original Skill Solar System map still opens, and SSS_SHOTS to
// a folder to keep screenshots.
import { copyFileSync, readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { screenshot } from './e2e-pixels.mjs';
import { lessonSections, EDITION_NAMES as EDITIONS } from '../src/lesson.js';
import { buildQueue, startSession, skip, currentId, REVIEW_STORE } from '../src/review.js';

if (!process.env.SSS_V3_MAP) { console.log('Skipped: set SSS_V3_MAP to the imported robotics v3 map.'); process.exit(0); }
const { check, passed } = checker();
const source = path.resolve(process.env.SSS_V3_MAP);
const data = JSON.parse(readFileSync(source, 'utf8'));
const byId = new Map(data.nodes.map(n => [n.id, n]));

// The cards each handoff asks to see. Editions 01 and 02 are rechecked alongside edition 03, so an
// older card is confirmed to still render after every import.
const REPRESENTATIVE = [
  ['mathematics', 'rob3:m-trig'], ['electronics', 'rob3:E02'], ['mechanics', 'rob3:B-D05'],
  ['programming', 'rob3:c-bitwise'], ['PID control', 'rob3:C03'], ['I01 milestone', 'rob3:I01'],
  ['frame transforms', 'rob3:K03'], ['the Jacobian', 'rob3:m-jacobian'], ['arm workspace', 'rob3:K10'],
  ['arm singularities', 'rob3:K11'], ['grasping', 'rob3:G04'], ['I02 milestone', 'rob3:I02']
];
const EXPECT = { authored: 254, pending: 126, roadmap: 1, nodes: 381 };
const PENDING = data.nodes.find(n => n.contentStatus === 'introductory lesson pending');
const ROADMAP = data.nodes.find(n => n.contentStatus === 'roadmap note, not assessed');
// A card whose authored text uses symbols that must survive the whole path into the DOM.
const SYMBOLS = ['°', '×', '²', 'π', '±', '→', '−'];
const symbolNode = data.nodes.find(n => n.lesson && SYMBOLS.filter(s => JSON.stringify(n.lesson).includes(s)).length >= 2);

const app = await launchApp('sss-v3-lessons-');
const shots = process.env.SSS_SHOTS; if (shots) mkdirSync(shots, { recursive: true });
const keep = async name => { if (shots) writeFileSync(path.join(shots, `${name}.png`), (await screenshot(app.send)).png); };
try {
  const { evaluate, open, click, key, pageErrors } = app;
  const map = path.join(app.dir, 'robotics-v3.json');
  copyFileSync(source, map);
  // Reads a small answer out of the draft cache. The whole graph is never returned across the
  // debug protocol: the original atlas alone is 5 MB, and shipping it back stalls the connection.
  const fromDraft = expression => evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('skill-solar-system-v1'));return ${expression};})()`);
  const nodeCount = () => fromDraft('g.nodes.length');
  const answerOf = id => evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.find(n=>n.id===${JSON.stringify(id)})?.proficiency80`);
  const record = () => { const dir = path.join(app.dir, 'userdata', 'proficiency'); return existsSync(dir) && readdirSync(dir).length ? JSON.parse(readFileSync(path.join(dir, readdirSync(dir)[0]), 'utf8')) : null; };
  const settled = () => app.waitFor(`!/saving/.test(document.getElementById('sync-state').textContent)`);
  const selectByName = async name => { await evaluate(`(()=>{const n=${JSON.stringify(name)};[...document.querySelectorAll('.node-item')].find(b=>b.textContent===n).click()})()`); await sleep(250); };
  const selectById = id => selectByName(byId.get(id).name);
  const openCardNamed = async name => { await selectByName(name); await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.textContent==='Read subject details').click()`); await sleep(300); };
  const openCard = id => openCardNamed(byId.get(id).name);
  const cardText = () => evaluate(`document.getElementById('details-body').innerText`);
  const sectionTitles = () => evaluate(`[...document.querySelectorAll('#details-body details.lesson-section>summary')].map(s=>s.textContent)`);
  const openSection = async title => { await evaluate(`(()=>{const d=[...document.querySelectorAll('#details-body details.lesson-section')].find(d=>d.querySelector('summary').textContent===${JSON.stringify(title)});d.open=true})()`); await sleep(120); };
  const visibleAnswers = () => evaluate(`[...document.querySelectorAll('#details-body .lesson-answer')].filter(p=>!p.hidden).map(p=>p.textContent)`);

  await open(map);
  check('the imported map opens with every entry', await nodeCount() === EXPECT.nodes, `${EXPECT.nodes} entries`);
  const statuses = await fromDraft(`g.nodes.reduce((t,n)=>(t[n.contentStatus]=(t[n.contentStatus]||0)+1,t),{})`);
  check('the authored and pending counts survive the open', statuses['introductory lesson authored'] === EXPECT.authored && statuses['introductory lesson pending'] === EXPECT.pending && statuses['roadmap note, not assessed'] === EXPECT.roadmap, `${EXPECT.authored} / ${EXPECT.pending} / ${EXPECT.roadmap}`);
  check('the map title states the counts it actually holds', await evaluate(`document.getElementById('map-name').textContent`) === data.title && data.title.includes(String(EXPECT.authored)) && data.title.includes(String(EXPECT.pending)), data.title);
  check('no answer arrives with the content', await fromDraft('g.nodes.every(n=>n.proficiency80===null)') && !record()?.entries?.['rob3:I01']);
  // The review queue is rebuilt from the opened map's own ids, names and saved heights.
  const queued = await fromDraft(`g.nodes.map(n=>({id:n.id,name:n.name,position:n.position,proficiency80:n.proficiency80}))`);
  check('the review order is the one the saved heights give', buildQueue({ nodes: queued }, 'all').join() === buildQueue(data, 'all').join());
  await keep('01-v3-overview');

  // Every representative card: sections present, closed to begin with, answers hidden until asked for.
  for (const [area, id] of REPRESENTATIVE) {
    const node = byId.get(id), expected = lessonSections(node);
    await openCard(id);
    const titles = await sectionTitles();
    check(`the ${area} card opens with its authored sections`, titles.join('|') === expected.map(s => s.title).join('|'), titles.join(', ').slice(0, 90));
    check(`the ${area} card starts with every section closed`, await evaluate(`document.querySelectorAll('#details-body details.lesson-section[open]').length`) === 0);
    const header = await cardText();
    check(`the ${area} card says which edition wrote it`, new RegExp(`Introductory lesson available · ${EDITIONS[node.lessonCard.edition]}`).test(header), node.lessonCard.edition);
    check(`the ${area} card separates an available card from the extended work still pending`, /Extended lessons and further practice for this entry are still to be authored/.test(header));

    await openSection('Explanation and worked example');
    const body = await cardText();
    check(`the ${area} card shows the explanation and the worked example`, body.includes(node.lesson.explanation.slice(0, 60)) && body.includes(node.lesson.worked_example.slice(0, 60)));
    check(`the ${area} card does not repeat that text above the section`, body.split(node.lesson.explanation.slice(0, 60)).length === 2);

    await openSection('Why this matters and what it builds on');
    const prerequisites = data.edges.filter(e => e.type === 'prerequisite' && e.target === id).map(e => byId.get(e.source).name);
    const shown = await evaluate(`[...document.querySelectorAll('#details-body button.lesson-link')].map(b=>b.textContent)`);
    check(`the ${area} card names its prerequisites from the map's own edges`, shown.join('|') === prerequisites.join('|'), `${shown.length} shown`);
    check(`the ${area} card says why the skill matters`, (await cardText()).includes(node.lesson.why_it_matters.slice(0, 50)));

    await openSection('Practice question');
    await openSection('Boundary or misconception check');
    const questions = await cardText();
    check(`the ${area} card shows both questions`, questions.includes(node.lesson.practice.question.slice(0, 40)) && questions.includes(node.lesson.boundary_case.question.slice(0, 40)));
    check(`neither answer is shown before it is asked for`, (await visibleAnswers()).length === 0);
    await evaluate(`document.querySelectorAll('#details-body button.reveal')[0].click()`); await sleep(150);
    const afterFirst = await visibleAnswers();
    check(`the ${area} practice answer appears only when revealed`, afterFirst.length === 1 && afterFirst[0] === node.lesson.practice.answer);
    check('the boundary answer has its own separate control', !afterFirst.includes(node.lesson.boundary_case.answer));
    await evaluate(`document.querySelectorAll('#details-body button.reveal')[1].click()`); await sleep(150);
    const afterSecond = await visibleAnswers();
    check(`the ${area} boundary answer appears from its own control`, afterSecond.length === 2 && afterSecond.includes(node.lesson.boundary_case.answer));
    await evaluate(`document.querySelectorAll('#details-body button.reveal')[0].click()`); await sleep(150);
    check('an answer can be hidden again', (await visibleAnswers()).length === 1);

    await openSection('Full demonstration and evidence');
    const demonstration = await cardText();
    check(`the ${area} card states the demonstration it still requires`, demonstration.includes(node.lessonCard.demonstration.slice(0, 60)));
    check(`the ${area} card shows the assessment contract as text, not JSON`, !/[{}]|"mode"|\[object Object\]/.test(demonstration) && demonstration.includes(node.lessonCard.assessmentContract.evidence_record[0]));
    check(`the ${area} card separates the introductory exercise from the full demonstration`, /Introductory exercise/.test(demonstration) && /simulated or calculated result is supporting evidence/.test(demonstration));
    check(`opening the ${area} card and revealing answers changed no proficiency`, await answerOf(id) === null && !record()?.entries?.[id]);
    await keep(`card-${id.replace(/[:]/g, '-')}`);
    await click('#details-close', 200);
  }

  // The PID card is one of the fifteen that supply references; most supply none.
  await openCard('rob3:C03');
  await openSection('References and remaining learning work');
  const references = await cardText();
  check('a card with references shows them', references.includes(byId.get('rob3:C03').lesson.references[0].url));
  check('a card with references shows what remains to be learned', references.includes(byId.get('rob3:C03').lesson.required_future_work.slice(0, 40)));
  // The dialog scrolls rather than clipping a long card.
  await evaluate(`[...document.querySelectorAll('#details-body details.lesson-section')].forEach(d=>d.open=true)`); await sleep(200);
  const scroll = await evaluate(`(()=>{const d=document.getElementById('details-dialog');d.scrollTop=0;const before=d.scrollTop;d.scrollTop=d.scrollHeight;return {over:d.scrollHeight>d.clientHeight,before,after:d.scrollTop}})()`);
  check('a fully expanded card scrolls inside the dialog', scroll.over && scroll.after > scroll.before, `${scroll.after} px`);
  await keep('02-pid-card-expanded');
  await click('#details-close', 200);

  // Keyboard alone: a section opens from its summary, and an answer reveals from its button.
  await openCard('rob3:m-trig');
  await evaluate(`document.querySelector('#details-body details.lesson-section>summary').focus()`);
  await key('Enter');
  check('a section opens from the keyboard', await evaluate(`document.querySelectorAll('#details-body details.lesson-section[open]').length`) >= 1);
  await openSection('Practice question');
  await evaluate(`document.querySelector('#details-body button.reveal').focus()`);
  check('the reveal control can be reached and says it is closed', await evaluate(`document.activeElement.getAttribute('aria-expanded')`) === 'false');
  await key(' ');
  check('an answer reveals from the keyboard and says it is open', (await visibleAnswers()).length === 1 && await evaluate(`document.activeElement.getAttribute('aria-expanded')`) === 'true');
  check('revealing an answer by keyboard changed no proficiency', await answerOf('rob3:m-trig') === null);
  // A prerequisite link moves the card to that subject and puts focus on it, so reading can continue.
  await openSection('Why this matters and what it builds on');
  const jumpTo = await evaluate(`document.querySelector('#details-body button.lesson-link').textContent`);
  await evaluate(`document.querySelector('#details-body button.lesson-link').click()`); await sleep(400);
  check('a prerequisite link opens that card and keeps focus inside it', await evaluate(`document.getElementById('details-title').textContent`) === jumpTo && await evaluate(`document.getElementById('details-body').contains(document.activeElement)||document.activeElement.id==='details-close'`), jumpTo);
  check('following a prerequisite link changed no proficiency', await answerOf('rob3:m-trig') === null);
  await key('Escape'); await sleep(200);
  check('Escape closes the card', await evaluate(`!document.getElementById('details-dialog').open`));

  // Symbols, paragraph breaks and an entry with no authored lesson.
  await openCard(symbolNode.id);
  await evaluate(`[...document.querySelectorAll('#details-body details.lesson-section')].forEach(d=>d.open=true)`); await sleep(150);
  const symbolText = await cardText();
  const present = SYMBOLS.filter(s => JSON.stringify(symbolNode.lesson).includes(s));
  check('symbols survive into the card', present.every(s => symbolText.includes(s)), `${present.join(' ')} in ${symbolNode.id}`);
  check('the explanation and the worked example stay separate paragraphs', await evaluate(`document.querySelectorAll('#details-body details.lesson-section h4').length`) >= 2);
  await click('#details-close', 200);

  await openCard(PENDING.id);
  const pending = await cardText();
  check('an entry with no authored lesson says so, and does not claim one is merely unfinished', pending.includes('No introductory lesson for this entry yet') && !pending.includes('Introductory lesson available'));
  check('it offers no empty lesson sections', (await sectionTitles()).length === 0);
  check('it still shows the planning text it always had', pending.includes(PENDING.details.split('\n')[0].slice(0, 50)));
  check('it still offers the manual proficiency controls', await evaluate(`[...document.querySelectorAll('#details-body .proficiency-controls button')].map(b=>b.textContent).join('|')`) === 'Yes|No|Clear');
  await keep('03-pending-card');
  await click('#details-close', 200);

  await openCard(ROADMAP.id);
  const roadmap = await cardText();
  check('the roadmap note opens without a lesson and without error', (await sectionTitles()).length === 0);
  check('the roadmap note is not presented as something to be assessed', /not an assessed entry, and no lesson is planned for it/.test(roadmap) && !/Introductory lesson available/.test(roadmap), roadmap.replace(/\s+/g, ' ').slice(0, 140));
  await click('#details-close', 200);

  // A guided review begun on the map as it was titled before this import must still be offered,
  // at the same skill and queue position, after the import restated the counts in the title.
  // The session is planted in the app's own review store exactly as the old build would have left it.
  const legacyTitle = 'Robotics curriculum v3 — 193 introductory lessons, 187 pending';
  const legacy = startSession({ ...data, title: legacyTitle, metadata: { ...data.metadata, datasetKey: undefined } }, 'unmarked', 1);
  const worked = skip(legacy, currentId(legacy));
  const standingId = currentId(worked), standingName = byId.get(standingId).name;
  await evaluate(`localStorage.setItem(${JSON.stringify(REVIEW_STORE)}, ${JSON.stringify(JSON.stringify({ sessions: { [worked.map]: worked } }))})`);
  await open(map); // reopen so the review start view reads the planted session
  await click('#mark-proficiency', 500);
  const resumeLabel = await evaluate(`document.getElementById('review-resume')?.textContent ?? ''`);
  check('a review saved under the previous title is still offered after the import', resumeLabel.includes('Resume review'), resumeLabel);
  check('it reports the same number of skills still to go', resumeLabel.includes(String(worked.queue.length - worked.position)), `${worked.queue.length - worked.position} left`);
  await click('#review-resume', 500);
  check('it resumes on the same skill it was left on', await evaluate(`document.getElementById('review-title')?.textContent`) === standingName, standingName);
  const storedNow = await evaluate(`Object.values(JSON.parse(localStorage.getItem(${JSON.stringify(REVIEW_STORE)})).sessions)`);
  check('the session was re-keyed on the dataset, and the old entry was replaced, not duplicated', storedNow.length === 1 && storedNow[0].dataset === data.metadata.datasetKey && storedNow[0].map.startsWith('dataset:'), storedNow.map(x => x.map).join(' | '));
  check('the resumed queue and skipped list are the ones it was saved with', JSON.stringify(storedNow[0].queue) === JSON.stringify(worked.queue) && JSON.stringify(storedNow[0].skipped) === JSON.stringify(worked.skipped));
  check('resuming a review changed no proficiency', await fromDraft('g.nodes.every(n=>n.proficiency80===null)'));
  await key('Escape'); await sleep(300);
  await keep('05-review-resumed');

  // A manual answer still works, still reaches the shared record, and survives save and reopen.
  await selectById('rob3:I01');
  await evaluate(`[...document.querySelectorAll('#inspector .proficiency-controls button')].find(b=>b.textContent==='Yes').click()`); await sleep(300); await settled();
  check('the manual proficiency control still marks a skill', await answerOf('rob3:I01') === true && record()?.entries['rob3:I01']?.value === true);
  check('marking the milestone left its prerequisites alone', await answerOf('rob3:C03') === null);
  await click('#save', 600);
  const saved = JSON.parse(readFileSync(path.join(app.dir, 'saved.json'), 'utf8'));
  check('the saved file keeps every lesson', saved.nodes.filter(n => n.lesson).length === EXPECT.authored);
  check('the saved file keeps the authored fields the card does not show', saved.nodes.find(n => n.id === 'rob3:C03').lesson.node_contract_sha256 === byId.get('rob3:C03').lesson.node_contract_sha256 && saved.nodes.find(n => n.id === 'rob3:C03').lesson.dependency_depth != null);
  check('the saved file keeps the one answer given and no other', saved.nodes.filter(n => n.proficiency80 != null).length === 1 && saved.nodes.find(n => n.id === 'rob3:I01').proficiency80 === true);
  check('the saved file keeps the positions, levels and pins', saved.nodes.every((n, i) => JSON.stringify(n.position) === JSON.stringify(data.nodes[i].position) && n.skillLevel === data.nodes[i].skillLevel && n.pinned === data.nodes[i].pinned));
  check('the saved file keeps the atlas family, so answers stay separate', saved.metadata.atlasFamily === data.metadata.atlasFamily);

  await open(path.join(app.dir, 'saved.json'));
  check('reopening the saved map restores the lessons', await fromDraft('g.nodes.filter(n=>n.lesson).length') === EXPECT.authored);
  check('reopening the saved map restores the answer', await answerOf('rob3:I01') === true);
  await openCard('rob3:C03');
  await openSection('Practice question');
  check('a reopened card still hides its answer until asked', (await visibleAnswers()).length === 0);
  await evaluate(`document.querySelectorAll('#details-body button.reveal')[0].click()`); await sleep(150);
  check('a reopened card still reveals the right answer', (await visibleAnswers())[0] === byId.get('rob3:C03').lesson.practice.answer);
  await click('#details-close', 200);
  await keep('04-after-reload');

  if (process.env.SSS_ATLAS) {
    const atlas = path.join(app.dir, 'atlas.json');
    copyFileSync(process.env.SSS_ATLAS, atlas);
    const original = JSON.parse(readFileSync(atlas, 'utf8'));
    await open(atlas);
    check('the original Skill Solar System map still opens', await nodeCount() === original.nodes.length, `${original.nodes.length} skills`);
    const plain = original.nodes.find(n => n.details && n.details.trim());
    await openCardNamed(plain.name);
    const plainCard = await cardText();
    check('a map with no authored lessons keeps the card it always had', (await sectionTitles()).length === 0 && plainCard.includes(plain.details.trim().split(/\n\s*\n/)[0].slice(0, 60)));
    check('that card still shows where it sits and its proficiency controls', /Where it sits/.test(plainCard) && await evaluate(`document.querySelectorAll('#details-body .proficiency-controls button').length`) === 3);
    await click('#details-close', 200);
    check('the copied original was not changed', readFileSync(atlas, 'utf8') === readFileSync(process.env.SSS_ATLAS, 'utf8'));
    await keep('05-original-atlas');
  }

  check('the copied robotics map was not changed', readFileSync(map, 'utf8') === readFileSync(source, 'utf8'));
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} robotics v3 learning-content checks passed.`);
} finally { await app.stop(); }
