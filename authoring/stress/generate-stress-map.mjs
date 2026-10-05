// Generates synthetic Skill Solar System maps for capacity testing. The shape copies the real master
// atlas (measured in reports/capacity/02-generator.md); none of its content is copied. Every id and
// name is plainly synthetic, the atlas family is `stress-test-synthetic`, and every answer is null.
//
//   node authoring/stress/generate-stress-map.mjs --nodes 10000 --variant full [--seed 1] [--out C:\sss-scratch\stress]
//
// Deterministic: the same nodes, variant and seed always produce byte-identical output.
// Loop-free by construction: a prerequisite always runs from a lower depth to a higher one.
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { levels } from '../../src/model.js';
import { DOMAIN_ICON } from '../../src/icons.js';

export const ATLAS_FAMILY = 'stress-test-synthetic';

// Measured from Maps/Skill-Solar-System.json (1,769 skills, 5,142 connections).
export const PROFILE = {
  depthHistogram: [5, 6, 9, 31, 139, 86, 103, 182, 285, 181, 145, 80, 90, 94, 77, 124, 40, 40, 20, 15, 10, 4, 2, 1],
  domains: { Mathematics: 1221, Physics: 200, Electronics: 105, Mechanics: 95, Robotics: 44, Computing: 104 },
  prerequisitesPerSkill: { 1: 221, 2: 1063, 3: 448, 4: 29, 5: 3 }, // skills with at least one
  supportsPerPrerequisite: 187 / 3822,
  relatedPerPrerequisite: 1133 / 3822,
  sameDomainPrerequisite: 0.898,
  subdomainsPerDomain: 16,               // 99 distinct subdomains over 6 domains
  // Mean text lengths. otherFields stands in for the master's editorial fields (582 bytes compact);
  // 770 is calibrated so a saved skeleton map matches the master's 3,051 bytes per skill.
  text: { name: 38, description: 108, details: 786, placementNote: 329, otherFields: 770 },
  edge: { rationaleShare: 1719 / 5142, rationale: 126, reasonRefShare: 3423 / 5142 },
  // Measured from Maps/Robotics-v3/Robotics-v3-Lessons.json: 298 lessons.
  lessonPayload: { p10: 4594, mean: 5640, p90: 6477, max: 8810 },
  practiceModeNullShare: 77 / 298,
  referencesPerLesson: 0.09
};

// mulberry32: a small seeded random generator, so output is reproducible.
function random(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const weighted = (rand, weights) => { const entries = Object.entries(weights), total = entries.reduce((s, [, w]) => s + w, 0); let r = rand() * total; for (const [k, w] of entries) if ((r -= w) < 0) return k; return entries.at(-1)[0]; };
const jitter = (rand, mean, spread = 0.2) => Math.max(1, Math.round(mean * (1 - spread + 2 * spread * rand())));
const FILLER = 'Synthetic stress-test text with no real content. ';
const text = (length, label = '') => { const base = label ? `${label} ` : ''; return (base + FILLER.repeat(Math.ceil(length / FILLER.length) + 1)).slice(0, length).trimEnd() || 'Synthetic'; };
const pad = (i, width) => String(i).padStart(width, '0');

// The same arithmetic as src/vortex.js (referenceLevels and arrangeVortex). It is repeated here
// because the app's own functions call validate(), which refuses maps above today's 5,000-skill cap.
function vortexLayout(nodes, edges, depth) {
  const maximum = Math.max(0, ...depth.values()), step = maximum ? Math.min(3, 99 / maximum) : 3;
  if (maximum > 99) throw Error(`Generated chain depth ${maximum} needs more than 100 levels.`);
  const incoming = new Map(nodes.map(n => [n.id, []]));
  for (const e of edges) if (e.type === 'prerequisite') incoming.get(e.target).push(e.source);
  const ranks = new Map();
  for (const n of [...nodes].sort((a, b) => depth.get(a.id) - depth.get(b.id) || a.id.localeCompare(b.id))) {
    const rank = Math.max(1 + Math.floor(step * depth.get(n.id)), ...incoming.get(n.id).map(id => ranks.get(id) + 1));
    if (rank > 100) throw Error(`No level below 100 for ${n.id}.`);
    ranks.set(n.id, rank); n.skillLevel = rank;
  }
  const domains = Object.keys(PROFILE.domains), groups = new Map();
  for (const n of nodes) { const key = `${n.domain}:${n.skillLevel}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(n); }
  for (const peers of groups.values()) {
    peers.sort((a, b) => (a.subdomain || '').localeCompare(b.subdomain || '') || a.id.localeCompare(b.id));
    const level = peers[0].skillLevel, t = (level - 1) / 99, domain = domains.indexOf(peers[0].domain);
    const center = domain * Math.PI / 3 + t * Math.PI * 4, baseRadius = 420 + 580 * t, arc = Math.PI / 3 * .76;
    const columns = Math.max(3, Math.floor(baseRadius * arc / 62));
    peers.forEach((n, i) => {
      const row = Math.floor(i / columns), count = Math.min(columns, peers.length - row * columns);
      const theta = center + ((i % columns + .5) / count - .5) * arc, radius = baseRadius + row * 70;
      n.position = [Math.cos(theta) * radius, (level - 1) * 64, Math.sin(theta) * radius].map(v => Math.round(v * 1000) / 1000);
    });
  }
}

function lessonFor(rand, n, i) {
  const target = Math.min(PROFILE.lessonPayload.max, Math.max(PROFILE.lessonPayload.p10, jitter(rand, PROFILE.lessonPayload.mean, 0.18)));
  // 0.43 is calibrated so the payload, measured as in Robotics V3 (lesson, card, details and placement
  // note), averages about 5,640 bytes: the explanation and worked example are stored twice there too.
  const share = k => Math.round(target * k * 0.43);
  const practiceMode = rand() < PROFILE.practiceModeNullShare ? null : text(90, 'Synthetic practice mode;');
  const lesson = {
    id: n.id, explanation: text(share(0.20), 'Explanation.'), worked_example: text(share(0.12), 'Worked example.'),
    practice: { question: text(share(0.05), 'Practice question?'), answer: text(share(0.06), 'Answer.') },
    boundary_case: { question: text(share(0.04), 'Boundary question?'), answer: text(share(0.05), 'Answer.') },
    name: n.name, branch: n.subdomain, planning_id: `SYN-${pad(i, 5)}`, proposed_runtime_id: n.id, requires: [],
    node_contract_sha256: '0'.repeat(64), instructional_scope: text(share(0.03)), content_status: 'introductory lesson authored',
    proficiency_write: false, required_future_work: text(share(0.06)), evidence_policy: text(share(0.05)),
    why_it_matters: text(share(0.06)), details: '', placement_note: text(share(0.03)), assessment_rule: text(share(0.04)),
    references: rand() < PROFILE.referencesPerLesson ? [{ url: 'https://example.invalid/synthetic', use: text(60) }] : []
  };
  if (practiceMode) lesson.practice_mode = practiceMode;
  lesson.details = `${lesson.explanation}\n\n${lesson.worked_example}`;
  const lessonCard = {
    edition: 'synthetic-stress', authored: '2026-09-27', status: 'introductory lesson available', demonstration: text(share(0.03), 'Demonstrate.'),
    assessmentContract: { mode: 'written calculation', task: text(80), case_requirements: text(80), acceptance: text(80), evidence_record: ['task and version', 'outcome and limits'], tolerance_policy: text(60), answer_policy: 'Evidence does not write an answer.', status: 'synthetic' },
    scopeBoundary: text(120), practiceMode, contractSha256: '0'.repeat(64)
  };
  return { lesson, lessonCard, details: lesson.details };
}

export function generateStressMap({ nodes: count, variant = 'skeleton', seed = 1 }) {
  if (!Number.isInteger(count) || count < 2) throw Error('nodes must be a whole number of at least 2.');
  if (!['skeleton', 'full'].includes(variant)) throw Error('variant must be skeleton or full.');
  const rand = random(seed * 1_000_003 + count * 7 + (variant === 'full' ? 1 : 0));
  const width = Math.max(5, String(count).length), domainNames = Object.keys(PROFILE.domains);

  // Depths follow the master's distribution; at least one root and one skill at every depth up to the maximum.
  const total = PROFILE.depthHistogram.reduce((s, v) => s + v, 0), maxDepth = PROFILE.depthHistogram.length - 1;
  const depths = [];
  for (let d = 0; d <= maxDepth; d++) depths.push(...Array(Math.max(1, Math.round(count * PROFILE.depthHistogram[d] / total))).fill(d));
  while (depths.length > count) { const i = depths.findLastIndex((d, j) => d === 8 && j); depths.splice(i >= 0 ? i : depths.length - 1, 1); }
  while (depths.length < count) depths.push(8);
  depths.sort((a, b) => a - b);

  const nodes = depths.map((d, i) => {
    const domain = weighted(rand, PROFILE.domains), sub = Math.floor(rand() * PROFILE.subdomainsPerDomain);
    const id = `syn:${pad(i + 1, width)}`;
    return {
      id, name: text(jitter(rand, PROFILE.text.name, 0.3), `Synthetic skill ${pad(i + 1, width)}`), domain, subdomain: `Synthetic ${domain} ${pad(sub + 1, 2)}`,
      description: text(jitter(rand, PROFILE.text.description), `Synthetic description ${pad(i + 1, width)}.`),
      details: text(jitter(rand, PROFILE.text.details), 'Synthetic details.'), position: [0, 0, 0], pinned: false, proficiency80: null,
      icon: DOMAIN_ICON[domain], layoutMode: 'vortex', placementNote: text(jitter(rand, PROFILE.text.placementNote, 0.05), 'Synthetic placement note.'),
      syntheticProfile: text(jitter(rand, PROFILE.text.otherFields), 'Stands in for the master\'s editorial fields.'), __depth: d
    };
  });

  // Prerequisites: the first parent sits exactly one depth below (so the depth holds), the rest anywhere
  // below. Parents are chosen in proportion to (links already given + 1) squared, which reproduces the
  // master's few heavily used foundations.
  const byDepth = Array.from({ length: maxDepth + 1 }, () => new Map(domainNames.map(dn => [dn, []])));
  for (const n of nodes) byDepth[n.__depth].get(n.domain).push(n);
  const out = new Map(nodes.map(n => [n.id, 0])), edges = [], seen = new Set();
  const pickFrom = pool => { let sum = 0; const w = pool.map(p => { const v = (out.get(p.id) + 1) ** 2; sum += v; return v; }); let r = rand() * sum; for (let i = 0; i < pool.length; i++) if ((r -= w[i]) < 0) return pool[i]; return pool.at(-1); };
  const poolAt = (d, domain) => { const same = byDepth[d].get(domain); if (same.length && rand() < PROFILE.sameDomainPrerequisite) return same; const all = [...byDepth[d].values()].flat(); return all.length ? all : null; };
  const add = (type, source, target) => {
    const pair = type === 'related' ? [source, target].sort() : [source, target], key = `${type}|${pair[0]}|${pair[1]}`;
    if (source === target || seen.has(key)) return false; seen.add(key);
    const edge = { source, target, type, authorship: 'synthetic' };
    if (rand() < PROFILE.edge.rationaleShare) edge.rationale = text(jitter(rand, PROFILE.edge.rationale, 0.3), 'Synthetic rationale.');
    if (rand() < PROFILE.edge.reasonRefShare) edge.reasonRef = `S${Math.floor(rand() * 90) + 10}`;
    edges.push(edge); return true;
  };
  for (const n of nodes) {
    if (!n.__depth) continue;
    const wanted = Number(weighted(rand, PROFILE.prerequisitesPerSkill));
    const first = poolAt(n.__depth - 1, n.domain);
    if (first) { const p = pickFrom(first); if (add('prerequisite', p.id, n.id)) out.set(p.id, out.get(p.id) + 1); }
    for (let k = 1, tries = 0; k < wanted && tries < 20; tries++) {
      const d = Math.max(0, n.__depth - 1 - Math.floor(rand() * rand() * n.__depth)), pool = poolAt(d, n.domain);
      if (!pool) continue;
      const p = pickFrom(pool);
      if (add('prerequisite', p.id, n.id)) { out.set(p.id, out.get(p.id) + 1); k++; }
    }
  }
  const prerequisites = edges.length;
  for (const [type, ratio] of [['supports', PROFILE.supportsPerPrerequisite], ['related', PROFILE.relatedPerPrerequisite]]) {
    const wanted = Math.round(prerequisites * ratio);
    for (let made = 0, tries = 0; made < wanted && tries < wanted * 20; tries++) {
      const a = nodes[Math.floor(rand() * nodes.length)], b = nodes[Math.floor(rand() * nodes.length)];
      if (add(type, a.id, b.id)) made++;
    }
  }

  const graph = {
    schemaVersion: 1,
    title: `Synthetic stress map — ${count.toLocaleString('en-US')} skills (${variant})`,
    nodes, edges,
    metadata: {
      atlasFamily: ATLAS_FAMILY, datasetKey: `${ATLAS_FAMILY}-${count}-${variant}`, created: '2026-09-27',
      compatibleApp: 'Skill Solar System; schemaVersion 1', syntheticNotice: 'Synthetic stress-test data. No real skills, content or answers.',
      generator: { script: 'authoring/stress/generate-stress-map.mjs', version: 1, nodes: count, variant, seed }
    }
  };
  const depth = levels(graph); // throws on a prerequisite loop
  for (const n of nodes) { if (depth.get(n.id) !== n.__depth) throw Error(`Depth drift at ${n.id}.`); delete n.__depth; }
  vortexLayout(nodes, edges, depth);
  graph.layout = { type: 'vortex', version: 1, turns: 2, heightPerLevel: 64, levelMeaning: 'Synthetic: provisional reference rank from generated prerequisites.' };
  if (variant === 'full') nodes.forEach((n, i) => {
    const { lesson, lessonCard, details } = lessonFor(rand, n, i + 1);
    Object.assign(n, { details, lesson, lessonCard, contentStatus: 'introductory lesson authored', lessonStatus: 'introductory lesson available; extended lesson and further practice authoring pending' });
  });
  return graph;
}

// Generated maps belong outside the repository and outside OneDrive.
export function checkOutputFolder(folder) {
  const resolved = path.resolve(folder), repo = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
  const inside = (parent, child) => { const r = path.relative(parent, child); return !r.startsWith('..') && !path.isAbsolute(r); };
  if (inside(repo, resolved)) throw Error(`Refusing to write inside the repository: ${resolved}`);
  if (process.env.OneDrive && inside(path.resolve(process.env.OneDrive), resolved)) throw Error(`Refusing to write inside OneDrive: ${resolved}`);
  return resolved;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
  const count = Number(option('nodes')), variant = option('variant', 'skeleton'), seed = Number(option('seed', 1));
  const folder = checkOutputFolder(option('out', 'C:\\sss-scratch\\stress'));
  const started = performance.now(), graph = generateStressMap({ nodes: count, variant, seed });
  const content = JSON.stringify(graph, null, 2) + '\n';
  mkdirSync(folder, { recursive: true });
  const file = path.join(folder, `stress-${count}-${variant}.json`);
  writeFileSync(file, content);
  const types = graph.edges.reduce((t, e) => (t[e.type] = (t[e.type] || 0) + 1, t), {});
  console.log(JSON.stringify({ file, bytes: Buffer.byteLength(content), nodes: graph.nodes.length, edges: graph.edges.length, types, seconds: +((performance.now() - started) / 1000).toFixed(2) }));
}
