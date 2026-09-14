// Adds the Mechanics Statics batch to a local master atlas and writes the
// Mechanics-Statics-Batch-01-with-prerequisites sub-map beside it.
//
//   node authoring/apply-mechanics-statics.mjs <master.json>            dry run: report only
//   node authoring/apply-mechanics-statics.mjs <master.json> --write    write the master and the sub-map
//   --submap <path>   sub-map location (default: Mechanics-Statics-Batch-01-with-prerequisites.json beside the master)
//
// Back up the master first. Writes are atomic and are refused if the master changed on disk while
// this ran. Existing skills, coordinates, levels, pins, and answers are left exactly as they were,
// and running it twice changes nothing.
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { mergeMechanicsStatics, staticsSubmap, clearance, loadBatch } from './mechanics-statics/merge.mjs';

const args = process.argv.slice(2), option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const masterPath = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--submap');
if (!masterPath) { console.error('Usage: node authoring/apply-mechanics-statics.mjs <master.json> [--write] [--submap <path>]'); process.exit(2); }
const submapPath = option('--submap') || path.join(path.dirname(masterPath), 'Mechanics-Statics-Batch-01-with-prerequisites.json');
const text = readFileSync(masterPath, 'utf8'), hash = s => createHash('sha256').update(s).digest('hex');
// Keep the file's own formatting: indentation, line endings, and final newline.
const indent = /^\{\r?\n( +)"/.exec(text)?.[1].length ?? 0, eol = text.includes('\r\n') ? '\r\n' : '\n', finalNewline = /\r?\n$/.test(text);
const serialize = value => { let out = JSON.stringify(value, null, indent || undefined); if (eol === '\r\n') out = out.replace(/\n/g, '\r\n'); return finalNewline ? out + eol : out; };

const atlas = JSON.parse(text), batch = loadBatch();
const before = { nodes: atlas.nodes.length, edges: atlas.edges.length, marked: atlas.nodes.filter(n => n.proficiency80 != null).length };
const { graph, report } = mergeMechanicsStatics(atlas, batch);
const sub = staticsSubmap(graph, batch);
const summary = {
  master: masterPath, submap: submapPath, masterSha256: hash(text),
  before, after: { nodes: graph.nodes.length, edges: graph.edges.length, marked: graph.nodes.filter(n => n.proficiency80 != null).length, mechanics: graph.nodes.filter(n => n.domain === 'Mechanics').length },
  added: report.added.length, refreshed: report.refreshed.length, newEdges: report.newEdges, skippedDuplicateEdges: report.duplicates.length,
  reusedSkills: report.external, nameConflicts: report.nameConflicts, levelConflicts: report.levelConflicts,
  newDepthRange: report.depthRange, newLevelRange: report.levelRange, nearestNeighbour: clearance(graph, report.added),
  submapNodes: sub.nodes.length, submapEdges: sub.edges.length,
  submapDomains: sub.nodes.reduce((t, n) => (t[n.domain] = (t[n.domain] || 0) + 1, t), {})
};
console.log(JSON.stringify(summary, null, 2));
if (!args.includes('--write')) { console.log('\nDry run: nothing written. Add --write to update the files.'); process.exit(0); }

function writeAtomic(file, content) { const temp = `${file}.${process.pid}.tmp`; writeFileSync(temp, content); renameSync(temp, file); }
if (hash(readFileSync(masterPath, 'utf8')) !== hash(text)) { console.error('The master changed on disk while this ran; nothing written.'); process.exit(1); }
writeAtomic(masterPath, serialize(graph));
writeAtomic(submapPath, serialize(sub));
console.log(`\nWrote ${masterPath} and ${submapPath}.`);
