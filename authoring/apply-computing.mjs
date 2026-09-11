// Adds the Computing foundation edition to a local master atlas and writes the
// Computing-with-prerequisites sub-map next to it.
//
//   node authoring/apply-computing.mjs <master.json>            dry run: report only
//   node authoring/apply-computing.mjs <master.json> --write    write master and sub-map
//   --submap <path>   sub-map location (default: 03-Computing-with-prerequisites.json beside the master)
//
// Back up the master first. Writes are atomic (temporary file, then rename) and are refused if the
// master changed on disk while this ran. Existing skills, coordinates, pins, levels, and
// proficiency are left exactly as they were.
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { mergeComputing, computingSubmap, clearance } from './computing/merge.mjs';

const args = process.argv.slice(2), option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const masterPath = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--submap');
if (!masterPath) { console.error('Usage: node authoring/apply-computing.mjs <master.json> [--write] [--submap <path>]'); process.exit(2); }
const submapPath = option('--submap') || path.join(path.dirname(masterPath), '03-Computing-with-prerequisites.json');
const text = readFileSync(masterPath, 'utf8'), hash = s => createHash('sha256').update(s).digest('hex');
// Keep the file's own formatting: indentation, line endings, and final newline.
const indent = /^\{\r?\n( +)"/.exec(text)?.[1].length ?? 0, eol = text.includes('\r\n') ? '\r\n' : '\n', finalNewline = /\r?\n$/.test(text);
const serialize = value => { let out = JSON.stringify(value, null, indent || undefined); if (eol === '\r\n') out = out.replace(/\n/g, '\r\n'); return finalNewline ? out + eol : out; };

const atlas = JSON.parse(text);
const { graph, report } = mergeComputing(atlas);
const sub = computingSubmap(graph);
const spacing = clearance(graph, report.added);
const summary = {
  master: masterPath, submap: submapPath,
  before: { nodes: atlas.nodes.length, edges: atlas.edges.length },
  after: { nodes: graph.nodes.length, edges: graph.edges.length, computing: graph.nodes.filter(n => n.domain === 'Computing').length },
  added: report.added.length, refreshed: report.refreshed.length, newEdges: report.newEdges, skippedDuplicateEdges: report.duplicates.length,
  crossDomainEdges: report.crossDomain, reusedSkills: report.reused, levelConflicts: report.levelConflicts, maxLevel: report.maxLevel,
  nearestNeighbour: spacing, submapNodes: sub.nodes.length, submapEdges: sub.edges.length,
  submapDomains: sub.nodes.reduce((t, n) => (t[n.domain] = (t[n.domain] || 0) + 1, t), {})
};
console.log(JSON.stringify(summary, null, 2));
if (!args.includes('--write')) { console.log('\nDry run: nothing written. Add --write to update the files.'); process.exit(0); }

function writeAtomic(file, content) { const temp = `${file}.${process.pid}.tmp`; writeFileSync(temp, content); renameSync(temp, file); }
if (hash(readFileSync(masterPath, 'utf8')) !== hash(text)) { console.error('The master changed on disk while this ran; nothing written.'); process.exit(1); }
writeAtomic(masterPath, serialize(graph));
writeAtomic(submapPath, serialize(sub));
console.log(`\nWrote ${masterPath} and ${submapPath}.`);
