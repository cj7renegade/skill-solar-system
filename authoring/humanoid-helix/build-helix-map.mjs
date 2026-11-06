// Builds the Humanoid Protocol Droid Helix map: the Robotics Atlas plus the humanoid helix extension.
//
//   python authoring/humanoid-helix/extract_taxonomy.py      (once, after the .xlsx changes)
//   node authoring/humanoid-helix/build-helix-map.mjs        writes Maps/Humanoid-Helix-Atlas.json
//
// Import only. No skill or prerequisite link is authored, renamed or deleted here: the Atlas's 1,955
// nodes and its edges are copied unchanged, apart from five added fields and a new position; the
// extension's 1,467 nodes and 5,498 edges are mapped into the Atlas schema as they are. Every mapping
// decision is recorded in docs/humanoid-helix-import.md. Maps/Robotics-Atlas.json is only read, and
// its SHA-256 is checked before and after.
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { clone, validate, levels } from '../../src/model.js';
import { DOMAIN_ICON } from '../../src/icons.js';
import { arrangeHelix } from '../../src/helix.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const IN = {
  atlas: path.join(ROOT, 'Maps', 'Robotics-Atlas.json'),
  extension: path.join(ROOT, 'imports', 'humanoid-helix', 'Humanoid-Helix-Extension.json'),
  taxonomy: path.join(ROOT, 'imports', 'humanoid-helix', 'Full-Taxonomy.json'),
  workbook: path.join(ROOT, 'imports', 'humanoid-helix', 'Humanoid-Skill-Helix-Taxonomy.xlsx')
};
const OUT = path.join(ROOT, 'Maps', 'Humanoid-Helix-Atlas.json');
export const KEY = 'humanoid-helix-v1';
const TITLE = 'HelixSkill — Humanoid Protocol Droid Helix';
const DATE = '2026-11-05';
const AUTHORSHIP = 'Editorial humanoid taxonomy, Nov 2026';
// Two courses have no Atlas skills to take a domain from (see docs/humanoid-helix-import.md).
const DOMAIN_FALLBACK = { PWR: 'Electronics', HRI: 'Robotics' };

const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const before = Object.fromEntries(Object.entries(IN).map(([k, f]) => [k, sha(f)]));
const atlas = JSON.parse(readFileSync(IN.atlas, 'utf8'));
const ext = JSON.parse(readFileSync(IN.extension, 'utf8'));
const tax = JSON.parse(readFileSync(IN.taxonomy, 'utf8'));
if (tax.sha256 !== before.workbook) throw Error('Full-Taxonomy.json was extracted from a different workbook. Re-run extract_taxonomy.py.');

const courses = ext.courses;                       // [code, name] in the extension's order
const codeOf = new Map(courses.map(([code, name]) => [name, code]));
const row = id => { const r = tax.nodes[id]; if (!r) throw Error(`${id} is not in the Full Taxonomy sheet.`); return r; };
const courseOfRow = r => { const code = codeOf.get(r.Course); if (!code) throw Error(`Unknown course ${r.Course}.`); return code; };
// "2 Controlled joint" -> 2; "Enrichment" (off the humanoid path) -> null.
const stageNumber = text => { const m = /^(\d+)\s/.exec(text ?? ''); return m ? Number(m[1]) : null; };
const buildStages = {};
for (const r of Object.values(tax.nodes)) { const m = /^(\d+)\s+(.*)$/.exec(r['Build Stage'] ?? ''); if (m) buildStages[m[1]] = m[2]; }
const yes = value => { if (value === 'Yes') return true; if (value === 'No') return false; throw Error(`On Humanoid Path must be Yes or No, not ${value}.`); };

// The app's six domains, by course: the one domain every Atlas skill of that course already uses.
const domainCounts = {};
for (const n of atlas.nodes) { const code = courseOfRow(row(n.id)); (domainCounts[code] ??= {})[n.domain] = (domainCounts[code][n.domain] || 0) + 1; }
const courseDomain = {};
for (const [code] of courses) {
  const seen = Object.entries(domainCounts[code] || {}).sort((a, b) => b[1] - a[1]);
  courseDomain[code] = seen.length ? seen[0][0] : DOMAIN_FALLBACK[code];
  if (!courseDomain[code]) throw Error(`No domain for course ${code}.`);
}

// Atlas nodes: every field unchanged; five fields added (position is recomputed by the layout).
const atlasTiers = {};
const atlasNodes = atlas.nodes.map(n => {
  const r = row(n.id), code = courseOfRow(r);
  atlasTiers[n.id] = r.Level;
  return { ...clone(n), course: r.Course, courseCode: code, buildStage: stageNumber(r['Build Stage']), onHumanoidPath: yes(r['On Humanoid Path']), helixLevel: Number(r['Helix Level']) };
});

// New nodes, mapped into the Atlas node schema (field order as a pending Atlas entry).
const assessmentMode = (practice, type) => ({ written: type === 'QUANT' ? 'written calculation' : 'documented scenario', code: 'runnable code or trace',
  'hands-on': 'supervised demonstration', design: 'drawing, calculation or supervised fabrication' })[practice] ?? (() => { throw Error(`Unknown practice ${practice}.`); })();
const newNodes = ext.newNodes.map(x => {
  const name = Object.fromEntries(courses)[x.course], domain = courseDomain[x.course], r = row(x.id);
  if (!name) throw Error(`${x.id} has unknown course ${x.course}.`);
  return {
    id: x.id, name: x.name, domain, subdomain: x.subject, nodeKind: x.kind, description: x.description, details: x.description,
    position: [0, 0, 0], pinned: false, proficiency80: null, icon: DOMAIN_ICON[domain], layoutMode: 'vortex', placementNote: '',
    assessmentMode: assessmentMode(x.practice, x.type), assessable: x.kind !== 'milestone',
    contentStatus: 'introductory lesson pending', lessonStatus: 'no lesson yet', contentAuthorship: AUTHORSHIP,
    skillLevel: x.helix, helixType: x.type, helixPractice: x.practice, helixTier: x.level,
    course: name, courseCode: x.course, buildStage: x.stage, onHumanoidPath: yes(r['On Humanoid Path']), helixLevel: x.helix
  };
});

// Edges: the Atlas's unchanged, then every extension edge as a prerequisite.
const edges = [...clone(atlas.edges), ...ext.newPrerequisiteEdges.map(e => ({ source: e.source, target: e.target, type: 'prerequisite', authorship: 'editorial',
  rationale: `${e.origin}: added by the humanoid helix taxonomy (Nov 2026)` }))];

const counts = list => list.reduce((t, x) => (t[x] = (t[x] || 0) + 1, t), {});
let graph = {};
for (const key of Object.keys(atlas)) graph[key] = clone(atlas[key]);   // the Atlas's top-level schema and order
Object.assign(graph, { title: TITLE, nodes: [...atlasNodes, ...newNodes], edges });
const depth = levels({ ...graph, levelModel: { range: [1, 1000] } }), longest = Math.max(...depth.values()), top = 1 + 3 * longest;
graph.levelModel = { ...clone(atlas.levelModel), method: '1 + 3 × longest recorded prerequisite depth, over the merged prerequisite graph.', range: [1, top], usedRange: [1, top],
  helixScaling: `The helix runs to level ${top} (longest chain ${longest}). The app scales height so level ${top} sits where level 100 sits on other maps (layout.heightPerLevel); maps without a declared range keep the 1–100 limit.` };
graph.metadata = {
  ...clone(atlas.metadata), datasetId: KEY, datasetVersion: '1.0', created: DATE, atlasFamily: KEY, datasetKey: KEY,
  scope: 'The Robotics Atlas merged with the humanoid protocol droid helix extension: Atlas skills, answers and lessons unchanged; humanoid skills, checkpoints, milestones I06–I09 and their prerequisites added.',
  proficiencyPolicy: 'Its own answer family (humanoid-helix-v1), so answers here never change the Robotics Atlas. The Atlas skills\' saved answers travel in the file and are adopted on first open: a copy, not a move. New skills start unmarked.',
  courses: clone(courses),
  humanoidHelixImport: {
    date: DATE, mappingDecisions: 'docs/humanoid-helix-import.md',
    sources: Object.fromEntries(Object.entries(IN).map(([k, f]) => [k, { file: path.relative(ROOT, f).split(path.sep).join('/'), sha256: before[k] }])),
    originalMap: { title: atlas.title, datasetKey: atlas.metadata.datasetKey, atlasFamily: atlas.metadata.atlasFamily, datasetId: atlas.metadata.datasetId },
    counts: { atlasNodes: atlasNodes.length, newNodes: newNodes.length, nodes: atlasNodes.length + newNodes.length, atlasEdges: atlas.edges.length,
      atlasPrerequisiteEdges: atlas.edges.filter(e => e.type === 'prerequisite').length, newPrerequisiteEdges: ext.newPrerequisiteEdges.length,
      newEdgesByOrigin: counts(ext.newPrerequisiteEdges.map(e => e.origin)), longestChain: longest, topLevel: top },
    courseDomains: courseDomain, buildStages, atlasTiers,
    addedAtlasFields: ['course', 'courseCode', 'buildStage', 'onHumanoidPath', 'helixLevel']
  }
};
graph = arrangeHelix(graph);
validate(graph);

const text = JSON.stringify(graph, null, 2) + '\n';
for (const [k, f] of Object.entries(IN)) if (sha(f) !== before[k]) throw Error(`${k} changed during the build.`);
const temp = `${OUT}.${process.pid}.tmp`; writeFileSync(temp, text); renameSync(temp, OUT);
console.log(JSON.stringify({ wrote: path.relative(ROOT, OUT), bytes: Buffer.byteLength(text), sha256: createHash('sha256').update(text).digest('hex'),
  nodes: graph.nodes.length, edges: graph.edges.length, longestChain: longest, topLevel: top, courseDomains: courseDomain, robotics_atlas_sha256: before.atlas }, null, 2));
