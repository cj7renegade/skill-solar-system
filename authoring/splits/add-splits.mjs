// Adds the foundation skills JC approved at Checkpoint A (scope/splits/new-skills.json) to the
// working Robotics Atlas. Logic only: no file access. build-splits.mjs is the command around it.
//
// The gates and the layout are the completions tool's (authoring/completions/add-skills.mjs): the
// working map is kept node for node and edge for edge, the approved skills and connections are
// appended, levels are recalculated, and nothing else may change. What differs is the record: these
// are master-style skills like the earlier content batches, with no planning id, so the lesson
// importer leaves them alone until step 7.
import { clone } from '../../src/model.js';
import { gates as completionGates, arrange as completionArrange, milestonesFed } from '../completions/add-skills.mjs';

const AUTHORSHIP = 'foundation splits (approved at Checkpoint A)';
export const RECORD = 'foundationSplits';

export function plan(approved) {
  if (approved?.status !== 'APPROVED' || !approved.approval) throw Error('The new skills are not approved. Nothing is built until JC approves them (Checkpoint A).');
  return approved.skills;
}

// A new skill, with the fields in the order the earlier batches use (for example
// sss-dc-test-point-choice). Domain, subdomain and icon come from the first skill it splits.
export function nodeFor(skill, source, shared) {
  return {
    id: skill.id, name: skill.name, domain: source.domain, subdomain: source.subdomain, nodeKind: shared.nodeKind,
    description: skill.description, details: skill.details,
    position: [0, 0, 0], pinned: false, proficiency80: null, icon: source.icon, layoutMode: 'vortex',
    placementNote: `Split from ${skill.from.join(', ')} for the scope candidate "${skill.candidate}" (branch ${skill.branch}).`,
    sourceRefs: [], referenceURLs: [],
    proficiencyReference: skill.proficiencyReference, scopeNote: skill.scopeNote,
    contentAuthorship: shared.contentAuthorship, authoringOrigin: shared.authoringOrigin,
    sourceAlignment: shared.sourceAlignment, descriptionStatus: shared.descriptionStatus
  };
}

export function addSplits(atlas, approved) {
  const skills = plan(approved), graph = clone(atlas);
  const byId = new Map(atlas.nodes.map(n => [n.id, n]));
  for (const s of skills) {
    const source = byId.get(s.from[0]);
    if (!source) throw Error(`${s.id} splits ${s.from[0]}, which is not in the map.`);
    graph.nodes.push(nodeFor(s, source, approved.shared));
  }
  for (const s of skills) for (const e of s.edges) graph.edges.push({ source: e.source, target: e.target, type: e.type, rationale: e.rationale, authorship: AUTHORSHIP });
  // Any V3 entry whose milestone list the new edges would change is restated, as the completions did.
  const fed = milestonesFed(graph), corrected = [];
  for (const n of graph.nodes) {
    if (!Array.isArray(n.feedsMilestones)) continue;
    const next = fed(n.id);
    if (JSON.stringify(next) !== JSON.stringify(n.feedsMilestones)) { corrected.push(n.id); n.feedsMilestones = next; }
  }
  graph[RECORD] = {
    approved: { date: approved.approval.date, by: approved.approval.by, accepted: approved.approval.accepted },
    baseMap: approved.baseMap,
    addedSkills: skills.map(s => ({ id: s.id, name: s.name, branch: s.branch, from: s.from, required: s.required })),
    addedEdges: skills.flatMap(s => s.edges.map(e => ({ source: e.source, target: e.target, type: e.type }))),
    notAdded: clone(approved.notAdded ?? []),
    feedsMilestonesCorrected: corrected
  };
  return graph;
}

// The completions gates, given the approved skills in the shape they read.
export function gates(before, after, approved) {
  const skills = plan(approved).map(s => ({ runtimeId: s.id, required: s.required, edges: s.edges }));
  const fail = completionGates(before, after, { status: approved.status, approval: approved.approval, skills });
  // Master-style records: no planning id, so the importer never matches them.
  for (const s of skills) if (after.nodes.find(n => n.id === s.runtimeId)?.planningId !== undefined) fail.push(`${s.runtimeId} has a planning id.`);
  return fail;
}

export const arrange = (graph, before) => completionArrange(graph, before, { record: RECORD });
