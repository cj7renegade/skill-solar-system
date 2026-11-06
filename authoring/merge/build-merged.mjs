// Builds the merged Robotics Atlas from the master, the V3 export and the approved crosswalk.
//
//   node authoring/merge/build-merged.mjs                 dry run: checks and a summary, no map written
//   node authoring/merge/build-merged.mjs --write         also write the merged map
//   --out <folder>                                        where to write (default C:\sss-scratch\merge)
//
// It never writes into Maps/ and never touches the two source maps or any answer record. The
// merged map goes to the scratch folder until JC passes Checkpoint B (Tasks/TASKS.md, Task 7).
// It refuses to write unless every gate passes and a second build gives identical bytes.
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { merge, gates, arrangeMerged } from './merge.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const INPUTS = {
  master: path.join(ROOT, 'Maps', 'Skill-Solar-System.json'),
  v3: path.join(ROOT, 'Maps', 'Robotics-v3', 'Robotics-v3-Lessons.json'),
  crosswalk: path.join(ROOT, 'scope', 'merge', 'crosswalk.json')
};
const args = process.argv.slice(2);
const OUT = args.includes('--out') ? path.resolve(args[args.indexOf('--out') + 1]) : 'C:\\sss-scratch\\merge';
const OUT_MAP = path.join(OUT, 'Robotics-Atlas.json'), OUT_SUMMARY = path.join(OUT, 'merge-summary.json');
if (path.resolve(OUT).startsWith(path.join(ROOT, 'Maps'))) { console.error('Refusing to write into Maps/ before Checkpoint B.'); process.exit(1); }

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const raw = Object.fromEntries(Object.entries(INPUTS).map(([k, f]) => [k, readFileSync(f)]));
const before = Object.fromEntries(Object.entries(raw).map(([k, b]) => [k, sha(b)]));
const [master, v3, crosswalk] = ['master', 'v3', 'crosswalk'].map(k => JSON.parse(raw[k]));

const problems = [];
// The crosswalk was judged against particular snapshots; a changed map must be noticed.
if (crosswalk.sources.master.sha256 !== before.master) problems.push('The master map has changed since the crosswalk was approved.');
if (crosswalk.sources.v3.sha256 !== before.v3) problems.push('The V3 export has changed since the crosswalk was approved.');

const render = g => JSON.stringify(g, null, 2) + '\n';
let text = '', merged = null;
try {
  const build = () => arrangeMerged(merge(master, v3, crosswalk), master, v3, crosswalk).graph;
  merged = build();
  problems.push(...gates(master, v3, crosswalk, merged));
  text = render(merged);
  if (render(build()) !== text) problems.push('A second build did not give identical bytes.');
} catch (error) { problems.push(error.message); }
const after = Object.fromEntries(Object.entries(INPUTS).map(([k, f]) => [k, sha(readFileSync(f))]));
for (const k in before) if (before[k] !== after[k]) problems.push(`${k} changed during the build.`);

const count = (list, f) => list.reduce((t, x) => (t[f(x)] = (t[f(x)] || 0) + 1, t), {});
const summary = {
  result: problems.length ? 'REFUSED' : 'PASSED',
  problems,
  inputs: Object.fromEntries(Object.keys(INPUTS).map(k => [k, { file: path.relative(ROOT, INPUTS[k]), sha256: before[k] }])),
  before: { master: { skills: master.nodes.length, connections: master.edges.length, answers: master.nodes.filter(n => n.proficiency80 != null).length },
    v3: { skills: v3.nodes.length, connections: v3.edges.length, lessons: v3.nodes.filter(n => n.lesson).length } },
  merged: merged && {
    file: OUT_MAP, bytes: Buffer.byteLength(text), sha256: sha(text),
    skills: merged.nodes.length, connections: merged.edges.length, edgeTypes: count(merged.edges, e => e.type),
    answers: merged.nodes.filter(n => n.proficiency80 != null).length, lessons: merged.nodes.filter(n => n.lesson).length,
    domains: count(merged.nodes, n => n.domain), skippedEdges: merged.roboticsV3Merge.skippedEdges, levels: merged.roboticsV3Merge.levels,
    retired: merged.roboticsV3Merge.retiredOverviews.length, sameAbility: merged.roboticsV3Merge.sameAbility,
    answerChanges: merged.roboticsV3Merge.answerChanges
  },
  sourceMapsUnchanged: Object.keys(before).every(k => before[k] === after[k]),
  identicalOnRebuild: !problems.includes('A second build did not give identical bytes.')
};

function writeAtomic(file, content) { const temp = `${file}.${process.pid}.tmp`; writeFileSync(temp, content); renameSync(temp, file); }
mkdirSync(OUT, { recursive: true });
writeAtomic(OUT_SUMMARY, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (problems.length) { console.log('\nREFUSED: nothing written except the summary.'); process.exit(1); }
if (!args.includes('--write')) { console.log(`\nDry run: summary written to ${OUT_SUMMARY}; no map written. Add --write to write the merged map.`); process.exit(0); }
writeAtomic(OUT_MAP, text);
console.log(`\nWrote ${OUT_MAP}`);
