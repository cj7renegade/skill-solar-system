// Checks for the Physics Foundations batch and the integration that adds it to an atlas. Runs
// against a generated stand-in atlas; set SSS_ATLAS (and optionally SSS_PHYS_SUBMAP and
// SSS_ATLAS_BACKUP, the master as it was before integration) to also check the real local maps,
// read-only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergePhysicsFoundations, physicsSubmap, clearance, loadBatch, edgeKey, normalizeName, EXPANSION, EXPANSION_KEY } from '../authoring/physics-foundations/merge.mjs';
import { validate, levels } from '../src/model.js';
import { ICONS } from '../src/icons.js';
import { atlasFamily, emptyRecord, recordAnswers, reconcile, diffProficiency } from '../src/proficiency.js';

const batch = loadBatch();
const ids = new Set(batch.nodes.map(n => n.id));
const external = [...new Set(batch.edges.flatMap(e => [e.source, e.target]).filter(id => !ids.has(id)))].sort();
const domainOf = id => ({ m: 'Mathematics', e: 'Electronics', p: 'Physics', r: 'Robotics', s: 'Mechanics', c: 'Computing' })[id[0]];
const SUBDOMAINS = ['Motion interpretation', 'Motion graphs', 'Motion models', 'Free-fall interpretation', 'Force interpretation', 'Force models', 'Force equations'];
// A stand-in atlas holding every skill the batch connects to, plus answers and a pin to protect.
const standIn = () => validate({
  schemaVersion: 1, title: 'Stand-in atlas', metadata: { datasetId: 'sss-robotics-foundations-2026-09' }, levelModel: { usedRange: [1, 64] },
  nodes: external.map((id, i) => ({ id, name: `Existing ${id}`, domain: domainOf(id), description: 'Existing skill.', details: '', position: [400 + i * 70, 40 * 64, i ? -i * 35 : 0], pinned: id === 'p-weight', proficiency80: id === 'p-accel' ? true : id === 'p-fbd' ? false : null, icon: 'motion', layoutMode: 'vortex', placementNote: 'kept', skillLevel: id === 'm-add' ? 30 : 40 })),
  edges: [{ source: 'm-add', target: 'm-ratio', type: 'prerequisite', rationale: 'Existing.' }]
});

test('the batch is content only: no positions, levels, or answers, and every record is complete', () => {
  assert.equal(batch.nodes.length, 19);
  assert.equal(batch.edges.length, 61);
  for (const record of batch.nodes) {
    assert.match(record.id, /^sss-phys-[a-z0-9-]+$/);
    assert.equal(record.domain, 'Physics');
    assert.ok(SUBDOMAINS.includes(record.subdomain), `${record.id} subdomain ${record.subdomain}`);
    assert.ok(Object.hasOwn(ICONS, record.icon), `${record.id} icon ${record.icon}`);
    assert.equal(record.proficiency80, null, `${record.id} must arrive unmarked`);
    assert.ok(!('position' in record) && !('skillLevel' in record), `${record.id} must not carry layout`);
    const paragraphs = record.details.split('\n\n');
    assert.equal(paragraphs.length, 2, record.id);
    for (const p of paragraphs) assert.ok(p.split(/\s+/).length >= 25, record.id);
    assert.ok(record.description.length > 40 && record.placementNote.split('. ').length <= 2, record.id);
    assert.ok(record.proficiencyReference?.length > 20 && record.sourceRefs.length, record.id);
    for (const key of record.sourceRefs) assert.ok(batch.sources[key], `${record.id} cites unknown ${key}`);
  }
  const names = batch.nodes.map(n => normalizeName(n.name));
  assert.equal(new Set(names).size, names.length);
  assert.equal(new Set(batch.edges.map(edgeKey)).size, batch.edges.length, 'no duplicate or reversed-related edges');
  for (const e of batch.edges) assert.ok(e.rationale.length > 30 && ['prerequisite', 'supports', 'related'].includes(e.type));
  const types = batch.edges.reduce((t, e) => (t[e.type] = (t[e.type] || 0) + 1, t), {});
  assert.deepEqual(types, { prerequisite: 38, supports: 4, related: 19 });
});

test('the batch states it is not an openable map and needs no other batch first', () => {
  assert.equal(batch.integration.notAnOpenMapFile, true);
  assert.deepEqual(batch.integration.requiredContentBatches, []);
  assert.equal(batch.integration.doNotModifyExistingNodes, true);
  assert.equal(batch.integration.doNotCopyOverviewProficiency, true);
  assert.equal(batch.integration.defaultNewProficiency, null);
});

// Three overviews are also a genuine prerequisite of the narrower ability they overlap. The batch
// records both links on purpose: the related link states the scope overlap, the prerequisite states
// the learning order. Neither one ever transfers an answer.
const ALSO_PREREQUISITE = ['p-fbd|sss-phys-force-diagram-audit', 'p-freefall|sss-phys-freefall-apex', 'p-inertia|sss-phys-zero-net-motion'];

test('every overview keeps its own scope, and every overlap is recorded as a related link', () => {
  const mapped = new Set(), dual = [];
  for (const mapping of batch.overviewMappings) {
    assert.equal(mapping.action, 'retain-unchanged');
    for (const narrow of mapping.narrowerSkillIds) {
      mapped.add(narrow);
      const pair = e => (e.source === mapping.id && e.target === narrow) || (e.target === mapping.id && e.source === narrow);
      assert.ok(batch.edges.some(e => e.type === 'related' && pair(e)), `${mapping.id} → ${narrow} should be a related link`);
      if (batch.edges.some(e => e.type === 'prerequisite' && pair(e))) {
        dual.push(`${mapping.id}|${narrow}`);
        // An overview that is also a prerequisite must point at the narrower skill, so the narrower
        // skill ranks above it rather than being pulled below it.
        assert.ok(batch.edges.some(e => e.type === 'prerequisite' && e.source === mapping.id && e.target === narrow), `${mapping.id} → ${narrow} runs the wrong way`);
      }
    }
  }
  assert.equal(mapped.size, 19, 'every new skill is mapped to the overview it overlaps');
  assert.deepEqual(dual.sort(), ALSO_PREREQUISITE, 'only the recorded overviews double as a prerequisite');
});

test('supports and related links never add prerequisite depth', () => {
  const { graph } = mergePhysicsFoundations(standIn());
  const depth = levels(graph);
  const prerequisiteOnly = levels({ ...graph, edges: graph.edges.filter(e => e.type === 'prerequisite') });
  for (const node of graph.nodes) assert.equal(depth.get(node.id), prerequisiteOnly.get(node.id), `${node.id} depth changed`);
});

test('merging preserves every existing skill, answer, pin, coordinate, and edge exactly', () => {
  const atlas = standIn(), before = JSON.parse(JSON.stringify(atlas));
  const { graph, report } = mergePhysicsFoundations(atlas);
  assert.deepEqual(atlas, before, 'the input is not modified');
  assert.equal(report.added.length, 19);
  assert.deepEqual(report.nameConflicts, []);
  assert.deepEqual(report.levelConflicts, []);
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  for (const node of before.nodes) assert.deepEqual(byId.get(node.id), node, `${node.id} changed`);
  assert.deepEqual(graph.edges.slice(0, before.edges.length), before.edges);
  assert.equal(graph.edges.length, before.edges.length + 61);
  assert.equal(graph.nodes.length, before.nodes.length + 19);
});

test('new skills arrive unmarked, levelled above their prerequisites, and placed without overlap', () => {
  const { graph, report } = mergePhysicsFoundations(standIn());
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const depth = levels(graph);
  for (const id of report.added) {
    const node = byId.get(id);
    assert.equal(node.proficiency80, null); assert.equal(node.pinned, false); assert.equal(node.layoutMode, 'vortex');
    assert.equal(node.position[1], (node.skillLevel - 1) * 64, `${id} height matches its level`);
    assert.ok(node.skillLevel >= 1 + 3 * depth.get(id), `${id} level below 1 + 3 × depth`);
    assert.ok(!('layoutRequest' in node), `${id} must not carry the authoring layout request`);
    assert.ok(node.proficiencyReference && node.scopeNote && node.referenceURLs.length, `${id} keeps its authored metadata`);
    assert.equal(node.icon, 'motion');
  }
  for (const e of graph.edges) if (e.type === 'prerequisite') assert.ok(byId.get(e.source).skillLevel < byId.get(e.target).skillLevel, `${e.source} → ${e.target} does not ascend`);
  assert.ok(clearance(graph, report.added).distance > 40, `nearest ${JSON.stringify(clearance(graph, report.added))}`);
  assert.ok(graph[EXPANSION_KEY].sources && graph[EXPANSION_KEY].overviewMappings.length === 11);
  assert.equal(graph[EXPANSION_KEY].edition, EXPANSION.edition);
  assert.equal(graph[EXPANSION_KEY].deferred.length, 8);
});

test('the earlier Physics expansion record is left alone and keeps its own key', () => {
  const atlas = standIn();
  atlas.physicsExpansion = { edition: '1.0', addedSkills: 99 };
  const { graph } = mergePhysicsFoundations(atlas);
  assert.deepEqual(graph.physicsExpansion, { edition: '1.0', addedSkills: 99 });
  assert.notEqual(EXPANSION_KEY, 'physicsExpansion');
  assert.ok(graph[EXPANSION_KEY].relationToEarlierExpansion.includes('physicsExpansion'));
});

test('applying the batch twice changes nothing and keeps answers given in between', () => {
  const once = mergePhysicsFoundations(standIn()).graph;
  const twice = mergePhysicsFoundations(once).graph;
  assert.deepEqual(twice, once);
  assert.equal(mergePhysicsFoundations(once).report.added.length, 0);
  assert.equal(mergePhysicsFoundations(once).report.duplicates.length, 61);
  // An answer recorded after the first run survives a rerun.
  const answered = { ...once, nodes: once.nodes.map(n => n.id === 'sss-phys-mass-weight' ? { ...n, proficiency80: true } : n) };
  const again = mergePhysicsFoundations(answered).graph;
  assert.equal(again.nodes.find(n => n.id === 'sss-phys-mass-weight').proficiency80, true);
  assert.deepEqual(again.nodes.find(n => n.id === 'sss-phys-mass-weight').position, once.nodes.find(n => n.id === 'sss-phys-mass-weight').position);
});

test('a name already used by a different skill is refused rather than overwritten', () => {
  const clash = standIn();
  clash.nodes.push({ ...clash.nodes[0], id: 'p-somethingelse', name: batch.nodes[0].name });
  assert.throws(() => mergePhysicsFoundations(clash), /Names already used/);
});

test('a connection to a skill the atlas does not have is refused', () => {
  const thin = standIn();
  thin.nodes = thin.nodes.filter(n => n.id !== 'px-distance');
  thin.edges = [];
  assert.throws(() => mergePhysicsFoundations(thin), /points to missing skill px-distance/);
});

test('the sub-map holds every new skill with its full prerequisite ancestry, copied from the master', () => {
  const master = mergePhysicsFoundations(standIn()).graph, sub = physicsSubmap(master);
  const inMaster = new Map(master.nodes.map(n => [n.id, n])), inSub = new Set(sub.nodes.map(n => n.id));
  for (const node of sub.nodes) assert.deepEqual(node, inMaster.get(node.id));
  for (const id of ids) assert.ok(inSub.has(id), `${id} missing from the sub-map`);
  for (const e of master.edges) if (e.type === 'prerequisite' && inSub.has(e.target)) assert.ok(inSub.has(e.source), `closure misses ${e.source}`);
  const masterEdges = new Set(master.edges.map(edgeKey));
  for (const e of sub.edges) assert.ok(masterEdges.has(edgeKey(e)), 'no invented edges');
  assert.equal(sub.edges.length, master.edges.filter(e => inSub.has(e.source) && inSub.has(e.target)).length);
  assert.equal(atlasFamily(sub), atlasFamily(master));
  assert.notEqual(sub.title, master.title, 'the sub-map never poses as the master');
  assert.ok(sub[EXPANSION_KEY].sources, 'the sub-map carries the source definitions');
});

test('an answer given in the sub-map reaches the master through the shared record', () => {
  const master = mergePhysicsFoundations(standIn()).graph, sub = physicsSubmap(master), family = atlasFamily(master);
  const marked = { ...sub, nodes: sub.nodes.map(n => n.id === 'sss-phys-average-acceleration' ? { ...n, proficiency80: true } : n) };
  const record = recordAnswers(emptyRecord(family), diffProficiency(sub, marked), { source: 'console', map: sub.title, now: '2026-09-13T00:00:00Z' });
  const { graph } = reconcile(master, record);
  assert.equal(graph.nodes.find(n => n.id === 'sss-phys-average-acceleration').proficiency80, true);
  // An overview answer is never copied to the narrower skills, in either direction.
  assert.equal(graph.nodes.find(n => n.id === 'p-accel').proficiency80, true);
  for (const id of ['sss-phys-speed-change-signs', 'sss-phys-acceleration-graph-slope']) assert.equal(graph.nodes.find(n => n.id === id).proficiency80, null);
  assert.equal(graph.nodes.find(n => n.id === 'p-fbd').proficiency80, false, 'an existing No is kept');
});

// Optional: the real local maps, read only.
const atlasPath = process.env.SSS_ATLAS;
test('real atlas: the batch is present, consistent, and existing skills are preserved', { skip: !atlasPath && 'set SSS_ATLAS to check a local master atlas' }, () => {
  const master = validate(JSON.parse(readFileSync(atlasPath, 'utf8')));
  const byId = new Map(master.nodes.map(n => [n.id, n]));
  for (const record of batch.nodes) {
    const node = byId.get(record.id);
    assert.ok(node, `${record.id} missing`);
    assert.equal(node.details, record.details);
    assert.equal(node.description, record.description);
    assert.equal(node.domain, 'Physics');
    assert.equal(node.proficiencyReference, record.proficiencyReference);
    assert.ok(!('layoutRequest' in node));
  }
  const masterEdges = new Set(master.edges.map(edgeKey));
  for (const e of batch.edges) assert.ok(masterEdges.has(edgeKey(e)), `missing ${edgeKey(e)}`);
  for (const e of master.edges) if (e.type === 'prerequisite') assert.ok(byId.get(e.source).skillLevel < byId.get(e.target).skillLevel, `${e.source} → ${e.target}`);
  // The DC batch that was integrated before this one is still intact.
  assert.ok(master.dcCircuitsExpansion?.sources, 'the DC expansion record is still present');
  assert.equal(master.nodes.filter(n => n.authoringOrigin === 'sss-dc-batch-01').length, 26, 'all 26 DC skills remain');
  if (process.env.SSS_ATLAS_BACKUP) {
    const before = JSON.parse(readFileSync(process.env.SSS_ATLAS_BACKUP, 'utf8'));
    for (const node of before.nodes) assert.deepEqual(byId.get(node.id), node, `${node.id} changed`);
    assert.deepEqual(master.edges.slice(0, before.edges.length), before.edges);
    assert.equal(master.title, before.title);
    assert.deepEqual(master.metadata, before.metadata);
    assert.deepEqual(master.physicsExpansion, before.physicsExpansion, 'the earlier Physics expansion record is unchanged');
    assert.equal(before.nodes.filter(n => n.proficiency80 != null).length, master.nodes.filter(n => n.proficiency80 != null).length, 'no answer was added or lost');
    assert.equal(master.nodes.length, before.nodes.length + 19);
    assert.equal(master.edges.length, before.edges.length + 61);
  }
  if (process.env.SSS_PHYS_SUBMAP) {
    const sub = validate(JSON.parse(readFileSync(process.env.SSS_PHYS_SUBMAP, 'utf8')));
    const fresh = physicsSubmap(master);
    const answerless = nodes => nodes.map(n => ({ ...n, proficiency80: null }));
    // The skills and connections are the sub-map's contract and must match a fresh derivation
    // exactly. Top-level records may legitimately differ: integrating a later batch adds its own
    // expansion key to the master after this file was written, which never changes which skills
    // the sub-map holds.
    assert.deepEqual(answerless(sub.nodes), answerless(fresh.nodes), 'sub-map skills match a fresh derivation, apart from answers');
    assert.deepEqual(sub.edges, fresh.edges, 'sub-map connections match a fresh derivation');
    assert.equal(sub.title, fresh.title);
    assert.equal(atlasFamily(sub), atlasFamily(master));
    assert.notEqual(sub.title, master.title);
    for (const key of Object.keys(sub)) assert.ok(Object.hasOwn(master, key), `the sub-map carries ${key}, which the master does not`);
  }
});
