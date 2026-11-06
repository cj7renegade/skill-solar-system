// End-to-end check of the Edition 08 core-lessons map (authoring/lessons/) in the real Electron app.
// The map and, optionally, a copy of a shared answer record are placed in an isolated profile, so the
// real map, the real record and the real profile are only ever read.
//
//   SSS_CORE08_MAP=C:\sss-scratch\lessons\Robotics-Atlas.json [SSS_RECORD=<shared record .json>] node tests/core-lessons-e2e.mjs
//
// A record copy must keep its original file name: the app finds a record by its family's file name.
import { copyFileSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { lessonSections, needsRealEvidence, EDITION_NAMES } from '../src/lesson.js';

if (!process.env.SSS_CORE08_MAP) { console.log('Skipped: set SSS_CORE08_MAP to the Edition 08 map.'); process.exit(0); }
const { check, passed } = checker();
const source = path.resolve(process.env.SSS_CORE08_MAP);
const data = JSON.parse(readFileSync(source, 'utf8'));
const byId = new Map(data.nodes.map(n => [n.id, n]));
const record = process.env.SSS_RECORD ? JSON.parse(readFileSync(process.env.SSS_RECORD, 'utf8')) : null;
const EDITION = 'core-lessons-08';
const fresh = data.nodes.filter(n => n.lessonCard?.edition === EDITION);
// The card's hardware line (src/lesson.js exerciseKind), and an older card that shows it.
const HARDWARE = 'The full demonstration also needs physical or deployed-system evidence.';
const flagged = data.nodes.find(n => n.lesson && n.lessonCard.edition !== EDITION && needsRealEvidence(n));
// The I05 chain, master-only skills included.
const parents = new Map();
for (const e of data.edges) if (e.type === 'prerequisite') (parents.get(e.target) || parents.set(e.target, []).get(e.target)).push(e.source);
const chain = new Set(['rob3:I05']);
for (const stack = ['rob3:I05']; stack.length;) for (const p of parents.get(stack.pop()) || []) if (!chain.has(p)) { chain.add(p); stack.push(p); }

const app = await launchApp('sss-core08-');
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
  const openCard = async node => { await selectByName(node.name); await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.id==='open-details').click()`); await sleep(300); };
  const sectionTitles = () => evaluate(`[...document.querySelectorAll('#details-body details.lesson-section>summary')].map(s=>s.textContent)`);
  const cardText = () => evaluate(`document.getElementById('details-body').textContent`);
  const closeCard = () => app.click('#details-close', 200);

  await open(map);
  check('the Edition 08 map opens with every skill', await fromDraft('g.nodes.length') === data.nodes.length, `${data.nodes.length} skills`);
  check('and every connection', await fromDraft('g.edges.length') === data.edges.length, `${data.edges.length} connections`);
  check('the map holds the 23 Edition 08 cards, all on master skills', fresh.length === 23 && fresh.every(n => n.planningId === undefined));
  check('every skill on the I05 path has a card', [...chain].every(id => byId.get(id).lesson), `${chain.size} skills`);

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
  check('no Edition 08 card arrives with an answer', !fresh.some(n => shown.has(n.id)));

  const wrongCards = [];
  for (const node of fresh) {
    await openCard(node);
    const titles = await sectionTitles(), expected = lessonSections(node).map(s => s.title), text = await cardText();
    if (!(titles.length > 0 && JSON.stringify(titles) === JSON.stringify(expected) && text.includes(EDITION_NAMES[EDITION]) && !text.includes(HARDWARE))) wrongCards.push(node.id);
    await closeCard();
  }
  check('all 23 cards render their sections, name their edition and show no hardware line', !wrongCards.length, wrongCards.length ? wrongCards.slice(0, 5).join(', ') : '23 cards');
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
