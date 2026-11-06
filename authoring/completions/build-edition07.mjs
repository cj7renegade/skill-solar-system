// Builds the Edition 07 package (Tasks/TASKS.md, Task 5) from the authored lesson text.
//
//   node authoring/completions/build-edition07.mjs
//
// The authored fields come from authoring/completions/edition-07/lessons-source.json. Every field
// that the specification or the map decides (name, branch, ids, requires, depth, contract
// fingerprint, demonstration, assessment contract, placement) is copied from
// Edition07-Targets.json, never retyped, so a lesson cannot drift from what it is checked against.
//
// Writes the lessons, the readable lessons and the two CSVs into authoring/completions/edition-07/
// (tracked), then assembles the full package in packages/robotics-completions-learning-edition-07/
// with its baseline/ evidence (not tracked: the baseline map is 7.8 MB). Run check_package.py there.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SRC = path.join(ROOT, 'authoring', 'completions', 'edition-07');
const PKG = path.join(ROOT, 'packages', 'robotics-completions-learning-edition-07');
const TARGETS = path.join(ROOT, 'authoring', 'robotics-v3', 'Edition07-Targets.json');
const SPEC = path.join(ROOT, 'packages', 'robotics-curriculum-v3', 'Robotics-Reviewed-Specification.json');
const APPROVED = path.join(ROOT, 'scope', 'completions', 'new-skills.json');
export const EDITION = 'robotics-completions-07';
const NAME = 'Robotics-Completions';

const read = file => JSON.parse(readFileSync(file, 'utf8'));
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const source = read(path.join(SRC, 'lessons-source.json')), targets = read(TARGETS);
const map = read(targets.source.file);
if (sha(targets.source.file) !== targets.source.sha256) throw Error('The structure map has changed since the targets were extracted. Re-run extract-targets.mjs.');
const byId = new Map(map.nodes.map(n => [n.id, n]));
const listed = names => names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;

// What a target leads to in the map: the V3 entries it is a prerequisite of, or, when it is
// optional, the entries it supports.
function prepares(target) {
  const out = type => map.edges.filter(e => e.type === type && e.source === target.runtimeId).map(e => byId.get(e.target)).filter(n => n.planningId);
  const required = out('prerequisite');
  return required.length ? listed(required.map(n => n.name)) : `${listed(out('supports').map(n => n.name))} (optional preparation)`;
}

const specNames = new Map([...read(SPEC).nodes, ...read(APPROVED).skills.map(s => s.specification)].map(n => [n.id, n.name]));
const lessons = source.order.map(id => {
  const t = targets.targets.find(x => x.planningId === id), a = source.lessons[id], s = t.specification;
  if (!t || !a) throw Error(`No target or no authored text for ${id}.`);
  const preparesFor = prepares(t);
  // Field order: Edition 06's 25 fields, then decision 14's two.
  return {
    id, explanation: a.explanation, worked_example: a.worked_example, practice: a.practice, boundary_case: a.boundary_case,
    name: s.name, branch: s.branch, planning_id: id, proposed_runtime_id: s.runtime_identity.proposed_id, requires: s.requires,
    dependency_depth: s.dependency_depth, node_contract_sha256: t.nodeContractSha256, content_status: 'introductory_lesson_authored',
    proficiency_write: false, instructional_scope: source.shared.instructional_scope, full_demonstration: s.demonstration,
    assessment_contract: s.assessment_contract, practice_mode: a.practice_mode, why_it_matters: `Prepares for ${preparesFor}.`,
    evidence_policy: source.shared.evidence_policy, required_future_work: a.required_future_work, references: [],
    details: `${a.explanation}\n\n${a.worked_example}`,
    placement_note: `Builds on ${listed(s.requires.map(r => specNames.get(r)))}. Prepares for ${preparesFor}.`,
    assessment_rule: source.shared.assessment_rule,
    requires_physical_evidence: a.requires_physical_evidence, evidence_kind: a.evidence_kind
  };
});

const lessonCount = map.nodes.filter(n => n.lesson).length, planned = map.nodes.filter(n => n.planningId);
const doc = {
  metadata: {
    artifact_type: 'content_patch_not_map', edition: EDITION, authored: '2026-11-05', author: 'Claude Code, at JC\'s request (Checkpoint A, C5)',
    baseline_spec_version: read(SPEC).metadata.version, baseline_spec_sha256: sha(SPEC), specification_extension_sha256: sha(APPROVED),
    confirmed_export_sha256: targets.source.sha256, dataset_key: map.metadata.datasetKey, lesson_count: lessons.length,
    expected_prior_lessons: lessonCount, cumulative_unique_lessons: lessonCount + lessons.length, milestone: 'I05',
    selection: 'Checkpoint A, C1 (a): the six V3 entries in the I05 chain without a lesson, plus the two new skills P11 and A12.',
    pending_assessable_after_import: planned.filter(n => n.contentStatus === 'introductory lesson pending').length - lessons.length,
    roadmap_entries: planned.filter(n => n.contentStatus === 'roadmap note, not assessed').length, proficiency_write: false
  },
  lessons
};

const csv = value => /[",\n]/.test(String(value)) ? `"${String(value).replaceAll('"', '""')}"` : String(value);
const rows = r => r.map(row => row.map(csv).join(',')).join('\r\n') + '\r\n';
const sequence = rows([['Order', 'Planning ID', 'Name', 'Requires'], ...lessons.map((l, i) => [i + 1, l.id, l.name, l.requires.join(' ')])]);
const added = new Map(lessons.map(l => [l.id, l]));
const ledger = rows([['Planning ID', 'Name', 'Authoring status', 'Integration evidence'],
  ...planned.map(n => [n.planningId, n.name,
    added.has(n.planningId) || n.lesson ? 'introductory card authored' : n.contentStatus === 'roadmap note, not assessed' ? 'roadmap note, not assessed' : 'introductory card pending',
    added.has(n.planningId) ? 'Edition 07 package; integration pending' : n.lesson ? `confirmed ${n.lessonCard.edition}` : 'confirmed structure map'])]);

const cards = [`# Robotics Completions - Learning Edition 07`, '',
  `${lessons.length} introductory cards: the six V3 entries the merge left in the I05 chain without a lesson, and the two new skills P11 and A12. They do not mark proficiency and demonstrate no physical robot. Every number in a worked example or an answer is recomputed by completions_lab.py.`, ''];
for (const l of lessons) cards.push(`## ${l.id} - ${l.name}`, '', `**Prerequisites:** ${l.requires.join(', ')}`, '', `**Why it matters:** ${l.why_it_matters}`, '', l.explanation, '',
  `**Worked example:** ${l.worked_example}`, '', `**Practice:** ${l.practice.question}`, '', `<details><summary>Practice answer</summary>\n\n${l.practice.answer}\n\n</details>`, '',
  `**Boundary or misconception check:** ${l.boundary_case.question}`, '', `<details><summary>Boundary answer</summary>\n\n${l.boundary_case.answer}\n\n</details>`, '',
  `**Full demonstration:** ${l.full_demonstration}`, '', `**Evidence expectations:** ${l.assessment_contract.acceptance} Record ${l.assessment_contract.evidence_record.join('; ')}.`, '',
  `**Real-hardware evidence needed:** ${l.requires_physical_evidence ? `yes (${l.evidence_kind})` : 'no'}`, '', `**Practice mode:** ${l.practice_mode}`, '', `**Remaining work:** ${l.required_future_work}`, '');

const LESSONS_FILE = `${NAME}-Lessons-07.json`, READABLE = `${NAME}-Learning-Edition-07.md`;
writeFileSync(path.join(SRC, LESSONS_FILE), JSON.stringify(doc, null, 2) + '\n');
writeFileSync(path.join(SRC, READABLE), cards.join('\n'));
writeFileSync(path.join(SRC, 'Study-Sequence.csv'), sequence);
writeFileSync(path.join(SRC, 'Content-Status-Ledger.csv'), ledger);

mkdirSync(path.join(PKG, 'baseline'), { recursive: true });
for (const f of [LESSONS_FILE, READABLE, 'Study-Sequence.csv', 'Content-Status-Ledger.csv', 'README.md', 'INTEGRATION.md', 'Workbook.md', 'completions_lab.py', 'check_package.py', 'requirements.txt', 'lessons-source.json'])
  copyFileSync(path.join(SRC, f), path.join(PKG, f));
copyFileSync(targets.source.file, path.join(PKG, 'baseline', 'Confirmed-Structure-Map.json'));
copyFileSync(SPEC, path.join(PKG, 'baseline', 'Robotics-Reviewed-Specification.json'));
copyFileSync(APPROVED, path.join(PKG, 'baseline', 'Approved-New-Skills.json'));
copyFileSync(TARGETS, path.join(PKG, 'baseline', 'Edition07-Targets.json'));
console.log(`Wrote ${lessons.length} lessons to ${path.relative(ROOT, SRC)} and assembled ${path.relative(ROOT, PKG)}. Next: python check_package.py in the package folder.`);
