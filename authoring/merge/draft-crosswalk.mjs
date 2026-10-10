// Generates the Task 2 crosswalk draft (scope/merge/crosswalk.json) from the master and the V3 export,
// and checks it with a structure-only simulated merge (no answers, lessons or layout). Read-only on
// the maps. The judgements below are the draft JC reviews at Checkpoint A (reports/merge/01-crosswalk.md).
//   node authoring/merge/draft-crosswalk.mjs . scope/merge/crosswalk.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const [ROOT, OUT] = process.argv.slice(2);
const rd = f => readFileSync(path.join(ROOT, f));
const sha = b => createHash('sha256').update(b).digest('hex');
const masterRaw = rd('Maps/Skill-Solar-System.json'), v3Raw = rd('Maps/Robotics-v3/Robotics-v3-Lessons.json');
const master = JSON.parse(masterRaw), v3 = JSON.parse(v3Raw);
const spec = JSON.parse(rd('packages/robotics-curriculum-v3/Robotics-Reviewed-Specification.json'));
const recon = JSON.parse(rd('scope/reconciliation.json'));
const M = new Map(master.nodes.map(n => [n.id, n]));
const bare = id => id.replace(/^rob3:/, '');
const V = new Map(v3.nodes.map(n => [bare(n.id), n]));
const S = new Map(spec.nodes.map(n => [n.id, n]));

// ---------------------------------------------------------------- judgements (Task 2)
// Same ability: the V3 demonstration matches the master description, and V3 put its entry in the
// master skill's prerequisite slot on every shared skill (e-schematic, e-resistance, e-capacitor,
// e-logicvoltage). Neither master skill has an answer.
const SAME = {
  'B-E02': { master: 'e-current', why: 'V3 demonstration "distinguish current from voltage and assign a current reference direction" matches e-current "interpret current as charge per unit time and choose consistent reference directions". V3 replaced e-current with B-E02 in the prerequisites of e-schematic and e-resistance.' },
  'B-E03': { master: 'e-voltage', why: 'V3 demonstration "a node voltage needs a reference and ground is not automatically earth" matches e-voltage "choose a voltage reference node and distinguish signal ground from earth". V3 replaced e-voltage with B-E03 in the prerequisites of e-schematic, e-resistance, e-capacitor and e-logicvoltage.' }
};
// Closest master skill where the spec lists none (judged by meaning). "possible" = may be the same
// ability; left as a new skill with a related link for a later content pass (decision 13 style).
const CLOSEST = {
  'B-C01': ['c-terminal', 'precedes', 'V3 makes it a prerequisite of c-terminal'],
  'B-C02': ['c-values-types', 'precedes', 'V3 makes it a prerequisite of c-values-types'],
  'B-C03': ['c-variables', 'precedes', 'V3 makes it a prerequisite of c-variables'],
  'B-C05': ['c-io', 'precedes', 'V3 makes it a prerequisite of c-io'],
  'B-S01': ['p-model', 'precedes', 'V3 makes it a prerequisite of p-model'],
  'B-M02': ['m-sci', 'possible', 'Adds SI prefixes. m-sci holds a Yes answer, so it is not merged: that would stretch an answer over a broader definition'],
  'B-M03': ['m-center', 'related', 'Summary statistics of measured data'],
  'B-M04': ['mf-skill-c5b308b94788eca5', 'possible', 'Same calculation; V3 frames it on measured data'],
  'B-M05': ['m-histogram', 'related', 'Distribution shape of measured noise'],
  'B-P01': ['p-units', 'related', 'Measuring with SI units'],
  'B-P02': ['p-inertia', 'related', 'A first conceptual step before Newton\'s laws'],
  'B-P03': ['p-fbd', 'related', 'Planar free-body balance is a narrow case of free-body diagrams and equilibrium'],
  'B-P04': ['p-torque', 'related', 'Planar case of torque about a point'],
  'B-P05': ['p-com', 'decomposes', 'One-dimensional case of center of mass'],
  'B-P06': ['p-power', 'related', 'Work and power in simple motion'],
  'B-P07': ['p-rotenergy', 'related', 'Shaft power = torque x speed'],
  'B-E01': ['e-schematic', 'related', 'Complete circuit and source before schematic reading'],
  'B-E04': ['e-resistance', 'related', 'Reading component ratings'],
  'B-E05': ['e-power', 'possible', 'DC power and energy; V3 adds energy over time'],
  'B-E06': ['e-battery', 'possible', 'Battery model with stated limits'],
  'B-E07': ['e-diode', 'related', 'Diode as a directional element'],
  'B-E08': ['e-mosfet', 'related', 'Generic controlled switch; master splits it into e-mosfet and e-bjt'],
  'B-E09': ['e-pwm', 'possible', 'Duty and period'],
  'B-E10': ['e-inductor', 'related', 'Inductor current continuity'],
  'B-E11': ['e-antialias', 'related', 'An RC input filter is the simplest anti-alias filter'],
  'B-E12': ['e-multimeter', 'related', 'Choosing a measurement setup'],
  'B-D03': ['s-elastic', 'related', 'Stiffness versus strength'],
  'B-D04': ['s-stress', 'decomposes', 'Axial case of normal stress'],
  'B-D05': ['s-deflection', 'related', 'Applies a supplied model; the derivation stays in the optional s-* track (decision 8)'],
  'B-D06': ['s-safetyfactor', 'possible', 'Applies a stated margin; master chooses margins under uncertainty'],
  'B-D08': ['s-thermalresist', 'related', 'Lumped thermal model (S7, decision 12)'],
  'R-M01': ['px-calibrate', 'possible', 'Same straight-line fit; V3 adds residual checks and validation points'],
  'R-M04': ['m-covariance', 'related', 'Covariance read as state uncertainty'],
  'R-M05': ['m-leastsquares', 'related', 'Nonlinear extension; m-leastsquares is already its prerequisite'],
  'R-M03': ['m-transdiff', 'related', 'Trigonometric derivatives applied to rotations'],
  'R-P01': ['p-friction', 'related', 'Applies a stated dry-friction model'],
  'R-E01': ['e-bus', 'related', 'Wiring a UART/SPI/I2C link'],
  'R-E02': ['e-encoder', 'related', 'Encoder channels and counts'],
  'E04': ['e-powerbudget', 'possible', 'Same budget; V3 adds voltage sag and runtime']
};
// Overviews (decision 6). primary = the V3 outcome that takes over its role; covers = all it summarizes.
const OVERVIEWS = {
  'r-frame': ['K01', ['K01', 'S06']], 'r-rigid': ['K03', ['K02', 'K03', 'K12']],
  'r-dof': ['K04', ['K04']], 'r-configuration': ['K04', ['K04', 'G03']],
  'r-forward': ['K08', ['K05', 'K08']], 'r-inverse': ['K11', ['K06', 'K11']],
  'r-jacobian': ['K10', ['K07', 'K09', 'K10']], 'r-staticload': ['A03', ['A03', 'K09']],
  'r-dynamics': ['A04', ['A04', 'A11', 'C06', 'X01']], 'r-transmission': ['A02', ['A01', 'A02', 'A05']],
  'r-actuator': ['A06', ['A04', 'A06', 'A07']], 'r-compliance': ['A09', ['A09']],
  'r-trajectory': ['C05', ['C05', 'C10', 'G04']], 'r-feedback': ['C01', ['C01', 'C02', 'C04']],
  'r-pid': ['C03', ['C02', 'C03']], 'r-statespace': ['R-M06', ['R-M06', 'C07']],
  'r-observe': ['C09', ['C09']], 'r-estimation': ['P08', ['R-M04', 'P03', 'P08']],
  'r-fusion': ['P09', ['P02', 'P06', 'P07', 'P09']], 'r-cameramodel': ['P04', ['R-P02', 'P04', 'P05', 'P10']],
  'r-navigation': ['N05', ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08', 'N09']],
  'r-planning': ['G04', ['G03', 'G04', 'N06', 'N08']], 'r-grasp': ['G01', ['G01', 'G02', 'G05']],
  'r-thermal': ['E11', ['B-D08', 'E11']], 'r-structure': ['D09', ['D09', 'D10', 'D11', 'D12', 'N10']],
  'r-system': ['I05', ['Q01', 'Q02', 'V01', 'V02', 'V03', 'V04', 'V05', 'V06', 'V07', 'I01', 'I02', 'I03', 'I04', 'I05']]
};
const KEEP_OVERVIEW = { 'r-singular': 'No V3 outcome assesses spatial singularity analysis (rank loss and SVD); K07 covers only the planar determinant. Kept as orientation; its prerequisite r-jacobian (retired) is replaced by K10.' };
// Master edges leaving an overview into a kept skill: re-pointed to the outcome that takes over.
const REPOINT = {
  'r-rigid>c-transforms': ['K03', 'prerequisite', 'Composing and inverting transforms is K03'],
  'r-pid>c-control-loop': ['C01', 'prerequisite', 'Sampled feedback and error sign is the concept c-control-loop implements; C02/C03 overlap it and get related links'],
  'r-dynamics>c-simulation': ['A04', 'supports', 'Single-axis torque model for simulation'],
  'r-jacobian>r-singular': ['K10', 'prerequisite', 'Spatial Jacobian, for the kept r-singular']
};
const DECISION11 = [
  { source: 'm-defintegral', target: 'C03', proposal: 'leave as supports', why: 'C03 implements the integral term in sampled form, and R-M02 (sampled accumulation) is already its prerequisite. The continuous integral explains it but is not needed to build or verify it.' },
  { source: 'm-derivative', target: 'C03', proposal: 'leave as supports', why: 'The derivative term is a finite difference, covered by R-M02. m-derivative is already on the path through other skills.' },
  { source: 'm-numericalint', target: 'N02', proposal: 'leave as supports', why: 'Odometry sums sampled increments (R-M02 is its prerequisite). Numerical integration theory is useful context, not required.' }
];

// ---------------------------------------------------------------- build the crosswalk
const sharedIds = [...V.keys()].filter(b => M.has(b));
const fresh = [...V.keys()].filter(b => !M.has(b));
const sug = new Map(); for (const s of recon.v3SuggestedCounterparts) (sug.get(bare(s.v3)) || sug.set(bare(s.v3), []).get(bare(s.v3))).push(s.masterId);
const K_COMPONENTS = new Set(['K01', 'K02', 'K03', 'K04', 'K05', 'K06', 'K07']);
const links = []; // proposed new edges in master/merged ids
const idOf = p => SAME[p]?.master ?? (M.has(p) ? p : `rob3:${p}`);
const newEntries = fresh.map(p => {
  const n = V.get(p), sp = S.get(p), cands = (sp.existing_candidates || []);
  const entry = { planningId: p, v3Id: n.id, name: n.name, kind: n.nodeKind, branch: n.subdomain, domain: n.domain, hasLesson: !!n.lesson,
    specCandidates: cands, wordOverlapSuggestions: sug.get(p) || [] };
  if (SAME[p]) {
    Object.assign(entry, { proposal: 'same-ability', masterId: SAME[p].master, why: SAME[p].why,
      effect: `V3's lesson and lesson fields go onto ${SAME[p].master}; rob3:${p} is not added; V3 edges to and from it use ${SAME[p].master}. planningId ${p} is kept on the node so the lesson importer and evidence overrides still find it.` });
    return entry;
  }
  entry.proposal = 'new';
  const rel = [];
  for (const c of cands) {
    if (/^r-/.test(c)) { rel.push({ masterId: c, relation: KEEP_OVERVIEW[c] ? 'related' : 'replaces-overview' }); continue; }
    if (/^sss-rob-/.test(c) && K_COMPONENTS.has(p)) { rel.push({ masterId: c, relation: 'component' }); continue; }
    rel.push({ masterId: c, relation: 'related' });
  }
  if (CLOSEST[p]) rel.push({ masterId: CLOSEST[p][0], relation: CLOSEST[p][1], note: CLOSEST[p][2] });
  entry.masterRelations = rel;
  entry.closestMaster = rel.find(r => r.relation !== 'replaces-overview')?.masterId ?? rel[0]?.masterId ?? null;
  if (rel.some(r => r.relation === 'possible')) entry.flag = 'possible same ability: left new, related link, for a later content pass';
  for (const r of rel) {
    if (r.relation === 'component') links.push({ type: 'prerequisite', source: r.masterId, target: `rob3:${p}`, reason: 'Decision 10: the master planar skills are the steps of this V3 outcome', origin: 'component' });
    else if (['related', 'possible', 'decomposes'].includes(r.relation) && !/^r-/.test(r.masterId)) links.push({ type: 'related', source: r.masterId, target: `rob3:${p}`, reason: r.note || 'Named by the V3 specification as an existing atlas candidate', origin: r.relation });
    else if (r.relation === 'related' && KEEP_OVERVIEW[r.masterId]) links.push({ type: 'related', source: r.masterId, target: `rob3:${p}`, reason: 'Kept overview', origin: 'related' });
  }
  return entry;
});
// skip "precedes" (V3 already has the prerequisite edge)
const overviews = master.nodes.filter(n => /^r-/.test(n.id)).map(n => {
  const ans = n.proficiency80 ?? null;
  if (KEEP_OVERVIEW[n.id] || ans !== null) return { id: n.id, name: n.name, answer: ans, proposal: 'keep as orientation', why: KEEP_OVERVIEW[n.id] || 'Holds an answer, so it is kept (queue rule).' };
  const [primary, covers] = OVERVIEWS[n.id];
  return { id: n.id, name: n.name, answer: ans, proposal: 'retire', primaryOutcome: primary, covers, coversNames: covers.map(c => V.get(c).name) };
});
const retired = new Set(overviews.filter(o => o.proposal === 'retire').map(o => o.id));
const primaryOf = Object.fromEntries(overviews.filter(o => o.primaryOutcome).map(o => [o.id, `rob3:${o.primaryOutcome}`]));
const overviewEdges = { dropped: [], repointed: [], carriedAsSupports: [] };

// ---------------------------------------------------------------- shared ids
const pre = (g, id) => g.edges.filter(e => e.target === id && e.type === 'prerequisite').map(e => bare(e.source));
const translate = x => SAME[x]?.master ?? x;
const sharedDiffs = [];
for (const b of sharedIds) {
  const a = pre(master, b), v = pre(v3, `rob3:${b}`).map(translate);
  const masterOnly = a.filter(x => !v.includes(x)), v3Only = v.filter(x => !a.includes(x));
  if (masterOnly.length || v3Only.length) sharedDiffs.push({ id: b, masterOnly, v3Only });
}
const prereqPolicy = sharedDiffs.map(d => {
  if (d.id === 'm-order') return { ...d, proposal: 'V3', why: 'V3 narrows m-order to basic arithmetic (its lesson teaches + − × ÷ and grouping) and places powers after fractions (m-fracmul → m-power). Keeping m-power → m-order would contradict the lesson. This removes one master edge: m-power → m-order.', removesMasterEdges: d.masterOnly.map(s => `${s} -> ${d.id}`) };
  return { ...d, proposal: 'union', why: 'V3 only adds prerequisites here; every master prerequisite stays.' };
});

// ---------------------------------------------------------------- simulate the merge (structure only)
const E = new Map(); const key = e => `${e.type}|${e.type === 'related' ? [e.source, e.target].sort().join('|') : e.source + '|' + e.target}`;
const add = e => { if (e.source === e.target) return; const k = key(e); if (!E.has(k)) E.set(k, e); };
const nodes = new Set(master.nodes.map(n => n.id).filter(id => !retired.has(id)));
for (const p of fresh) if (!SAME[p]) nodes.add(`rob3:${p}`);
const mid = id => { const b = bare(id); return SAME[b]?.master ?? (M.has(b) ? b : `rob3:${b}`); };
const removed = new Set(prereqPolicy.flatMap(p => p.removesMasterEdges || []));
for (const e of master.edges) {
  if (retired.has(e.source) || retired.has(e.target)) {
    const rp = REPOINT[`${e.source}>${e.target}`];
    if (rp) { add({ type: rp[1], source: `rob3:${rp[0]}`, target: e.target }); overviewEdges.repointed.push({ from: `${e.type} ${e.source} -> ${e.target}`, to: `${rp[1]} rob3:${rp[0]} -> ${e.target}`, why: rp[2] }); }
    else if (retired.has(e.target) && !retired.has(e.source) && e.type === 'prerequisite') overviewEdges.carriedAsSupports.push({ source: e.source, overview: e.target, target: primaryOf[e.target] });
    else overviewEdges.dropped.push(`${e.type} ${e.source} -> ${e.target}`);
    continue;
  }
  if (removed.has(`${e.source} -> ${e.target}`) && e.type === 'prerequisite') continue;
  add(e);
}
for (const e of v3.edges) add({ type: e.type, source: mid(e.source), target: mid(e.target) });
// decision 10
for (const s of ['K05', 'K06', 'K07']) for (const t of ['K08', 'K10', 'K11']) add({ type: 'prerequisite', source: `rob3:${s}`, target: `rob3:${t}` });
// overview prerequisites carried as supports onto the primary outcome, unless already an ancestor
const ancestors = id => { const seen = new Set(), st = [id]; while (st.length) { const x = st.pop(); for (const e of E.values()) if (e.type === 'prerequisite' && e.target === x && !seen.has(e.source)) { seen.add(e.source); st.push(e.source); } } return seen; };
// component and related links
for (const l of links) add(l);
const ancCache = new Map();
for (const c of overviewEdges.carriedAsSupports) {
  if (!ancCache.has(c.target)) ancCache.set(c.target, ancestors(c.target));
  c.action = ancCache.get(c.target).has(c.source) ? 'already a prerequisite ancestor: dropped' : 'added as supports';
  if (c.action === 'added as supports') add({ type: 'supports', source: c.source, target: c.target });
}
// cycle check + depth + redundant component links
const ids = [...nodes], indeg = new Map(ids.map(i => [i, 0])), kids = new Map(ids.map(i => [i, []])), depth = new Map(ids.map(i => [i, 0]));
let missing = 0;
for (const e of E.values()) { if (!nodes.has(e.source) || !nodes.has(e.target)) { missing++; continue; } if (e.type !== 'prerequisite') continue; kids.get(e.source).push(e.target); indeg.set(e.target, indeg.get(e.target) + 1); }
const q = ids.filter(i => !indeg.get(i)); let seen = 0;
for (let i = 0; i < q.length; i++) { const x = q[i]; seen++; for (const k of kids.get(x)) { depth.set(k, Math.max(depth.get(k), depth.get(x) + 1)); indeg.set(k, indeg.get(k) - 1); if (!indeg.get(k)) q.push(k); } }
const redundantComponents = links.filter(l => l.origin === 'component').filter(l => {
  const others = [...E.values()].filter(e => e.type === 'prerequisite' && e.target === l.target && e.source !== l.source);
  return others.some(o => ancestors(o.source).has(l.source));
}).map(l => `${l.source} -> ${l.target}`);
const milestonesClosed = ['I01', 'I02', 'I03', 'I04', 'I05'].every(m => nodes.has(`rob3:${m}`));
const simulation = {
  nodes: nodes.size, edges: E.size, danglingEdges: missing, prerequisiteCycle: seen !== ids.length,
  longestChain: Math.max(...depth.values()), milestonesPresent: milestonesClosed,
  redundantComponentLinks: redundantComponents,
  note: 'Structure only. No answers, lessons, levels or positions. Task 3 builds the real map with its own gates.'
};

const crosswalk = {
  format: 'skill-solar-system-merge-crosswalk', version: 1, status: 'DRAFT for JC (Checkpoint A). Nothing is built from it until JC approves.',
  generated: '2026-10-10',
  sources: { master: { file: 'Maps/Skill-Solar-System.json', sha256: sha(masterRaw) }, v3: { file: 'Maps/Robotics-v3/Robotics-v3-Lessons.json', sha256: sha(v3Raw) } },
  idPolicy: 'Master ids for the 204 shared skills; rob3: ids for the new V3 entries; the master for the two same-ability entries.',
  newEntries, overviews, overviewEdges,
  componentAndRelatedLinks: [...new Map(links.filter(l => !redundantComponents.includes(`${l.source} -> ${l.target}`)).map(l => [key(l), l])).values()],
  sharedIds: { count: sharedIds.length, name: [{ id: 'm-order', master: M.get('m-order').name, v3: V.get('m-order').name, proposal: 'V3', why: 'Matches the narrowed prerequisites and the V3 lesson' }],
    description: { proposal: 'master', why: `All ${sharedIds.length} differ only because every V3 description is a copy of its name; the master descriptions are full sentences. V3's teaching text travels in its lesson fields.` },
    prerequisites: prereqPolicy },
  decision11: DECISION11,
  answerCheck: { differences: [{ id: 'c-variables', masterFile: true, sharedRecord: null, meaning: 'The record holds a deliberate Clear, saved 2026-09-20; the map file (last changed 2026-09-14) still says Yes. The app shows the record, so JC currently sees Not marked.', proposal: 'JC decides. If unsure, keep the record (Not marked): it is the newer choice and what the app shows today.' }], mLogic: 'Both No (file and record); V3 has no answers.' },
  simulation
};
writeFileSync(OUT, JSON.stringify(crosswalk, null, 2) + '\n');
console.log(JSON.stringify({ simulation, counts: {
  new: newEntries.filter(e => e.proposal === 'new').length, same: newEntries.filter(e => e.proposal === 'same-ability').length,
  flagged: newEntries.filter(e => e.flag).map(e => e.planningId), retire: retired.size, keep: overviews.length - retired.size,
  repointed: overviewEdges.repointed.length, carried: overviewEdges.carriedAsSupports.filter(c => c.action === 'added as supports').length,
  carriedDropped: overviewEdges.carriedAsSupports.filter(c => c.action !== 'added as supports').length, droppedEdges: overviewEdges.dropped.length,
  componentLinks: links.filter(l => l.origin === 'component').length - redundantComponents.length, relatedLinks: new Set(links.filter(l => l.type === 'related').map(key)).size,
  sharedPrereqDiffsAfterSameAbility: sharedDiffs.length } }, null, 1));
