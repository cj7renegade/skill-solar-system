// The one skill card's data: the facts on its face, the lesson badge and button for every lesson
// state, and the demonstration checklist on milestones and checkpoints.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cardFacts, demonstrationChecklist, lessonAction, skillType, isDemonstrationNode } from '../src/skill-card.js';
import { lessonState, embeddedLesson, lessonKey } from '../src/lessons.js';
import { prerequisiteIndex, frontier } from '../src/learner.js';

const node = (id, extra = {}) => ({ id, name: `Skill ${id}`, domain: 'Robotics', description: `About ${id}.`, position: [0, 0, 0], proficiency80: null, ...extra });
const graph = {
  layout: { type: 'helix', topLevel: 244 }, metadata: { atlasFamily: 'fam', humanoidHelixImport: { buildStages: { 2: 'Mechanics' } } },
  nodes: [node('a', { proficiency80: true, courseCode: 'MTH', course: 'Mathematics', subdomain: 'Algebra', helixLevel: 1, buildStage: 2, helixTier: 'Core', helixType: 'QUANT', helixPractice: 'written' }),
    node('b', { proficiency80: false }), node('c', { helixLevel: 4, assessmentMode: 'written calculation' }), node('m', { nodeKind: 'milestone', helixLevel: 7 })],
  edges: [{ source: 'a', target: 'c', type: 'prerequisite' }, { source: 'b', target: 'c', type: 'prerequisite' }, { source: 'c', target: 'm', type: 'prerequisite' }, { source: 'a', target: 'm', type: 'prerequisite' }]
};
const learner = () => { const index = prerequisiteIndex(graph); return { index, frontier: frontier(graph, index) }; };

test('the card face: course, subject, helix level, stage, tier, type, description, prerequisites and unlocks', () => {
  const f = cardFacts(graph, graph.nodes[0], learner());
  assert.deepEqual(f.course, { code: 'MTH', name: 'Mathematics' }); assert.equal(f.subject, 'Algebra');
  assert.deepEqual(f.helixLevel, { level: 1, top: 244 }); assert.deepEqual(f.stage, { stage: 2, name: 'Mechanics' });
  assert.equal(f.tier, 'Core'); assert.equal(f.type, 'QUANT'); assert.equal(f.description, 'About a.'); assert.equal(f.proficient, true);
  assert.deepEqual(f.unlocks.map(u => u.id), ['c', 'm']);
  const c = cardFacts(graph, graph.nodes[2], learner());
  assert.deepEqual(c.prerequisites, [{ id: 'a', name: 'Skill a', answer: 'yes' }, { id: 'b', name: 'Skill b', answer: 'no' }], 'with the learner\'s own answers');
  assert.equal(c.type, 'QUANT', 'derived from the assessment mode when the map has no type');
  assert.equal(skillType(node('x', { assessmentMode: 'documented scenario' })), 'QUAL'); assert.equal(skillType(node('x')), null);
});

test('milestones and checkpoints get a demonstration checklist from their prerequisites', () => {
  assert.ok(isDemonstrationNode(graph.nodes[3])); assert.ok(!isDemonstrationNode(graph.nodes[0]));
  const list = demonstrationChecklist(cardFacts(graph, graph.nodes[3], learner()));
  assert.equal(list.total, 2); assert.equal(list.done, 1); assert.deepEqual(list.items.map(i => [i.id, i.done]), [['c', false], ['a', true]]);
});

test('every lesson state gives the same card with only the badge and button differing', () => {
  const none = lessonState(null), archive = lessonState({ archive: { status: 'reviewed' }, ai: null });
  const ai = lessonState({ archive: null, ai: { status: 'unreviewed', promptVersion: 'v1' } }, null, 'v1');
  const flagged = lessonState({ archive: null, ai: { status: 'flagged', promptVersion: 'v1' } });
  const old = lessonState({ archive: null, ai: { status: 'unreviewed', promptVersion: 'v0' } }, null, 'v1');
  assert.deepEqual([none, archive, ai, flagged].map(s => s.label), ['No lesson yet', 'Reviewed', 'AI-generated · unreviewed', 'Flagged']);
  assert.equal(old.outdated, true); assert.equal(ai.outdated, false);
  assert.equal(lessonState(null, embeddedLesson(node('e', { lesson: { x: 1 } }))).label, 'Reviewed', 'a lesson still in the map counts as a reviewed archive');
  const online = { ok: true }, offline = { ok: false, reason: 'Offline: lessons can be generated when the Guide is online.' };
  assert.deepEqual(lessonAction(none, online), { primary: 'generate', label: 'Generate lesson (~30 min)', disabled: false, reason: undefined });
  assert.deepEqual(lessonAction(none, offline), { primary: 'generate', label: 'Generate lesson (~30 min)', disabled: true, reason: offline.reason });
  assert.equal(lessonAction(archive, offline).primary, 'open', 'a cached or archived lesson still opens offline');
  assert.equal(lessonAction(old, online).update, true);
  assert.equal(lessonKey(graph), 'fam'); assert.equal(lessonKey({ nodes: [] }), 'default');
});
