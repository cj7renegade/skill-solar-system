// Builds the Edition 08 package (Tasks/TASKS.md, Task 4) from the authored lesson text.
//
//   node authoring/lessons/build-edition08.mjs
//
// The authored fields come from authoring/lessons/edition-08/lessons-source.json. Every field the
// approved specification or the map decides (name, branch, ids, requires, depth, contract
// fingerprint, demonstration, assessment contract, placement) is copied from
// scope/lessons/master-specifications.json and the working map, never retyped, so a lesson cannot
// drift from what it is checked against. Modelled on authoring/completions/build-edition07.mjs.
//
// Writes the lessons, the readable lessons, the targets and the two CSVs into
// authoring/lessons/edition-08/ (tracked), then assembles the full package in
// packages/core-lessons-learning-edition-08/ with its baseline/ evidence (not tracked: the baseline
// map is 8 MB). Run check_package.py there.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { contractHash } from '../robotics-v3/lessons.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SRC = path.join(ROOT, 'authoring', 'lessons', 'edition-08');
const PKG = path.join(ROOT, 'packages', 'core-lessons-learning-edition-08');
const MAP = path.join(ROOT, 'Maps', 'Robotics-Atlas.json');
const SPEC = path.join(ROOT, 'packages', 'robotics-curriculum-v3', 'Robotics-Reviewed-Specification.json');
const MASTER = path.join(ROOT, 'scope', 'lessons', 'master-specifications.json');
export const EDITION = 'core-lessons-08';
const NAME = 'Core';

const read = file => JSON.parse(readFileSync(file, 'utf8'));
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const source = read(path.join(SRC, 'lessons-source.json')), master = read(MASTER), map = read(MAP);
if (master.status !== 'APPROVED') throw Error('The master-skill specifications are not approved (Checkpoint A).');
if (master.baseMap.sha256 !== sha(MAP)) throw Error('The working map has changed since the specifications were approved.');
const byId = new Map(map.nodes.map(n => [n.id, n]));
const entries = new Map(master.entries.map(e => [e.id, e]));
const listed = names => names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;

// What a skill leads to in the map, by name: the skills it is a prerequisite of on the I05 path, which
// is what these lessons serve; all of them if none is on it.
const parents = new Map();
for (const e of map.edges) if (e.type === 'prerequisite') (parents.get(e.target) || parents.set(e.target, []).get(e.target)).push(e.source);
const onPath = new Set(['rob3:I05']);
for (const stack = ['rob3:I05']; stack.length;) for (const p of parents.get(stack.pop()) || []) if (!onPath.has(p)) { onPath.add(p); stack.push(p); }
const prepares = id => {
  const next = map.edges.filter(e => e.type === 'prerequisite' && e.source === id).map(e => e.target);
  const chosen = next.filter(t => onPath.has(t));
  return listed((chosen.length ? chosen : next).map(t => byId.get(t).name));
};

const lessons = source.order.map(id => {
  const s = entries.get(id), a = source.lessons[id], node = byId.get(id);
  if (!s || !a || !node) throw Error(`No approved entry, authored text or map skill for ${id}.`);
  if (node.lesson) throw Error(`${id} already has a lesson.`);
  const preparesFor = prepares(id);
  // Field order: Edition 06's 25 fields, then decision 14's two (as Edition 07).
  return {
    id, explanation: a.explanation, worked_example: a.worked_example, practice: a.practice, boundary_case: a.boundary_case,
    name: s.name, branch: s.branch, planning_id: id, proposed_runtime_id: s.runtime_identity.proposed_id, requires: s.requires,
    dependency_depth: s.dependency_depth, node_contract_sha256: contractHash(s), content_status: 'introductory_lesson_authored',
    proficiency_write: false, instructional_scope: source.shared.instructional_scope, full_demonstration: s.demonstration,
    assessment_contract: s.assessment_contract, practice_mode: a.practice_mode, why_it_matters: `Prepares for ${preparesFor}.`,
    evidence_policy: source.shared.evidence_policy, required_future_work: a.required_future_work, references: [],
    details: `${a.explanation}\n\n${a.worked_example}`,
    placement_note: s.requires.length ? `Builds on ${listed(s.requires.map(r => byId.get(r).name))}. Prepares for ${preparesFor}.` : `A starting point on the I05 path. Prepares for ${preparesFor}.`,
    assessment_rule: source.shared.assessment_rule,
    requires_physical_evidence: a.requires_physical_evidence, evidence_kind: a.evidence_kind
  };
});
const missing = master.entries.filter(e => !source.order.includes(e.id)).map(e => e.id);
if (missing.length) throw Error(`Approved entries without a lesson: ${missing.join(', ')}.`);

// The targets, as Edition 07's Edition07-Targets.json: each skill's map record and its entry.
const targets = {
  extracted: '2026-11-05',
  purpose: 'The 23 master-only skills on the I05 path that Edition 08 gives a lesson (step 7, Part 1), with their approved specification entries.',
  source: { file: 'Maps/Robotics-Atlas.json', sha256: sha(MAP), nodes: map.nodes.length, edges: map.edges.length, datasetKey: map.metadata.datasetKey, atlasFamily: map.metadata.atlasFamily },
  targetCount: lessons.length,
  targets: source.order.map(id => ({ id, node: byId.get(id), specification: entries.get(id), nodeContractSha256: contractHash(entries.get(id)),
    directPrerequisites: entries.get(id).requires.map(r => ({ id: r, name: byId.get(r).name, hasLesson: !!byId.get(r).lesson, inThisSet: entries.has(r) })) }))
};

const lessonCount = map.nodes.filter(n => n.lesson).length;
const doc = {
  metadata: {
    artifact_type: 'content_patch_not_map', edition: EDITION, authored: '2026-11-05', author: 'Claude Code, at JC\'s request (step 7 Checkpoint A, E3)',
    baseline_spec_version: read(SPEC).metadata.version, master_specifications_sha256: sha(MASTER), confirmed_export_sha256: sha(MAP),
    dataset_key: map.metadata.datasetKey, lesson_count: lessons.length, expected_prior_lessons: lessonCount, cumulative_unique_lessons: lessonCount + lessons.length,
    milestone: 'I05', selection: 'Step 7 Group A (E1): the master-only skills on the I05 path without a lesson.', proficiency_write: false
  },
  lessons
};

const csv = value => /[",\n]/.test(String(value)) ? `"${String(value).replaceAll('"', '""')}"` : String(value);
const rows = r => r.map(row => row.map(csv).join(',')).join('\r\n') + '\r\n';
const sequence = rows([['Order', 'Skill', 'Name', 'Requires'], ...lessons.map((l, i) => [i + 1, l.id, l.name, l.requires.join(' ')])]);
const ledger = rows([['Skill', 'Name', 'Authoring status'], ...lessons.map(l => [l.id, l.name, 'introductory card authored; integration pending'])]);

const cards = ['# Core Lessons - Learning Edition 08', '',
  `${lessons.length} introductory cards for the master-only skills on the I05 path. With them, every skill the I05 milestone depends on has a card. They do not mark proficiency and demonstrate no physical robot. Every number in a worked example or an answer is recomputed by core_lab.py. The planar-arm examples use a 0.5 m and 0.25 m arm; the integrated cards K05-K07 (Edition 07) use a 0.4 m and 0.3 m arm.`, ''];
for (const l of lessons) cards.push(`## ${l.id} - ${l.name}`, '', `**Prerequisites:** ${l.requires.join(', ') || 'none'}`, '', `**Why it matters:** ${l.why_it_matters}`, '', l.explanation, '',
  `**Worked example:** ${l.worked_example}`, '', `**Practice:** ${l.practice.question}`, '', `<details><summary>Practice answer</summary>\n\n${l.practice.answer}\n\n</details>`, '',
  `**Boundary or misconception check:** ${l.boundary_case.question}`, '', `<details><summary>Boundary answer</summary>\n\n${l.boundary_case.answer}\n\n</details>`, '',
  `**Full demonstration:** ${l.full_demonstration}`, '', `**Evidence expectations:** ${l.assessment_contract.acceptance} Record ${l.assessment_contract.evidence_record.join('; ')}.`, '',
  `**Real-hardware evidence needed:** ${l.requires_physical_evidence ? `yes (${l.evidence_kind})` : 'no'}`, '', `**Practice mode:** ${l.practice_mode}`, '', `**Remaining work:** ${l.required_future_work}`, '');

const LESSONS_FILE = `${NAME}-Lessons-08.json`, READABLE = `${NAME}-Learning-Edition-08.md`, TARGETS = 'Edition08-Targets.json';
writeFileSync(path.join(SRC, LESSONS_FILE), JSON.stringify(doc, null, 2) + '\n');
writeFileSync(path.join(SRC, READABLE), cards.join('\n'));
writeFileSync(path.join(SRC, TARGETS), JSON.stringify(targets, null, 2) + '\n');
writeFileSync(path.join(SRC, 'Study-Sequence.csv'), sequence);
writeFileSync(path.join(SRC, 'Content-Status-Ledger.csv'), ledger);

mkdirSync(path.join(PKG, 'baseline'), { recursive: true });
for (const f of [LESSONS_FILE, READABLE, 'Study-Sequence.csv', 'Content-Status-Ledger.csv', 'README.md', 'INTEGRATION.md', 'Workbook.md', 'core_lab.py', 'check_package.py', 'requirements.txt', 'lessons-source.json'])
  copyFileSync(path.join(SRC, f), path.join(PKG, f));
copyFileSync(MAP, path.join(PKG, 'baseline', 'Confirmed-Working-Map.json'));
copyFileSync(SPEC, path.join(PKG, 'baseline', 'Robotics-Reviewed-Specification.json'));
copyFileSync(MASTER, path.join(PKG, 'baseline', 'Master-Specifications.json'));
copyFileSync(path.join(SRC, TARGETS), path.join(PKG, 'baseline', TARGETS));
console.log(`Wrote ${lessons.length} lessons to ${path.relative(ROOT, SRC)} and assembled ${path.relative(ROOT, PKG)}. Next: python check_package.py in the package folder.`);
