// Checks for the Material Behavior batch and the integration that adds it to an atlas. Runs against
// a generated stand-in atlas; set SSS_ATLAS (and optionally SSS_MAT_SUBMAP and SSS_ATLAS_BACKUP, the
// master as it was before integration) to also check the real local maps, read-only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeMaterialBehavior, materialSubmap, clearance, loadBatch, edgeKey, normalizeName, EXPANSION, EXPANSION_KEY } from '../authoring/material-behavior/merge.mjs';
import { validate, levels } from '../src/model.js';
import { ICONS } from '../src/icons.js';
import { atlasFamily, emptyRecord, recordAnswers, reconcile, diffProficiency } from '../src/proficiency.js';

const batch = loadBatch();
const ids = new Set(batch.nodes.map(n => n.id));
const external = [...new Set(batch.edges.flatMap(e => [e.source, e.target]).filter(id => !ids.has(id)))].sort();
const domainOf = id => ({ m: 'Mathematics', e: 'Electronics', p: 'Physics', r: 'Robotics', s: 'Mechanics', c: 'Computing' })[id[0]];
const SUBDOMAIN = 'Material behavior and tensile testing';
// The broad topics the package says to retain. Overlap with them is recorded as related links.
const OVERVIEWS = ['s-stress', 's-strain', 's-elastic', 's-axial', 's-tensile', 's-select'];
// A stand-in atlas holding every skill the batch connects to, plus answers and a pin to protect.
const standIn = () => validate({
  schemaVersion: 1, title: 'Stand-in atlas', metadata: { datasetId: 'sss-robotics-foundations-2026-09' }, levelModel: { usedRange: [1, 64] },
  nodes: external.map((id, i) => ({ id, name: `Existing ${id}`, domain: domainOf(id), description: 'Existing skill.', details: '', position: [400 + i * 70, 40 * 64, i ? -i * 35 : 0], pinned: id === 's-select', proficiency80: id === 's-elastic' ? true : id === 's-plastic' ? false : null, icon: 'layers', layoutMode: 'vortex', placementNote: 'kept', skillLevel: id === 'm-ratio' ? 30 : 40 })),
  edges: [{ source: 'm-ratio', target: 'm-slope', type: 'prerequisite', rationale: 'Existing.' }]
});

test('the batch is content only: no positions, levels, or answers, and every record is complete', () => {
  assert.equal(batch.nodes.length, 10);
  assert.equal(batch.edges.length, 32);
  for (const record of batch.nodes) {
    assert.match(record.id, /^sss-mat-[a-z0-9-]+$/);
    assert.equal(record.domain, 'Mechanics', `${record.id} must stay in the existing Mechanics domain`);
    assert.equal(record.subdomain, SUBDOMAIN, record.id);
    assert.equal(record.icon, 'layers');
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
  assert.deepEqual(batch.edges.reduce((t, e) => (t[e.type] = (t[e.type] || 0) + 1, t), {}), { prerequisite: 21, related: 9, supports: 2 });
});

test('the batch states it is not an openable map and needs no other batch first', () => {
  assert.equal(batch.integration.notAnOpenMapFile, true);
  assert.deepEqual(batch.integration.requiredContentBatches, []);
  assert.equal(batch.integration.preserveExistingNodes, true);
  assert.equal(batch.integration.newProficiency, null);
});

test('scope overlap with the retained overviews is recorded as related links only', () => {
  const related = batch.edges.filter(e => e.type === 'related');
  assert.equal(related.length, 9);
  for (const edge of related) {
    assert.ok(OVERVIEWS.includes(edge.source), `${edge.source} is not one of the retained overviews`);
    assert.ok(ids.has(edge.target), `${edge.target} should be a new skill`);
    assert.ok(!batch.edges.some(e => e.type === 'prerequisite' && e.source === edge.source && e.target === edge.target), `${edge.source} → ${edge.target} must not also be a prerequisite`);
  }
  // Nine of the ten overlap a named overview; the residual-strain calculation reaches its topic
  // through prerequisites instead, so it is deliberately not given an overlap link.
  const covered = new Set(related.map(e => e.target));
  assert.equal(covered.size, 9);
  assert.ok(!covered.has('sss-mat-permanent-set'));
});

test('supports and related links never add prerequisite depth', () => {
  const { graph } = mergeMaterialBehavior(standIn());
  const depth = levels(graph);
  const prerequisiteOnly = levels({ ...graph, edges: graph.edges.filter(e => e.type === 'prerequisite') });
  for (const node of graph.nodes) assert.equal(depth.get(node.id), prerequisiteOnly.get(node.id), `${node.id} depth changed`);
});

test('merging preserves every existing skill, answer, pin, coordinate, and edge exactly', () => {
  const atlas = standIn(), before = JSON.parse(JSON.stringify(atlas));
  const { graph, report } = mergeMaterialBehavior(atlas);
  assert.deepEqual(atlas, before, 'the input is not modified');
  assert.equal(report.added.length, 10);
  assert.deepEqual(report.nameConflicts, []);
  assert.deepEqual(report.levelConflicts, []);
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  for (const node of before.nodes) assert.deepEqual(byId.get(node.id), node, `${node.id} changed`);
  assert.deepEqual(graph.edges.slice(0, before.edges.length), before.edges);
  assert.equal(graph.edges.length, before.edges.length + 32);
  assert.equal(graph.nodes.length, before.nodes.length + 10);
});

test('new skills arrive unmarked, levelled above their prerequisites, and placed without overlap', () => {
  const { graph, report } = mergeMaterialBehavior(standIn());
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const depth = levels(graph);
  for (const id of report.added) {
    const node = byId.get(id);
    assert.equal(node.proficiency80, null); assert.equal(node.pinned, false); assert.equal(node.layoutMode, 'vortex');
    assert.equal(node.position[1], (node.skillLevel - 1) * 64, `${id} height matches its level`);
    assert.ok(node.skillLevel >= 1 + 3 * depth.get(id), `${id} level below 1 + 3 × depth`);
    assert.ok(!('layoutRequest' in node), `${id} must not carry the authoring layout request`);
    assert.ok(node.proficiencyReference && node.scopeNote && node.referenceURLs.length, `${id} keeps its authored metadata`);
    assert.equal(node.domain, 'Mechanics');
  }
  for (const e of graph.edges) if (e.type === 'prerequisite') assert.ok(byId.get(e.source).skillLevel < byId.get(e.target).skillLevel, `${e.source} → ${e.target} does not ascend`);
  assert.ok(clearance(graph, report.added).distance > 40, `nearest ${JSON.stringify(clearance(graph, report.added))}`);
  assert.equal(graph[EXPANSION_KEY].edition, EXPANSION.edition);
  assert.ok(graph[EXPANSION_KEY].sources && graph[EXPANSION_KEY].deferred.length === 7);
});

test('the earlier expansion records are left alone and each keeps its own key', () => {
  const atlas = standIn();
  atlas.physicsExpansion = { edition: '1.0', addedSkills: 99 };
  atlas.dcCircuitsExpansion = { edition: 'dc-circuits-batch-01' };
  atlas.physicsFoundationsExpansion = { edition: 'physics-foundations-batch-01' };
  const { graph } = mergeMaterialBehavior(atlas);
  assert.deepEqual(graph.physicsExpansion, { edition: '1.0', addedSkills: 99 });
  assert.deepEqual(graph.dcCircuitsExpansion, { edition: 'dc-circuits-batch-01' });
  assert.deepEqual(graph.physicsFoundationsExpansion, { edition: 'physics-foundations-batch-01' });
  assert.ok(!['physicsExpansion', 'dcCircuitsExpansion', 'physicsFoundationsExpansion'].includes(EXPANSION_KEY));
});

test('applying the batch twice changes nothing and keeps answers given in between', () => {
  const once = mergeMaterialBehavior(standIn()).graph;
  const twice = mergeMaterialBehavior(once).graph;
  assert.deepEqual(twice, once);
  assert.equal(mergeMaterialBehavior(once).report.added.length, 0);
  assert.equal(mergeMaterialBehavior(once).report.duplicates.length, 32);
  const answered = { ...once, nodes: once.nodes.map(n => n.id === 'sss-mat-proof-stress' ? { ...n, proficiency80: true } : n) };
  const again = mergeMaterialBehavior(answered).graph;
  assert.equal(again.nodes.find(n => n.id === 'sss-mat-proof-stress').proficiency80, true);
  assert.deepEqual(again.nodes.find(n => n.id === 'sss-mat-proof-stress').position, once.nodes.find(n => n.id === 'sss-mat-proof-stress').position);
});

test('a name already used by a different skill is refused rather than overwritten', () => {
  const clash = standIn();
  clash.nodes.push({ ...clash.nodes[0], id: 's-somethingelse', name: batch.nodes[0].name });
  assert.throws(() => mergeMaterialBehavior(clash), /Names already used/);
});

test('a connection to a skill the atlas does not have is refused', () => {
  const thin = standIn();
  thin.nodes = thin.nodes.filter(n => n.id !== 's-tensile');
  thin.edges = [];
  assert.throws(() => mergeMaterialBehavior(thin), /points to missing skill s-tensile/);
});

test('the sub-map holds every new skill with its full prerequisite ancestry, copied from the master', () => {
  const master = mergeMaterialBehavior(standIn()).graph, sub = materialSubmap(master);
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

test('an answer given in the sub-map reaches the master, and no overview answer is copied', () => {
  const master = mergeMaterialBehavior(standIn()).graph, sub = materialSubmap(master), family = atlasFamily(master);
  const marked = { ...sub, nodes: sub.nodes.map(n => n.id === 'sss-mat-engineering-stress' ? { ...n, proficiency80: true } : n) };
  const record = recordAnswers(emptyRecord(family), diffProficiency(sub, marked), { source: 'console', map: sub.title, now: '2026-09-13T00:00:00Z' });
  const { graph } = reconcile(master, record);
  assert.equal(graph.nodes.find(n => n.id === 'sss-mat-engineering-stress').proficiency80, true);
  // The overviews keep their own answers, and a Yes on one never marks the narrower skills.
  assert.equal(graph.nodes.find(n => n.id === 's-elastic').proficiency80, true);
  assert.equal(graph.nodes.find(n => n.id === 's-plastic').proficiency80, false);
  for (const id of ['sss-mat-modulus-slope', 'sss-mat-proof-stress', 'sss-mat-permanent-set']) assert.equal(graph.nodes.find(n => n.id === id).proficiency80, null);
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
    assert.equal(node.domain, 'Mechanics');
    assert.equal(node.subdomain, SUBDOMAIN);
    assert.ok(!('layoutRequest' in node));
  }
  const masterEdges = new Set(master.edges.map(edgeKey));
  for (const e of batch.edges) assert.ok(masterEdges.has(edgeKey(e)), `missing ${edgeKey(e)}`);
  for (const e of master.edges) if (e.type === 'prerequisite') assert.ok(byId.get(e.source).skillLevel < byId.get(e.target).skillLevel, `${e.source} → ${e.target}`);
  // The batches integrated before this one are still intact.
  assert.equal(master.nodes.filter(n => n.authoringOrigin === 'sss-dc-batch-01').length, 26, 'all 26 DC skills remain');
  assert.equal(master.nodes.filter(n => n.authoringOrigin === 'sss-physics-foundations-batch-01').length, 19, 'all 19 Physics skills remain');
  assert.ok(master.dcCircuitsExpansion?.sources && master.physicsFoundationsExpansion?.sources);
  if (process.env.SSS_ATLAS_BACKUP) {
    const before = JSON.parse(readFileSync(process.env.SSS_ATLAS_BACKUP, 'utf8'));
    for (const node of before.nodes) assert.deepEqual(byId.get(node.id), node, `${node.id} changed`);
    assert.deepEqual(master.edges.slice(0, before.edges.length), before.edges);
    assert.equal(master.title, before.title);
    assert.deepEqual(master.metadata, before.metadata);
    assert.deepEqual(master.physicsExpansion, before.physicsExpansion, 'the earlier Physics expansion record is unchanged');
    assert.equal(before.nodes.filter(n => n.proficiency80 != null).length, master.nodes.filter(n => n.proficiency80 != null).length, 'no answer was added or lost');
    // SSS_ATLAS_BACKUP is one shared setting, so it may name any earlier snapshot. Only a snapshot
    // taken before this batch has to be smaller than the master by this batch's own size; one taken
    // after already contains these skills. Either way the master never shrinks, and every skill of
    // this batch is checked for above.
    const predatesBatch = !before.nodes.some(n => ids.has(n.id));
    assert.ok(master.nodes.length >= before.nodes.length + (predatesBatch ? 10 : 0), `${master.nodes.length} nodes against ${before.nodes.length} before`);
    assert.ok(master.edges.length >= before.edges.length + (predatesBatch ? 32 : 0), `${master.edges.length} edges against ${before.edges.length} before`);
  }
  if (process.env.SSS_MAT_SUBMAP) {
    const sub = validate(JSON.parse(readFileSync(process.env.SSS_MAT_SUBMAP, 'utf8')));
    const fresh = materialSubmap(master);
    const answerless = nodes => nodes.map(n => ({ ...n, proficiency80: null }));
    // The skills and connections are the sub-map's contract and must match a fresh derivation
    // exactly. Top-level records may legitimately differ: a later batch adds its own expansion key
    // to the master after this file was written.
    assert.deepEqual(answerless(sub.nodes), answerless(fresh.nodes), 'sub-map skills match a fresh derivation, apart from answers');
    assert.deepEqual(sub.edges, fresh.edges, 'sub-map connections match a fresh derivation');
    assert.equal(sub.title, fresh.title);
    assert.equal(atlasFamily(sub), atlasFamily(master));
    assert.notEqual(sub.title, master.title);
    for (const key of Object.keys(sub)) assert.ok(Object.hasOwn(master, key), `the sub-map carries ${key}, which the master does not`);
  }
});
