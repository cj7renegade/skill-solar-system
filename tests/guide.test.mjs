// The AI Guide's page side: read-only tools over a small map, the per-question app state, the question
// loop with a scripted transport (append-only history, tool results, refusals, failures), and the
// reply format. No request leaves this test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS, SYSTEM_PROMPT, runTool, checkInput, appState, ask, parseReply, parseInline, MAX_STEPS } from '../src/guide.js';

// a and b are entry skills; c needs both; d needs c; M1 needs d.
const node = (id, extra = {}) => ({ id, name: `Skill ${id.toUpperCase()}`, description: `About ${id}.`, domain: 'Robotics', courseCode: 'MTH', position: [0, 0, 0], proficiency80: null, ...extra });
const graph = (marks = {}) => ({
  title: 'Test map',
  nodes: [node('a', { helixLevel: 1 }), node('b', { helixLevel: 1, courseCode: 'PHY' }), node('c', { helixLevel: 4, lesson: { sections: [] } }), node('d', { helixLevel: 7 }),
    node('m1', { helixLevel: 10, nodeKind: 'milestone', name: 'Milestone One' })].map(n => ({ ...n, proficiency80: marks[n.id] ?? null })),
  edges: [{ source: 'a', target: 'c', type: 'prerequisite' }, { source: 'b', target: 'c', type: 'prerequisite' }, { source: 'c', target: 'd', type: 'prerequisite' },
    { source: 'd', target: 'm1', type: 'prerequisite' }, { source: 'a', target: 'd', type: 'related' }]
});
const ctx = (marks, extra = {}) => ({ graph: graph(marks), target: 'm1', selected: null, pathTarget: null, reviewLeft: 0, record: null, today: '2026-11-06', ...extra });

test('the tools are read-only lookups, and the prompt keeps the Guide to guidance with manual proficiency', () => {
  assert.deepEqual(TOOLS.map(t => t.name), ['get_overview', 'search_skills', 'get_skill', 'path_to', 'next_up', 'course_summary', 'recent_answers']);
  for (const t of TOOLS) assert.ok(!/\b(set|mark|write|update|delete|create)_/.test(t.name), t.name);
  assert.match(SYSTEM_PROMPT, /Guidance only/);
  assert.match(SYSTEM_PROMPT, /You cannot mark anything/);
  assert.match(SYSTEM_PROMPT, /Do not teach the subject/);
  assert.match(SYSTEM_PROMPT, /\(skill:ID\)/);
});

test('overview: target progress, milestones, answer counts and the ready set', () => {
  const o = runTool('get_overview', {}, ctx({ a: true, b: false }));
  assert.equal(o.map, 'Test map'); assert.equal(o.skills, 5); assert.equal(o.answeredYes, 1); assert.equal(o.answeredNo, 1);
  assert.equal(o.target.id, 'm1'); assert.equal(o.target.prerequisites, 4); assert.equal(o.target.proficient, 1); assert.equal(o.target.left, 4);
  assert.equal(o.readyToStudy, 1); // b only: c still needs b
  assert.deepEqual(o.milestones.map(m => m.id), ['m1']);
});

test('search, skill details and unknown ids', () => {
  assert.deepEqual(runTool('search_skills', { query: 'skill c' }, ctx()).results.map(r => r.id), ['c']);
  const c = runTool('get_skill', { id: 'c' }, ctx({ a: true, b: true }));
  assert.equal(c.ready, true); assert.equal(c.hasLesson, true); assert.equal(c.answer, 'Not marked');
  assert.deepEqual(c.prerequisites.map(p => p.id).sort(), ['a', 'b']); assert.deepEqual(c.unlocks.map(p => p.id), ['d']);
  assert.ok(!('lesson' in c), 'no lesson content is returned');
  assert.match(runTool('get_skill', { id: 'zz' }, ctx()).error, /No skill/);
  assert.equal(runTool('get_skill', { id: 'Skill D' }, ctx()).id, 'd', 'an exact name also works');
});

test('path and next up follow the shared learner definitions', () => {
  const p = runTool('path_to', { id: 'm1' }, ctx({ a: true }));
  assert.equal(p.skillsLeft, 4); assert.deepEqual(p.studyOrder.map(s => s.id), ['b', 'c', 'd', 'm1']); assert.deepEqual(p.perCourse, { PHY: 1, MTH: 3 });
  assert.deepEqual(runTool('next_up', {}, ctx()).next.map(n => n.id), ['a', 'b']);
  assert.match(runTool('next_up', {}, ctx({ a: true, b: true, c: true, d: true, m1: true })).note, /complete/);
  assert.deepEqual(runTool('course_summary', {}, ctx({ b: true })).courses, [{ course: 'MTH', name: null, skills: 4, yes: 0, ready: 1 }, { course: 'PHY', name: null, skills: 1, yes: 1, ready: 0 }]);
});

test('recent answers come from the shared record, newest first', () => {
  const record = { entries: { a: { value: true, updatedAt: '2026-11-01T10:00:00Z' }, b: { value: false, updatedAt: '2026-11-05T10:00:00Z' }, gone: { value: true, updatedAt: '2026-11-06T10:00:00Z' } } };
  assert.deepEqual(runTool('recent_answers', {}, ctx({}, { record })).recent.map(r => [r.id, r.date]), [['b', '2026-11-05'], ['a', '2026-11-01']]);
});

test('tool inputs are checked against their schemas', () => {
  assert.equal(checkInput('get_skill', { id: 'a' }), null);
  assert.match(checkInput('get_skill', {}), /Missing id/);
  assert.match(checkInput('get_skill', { id: 3 }), /text/);
  assert.match(checkInput('path_to', { id: 'a', limit: 2.5 }), /whole number/);
  assert.match(checkInput('get_overview', { extra: 1 }), /Unknown field/);
  assert.match(checkInput('mark_skill', {}), /Unknown tool/);
  assert.match(runTool('search_skills', { query: 7 }, ctx()).error, /text/);
});

test('the app state names the target, the selection, path mode and an unfinished review', () => {
  const s = appState(ctx({ a: true }, { selected: 'c', pathTarget: 'd', reviewLeft: 3 }));
  assert.match(s, /^<app_state>/); assert.match(s, /Today: 2026-11-06/); assert.match(s, /Target milestone: Milestone One \(id m1\), 20%/);
  assert.match(s, /Selected skill: Skill C \(id c\), answer Not marked/); assert.match(s, /path to Skill D/); assert.match(s, /3 skills left/);
});

// A scripted model: the first turn calls a tool, the second answers using the result.
function scripted(turns) {
  const requests = [];
  return { requests, turn: async request => { requests.push(JSON.parse(JSON.stringify(request))); const next = turns.shift(); return typeof next === 'function' ? next(request) : next; } };
}
const reply = (content, stop_reason = 'end_turn') => ({ ok: true, message: { content, stop_reason } });

test('a question runs tools and returns the final answer; history is append-only', async () => {
  const conversation = [], c = ctx();
  const transport = scripted([
    reply([{ type: 'thinking', thinking: '', signature: 'sig' }, { type: 'tool_use', id: 't1', name: 'next_up', input: {} }], 'tool_use'),
    request => { const result = JSON.parse(request.messages.at(-1).content[0].content); return reply([{ type: 'text', text: `Start with [${result.next[0].name}](skill:${result.next[0].id}).` }]); }
  ]);
  const steps = [];
  const result = await ask(conversation, 'What next?', c, transport, { onStep: names => steps.push(names) });
  assert.deepEqual(result, { ok: true, text: 'Start with [Skill A](skill:a).' });
  assert.deepEqual(steps, [['next_up']]);
  assert.deepEqual(conversation.map(m => m.role), ['user', 'assistant', 'user', 'assistant']);
  assert.equal(conversation[1].content[0].signature, 'sig', 'assistant turns go back exactly as returned');
  assert.equal(conversation[2].content[0].tool_use_id, 't1');
  // the second request starts with the first one unchanged (append-only)
  assert.deepEqual(transport.requests[1].messages.slice(0, 1), transport.requests[0].messages);
  assert.equal(transport.requests[0].system, SYSTEM_PROMPT);
  // a follow-up question appends after the answer
  await ask(conversation, 'And then?', c, scripted([reply([{ type: 'text', text: 'Then B.' }])]));
  assert.equal(conversation.length, 6);
});

test('a bad tool input returns an error result; refusals, failures and runaway loops end the question', async () => {
  const conversation = [];
  await ask(conversation, 'x', ctx(), scripted([reply([{ type: 'tool_use', id: 't1', name: 'get_skill', input: {} }], 'tool_use'), reply([{ type: 'text', text: 'ok' }])]));
  assert.equal(conversation[2].content[0].is_error, true);
  assert.deepEqual(await ask([], 'x', ctx(), scripted([reply([], 'refusal')])), { ok: false, reason: 'refusal' });
  assert.deepEqual(await ask([], 'x', ctx(), scripted([{ ok: false, reason: 'disconnected', error: 'down' }])), { ok: false, reason: 'disconnected', error: 'down' });
  const loop = Array.from({ length: MAX_STEPS }, (_, i) => reply([{ type: 'tool_use', id: `t${i}`, name: 'get_overview', input: {} }], 'tool_use'));
  assert.equal((await ask([], 'x', ctx(), scripted(loop))).reason, 'too-many-steps');
  // a tool input cut off at max_tokens is not run
  const cut = [];
  await ask(cut, 'x', ctx(), scripted([reply([{ type: 'tool_use', id: 't1', name: 'get_skill', input: { id: 'a' } }], 'max_tokens'), reply([{ type: 'text', text: 'ok' }])]));
  assert.match(cut[2].content[0].content, /cut off/);
});

test('replies parse into paragraphs, lists, headings, bold and skill links only', () => {
  const blocks = parseReply('# Plan\nFirst **this**.\nStill first.\n\n- [Skill A](skill:a)\n- then `b`\n\n1. one\n2. [Path to D](path:d)\n\n<b>no html</b> [x](https://example.com)');
  assert.deepEqual(blocks.map(b => b.type), ['h', 'p', 'ul', 'ol', 'p']);
  assert.deepEqual(blocks[1].inline.map(i => i.t), ['text', 'b', 'text', 'text', 'text']);
  assert.deepEqual(blocks[2].items[0], [{ t: 'skill', text: 'Skill A', id: 'a' }]);
  assert.deepEqual(blocks[3].items[1], [{ t: 'path', text: 'Path to D', id: 'd' }]);
  assert.deepEqual(blocks[4].inline, [{ t: 'text', text: '<b>no html</b> [x](https://example.com)' }], 'other markup and web links stay plain text');
  assert.deepEqual(parseInline('plain'), [{ t: 'text', text: 'plain' }]);
});
