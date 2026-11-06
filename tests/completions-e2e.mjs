// End-to-end check of the robotics completions map (Edition 07, authoring/completions/) in the real
// Electron app. The map and, optionally, a copy of a shared answer record are placed in an isolated
// profile, so the real map, the real record and the real profile are only ever read.
//
//   SSS_COMPLETIONS_MAP=C:\sss-scratch\completions\Robotics-Atlas.json [SSS_RECORD=<shared record .json>] node tests/completions-e2e.mjs
import { copyFileSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { lessonSections, needsRealEvidence, EDITION_NAMES } from '../src/lesson.js';

if (!process.env.SSS_COMPLETIONS_MAP) { console.log('Skipped: set SSS_COMPLETIONS_MAP to the completions map.'); process.exit(0); }
const { check, passed } = checker();
const source = path.resolve(process.env.SSS_COMPLETIONS_MAP);
const data = JSON.parse(readFileSync(source, 'utf8'));
const byId = new Map(data.nodes.map(n => [n.id, n]));
const record = process.env.SSS_RECORD ? JSON.parse(readFileSync(process.env.SSS_RECORD, 'utf8')) : null;
const EDITION = 'robotics-completions-07';
const fresh = data.nodes.filter(n => n.lessonCard?.edition === EDITION);
// The card's hardware line (src/lesson.js exerciseKind), and an older card that shows it.
const HARDWARE = 'The full demonstration also needs physical or deployed-system evidence.';
const flagged = data.nodes.find(n => n.lesson && n.lessonCard.edition !== EDITION && needsRealEvidence(n));

const app = await launchApp('sss-completions-');
try {
  const { evaluate, open, pageErrors } = app;
  if (record) {
    const store = path.join(app.dir, 'userdata', 'proficiency');
    mkdirSync(store, { recursive: true });
    copyFileSync(process.env.SSS_RECORD, path.join(store, path.basename(process.env.SSS_RECORD)));
  }
  const map = path.join(app.dir, 'Robotics-Atlas.json');
  copyFileSync(source, map);
  const fromDraft = expression => evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('skill-solar-system-v1'));return ${expression};})()`);
  const selectByName = async name => { await evaluate(`(()=>{const n=${JSON.stringify(name)};[...document.querySelectorAll('.node-item')].find(b=>b.textContent===n).click()})()`); await sleep(250); };
  const openCard = async node => { await selectByName(node.name); await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.textContent==='Read subject details').click()`); await sleep(300); };
  const sectionTitles = () => evaluate(`[...document.querySelectorAll('#details-body details.lesson-section>summary')].map(s=>s.textContent)`);
  const cardText = () => evaluate(`document.getElementById('details-body').textContent`);
  const closeCard = () => app.click('#details-close', 200);

  await open(map);
  check('the completions map opens with every skill', await fromDraft('g.nodes.length') === data.nodes.length && data.nodes.length === 1920, `${data.nodes.length} skills`);
  check('and every connection', await fromDraft('g.edges.length') === data.edges.length, `${data.edges.length} connections`);
  check('it declares the master answer family', await fromDraft('g.metadata.atlasFamily') === 'sss-robotics-foundations-2026-09');
  check('the map holds the eight Edition 07 cards', fresh.length === 8, fresh.map(n => n.planningId).join(' '));

  const shown = new Map(await fromDraft(`g.nodes.filter(n=>n.proficiency80!==null).map(n=>[n.id,n.proficiency80])`));
  if (record) {
    // Each record entry is { value, revision, updatedAt, source, map }; value is true, false or null (a Clear).
    const entries = Object.entries(record.entries).filter(([id]) => byId.has(id)).map(([id, entry]) => [id, entry?.value ?? null]);
    const wrong = entries.filter(([id, value]) => (shown.get(id) ?? null) !== value);
    check('every answer shown matches the shared record', !wrong.length, wrong.length ? `differs: ${wrong.slice(0, 5).map(([id]) => id).join(', ')}` : `${entries.length} record entries`);
    const outside = data.nodes.filter(n => !(n.id in record.entries) && (shown.get(n.id) ?? null) !== (n.proficiency80 ?? null));
    check('skills outside the record keep the answer in the file', !outside.length, outside.slice(0, 5).map(n => n.id).join(', '));
  } else {
    const wrong = data.nodes.filter(n => (shown.get(n.id) ?? null) !== (n.proficiency80 ?? null));
    check('every answer shown matches the file (no record supplied)', !wrong.length, `${shown.size} answers`);
  }
  check('the new skills start unmarked', !shown.has('rob3:P11') && !shown.has('rob3:A12'));
  check('no Edition 07 card arrives with an answer', !fresh.some(n => shown.has(n.id)));

  for (const node of fresh) {
    await openCard(node);
    const titles = await sectionTitles(), expected = lessonSections(node).map(s => s.title), text = await cardText();
    check(`the Edition 07 card renders on ${node.id}`, titles.length > 0 && JSON.stringify(titles) === JSON.stringify(expected), `${titles.length} sections`);
    check(`${node.id} names its edition and shows no hardware line`, text.includes(EDITION_NAMES[EDITION]) && !text.includes(HARDWARE) && node.lessonCard.requiresPhysicalEvidence === false);
    await closeCard();
  }
  // The hardware line still appears where an older card's wording calls for it, so its absence above means something.
  await openCard(flagged);
  check('an older card that needs real evidence still shows the hardware line', (await cardText()).includes(HARDWARE), flagged.id);
  await closeCard();

  const status = await evaluate(`document.getElementById('status').textContent`);
  check('the draft warning is absent', !/Draft cache unavailable/.test(status), status.slice(0, 80));
  check('no page errors', !pageErrors.length, pageErrors.slice(0, 2).join(' | '));
  console.log(`\n${passed.length} checks passed.`);
} finally {
  await app.stop();
}
