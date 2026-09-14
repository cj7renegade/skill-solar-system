// Checks for the DC Circuits batch and the integration that adds it to an atlas. Runs against a
// generated stand-in atlas; set SSS_ATLAS (and optionally SSS_DC_SUBMAP and SSS_ATLAS_BACKUP, the
// master as it was before integration) to also check the real local maps, read-only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeDcCircuits, dcSubmap, clearance, loadBatch, edgeKey, normalizeName, EXPANSION } from '../authoring/dc-circuits/merge.mjs';
import { validate, levels } from '../src/model.js';
import { ICONS } from '../src/icons.js';
import { atlasFamily, emptyRecord, recordAnswers, reconcile, diffProficiency } from '../src/proficiency.js';

const batch = loadBatch();
const ids = new Set(batch.nodes.map(n => n.id));
const external = [...new Set(batch.edges.flatMap(e => [e.source, e.target]).filter(id => !ids.has(id)))].sort();
const domainOf = id => ({ m: 'Mathematics', e: 'Electronics', p: 'Physics', r: 'Robotics', s: 'Mechanics', c: 'Computing' })[id[0]];
// A stand-in atlas holding every skill the batch connects to, plus answers and a pin to protect.
const standIn = () => validate({
  schemaVersion: 1, title: 'Stand-in atlas', metadata: { datasetId: 'sss-robotics-foundations-2026-09' }, levelModel: { usedRange: [1, 64] },
  nodes: external.map((id, i) => ({ id, name: `Existing ${id}`, domain: domainOf(id), description: 'Existing skill.', details: '', position: [400 + i * 70, 40 * 64, i ? -i * 35 : 0], pinned: id === 'e-multimeter', proficiency80: id === 'e-series' ? true : id === 'e-power' ? false : null, icon: 'circuit', layoutMode: 'vortex', placementNote: 'kept', skillLevel: id === 'm-add' ? 30 : 40 })),
  edges: [{ source: 'm-add', target: 'm-ratio', type: 'prerequisite', rationale: 'Existing.' }]
});

test('the batch is content only: no positions, levels, or answers, and every record is complete', () => {
  assert.equal(batch.nodes.length, 26);
  assert.equal(batch.edges.length, 84);
  for (const record of batch.nodes) {
    assert.match(record.id, /^sss-dc-[a-z0-9-]+$/);
    assert.equal(record.domain, 'Electronics');
    assert.ok(record.subdomain?.startsWith('DC '), record.id);
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
  assert.deepEqual(types, { prerequisite: 53, supports: 5, related: 26 });
});

test('every overview keeps its own scope: overlap is recorded as related links, never prerequisites', () => {
  const mapped = new Set();
  for (const mapping of batch.overviewMappings) {
    assert.equal(mapping.action, 'retain-unchanged');
    for (const narrow of mapping.narrowerSkillIds) {
      mapped.add(narrow);
      const link = batch.edges.find(e => e.type === 'related' && ((e.source === mapping.id && e.target === narrow) || (e.target === mapping.id && e.source === narrow)));
      assert.ok(link, `${mapping.id} → ${narrow} should be a related link`);
      assert.ok(!batch.edges.some(e => e.type === 'prerequisite' && ((e.source === mapping.id && e.target === narrow) || (e.target === mapping.id && e.source === narrow))), `${mapping.id} → ${narrow} must not be a prerequisite`);
    }
  }
  assert.equal(mapped.size, 26, 'every new skill is mapped to the overview it overlaps');
});

test('merging preserves every existing skill, answer, pin, coordinate, and edge exactly', () => {
  const atlas = standIn(), before = JSON.parse(JSON.stringify(atlas));
  const { graph, report } = mergeDcCircuits(atlas);
  assert.deepEqual(atlas, before, 'the input is not modified');
  assert.equal(report.added.length, 26);
  assert.deepEqual(report.nameConflicts, []);
  assert.deepEqual(report.levelConflicts, []);
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  for (const node of before.nodes) assert.deepEqual(byId.get(node.id), node, `${node.id} changed`);
  assert.deepEqual(graph.edges.slice(0, before.edges.length), before.edges);
  assert.equal(graph.edges.length, before.edges.length + 84);
  assert.equal(graph.nodes.length, before.nodes.length + 26);
});

test('new skills arrive unmarked, levelled above their prerequisites, and placed without overlap', () => {
  const { graph, report } = mergeDcCircuits(standIn());
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const depth = levels(graph);
  for (const id of report.added) {
    const node = byId.get(id);
    assert.equal(node.proficiency80, null); assert.equal(node.pinned, false); assert.equal(node.layoutMode, 'vortex');
    assert.equal(node.position[1], (node.skillLevel - 1) * 64, `${id} height matches its level`);
    assert.ok(node.skillLevel >= 1 + 3 * depth.get(id), `${id} level below 1 + 3 × depth`);
    assert.ok(!('layoutRequest' in node), `${id} must not carry the authoring layout request`);
    assert.ok(node.proficiencyReference && node.scopeNote && node.referenceURLs.length, `${id} keeps its authored metadata`);
  }
  for (const e of graph.edges) if (e.type === 'prerequisite') assert.ok(byId.get(e.source).skillLevel < byId.get(e.target).skillLevel, `${e.source} → ${e.target} does not ascend`);
  assert.ok(clearance(graph, report.added).distance > 40, `nearest ${JSON.stringify(clearance(graph, report.added))}`);
  assert.ok(graph.dcCircuitsExpansion.sources && graph.dcCircuitsExpansion.overviewMappings.length === 9);
  assert.equal(graph.dcCircuitsExpansion.edition, EXPANSION.edition);
});

test('applying the batch twice changes nothing and keeps answers given in between', () => {
  const once = mergeDcCircuits(standIn()).graph;
  const twice = mergeDcCircuits(once).graph;
  assert.deepEqual(twice, once);
  assert.equal(mergeDcCircuits(once).report.added.length, 0);
  // An answer recorded after the first run survives a rerun.
  const answered = { ...once, nodes: once.nodes.map(n => n.id === 'sss-dc-nodes' ? { ...n, proficiency80: true } : n) };
  const again = mergeDcCircuits(answered).graph;
  assert.equal(again.nodes.find(n => n.id === 'sss-dc-nodes').proficiency80, true);
  assert.deepEqual(again.nodes.find(n => n.id === 'sss-dc-nodes').position, once.nodes.find(n => n.id === 'sss-dc-nodes').position);
});

test('a name already used by a different skill is refused rather than overwritten', () => {
  const clash = standIn();
  clash.nodes.push({ ...clash.nodes[0], id: 'e-somethingelse', name: batch.nodes[0].name });
  assert.throws(() => mergeDcCircuits(clash), /Names already used/);
});

test('the sub-map holds every DC skill with its full prerequisite ancestry, copied from the master', () => {
  const master = mergeDcCircuits(standIn()).graph, sub = dcSubmap(master);
  const inMaster = new Map(master.nodes.map(n => [n.id, n])), inSub = new Set(sub.nodes.map(n => n.id));
  for (const node of sub.nodes) assert.deepEqual(node, inMaster.get(node.id));
  for (const id of ids) assert.ok(inSub.has(id), `${id} missing from the sub-map`);
  for (const e of master.edges) if (e.type === 'prerequisite' && inSub.has(e.target)) assert.ok(inSub.has(e.source), `closure misses ${e.source}`);
  const masterEdges = new Set(master.edges.map(edgeKey));
  for (const e of sub.edges) assert.ok(masterEdges.has(edgeKey(e)), 'no invented edges');
  assert.equal(sub.edges.length, master.edges.filter(e => inSub.has(e.source) && inSub.has(e.target)).length);
  assert.equal(atlasFamily(sub), atlasFamily(master));
  assert.ok(sub.dcCircuitsExpansion.sources, 'the sub-map carries the source definitions');
});

test('an answer given in the DC sub-map reaches the master through the shared record', () => {
  const master = mergeDcCircuits(standIn()).graph, sub = dcSubmap(master), family = atlasFamily(master);
  const marked = { ...sub, nodes: sub.nodes.map(n => n.id === 'sss-dc-ohm-calculation' ? { ...n, proficiency80: true } : n) };
  const record = recordAnswers(emptyRecord(family), diffProficiency(sub, marked), { source: 'console', map: sub.title, now: '2026-09-13T00:00:00Z' });
  const { graph } = reconcile(master, record);
  assert.equal(graph.nodes.find(n => n.id === 'sss-dc-ohm-calculation').proficiency80, true);
  // An overview answer is never copied to the narrower skills.
  assert.equal(graph.nodes.find(n => n.id === 'e-series').proficiency80, true);
  for (const id of ['sss-dc-series-topology', 'sss-dc-series-equivalent']) assert.equal(graph.nodes.find(n => n.id === id).proficiency80, null);
});

// Optional: the real local maps, read only.
const atlasPath = process.env.SSS_ATLAS;
test('real atlas: the DC batch is present, consistent, and existing skills are preserved', { skip: !atlasPath && 'set SSS_ATLAS to check a local master atlas' }, () => {
  const master = validate(JSON.parse(readFileSync(atlasPath, 'utf8')));
  const byId = new Map(master.nodes.map(n => [n.id, n]));
  for (const record of batch.nodes) {
    const node = byId.get(record.id);
    assert.ok(node, `${record.id} missing`);
    assert.equal(node.details, record.details);
    assert.equal(node.domain, 'Electronics');
    assert.ok(!('layoutRequest' in node));
  }
  const masterEdges = new Set(master.edges.map(edgeKey));
  for (const e of batch.edges) assert.ok(masterEdges.has(edgeKey(e)), `missing ${edgeKey(e)}`);
  for (const e of master.edges) if (e.type === 'prerequisite') assert.ok(byId.get(e.source).skillLevel < byId.get(e.target).skillLevel, `${e.source} → ${e.target}`);
  if (process.env.SSS_ATLAS_BACKUP) {
    const before = JSON.parse(readFileSync(process.env.SSS_ATLAS_BACKUP, 'utf8'));
    for (const node of before.nodes) assert.deepEqual(byId.get(node.id), node, `${node.id} changed`);
    assert.deepEqual(master.edges.slice(0, before.edges.length), before.edges);
    assert.equal(master.title, before.title);
    assert.deepEqual(master.metadata, before.metadata);
    assert.equal(before.nodes.filter(n => n.proficiency80 != null).length, master.nodes.filter(n => n.proficiency80 != null).length, 'no answer was added or lost');
  }
  if (process.env.SSS_DC_SUBMAP) {
    const sub = validate(JSON.parse(readFileSync(process.env.SSS_DC_SUBMAP, 'utf8')));
    const withoutAnswers = graph => ({ ...graph, nodes: graph.nodes.map(n => ({ ...n, proficiency80: null })) });
    assert.deepEqual(withoutAnswers(sub), withoutAnswers(dcSubmap(master)), 'sub-map matches a fresh derivation, apart from answers');
    assert.equal(atlasFamily(sub), atlasFamily(master));
  }
});
