// Checks the master + Robotics V3 merge (authoring/merge/merge.mjs). Runs on a small synthetic pair
// of maps so it works anywhere; when the real maps are present locally it also builds the real
// merge, read-only, and checks its gates and counts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { merge, gates, plan, arrangeMerged, FAMILY, DATASET_KEY, S7_BRANCH } from '../authoring/merge/merge.mjs';
import { validate } from '../src/model.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const node = (id, extra = {}) => ({ id, name: `Skill ${id}`, domain: 'Robotics', description: `About ${id}.`, details: `Master text for ${id}.`, position: [0, 0, 0], pinned: false, proficiency80: null, ...extra });
const edge = (source, target, type = 'prerequisite') => ({ source, target, type });
const lesson = id => ({ id, explanation: `Lesson for ${id}.` });

// Master: two plain skills (one answered Yes, one answered Yes but cleared by JC), a shared skill,
// the same-ability skill, two overviews (one retired, one kept) and a skill an overview feeds.
const masterMap = () => validate({
  schemaVersion: 1, title: 'Master', metadata: { datasetId: 'sss-robotics-foundations-2026-09', keep: 'me' }, layout: { type: 'vortex' },
  nodes: [node('m-a', { proficiency80: true }), node('m-b', { proficiency80: true }), node('m-shared', { name: 'Old name' }),
    node('e-current'), node('r-over'), node('r-kept'), node('c-after'), node('sss-step')],
  edges: [edge('m-a', 'm-shared'), edge('m-b', 'm-shared'), edge('m-a', 'r-over'), edge('r-over', 'c-after'), edge('r-over', 'r-kept'),
    edge('r-over', 'sss-step', 'related'), edge('m-a', 'e-current')]
});
const v3node = (id, extra = {}) => node(`rob3:${id}`, { planningId: id, nodeKind: 'outcome', feedsMilestones: ['I01'], contentStatus: 'introductory lesson authored', lessonStatus: 'available', lessonCard: { card: id }, lesson: lesson(id), details: `V3 text for ${id}.`, ...extra });
const pending = id => { const n = v3node(id, { contentStatus: 'introductory lesson pending' }); delete n.lesson; delete n.lessonCard; return n; };
const v3Map = () => validate({
  schemaVersion: 1, title: 'V3', metadata: { atlasFamily: 'robotics-foundations-integration-v3-review' }, roboticsV3Preview: { entries: 12 },
  nodes: [v3node('m-shared', { name: 'New name' }), v3node('B-E02'), v3node('NEW'), v3node('X06', { nodeKind: 'milestone' }), v3node('B-D08', { subdomain: 'Mechanics' }),
    ...['K05', 'K06', 'K07', 'K08', 'K10', 'K11'].map(pending), { ...pending('I01'), nodeKind: 'milestone' }],
  edges: [edge('rob3:B-E02', 'rob3:m-shared'), edge('rob3:m-shared', 'rob3:NEW'), edge('rob3:NEW', 'rob3:I01'), edge('rob3:B-E02', 'rob3:NEW', 'supports'),
    edge('rob3:K05', 'rob3:K06'), edge('rob3:K06', 'rob3:K07'), edge('rob3:K08', 'rob3:K10'), edge('rob3:K10', 'rob3:K11')]
});

const fresh = ['NEW', 'X06', 'B-D08', 'K05', 'K06', 'K07', 'K08', 'K10', 'K11', 'I01'];
const crosswalk = (extra = {}) => ({
  status: 'APPROVED', approval: { by: 'JC', date: '2026-10-10', accepted: ['A1'] }, sources: { master: {}, v3: {} },
  newEntries: [{ planningId: 'B-E02', proposal: 'same-ability', masterId: 'e-current' }, ...fresh.map(planningId => ({ planningId, proposal: 'new' }))],
  overviews: [{ id: 'r-over', name: 'Overview', proposal: 'retire', covers: ['NEW'] }, { id: 'r-kept', name: 'Kept', proposal: 'keep as orientation' }],
  overviewEdges: {
    repointed: [{ replaces: { type: 'prerequisite', source: 'r-over', target: 'c-after' }, type: 'prerequisite', source: 'rob3:NEW', target: 'c-after', why: 'NEW takes over' }],
    carriedAsSupports: [{ source: 'm-a', overview: 'r-over', target: 'rob3:NEW', action: 'added as supports' }]
  },
  componentAndRelatedLinks: [{ type: 'prerequisite', source: 'sss-step', target: 'rob3:K05', reason: 'component' }, { type: 'related', source: 'm-b', target: 'rob3:NEW', reason: 'related' }],
  sharedIds: { name: [{ id: 'm-shared', proposal: 'V3', v3: 'New name' }], prerequisites: [{ id: 'm-shared', proposal: 'V3', removesMasterEdges: [{ type: 'prerequisite', source: 'm-b', target: 'm-shared' }] }] },
  answerCheck: { differences: [{ id: 'm-b', decision: { value: null } }] },
  ...extra
});
const build = (cw = crosswalk()) => merge(masterMap(), v3Map(), cw);
const ids = g => g.nodes.map(n => n.id);
const has = (g, s, t, type = 'prerequisite') => g.edges.some(e => e.source === s && e.target === t && e.type === type);

test('nothing is merged from a crosswalk JC has not approved', () => {
  assert.throws(() => build(crosswalk({ status: 'DRAFT' })), /not approved/);
  assert.throws(() => plan({ ...crosswalk(), approval: undefined }), /not approved/);
});

test('the master is the base: its skills stay in order, the overview retires and new V3 entries follow, unmarked', () => {
  const g = build();
  assert.deepEqual(ids(g).slice(0, 7), ['m-a', 'm-b', 'm-shared', 'e-current', 'r-kept', 'c-after', 'sss-step']);
  assert.ok(!ids(g).includes('r-over'));
  assert.ok(!ids(g).includes('rob3:B-E02'), 'a same-ability entry is not added');
  assert.deepEqual(ids(g).slice(7), fresh.map(id => `rob3:${id}`));
  assert.ok(g.nodes.slice(7).every(n => n.proficiency80 === null));
  assert.equal(g.metadata.atlasFamily, FAMILY);
  assert.equal(g.metadata.datasetKey, DATASET_KEY);
  assert.equal(g.metadata.keep, 'me', 'other master metadata is kept');
  assert.deepEqual(g.layout, { type: 'vortex' });
});

test('answers come only from the master, changed only where JC decided', () => {
  const g = build(), by = id => g.nodes.find(n => n.id === id);
  assert.equal(by('m-a').proficiency80, true);
  assert.equal(by('m-b').proficiency80, null, 'JC cleared this one in the crosswalk');
  assert.equal(by('m-shared').proficiency80, null, 'never taken from V3');
});

test('a shared skill takes V3 lesson fields, keeps its master text, and takes an approved rename', () => {
  const n = build().nodes.find(n => n.id === 'm-shared');
  assert.equal(n.name, 'New name');
  assert.equal(n.description, 'About m-shared.', 'the master description stays');
  assert.equal(n.details, 'V3 text for m-shared.');
  assert.equal(n.atlasDetails, 'Master text for m-shared.');
  assert.deepEqual(n.lesson, lesson('m-shared'));
  assert.equal(n.planningId, 'm-shared');
  assert.equal(n.contentStatus, 'introductory lesson authored');
});

test('a same-ability entry lands on the master skill and its connections follow it', () => {
  const g = build(), n = g.nodes.find(n => n.id === 'e-current');
  assert.equal(n.mergedFrom, 'rob3:B-E02');
  assert.equal(n.planningId, 'B-E02', 'the importer and evidence overrides still find it');
  assert.deepEqual(n.lesson, lesson('B-E02'));
  assert.ok(has(g, 'e-current', 'm-shared'));
  assert.ok(has(g, 'e-current', 'rob3:NEW', 'supports'));
});

test('connections: approved removal, re-pointing, carried supports, decision 10 and no duplicates', () => {
  const g = build();
  assert.ok(!has(g, 'm-b', 'm-shared'), 'the approved removal');
  assert.ok(has(g, 'm-a', 'm-shared'));
  assert.ok(has(g, 'rob3:NEW', 'c-after'), 're-pointed from the retired overview');
  assert.ok(!g.edges.some(e => e.source === 'r-over' || e.target === 'r-over'));
  assert.ok(has(g, 'm-a', 'rob3:NEW', 'supports'));
  assert.ok(has(g, 'sss-step', 'rob3:K05'), 'component link');
  for (const s of ['K05', 'K06', 'K07']) for (const t of ['K08', 'K10', 'K11']) assert.ok(has(g, `rob3:${s}`, `rob3:${t}`), `${s} before ${t}`);
  const keys = g.edges.map(e => JSON.stringify([e.type, e.source, e.target]));
  assert.equal(new Set(keys).size, keys.length);
});

test('decisions 7 and 12 are applied to the new entries', () => {
  const g = build();
  assert.equal(g.nodes.find(n => n.id === 'rob3:X06').nodeKind, 'outcome');
  assert.equal(g.nodes.find(n => n.id === 'rob3:B-D08').subdomain, S7_BRANCH);
});

test('a related link is skipped where the two skills are already connected', () => {
  const cw = crosswalk(); cw.componentAndRelatedLinks.push({ type: 'related', source: 'm-a', target: 'm-shared', reason: 'already linked' });
  const g = build(cw);
  assert.ok(!has(g, 'm-a', 'm-shared', 'related'));
  assert.equal(g.roboticsV3Merge.skippedEdges.pairAlreadyLinked, 1);
});

test('the gates pass on a good merge and catch every kind of damage', () => {
  const master = masterMap(), v3 = v3Map(), cw = crosswalk(), good = merge(master, v3, cw);
  assert.deepEqual(gates(master, v3, cw, good), []);
  const broken = change => { const g = structuredClone(good); change(g); return gates(master, v3, cw, g).join(' | '); };
  assert.match(broken(g => { g.nodes[0].proficiency80 = false; }), /Answer changed on m-a/);
  assert.match(broken(g => { g.nodes.find(n => n.id === 'rob3:NEW').proficiency80 = true; }), /New skill rob3:NEW has an answer/);
  assert.match(broken(g => { g.edges = g.edges.filter(e => !(e.source === 'm-a' && e.target === 'm-shared')); }), /Master connection lost/);
  assert.match(broken(g => { g.edges = g.edges.filter(e => !(e.source === 'rob3:K05' && e.target === 'rob3:K06')); }), /V3 connection lost/);
  assert.match(broken(g => { g.nodes.find(n => n.id === 'rob3:NEW').lesson.explanation = 'edited'; }), /Lesson not carried for rob3:NEW/);
  assert.match(broken(g => { g.edges = g.edges.filter(e => !(e.source === 'rob3:NEW' && e.target === 'rob3:I01')); }), /Milestone I01 lost/);
  assert.match(broken(g => { g.edges.push(edge('rob3:I01', 'm-a')); }), /would refuse the map/);
  assert.match(broken(g => { g.nodes = g.nodes.filter(n => n.id !== 'c-after'); g.edges = g.edges.filter(e => e.target !== 'c-after'); }), /Master skill c-after is missing/);
  assert.match(broken(g => { g.metadata.atlasFamily = 'other'; }), /atlasFamily/);
});

test('building twice gives identical bytes', () => {
  assert.equal(JSON.stringify(build()), JSON.stringify(build()));
});

test('levels are recalculated from the merged graph, a pinned skill stays put, and the gates still pass', () => {
  const master = masterMap(), v3 = v3Map(), cw = crosswalk(), merged = merge(master, v3, cw);
  merged.nodes.find(n => n.id === 'm-a').pinned = true; merged.nodes.find(n => n.id === 'm-a').position = [5, 6, 7];
  const { graph, report } = arrangeMerged(merged, master, v3, cw);
  assert.deepEqual(gates(master, v3, cw, graph), []);
  assert.deepEqual(graph.nodes.find(n => n.id === 'm-a').position, [5, 6, 7]);
  const level = id => graph.nodes.find(n => n.id === id).skillLevel;
  assert.ok(level('rob3:NEW') > level('m-shared') && level('m-shared') > level('m-a'), 'levels follow prerequisites');
  assert.equal(report.pinned, 1);
  assert.equal(graph.roboticsV3Merge.levels, report);
});

const REAL = ['Maps/Skill-Solar-System.json', 'Maps/Robotics-v3/Robotics-v3-Lessons.json', 'scope/merge/crosswalk.json'].map(f => path.join(ROOT, f));
test('the real merge passes every gate with the approved counts', { skip: REAL.every(existsSync) ? false : 'the real maps are not present' }, () => {
  const [master, v3, cw] = REAL.map(f => JSON.parse(readFileSync(f, 'utf8')));
  const g = arrangeMerged(merge(master, v3, cw), master, v3, cw).graph;
  assert.deepEqual(gates(master, v3, cw, g), []);
  assert.ok(Math.max(...g.nodes.map(n => n.skillLevel)) <= 100);
  assert.equal(g.nodes.length, 1918);
  assert.equal(g.nodes.filter(n => n.proficiency80 != null).length, 308);
  assert.equal(g.nodes.filter(n => n.lesson).length, 298);
  assert.ok(g.nodes.some(n => n.id === 'r-singular'));
  assert.ok(!g.nodes.some(n => n.id === 'r-forward'));
});

test('the lesson importer finds V3 entries on the merged atlas by planning id and leaves master skills alone', async () => {
  const { applyLessons, contractHash, STATUS } = await import('../authoring/robotics-v3/lessons.mjs');
  const specNode = (id, name) => ({ id, name, requires: [], demonstration: `Show ${id}.`, kind: 'foundation', scope_contract: {}, runtime_identity: { proposed_id: `rob3:${id}` } });
  const spec = { nodes: [specNode('m-shared', 'New name'), specNode('B-E02', 'Interpret current'), specNode('NEW', 'Skill rob3:NEW')] };
  const lessonFor = s => ({ id: s.id, name: s.name, proposed_runtime_id: `rob3:${s.id}`, requires: [], details: `Card ${s.id}.`, placement_note: `Note ${s.id}.`, proficiency_write: false, node_contract_sha256: contractHash(s) });
  const editions = [{ metadata: { edition: 'e1', authored: '2026-09-18' }, lessons: spec.nodes.map(lessonFor) }];
  const atlas = build();
  for (const n of atlas.nodes) { delete n.lesson; delete n.lessonCard; }
  const { graph, report } = applyLessons(atlas, { spec, editions, merged: true });
  assert.equal(report.conflicted.length, 0, JSON.stringify(report.conflicted));
  assert.equal(graph.title, atlas.title, 'the atlas keeps its title');
  assert.equal(graph.metadata.datasetKey, DATASET_KEY);
  const by = id => graph.nodes.find(n => n.id === id);
  assert.equal(by('m-shared').lesson.id, 'm-shared');
  assert.equal(by('e-current').lesson.id, 'B-E02', 'the approved same-ability skill keeps its master name and still takes the card');
  assert.equal(by('rob3:NEW').contentStatus, STATUS.authored);
  assert.deepEqual(by('m-a'), atlas.nodes.find(n => n.id === 'm-a'), 'a master skill outside V3 is untouched');
  assert.equal(report.counts.plannedEntries, atlas.nodes.filter(n => n.planningId).length);
  const again = applyLessons(graph, { spec, editions, merged: true }).graph;
  assert.equal(JSON.stringify(again), JSON.stringify(graph), 're-applying changes nothing');
});
