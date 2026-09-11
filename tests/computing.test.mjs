// Checks for the authored Computing foundation edition (authoring/computing) and the merge that adds
// it to an atlas. Runs on a generated stand-in atlas; set SSS_ATLAS (and optionally SSS_SUBMAP and
// SSS_ATLAS_BACKUP, the master as it was before the merge) to also check real local maps, read-only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MODULES, CHECKLIST, BEYOND_CHECKLIST, REFERENCES, edition } from '../authoring/computing/index.mjs';
import { mergeComputing, computingSubmap, edgeKey, clearance } from '../authoring/computing/merge.mjs';
import { validate, levels, DOMAINS } from '../src/model.js';
import { ICONS } from '../src/icons.js';
import { atlasFamily, emptyRecord, recordAnswers, reconcile, diffProficiency } from '../src/proficiency.js';

const content = edition();
const ids = new Set(content.nodes.map(n => n.id));
const external = [...new Set(content.edges.flatMap(e => [e.source, e.target]).filter(id => !ids.has(id)))].sort();
const domainOf = id => ({ m: 'Mathematics', e: 'Electronics', r: 'Robotics', p: 'Physics', s: 'Mechanics' })[id[0]];
// A stand-in atlas holding every existing skill the edition connects to, plus one marked and one pinned skill.
const standIn = () => validate({ schemaVersion: 1, title: 'Stand-in atlas', metadata: { datasetId: 'sss-robotics-foundations-2026-09' }, levelModel: { usedRange: [1, 70] },
  nodes: external.map((id, i) => ({ id, name: `Existing ${id}`, domain: domainOf(id), description: 'Existing skill.', details: '', position: [i * 90, 640, i ? -i * 40 : 0], pinned: id === 'm-binary', proficiency80: id === 'm-logic' ? true : null, icon: 'function', layoutMode: 'vortex', placementNote: 'kept', skillLevel: id === 'm-set' ? 30 : 40 })),
  edges: [{ source: 'm-set', target: 'm-logic', type: 'prerequisite', rationale: 'Existing.' }] });
const sentences = text => text.split(/(?<=[.!?])\s+(?=[A-Z0-9"])/).map(s => s.trim()).filter(s => s.length >= 40);

test('skill ids are unique, namespaced, and stable', () => {
  const list = content.nodes.map(n => n.id);
  assert.equal(new Set(list).size, list.length, 'duplicate id');
  for (const id of list) assert.match(id, /^c-[a-z0-9]+(-[a-z0-9]+)*$/, id);
  // Renaming or removing an id breaks shared proficiency; add new ids to the snapshot deliberately.
  assert.deepEqual([...list].sort(), JSON.parse(readFileSync(new URL('./fixtures/computing-ids.json', import.meta.url), 'utf8')));
});

test('every skill has a name, subdomain, icon, summary, and one or two substantive paragraphs of its own', () => {
  for (const n of content.nodes) {
    assert.ok(n.name.length >= 5 && n.name.length <= 120, n.id);
    assert.ok(n.subdomain && n.domain === 'Computing', n.id);
    assert.ok(Object.hasOwn(ICONS, n.icon), `${n.id} icon ${n.icon}`);
    assert.ok(n.description.length >= 60 && n.description.length <= 260, `${n.id} summary length ${n.description.length}`);
    assert.ok(!n.description.toLowerCase().startsWith(n.name.toLowerCase()), `${n.id} summary restates the title`);
    const paragraphs = n.details.split(/\n\n/);
    assert.ok(paragraphs.length >= 1 && paragraphs.length <= 2, `${n.id} has ${paragraphs.length} paragraphs`);
    for (const p of paragraphs) assert.ok(p.length >= 300, `${n.id} paragraph too short`);
    assert.ok(!n.details.toLowerCase().startsWith(n.name.toLowerCase()), `${n.id} details restate the title`);
    assert.match(n.details, /\b[Yy]ou (can|have)\b/, `${n.id} gives no self-check`);
    assert.ok(n.refs.length && n.refs.every(key => REFERENCES[key]), `${n.id} references`);
  }
});

test('no sentence is repeated across skills, so there is no shared boilerplate', () => {
  const seen = new Map();
  for (const n of content.nodes) for (const s of sentences(`${n.description} ${n.details}`)) {
    assert.ok(!seen.has(s) || seen.get(s) === n.id, `"${s}" appears in ${seen.get(s)} and ${n.id}`);
    seen.set(s, n.id);
  }
});

test('every connection is valid, typed, unique, and carries its own rationale', () => {
  const keys = new Set();
  for (const e of content.edges) {
    assert.ok(['prerequisite', 'supports', 'related'].includes(e.type));
    assert.notEqual(e.source, e.target);
    assert.ok(ids.has(e.source) || ids.has(e.target), 'each connection touches a Computing skill');
    assert.ok(e.rationale.length >= 25 && e.rationale.length <= 220, `${e.source} → ${e.target} rationale`);
    assert.ok(!keys.has(edgeKey(e)), `duplicate ${edgeKey(e)}`); keys.add(edgeKey(e));
  }
  for (const id of external) assert.ok(domainOf(id), `unknown external skill ${id}`);
  assert.equal(new Set(content.edges.map(e => e.rationale)).size, content.edges.length, 'rationales are written per connection');
});

test('elementary programming has no mathematics, physics, or other-domain prerequisites', () => {
  const merged = mergeComputing(standIn()).graph, incoming = new Map(merged.nodes.map(n => [n.id, []]));
  for (const e of merged.edges) if (e.type === 'prerequisite') incoming.get(e.target).push(e.source);
  const foundations = MODULES.find(m => m.subdomain === 'Programming foundations').nodes.map(n => n.id);
  for (const id of foundations) {
    const stack = [...incoming.get(id)], seen = new Set();
    while (stack.length) { const next = stack.pop(); if (seen.has(next)) continue; seen.add(next); assert.ok(ids.has(next), `${id} depends on ${next}`); stack.push(...incoming.get(next)); }
  }
});

test('the coverage checklist is complete and every authored skill is accounted for', () => {
  const covered = new Set();
  for (const [area, items] of Object.entries(CHECKLIST)) for (const [item, list] of Object.entries(items)) {
    assert.ok(list.length, `${area}: ${item} is not covered`);
    for (const id of list) { assert.ok(ids.has(id) || external.includes(id), `${area}: ${item} names missing ${id}`); covered.add(id); }
  }
  assert.equal(Object.keys(CHECKLIST).length, 9);
  for (const n of content.nodes) assert.ok(covered.has(n.id) || BEYOND_CHECKLIST.includes(n.id), `${n.id} is not in the checklist`);
});

test('merging keeps existing skills, pins, proficiency, and connections exactly, and places new skills by level', () => {
  const atlas = standIn(), before = JSON.parse(JSON.stringify(atlas));
  const { graph, report } = mergeComputing(atlas);
  assert.deepEqual(atlas, before, 'the input is not modified');
  assert.equal(report.added.length, content.nodes.length);
  assert.deepEqual(report.levelConflicts, []);
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  for (const n of before.nodes) assert.deepEqual(byId.get(n.id), n, `${n.id} changed`);
  assert.deepEqual(graph.edges.slice(0, before.edges.length), before.edges);
  const depth = levels(graph);
  for (const n of graph.nodes.filter(n => ids.has(n.id))) {
    assert.equal(n.proficiency80, null); assert.equal(n.pinned, false); assert.equal(n.layoutMode, 'vortex');
    assert.equal(n.position[1], (n.skillLevel - 1) * 64, `${n.id} height`);
    assert.ok(n.skillLevel >= 1 + 3 * depth.get(n.id), `${n.id} level below 1 + 3 × depth`);
    assert.ok(sentences(n.placementNote).length <= 2 && n.placementNote.split('. ').length <= 2, `${n.id} placement note`);
  }
  for (const e of graph.edges) if (e.type === 'prerequisite') assert.ok(byId.get(e.source).skillLevel < byId.get(e.target).skillLevel, `${e.source} → ${e.target} does not ascend`);
  assert.ok(clearance(graph, report.added).distance > 40);
  assert.equal(graph.title, before.title); assert.deepEqual(graph.metadata, before.metadata);
});

test('merging twice changes nothing, and an id already used by another domain is refused', () => {
  const once = mergeComputing(standIn()).graph;
  assert.deepEqual(mergeComputing(once).graph, once);
  const clash = standIn(); clash.nodes.push({ ...clash.nodes[0], id: 'c-loops', domain: 'Mathematics' });
  assert.throws(() => mergeComputing(clash), /already exists as a Mathematics skill/);
});

test('the sub-map holds every Computing skill and its full prerequisite closure, copied from the master', () => {
  const master = mergeComputing(standIn()).graph, sub = computingSubmap(master);
  const inMaster = new Map(master.nodes.map(n => [n.id, n])), inSub = new Set(sub.nodes.map(n => n.id)), masterEdges = new Set(master.edges.map(edgeKey));
  for (const n of sub.nodes) assert.deepEqual(n, inMaster.get(n.id));
  for (const e of sub.edges) assert.ok(masterEdges.has(edgeKey(e)));
  for (const n of master.nodes) if (n.domain === 'Computing') assert.ok(inSub.has(n.id));
  for (const e of master.edges) if (e.type === 'prerequisite' && inSub.has(e.target)) assert.ok(inSub.has(e.source), `closure misses ${e.source}`);
  assert.equal(sub.edges.length, master.edges.filter(e => inSub.has(e.source) && inSub.has(e.target)).length);
  assert.ok(inSub.has('m-logic') && inSub.has('m-set'), 'prerequisites of prerequisites are included');
  assert.equal(atlasFamily(sub), atlasFamily(master));
});

test('an answer given in the Computing sub-map reaches the master through the shared record', () => {
  const master = mergeComputing(standIn()).graph, sub = computingSubmap(master), family = atlasFamily(master);
  const marked = { ...sub, nodes: sub.nodes.map(n => n.id === 'c-loops' ? { ...n, proficiency80: true } : n.id === 'm-binary' ? { ...n, proficiency80: false } : n) };
  const record = recordAnswers(emptyRecord(family), diffProficiency(sub, marked), { source: 'console', map: sub.title, now: '2026-09-11T00:00:00Z' });
  const { graph } = reconcile(master, record);
  const value = id => graph.nodes.find(n => n.id === id).proficiency80;
  assert.equal(value('c-loops'), true); assert.equal(value('m-binary'), false); assert.equal(value('m-logic'), true);
});

test('Computing is a known domain with its own colour', () => { assert.ok(DOMAINS.Computing); });

// Optional: real local maps, read only.
const atlasPath = process.env.SSS_ATLAS;
test('real atlas: Computing edition is present, consistent, and existing skills are preserved', { skip: !atlasPath && 'set SSS_ATLAS to check a local master atlas' }, () => {
  const master = validate(JSON.parse(readFileSync(atlasPath, 'utf8')));
  const byId = new Map(master.nodes.map(n => [n.id, n]));
  for (const n of content.nodes) { const m = byId.get(n.id); assert.ok(m, `${n.id} missing`); assert.equal(m.domain, 'Computing'); assert.equal(m.details, n.details); }
  const masterEdges = new Set(master.edges.map(edgeKey));
  for (const e of content.edges) assert.ok(masterEdges.has(edgeKey(e)), `missing ${edgeKey(e)}`);
  for (const e of master.edges) if (e.type === 'prerequisite') assert.ok(byId.get(e.source).skillLevel < byId.get(e.target).skillLevel, `${e.source} → ${e.target}`);
  if (process.env.SSS_ATLAS_BACKUP) {
    const before = JSON.parse(readFileSync(process.env.SSS_ATLAS_BACKUP, 'utf8'));
    for (const n of before.nodes) assert.deepEqual(byId.get(n.id), n, `${n.id} changed`);
    assert.deepEqual(master.edges.slice(0, before.edges.length), before.edges);
    assert.equal(master.title, before.title); assert.deepEqual(master.metadata, before.metadata);
  }
  if (process.env.SSS_SUBMAP) {
    const sub = validate(JSON.parse(readFileSync(process.env.SSS_SUBMAP, 'utf8')));
    assert.deepEqual(sub, computingSubmap(master), 'sub-map matches a fresh derivation from the master');
    assert.equal(atlasFamily(sub), atlasFamily(master));
  }
});
