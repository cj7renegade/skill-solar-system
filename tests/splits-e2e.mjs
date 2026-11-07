// Since the AI-lessons change, lesson sections open in the lesson viewer (#lesson-body), not on the card.
// End-to-end check of the foundation splits map (authoring/splits/) in the real Electron app. The map
// and, optionally, a copy of a shared answer record are placed in an isolated profile, so the real
// map, the real record and the real profile are only ever read.
//
//   SSS_SPLITS_MAP=C:\sss-scratch\splits\Robotics-Atlas.json [SSS_RECORD=<shared record .json>] node tests/splits-e2e.mjs
//
// A record copy must keep its original file name: the app finds a record by its family's file name.
import { copyFileSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

if (!process.env.SSS_SPLITS_MAP) { console.log('Skipped: set SSS_SPLITS_MAP to the foundation splits map.'); process.exit(0); }
const { check, passed } = checker();
const source = path.resolve(process.env.SSS_SPLITS_MAP);
const data = JSON.parse(readFileSync(source, 'utf8'));
const byId = new Map(data.nodes.map(n => [n.id, n]));
const record = process.env.SSS_RECORD ? JSON.parse(readFileSync(process.env.SSS_RECORD, 'utf8')) : null;
const fresh = (data.foundationSplits?.addedSkills ?? []).map(s => byId.get(s.id));

const app = await launchApp('sss-splits-');
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
  const openCard = async node => { await selectByName(node.name); await evaluate(`(document.getElementById('lesson-primary')?.textContent==='Open lesson'?document.getElementById('lesson-primary'):[...document.querySelectorAll('#inspector button')].find(b=>b.id==='open-details')).click()`); await sleep(300); };
  const cardText = () => evaluate(`document.getElementById('details-body').textContent`);
  const closeCard = () => app.click('#details-close', 200);

  await open(map);
  check('the splits map opens with every skill', await fromDraft('g.nodes.length') === data.nodes.length && data.nodes.length === 1955, `${data.nodes.length} skills`);
  check('and every connection', await fromDraft('g.edges.length') === data.edges.length, `${data.edges.length} connections`);
  check('it declares the master answer family', await fromDraft('g.metadata.atlasFamily') === 'sss-robotics-foundations-2026-09');
  check('the map records the 35 approved splits', fresh.length === 35 && fresh.every(Boolean));

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
  check('every new skill starts unmarked', !fresh.some(n => shown.has(n.id)));

  // Each new skill's card shows its own details and no lesson sections.
  const missing = [];
  for (const node of fresh) {
    await openCard(node);
    const text = await cardText(), lessonSections = await evaluate(`document.querySelectorAll('#lesson-body details.lesson-section').length`);
    if (!text.includes(node.details.split('\n')[0].slice(0, 80)) || lessonSections) missing.push(node.id);
    await closeCard();
  }
  check('every new skill\'s card shows its details and no lesson', !missing.length, missing.length ? missing.slice(0, 5).join(', ') : `${fresh.length} cards`);

  const status = await evaluate(`document.getElementById('status').textContent`);
  check('the draft warning is absent', !/Draft cache unavailable/.test(status), status.slice(0, 80));
  check('no page errors', !pageErrors.length, pageErrors.slice(0, 2).join(' | '));
  console.log(`\n${passed.length} checks passed.`);
} finally {
  await app.stop();
}
