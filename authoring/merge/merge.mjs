// Merges the master atlas and the Robotics V3 export into one new map, exactly as the approved
// crosswalk (scope/merge/crosswalk.json) says. Logic only: no file access. build-merged.mjs is the
// command around it.
//
// The master is the base. Every master node, field, edge and answer is kept, in order, except the
// retirements and the one prerequisite change JC approved. V3 adds its new entries under their
// rob3: ids, its connections (translated to master ids for shared skills) and its lesson fields.
// Answers are never inferred or copied: the only answers are the master's own, carried by unchanged
// ids, plus any answer change JC decided item by item in the crosswalk.
import { clone, validate } from '../../src/model.js';
import { arrangeVortex } from '../../src/vortex.js';

export const FAMILY = 'sss-robotics-foundations-2026-09';
export const DATASET_KEY = 'robotics-atlas-merged';
export const TITLE = 'HelixSkill — Robotics Atlas (master + Robotics V3)';
export const S7_BRANCH = 'Thermal and environmental behavior';
// Planning fields V3 records on every entry; a shared master skill takes them from V3.
const V3_FIELDS = ['planningId', 'nodeKind', 'feedsMilestones', 'pathRole', 'tier', 'assessmentMode', 'assessable', 'contentStatus', 'lessonStatus'];
const AUTHORSHIP = 'robotics atlas merge (approved crosswalk)';

const bare = id => id.replace(/^rob3:/, '');
const edgeKey = e => JSON.stringify([e.type, ...(e.type === 'related' ? [e.source, e.target].sort() : [e.source, e.target])]);
const pairKey = e => [e.source, e.target].sort().join('\n');

// Everything the merge needs from the crosswalk, in one place.
export function plan(crosswalk) {
  if (crosswalk?.status !== 'APPROVED' || !crosswalk.approval) throw Error('The crosswalk is not approved. Nothing is merged until JC approves it (Checkpoint A).');
  const same = new Map(crosswalk.newEntries.filter(e => e.proposal === 'same-ability').map(e => [e.planningId, e.masterId]));
  const fresh = crosswalk.newEntries.filter(e => e.proposal === 'new').map(e => e.planningId);
  const retired = new Set(crosswalk.overviews.filter(o => o.proposal === 'retire').map(o => o.id));
  const removedEdges = crosswalk.sharedIds.prerequisites.flatMap(p => p.proposal === 'V3' ? p.removesMasterEdges || [] : []);
  const renames = new Map(crosswalk.sharedIds.name.filter(n => n.proposal === 'V3').map(n => [n.id, n.v3]));
  const answerChanges = new Map((crosswalk.answerCheck?.differences || []).filter(d => d.decision).map(d => [d.id, d.decision.value]));
  return { same, fresh, retired, removedEdges, renames, answerChanges, crosswalk };
}

// The merged id for a V3 id: the master skill for same-ability entries, the master id for shared
// skills, otherwise the rob3: id.
export function translator(master, p) {
  const ids = new Set(master.nodes.map(n => n.id));
  return id => { const b = bare(id); return p.same.get(b) ?? (ids.has(b) ? b : `rob3:${b}`); };
}

export function merge(master, v3, crosswalk) {
  const p = plan(crosswalk), to = translator(master, p);
  const v3ByMerged = new Map(v3.nodes.map(n => [to(n.id), n]));
  const nodes = [];
  for (const source of master.nodes) {
    if (p.retired.has(source.id)) continue;
    const node = clone(source), from = v3ByMerged.get(node.id);
    if (p.renames.has(node.id)) node.name = p.renames.get(node.id);
    if (p.answerChanges.has(node.id)) node.proficiency80 = p.answerChanges.get(node.id);
    if (from) {
      for (const key of V3_FIELDS) if (from[key] !== undefined) node[key] = clone(from[key]);
      if (from.id !== `rob3:${node.id}`) node.mergedFrom = from.id;
      if (from.lesson) {
        if (node.details && node.details !== from.details) node.atlasDetails = node.details;
        node.details = from.details;
        if (node.placementNote !== undefined && node.placementNote !== from.placementNote) node.atlasPlacementNote = node.placementNote;
        node.placementNote = from.placementNote;
        node.lessonCard = clone(from.lessonCard);
        node.lesson = clone(from.lesson);
      }
    }
    nodes.push(node);
  }
  const fresh = new Set(p.fresh);
  for (const source of v3.nodes) {
    if (!fresh.has(bare(source.id))) continue;
    const node = clone(source);
    node.proficiency80 = null;
    if (node.planningId === 'X06') node.nodeKind = 'outcome';       // decision 7
    if (node.planningId === 'B-D08') node.subdomain = S7_BRANCH;     // decision 12
    nodes.push(node);
  }

  const edges = [], keys = new Set(), pairs = new Set(), skipped = { duplicate: 0, pairAlreadyLinked: 0 };
  const push = (edge, { optional = false } = {}) => {
    const key = edgeKey(edge);
    if (keys.has(key)) { skipped.duplicate++; return; }
    // A related or supports link adds nothing where the two skills are already connected.
    if (optional && pairs.has(pairKey(edge))) { skipped.pairAlreadyLinked++; return; }
    keys.add(key); pairs.add(pairKey(edge)); edges.push(edge);
  };
  const removed = new Set(p.removedEdges.map(edgeKey));
  for (const e of master.edges) {
    if (p.retired.has(e.source) || p.retired.has(e.target) || removed.has(edgeKey(e))) continue;
    push(clone(e));
  }
  for (const e of crosswalk.overviewEdges.repointed)
    push({ source: e.source, target: e.target, type: e.type, rationale: `${e.why}. Replaces ${e.replaces.source} → ${e.replaces.target} (retired overview).`, authorship: AUTHORSHIP });
  for (const e of v3.edges) push({ ...clone(e), source: to(e.source), target: to(e.target) });
  for (const s of ['K05', 'K06', 'K07']) for (const t of ['K08', 'K10', 'K11'])   // decision 10
    push({ source: `rob3:${s}`, target: `rob3:${t}`, type: 'prerequisite', rationale: 'Decision 10: planar kinematics is taught before the spatial and general case.', authorship: AUTHORSHIP });
  for (const l of crosswalk.componentAndRelatedLinks)
    push({ source: l.source, target: l.target, type: l.type, rationale: l.reason, authorship: AUTHORSHIP }, { optional: l.type !== 'prerequisite' });
  for (const c of crosswalk.overviewEdges.carriedAsSupports.filter(c => c.action === 'added as supports'))
    push({ source: c.source, target: c.target, type: 'supports', rationale: `Was a prerequisite of the retired overview ${c.overview}; kept as optional preparation for the outcome that replaces it.`, authorship: AUTHORSHIP }, { optional: true });

  const metadata = { ...clone(master.metadata), atlasFamily: FAMILY, datasetKey: DATASET_KEY, created: crosswalk.approval.date,
    contentEditions: clone(v3.metadata?.contentEditions ?? []), contentStatusPolicy: v3.metadata?.contentStatusPolicy,
    scope: 'The master atlas merged with the Robotics V3 curriculum: master skills and answers unchanged, V3 entries and lessons added, broad robotics overviews replaced by granular V3 outcomes.',
    proficiencyPolicy: 'Answers come only from the master, by unchanged ids, plus the answer changes JC decided in the crosswalk. Nothing is inferred; new V3 entries start unmarked.' };
  const graph = { schemaVersion: 1, title: TITLE, nodes, edges, metadata };
  for (const key of Object.keys(master)) if (!(key in graph)) graph[key] = clone(master[key]);
  graph.roboticsV3Merge = {
    approvedCrosswalk: { date: crosswalk.approval.date, by: crosswalk.approval.by, accepted: crosswalk.approval.accepted },
    sources: crosswalk.sources,
    retiredOverviews: crosswalk.overviews.filter(o => o.proposal === 'retire').map(o => ({ id: o.id, name: o.name, replacedBy: o.covers.map(c => `rob3:${c}`) })),
    sameAbility: [...p.same].map(([planningId, masterId]) => ({ planningId, v3Id: `rob3:${planningId}`, masterId })),
    removedMasterEdges: p.removedEdges,
    answerChanges: [...p.answerChanges].map(([id, value]) => ({ id, value })),
    decisionsApplied: ['6 overviews retired or kept as approved', '7 X06 is an outcome', '10 K05–K07 before K08, K10, K11', '11 calculus links left as supports', `12 B-D08 filed in S7 (${S7_BRANCH})`],
    skippedEdges: skipped,
    v3Provenance: clone(v3.roboticsV3Preview ?? null)
  };
  return graph;
}

// The gates. Returns a list of failures; empty means the merged map may be written.
export function gates(master, v3, crosswalk, merged) {
  const fail = [], p = plan(crosswalk), to = translator(master, p);
  const byId = new Map(merged.nodes.map(n => [n.id, n]));
  try { validate(merged); } catch (error) { fail.push(`The app would refuse the map: ${error.message}`); }
  if (merged.metadata?.atlasFamily !== FAMILY) fail.push('atlasFamily is not the master family.');
  if (merged.metadata?.datasetKey !== DATASET_KEY) fail.push('datasetKey is wrong.');

  // Answers: every master answer carried, changed only where JC decided.
  for (const n of master.nodes) {
    const answer = n.proficiency80 ?? null;
    if (p.retired.has(n.id)) { if (answer !== null) fail.push(`Retired overview ${n.id} holds an answer.`); continue; }
    const got = byId.get(n.id);
    if (!got) { fail.push(`Master skill ${n.id} is missing.`); continue; }
    const expected = p.answerChanges.has(n.id) ? p.answerChanges.get(n.id) : answer;
    if ((got.proficiency80 ?? null) !== expected) fail.push(`Answer changed on ${n.id}.`);
  }
  const masterIds = new Set(master.nodes.map(n => n.id));
  for (const n of merged.nodes) if (!masterIds.has(n.id) && (n.proficiency80 ?? null) !== null) fail.push(`New skill ${n.id} has an answer.`);

  // Master edges kept, except the approved removals.
  const keys = new Set(merged.edges.map(edgeKey)), removed = new Set(p.removedEdges.map(edgeKey));
  for (const e of master.edges)
    if (!p.retired.has(e.source) && !p.retired.has(e.target) && !removed.has(edgeKey(e)) && !keys.has(edgeKey(e))) fail.push(`Master connection lost: ${e.type} ${e.source} → ${e.target}.`);
  // Every V3 entry and connection represented.
  for (const n of v3.nodes) if (!byId.has(to(n.id))) fail.push(`V3 entry ${n.id} is missing.`);
  for (const e of v3.edges) if (!keys.has(edgeKey({ ...e, source: to(e.source), target: to(e.target) }))) fail.push(`V3 connection lost: ${e.type} ${e.source} → ${e.target}.`);
  // Every V3 lesson carried, byte for byte.
  for (const n of v3.nodes.filter(n => n.lesson)) {
    const got = byId.get(to(n.id));
    if (!got || JSON.stringify(got.lesson) !== JSON.stringify(n.lesson) || JSON.stringify(got.lessonCard) !== JSON.stringify(n.lessonCard)) fail.push(`Lesson not carried for ${n.id}.`);
  }
  // Milestone chains I01–I05 still closed: everything below a V3 milestone is still below it.
  const ancestors = (g, id) => { const parents = new Map(); for (const e of g.edges) if (e.type === 'prerequisite') (parents.get(e.target) || parents.set(e.target, []).get(e.target)).push(e.source);
    const seen = new Set(), stack = [id]; while (stack.length) for (const q of parents.get(stack.pop()) || []) if (!seen.has(q)) { seen.add(q); stack.push(q); } return seen; };
  for (const m of ['I01', 'I02', 'I03', 'I04', 'I05']) {
    const before = [...ancestors(v3, `rob3:${m}`)].map(to), after = ancestors(merged, `rob3:${m}`);
    const lost = before.filter(id => !after.has(id));
    if (lost.length) fail.push(`Milestone ${m} lost ${lost.length} prerequisite(s), e.g. ${lost.slice(0, 3).join(', ')}.`);
  }
  const expectedNodes = master.nodes.length - p.retired.size + p.fresh.length;
  if (merged.nodes.length !== expectedNodes) fail.push(`Expected ${expectedNodes} skills, got ${merged.nodes.length}.`);
  return fail;
}

// Task 4: levels and layout. The merged prerequisite graph is new, so levels are recalculated from
// it with the app's own level and spiral code (pinned skills keep their positions), and the change
// is measured against both source maps.
export function arrangeMerged(merged, master, v3, crosswalk) {
  const to = translator(master, plan(crosswalk));
  const arranged = arrangeVortex(merged, { recalculate: true });
  const used = arranged.nodes.map(n => n.skillLevel);
  if (arranged.levelModel) arranged.levelModel = { ...arranged.levelModel, usedRange: [Math.min(...used), Math.max(...used)] };
  const after = new Map(arranged.nodes.map(n => [n.id, n]));
  const compare = (nodes, idOf) => {
    let same = 0, up = 0, down = 0, moved = 0, biggest = 0;
    for (const n of nodes) {
      const m = after.get(idOf(n.id)); if (!m) continue;
      const d = m.skillLevel - (n.skillLevel ?? 0);
      if (d === 0) same++; else if (d > 0) up++; else down++;
      biggest = Math.max(biggest, Math.abs(d));
      if (m.position.some((v, i) => v !== n.position[i])) moved++;
    }
    return { levelSame: same, levelUp: up, levelDown: down, largestLevelChange: biggest, positionChanged: moved };
  };
  const levelsBefore = g => { const l = g.nodes.map(n => n.skillLevel).filter(Number.isInteger); return [Math.min(...l), Math.max(...l)]; };
  const report = {
    levelRange: arranged.levelModel?.usedRange ?? [Math.min(...used), Math.max(...used)],
    masterLevelRangeBefore: levelsBefore(master), v3LevelRangeBefore: levelsBefore(v3),
    pinned: arranged.nodes.filter(n => n.pinned).length,
    masterSkills: compare(master.nodes, id => id), v3Entries: compare(v3.nodes, to)
  };
  arranged.roboticsV3Merge = { ...arranged.roboticsV3Merge, levels: report };
  return { graph: arranged, report };
}
