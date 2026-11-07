// Checks the helix layout and its display rules (src/helix.js), and that maps which are not helix
// maps are unaffected. Synthetic data, plus the real helix map when it is present locally.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { validate, nodeColor, DOMAINS, positionExplanation, placementSummary } from '../src/model.js';
import { arrangeHelix, isHelixMap, courseColors, matchesHelixFilters, tierOf, helixLevels, HELIX_HEIGHT } from '../src/helix.js';

const node = (id, extra = {}) => ({ id, name: `Skill ${id}`, domain: 'Robotics', description: '', position: [0, 0, 0], pinned: false, layoutMode: 'vortex', ...extra });
const edge = (source, target) => ({ source, target, type: 'prerequisite' });
const COURSES = [['AAA', 'First course'], ['BBB', 'Second course'], ['CCC', 'Third course'], ['DDD', 'Fourth course']];
const helixGraph = () => ({
  schemaVersion: 1, title: 'Helix', layout: { type: 'helix' }, levelModel: { range: [1, 200] },
  metadata: { courses: COURSES, humanoidHelixImport: { atlasTiers: { a: 'Core', b: 'Enrichment' } } },
  nodes: [node('a', { courseCode: 'AAA', buildStage: 1, onHumanoidPath: true }), node('b', { courseCode: 'BBB', buildStage: null, onHumanoidPath: false }),
    node('c', { courseCode: 'BBB', buildStage: 2, onHumanoidPath: true, helixTier: 'Working', nodeKind: 'checkpoint' }),
    node('m', { courseCode: 'DDD', buildStage: 2, onHumanoidPath: true, helixTier: 'Milestone', nodeKind: 'milestone' })],
  edges: [edge('a', 'b'), edge('b', 'c'), edge('c', 'm')]
});

test('a map declares a wider level range; every other map keeps 1–100', () => {
  const plain = { schemaVersion: 1, nodes: [node('x', { skillLevel: 101 })], edges: [] };
  assert.throws(() => validate(plain), /1 to 100/);
  assert.doesNotThrow(() => validate({ ...plain, levelModel: { range: [1, 184] } }));
  assert.throws(() => validate({ ...plain, nodes: [node('x', { skillLevel: 185 })], levelModel: { range: [1, 184] } }), /1 to 184/);
  assert.throws(() => validate({ ...plain, levelModel: { range: [1, 50] } }), /1 to 100/);   // a narrower range never tightens the limit
});

test('helix height is the helix level, scaled so the top level sits at the vortex\'s top', () => {
  const out = arrangeHelix(helixGraph()), y = id => out.nodes.find(n => n.id === id).position[1];
  const lv = helixLevels(out);
  assert.deepEqual(['a', 'b', 'c', 'm'].map(id => lv.get(id)), [1, 4, 7, 10]);
  assert.equal(y('a'), 0);
  assert.equal(y('m'), HELIX_HEIGHT);
  assert.ok(y('a') < y('b') && y('b') < y('c') && y('c') < y('m'));
  assert.equal(out.layout.type, 'helix');
  assert.equal(out.layout.topLevel, 10);
  assert.deepEqual(out.layout.courseOrder, ['AAA', 'BBB', 'CCC', 'DDD']);
});

test('milestones sit on the central axis, and each course takes its own angular sector', () => {
  const out = arrangeHelix(helixGraph()), at = id => out.nodes.find(n => n.id === id).position;
  assert.deepEqual([at('m')[0], at('m')[2]], [0, 0]);
  // Course AAA's first node at level 1 is at the start of the first sector (t = 0).
  const angle = p => Math.atan2(p[2], p[0]);
  assert.ok(Math.abs(angle(at('a'))) < 2 * Math.PI / 4 / 2 + 1e-9);
  assert.ok(Math.hypot(at('a')[0], at('a')[2]) >= 700);
});

test('pinned skills keep their position, and nothing but positions and the layout changes', () => {
  const g = helixGraph(); g.nodes[1].pinned = true; g.nodes[1].position = [5, 6, 7];
  const out = arrangeHelix(g);
  assert.deepEqual(out.nodes[1].position, [5, 6, 7]);
  for (const [i, n] of out.nodes.entries()) { const { position, ...rest } = n, { position: p0, ...rest0 } = g.nodes[i]; assert.deepEqual(rest, rest0); }
  assert.deepEqual(out.edges, g.edges);
});

test('courses get distinct colours, used only when a palette is passed', () => {
  const families = courseColors([['MTH', 'Mathematics'], ['MEC', 'Mechanical'], ['ELX', 'Electronics'], ['LOC', 'Locomotion'], ['SYS', 'Systems']]);
  assert.equal(new Set(Object.values(families)).size, 5);
  const colors = courseColors(COURSES);                        // codes the palette does not know: a neutral grey
  assert.match(colors.AAA, /^#[0-9a-f]{6}$/);
  const n = node('a', { courseCode: 'AAA', domain: 'Physics' });
  assert.equal(nodeColor(n, false, colors), colors.AAA);
  assert.equal(nodeColor(n, false), DOMAINS.Physics);          // no palette: the domain colour, as before
  assert.equal(nodeColor({ ...n, proficiency80: true }, true, colors), '#f2c14e');   // proficiency colouring wins
});

test('filters match course, stage, path and tier, and an empty filter matches everything', () => {
  const g = helixGraph(), [a, b, c, m] = g.nodes;
  assert.ok(g.nodes.every(n => matchesHelixFilters(g, n, {})));
  assert.deepEqual(g.nodes.filter(n => matchesHelixFilters(g, n, { course: 'BBB' })).map(n => n.id), ['b', 'c']);
  assert.deepEqual(g.nodes.filter(n => matchesHelixFilters(g, n, { stage: '2' })).map(n => n.id), ['c', 'm']);
  assert.deepEqual(g.nodes.filter(n => matchesHelixFilters(g, n, { stage: 'none' })).map(n => n.id), ['b']);
  assert.deepEqual(g.nodes.filter(n => matchesHelixFilters(g, n, { path: 'false' })).map(n => n.id), ['b']);
  assert.equal(tierOf(g, a), 'Core');                          // an Atlas skill: from the lookup table
  assert.equal(tierOf(g, c), 'Working');                       // a new skill: its own field
  assert.deepEqual(g.nodes.filter(n => matchesHelixFilters(g, n, { tier: 'Enrichment' })).map(n => n.id), ['b']);
  assert.ok(matchesHelixFilters(g, m, { course: 'DDD', stage: '2', path: 'true', tier: 'Milestone' }));
});

test('only helix maps are helix maps, and their cards say so', () => {
  const g = arrangeHelix(helixGraph());
  assert.ok(isHelixMap(g));
  assert.ok(!isHelixMap({ layout: { type: 'vortex' } }) && !isHelixMap({}));
  const b = { ...g.nodes[1], course: 'Second course' };
  assert.match(positionExplanation(g, b), /helix level/);
  assert.match(placementSummary(g, b), /Second course band of the helix/);
  const plain = { ...g, layout: { type: 'vortex' } };
  assert.match(placementSummary(plain, b), /Robotics strand of the spiral/);   // unchanged wording elsewhere
});

const MAP = path.join(path.resolve(import.meta.dirname, '..'), 'Maps', 'Humanoid-Helix-Atlas.json');
test('the real helix map: valid, milestones on the axis, checkpoints and tiers in place', { skip: !existsSync(MAP) && 'needs Maps/Humanoid-Helix-Atlas.json' }, () => {
  const map = JSON.parse(readFileSync(MAP, 'utf8'));
  assert.doesNotThrow(() => validate(map));
  assert.ok(isHelixMap(map));
  const milestones = map.nodes.filter(n => n.nodeKind === 'milestone');
  assert.deepEqual(milestones.map(n => n.id).sort(), ['hx-sys-ms-i06', 'hx-sys-ms-i07', 'hx-sys-ms-i08', 'hx-sys-ms-i09', 'rob3:I01', 'rob3:I02', 'rob3:I03', 'rob3:I04', 'rob3:I05']);
  assert.ok(milestones.every(n => Math.hypot(n.position[0], n.position[2]) < 100));
  assert.equal(map.nodes.filter(n => n.nodeKind === 'checkpoint').length, 67);
  assert.equal(map.layout.topLevel, 244);
  assert.ok(map.nodes.every(n => tierOf(map, n)));
  assert.equal(Math.max(...map.nodes.map(n => n.position[1])), HELIX_HEIGHT);
});

test('the card level line shows the helix level on helix maps, and the old wording elsewhere', async () => {
  const { levelLine } = await import('../src/helix.js');
  const g = arrangeHelix(helixGraph()), n = { ...g.nodes[1], course: 'Second course', helixLevel: 4, skillLevel: 30 };
  assert.equal(levelLine(g, n, 'Level', ' · Level unassigned'), 'Second course · Helix level 4/10');
  const plain = { ...g, layout: { type: 'vortex' } };
  assert.equal(levelLine(plain, n, 'Reference level', ''), 'Robotics · Reference level 30/100');
  assert.equal(levelLine(plain, { ...n, skillLevel: null }, 'Level', ' · Level unassigned'), 'Robotics · Level unassigned');
});
