// Builds the Edition 09 package (Tasks/TASKS.md, Task 9) from the authored lesson text.
//
//   node authoring/lessons/build-edition09.mjs
//
// The 21 targets are V3 entries, so every field the specification decides (name, branch, ids,
// requires, depth, contract fingerprint, demonstration, assessment contract) is copied from V3's
// reviewed specification, never retyped. The authored fields come from
// authoring/lessons/edition-09/lessons-source.json. Modelled on build-edition08.mjs.
//
// Writes the lessons, the readable lessons, the targets and the two CSVs into
// authoring/lessons/edition-09/ (tracked), then assembles the full package in
// packages/core-lessons-learning-edition-09/ with its baseline/ evidence. Run check_package.py there.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { contractHash } from '../robotics-v3/lessons.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SRC = path.join(ROOT, 'authoring', 'lessons', 'edition-09');
const PKG = path.join(ROOT, 'packages', 'core-lessons-learning-edition-09');
const MAP = path.join(ROOT, 'Maps', 'Robotics-Atlas.json');
const SPEC = path.join(ROOT, 'packages', 'robotics-curriculum-v3', 'Robotics-Reviewed-Specification.json');
export const EDITION = 'core-lessons-09';
const NAME = 'Core';

const read = file => JSON.parse(readFileSync(file, 'utf8'));
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const source = read(path.join(SRC, 'lessons-source.json')), map = read(MAP), spec = read(SPEC);
const byId = new Map(map.nodes.map(n => [n.id, n]));
const byPlanning = new Map(map.nodes.filter(n => n.planningId).map(n => [n.planningId, n]));
const entries = new Map(spec.nodes.map(e => [e.id, e]));
const listed = names => names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;

// What an entry leads to in the map, by name: the V3 entries it is a prerequisite of; all of them if none.
const prepares = node => {
  const next = map.edges.filter(e => e.type === 'prerequisite' && e.source === node.id).map(e => byId.get(e.target));
  const chosen = next.filter(n => n.planningId);
  return (chosen.length ? chosen : next).length ? listed((chosen.length ? chosen : next).map(n => n.name)) : null;
};

const lessons = source.order.map(id => {
  const s = entries.get(id), a = source.lessons[id], node = byPlanning.get(id);
  if (!s || !a || !node) throw Error(`No specification entry, authored text or map entry for ${id}.`);
  if (node.lesson) throw Error(`${id} already has a lesson.`);
  const preparesFor = prepares(node);
  const why = preparesFor ? `Prepares for ${preparesFor}.` : `A core robotics outcome in its own right (${node.subdomain}).`;
  // Field order: Edition 06's 25 fields, then decision 14's two (as Editions 07 and 08).
  return {
    id, explanation: a.explanation, worked_example: a.worked_example, practice: a.practice, boundary_case: a.boundary_case,
    name: s.name, branch: s.branch, planning_id: id, proposed_runtime_id: s.runtime_identity.proposed_id, requires: s.requires,
    dependency_depth: s.dependency_depth, node_contract_sha256: contractHash(s), content_status: 'introductory_lesson_authored',
    proficiency_write: false, instructional_scope: source.shared.instructional_scope, full_demonstration: s.demonstration,
    assessment_contract: s.assessment_contract, practice_mode: a.practice_mode, why_it_matters: why,
    evidence_policy: source.shared.evidence_policy, required_future_work: a.required_future_work, references: [],
    details: `${a.explanation}\n\n${a.worked_example}`,
    placement_note: `Builds on ${listed(s.requires.map(r => byPlanning.get(r).name))}. ${why}`,
    assessment_rule: source.shared.assessment_rule,
    requires_physical_evidence: a.requires_physical_evidence, evidence_kind: a.evidence_kind
  };
});

const targets = {
  extracted: '2026-11-05',
  purpose: 'The 21 V3 entries on the core robotics paths, outside the I05 path, that Edition 09 gives a lesson (step 7, Part 2).',
  source: { file: 'Maps/Robotics-Atlas.json', sha256: sha(MAP), nodes: map.nodes.length, edges: map.edges.length, datasetKey: map.metadata.datasetKey, atlasFamily: map.metadata.atlasFamily },
  targetCount: lessons.length,
  targets: source.order.map(id => ({ planningId: id, runtimeId: byPlanning.get(id).id, node: byPlanning.get(id), specification: entries.get(id), nodeContractSha256: contractHash(entries.get(id)),
    directPrerequisites: entries.get(id).requires.map(r => ({ planningId: r, id: byPlanning.get(r).id, name: byPlanning.get(r).name, hasLesson: !!byPlanning.get(r).lesson, inThisSet: source.order.includes(r) })) }))
};

const lessonCount = map.nodes.filter(n => n.lesson).length;
const doc = {
  metadata: {
    artifact_type: 'content_patch_not_map', edition: EDITION, authored: '2026-11-05', author: 'Claude Code, at JC\'s request (step 7 Checkpoint A, E3)',
    baseline_spec_version: spec.metadata.version, baseline_spec_sha256: sha(SPEC), confirmed_export_sha256: sha(MAP),
    dataset_key: map.metadata.datasetKey, lesson_count: lessons.length, expected_prior_lessons: lessonCount, cumulative_unique_lessons: lessonCount + lessons.length,
    selection: 'Step 7 Group B (E1): the V3 entries on the core robotics paths, outside the I05 path, without a lesson.', proficiency_write: false
  },
  lessons
};

const csv = value => /[",\n]/.test(String(value)) ? `"${String(value).replaceAll('"', '""')}"` : String(value);
const rows = r => r.map(row => row.map(csv).join(',')).join('\r\n') + '\r\n';
const sequence = rows([['Order', 'Planning ID', 'Name', 'Requires'], ...lessons.map((l, i) => [i + 1, l.id, l.name, l.requires.join(' ')])]);
const ledger = rows([['Planning ID', 'Name', 'Authoring status'], ...lessons.map(l => [l.id, l.name, 'introductory card authored; integration pending'])]);

const cards = ['# Core Lessons - Learning Edition 09', '',
  `${lessons.length} introductory cards for the V3 entries on the core robotics paths outside the I05 path. With them and Edition 08, every core skill except the orientation overview r-singular has a card. They do not mark proficiency and demonstrate no physical robot. Every number, including the simulations, is recomputed by core2_lab.py.`, ''];
for (const l of lessons) cards.push(`## ${l.id} - ${l.name}`, '', `**Prerequisites:** ${l.requires.join(', ')}`, '', `**Why it matters:** ${l.why_it_matters}`, '', l.explanation, '',
  `**Worked example:** ${l.worked_example}`, '', `**Practice:** ${l.practice.question}`, '', `<details><summary>Practice answer</summary>\n\n${l.practice.answer}\n\n</details>`, '',
  `**Boundary or misconception check:** ${l.boundary_case.question}`, '', `<details><summary>Boundary answer</summary>\n\n${l.boundary_case.answer}\n\n</details>`, '',
  `**Full demonstration:** ${l.full_demonstration}`, '', `**Evidence expectations:** ${l.assessment_contract.acceptance} Record ${l.assessment_contract.evidence_record.join('; ')}.`, '',
  `**Real-hardware evidence needed:** ${l.requires_physical_evidence ? `yes (${l.evidence_kind})` : 'no'}`, '', `**Practice mode:** ${l.practice_mode}`, '', `**Remaining work:** ${l.required_future_work}`, '');

const LESSONS_FILE = `${NAME}-Lessons-09.json`, READABLE = `${NAME}-Learning-Edition-09.md`, TARGETS = 'Edition09-Targets.json';
writeFileSync(path.join(SRC, LESSONS_FILE), JSON.stringify(doc, null, 2) + '\n');
writeFileSync(path.join(SRC, READABLE), cards.join('\n'));
writeFileSync(path.join(SRC, TARGETS), JSON.stringify(targets, null, 2) + '\n');
writeFileSync(path.join(SRC, 'Study-Sequence.csv'), sequence);
writeFileSync(path.join(SRC, 'Content-Status-Ledger.csv'), ledger);

mkdirSync(path.join(PKG, 'baseline'), { recursive: true });
for (const f of [LESSONS_FILE, READABLE, 'Study-Sequence.csv', 'Content-Status-Ledger.csv', 'README.md', 'INTEGRATION.md', 'Workbook.md', 'core2_lab.py', 'check_package.py', 'requirements.txt', 'lessons-source.json'])
  copyFileSync(path.join(SRC, f), path.join(PKG, f));
copyFileSync(MAP, path.join(PKG, 'baseline', 'Confirmed-Working-Map.json'));
copyFileSync(SPEC, path.join(PKG, 'baseline', 'Robotics-Reviewed-Specification.json'));
copyFileSync(path.join(SRC, TARGETS), path.join(PKG, 'baseline', TARGETS));
console.log(`Wrote ${lessons.length} lessons to ${path.relative(ROOT, SRC)} and assembled ${path.relative(ROOT, PKG)}. Next: python check_package.py in the package folder.`);
