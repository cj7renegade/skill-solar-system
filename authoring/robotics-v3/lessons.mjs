// Applies the authored robotics learning editions to the dedicated v3 preview map.
//
// This is a content patch, not a map replacement. It touches one group of node fields and nothing
// else: ids, names, domains, positions, reference levels, pins, layout modes, edges and every
// saved proficiency answer are carried through untouched. Running it twice produces byte-identical
// output, so it can be re-run after a regenerated preview without compounding changes.
//
// Editions 01 (77 cards) and 02 (116 cards) are disjoint and together cover 193 of the 380
// assessable entries. The remaining 187 assessable entries and the single roadmap note keep the
// planning text the preview generator wrote for them; they gain a content status and nothing else.
import { createHash } from 'node:crypto';

export const STATUS = {
  authored: 'introductory lesson authored',
  pending: 'introductory lesson pending',
  roadmap: 'roadmap note, not assessed'
};

// The fingerprint each lesson carries hashes the original Python `json.dumps(..., sort_keys=True)`
// of the specification node's id, name, requires and demonstration. Python's defaults differ from
// JSON.stringify in two ways that change the bytes: it puts a space after ',' and ':', and it
// escapes every non-ASCII character, which these strings contain (degree signs, ×, π, arrows).
// This reproduces that exact serialization so the hashes can be compared rather than re-derived.
// The handoff allows comparing parsed values instead; reconcileLesson also checks the four fields
// directly, so a future format change degrades to a reported mismatch, never a silent overwrite.
const asciiJson = value => JSON.stringify(value).replace(/[-￿]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
export function pythonJson(value) {
  if (Array.isArray(value)) return `[${value.map(pythonJson).join(', ')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${asciiJson(key)}: ${pythonJson(value[key])}`).join(', ')}}`;
  return asciiJson(value);
}
export function contractHash(specNode) {
  const contract = { id: specNode.id, name: specNode.name, requires: specNode.requires, demonstration: specNode.demonstration };
  return createHash('sha256').update(pythonJson(contract), 'utf8').digest('hex');
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Reconciles one lesson against the reviewed specification and the live map node. A lesson is only
// applied when its planning identity, runtime identity and node contract all still agree; anything
// else is reported rather than forced, as the handoff requires.
export function reconcileLesson(lesson, { specNode, node, edition }) {
  const problems = [];
  if (!specNode) problems.push(`no specification entry for planning id ${lesson.id}`);
  if (!node) problems.push(`no map node for runtime id ${lesson.proposed_runtime_id}`);
  if (specNode) {
    if (specNode.name !== lesson.name) problems.push(`name differs: specification "${specNode.name}", lesson "${lesson.name}"`);
    if (!same(specNode.requires, lesson.requires)) problems.push(`required prerequisites differ: specification [${specNode.requires}], lesson [${lesson.requires}]`);
    if (specNode.runtime_identity?.proposed_id !== lesson.proposed_runtime_id) problems.push(`proposed runtime id differs: specification "${specNode.runtime_identity?.proposed_id}", lesson "${lesson.proposed_runtime_id}"`);
    if (contractHash(specNode) !== lesson.node_contract_sha256) problems.push('node contract fingerprint does not match the reviewed specification');
  }
  if (specNode && node) {
    if (node.name !== specNode.name) problems.push(`the map node is named "${node.name}", the specification says "${specNode.name}"`);
    if (node.planningId !== lesson.id) problems.push(`the map node carries planning id ${node.planningId}, the lesson claims ${lesson.id}`);
  }
  if (lesson.proficiency_write !== false) problems.push('the lesson requests a proficiency write; this importer never writes answers');
  return { planningId: lesson.id, runtimeId: lesson.proposed_runtime_id, edition, problems };
}

// The card summary the application renders from. The verbatim lesson record travels alongside it
// under `lesson`, so an authored field the interface does not show yet is still kept in the export.
function cardFor(lesson, specNode, edition, authored) {
  return {
    edition, authored,
    status: STATUS.authored,
    // Edition 01 lessons predate the per-lesson demonstration and assessment fields. Both come from
    // the same reviewed specification that edition 02 copies verbatim, so the card reads the same
    // way in either edition without inventing any text.
    demonstration: lesson.full_demonstration ?? specNode.demonstration,
    assessmentContract: lesson.assessment_contract ?? specNode.assessment_contract,
    scopeBoundary: specNode.scope_contract?.boundary ?? null,
    practiceMode: lesson.practice_mode ?? null,
    contractSha256: lesson.node_contract_sha256
  };
}

// Applies every lesson that reconciles cleanly. Returns a new graph; the input is not modified.
export function applyLessons(graph, { spec, editions }) {
  const specNodes = new Map(spec.nodes.map(n => [n.id, n]));
  const byRuntimeId = new Map(graph.nodes.map(n => [n.id, n]));
  const reconciled = [], apply = new Map(), seen = new Map();

  for (const { metadata, lessons } of editions) {
    for (const lesson of lessons) {
      const specNode = specNodes.get(lesson.id), node = byRuntimeId.get(lesson.proposed_runtime_id);
      const outcome = reconcileLesson(lesson, { specNode, node, edition: metadata.edition });
      const duplicate = seen.get(lesson.id);
      if (duplicate) outcome.problems.push(`planning id already supplied by edition ${duplicate}`);
      else seen.set(lesson.id, metadata.edition);
      reconciled.push(outcome);
      if (!outcome.problems.length) apply.set(node.id, { lesson, card: cardFor(lesson, specNode, metadata.edition, metadata.authored) });
    }
  }

  const changed = [], unchanged = [];
  const nodes = graph.nodes.map(node => {
    const match = apply.get(node.id);
    const specNode = specNodes.get(node.planningId);
    const status = match ? STATUS.authored : specNode?.kind === 'roadmap' ? STATUS.roadmap : STATUS.pending;
    // Key order is fixed, so a second run serializes to the same bytes as the first.
    const next = { ...node, contentStatus: status };
    if (match) {
      next.details = match.lesson.details;
      next.placementNote = match.lesson.placement_note;
      next.lessonCard = match.card;
      next.lesson = match.lesson;
    }
    (same(node, next) ? unchanged : changed).push(node.id);
    return next;
  });

  const counted = kind => nodes.filter(n => n.contentStatus === kind).length;
  // The title and three metadata keys are restated so an exported file says what it now contains.
  // atlasFamily is deliberately untouched: it is what keeps this map's answers separate from the
  // original Skill Solar System record, and preservationDiff fails if the patch ever changes it.
  const metadata = {
    ...graph.metadata,
    scope: `Reviewed robotics curriculum specification v3 with the authored introductory learning editions applied. ${counted(STATUS.authored)} of ${nodes.length} entries have an introductory lesson; ${counted(STATUS.pending)} assessable entries are still pending and ${counted(STATUS.roadmap)} is a roadmap note.`,
    contentEditions: [...new Set([...apply.values()].map(m => m.card.edition))],
    contentStatusPolicy: 'Introductory content status is separate from proficiency. An authored lesson is not an answer, and opening a card, revealing an answer or finishing an exercise never marks a skill.'
  };

  return {
    graph: { ...graph, title: `Robotics curriculum v3 — ${counted(STATUS.authored)} introductory lessons, ${counted(STATUS.pending)} pending`, nodes, metadata },
    report: {
      reconciled,
      applied: [...apply.keys()],
      conflicted: reconciled.filter(r => r.problems.length),
      changed, unchanged,
      counts: {
        mapNodes: graph.nodes.length,
        lessonsSupplied: reconciled.length,
        imported: apply.size,
        skipped: reconciled.length - apply.size,
        authored: counted(STATUS.authored),
        pending: counted(STATUS.pending),
        roadmap: counted(STATUS.roadmap)
      }
    }
  };
}

// Everything this patch must leave alone, compared field by field before and after.
export const PRESERVED = ['id', 'name', 'domain', 'subdomain', 'description', 'position', 'pinned', 'proficiency80', 'skillLevel', 'icon', 'layoutMode', 'planningId', 'nodeKind', 'assessable', 'feedsMilestones', 'tier', 'pathRole'];
// The only metadata the patch may restate. Everything else, atlasFamily above all, must survive.
const METADATA_MAY_CHANGE = new Set(['scope', 'contentEditions', 'contentStatusPolicy']);

export function preservationDiff(before, after) {
  const old = new Map(before.nodes.map(n => [n.id, n]));
  const problems = [];
  if (before.nodes.length !== after.nodes.length) problems.push(`node count changed: ${before.nodes.length} to ${after.nodes.length}`);
  if (!same(before.edges, after.edges)) problems.push('edges changed');
  for (const key of new Set([...Object.keys(before.metadata ?? {}), ...Object.keys(after.metadata ?? {})]))
    if (!METADATA_MAY_CHANGE.has(key) && !same(before.metadata?.[key], after.metadata?.[key])) problems.push(`metadata.${key} changed`);
  if (before.nodes.map(n => n.id).join() !== after.nodes.map(n => n.id).join()) problems.push('node order changed');
  for (const node of after.nodes) {
    const was = old.get(node.id);
    if (!was) { problems.push(`${node.id} is new`); continue; }
    for (const key of PRESERVED) if (!same(was[key], node[key])) problems.push(`${node.id}: ${key} changed`);
  }
  return problems;
}
