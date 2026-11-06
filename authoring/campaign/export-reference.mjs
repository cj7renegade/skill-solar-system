// Exports a read-only reference of the working atlas for the subject build-out campaign, so the
// hierarchies authored in the Claude desktop app can reuse existing skills and link to them.
//
//   node authoring/campaign/export-reference.mjs
//
// Writes campaigns/subject-buildout/handoff/Atlas-Reference.json. It carries ids, names, subjects,
// descriptions, prerequisites and coverage flags, and never an answer, a position or a lesson's text:
// nothing personal leaves the map.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const MAP = path.join(ROOT, 'Maps', 'Robotics-Atlas.json');
const BRANCHES = path.join(ROOT, 'scope', 'branches.json');
const OUT = path.join(ROOT, 'campaigns', 'subject-buildout', 'handoff', 'Atlas-Reference.json');

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

const reference = {
  purpose: 'Read-only reference of the HelixSkill Robotics Atlas for the subject build-out campaign. Reuse these ids rather than adding duplicates, and link new skills to them by id. Answers, positions and lesson text are deliberately left out.',
  exported: new Date().toISOString().slice(0, 10),
  map: { sha256: createHash('sha256').update(bytes).digest('hex'), skills: map.nodes.length, connections: map.edges.length, atlasFamily: map.metadata.atlasFamily },
  conventions: {
    prerequisiteDirection: 'source is learned before target',
    edgeTypes: { prerequisite: 'required before', supports: 'optional preparation; does not raise level', related: 'context only; does not raise level' },
    domains: ['Mathematics', 'Physics', 'Electronics', 'Mechanics', 'Computing', 'Robotics'],
    flags: { onI05Path: 'the I05 milestone depends on it', inCore: 'some core robotics skill depends on it (scope: robotics outside the extension pathways)', hasLesson: 'an introductory lesson card exists' }
  },
  milestones: map.nodes.filter(n => n.nodeKind === 'milestone').map(n => ({ id: n.id, name: n.name, directPrerequisites: parents.get(n.id) || [] })),
  branches: branches.branches.map(b => ({ id: b.id, domain: b.domain, name: b.name, boundary: b.boundary, excludes: b.excludes || '', status: b.status })),
  skills: map.nodes.map(n => ({
    id: n.id, name: n.name, domain: n.domain, subdomain: n.subdomain ?? null, branch: branchOf.get(n.id) ?? null,
    description: short(n.description), prerequisites: parents.get(n.id) || [],
    onI05Path: i05.has(n.id), inCore: core.has(n.id), hasLesson: !!n.lesson,
    ...(n.planningId ? { planningId: n.planningId } : {}), ...(n.nodeKind && n.nodeKind !== 'skill' ? { nodeKind: n.nodeKind } : {})
  }))
};
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(reference, null, 1) + '\n');
const count = (f) => reference.skills.reduce((t, s) => (t[f(s)] = (t[f(s)] || 0) + 1, t), {});
console.log(`Wrote ${path.relative(ROOT, OUT)}: ${reference.skills.length} skills, ${reference.branches.length} branches, ${reference.milestones.length} milestones.`);
console.log('by domain', JSON.stringify(count(s => s.domain)), '| in core', reference.skills.filter(s => s.inCore).length, '| on I05', reference.skills.filter(s => s.onI05Path).length);
