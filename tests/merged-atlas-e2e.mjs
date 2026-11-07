// End-to-end check of the merged Robotics Atlas (authoring/merge/) in the real Electron app. The map
// and, optionally, a copy of a shared answer record are placed in an isolated profile, so the real
// map, the real record and the real profile are only ever read.
//
//   SSS_MERGED_MAP=C:\sss-scratch\merge\Robotics-Atlas.json [SSS_RECORD=<shared record .json>] node tests/merged-atlas-e2e.mjs
import { copyFileSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { lessonSections } from '../src/lesson.js';

if (!process.env.SSS_MERGED_MAP) { console.log('Skipped: set SSS_MERGED_MAP to the merged Robotics Atlas.'); process.exit(0); }
const { check, passed } = checker();
const source = path.resolve(process.env.SSS_MERGED_MAP);
const data = JSON.parse(readFileSync(source, 'utf8'));
const byId = new Map(data.nodes.map(n => [n.id, n]));
const record = process.env.SSS_RECORD ? JSON.parse(readFileSync(process.env.SSS_RECORD, 'utf8')) : null;
// Cards to open: a shared master skill with a V3 lesson, a new V3 outcome, and a same-ability skill.
const shared = data.nodes.find(n => n.lesson && !n.id.startsWith('rob3:') && !n.mergedFrom);
const fresh = byId.get('rob3:K03'), sameAbility = data.nodes.find(n => n.mergedFrom && n.lesson);

const app = await launchApp('sss-merged-atlas-');
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
  const closeCard = () => app.click('#details-close', 200);

  await open(map);
  check('the merged atlas opens with every skill', await fromDraft('g.nodes.length') === data.nodes.length, `${data.nodes.length} skills`);
  check('and every connection', await fromDraft('g.edges.length') === data.edges.length, `${data.edges.length} connections`);
  check('it declares the master answer family', await fromDraft('g.metadata.atlasFamily') === 'sss-robotics-foundations-2026-09');

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
  // A V3 entry may show an answer JC gave it in the shared record (rob3:B-C01, 2026-11-05), never one from anywhere else.
  check('no new V3 entry arrives with an answer the record does not hold', ![...shown.keys()].some(id => id.startsWith('rob3:') && !(record && id in record.entries)));

  for (const [label, node] of [['a shared master skill', shared], ['a new V3 outcome', fresh], ['a same-ability skill', sameAbility]]) {
    await openCard(node);
    const titles = await sectionTitles(), expected = lessonSections(node).map(s => s.title);
    check(`the V3 lesson card renders on ${label}`, titles.length > 0 && JSON.stringify(titles) === JSON.stringify(expected), `${node.id}: ${titles.length} sections`);
    await closeCard();
  }

  const status = await evaluate(`document.getElementById('status').textContent`);
  check('the draft warning is absent', !/Draft cache unavailable/.test(status), status.slice(0, 80));
  check('the draft cache holds the merged atlas', await fromDraft('g.metadata.datasetKey') === 'robotics-atlas-merged');
  check('no page errors', !pageErrors.length, pageErrors.slice(0, 2).join(' | '));
  console.log(`\n${passed.length} checks passed.`);
} finally {
  await app.stop();
}
