// Lessons in the main process: the lesson store (desktop/lesson-store.cjs) behind IPC; taking in
// lessons still embedded in an opened map as reviewed archives; and generating AI lessons with the
// Guide's Claude client (the key never leaves this process). Settings, monthly usage and the cap
// live in userData/lessons-settings.json and userData/lessons-usage.json.
// Nothing here reads or writes proficiency.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createLessonStore, archiveRecord, FORMAT } = require('./lesson-store.cjs');
const { writeFileAtomic } = require('./save.cjs');
const gen = require('./lesson-gen.cjs');
const PRICING = require('./claude-pricing.json');

const DEFAULTS = { model: gen.DEFAULT_MODEL, learnerProfile: 'Self-taught adult builder working toward a humanoid robot; professional welder/fabricator.', monthlyCap: 20, askBeforeGenerating: true };
const month = (now = new Date()) => now.toISOString().slice(0, 7);

// Estimated cost of a generation's usage, per model, from the dated pricing file.
function costOf(byModel) {
  let total = 0;
  for (const [model, u] of Object.entries(byModel || {})) {
    const p = PRICING.models[model]; if (!p) continue;
    total += (u.input * p.input + u.cacheRead * p.cacheRead + u.cacheWrite * p.cacheWrite + u.output * p.output) / 1e6;
  }
  return total;
}

// guide: the Guide's connection (status(), client()). SDK: the Anthropic SDK module.
function createLessons({ dir, guide = null, SDK = null, now = () => new Date() }) {
  const store = createLessonStore(path.join(dir, 'lessons'));
  const settingsFile = path.join(dir, 'lessons-settings.json'), usageFile = path.join(dir, 'lessons-usage.json');
  let settings = { ...DEFAULTS }, usage = null;
  const jobs = new Map();
  const freshUsage = () => ({ month: month(now()), lessons: 0, requests: 0, tokensIn: 0, tokensOut: 0, cost: 0 });
  const readJson = async (file, fallback) => { try { return { ...fallback, ...JSON.parse(await fs.readFile(file, 'utf8')) }; } catch { return fallback; } };
  const ready = (async () => { settings = await readJson(settingsFile, settings); usage = await readJson(usageFile, freshUsage()); })();
  const currentUsage = () => { if (!usage || usage.month !== month(now())) usage = freshUsage(); return usage; };

  // Whether a lesson can be generated now, and if not, why (shown on the card).
  function availability() {
    const s = guide?.status?.();
    if (!s || !s.hasKey) return { ok: false, reason: 'Add an Anthropic API key in Guide ▸ Settings to generate lessons. Reviewed and saved lessons still open.' };
    if (!s.enabled) return { ok: false, reason: 'The Guide is turned off (Guide ▸ Settings), so nothing goes online. Reviewed and saved lessons still open.' };
    if (s.state === 'disconnected' || s.state === 'connecting') return { ok: false, reason: 'Offline: no connection to Claude. Reviewed and saved lessons still open; generating works again when the connection returns.' };
    if (s.state === 'key-rejected') return { ok: false, reason: 'Claude refused the API key. Check it in Guide ▸ Settings.' };
    if (currentUsage().cost >= settings.monthlyCap) return { ok: false, reason: `This month's lesson budget ($${settings.monthlyCap.toFixed(2)}) is used up. Raise it in Lessons settings, or wait for next month.` };
    if (!guide.client()) return { ok: false, reason: 'No Claude client is available.' };
    return { ok: true, reason: null };
  }
  async function status() { await ready; return { availability: availability(), settings: { ...settings }, usage: { ...currentUsage() }, models: gen.MODELS, promptVersion: gen.PROMPT_VERSION, pricingChecked: PRICING.checked }; }
  async function setSettings(next = {}) {
    await ready;
    if (next.model !== undefined) { if (!gen.MODELS.includes(next.model)) throw Error('Unknown model.'); settings.model = next.model; }
    if (next.learnerProfile !== undefined) { const t = String(next.learnerProfile).trim(); if (!t || t.length > 1000) throw Error('The learner profile should be 1 to 1,000 characters.'); settings.learnerProfile = t; }
    if (next.monthlyCap !== undefined) { const c = Number(next.monthlyCap); if (!Number.isFinite(c) || c < 1 || c > 1000) throw Error('Choose a monthly cap from $1 to $1,000.'); settings.monthlyCap = Math.round(c * 100) / 100; }
    if (next.askBeforeGenerating !== undefined) settings.askBeforeGenerating = !!next.askBeforeGenerating;
    await writeFileAtomic(settingsFile, JSON.stringify(settings, null, 2));
    return status();
  }

  // Embedded lessons from the page: each becomes an archive unless one is stored already. Returns the
  // ids whose stored archive matches exactly, which the page may then remove from its copy of the map.
  async function absorb(mapKey, nodes) {
    if (!Array.isArray(nodes) || nodes.length > 50_000) throw Error('Invalid lessons.');
    const at = now().toISOString(), safe = [];
    for (const node of nodes) {
      if (!node || typeof node.id !== 'string' || (node.lesson === undefined && node.lessonCard === undefined)) continue;
      const record = archiveRecord(mapKey, node, at);
      const existing = await store.read(mapKey, node.id, 'archive');
      if (!existing) await store.put(record);
      const stored = existing || await store.read(mapKey, node.id, 'archive');
      if (JSON.stringify(stored.content) === JSON.stringify(record.content)) safe.push(node.id);
    }
    return safe;
  }

  // Generates and saves an AI lesson for one node. The context comes from the page (built from the
  // map); the learner profile and model come from settings. Saved only when complete and valid.
  // Replaces an earlier AI lesson of the node only when `replace` is set; an archive is never touched.
  async function generate(jobId, mapKey, nodeId, context, { replace = false } = {}, onProgress = () => {}) {
    await ready;
    if (typeof jobId !== 'string' || jobs.has(jobId)) throw Error('Invalid lesson request.');
    if (!context?.skill?.name || !Array.isArray(context.prerequisites) || !Array.isArray(context.unlocks)) throw Error('Invalid lesson context.');
    const available = availability();
    if (!available.ok) return { ok: false, kind: 'unavailable', message: available.reason };
    const existing = await store.read(mapKey, nodeId, 'ai');
    if (existing && !replace) return { ok: true, cached: true, record: existing };
    const controller = new AbortController();
    jobs.set(jobId, controller);
    try {
      const result = await gen.generateLesson({ client: guide.client(), SDK, model: settings.model, context: { ...context, learner: settings.learnerProfile }, signal: controller.signal, onProgress });
      const cost = costOf(result.usage.byModel);
      const record = { format: FORMAT, version: 1, nodeId, mapKey, source: 'ai-generated', status: result.status, promptVersion: result.promptVersion, model: result.model,
        createdAt: now().toISOString(), inputHash: result.inputHash, tokensIn: result.usage.tokensIn, tokensOut: result.usage.tokensOut, cost: Math.round(cost * 10000) / 10000,
        seconds: result.seconds, content: result.lesson, userNotes: '', verification: result.verification };
      await store.put(record);
      const u = currentUsage();
      Object.assign(u, { lessons: u.lessons + 1, requests: u.requests + result.usage.requests, tokensIn: u.tokensIn + result.usage.tokensIn, tokensOut: u.tokensOut + result.usage.tokensOut, cost: u.cost + cost });
      await writeFileAtomic(usageFile, JSON.stringify(u, null, 2)).catch(() => {});
      return { ok: true, record };
    } catch (error) {
      return { ok: false, kind: error.kind || 'failed', message: error.message || String(error) };
    } finally { jobs.delete(jobId); }
  }
  function cancel(jobId) { jobs.get(jobId)?.abort(); }

  // The learner's own review of an AI lesson: mark it reviewed, or flag a problem with a note.
  async function review(mapKey, nodeId, { status, note }) {
    const record = await store.read(mapKey, nodeId, 'ai');
    if (!record) throw Error('There is no AI lesson for this skill.');
    if (!['reviewed', 'flagged', 'unreviewed'].includes(status)) throw Error('Invalid status.');
    const notes = typeof note === 'string' && note.trim() ? `${record.userNotes ? `${record.userNotes}\n` : ''}${now().toISOString().slice(0, 10)}: ${note.trim().slice(0, 2000)}` : record.userNotes;
    return store.put({ ...record, status, userNotes: notes });
  }

  return { store, get: store.get, list: store.list, absorb, availability, status, setSettings, generate, cancel, review, ready };
}

module.exports = { createLessons, costOf, DEFAULTS };
