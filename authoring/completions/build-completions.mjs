// Adds the approved new skills to the working Robotics Atlas (Tasks/TASKS.md, Task 3).
//
//   node authoring/completions/build-completions.mjs              dry run: checks and a summary, no map written
//   node authoring/completions/build-completions.mjs --write      also write the map
//   --out <folder>                                               where to write (default C:\sss-scratch\completions)
//
// It never writes into Maps/ and never touches the working map or any answer record. The result
// goes to the scratch folder until JC passes Checkpoint B (Task 8). It refuses to write unless
// every gate passes and a second build gives identical bytes.
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { addSkills, gates, arrange } from './add-skills.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const INPUTS = {
  atlas: path.join(ROOT, 'Maps', 'Robotics-Atlas.json'),
  approved: path.join(ROOT, 'scope', 'completions', 'new-skills.json')
};
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? path.resolve(args[args.indexOf('--out') + 1]) : 'C:\\sss-scratch\\completions';
const OUT_MAP = path.join(OUT, 'Robotics-Atlas-structure.json'), OUT_SUMMARY = path.join(OUT, 'structure-summary.json');
if (path.resolve(OUT).startsWith(path.join(ROOT, 'Maps'))) { console.error('Refusing to write into Maps/ before Checkpoint B.'); process.exit(1); }

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const raw = Object.fromEntries(Object.entries(INPUTS).map(([k, f]) => [k, readFileSync(f)]));
const before = Object.fromEntries(Object.entries(raw).map(([k, b]) => [k, sha(b)]));
const [atlas, approved] = ['atlas', 'approved'].map(k => JSON.parse(raw[k]));

const problems = [];
// The new skills were judged against a particular snapshot of the working map.
if (approved.baseMap?.sha256 !== before.atlas) problems.push('The working map has changed since the new skills were approved.');

const render = g => JSON.stringify(g, null, 2) + '\n';
let text = '', built = null;
try {
  const build = () => arrange(addSkills(atlas, approved), atlas).graph;
  built = build();
  problems.push(...gates(atlas, built, approved));
  text = render(built);
  if (render(build()) !== text) problems.push('A second build did not give identical bytes.');
} catch (error) { problems.push(error.message); }
const after = Object.fromEntries(Object.entries(INPUTS).map(([k, f]) => [k, sha(readFileSync(f))]));
for (const k in before) if (before[k] !== after[k]) problems.push(`${k} changed during the build.`);

const count = (list, f) => list.reduce((t, x) => (t[f(x)] = (t[f(x)] || 0) + 1, t), {});
const summary = {
  result: problems.length ? 'REFUSED' : 'PASSED',
  problems,
  inputs: Object.fromEntries(Object.keys(INPUTS).map(k => [k, { file: path.relative(ROOT, INPUTS[k]), sha256: before[k] }])),
  before: { skills: atlas.nodes.length, connections: atlas.edges.length, answers: atlas.nodes.filter(n => n.proficiency80 != null).length, lessons: atlas.nodes.filter(n => n.lesson).length },
  after: built && {
    file: OUT_MAP, bytes: Buffer.byteLength(text), sha256: sha(text),
    skills: built.nodes.length, connections: built.edges.length, edgeTypes: count(built.edges, e => e.type),
    answers: built.nodes.filter(n => n.proficiency80 != null).length, lessons: built.nodes.filter(n => n.lesson).length,
    added: built.roboticsCompletions.addedSkills, addedEdges: built.roboticsCompletions.addedEdges,
    feedsMilestonesCorrected: built.roboticsCompletions.feedsMilestonesCorrected, levels: built.roboticsCompletions.levels
  },
  inputsUnchanged: Object.keys(before).every(k => before[k] === after[k]),
  identicalOnRebuild: !problems.includes('A second build did not give identical bytes.')
};

function writeAtomic(file, content) { const temp = `${file}.${process.pid}.tmp`; writeFileSync(temp, content); renameSync(temp, file); }
mkdirSync(OUT, { recursive: true });
writeAtomic(OUT_SUMMARY, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (problems.length) { console.log('\nREFUSED: nothing written except the summary.'); process.exit(1); }
if (!args.includes('--write')) { console.log(`\nDry run: summary written to ${OUT_SUMMARY}; no map written. Add --write to write the map.`); process.exit(0); }
writeAtomic(OUT_MAP, text);
console.log(`\nWrote ${OUT_MAP}`);
