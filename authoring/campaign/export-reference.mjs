// Exports a read-only reference of the working atlas for the subject build-out campaign, so the
// hierarchies authored in the Claude desktop app can reuse existing skills and link to them.
//
//   node authoring/campaign/export-reference.mjs            the Robotics Atlas -> handoff/Atlas-Reference.json
//   node authoring/campaign/export-reference.mjs --helix    the helix map      -> handoff/Helix-Reference.json
//
// Writes into campaigns/subject-buildout/handoff/. It carries ids, names, subjects, descriptions,
// prerequisites and coverage flags, and never an answer, a position or a lesson's text: nothing
// personal leaves the map. The helix reference adds each skill's course, build stage, humanoid-path
// flag, helix level and tier, and an onHelixGoalPath flag (I08 or I09 depends on it).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const HELIX = process.argv.includes('--helix');
const MAP = path.join(ROOT, 'Maps', HELIX ? 'Humanoid-Helix-Atlas.json' : 'Robotics-Atlas.json');
const BRANCHES = path.join(ROOT, 'scope', 'branches.json');
const OUT = path.join(ROOT, 'campaigns', 'subject-buildout', 'handoff', HELIX ? 'Helix-Reference.json' : 'Atlas-Reference.json');

const bytes = readFileSync(MAP), map = JSON.parse(bytes), branches = JSON.parse(readFileSync(BRANCHES, 'utf8'));
const byId = new Map(map.nodes.map(n => [n.id, n]));
const parents = new Map();
for (const e of map.edges) if (e.type === 'prerequisite') (parents.get(e.target) || parents.set(e.target, []).get(e.target)).push(e.source);
const closure = seeds => { const s = new Set(seeds); for (const st = [...seeds]; st.length;) for (const p of parents.get(st.pop()) || []) if (!s.has(p)) { s.add(p); st.push(p); } return s; };
const extension = n => /^rob3:X\d/.test(n.id) || n.subdomain === 'Advanced pathways' || String(n.planningId ?? '').startsWith('R-X');
const i05 = closure(['rob3:I05']);
const core = closure(map.nodes.filter(n => n.domain === 'Robotics' && !extension(n)).map(n => n.id));
const branchOf = new Map();
for (const b of branches.branches) for (const id of [...(b.masterSkillIds || []), ...(b.v3EntryIds || [])]) if (!branchOf.has(id)) branchOf.set(id, b.id);
const short = s => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > 240 ? `${t.slice(0, 239)}…` : t; };
const helixGoal = HELIX ? closure(['hx-sys-ms-i08', 'hx-sys-ms-i09']) : null;
const helixImport = map.metadata.humanoidHelixImport;
const tierOf = n => n.helixTier ?? helixImport?.atlasTiers?.[n.id] ?? null;

const reference = {
  purpose: HELIX
    ? 'Read-only reference of the HelixSkill Humanoid Protocol Droid Helix map (the Robotics Atlas plus the humanoid helix extension) for the subject build-out campaign. Reuse these ids rather than adding duplicates, and link new skills to them by id. Answers, positions and lesson text are deliberately left out.'
    : 'Read-only reference of the HelixSkill Robotics Atlas for the subject build-out campaign. Reuse these ids rather than adding duplicates, and link new skills to them by id. Answers, positions and lesson text are deliberately left out.',
  exported: new Date().toISOString().slice(0, 10),
  map: { ...(HELIX ? { title: map.title } : {}), sha256: createHash('sha256').update(bytes).digest('hex'), skills: map.nodes.length, connections: map.edges.length, atlasFamily: map.metadata.atlasFamily,
    ...(HELIX ? { edition: helixImport.edition, longestChain: helixImport.counts.longestChain, topHelixLevel: helixImport.counts.topLevel } : {}) },
  conventions: {
    prerequisiteDirection: 'source is learned before target',
    edgeTypes: { prerequisite: 'required before', supports: 'optional preparation; does not raise level', related: 'context only; does not raise level' },
    domains: ['Mathematics', 'Physics', 'Electronics', 'Mechanics', 'Computing', 'Robotics'],
    flags: { onI05Path: 'the I05 milestone depends on it', inCore: 'some core robotics skill depends on it (scope: robotics outside the extension pathways)', hasLesson: 'an introductory lesson card exists',
      ...(HELIX ? { inCore: 'some Robotics-domain skill depends on it; on this map that includes the humanoid robotics courses, so it is broader than in the Robotics Atlas', onHelixGoalPath: 'the humanoid milestone I08 or I09 depends on it', onHumanoidPath: 'the taxonomy workbook\'s On Humanoid Path column' } : {}) },
    ...(HELIX ? {
      courses: map.metadata.courses, buildStages: helixImport.buildStages,
      helixLevel: '1 + 3 x the longest prerequisite chain below the skill; a new skill sits above everything it needs',
      tiers: ['Core', 'Working', 'Specialist', 'Enrichment', 'Checkpoint', 'Milestone'],
      branches: 'The 46 scope branches cover the Robotics Atlas skills only; humanoid skills (hx-*) have branch null and are grouped by course and subject instead.'
    } : {})
  },
  milestones: map.nodes.filter(n => n.nodeKind === 'milestone').map(n => ({ id: n.id, name: n.name, directPrerequisites: parents.get(n.id) || [] })),
  branches: branches.branches.map(b => ({ id: b.id, domain: b.domain, name: b.name, boundary: b.boundary, excludes: b.excludes || '', status: b.status })),
  skills: map.nodes.map(n => ({
    id: n.id, name: n.name, domain: n.domain, subdomain: n.subdomain ?? null, branch: branchOf.get(n.id) ?? null,
    description: short(n.description), prerequisites: parents.get(n.id) || [],
    onI05Path: i05.has(n.id), inCore: core.has(n.id), hasLesson: !!n.lesson,
    ...(HELIX ? { course: n.courseCode, buildStage: n.buildStage, onHumanoidPath: n.onHumanoidPath, onHelixGoalPath: helixGoal.has(n.id), helixLevel: n.helixLevel, tier: tierOf(n) } : {}),
    ...(n.planningId ? { planningId: n.planningId } : {}), ...(n.nodeKind && n.nodeKind !== 'skill' ? { nodeKind: n.nodeKind } : {})
  }))
};
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(reference, null, 1) + '\n');
const count = (f) => reference.skills.reduce((t, s) => (t[f(s)] = (t[f(s)] || 0) + 1, t), {});
console.log(`Wrote ${path.relative(ROOT, OUT)}: ${reference.skills.length} skills, ${reference.branches.length} branches, ${reference.milestones.length} milestones.`);
console.log('by domain', JSON.stringify(count(s => s.domain)), '| in core', reference.skills.filter(s => s.inCore).length, '| on I05', reference.skills.filter(s => s.onI05Path).length);
if (HELIX) console.log('by course', JSON.stringify(count(s => s.course)), '| on the helix goal path', reference.skills.filter(s => s.onHelixGoalPath).length, '| on the humanoid path', reference.skills.filter(s => s.onHumanoidPath).length);
