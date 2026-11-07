// Lesson generation with a mocked Claude client (no real calls): the context builder, schema and
// local validation (good and bad payloads), the request shape, retries, cancelling, and the QUANT
// verification pass with repair and flagging.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildLessonContext, practiceOf, safetyRequired, DEFAULT_LEARNER_PROFILE } from '../src/lesson-context.js';
import { prerequisiteIndex } from '../src/learner.js';

const require = createRequire(import.meta.url);
const SDK = require('@anthropic-ai/sdk');
const gen = require('../desktop/lesson-gen.cjs');

// --- Context ------------------------------------------------------------------------------------
const node = (id, extra = {}) => ({ id, name: `Skill ${id}`, domain: 'Robotics', description: `About ${id}.`, position: [0, 0, 0], proficiency80: null, ...extra });
const graph = { layout: { type: 'helix', topLevel: 244 }, metadata: { humanoidHelixImport: { buildStages: { 3: 'Electrical' } } },
  nodes: [node('a', { proficiency80: true }), node('b', { proficiency80: false }), node('c', { courseCode: 'ELX', course: 'Electrical', subdomain: 'DC circuits', helixLevel: 7, buildStage: 3, helixTier: 'Core', helixType: 'QUANT', helixPractice: 'hands-on', assessmentMode: 'circuit analysis or supervised measurement' }), node('d')],
  edges: [{ source: 'a', target: 'c', type: 'prerequisite' }, { source: 'b', target: 'c', type: 'prerequisite' }, { source: 'c', target: 'd', type: 'prerequisite' }, { source: 'd', target: 'a', type: 'related' }] };

test('context: the skill, prerequisites with proficiency flags, unlocks and the learner profile', () => {
  const ctx = buildLessonContext(graph, graph.nodes[2], { index: prerequisiteIndex(graph) });
  assert.deepEqual(ctx.skill, { name: 'Skill c', description: 'About c.', course: 'ELX', courseName: 'Electrical', subject: 'DC circuits', helixLevel: 7, buildStage: '3 · Electrical', level: 'Core', type: 'QUANT', practice: 'hands-on', assessmentMode: 'circuit analysis or supervised measurement' });
  assert.deepEqual(ctx.prerequisites, [{ name: 'Skill a', description: 'About a.', proficient: true }, { name: 'Skill b', description: 'About b.', proficient: false }], 'No is not proficient');
  assert.deepEqual(ctx.unlocks, ['Skill d']); assert.equal(ctx.learner, DEFAULT_LEARNER_PROFILE); assert.equal(ctx.safetyRequired, true);
  assert.equal(practiceOf(node('x', { assessmentMode: 'runnable code or trace' })), 'code'); assert.equal(practiceOf(node('x')), 'written');
  assert.equal(safetyRequired(node('x', { name: 'MIG welding joints' })), true); assert.equal(safetyRequired(node('x', { name: 'Vectors' })), false);
  assert.equal(gen.inputHash(ctx), gen.inputHash({ ...ctx, learner: 'Someone else' }), 'the profile does not change the input hash');
  assert.notEqual(gen.inputHash(ctx), gen.inputHash({ ...ctx, prerequisites: [] }));
});

// --- Validation ---------------------------------------------------------------------------------
const problem = (id, v = 2, extra = {}) => ({ id, prompt: `Find R for ${id}.`, hints: ['Use Ohm\'s law.'], solution: 'R = V / I.', answer: `${v} Ω`, finalValue: v, unit: 'Ω', ...extra });
export const goodLesson = () => ({
  title: 'Ohm\'s law in practice', estimatedMinutes: 30, objectives: ['Relate V, I and R.', 'Measure safely.'],
  explanation: 'Ohm\'s law: $V = IR$. '.repeat(40), workedExample: { problem: 'A 12 V source drives 3 A.', steps: ['R = V / I', 'R = 12 V / 3 A = 4 Ω'], result: '4 Ω' },
  guidedPractice: [problem('g1', 2), problem('g2', 5)], independentPractice: [problem('p1', 10, { hints: [] }), problem('p2', 3, { hints: [] }), problem('p3', 6, { hints: [] })],
  checkForUnderstanding: [{ question: 'q1', answer: 'a1' }, { question: 'q2', answer: 'a2' }, { question: 'q3', answer: 'a3' }],
  safety: { hazards: ['Shorting a battery.'], precautions: ['Fuse the supply.'], stopConditions: ['Heat or smell.'] },
  demonstration: { description: 'Measure a resistor on a bench supply.', evidence: ['Photo of meter'], satisfiedByLesson: false },
  keyTerms: [{ term: 'Resistance', definition: 'Opposition to current.' }, { term: 'Current', definition: 'Charge flow.' }], commonMistakes: ['Mixing mA and A.']
});
const ctx = () => buildLessonContext(graph, graph.nodes[2], { index: prerequisiteIndex(graph) });

test('validation: a good lesson passes; bad payloads are caught', () => {
  assert.deepEqual(gen.validateLesson(goodLesson(), ctx()), []);
  const bad = (change, pattern) => { const l = goodLesson(); change(l); assert.match(gen.validateLesson(l, ctx()).join(' '), pattern); };
  bad(l => { delete l.explanation; }, /Missing explanation/);
  bad(l => { l.objectives = ['one']; }, /objectives: expected 2–4/);
  bad(l => { l.independentPractice = l.independentPractice.slice(0, 2); }, /independentPractice: expected 3–5/);
  bad(l => { l.checkForUnderstanding.pop(); }, /checkForUnderstanding/);
  bad(l => { l.guidedPractice[1].id = 'g1'; }, /unique/);
  bad(l => { l.guidedPractice[0].hints = []; }, /at least one hint/);
  bad(l => { l.safety = null; }, /needs a safety section/);
  bad(l => { l.demonstration = null; }, /hands-on skill needs a demonstration/);
  bad(l => { l.demonstration.satisfiedByLesson = true; }, /not satisfied/);
  bad(l => { l.explanation = 'short'; }, /too short/);
  assert.deepEqual(gen.validateLesson('x'), ['The lesson is not an object.']);
});

test('the schema is strict: every object closes its properties and every field is required', () => {
  const walk = (s, path = '') => {
    if (s.type === 'object') { assert.equal(s.additionalProperties, false, path); assert.deepEqual([...s.required].sort(), Object.keys(s.properties).sort(), path); }
    for (const [k, v] of Object.entries(s.properties || {})) walk(v, `${path}.${k}`);
    if (s.items) walk(s.items, `${path}[]`); for (const v of s.anyOf || []) walk(v, path); for (const v of Object.values(s.$defs || {})) walk(v, `${path}$defs`);
  };
  walk(gen.LESSON_SCHEMA); walk(gen.VERIFY_SCHEMA);
  assert.match(gen.SYSTEM_PROMPT, /Never state or imply that the learner is proficient/);
  assert.match(gen.SYSTEM_PROMPT, /Original wording only/); assert.match(gen.SYSTEM_PROMPT, /Always show units/); assert.match(gen.SYSTEM_PROMPT, /Safety first/);
});

test('answer comparison: numbers within 2 %, loose units, and non-numeric answers left unchecked', () => {
  assert.equal(gen.agrees({ finalValue: 4, unit: 'Ω' }, { finalValue: 4.05, unit: 'ohm' }), true);
  assert.equal(gen.agrees({ finalValue: 4, unit: 'V' }, { finalValue: 4.2, unit: 'V' }), false);
  assert.equal(gen.agrees({ finalValue: 4, unit: 'V' }, { finalValue: 4, unit: 'A' }), false);
  assert.equal(gen.agrees({ finalValue: 9.81, unit: 'm/s^2' }, { finalValue: 9.8, unit: 'm per s^2' }), true);
  assert.equal(gen.agrees({ finalValue: null, unit: null }, { finalValue: 3, unit: 'V' }), null);
});

// --- Generation with a mocked client ---------------------------------------------------------------
// replies: functions (params) => { text } or { error } in order; every request is recorded.
function mockClient(replies) {
  const requests = [];
  return { requests, beta: { messages: { stream: (params, options) => {
    requests.push({ params, options });
    const next = replies.shift(), handlers = [];
    return { on: (e, f) => { if (e === 'text') handlers.push(f); },
      finalMessage: async () => {
        if (options?.signal?.aborted) throw new SDK.APIUserAbortError();
        const r = typeof next === 'function' ? next(params) : next;
        if (r.error) throw r.error;
        for (const chunk of r.text.match(/[\s\S]{1,200}/g) || []) for (const h of handlers) h(chunk);
        return { content: [{ type: 'text', text: r.text }], stop_reason: r.stop || 'end_turn', model: params.model, usage: { input_tokens: 1000, output_tokens: 500 } };
      } };
  } } } };
}
const json = v => ({ text: JSON.stringify(v) });
const answers = (lesson, override = {}) => json({ answers: [...lesson.guidedPractice, ...lesson.independentPractice].map(p => ({ id: p.id, answer: p.answer, finalValue: override[p.id] ?? p.finalValue, unit: p.unit })) });

test('a QUANT lesson is written, verified and returned unreviewed, with the request shape the docs require', async () => {
  const lesson = goodLesson(), client = mockClient([json(lesson), answers(lesson)]), progress = [];
  const r = await gen.generateLesson({ client, SDK, context: ctx(), onProgress: p => progress.push(p.stage) });
  assert.equal(r.status, 'unreviewed'); assert.equal(r.verification.checked, 5); assert.deepEqual(r.verification.mismatches, []);
  assert.equal(r.model, 'claude-sonnet-5-5'); assert.equal(r.promptVersion, gen.PROMPT_VERSION); assert.equal(r.usage.tokensIn, 2000); assert.equal(r.usage.requests, 2);
  const p = client.requests[0].params;
  assert.equal(p.model, 'claude-sonnet-5-5'); assert.deepEqual(p.output_config.format, { type: 'json_schema', schema: gen.LESSON_SCHEMA });
  assert.equal(p.output_config.effort, 'medium'); assert.deepEqual(p.cache_control, { type: 'ephemeral' }); assert.equal(p.system, gen.SYSTEM_PROMPT);
  assert.equal(p.fallbacks, 'default'); assert.ok(!('tools' in p) && !('tool_choice' in p) && !('thinking' in p));
  assert.match(p.messages[0].content, /"proficient": true/);
  assert.ok(!JSON.stringify(client.requests[1].params.messages).includes('"answer"'), 'the check sees the problems without the key');
  assert.ok(progress.includes('writing') && progress.includes('verifying'));
});

test('Haiku requests carry no server-side fallback', async () => {
  const lesson = { ...goodLesson() }, c = { ...ctx(), skill: { ...ctx().skill, type: 'QUAL' } };
  const client = mockClient([json(lesson)]);
  await gen.generateLesson({ client, SDK, model: 'claude-haiku-5-5', context: c });
  assert.ok(!('fallbacks' in client.requests[0].params) && !('betas' in client.requests[0].params));
  await assert.rejects(gen.generateLesson({ client, SDK, model: 'gpt-4', context: c }), /Unknown model/);
});

test('a problem that disagrees is repaired once; if it still disagrees the lesson is flagged', async () => {
  const lesson = goodLesson();
  const repaired = { ...problem('p2', 3, { hints: [] }), prompt: 'Find R again.' };
  // p1 disagrees (repair fixes it); p2 disagrees twice (flagged).
  const client = mockClient([json(lesson), answers(lesson, { p1: 99, p2: 7 }), json({ ...problem('p1', 10, { hints: [] }), prompt: 'Find R (fixed).' }), answers({ guidedPractice: [], independentPractice: [problem('p1', 10)] }), json(repaired), json({ answers: [{ id: 'p2', answer: '8 Ω', finalValue: 8, unit: 'Ω' }] })]);
  const r = await gen.generateLesson({ client, SDK, context: ctx() });
  assert.equal(r.status, 'flagged'); assert.deepEqual(r.verification.repaired, ['p1', 'p2']); assert.deepEqual(r.verification.mismatches.map(m => m.id), ['p2']);
  assert.equal(r.lesson.independentPractice[0].prompt, 'Find R (fixed).');
  assert.equal(client.requests.length, 6);
});

test('invalid JSON, failed checks and rate limits get one retry; then a clear error and nothing returned', async () => {
  const lesson = goodLesson(), q = { ...ctx(), skill: { ...ctx().skill, type: 'QUAL' } };
  assert.equal((await gen.generateLesson({ client: mockClient([{ text: '{"title": "cut' }, json(lesson)]), SDK, context: q })).status, 'unreviewed');
  const rate = new SDK.RateLimitError(429, { type: 'error', error: { type: 'rate_limit_error', message: 'slow down' } }, 'slow down', new Headers());
  assert.equal((await gen.generateLesson({ client: mockClient([{ error: rate }, json(lesson)]), SDK, context: q })).status, 'unreviewed');
  await assert.rejects(gen.generateLesson({ client: mockClient([{ error: rate }, { error: rate }]), SDK, context: q }), e => e.kind === 'busy');
  const short = { ...lesson, objectives: ['one'] };
  await assert.rejects(gen.generateLesson({ client: mockClient([json(short), json(short)]), SDK, context: q }), e => e.kind === 'invalid' && /did not pass its checks/.test(e.message));
  await assert.rejects(gen.generateLesson({ client: mockClient([{ text: '{}', stop: 'refusal' }]), SDK, context: q }), e => e.kind === 'refusal');
  const down = new SDK.APIConnectionError({ message: 'Connection error.' });
  await assert.rejects(gen.generateLesson({ client: mockClient([{ error: down }, { error: down }]), SDK, context: q }), e => e.kind === 'offline');
});

test('cancelling stops generation without a result', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(gen.generateLesson({ client: mockClient([json(goodLesson())]), SDK, context: ctx(), signal: controller.signal }), e => e.kind === 'cancelled');
});

test('the lesson service: availability reasons, cap, cache hit/miss, saving complete lessons only, review notes', async () => {
  const { mkdtempSync } = await import('node:fs'); const { tmpdir } = await import('node:os'); const path = (await import('node:path')).default;
  const { createLessons, costOf } = require('../desktop/lessons.cjs');
  let status = { hasKey: true, enabled: true, state: 'online' }, client = mockClient([]);
  const guide = { status: () => status, client: () => client };
  const lessons = createLessons({ dir: mkdtempSync(path.join(tmpdir(), 'sss-lessons-')), guide, SDK });
  const q = { ...ctx(), skill: { ...ctx().skill, type: 'QUAL' } };
  assert.equal(lessons.availability().ok, true);
  status = { hasKey: false }; assert.match(lessons.availability().reason, /API key/);
  status = { hasKey: true, enabled: true, state: 'disconnected' }; assert.match(lessons.availability().reason, /Offline/);
  assert.deepEqual((await lessons.generate('j0', 'fam', 'c', q)).kind, 'unavailable');
  status = { hasKey: true, enabled: true, state: 'online' };

  client = mockClient([json(goodLesson())]);
  const first = await lessons.generate('j1', 'fam', 'c', q);
  assert.equal(first.ok, true); assert.equal(first.record.source, 'ai-generated'); assert.equal(first.record.status, 'unreviewed');
  assert.equal(first.record.model, 'claude-sonnet-5-5'); assert.ok(first.record.cost > 0); assert.match(client.requests[0].params.messages[0].content, /welder\/fabricator/);
  const again = await lessons.generate('j2', 'fam', 'c', q);
  assert.equal(again.cached, true, 'a lesson is generated once and reused'); assert.equal(client.requests.length, 1);
  client = mockClient([{ text: 'nope' }, { text: 'nope' }]);
  const failed = await lessons.generate('j3', 'fam', 'c', q, { replace: true });
  assert.equal(failed.ok, false); assert.equal((await lessons.get('fam', 'c')).ai.createdAt, first.record.createdAt, 'a failed regeneration keeps the saved lesson');
  const s = await lessons.status();
  assert.equal(s.usage.lessons, 1); assert.equal(s.settings.monthlyCap, 20); assert.equal(s.settings.model, 'claude-sonnet-5-5');

  await lessons.setSettings({ monthlyCap: 1 });
  const capped = createLessons({ dir: mkdtempSync(path.join(tmpdir(), 'sss-lessons-')), guide, SDK, now: () => new Date('2026-11-20T00:00:00Z') });
  await capped.setSettings({ monthlyCap: 1 });
  client = mockClient([{ text: JSON.stringify(goodLesson()) }]);
  // a lesson whose usage exceeds the cap blocks the next one
  client.beta.messages.stream = ((orig) => (p, o) => { const st = orig(p, o); const fm = st.finalMessage; st.finalMessage = async () => ({ ...(await fm()), usage: { input_tokens: 100_000, output_tokens: 100_000 } }); return st; })(client.beta.messages.stream);
  assert.equal((await capped.generate('k1', 'fam', 'x', q)).ok, true);
  assert.match(capped.availability().reason, /budget/); assert.equal((await capped.generate('k2', 'fam', 'y', q)).kind, 'unavailable');

  const reviewed = await lessons.review('fam', 'c', { status: 'flagged', note: 'Problem p2 uses the wrong unit.' });
  assert.equal(reviewed.status, 'flagged'); assert.match(reviewed.userNotes, /wrong unit/);
  assert.equal(costOf({ 'claude-sonnet-5-5': { input: 1e6, cacheRead: 0, cacheWrite: 0, output: 1e6 } }), 12);
  await assert.rejects(lessons.setSettings({ model: 'gpt-4' }), /Unknown model/);
});
