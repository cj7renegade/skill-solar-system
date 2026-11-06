// Checks the foundation splits step (authoring/splits/add-splits.mjs). Runs on a small synthetic map
// so it works anywhere; when the map the splits were approved against is present locally, it also
// builds the real result, read-only, and checks its gates and counts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { addSplits, gates, arrange, plan, nodeFor, RECORD } from '../authoring/splits/add-splits.mjs';
import { validate } from '../src/model.js';
import { arrangeVortex } from '../src/vortex.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const node = (id, extra = {}) => ({ id, name: `Skill ${id}`, domain: 'Physics', subdomain: 'Forces', description: `About ${id}.`, position: [0, 0, 0], pinned: false, proficiency80: null, icon: 'motion', ...extra });
const edge = (source, target, type = 'prerequisite') => ({ source, target, type });

// A broad skill with a successor, a second broad skill, and a milestone chain the splits must not touch.
const base = () => arrangeVortex(validate({
  schemaVersion: 1, title: 'Atlas', metadata: { atlasFamily: 'fam', datasetKey: 'key' }, layout: { type: 'vortex' },
  nodes: [node('p-broad', { proficiency80: true }), node('p-after'), node('e-broad', { domain: 'Electronics', subdomain: 'DC', icon: 'circuit' }),
    node('rob3:X', { planningId: 'X', feedsMilestones: ['I05'], lesson: { id: 'X' }, lessonCard: { edition: 'e' } }), node('rob3:I05', { planningId: 'I05', feedsMilestones: ['I05'] })],
  edges: [edge('p-broad', 'p-after'), edge('rob3:X', 'rob3:I05')]
}), { recalculate: true });

const skill = (id, from, edges, extra = {}) => ({ id, branch: 'P1', candidate: `Candidate ${id}`, from, required: false, name: `New ${id}`, description: `Does ${id}.`,
  details: `Details of ${id}.`, proficiencyReference: `I can ${id}.`, scopeNote: 'Bounded.', granularity: 'Distinct.', edges, ...extra });
const approved = (extra = {}) => ({
  status: 'APPROVED', approval: { by: 'JC', date: '2026-11-05', accepted: ['D1'] }, baseMap: {},
  shared: { nodeKind: 'skill', contentAuthorship: 'authored', authoringOrigin: 'sss-splits-step6', sourceAlignment: 'aligned', descriptionStatus: 'original' },
  notAdded: [{ branch: 'C6', candidate: 'Covered', coveredBy: 'c-x' }],
  skills: [
    skill('sss-phys-first', ['p-broad'], [{ source: 'sss-phys-first', target: 'p-broad', type: 'prerequisite', rationale: 'simpler piece first' }]),
    skill('sss-elec-second', ['e-broad'], [{ source: 'e-broad', target: 'sss-elec-second', type: 'prerequisite', rationale: 'after the broad skill' },
      { source: 'sss-elec-second', target: 'rob3:X', type: 'supports', rationale: 'optional preparation' }])
  ],
  ...extra
});
const build = (atlas = base(), a = approved()) => arrange(addSplits(atlas, a), atlas).graph;

test('nothing is built until the splits are approved', () => {
  assert.throws(() => plan({ ...approved(), status: 'DRAFT' }), /not approved/);
  assert.throws(() => addSplits(base(), { ...approved(), approval: undefined }), /Checkpoint A/);
});

test('a split is appended unmarked as a master-style record, beside its broad skill', () => {
  const atlas = base(), out = build(atlas);
  assert.deepEqual(out.nodes.map(n => n.id), [...atlas.nodes.map(n => n.id), 'sss-phys-first', 'sss-elec-second']);
  assert.deepEqual(out.edges.slice(0, atlas.edges.length), atlas.edges);
  const first = out.nodes.find(n => n.id === 'sss-phys-first'), second = out.nodes.find(n => n.id === 'sss-elec-second');
  assert.equal(first.proficiency80, null);
  assert.equal(first.planningId, undefined);
  assert.equal(first.lesson, undefined);
  assert.equal(second.domain, 'Electronics');   // from the broad skill it splits
  assert.equal(second.icon, 'circuit');
  assert.match(first.placementNote, /Split from p-broad/);
  assert.equal(out.nodes.find(n => n.id === 'p-broad').proficiency80, true);   // the broad skill keeps its answer
  assert.ok(out.nodes.find(n => n.id === 'p-broad').skillLevel > first.skillLevel);
  assert.deepEqual(out[RECORD].notAdded, approved().notAdded);
  assert.deepEqual(gates(atlas, out, approved()), []);
});

test('the record has the earlier batches\' fields, in their order', () => {
  const keys = Object.keys(nodeFor(approved().skills[0], node('p-broad'), approved().shared));
  assert.deepEqual(keys, ['id', 'name', 'domain', 'subdomain', 'nodeKind', 'description', 'details', 'position', 'pinned', 'proficiency80', 'icon', 'layoutMode',
    'placementNote', 'sourceRefs', 'referenceURLs', 'proficiencyReference', 'scopeNote', 'contentAuthorship', 'authoringOrigin', 'sourceAlignment', 'descriptionStatus']);
});

test('the gates refuse a changed answer or lesson, an extra connection, a planning id and a wrong required status', () => {
  const atlas = base(), good = build(atlas);
  const broken = change => { const g = structuredClone(good); change(g); return gates(atlas, g, approved()).join(); };
  assert.match(broken(g => { g.nodes[0].proficiency80 = false; }), /Answer changed on p-broad/);
  assert.match(broken(g => { g.nodes[3].lesson = { id: 'other' }; }), /Lesson changed on rob3:X/);
  assert.match(broken(g => { g.edges.push(edge('p-after', 'e-broad')); }), /other than the approved/);
  assert.match(broken(g => { g.nodes.find(n => n.id === 'sss-phys-first').planningId = 'Z'; }), /has a planning id/);
  assert.match(broken(g => { g.nodes.find(n => n.id === 'sss-phys-first').proficiency80 = true; }), /New skill sss-phys-first has an answer/);
  const asRequired = approved(); asRequired.skills[1].required = true;
  assert.match(gates(atlas, good, asRequired).join(), /sss-elec-second is not in the I05 chain, but it was approved as required/);
});

test('a split that would make a loop is refused', () => {
  const looped = approved();
  looped.skills[0].edges.push({ source: 'p-after', target: 'sss-phys-first', type: 'prerequisite', rationale: 'r' });
  assert.throws(() => build(base(), looped));
});

// The map the splits were approved against: the working map until Task 5 replaces it, then its
// dated backup. Found by the fingerprint the approval records.
const APPROVED = path.join(ROOT, 'scope', 'splits', 'new-skills.json');
const BASE = existsSync(APPROVED) && [path.join(ROOT, 'Maps', 'Robotics-Atlas.json'), path.join(ROOT, 'Maps', 'Backups', '2026-11-05-before-splits', 'Robotics-Atlas.json')]
  .find(f => existsSync(f) && createHash('sha256').update(readFileSync(f)).digest('hex') === JSON.parse(readFileSync(APPROVED, 'utf8')).baseMap.sha256);

test('the real base map: every gate passes and a rebuild gives identical bytes', { skip: !BASE && 'needs the map the splits were approved against' }, () => {
  const atlas = JSON.parse(readFileSync(BASE, 'utf8')), a = JSON.parse(readFileSync(APPROVED, 'utf8'));
  const out = build(atlas, a);
  assert.deepEqual(gates(atlas, out, a), []);
  assert.equal(out.nodes.length, 1955);
  assert.equal(out.edges.length, 5783);
  assert.equal(out.nodes.filter(n => n.proficiency80 != null).length, 308);
  assert.equal(out.nodes.filter(n => n.lesson).length, 306);
  assert.equal(out[RECORD].addedSkills.filter(s => s.required).length, 0);
  assert.equal(JSON.stringify(build(atlas, a)), JSON.stringify(out));
  // Every new skill's domain is the domain of the broad skill it splits.
  const byId = new Map(atlas.nodes.map(n => [n.id, n]));
  for (const s of a.skills) assert.equal(out.nodes.find(n => n.id === s.id).domain, byId.get(s.from[0]).domain, s.id);
});
