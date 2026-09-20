// End-to-end check of marking a whole prerequisite chain from a skill card, in the real Electron
// app with an isolated profile and its own proficiency store. Runs on a generated map, so it needs
// no local files; set SSS_V3_MAP to also check the 381-entry robotics map, read-only.
import { writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { screenshot } from './e2e-pixels.mjs';
import { prerequisiteChain, chainSummary } from '../src/prerequisites.js';

const { check, passed } = checker();
const node = (id, name, extra = {}) => ({ id, name, domain: 'Computing', description: `${name}.`, details: '', position: [0, 0, 0], pinned: false, proficiency80: null, icon: 'code', layoutMode: 'manual', ...extra });
// The chain from the request, plus a supporting link and a skill above, both of which must be left alone.
const fixture = {
  schemaVersion: 1, title: 'Prerequisite chain map', metadata: { atlasFamily: 'chain-test-family' },
  nodes: [
    node('modules', 'Modules and imports', { position: [0, 500, 0] }),
    node('functions', 'Functions, parameters, and return values', { position: [0, 400, 0] }),
    node('naming', 'Naming things clearly', { position: [90, 400, 0], proficiency80: false }),
    node('expressions', 'Expressions and operators', { position: [0, 300, 0] }),
    node('order', 'Order of operations for basic arithmetic', { position: [-90, 200, 0] }),
    node('variables', 'Variables and assignment', { position: [90, 200, 0], proficiency80: true }),
    node('style', 'Code style', { position: [180, 400, 0], domain: 'Mathematics', icon: 'ruler' }),
    node('packaging', 'Packaging and distribution', { position: [0, 600, 0] })
  ],
  edges: [
    { source: 'functions', target: 'modules', type: 'prerequisite' },
    { source: 'naming', target: 'modules', type: 'prerequisite' },
    { source: 'expressions', target: 'functions', type: 'prerequisite' },
    { source: 'order', target: 'expressions', type: 'prerequisite' },
    { source: 'variables', target: 'expressions', type: 'prerequisite' },
    { source: 'style', target: 'modules', type: 'supports' },
    { source: 'modules', target: 'packaging', type: 'prerequisite' }
  ]
};
const expectedChain = prerequisiteChain(fixture, 'modules');

const app = await launchApp('sss-chain-e2e-');
const shots = process.env.SSS_SHOTS; if (shots) mkdirSync(shots, { recursive: true });
const keep = async name => { if (shots) writeFileSync(path.join(shots, `${name}.png`), (await screenshot(app.send)).png); };
try {
  const { evaluate, open, click, key, pageErrors } = app;
  const map = path.join(app.dir, 'chain.json');
  writeFileSync(map, JSON.stringify(fixture, null, 2));
  const answerOf = id => evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.find(n=>n.id===${JSON.stringify(id)})?.proficiency80`);
  const answers = () => evaluate(`Object.fromEntries(JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.map(n=>[n.id,n.proficiency80]))`);
  const record = () => { const dir = path.join(app.dir, 'userdata', 'proficiency'); return existsSync(dir) && readdirSync(dir).length ? JSON.parse(readFileSync(path.join(dir, readdirSync(dir)[0]), 'utf8')) : null; };
  const settled = () => app.waitFor(`!/saving/.test(document.getElementById('sync-state').textContent)`);
  const selectByName = async name => { await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent===${JSON.stringify(name)}).click()`); await sleep(250); };
  const chainOpen = () => evaluate(`!!document.getElementById('chain-dialog').open`);
  const rows = () => evaluate(`[...document.querySelectorAll('#chain-body .chain-item')].map(l=>({name:l.querySelector('.chain-name').textContent,meta:l.querySelector('.chain-meta').textContent,checked:l.querySelector('input').checked}))`);
  const steps = () => evaluate(`[...document.querySelectorAll('#chain-body .chain-step')].map(h=>h.textContent)`);
  const action = () => evaluate(`({text:document.getElementById('chain-apply').textContent,disabled:document.getElementById('chain-apply').disabled,note:document.getElementById('chain-note').textContent})`);
  const clickChainButton = async label => { await evaluate(`[...document.querySelectorAll('#chain-body button')].find(b=>b.textContent.startsWith(${JSON.stringify(label)})).click()`); await sleep(200); };

  await open(map);
  const before = await answers();
  check('the map opens with its two saved answers and nothing else marked', before.variables === true && before.naming === false && before.modules === null);

  // The card offers the chain, and says what it is before anything is opened.
  await selectByName('Modules and imports');
  const panel = await evaluate(`document.getElementById('inspector').innerText`);
  check('the card offers to mark the whole prerequisite chain', /Mark proficient on all prerequisite skills \(5\)…/.test(panel), panel.replace(/\s+/g, ' ').slice(0, 160));
  check('the card says how many are already answered Yes before opening it', /rests on 5 skills, 1 already marked Yes/.test(panel));
  check('the card says nothing is marked until the list is confirmed', /Nothing is marked until you confirm the list/.test(panel));

  await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.textContent.startsWith('Mark proficient on all prerequisite skills')).click()`); await sleep(400);
  check('the control opens a list rather than marking anything', await chainOpen() && JSON.stringify(await answers()) === JSON.stringify(before));
  check('the list is titled for the skill it belongs to', await evaluate(`document.getElementById('chain-title').textContent`) === 'Prerequisites of Modules and imports');

  // The list itself: every skill underneath, nearest first, with its current answer.
  const listed = await rows();
  check('every skill in the chain is listed, nearest first and most fundamental last',
    listed.map(r => r.name).join(' | ') === expectedChain.map(s => s.name).join(' | '), listed.map(r => r.name).join(', '));
  check('the list is grouped by how far down each skill sits', (await steps()).join(' | ') === 'Direct prerequisites (2) | 2 steps further down (1) | 3 steps further down (2)', (await steps()).join(' | '));
  check('each skill shows the answer it currently holds', listed.find(r => r.name.startsWith('Variables')).meta.endsWith('Yes') && listed.find(r => r.name.startsWith('Naming')).meta.endsWith('No') && listed.find(r => r.name.startsWith('Functions')).meta.endsWith('Not marked'));
  check('a supporting link is not treated as learning order', !listed.some(r => r.name === 'Code style'));
  check('a skill the chain leads up to is not in it', !listed.some(r => r.name.startsWith('Packaging')));
  check('the skill itself is not in its own chain', !listed.some(r => r.name === 'Modules and imports'));
  check('only the skills the answer would change start ticked', listed.filter(r => r.checked).length === 4 && !listed.find(r => r.name.startsWith('Variables')).checked);
  check('the button names the number it would change, not the number listed', (await action()).text === 'Mark 4 skills Yes', (await action()).text);
  await keep('01-chain-list');

  // Unticking and reticking, and an answer that changes nothing.
  await evaluate(`[...document.querySelectorAll('#chain-body .chain-item')].find(l=>l.querySelector('.chain-name').textContent.startsWith('Naming')).querySelector('input').click()`); await sleep(200);
  check('unticking a skill takes it out of the count', (await action()).text === 'Mark 3 skills Yes');
  check('nothing is written while the list is being changed', JSON.stringify(await answers()) === JSON.stringify(before));
  await clickChainButton('Uncheck all');
  const empty = await action();
  check('with nothing ticked the action is refused rather than doing nothing silently', empty.disabled && empty.text === 'Nothing to change', `${empty.text} · ${empty.note}`);
  await clickChainButton('Check all');
  check('checking all still only counts the skills that would change', (await action()).text === 'Mark 4 skills Yes');

  // Clear and No are offered too, and each recounts against what is already recorded.
  await evaluate(`[...document.querySelectorAll('#chain-body .chain-answer button')].find(b=>b.textContent==='Clear').click()`); await sleep(250);
  check('choosing Clear recounts against the answers already held, and reads as an action', (await action()).text === 'Clear 2 skills', (await action()).text);
  await evaluate(`[...document.querySelectorAll('#chain-body .chain-answer button')].find(b=>b.textContent==='Yes').click()`); await sleep(250);
  check('choosing Yes again restores its own count', (await action()).text === 'Mark 4 skills Yes');

  // Cancelling writes nothing.
  await clickChainButton('Cancel');
  check('cancelling the list writes nothing', !(await chainOpen()) && JSON.stringify(await answers()) === JSON.stringify(before));
  check('cancelling leaves the shared record alone', !record()?.entries?.functions);

  // Confirming writes exactly the skills that were ticked.
  await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.textContent.startsWith('Mark proficient on all prerequisite skills')).click()`); await sleep(400);
  await evaluate(`document.getElementById('chain-apply').click()`); await sleep(500); await settled();
  const after = await answers();
  check('the list closes once the answers are recorded', !(await chainOpen()));
  check('every skill in the chain now holds the chosen answer', ['functions', 'naming', 'expressions', 'order', 'variables'].every(id => after[id] === true));
  check('the skill the chain belongs to is not marked by it', after.modules === null);
  check('a supporting skill is not marked by it', after.style === null);
  check('a skill above is not marked by it', after.packaging === null);
  check('the answers reach the shared record, each recorded as its own entry', ['functions', 'naming', 'expressions', 'order'].every(id => record()?.entries[id]?.value === true));
  // Opening a map already adopts its own answers into the shared record, so Variables has an entry
  // from before this pass. What matters is that the pass did not rewrite it.
  const entries = record().entries;
  check('the pass is recorded as its own source, separate from the ordinary console answer', entries.functions.source === 'prerequisite chain', entries.functions.source);
  check('a skill that already held the answer is not rewritten by the pass', entries.variables.source === 'initialized from map' && entries.variables.revision < entries.functions.revision, `${entries.variables.source} r${entries.variables.revision} vs r${entries.functions.revision}`);
  check('every skill the pass did write shares one revision', new Set(['functions', 'naming', 'expressions', 'order'].map(id => entries[id].revision)).size === 1);
  check('the status line reports the pass and says Undo reverses it', /Marked 4 prerequisites of Modules and imports: Yes\./.test(await evaluate(`document.getElementById('status').textContent`)) && /Undo reverses the whole pass/.test(await evaluate(`document.getElementById('status').textContent`)));
  await keep('02-after-marking');

  // One Undo reverses the whole pass, and the shared record follows it back.
  await evaluate(`document.getElementById('edit-mode').click()`); await sleep(250);
  await click('#undo', 500); await settled();
  const undone = await answers();
  check('one Undo reverses the whole pass', JSON.stringify(undone) === JSON.stringify(before), `${Object.entries(undone).filter(([, v]) => v !== null).map(([k, v]) => `${k}=${v}`).join(' ')}`);
  check('the shared record follows the Undo back', record()?.entries?.functions?.value === null || record()?.entries?.functions === undefined);
  await click('#redo', 500); await settled();
  check('Redo puts the whole pass back', (await answers()).functions === true && (await answers()).order === true);
  await evaluate(`document.getElementById('edit-mode').click()`); await sleep(250);

  // Nothing on a card with no chain, and the list survives save and reopen.
  await selectByName('Variables and assignment');
  const bare = await evaluate(`document.getElementById('inspector').innerText`);
  check('a skill with nothing underneath offers no chain control', !/Mark proficient on all prerequisite skills/.test(bare));
  check('a map that records no content status shows no stray text for it', !/null/.test(bare), bare.replace(/\s+/g, ' ').slice(0, 120));
  await click('#save', 600);
  const saved = JSON.parse(readFileSync(path.join(app.dir, 'saved.json'), 'utf8'));
  check('the saved file holds the marked chain and nothing else', saved.nodes.filter(n => n.proficiency80 === true).length === 5 && saved.nodes.find(n => n.id === 'modules').proficiency80 === null);
  check('the saved file is otherwise unchanged', JSON.stringify(saved.edges) === JSON.stringify(fixture.edges) && saved.nodes.every((n, i) => n.id === fixture.nodes[i].id && JSON.stringify(n.position) === JSON.stringify(fixture.nodes[i].position)));

  // Keyboard alone, on a reopened map.
  await open(path.join(app.dir, 'saved.json'));
  await selectByName('Modules and imports');
  await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.textContent.startsWith('Mark proficient on all prerequisite skills')).focus()`);
  await key('Enter'); await sleep(400);
  check('the list opens from the keyboard', await chainOpen());
  check('with every skill answered it offers nothing to change', (await action()).disabled);
  await evaluate(`[...document.querySelectorAll('#chain-body .chain-answer button')].find(b=>b.textContent==='No').click()`); await sleep(250);
  check('switching the answer makes the whole chain changeable again', (await action()).text === 'Mark 5 skills No');
  await key('Escape'); await sleep(300);
  check('Escape closes the list without writing', !(await chainOpen()) && (await answerOf('functions')) === true);
  await keep('03-reopened');

  // The card itself offers the same control, on the same chain.
  await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.textContent==='Read subject details').click()`); await sleep(400);
  check('the subject card offers the same control', await evaluate(`!!document.querySelector('#details-body button.chain-open')`));
  await evaluate(`document.querySelector('#details-body button.chain-open').click()`); await sleep(400);
  check('opening it from the card shows the same chain', await chainOpen() && (await rows()).length === expectedChain.length);
  await key('Escape'); await sleep(300);
  check('closing the list returns to the card it was opened from', await evaluate(`!!document.getElementById('details-dialog').open`));
  await click('#details-close', 300);

  if (process.env.SSS_V3_MAP) {
    // A real, deep chain: I02 rests on 249 entries in the robotics curriculum.
    const v3 = path.resolve(process.env.SSS_V3_MAP), copy = path.join(app.dir, 'robotics-v3.json');
    writeFileSync(copy, readFileSync(v3));
    const data = JSON.parse(readFileSync(copy, 'utf8'));
    const milestone = data.nodes.find(n => n.id === 'rob3:I02');
    const real = prerequisiteChain(data, 'rob3:I02'), realSummary = chainSummary(real);
    await open(copy);
    await selectByName(milestone.name);
    await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.textContent.startsWith('Mark proficient on all prerequisite skills')).click()`); await sleep(900);
    check('a 248-entry chain lists every entry', (await rows()).length === realSummary.total, `${realSummary.total} entries, ${realSummary.depth} steps deep`);
    check('the long list scrolls inside the dialog', await evaluate(`(()=>{const d=document.getElementById('chain-dialog');d.scrollTop=d.scrollHeight;return d.scrollHeight>d.clientHeight&&d.scrollTop>0})()`));
    check('the action stays reachable at the bottom of a long list', await evaluate(`(()=>{const r=document.getElementById('chain-apply').getBoundingClientRect();return r.top>0&&r.bottom<=innerHeight+1})()`));
    check('it counts the whole chain and marks none of it yet', (await action()).text === `Mark ${realSummary.total} skills Yes` && await answerOf('rob3:m-trig') === null, (await action()).text);
    await keep('04-robotics-i02-chain');
    await key('Escape'); await sleep(300);
    check('leaving the long list writes nothing', await evaluate(`JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.every(n=>n.proficiency80===null)`));
  }

  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} prerequisite-chain checks passed.`);
} finally { await app.stop(); }
