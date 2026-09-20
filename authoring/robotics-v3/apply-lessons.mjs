// Applies robotics learning editions 01 and 02 to the dedicated v3 map and reports what changed.
//
//   node authoring/robotics-v3/apply-lessons.mjs            dry run: reconcile and report only
//   node authoring/robotics-v3/apply-lessons.mjs --write    write the map, the ledger and the summary
//
// Inputs are located rather than hard-coded, so the supplied package can sit where it was extracted
// or be reorganised under packages/ without editing this file. Every input is fingerprinted in the
// summary, so a later edition can tell which revision of each file was actually applied.
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { validate } from '../../src/model.js';
import { atlasFamily } from '../../src/proficiency.js';
import { buildQueue, startSession, resumeCheck, currentId, answer, skip, mapKey, datasetKey } from '../../src/review.js';
import { applyLessons, preservationDiff, PRESERVED } from './lessons.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
// The base is the current export when one exists, so any later change to it — a moved sphere, a
// recorded answer, a newer lesson — is carried forward rather than rebuilt away. Only a first run
// starts from the generated preview.
const PREVIEW = path.join(ROOT, 'Maps', 'Robotics-v3', 'Robotics-v3-Preview.json');
const OUT_MAP = path.join(ROOT, 'Maps', 'Robotics-v3', 'Robotics-v3-Lessons.json');
const MAP = existsSync(OUT_MAP) ? OUT_MAP : PREVIEW;
const OUT_LEDGER = path.join(ROOT, 'Maps', 'Robotics-v3', 'Content-Import-Ledger.csv');
const OUT_SUMMARY = path.join(ROOT, 'Maps', 'Robotics-v3', 'Integration-Summary.json');

// The supplied package as extracted, and the same files once reorganised under packages/.
const CANDIDATES = {
  spec: ['packages/controlled-joint-learning-edition-02/baseline/Robotics-Reviewed-Specification.json', 'Maps/Robotics-v3/baseline/Robotics-Reviewed-Specification.json', 'packages/robotics-curriculum-v3/Robotics-Reviewed-Specification.json'],
  edition01: ['packages/shared-foundations-learning-edition-01/Shared-Foundations-Lessons-01.json', 'packages/controlled-joint-learning-edition-02/baseline/Shared-Foundations-Lessons-01.json', 'Maps/Robotics-v3/baseline/Shared-Foundations-Lessons-01.json'],
  edition02: ['packages/controlled-joint-learning-edition-02/Controlled-Joint-Lessons-02.json', 'Maps/Robotics-v3/Controlled-Joint-Lessons-02.json'],
  edition03: ['packages/complete-arm-learning-edition-03/Complete-Arm-Lessons-03.json', 'Maps/Robotics-v3/robotics-lessons-03/Complete-Arm-Lessons-03.json']
};
// The export the latest edition was reconciled against, shipped inside its package. Optional: it
// only exists once an edition has been supplied with one. It is never written, only compared, so
// the summary can still show what the newest edition added after the import has been re-run.
const BASELINE = ['packages/complete-arm-learning-edition-03/baseline/Robotics-v3-Lessons.json'];

export function resolveInput(name) {
  for (const relative of CANDIDATES[name]) { const file = path.join(ROOT, relative); if (existsSync(file)) return { name, relative, file }; }
  throw Error(`Could not find the ${name} input. Looked for: ${CANDIDATES[name].join(', ')}`);
}

const sha256 = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const rel = file => path.relative(ROOT, file).split(path.sep).join('/');

export function loadInputs() {
  const found = Object.fromEntries(Object.keys(CANDIDATES).map(name => [name, resolveInput(name)]));
  const read = name => ({ ...found[name], sha256: sha256(found[name].file), data: JSON.parse(readFileSync(found[name].file, 'utf8')) });
  return { spec: read('spec'), edition01: read('edition01'), edition02: read('edition02'), edition03: read('edition03') };
}

function ledger(graph) {
  const rows = [['runtime_id', 'planning_id', 'name', 'branch', 'kind', 'content_status', 'edition', 'assessment_mode', 'practice_mode', 'has_practice', 'has_boundary_case', 'references', 'contract_sha256']];
  for (const node of graph.nodes) {
    const lesson = node.lesson, card = node.lessonCard;
    rows.push([
      node.id, node.planningId, node.name, node.subdomain, node.nodeKind, node.contentStatus,
      card?.edition ?? '', card?.assessmentContract?.mode ?? node.assessmentMode ?? '', card?.practiceMode ?? '',
      lesson?.practice ? 'yes' : 'no', lesson?.boundary_case ? 'yes' : 'no',
      String(lesson?.references?.length ?? 0), card?.contractSha256 ?? ''
    ]);
  }
  const escape = value => { const s = String(value ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return rows.map(r => r.map(escape).join(',')).join('\r\n') + '\r\n';
}

function gitRevision() {
  try { return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return null; }
}

const args = process.argv.slice(2);
if (!existsSync(MAP)) { console.error(`No v3 map at ${MAP}. Run authoring/robotics-v3/build-preview.mjs --write first.`); process.exit(1); }

const inputs = loadInputs();
const before = validate(JSON.parse(readFileSync(MAP, 'utf8')));
const editions = [inputs.edition01, inputs.edition02, inputs.edition03].map(i => ({ metadata: i.data.metadata, lessons: i.data.lessons }));

const { graph, report } = applyLessons(before, { spec: inputs.spec.data, editions });
validate(graph);
const preservation = preservationDiff(before, graph);
// Idempotence, checked rather than asserted: applying the same editions to the result changes nothing.
const second = applyLessons(graph, { spec: inputs.spec.data, editions });
const stable = JSON.stringify(second.graph) === JSON.stringify(graph);

const answersBefore = before.nodes.filter(n => n.proficiency80 != null).length;
const answersAfter = graph.nodes.filter(n => n.proficiency80 != null).length;

// A review begun on the map as it is now must survive this import. The session is built against
// `before`, partly worked through, then resumed against the imported map: same skill on screen,
// same position, same answers, same skipped list. This is the migration the handoff asks for, and
// it is checked on the real map rather than asserted.
function sessionSurvives() {
  let session = startSession(before, 'unmarked', 1);
  if (session.queue.length < 4) return { checked: false, reason: 'the map has too few unmarked skills to review' };
  session = skip(session, currentId(session));
  const workedTo = currentId(session), position = session.position, skipped = [...session.skipped];
  const resumed = resumeCheck(session, graph);
  return {
    checked: true,
    ok: resumed.ok && currentId(resumed.session) === workedTo && resumed.session.position === position
      && JSON.stringify(resumed.session.skipped) === JSON.stringify(skipped) && !resumed.missing.length,
    reason: resumed.ok ? null : resumed.reason,
    keyBefore: mapKey(before), keyAfter: mapKey(graph),
    datasetKeyBefore: datasetKey(before), datasetKeyAfter: datasetKey(graph),
    titleChanged: before.title !== graph.title
  };
}
const session = sessionSurvives();

// The newest edition's package ships the export it was reconciled against. Comparing the result to
// that copy shows what this integration added, and proves the lessons that were already there came
// through untouched, using the package's own bytes rather than a claim in a summary.
function baselineDiff() {
  const file = BASELINE.map(r => path.join(ROOT, r)).find(existsSync);
  if (!file) return { compared: false, reason: 'no supplied baseline export found' };
  const base = JSON.parse(readFileSync(file, 'utf8'));
  const was = new Map(base.nodes.map(n => [n.id, n]));
  const gained = [], lessonChanged = [], otherFieldsChanged = [];
  for (const node of graph.nodes) {
    const old = was.get(node.id);
    if (!old) continue;
    if (!old.lesson && node.lesson) gained.push(node.id);
    else if (old.lesson && JSON.stringify(old.lesson) !== JSON.stringify(node.lesson)) lessonChanged.push(node.id);
    for (const key of PRESERVED) if (JSON.stringify(old[key]) !== JSON.stringify(node[key])) otherFieldsChanged.push(`${node.id}.${key}`);
  }
  return {
    compared: true, file: rel(file), sha256: sha256(file),
    lessonsBefore: base.nodes.filter(n => n.lesson).length,
    lessonsAfter: graph.nodes.filter(n => n.lesson).length,
    entriesGainedALesson: gained.length,
    existingLessonsChanged: lessonChanged,
    preservedFieldsChanged: otherFieldsChanged,
    titleBefore: base.title, titleAfter: graph.title,
    contentStatusBefore: base.nodes.reduce((t, n) => (t[n.contentStatus] = (t[n.contentStatus] || 0) + 1, t), {}),
    contentStatusAfter: graph.nodes.reduce((t, n) => (t[n.contentStatus] = (t[n.contentStatus] || 0) + 1, t), {})
  };
}

const summary = {
  generated: new Date().toISOString().slice(0, 10),
  sourceRevision: gitRevision(),
  inputs: Object.fromEntries(Object.entries(inputs).map(([name, i]) => [name, { file: i.relative, sha256: i.sha256 }])),
  map: { input: rel(MAP), output: rel(OUT_MAP), atlasFamilyBefore: atlasFamily(before), atlasFamilyAfter: atlasFamily(graph), title: graph.title },
  editions: editions.map(e => ({ edition: e.metadata.edition, authored: e.metadata.authored, supplied: e.lessons.length, selection: e.metadata.selection })),
  titleChange: { before: before.title, after: graph.title, reviewSessionsKeptBy: `metadata.datasetKey = ${JSON.stringify(datasetKey(graph))}` },
  counts: report.counts,
  expected: { uniqueAuthoredCards: 254, pendingAssessable: 126, roadmapEntries: 1, mapEntries: 381 },
  reconciliation: {
    imported: report.counts.imported,
    skipped: report.counts.skipped,
    conflicts: report.conflicted.map(c => ({ planningId: c.planningId, runtimeId: c.runtimeId, edition: c.edition, problems: c.problems })),
    existingLessonsKeptOverEdition: report.superseded,
    nodesGivenLessonContent: report.applied.length,
    nodesChangedWithoutLessonContent: report.changed.filter(id => !report.applied.includes(id)).length,
    entriesRelabelled: report.relabelled.length,
    nodesUnchanged: report.unchanged.length
  },
  // What the newest edition added, measured against the export its package was built from. This
  // stays true after the import has been re-run, when the run itself changes nothing.
  sinceSuppliedBaseline: baselineDiff(),
  preservation: {
    problems: preservation,
    proficiencyAnswersBefore: answersBefore,
    proficiencyAnswersAfter: answersAfter,
    edgesUnchanged: JSON.stringify(before.edges) === JSON.stringify(graph.edges),
    positionsUnchanged: before.nodes.every((n, i) => JSON.stringify(n.position) === JSON.stringify(graph.nodes[i].position)),
    levelsUnchanged: before.nodes.every((n, i) => n.skillLevel === graph.nodes[i].skillLevel),
    pinsUnchanged: before.nodes.every((n, i) => n.pinned === graph.nodes[i].pinned),
    nodeOrderUnchanged: before.nodes.map(n => n.id).join() === graph.nodes.map(n => n.id).join(),
    reviewOrderUnchanged: buildQueue(before, 'all').join() === buildQueue(graph, 'all').join(),
    reviewSessionsPreserved: session.checked ? session.ok : 'not checked',
    reviewSession: session
  },
  idempotent: stable,
  limitations: [
    'The lessons are introductory cards. They are not a complete course, an exhaustive question bank or evidence of practical mastery. Extended lesson and practice authoring is still pending for every entry, including the ones with a card.',
    `${report.counts.pending} assessable entries still have no authored introductory lesson, and ${report.counts.roadmap} roadmap entry is not assessed.`,
    'Introductory content coverage is not proficiency and not a physical milestone. Nothing here says a skill has been demonstrated.',
    'No proficiency answer is read, written or inferred by this import.',
    'The teaching labs are supplemental offline material and are not wired into the application. The edition 03 lab needs NumPy, models planar kinematics only, and has no hardware interface.',
    `The map title restates the counts. Guided-review sessions now key on metadata.datasetKey (${JSON.stringify(datasetKey(graph))}) rather than the title, and a session saved under the earlier title is migrated by its node set, so progress and queue position survive this rename. Review order is unchanged: it comes from saved heights, names and ids, none of which this patch touches.`
  ]
};

const expected = summary.expected;
const baseline = summary.sinceSuppliedBaseline;
const ok = summary.preservation.reviewOrderUnchanged && summary.preservation.reviewSessionsPreserved && !preservation.length && stable
  && (!baseline.compared || (!baseline.existingLessonsChanged.length && !baseline.preservedFieldsChanged.length))
  && report.counts.imported === expected.uniqueAuthoredCards && report.counts.authored === expected.uniqueAuthoredCards
  && report.counts.pending === expected.pendingAssessable && report.counts.roadmap === expected.roadmapEntries
  && report.counts.mapNodes === expected.mapEntries && answersBefore === answersAfter && atlasFamily(before) === atlasFamily(graph);
summary.result = ok ? 'passed' : 'review required';

console.log(JSON.stringify(summary, null, 2));
if (report.conflicted.length) console.log(`\n${report.conflicted.length} lessons were NOT applied. See reconciliation.conflicts above.`);
if (!args.includes('--write')) { console.log('\nDry run: nothing written. Add --write to apply the import.'); process.exit(ok ? 0 : 1); }
if (!ok) { console.error('\nRefusing to write: the checks above did not all pass.'); process.exit(1); }

function writeAtomic(file, content) { const temp = `${file}.${process.pid}.tmp`; writeFileSync(temp, content); renameSync(temp, file); }
writeAtomic(OUT_MAP, JSON.stringify(graph, null, 2) + '\n');
writeAtomic(OUT_LEDGER, ledger(graph));
writeAtomic(OUT_SUMMARY, JSON.stringify(summary, null, 2) + '\n');
console.log(`\nWrote ${OUT_MAP}`);
console.log(`Wrote ${OUT_LEDGER}`);
console.log(`Wrote ${OUT_SUMMARY}`);
console.log('\nThe original Skill Solar System map and the shared proficiency record were neither read for answers nor written.');
