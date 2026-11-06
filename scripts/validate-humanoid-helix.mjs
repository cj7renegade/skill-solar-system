// Validates Maps/Humanoid-Helix-Atlas.json against its inputs. Read-only; exits 1 at the first failed
// check, and never repairs data: a problem is reported, not fixed.
//
//   node scripts/validate-humanoid-helix.mjs
//
// The required checks are the import's acceptance list (docs/humanoid-helix-import.md). Consistency
// notes (helix levels in the inputs against the merged graph) are reported but do not fail.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { validate } from '../src/model.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const file = rel => path.join(ROOT, rel);
const sha = rel => createHash('sha256').update(readFileSync(file(rel))).digest('hex');
const read = rel => JSON.parse(readFileSync(file(rel), 'utf8'));
const map = read('Maps/Humanoid-Helix-Atlas.json'), atlas = read('Maps/Robotics-Atlas.json');
const ext = read('imports/humanoid-helix/Humanoid-Helix-Extension.json'), tax = read('imports/humanoid-helix/Full-Taxonomy.json');
const ADDED = ['course', 'courseCode', 'buildStage', 'onHumanoidPath', 'helixLevel'];
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
  if (!ok) { console.error(`\nValidation FAILED at: ${name}. Nothing was changed; see docs/humanoid-helix-import.md.`); process.exit(1); }
}

// 1. Nodes.
const ids = map.nodes.map(n => n.id), idSet = new Set(ids);
check('node count is 3,422 (1,955 Atlas + 1,467 new)', map.nodes.length === 3422 && atlas.nodes.length === 1955 && ext.newNodes.length === 1467, `${map.nodes.length}`);
check('node ids are unique', idSet.size === ids.length);
check('every Atlas and extension id is present', atlas.nodes.every(n => idSet.has(n.id)) && ext.newNodes.every(n => idSet.has(n.id)));

// 2. Prerequisite edges.
const prereq = map.edges.filter(e => e.type === 'prerequisite');
const atlasPrereq = atlas.edges.filter(e => e.type === 'prerequisite');
check('prerequisite edge count is 9,884 (4,386 Atlas + 5,498 new)', prereq.length === 9884 && atlasPrereq.length === 4386 && ext.newPrerequisiteEdges.length === 5498, `${prereq.length}`);
check('every edge source and target exists', map.edges.every(e => idSet.has(e.source) && idSet.has(e.target)));
const keys = map.edges.map(e => JSON.stringify([e.type, ...(e.type === 'related' ? [e.source, e.target].sort() : [e.source, e.target])]));
check('no duplicate edges', new Set(keys).size === keys.length, `${map.edges.length} edges`);
check('every Atlas edge is present unchanged, in order', JSON.stringify(map.edges.slice(0, atlas.edges.length)) === JSON.stringify(atlas.edges));
check('every extension edge is present as a prerequisite', ext.newPrerequisiteEdges.every((e, i) => { const m = map.edges[atlas.edges.length + i]; return m && m.source === e.source && m.target === e.target && m.type === 'prerequisite'; })
  && map.edges.length === atlas.edges.length + ext.newPrerequisiteEdges.length);

// 3. No cycles; longest chain 61 (Kahn's algorithm, independent of the app's code).
const children = new Map(ids.map(id => [id, []])), indeg = new Map(ids.map(id => [id, 0])), depth = new Map(ids.map(id => [id, 0]));
for (const e of prereq) { children.get(e.source).push(e.target); indeg.set(e.target, indeg.get(e.target) + 1); }
const queue = ids.filter(id => !indeg.get(id));
for (let i = 0; i < queue.length; i++) for (const t of children.get(queue[i])) { depth.set(t, Math.max(depth.get(t), depth.get(queue[i]) + 1)); indeg.set(t, indeg.get(t) - 1); if (!indeg.get(t)) queue.push(t); }
check('no prerequisite cycles (topological sort succeeds)', queue.length === ids.length, `${queue.length} sorted`);
const longest = Math.max(...depth.values());
check('the longest prerequisite chain is 61', longest === 61, `${longest}`);

// 4. Atlas nodes identical except the five added fields and position.
const byId = new Map(map.nodes.map(n => [n.id, n]));
const drift = [];
for (const a of atlas.nodes) {
  const m = byId.get(a.id);
  const keysA = Object.keys(a).filter(k => k !== 'position'), keysM = Object.keys(m).filter(k => k !== 'position' && !ADDED.includes(k));
  if (JSON.stringify(keysA) !== JSON.stringify(keysM)) { drift.push(`${a.id}: field set`); continue; }
  for (const k of keysA) if (JSON.stringify(a[k]) !== JSON.stringify(m[k])) drift.push(`${a.id}.${k}`);
  for (const k of ADDED) if (!(k in m)) drift.push(`${a.id}: missing ${k}`);
}
check('every Atlas node is identical to the original except the five added fields and position', !drift.length, drift.slice(0, 5).join(', ') || '1,955 nodes');

// 5. New nodes' prerequisites equal the extension's prereqs.
const parents = new Map(ids.map(id => [id, []]));
for (const e of prereq) parents.get(e.target).push(e.source);
const wrongPrereqs = ext.newNodes.filter(x => JSON.stringify([...parents.get(x.id)].sort()) !== JSON.stringify([...x.prereqs].sort()));
check('every new node\'s prerequisites in the map equal its prereqs in the extension file', !wrongPrereqs.length, wrongPrereqs.slice(0, 5).map(x => x.id).join(', ') || '1,467 nodes');

// 6. Every non-Atlas node reaches I08 or I09 forward.
const goal = new Set(['hx-sys-ms-i08', 'hx-sys-ms-i09']), reaches = new Set(goal);
for (const id of [...queue].reverse()) if (children.get(id).some(t => reaches.has(t))) reaches.add(id);
const stranded = ext.newNodes.filter(x => !reaches.has(x.id));
check('every non-Atlas node reaches hx-sys-ms-i08 or hx-sys-ms-i09', !stranded.length, stranded.slice(0, 5).map(x => x.id).join(', ') || '1,467 nodes');

// 7. The original map is byte-identical.
const recorded = map.metadata.humanoidHelixImport.sources.atlas.sha256, now = sha('Maps/Robotics-Atlas.json');
check('Maps/Robotics-Atlas.json is byte-identical to the build\'s input', now === recorded, now.slice(0, 16));

// 8. Identity and the app's own validator.
check('the new map has its own dataset key and answer family', map.metadata.datasetKey === 'humanoid-helix-v1' && map.metadata.atlasFamily === 'humanoid-helix-v1'
  && atlas.metadata.datasetKey === 'robotics-atlas-merged' && map.metadata.datasetKey !== 'robotics-curriculum-v3');
let appOk = true, appError = '';
try { validate(map); } catch (error) { appOk = false; appError = error.message; }
check('the app\'s own validator accepts the map', appOk, appError);
check('new nodes start unmarked and with no lesson', ext.newNodes.every(x => { const n = byId.get(x.id); return n.proficiency80 === null && !n.lesson && !n.lessonCard; }));

// Consistency notes: helix levels in the inputs against the merged graph (reported, not failed).
const helix = id => 1 + 3 * depth.get(id);
const extMismatch = ext.newNodes.filter(x => x.helix !== helix(x.id) || x.depth !== depth.get(x.id));
const sheetMismatch = Object.values(tax.nodes).filter(r => Number(r['Helix Level']) !== helix(r['Node ID']) || Number(r['Prereq Depth']) !== depth.get(r['Node ID']));
console.log(`\nNOTE extension helix/depth values that differ from the merged graph: ${extMismatch.length}${extMismatch.length ? ` (e.g. ${extMismatch.slice(0, 3).map(x => `${x.id} ${x.helix} vs ${helix(x.id)}`).join('; ')})` : ''}`);
console.log(`NOTE spreadsheet Helix Level / Prereq Depth values that differ from the merged graph: ${sheetMismatch.length}${sheetMismatch.length ? ` (e.g. ${sheetMismatch.slice(0, 3).map(r => `${r['Node ID']} ${r['Helix Level']} vs ${helix(r['Node ID'])}`).join('; ')})` : ''}`);
console.log(`\nAll ${results.length} checks passed.`);
