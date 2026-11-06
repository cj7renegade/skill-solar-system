// Extracts the Edition 07 lesson targets from the Task 3 map, for authoring (Tasks/TASKS.md, Task 4).
// Read-only: it writes authoring/robotics-v3/Edition07-Targets.json and changes no map.
//
//   node authoring/completions/extract-targets.mjs [--map <structure map>]
//
// Each target carries its map record verbatim, its specification record (V3's own, or the approved
// extension for P11 and A12), the contract fingerprint its lesson must carry, and its direct
// prerequisites in the map.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { contractHash } from '../robotics-v3/lessons.mjs';
import { specificationExtension } from './add-skills.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const MAP = args.includes('--map') ? path.resolve(args[args.indexOf('--map') + 1]) : 'C:\\sss-scratch\\completions\\Robotics-Atlas-structure.json';
const SPEC = path.join(ROOT, 'packages', 'robotics-curriculum-v3', 'Robotics-Reviewed-Specification.json');
const APPROVED = path.join(ROOT, 'scope', 'completions', 'new-skills.json');
const OUT = path.join(ROOT, 'authoring', 'robotics-v3', 'Edition07-Targets.json');
export const TARGETS = ['m-inverse', 'm-invtrig', 'p-work', 'K05', 'K06', 'K07', 'P11', 'A12'];

const bytes = readFileSync(MAP), map = JSON.parse(bytes);
const spec = JSON.parse(readFileSync(SPEC, 'utf8'));
const specNodes = new Map([...spec.nodes, ...specificationExtension(JSON.parse(readFileSync(APPROVED, 'utf8')))].map(n => [n.id, n]));
const byId = new Map(map.nodes.map(n => [n.id, n])), byPlanning = new Map(map.nodes.filter(n => n.planningId).map(n => [n.planningId, n]));
const inSet = new Set(TARGETS.map(t => byPlanning.get(t).id));

const targets = TARGETS.map(planningId => {
  const node = byPlanning.get(planningId), specification = specNodes.get(planningId);
  if (node.lesson) throw Error(`${planningId} already has a lesson.`);
  const directPrerequisites = map.edges.filter(e => e.type === 'prerequisite' && e.target === node.id).map(e => byId.get(e.source))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(p => ({ id: p.id, planningId: p.planningId ?? null, name: p.name, contentStatus: p.contentStatus ?? (p.lesson ? 'introductory lesson authored' : 'master-only skill, no lesson'), inThisSet: inSet.has(p.id) }));
  return { planningId, runtimeId: node.id, nodeContractSha256: contractHash(specification), node, specification, directPrerequisites };
});

// Every prerequisite outside the set either has a lesson, or is one of the master-only skills JC
// left for step 7 (Checkpoint A, C1).
const outside = targets.flatMap(t => t.directPrerequisites.filter(p => !p.inThisSet).map(p => ({ ...p, of: t.planningId })));
const check = {
  v3PrerequisitesWithoutLesson: outside.filter(p => p.planningId && !byId.get(p.id).lesson).map(p => `${p.id} (of ${p.of})`),
  masterOnlyPrerequisitesWithoutLesson: [...new Set(outside.filter(p => !p.planningId && !byId.get(p.id).lesson).map(p => `${p.id} (of ${p.of})`))]
};

const out = {
  extracted: new Date().toISOString().slice(0, 10),
  purpose: 'The eight Edition 07 lesson targets approved at Checkpoint A (C1 (a)), extracted verbatim for authoring. Read-only: nothing in the map was changed.',
  source: { file: MAP, sha256: createHash('sha256').update(bytes).digest('hex'), title: map.title, nodes: map.nodes.length, edges: map.edges.length,
    datasetKey: map.metadata?.datasetKey, atlasFamily: map.metadata?.atlasFamily },
  note: 'Each `node` is the complete map record, verbatim. `specification` is the record the lesson is checked against: V3\'s reviewed specification, or the approved extension (scope/completions/new-skills.json) for P11 and A12. A lesson must copy its `requires` and carry `nodeContractSha256` as `node_contract_sha256`. `directPrerequisites` lists the map\'s immediate prerequisite edges, which on the merged atlas include master skills and decision-10 links the specification does not list.',
  check,
  targetCount: targets.length,
  targets
};
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ wrote: path.relative(ROOT, OUT), source: out.source, check, targets: targets.map(t => ({ id: t.planningId, requires: t.specification.requires, mapPrerequisites: t.directPrerequisites.map(p => p.id) })) }, null, 2));
