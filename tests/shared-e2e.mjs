// End-to-end checks in the real Electron app for subject highlighting and the shared offline
// proficiency record. Uses generated maps in an isolated profile. Set SSS_ATLAS and SSS_SUBMAP to
// also check a real master atlas and one of its sub-maps; they are copied first, never modified.
import { writeFileSync, readFileSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check, passed } = checker();
const family = 'e2e-shared-family';
const long = name => `${name} explained in two short sentences. It is a test skill.`;
const skill = (id, name, domain, y, proficiency80) => ({ id, name, domain, description: `${name}.`, details: long(name), position: [(id.charCodeAt(0) % 5 - 2) * 90 + id.length * 7, y, (id.charCodeAt(1) % 3) * 50], pinned: false, proficiency80, skillLevel: 1 + y / 64, layoutMode: 'saved', icon: 'function', placementNote: '' });
const map = (title, metadata, nodes, edges = []) => ({ schemaVersion: 1, title, ...(metadata ? { metadata } : {}), nodes, edges });
const masterNodes = [skill('m1', 'Counting', 'Mathematics', 0, true), skill('m2', 'Fractions', 'Mathematics', 64, null), skill('p1', 'Units', 'Physics', 64, null), skill('e1', 'Circuits', 'Electronics', 128, null), skill('r1', 'Arm', 'Robotics', 192, null)];
const fixtures = {
  master: map('E2E master atlas', { atlasFamily: family }, masterNodes, [{ source: 'm1', target: 'm2', type: 'prerequisite' }, { source: 'p1', target: 'e1', type: 'supports' }]),
  // A mathematics sub-map from an older snapshot: it still carries a Yes for Fractions and includes a physics prerequisite.
  sub: map('E2E math sub-map', { atlasFamily: family }, [skill('m1', 'Counting', 'Mathematics', 0, null), skill('m2', 'Fractions', 'Mathematics', 64, true), skill('p1', 'Units', 'Physics', 64, null)], [{ source: 'm1', target: 'm2', type: 'prerequisite' }]),
  unrelated: map('Unrelated map', { atlasFamily: 'e2e-other-family' }, [skill('m2', 'Other fractions', 'Mathematics', 0, false), skill('x1', 'Other', 'Computing', 64, null)]),
  loose: map('Loose map', null, [skill('m2', 'Loose fractions', 'Mathematics', 0, null)])
};

let app = await launchApp('sss-shared-e2e-');
const files = Object.fromEntries(Object.entries(fixtures).map(([name, data]) => { const file = path.join(app.dir, `${name}.json`); writeFileSync(file, JSON.stringify(data, null, 2)); return [name, file]; }));
const recordFile = dir => { const folder = path.join(dir, 'userdata', 'proficiency'); if (!existsSync(folder)) return null; const file = readdirSync(folder).map(f => path.join(folder, f)).find(f => JSON.parse(readFileSync(f, 'utf8')).family === family); return file ? JSON.parse(readFileSync(file, 'utf8')) : null; };
const bind = a => ({
  ...a,
  status: () => a.evaluate(`document.getElementById('status').textContent`),
  value: id => a.evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.find(n=>n.id===${JSON.stringify(id)})?.proficiency80`),
  draft: () => a.evaluate(`localStorage.getItem('skill-solar-system-v1')`),
  highlighted: () => a.evaluate(`Number(document.getElementById('labels').dataset.highlighted||0)`),
  pressed: subject => a.evaluate(`document.querySelector('[data-subject="${subject}"]').getAttribute('aria-pressed')==='true'`),
  // Select a skill in the list, then press Yes, No, or Clear in the console.
  answer: async (name, label) => { await a.evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent===${JSON.stringify(name)}).click()`); await sleep(250); await a.evaluate(`[...document.querySelectorAll('#inspector .proficiency-controls button')].find(b=>b.textContent===${JSON.stringify(label)}).click()`); await sleep(250); },
  settled: () => a.waitFor(`!/saving/.test(document.getElementById('sync-state').textContent)`)
});
let ui = bind(app);
try {
  // --- Subject legend ------------------------------------------------------------------------
  await ui.open(files.master);
  check('opening a map with answers and no shared record starts the record from them', /Added 1 answer from this map to the shared record/.test(await ui.status()), await ui.status());
  await ui.settled();
  check('the shared record is written to the app\'s user-data folder', recordFile(app.dir)?.entries.m1.value === true);
  check('subjects with no skills in the map are shown but unavailable', await ui.evaluate(`document.querySelector('[data-subject="Mechanics"]').disabled&&document.querySelector('[data-subject="Computing"]').disabled`));
  const scene = await ui.labels(), draft = await ui.draft(), dirtyText = await ui.evaluate(`document.getElementById('dirty').textContent`);
  await ui.click('[data-subject="Physics"]', 250);
  check('clicking Physics highlights exactly the Physics skill', await ui.pressed('Physics') && await ui.highlighted() === 1);
  await ui.click('[data-subject="Mathematics"]', 250);
  check('several subjects can be highlighted together', await ui.pressed('Mathematics') && await ui.highlighted() === 3);
  check('highlighting does not move the camera, select a skill, change the map, or mark it dirty', await ui.labels() === scene && await ui.selectedLabel() === null && await ui.draft() === draft && await ui.evaluate(`document.getElementById('dirty').textContent`) === dirtyText);
  await ui.evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent==='Fractions').click()`); await sleep(500);
  const selectedScene = await ui.labels();
  await ui.click('[data-subject="Physics"]', 250);
  check('toggling a subject off keeps the individual selection and the camera', !(await ui.pressed('Physics')) && await ui.highlighted() === 2 && await ui.selectedLabel() === 'Fractions' && await ui.labels() === selectedScene);
  await ui.click('#show-proficiency', 250);
  check('highlights stay on with proficiency colouring', await ui.highlighted() === 2 && await ui.evaluate(`!!document.querySelector('[data-subject="Mathematics"][aria-pressed="true"]')`));
  await ui.click('#show-proficiency', 250);
  await ui.click('#clear-highlights', 250);
  check('Clear highlights removes every highlight', await ui.highlighted() === 0 && await ui.evaluate(`![...document.querySelectorAll('[data-subject]')].some(b=>b.getAttribute('aria-pressed')==='true')`));
  await ui.click('[data-subject="Robotics"]', 250);
  await ui.open(files.sub);
  check('opening a map without Robotics drops the Robotics highlight', !(await ui.pressed('Robotics')) && await ui.highlighted() === 0 && await ui.evaluate(`document.querySelector('[data-subject="Robotics"]').disabled`));
  check('the physics prerequisite in the maths sub-map counts as Physics', await ui.evaluate(`document.querySelector('[data-subject="Physics"] .legend-count').textContent==='1'`));

  // --- Shared answers between a sub-map and the master -------------------------------------------
  check('the master\'s Yes reaches the sub-map, and the sub-map\'s own Yes starts a shared entry', await ui.value('m1') === true && /Applied shared proficiency to 1 skill\./.test(await ui.status()) && /Added 1 answer/.test(await ui.status()));
  check('a map changed by shared answers is marked as a local draft', /Local draft/.test(await ui.evaluate(`document.getElementById('dirty').textContent`)));
  for (const [label, expected] of [['Yes', true], ['No', false], ['Clear', null]]) {
    await ui.open(files.sub); await ui.answer('Units', label); await ui.settled();
    await ui.open(files.master);
    check(`${label} on a skill in the sub-map shows in the master`, await ui.value('p1') === expected, `master Units = ${await ui.value('p1')}`);
  }
  await ui.open(files.sub); await ui.answer('Counting', 'Clear'); await ui.settled();
  await ui.open(files.master);
  check('a shared Clear overrides the Yes saved inside the older master file', await ui.value('m1') === null);
  await ui.answer('Fractions', 'No'); await ui.settled();
  await ui.open(files.sub);
  check('an answer in the master reaches the sub-map, overriding the sub-map\'s older Yes', await ui.value('m2') === false);
  check('the record keeps revision details for diagnosis', (() => { const r = recordFile(app.dir); return r.revision > 3 && r.entries.m2.source === 'console' && r.entries.m2.map === 'E2E master atlas' && typeof r.entries.m2.updatedAt === 'string'; })());

  // --- Unrelated and family-less maps --------------------------------------------------------------
  await ui.open(files.unrelated);
  check('a map from another atlas family keeps its own answer for a reused id', await ui.value('m2') === false && /e2e-other-family/.test(await ui.evaluate(`document.getElementById('shared-summary').textContent`)));
  await ui.answer('Other fractions', 'Yes'); await ui.settled();
  await ui.open(files.loose);
  check('a map with no atlas family says its answers stay in the map', /no atlas family/.test(await ui.evaluate(`document.getElementById('shared-summary').textContent`)));
  await ui.answer('Loose fractions', 'Yes'); await sleep(300);
  await ui.open(files.master);
  check('answers in unrelated and family-less maps never reach this family', await ui.value('m2') === false && recordFile(app.dir).entries.m2.value === false);

  // --- Undo and Redo ----------------------------------------------------------------------------
  await ui.answer('Fractions', 'Yes'); await ui.settled();
  await ui.click('#edit-mode', 200);
  await ui.click('#undo', 300); await ui.settled();
  check('Undo reverses the answer in the map and in the shared record', await ui.value('m2') === false && recordFile(app.dir).entries.m2.value === false);
  await ui.click('#redo', 300); await ui.settled();
  check('Redo reapplies it in both', await ui.value('m2') === true && recordFile(app.dir).entries.m2.value === true);
  await ui.click('#undo', 300); await ui.settled();
  await ui.click('#edit-mode', 200);
  await ui.open(files.sub);
  check('an undone answer does not return when a related map is opened', await ui.value('m2') === false);

  // --- Guided review with shared answers ------------------------------------------------------------
  await ui.open(files.master);
  const unmarked = (await ui.evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.filter(n=>n.proficiency80!==true&&n.proficiency80!==false).length`));
  await ui.click('#mark-proficiency', 300);
  check('the review counts unmarked skills after shared answers are applied', await ui.evaluate(`document.getElementById('review-unmarked')?.textContent.includes('(${unmarked})')`), `${unmarked} unmarked`);
  await ui.click('#review-unmarked', 300);
  check('the review starts with the lowest unmarked skill', await ui.evaluate(`document.getElementById('review-title').textContent`) === 'Counting');
  await ui.click('.review-answer.yes', 500); await ui.click('#review-pause', 300); await ui.settled();
  await ui.open(files.sub);
  check('a review answer in the master reaches the sub-map', await ui.value('m1') === true);
  await ui.answer('Counting', 'Clear'); await ui.settled();
  await ui.open(files.master);
  await ui.click('#mark-proficiency', 300); await ui.click('#review-resume', 300);
  check('resuming the master\'s review treats the answer cleared elsewhere as pending again', /undone/.test(await ui.evaluate(`document.getElementById('review-status').textContent`)) && await ui.value('m1') === null);
  await ui.key('Escape');

  // --- Export, import, and adopting a file's answers -----------------------------------------------------
  await ui.click('#export-record', 600);
  const exported = JSON.parse(readFileSync(path.join(app.dir, 'saved.json'), 'utf8'));
  check('Export writes the shared record as a validated file', exported.format === 'skill-solar-system-proficiency' && exported.family === family && exported.entries.m1.value === null);
  const incoming = { ...exported, entries: { ...exported.entries, m2: { value: true }, e1: { value: false } } };
  const importFile = path.join(app.dir, 'import.json'); writeFileSync(importFile, JSON.stringify(incoming));
  await ui.setFiles('#record-file', importFile); await sleep(800); await ui.settled();
  check('Import asks first, then applies the imported answers', app.dialogs.at(-1)?.includes('Imported answers replace shared answers for the same skills') && await ui.value('m2') === true && await ui.value('e1') === false, await ui.status());
  const otherFamily = path.join(app.dir, 'other-record.json'); writeFileSync(otherFamily, JSON.stringify({ ...incoming, family: 'e2e-other-family' }));
  await ui.setFiles('#record-file', otherFamily); await sleep(400);
  check('a record from another atlas family is rejected', /Could not import proficiency record: The record belongs to atlas family/.test(await ui.status()));
  await ui.setFiles('#record-file', files.master); await sleep(400);
  check('a map file is not accepted as a proficiency record', /Could not import proficiency record/.test(await ui.status()));
  await ui.open(files.sub);
  await ui.click('#adopt-file', 800); await ui.settled();
  await ui.open(files.master);
  check('"Use this file\'s answers" replaces shared answers with the sub-map file\'s own, after confirming', app.dialogs.at(-1)?.includes('Replace the shared answers') && await ui.value('m2') === true && await ui.value('m1') === null && await ui.value('p1') === null);

  // --- Saving, restart, and unchanged map content ---------------------------------------------------------------
  await ui.click('#save', 800); await ui.waitFor(`/saved to file/i.test(document.getElementById('status').textContent)`);
  const saved = JSON.parse(readFileSync(path.join(app.dir, 'saved.json'), 'utf8'));
  const strip = g => JSON.stringify({ ...g, nodes: g.nodes.map(n => ({ ...n, proficiency80: null })) });
  check('Save map writes the effective answers and leaves every other field unchanged', saved.nodes.find(n => n.id === 'm2').proficiency80 === true && strip(saved) === strip(fixtures.master));
  check('the sub-map file on disk was not rewritten', readFileSync(files.sub, 'utf8') === JSON.stringify(fixtures.sub, null, 2));
  await app.stop();
  app = await launchApp('sss-shared-e2e-', { dir: app.dir }); ui = bind(app);
  await ui.open(files.sub);
  check('shared answers survive a restart', await ui.value('m2') === true && await ui.value('m1') === null);
  check('no uncaught page errors', app.pageErrors.length === 0, app.pageErrors.join(' | '));
  await app.stop();

  // --- A failed write is reported, not hidden --------------------------------------------------------------------
  app = await launchApp('sss-shared-fail-', { env: { SSS_FAIL_PROFICIENCY_WRITES: '1' } }); ui = bind(app);
  const failing = path.join(app.dir, 'master.json'); writeFileSync(failing, JSON.stringify(fixtures.master));
  // The failed write replaces the "Opened" status, so wait for the failure report instead.
  await ui.setFiles('#file', failing);
  await ui.waitFor(`/NOT saved/.test(document.getElementById('status').textContent)`);
  check('opening a map whose first shared write fails reports it plainly', /Shared proficiency was NOT saved on this computer: Simulated disk failure\./.test(await ui.status()), await ui.status());
  await ui.answer('Units', 'Yes'); await sleep(600);
  check('a failed shared-record write is shown in the footer and the status', /NOT saved/.test(await ui.evaluate(`document.getElementById('sync-state').textContent`)) && /NOT saved/.test(await ui.status()));
  check('the answer still stays in the open map and its draft', await ui.value('p1') === true && recordFile(app.dir) === null);
  await app.stop();

  // --- Optional: a real master atlas and one of its sub-maps (copied, never modified) --------------------------------
  if (process.env.SSS_ATLAS && process.env.SSS_SUBMAP) {
    app = await launchApp('sss-shared-atlas-'); ui = bind(app);
    const master = path.join(app.dir, 'atlas-master.json'), sub = path.join(app.dir, 'atlas-submap.json');
    copyFileSync(process.env.SSS_ATLAS, master); copyFileSync(process.env.SSS_SUBMAP, sub);
    const masterData = JSON.parse(readFileSync(master, 'utf8')), subData = JSON.parse(readFileSync(sub, 'utf8'));
    const inMaster = new Map(masterData.nodes.map(n => [n.id, n]));
    const target = subData.nodes.find(n => n.domain === 'Mathematics' && inMaster.has(n.id) && inMaster.get(n.id).proficiency80 == null && n.proficiency80 == null);
    await ui.open(sub);
    for (const [label, expected] of [['Yes', true], ['No', false], ['Clear', null]]) {
      await ui.answer(target.name, label); await ui.settled();
      await ui.open(master);
      const shown = await ui.value(target.id);
      check(`atlas: ${label} on "${target.name}" in the sub-map shows in the master`, shown === expected, `${shown}`);
      await ui.open(sub);
    }
    await ui.open(master);
    check('atlas: the master opens with all skills and applies shared answers', /Opened atlas-master\.json/.test(await ui.status()) && await ui.evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.length`) === masterData.nodes.length, await ui.status());
    check('atlas: the copied originals are unchanged', readFileSync(master, 'utf8') === readFileSync(process.env.SSS_ATLAS, 'utf8') && readFileSync(sub, 'utf8') === readFileSync(process.env.SSS_SUBMAP, 'utf8'));
    await app.stop();
  }
  console.log(`\n${passed.length} highlight and shared-proficiency checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally { app.close(); }
