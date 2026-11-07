// Generating a 30-minute lesson with Claude, in the main process. The page sends the skill context
// (built from the map: src/lesson-context.js); this module owns the prompt, the JSON schema, the
// request (streamed structured output), local validation, the verification pass for QUANT skills,
// one automatic retry, and cancelling. It returns a complete lesson or an error: a partial lesson is
// never returned as complete. It never reads or writes proficiency.
const crypto = require('node:crypto');

const PROMPT_VERSION = 'lesson-v1';
const MODELS = ['claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-opus-5-5'];
const DEFAULT_MODEL = 'claude-sonnet-5-5';
// Server-side refusal fallback exists for Sonnet 5.5 and Opus 5.5 on the Claude API; Haiku 5.5 has none.
const HAS_FALLBACK = new Set(['claude-sonnet-5-5', 'claude-opus-5-5']);

const SYSTEM_PROMPT = `You are a precise technical tutor writing one self-contained 30-minute lesson for a single skill on a learner's skill map. The learner studies alone, in order, toward building a humanoid robot.

You receive the skill, its immediate prerequisites (with which ones the learner has marked proficient), the skills it unlocks, and a short learner profile. Write the lesson for that learner:
- Assume the prerequisites marked proficient and use them as stepping stones; briefly recap any prerequisite that is not marked proficient where the lesson relies on it.
- Point forward to what the skill unlocks where it helps motivation.
- Use the learner's background (from the profile) for examples and analogies where they fit naturally.

Content rules:
- Original wording only. Do not reproduce copyrighted text, textbook passages, or standards text; describe ideas in your own words.
- Always show units on quantities, in every step, problem and answer. Use SI units unless the skill is about another system.
- Be correct and precise. Every practice problem must be solvable from its statement, and its answer key must be right. For numeric answers, give the final value as a plain number in finalValue and its unit in unit; otherwise set both to null.
- Safety first for electrical, battery, machine, power-tool, welding, chemical and lifting content: state hazards and precautions plainly, and never suggest bypassing guards, interlocks or protective equipment. When the context says safetyRequired is true, the safety section is required; otherwise set it to null.
- For hands-on skills (practice "hands-on"), describe what a real demonstration would look like in the demonstration section, with the evidence to record, and set satisfiedByLesson to false: a lesson, a simulation or a worked answer never satisfies a physical demonstration. For other skills set demonstration to null.
- Never state or imply that the learner is proficient, has passed, or has completed the skill. Proficiency is the learner's own judgment, recorded by them.
- Math may use LaTeX between $...$ (inline) or $$...$$ (display). Code goes in fenced code blocks with a language. Describe any diagram in words.

Structure and timing (about 30 minutes in all; estimatedMinutes is your estimate):
- objectives: 2 to 4 short bullets (about 2 min).
- explanation: the core teaching in markdown (about 8 min).
- workedExample: one problem solved step by step (about 5 min).
- guidedPractice: 2 or 3 problems, each with 1 to 3 hints and a full solution (about 5 min).
- independentPractice: 3 to 5 problems, each with an answer and a short solution; hints may be empty (about 8 min).
- checkForUnderstanding: exactly 3 quick questions with answers (about 2 min).
- keyTerms: 3 to 8 terms with one-line definitions. commonMistakes: 2 to 5 items.
Give each practice problem a short unique id (g1, g2, … and p1, p2, …).
Follow the JSON schema exactly. Write only the JSON.`;

const str = { type: 'string' };
const strings = { type: 'array', items: str };
const PROBLEM = { type: 'object', additionalProperties: false, required: ['id', 'prompt', 'hints', 'solution', 'answer', 'finalValue', 'unit'],
  properties: { id: str, prompt: str, hints: strings, solution: str, answer: str, finalValue: { type: ['number', 'null'] }, unit: { type: ['string', 'null'] } } };
const LESSON_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['title', 'estimatedMinutes', 'objectives', 'explanation', 'workedExample', 'guidedPractice', 'independentPractice', 'checkForUnderstanding', 'safety', 'demonstration', 'keyTerms', 'commonMistakes'],
  $defs: { problem: PROBLEM },
  properties: {
    title: str, estimatedMinutes: { type: 'integer' }, objectives: strings, explanation: str,
    workedExample: { type: 'object', additionalProperties: false, required: ['problem', 'steps', 'result'], properties: { problem: str, steps: strings, result: str } },
    guidedPractice: { type: 'array', items: { $ref: '#/$defs/problem' } },
    independentPractice: { type: 'array', items: { $ref: '#/$defs/problem' } },
    checkForUnderstanding: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['question', 'answer'], properties: { question: str, answer: str } } },
    safety: { anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: false, required: ['hazards', 'precautions', 'stopConditions'], properties: { hazards: strings, precautions: strings, stopConditions: strings } }] },
    demonstration: { anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: false, required: ['description', 'evidence', 'satisfiedByLesson'], properties: { description: str, evidence: strings, satisfiedByLesson: { type: 'boolean', const: false } } }] },
    keyTerms: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['term', 'definition'], properties: { term: str, definition: str } } },
    commonMistakes: strings
  }
};
const SECTIONS = ['objectives', 'explanation', 'workedExample', 'guidedPractice', 'independentPractice', 'checkForUnderstanding', 'safety', 'demonstration', 'keyTerms', 'commonMistakes'];

// Checks a parsed lesson against what the schema cannot express (counts, required sections for the
// topic). Returns a list of problems; empty means valid.
function validateLesson(lesson, context) {
  const problems = [], text = v => typeof v === 'string' && v.trim().length > 0;
  if (!lesson || typeof lesson !== 'object') return ['The lesson is not an object.'];
  for (const key of LESSON_SCHEMA.required) if (!(key in lesson)) problems.push(`Missing ${key}.`);
  if (problems.length) return problems;
  const between = (name, list, lo, hi) => { if (!Array.isArray(list) || list.length < lo || list.length > hi) problems.push(`${name}: expected ${lo}–${hi}, got ${Array.isArray(list) ? list.length : 'none'}.`); };
  if (!text(lesson.title)) problems.push('Missing title.');
  if (!Number.isInteger(lesson.estimatedMinutes) || lesson.estimatedMinutes < 15 || lesson.estimatedMinutes > 60) problems.push('estimatedMinutes should be about 30.');
  between('objectives', lesson.objectives, 2, 4);
  if (!text(lesson.explanation) || lesson.explanation.length < 400) problems.push('The explanation is missing or too short.');
  if (!text(lesson.workedExample?.problem) || !Array.isArray(lesson.workedExample?.steps) || !lesson.workedExample.steps.length || !text(lesson.workedExample?.result)) problems.push('The worked example is incomplete.');
  between('guidedPractice', lesson.guidedPractice, 2, 3);
  between('independentPractice', lesson.independentPractice, 3, 5);
  between('checkForUnderstanding', lesson.checkForUnderstanding, 3, 3);
  between('keyTerms', lesson.keyTerms, 2, 10);
  between('commonMistakes', lesson.commonMistakes, 1, 6);
  const ids = new Set();
  for (const p of [...(lesson.guidedPractice || []), ...(lesson.independentPractice || [])]) {
    if (!text(p.id) || ids.has(p.id)) problems.push(`Practice problem ids must be unique (${p.id}).`); ids.add(p.id);
    if (!text(p.prompt) || !text(p.solution) || !text(p.answer)) problems.push(`Problem ${p.id} is incomplete.`);
    if (p.finalValue != null && !Number.isFinite(p.finalValue)) problems.push(`Problem ${p.id} has a non-numeric finalValue.`);
  }
  for (const p of lesson.guidedPractice || []) if (!Array.isArray(p.hints) || !p.hints.length) problems.push(`Guided problem ${p.id} needs at least one hint.`);
  if (context?.safetyRequired && !lesson.safety) problems.push('This topic needs a safety section.');
  if (lesson.safety && (!lesson.safety.hazards?.length || !lesson.safety.precautions?.length)) problems.push('The safety section is incomplete.');
  if (context?.skill?.practice === 'hands-on' && !lesson.demonstration) problems.push('A hands-on skill needs a demonstration section.');
  if (lesson.demonstration && lesson.demonstration.satisfiedByLesson !== false) problems.push('The demonstration must be marked as not satisfied by the lesson.');
  return problems;
}

// --- Verification (QUANT) --------------------------------------------------------------------------
const VERIFY_PROMPT = `You check practice problems. For each problem, solve it yourself from its statement alone, carefully and independently, with units. Report your final answer: in finalValue a plain number (in the unit you give in unit) when the answer is a single number, otherwise null for both. Follow the JSON schema exactly. Write only the JSON.`;
const VERIFY_SCHEMA = { type: 'object', additionalProperties: false, required: ['answers'], properties: { answers: { type: 'array', items: { type: 'object', additionalProperties: false,
  required: ['id', 'answer', 'finalValue', 'unit'], properties: { id: str, answer: str, finalValue: { type: ['number', 'null'] }, unit: { type: ['string', 'null'] } } } } } };
const REPAIR_PROMPT = `You fix one practice problem in a lesson whose answer key failed an independent check. Write a corrected version of the problem: the same skill and difficulty, solvable from its statement, with a correct answer, solution and units. Keep its id. Follow the JSON schema exactly. Write only the JSON.`;

// Unit names compared loosely: case, spaces, "per" and a few spellings.
const unitKey = u => String(u ?? '').toLowerCase().replace(/\s+/g, '').replace(/per/g, '/').replace(/·|\*/g, '').replace(/ohms?|Ω/g, 'ω').replace(/degrees?|deg|°/g, '°');
// Whether two numeric answers agree: within 2 % (or 1e-9 absolute near zero), units loosely equal
// when both are given.
function agrees(key, check) {
  if (key.finalValue == null || check.finalValue == null) return null; // not checkable automatically
  const a = key.finalValue, b = check.finalValue, close = Math.abs(a - b) <= Math.max(1e-9, 0.02 * Math.max(Math.abs(a), Math.abs(b)));
  const units = !key.unit || !check.unit || unitKey(key.unit) === unitKey(check.unit);
  return close && units;
}
function compare(problems, answers) {
  const byId = new Map((answers || []).map(a => [a.id, a]));
  return problems.map(p => { const check = byId.get(p.id); const ok = check ? agrees(p, check) : false;
    return { id: p.id, ok, key: { answer: p.answer, finalValue: p.finalValue, unit: p.unit }, check: check ? { answer: check.answer, finalValue: check.finalValue, unit: check.unit } : null }; });
}

const sha256 = text => crypto.createHash('sha256').update(text).digest('hex');
// The hash of the skill context the lesson was written from (the learner profile is not part of it).
const inputHash = context => sha256(JSON.stringify({ ...context, learner: undefined }));

// SDK errors worth one automatic retry: rate limits, overload and server errors, timeouts and lost
// connections. A refused key or a bad request is not retried.
function retryable(error, SDK) {
  if (error instanceof SDK.APIUserAbortError) return false;
  return error instanceof SDK.APIConnectionError || error instanceof SDK.RateLimitError || error instanceof SDK.InternalServerError || (error instanceof SDK.APIError && error.status >= 500);
}
class LessonError extends Error { constructor(kind, message) { super(message); this.kind = kind; } }

// One structured request: streams text (the JSON), reports which top-level section has started, and
// returns the parsed object with usage. Throws LessonError on refusal, truncation or invalid JSON.
async function structured({ client, model, system, schema, user, signal, onText = () => {}, maxTokens = 32000 }) {
  const params = { model, max_tokens: maxTokens, output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
    cache_control: { type: 'ephemeral' }, system, messages: [{ role: 'user', content: user }] };
  if (HAS_FALLBACK.has(model)) Object.assign(params, { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
  const stream = client.beta.messages.stream(params, { signal });
  stream.on('text', onText);
  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') throw new LessonError('refusal', 'Claude declined to write this. Try again, or choose another model in Settings.');
  if (message.stop_reason === 'max_tokens') throw new LessonError('invalid', 'The answer was cut off before it was complete.');
  const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('');
  let value;
  try { value = JSON.parse(text); } catch { throw new LessonError('invalid', 'The answer was not valid JSON.'); }
  return { value, usage: message.usage || {}, model: message.model || model };
}

// The sections seen so far in the streamed JSON, for the "Generating…" view.
function sectionsSeen(text) { return SECTIONS.filter(s => text.includes(`"${s}"`)); }

// Generates, validates and (for QUANT skills) verifies one lesson. onProgress({ stage, sections, attempt }).
async function generateLesson({ client, SDK, model = DEFAULT_MODEL, context, signal, onProgress = () => {} }) {
  if (!MODELS.includes(model)) throw new LessonError('invalid', `Unknown model ${model}.`);
  const usage = { tokensIn: 0, tokensOut: 0, requests: 0, byModel: {} };
  const count = (u, m) => {
    const inTok = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    usage.tokensIn += inTok; usage.tokensOut += u.output_tokens || 0; usage.requests++;
    const row = usage.byModel[m] ??= { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };
    row.input += u.input_tokens || 0; row.cacheRead += u.cache_read_input_tokens || 0; row.cacheWrite += u.cache_creation_input_tokens || 0; row.output += u.output_tokens || 0;
  };
  const user = `Write the lesson for this skill.\n\n<skill_context>\n${JSON.stringify(context, null, 2)}\n</skill_context>`;
  // One automatic retry for a retryable error, invalid JSON or a lesson that fails validation.
  async function attempt(fn) {
    for (let n = 1; ; n++) {
      try { return await fn(n); }
      catch (error) {
        if (signal?.aborted || error instanceof SDK.APIUserAbortError) throw new LessonError('cancelled', 'Generation cancelled.');
        const again = n < 2 && (error instanceof LessonError ? error.kind === 'invalid' : retryable(error, SDK));
        if (!again) throw error instanceof LessonError ? error : new LessonError(error instanceof SDK.APIConnectionError ? 'offline' : error instanceof SDK.RateLimitError ? 'busy' : 'failed', error.message || String(error));
        onProgress({ stage: 'retrying', sections: [], attempt: n + 1 });
      }
    }
  }
  const started = Date.now();
  const lessonResult = await attempt(async n => {
    let text = '', last = '';
    onProgress({ stage: 'writing', sections: [], attempt: n });
    const r = await structured({ client, model, system: SYSTEM_PROMPT, schema: LESSON_SCHEMA, user, signal,
      onText: t => { text += t; const seen = sectionsSeen(text).join(); if (seen !== last) { last = seen; onProgress({ stage: 'writing', sections: sectionsSeen(text), attempt: n }); } } });
    count(r.usage, r.model);
    const problems = validateLesson(r.value, context);
    if (problems.length) throw new LessonError('invalid', `The lesson did not pass its checks: ${problems.slice(0, 3).join(' ')}`);
    return r;
  });
  let lesson = lessonResult.value, verification = null, status = 'unreviewed';

  if (context.skill.type === 'QUANT') {
    onProgress({ stage: 'verifying', sections: SECTIONS });
    const problems = () => [...lesson.guidedPractice, ...lesson.independentPractice];
    const check = async list => {
      const r = await attempt(async () => structured({ client, model, system: VERIFY_PROMPT, schema: VERIFY_SCHEMA, signal, maxTokens: 16000,
        user: `Skill: ${context.skill.name}\n\n<problems>\n${JSON.stringify(list.map(p => ({ id: p.id, prompt: p.prompt })), null, 2)}\n</problems>` }));
      count(r.usage, r.model);
      return compare(list, r.value.answers);
    };
    let results = await check(problems());
    const wrong = results.filter(r => r.ok === false);
    for (const bad of wrong) {
      onProgress({ stage: 'repairing', sections: SECTIONS, problem: bad.id });
      const old = problems().find(p => p.id === bad.id);
      const r = await attempt(async () => structured({ client, model, system: REPAIR_PROMPT, schema: PROBLEM, signal, maxTokens: 8000,
        user: `Skill: ${context.skill.name}\n\n<problem>\n${JSON.stringify(old, null, 2)}\n</problem>\n\n<independent_check>\n${JSON.stringify(bad.check)}\n</independent_check>` }));
      count(r.usage, r.model);
      const fixed = { ...r.value, id: bad.id };
      if (lesson.guidedPractice.some(p => p.id === bad.id) && (!fixed.hints || !fixed.hints.length)) fixed.hints = old.hints;
      lesson = { ...lesson, guidedPractice: lesson.guidedPractice.map(p => p.id === bad.id ? fixed : p), independentPractice: lesson.independentPractice.map(p => p.id === bad.id ? fixed : p) };
      const [again] = await check([fixed]);
      results = results.map(x => x.id === bad.id ? { ...again, repaired: true } : x);
    }
    const disagree = results.filter(r => r.ok === false);
    verification = { checkedAt: new Date().toISOString(), checked: results.filter(r => r.ok !== null).length, total: results.length,
      notChecked: results.filter(r => r.ok === null).map(r => r.id), repaired: results.filter(r => r.repaired).map(r => r.id), mismatches: disagree };
    if (disagree.length) status = 'flagged';
  }
  return { lesson, status, verification, usage, model: lessonResult.model, promptVersion: PROMPT_VERSION, inputHash: inputHash(context), seconds: Math.round((Date.now() - started) / 100) / 10 };
}

module.exports = { generateLesson, validateLesson, compare, agrees, inputHash, LessonError, LESSON_SCHEMA, VERIFY_SCHEMA, SYSTEM_PROMPT, PROMPT_VERSION, MODELS, DEFAULT_MODEL, SECTIONS };
