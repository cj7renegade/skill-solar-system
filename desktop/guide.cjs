// The AI Guide's connection to Claude, in the main process. The page stays fully offline (every
// renderer request is still blocked); only this module talks to the Anthropic API, through the SDK's
// own Node connection. It owns the API key (encrypted with the operating system's key store), the
// connection state, the monthly spending cap and one request per turn. The conversation and the
// read-only tools live in the page (src/guide.js): this module never sees the map and cannot
// change it or any answer.
const fs = require('node:fs/promises');
const path = require('node:path');
const { writeFileAtomic } = require('./save.cjs');
const { fileFor } = require('./proficiency-store.cjs');

const MODEL = 'claude-opus-5-5';
// Estimated US$ per million tokens for this model, to keep the monthly cap. The Console's billing is
// the real figure; this is a close running estimate shown to the reader.
const PRICE = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 };
const DEFAULT_LIMIT = 10;
const RETRY_MS = 30_000;
const MAX_REQUEST_CHARS = 1_500_000;
const MAX_MEMORY_BYTES = 2_000_000;
// What the Guide remembers, one file per atlas family (maps without one share "default"): the visible
// conversations and the notes summarized from them. Kept on this computer only.
const MEMORY_FORMAT = 'helixskill-guide-memory';

// Connection states. The rest of HelixSkill works offline in every one of them.
//   off           no API key, or the Guide is turned off
//   connecting    checking the key and the connection
//   online        ready
//   disconnected  no connection to Claude (no network, or the service is unreachable); retried automatically
//   key-rejected  the API key was refused
//   paused        this month's spending cap is reached
const STATES = ['off', 'connecting', 'online', 'disconnected', 'key-rejected', 'paused'];

const month = (now = new Date()) => now.toISOString().slice(0, 7);
const cost = u => ((u.input_tokens || 0) * PRICE.input + (u.output_tokens || 0) * PRICE.output
  + (u.cache_read_input_tokens || 0) * PRICE.cacheRead + (u.cache_creation_input_tokens || 0) * PRICE.cacheWrite) / 1e6;

// What the page may send back as history: user and assistant turns of plain JSON, within a size cap.
function validMessages(messages) {
  if (!Array.isArray(messages) || !messages.length || messages[0]?.role !== 'user') return false;
  if (!messages.every(m => m && (m.role === 'user' || m.role === 'assistant') && (typeof m.content === 'string' || Array.isArray(m.content)))) return false;
  try { return JSON.stringify(messages).length <= MAX_REQUEST_CHARS; } catch { return false; }
}

// SDK error classes decide the state: a connection failure disconnects (and retries); a refused key
// stops until a new key is saved; anything else is reported for that question only.
function classify(error, SDK) {
  if (error instanceof SDK.APIUserAbortError) return 'aborted';
  if (error instanceof SDK.APIConnectionError) return 'disconnected'; // includes timeouts
  if (error instanceof SDK.AuthenticationError || error instanceof SDK.PermissionDeniedError) return 'key-rejected';
  if (error instanceof SDK.RateLimitError) return 'busy';
  if (error instanceof SDK.InternalServerError || (error instanceof SDK.APIError && error.status >= 500)) return 'busy';
  return 'failed';
}

// dir: the Guide's folder in user data. secure: Electron's safeStorage. createClient(apiKey): the SDK
// client (tests pass a fake). onStatus(status): pushes each change to the page. online(): whether the
// computer reports a network at all (Electron's net.isOnline).
function createGuide({ dir, secure, createClient, SDK, onStatus = () => {}, online = () => true, env = process.env, now = () => new Date(), retryMs = RETRY_MS }) {
  const keyFile = path.join(dir, 'api-key.bin'), settingsFile = path.join(dir, 'settings.json'), usageFile = path.join(dir, 'usage.json');
  let settings = { enabled: true, monthlyLimit: DEFAULT_LIMIT }, usage = { month: month(now()), cost: 0, requests: 0, inputTokens: 0, outputTokens: 0 };
  let key = null, keySource = null, client = null, state = 'off', detail = '', timer = null, probing = null;
  const running = new Map();

  const status = () => ({ state, detail, model: MODEL, hasKey: !!key, keySource, canStoreKey: secure.isEncryptionAvailable(), enabled: settings.enabled,
    monthlyLimit: settings.monthlyLimit, usage: { ...currentUsage() } });
  function set(next, why = '') {
    if (!STATES.includes(next)) throw Error(`Unknown guide state ${next}`);
    const changed = next !== state || why !== detail;
    state = next; detail = why;
    clearTimeout(timer); timer = null;
    // Disconnected retries on its own, so the Guide comes back when the connection does.
    if (state === 'disconnected') { timer = setTimeout(() => { probe().catch(() => {}); }, retryMs); timer.unref?.(); }
    if (changed) onStatus(status());
  }
  function currentUsage() {
    if (usage.month !== month(now())) usage = { month: month(now()), cost: 0, requests: 0, inputTokens: 0, outputTokens: 0 };
    return usage;
  }
  const overLimit = () => currentUsage().cost >= settings.monthlyLimit;

  async function readJson(file, fallback) { try { return { ...fallback, ...JSON.parse(await fs.readFile(file, 'utf8')) }; } catch { return fallback; } }
  async function load() {
    await fs.mkdir(dir, { recursive: true });
    settings = await readJson(settingsFile, settings);
    usage = await readJson(usageFile, usage);
    try { if (secure.isEncryptionAvailable()) { key = secure.decryptString(await fs.readFile(keyFile)); keySource = 'saved'; } } catch { key = null; }
    // A key in the environment works too (never written to disk), for people who already set one.
    if (!key && env.ANTHROPIC_API_KEY) { key = env.ANTHROPIC_API_KEY; keySource = 'environment'; }
    client = key ? createClient(key) : null;
    return probe();
  }

  // Checks the key and the connection with a request that uses no tokens (the model's details).
  function probe() {
    if (!client || !settings.enabled) { set('off', !client ? 'No API key' : 'Turned off'); return Promise.resolve(status()); }
    if (overLimit()) { set('paused', 'Monthly limit reached'); return Promise.resolve(status()); }
    if (probing) return probing;
    if (!online()) { set('disconnected', 'This computer is offline'); return Promise.resolve(status()); }
    set('connecting');
    probing = client.models.retrieve(MODEL).then(() => set('online'), error => {
      const kind = classify(error, SDK);
      set(kind === 'key-rejected' ? 'key-rejected' : kind === 'disconnected' || kind === 'busy' ? 'disconnected' : 'online', error.message || '');
    }).then(() => status()).finally(() => { probing = null; });
    return probing;
  }

  async function setKey(value) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!/^sk-ant-[\w-]{20,}$/.test(text)) throw Error('That does not look like an Anthropic API key (it starts with sk-ant-).');
    if (!secure.isEncryptionAvailable()) throw Error('This computer cannot encrypt the key, so it is not saved. Set ANTHROPIC_API_KEY instead.');
    await writeFileAtomic(keyFile, secure.encryptString(text));
    key = text; keySource = 'saved'; client = createClient(key);
    return probe();
  }
  async function clearKey() {
    await fs.rm(keyFile, { force: true });
    key = env.ANTHROPIC_API_KEY || null; keySource = key ? 'environment' : null; client = key ? createClient(key) : null;
    return probe();
  }
  async function setSettings(next = {}) {
    if (typeof next.enabled === 'boolean') settings.enabled = next.enabled;
    if (next.monthlyLimit != null) {
      const limit = Number(next.monthlyLimit);
      if (!Number.isFinite(limit) || limit < 1 || limit > 1000) throw Error('Choose a monthly limit from $1 to $1,000.');
      settings.monthlyLimit = Math.round(limit * 100) / 100;
    }
    await writeFileAtomic(settingsFile, JSON.stringify(settings, null, 2));
    return probe();
  }

  // One model turn. The page sends the history (append-only, assistant turns exactly as returned);
  // text streams back through onDelta; the complete reply is returned for the page to run tools on.
  async function turn(id, { system, tools, messages }, onDelta = () => {}) {
    if (typeof id !== 'string' || running.has(id)) throw Error('Invalid guide request.');
    if (!validMessages(messages) || typeof system !== 'string' || !Array.isArray(tools)) throw Error('Invalid guide request.');
    if (state === 'disconnected' || state === 'connecting') await probe();
    if (state !== 'online') return { ok: false, reason: state, status: status() };
    if (overLimit()) { set('paused', 'Monthly limit reached'); return { ok: false, reason: 'paused', status: status() }; }
    const controller = new AbortController();
    running.set(id, controller);
    try {
      const stream = client.beta.messages.stream({
        model: MODEL, max_tokens: 32000,
        output_config: { effort: 'medium' },
        // On a safety decline, the API re-runs the request on Anthropic's recommended fallback model.
        betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
        cache_control: { type: 'ephemeral' },
        system, ...(tools.length ? { tools: tools.map(t => ({ ...t, eager_input_streaming: true })) } : {}), messages
      }, { signal: controller.signal });
      stream.on('text', text => onDelta(text));
      const message = await stream.finalMessage();
      record(message.usage);
      return { ok: true, message: { content: message.content, stop_reason: message.stop_reason, stop_details: message.stop_details ?? null, model: message.model }, status: status() };
    } catch (error) {
      const kind = classify(error, SDK);
      if (kind === 'disconnected') set('disconnected', error.message || 'Connection lost');
      if (kind === 'key-rejected') set('key-rejected', error.message || 'Key refused');
      return { ok: false, reason: kind, error: error.message || String(error), status: status() };
    } finally { running.delete(id); }
  }
  function cancel(id) { running.get(id)?.abort(); }
  function record(u = {}) {
    const now = currentUsage();
    now.cost += cost(u); now.requests += 1; now.inputTokens += (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0); now.outputTokens += u.output_tokens || 0;
    writeFileAtomic(usageFile, JSON.stringify(now, null, 2)).catch(() => {});
    if (overLimit()) set('paused', 'Monthly limit reached'); else onStatus(status());
  }

  // Memory is plain local storage: reading and writing it never needs the connection.
  const memoryDir = path.join(dir, 'memory'), memoryQueue = new Map();
  async function loadMemory(family) {
    try { return await fs.readFile(fileFor(memoryDir, family), 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  function saveMemory(family, text) {
    const file = fileFor(memoryDir, family);
    if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_MEMORY_BYTES) throw Error('Invalid guide memory.');
    let memory;
    try { memory = JSON.parse(text); } catch { throw Error('Invalid guide memory.'); }
    if (memory?.format !== MEMORY_FORMAT || memory.family !== family || !Array.isArray(memory.conversations) || typeof memory.notes !== 'string') throw Error('Invalid guide memory.');
    const run = (memoryQueue.get(file) || Promise.resolve()).catch(() => {}).then(async () => { await fs.mkdir(memoryDir, { recursive: true }); await writeFileAtomic(file, text); });
    memoryQueue.set(file, run);
    return run.then(() => true);
  }

  return { load, probe, status, setKey, clearKey, setSettings, turn, cancel, loadMemory, saveMemory, stop: () => { clearTimeout(timer); for (const c of running.values()) c.abort(); } };
}

module.exports = { createGuide, MEMORY_FORMAT, MODEL, PRICE, DEFAULT_LIMIT, STATES, cost, validMessages, classify };
