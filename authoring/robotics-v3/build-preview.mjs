// Builds a reversible, isolated preview map from the reviewed robotics curriculum specification
// (v3). The specification is a planning schema, not runtime JSON: it carries branches, kinds,
// tiers and assessment contracts the application has no renderer for. This tool maps it onto the
// schema the app actually validates, and changes nothing about the existing atlas.
//
//   node authoring/robotics-v3/build-preview.mjs            dry run: report only
//   node authoring/robotics-v3/build-preview.mjs --write    write the preview map and the ledgers
//
// Identity is deliberately isolated. Runtime ids are the specification's own `rob3:` proposals and
// the map declares metadata.atlasFamily = robotics-foundations-integration-v3-review, so the
// existing atlas family (sss-robotics-foundations-2026-09) can never share answers with it. Every
// node starts unmarked; no source equivalence is approved, so source ids are kept as lineage only.
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { validate, levels } from '../../src/model.js';
import { arrangeVortex } from '../../src/vortex.js';
import { DOMAIN_ICON } from '../../src/icons.js';
import { atlasFamily } from '../../src/proficiency.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SPEC = path.join(ROOT, 'packages', 'robotics-curriculum-v3', 'Robotics-Reviewed-Specification.json');
const OUT_DIR = path.join(ROOT, 'Maps', 'Robotics-v3');
const OUT_MAP = path.join(OUT_DIR, 'Robotics-v3-Preview.json');
const OUT_LEDGER = path.join(OUT_DIR, 'Content-Completion-Ledger.csv');

export const FAMILY = 'robotics-foundations-integration-v3-review';
export const TITLE = 'Robotics curriculum v3 — preview (planning specification, lessons pending)';
// The specification records the atlas it was reviewed against. A later change to that file must be
// noticed rather than silently treated as the same snapshot.
export const EXPECTED_SOURCE_SHA256 = '8e170740169f857458109f50a46b1d7feabb98e4add850350261fce8c22dba51';

// The app validates six fixed domains (src/model.js DOMAINS) and has no branch concept. Branches
// are mapped to the nearest existing domain for colour and legend only, and the exact branch label
// is preserved in `subdomain`, so no curriculum information is lost and no edge is altered.
export const BRANCH_DOMAIN = {
  'Mathematics': 'Mathematics',
  'Physics': 'Physics',
  'Electronics': 'Electronics',
  'Electrical power, interfaces and measurement': 'Electronics',
  'Mechanics': 'Mechanics',
  'CAD, fabrication and mechanical design': 'Mechanics',
  'Computing': 'Computing',
  'Software and embedded implementation': 'Computing',
  'Robot geometry and kinematics': 'Robotics',
  'Actuation and transmissions': 'Robotics',
  'Sensing, calibration and estimation': 'Robotics',
  'Control and trajectories': 'Robotics',
  'Wheeled mobility and navigation': 'Robotics',
  'Manipulation and combined tasks': 'Robotics',
  'Verification, diagnosis and reliability': 'Robotics',
  'Requirements and systems practice': 'Robotics',
  'Systems practice': 'Robotics',
  'Integration milestones': 'Robotics',
  'Advanced pathways': 'Robotics'
};

const clip = (text, limit) => { const s = String(text ?? '').trim(); return s.length <= limit ? s : `${s.slice(0, limit - 1)}…`; };
const line = value => String(value ?? '').replace(/\s+/g, ' ').trim();

// Everything the preview shows for one entry. The specification has no authored lesson for any
// node, so the body states the scope and the assessment contract and says plainly that the lesson
// is still to be written. It must never read as finished instructional content.
function details(entry) {
  const scope = entry.scope_contract || {}, assess = entry.assessment_contract || {};
  const parts = [];
  parts.push(`LESSON NOT YET AUTHORED. This entry carries its reviewed scope and assessment contract from the v3 curriculum specification. It is a planning record, not a finished lesson.`);
  const body = [];
  if (scope.learning_target) body.push(`Learning target: ${line(scope.learning_target)}`);
  if (scope.completion_evidence) body.push(`Completion evidence: ${line(scope.completion_evidence)}`);
  if (scope.boundary) body.push(`Boundary: ${line(scope.boundary)}`);
  if (assess.mode) body.push(`Assessment mode: ${line(assess.mode)}`);
  if (assess.task) body.push(`Task: ${line(assess.task)}`);
  if (assess.case_requirements) body.push(`Cases required: ${line(assess.case_requirements)}`);
  if (assess.acceptance) body.push(`Acceptance: ${line(assess.acceptance)}`);
  if (assess.status) body.push(`Status: ${line(assess.status)}`);
  if (assess.answer_policy) body.push(`Answer policy: ${line(assess.answer_policy)}`);
  if (entry.migration) body.push(`Lineage: ${line(entry.migration)}`);
  if ((entry.existing_candidates || []).length) body.push(`Existing atlas candidates (not approved as equivalent): ${entry.existing_candidates.join(', ')}`);
  if (entry.source_explanation_unreviewed) body.push(`An unreviewed source explanation exists for this entry and must be reviewed before use.`);
  parts.push(body.join('\n'));
  return clip(parts.join('\n\n'), 12000);
}

function placementNote(entry) {
  const bits = [`${entry.kind} entry in the ${entry.branch} branch`];
  if (entry.tier) bits.push(`${entry.tier} tier`);
  if (entry.path_role) bits.push(entry.path_role);
  const feeds = (entry.feeds_milestones || []).join(', ');
  return clip(`${bits.join(', ')}.${feeds ? ` Feeds ${feeds}.` : ''}`, 12000);
}

export function buildPreview(spec, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const unknownBranch = [...new Set(spec.nodes.map(n => n.branch))].filter(b => !BRANCH_DOMAIN[b]);
  if (unknownBranch.length) throw Error(`No domain mapping for branch: ${unknownBranch.join('; ')}`);

  const idFor = new Map(spec.nodes.map(n => [n.id, n.runtime_identity?.proposed_id]));
  for (const [planningId, runtimeId] of idFor) if (!runtimeId) throw Error(`${planningId} has no proposed runtime id.`);

  const nodes = spec.nodes.map(entry => {
    const domain = BRANCH_DOMAIN[entry.branch];
    return {
      id: idFor.get(entry.id),
      name: clip(entry.name, 120),
      domain,
      subdomain: entry.branch,
      nodeKind: entry.kind,
      description: clip(entry.scope_contract?.learning_target || entry.name, 5000),
      details: details(entry),
      position: [0, 0, 0],
      pinned: false,
      proficiency80: null,
      icon: DOMAIN_ICON[domain],
      layoutMode: 'vortex',
      placementNote: placementNote(entry),
      // Lineage and planning fields. The app ignores unknown node fields; they travel with the
      // export so the preview can be traced back to the specification.
      planningId: entry.id,
      sourceCandidateId: entry.runtime_identity?.source_candidate_id ?? null,
      approvedEquivalentToSource: false,
      tier: entry.tier ?? null,
      pathRole: entry.path_role ?? null,
      feedsMilestones: entry.feeds_milestones ?? [],
      assessmentMode: entry.assessment_contract?.mode ?? null,
      assessable: entry.kind !== 'roadmap',
      lessonStatus: entry.lesson_status,
      origin: entry.origin ?? null
    };
  });

  // The app's three edge types: the specification's `required` is a strict learning order, its
  // `supports` is optional preparation. Nothing here becomes a `related` edge, because the
  // specification records no context-only links.
  const TYPE = { required: 'prerequisite', supports: 'supports' };
  const edges = spec.edges.map(edge => {
    const type = TYPE[edge.type];
    if (!type) throw Error(`No runtime edge type for "${edge.type}".`);
    return {
      source: idFor.get(edge.source), target: idFor.get(edge.target), type,
      rationale: clip(edge.rationale || 'Recorded in the v3 curriculum specification.', 12000),
      authorship: 'robotics curriculum specification v3'
    };
  });

  const counts = key => spec.nodes.reduce((t, n) => (t[n[key]] = (t[n[key]] || 0) + 1, t), {});
  const graph = {
    schemaVersion: 1,
    title: TITLE,
    nodes,
    edges,
    metadata: {
      // An explicit family, so atlasFamily() never falls back to the existing datasetId and the
      // existing shared proficiency record can never be read or written by this map.
      atlasFamily: FAMILY,
      created: today,
      compatibleApp: 'Skill Solar System v0.4; schemaVersion 1',
      scope: 'Preview of the reviewed robotics curriculum specification v3. Planning content only: no lesson has been authored for any entry.',
      proficiencyPolicy: 'Every entry starts unmarked. No source equivalence is approved, so no answer is inherited from the existing atlas.',
      sourceSpecification: 'Robotics-Reviewed-Specification.json',
      reviewedAgainstAtlasSha256: EXPECTED_SOURCE_SHA256
    },
    roboticsV3Preview: {
      specificationVersion: spec.metadata?.version ?? null,
      specificationDate: spec.metadata?.date ?? null,
      generated: today,
      entries: spec.nodes.length,
      byKind: counts('kind'),
      byPathRole: counts('path_role'),
      branchesToDomains: BRANCH_DOMAIN,
      branchNote: 'The application validates six fixed domains and has no branch model. Branch labels are preserved verbatim in each node\'s subdomain; the domain is chosen only for legend grouping and sphere colour. No dependency was altered to fit the domain model.',
      milestones: spec.nodes.filter(n => n.kind === 'milestone').map(n => n.runtime_identity.proposed_id),
      roadmapNotes: spec.nodes.filter(n => n.kind === 'roadmap').map(n => n.runtime_identity.proposed_id),
      lessonStatus: 'No entry has an authored lesson. Every node shows its reviewed scope and assessment contract, labelled as pending.',
      limits: 'The application has no renderer for node kinds, assessment contracts or roadmap notes. A roadmap entry still shows a proficiency control; see the preview notes for the change that would be required.',
      changesFromV2: (spec.changes || []).length
    }
  };

  // Deterministic layout from the prerequisite DAG: reference levels are recalculated from depth
  // (these nodes have no saved levels), then the app's own vortex places them.
  const arranged = arrangeVortex(validate(graph), { recalculate: true });
  const depth = levels(arranged);
  return { graph: arranged, depth };
}

function ledger(spec, graph) {
  const byPlanning = new Map(graph.nodes.map(n => [n.planningId, n]));
  const rows = [['runtime_id', 'planning_id', 'name', 'kind', 'branch', 'domain', 'tier', 'path_role', 'assessment_mode', 'lesson_status', 'source_candidate_id', 'existing_candidates', 'reference_level', 'content_state']];
  for (const entry of spec.nodes) {
    const node = byPlanning.get(entry.id);
    rows.push([
      node.id, entry.id, entry.name, entry.kind, entry.branch, node.domain,
      entry.tier ?? '', entry.path_role ?? '', entry.assessment_contract?.mode ?? '',
      entry.lesson_status, entry.runtime_identity?.source_candidate_id ?? '',
      (entry.existing_candidates || []).join(' '), String(node.skillLevel),
      entry.kind === 'roadmap' ? 'roadmap note, not assessed' : 'scope and assessment specified; lesson not authored'
    ]);
  }
  const escape = value => { const s = String(value ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return rows.map(r => r.map(escape).join(',')).join('\r\n') + '\r\n';
}

const args = process.argv.slice(2);
const specText = readFileSync(SPEC, 'utf8');
const spec = JSON.parse(specText);

// Detect a changed source snapshot explicitly, as the handoff requires.
const masterPath = path.join(ROOT, 'Maps', 'Skill-Solar-System.json');
const liveSha = createHash('sha256').update(readFileSync(masterPath)).digest('hex');
const specSha = spec.metadata?.source_sha256;

const { graph, depth } = buildPreview(spec);
const newDepth = [...depth.values()];
const report = {
  specification: { version: spec.metadata?.version, date: spec.metadata?.date, entries: spec.nodes.length, edges: spec.edges.length },
  sourceSnapshot: { recordedInSpec: specSha, liveMasterNow: liveSha, unchanged: specSha === liveSha },
  preview: {
    file: OUT_MAP, title: graph.title,
    atlasFamily: atlasFamily(graph),
    isolatedFromExistingAtlas: atlasFamily(graph) !== 'sss-robotics-foundations-2026-09',
    nodes: graph.nodes.length, edges: graph.edges.length,
    edgeTypes: graph.edges.reduce((t, e) => (t[e.type] = (t[e.type] || 0) + 1, t), {}),
    domains: graph.nodes.reduce((t, n) => (t[n.domain] = (t[n.domain] || 0) + 1, t), {}),
    subdomains: new Set(graph.nodes.map(n => n.subdomain)).size,
    marked: graph.nodes.filter(n => n.proficiency80 != null).length,
    referenceLevelRange: [Math.min(...graph.nodes.map(n => n.skillLevel)), Math.max(...graph.nodes.map(n => n.skillLevel))],
    prerequisiteDepthRange: [Math.min(...newDepth), Math.max(...newDepth)],
    milestones: graph.roboticsV3Preview.milestones,
    roadmapNotes: graph.roboticsV3Preview.roadmapNotes
  }
};
console.log(JSON.stringify(report, null, 2));
if (specSha !== liveSha) console.log('\nNOTE: the atlas has changed since the specification was reviewed. The preview is unaffected (it shares no identity with that atlas), but lineage notes refer to the earlier snapshot.');
if (!args.includes('--write')) { console.log('\nDry run: nothing written. Add --write to create the preview map and ledger.'); process.exit(0); }

function writeAtomic(file, content) { const temp = `${file}.${process.pid}.tmp`; writeFileSync(temp, content); renameSync(temp, file); }
mkdirSync(OUT_DIR, { recursive: true });
writeAtomic(OUT_MAP, JSON.stringify(graph, null, 2) + '\n');
writeAtomic(OUT_LEDGER, ledger(spec, graph));
console.log(`\nWrote ${OUT_MAP}`);
console.log(`Wrote ${OUT_LEDGER}`);
console.log('\nThe existing atlas and the shared proficiency record were not read for answers, not modified, and not written.');
