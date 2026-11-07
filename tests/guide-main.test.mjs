// The Guide's main-process connection with a fake SDK client: the automatic states (off, online,
// disconnected and back, key refused, paused at the monthly limit), the encrypted key file, the
// request shape sent to Claude, usage accounting and what the page may send. No network is used.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const SDK = require('@anthropic-ai/sdk');
const { createGuide, validMessages, cost, MODEL } = require('../desktop/guide.cjs');

const KEY = 'sk-ant-api03-' + 'x'.repeat(40);
const secure = { isEncryptionAvailable: () => true, encryptString: s => Buffer.from(`enc:${s}`), decryptString: b => String(b).replace(/^enc:/, '') };
const connectionError = () => new SDK.APIConnectionError({ message: 'Connection error.' });
const authError = () => new SDK.AuthenticationError(401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }, 'invalid x-api-key', new Headers());

// A fake client: `net.up` decides whether requests reach the service; `replies` scripts model turns.
function fake() {
  const net = { up: true, auth: true, requests: [], replies: [] };
  const createClient = apiKey => ({
    apiKey,
    models: { retrieve: async id => { if (!net.up) throw connectionError(); if (!net.auth) throw authError(); return { id }; } },
    beta: { messages: { stream: (params, options) => {
      net.requests.push({ params, options });
      const handlers = [];
      return { on: (event, fn) => { if (event === 'text') handlers.push(fn); },
        finalMessage: async () => { if (!net.up) throw connectionError(); const r = net.replies.shift() || { text: 'Hello.' }; for (const h of handlers) h(r.text); return { content: [{ type: 'text', text: r.text }], stop_reason: 'end_turn', model: MODEL, usage: r.usage || { input_tokens: 1000, output_tokens: 100 } }; } };
    } } }
  });
  return { net, createClient };
}
function setup({ env = {}, monthlyLimit } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'sss-guide-')), { net, createClient } = fake(), statuses = [];
  const guide = createGuide({ dir, secure, createClient, SDK, env, onStatus: s => statuses.push(s.state), retryMs: 30 });
  return { dir, net, guide, statuses };
}
const request = (text = 'hi') => ({ system: 'S', tools: [{ name: 't', description: 'd', input_schema: { type: 'object', properties: {} } }], messages: [{ role: 'user', content: text }] });
const wait = ms => new Promise(r => setTimeout(r, ms));

test('without a key the Guide is off, and the rest of the app needs nothing from it', async () => {
  const { guide } = setup();
  const s = await guide.load();
  assert.equal(s.state, 'off'); assert.equal(s.hasKey, false); assert.equal(s.model, 'claude-opus-5-5');
  assert.deepEqual(await guide.turn('q1', request()), { ok: false, reason: 'off', status: guide.status() });
});

test('saving a key encrypts it on disk and connects; a bad-looking key is refused', async () => {
  const { guide, dir } = setup();
  await guide.load();
  await assert.rejects(guide.setKey('hello'), /does not look like/);
  const s = await guide.setKey(KEY);
  assert.equal(s.state, 'online'); assert.equal(s.keySource, 'saved');
  const stored = readFileSync(path.join(dir, 'api-key.bin'), 'utf8');
  assert.equal(stored, `enc:${KEY}`, 'only the encrypted form is written');
  // a restart reads it back
  const again = createGuide({ dir, secure, createClient: fake().createClient, SDK, env: {} });
  assert.equal((await again.load()).state, 'online');
  assert.equal((await guide.clearKey()).state, 'off'); assert.ok(!existsSync(path.join(dir, 'api-key.bin')));
});

test('a key from the environment works and is never written to disk', async () => {
  const { guide, dir } = setup({ env: { ANTHROPIC_API_KEY: KEY } });
  const s = await guide.load();
  assert.equal(s.state, 'online'); assert.equal(s.keySource, 'environment'); assert.ok(!existsSync(path.join(dir, 'api-key.bin')));
});

test('losing the connection disconnects automatically, and the Guide reconnects by itself', async () => {
  const { guide, net, statuses } = setup({ env: { ANTHROPIC_API_KEY: KEY } });
  await guide.load();
  net.up = false;
  const r = await guide.turn('q1', request());
  assert.equal(r.ok, false); assert.equal(r.reason, 'disconnected'); assert.equal(guide.status().state, 'disconnected');
  await wait(80);
  assert.equal(guide.status().state, 'disconnected', 'still down: it keeps retrying quietly');
  net.up = true;
  await wait(80);
  assert.equal(guide.status().state, 'online', 'came back without any action');
  assert.ok(statuses.includes('disconnected') && statuses.at(-1) === 'online');
  guide.stop();
});

test('a computer with no network starts disconnected; a question re-checks first', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sss-guide-')), { createClient, net } = fake();
  let networked = false;
  const guide = createGuide({ dir, secure, createClient, SDK, env: { ANTHROPIC_API_KEY: KEY }, online: () => networked, retryMs: 10_000 });
  assert.equal((await guide.load()).state, 'disconnected');
  networked = true;
  const r = await guide.turn('q1', request());
  assert.equal(r.ok, true); assert.equal(guide.status().state, 'online'); assert.equal(net.requests.length, 1);
  guide.stop();
});

test('a refused key stops the Guide until a new key is saved', async () => {
  const { guide, net } = setup({ env: { ANTHROPIC_API_KEY: KEY } });
  net.auth = false;
  assert.equal((await guide.load()).state, 'key-rejected');
  net.auth = true;
  assert.equal((await guide.setKey(KEY)).state, 'online');
});

test('each turn sends the fixed model, effort, fallback and caching settings, and streams text', async () => {
  const { guide, net } = setup({ env: { ANTHROPIC_API_KEY: KEY } });
  await guide.load();
  const deltas = [];
  const r = await guide.turn('q1', request(), t => deltas.push(t));
  assert.equal(r.ok, true); assert.deepEqual(r.message.content, [{ type: 'text', text: 'Hello.' }]); assert.deepEqual(deltas, ['Hello.']);
  const { params, options } = net.requests[0];
  assert.equal(params.model, 'claude-opus-5-5'); assert.deepEqual(params.output_config, { effort: 'medium' });
  assert.deepEqual(params.betas, ['server-side-fallback-2026-07-01']); assert.equal(params.fallbacks, 'default');
  assert.deepEqual(params.cache_control, { type: 'ephemeral' }); assert.equal(params.tools[0].eager_input_streaming, true);
  assert.ok(!('thinking' in params), 'adaptive thinking is the model default'); assert.ok(options.signal instanceof AbortSignal);
});

test('usage is counted, and the monthly limit pauses the Guide until it is raised', async () => {
  const { guide, net } = setup({ env: { ANTHROPIC_API_KEY: KEY } });
  await guide.load();
  await guide.setSettings({ monthlyLimit: 1 });
  net.replies.push({ text: 'a', usage: { input_tokens: 100_000, output_tokens: 40_000 } }); // $0.40 + $0.80
  await guide.turn('q1', request());
  const s = guide.status();
  assert.equal(s.state, 'paused'); assert.equal(s.usage.requests, 1); assert.ok(Math.abs(s.usage.cost - 1.2) < 1e-9);
  assert.equal((await guide.turn('q2', request())).reason, 'paused');
  assert.equal((await guide.setSettings({ monthlyLimit: 5 })).state, 'online');
  await assert.rejects(guide.setSettings({ monthlyLimit: 0 }), /from \$1/);
  assert.equal((await guide.setSettings({ enabled: false })).state, 'off');
});

test('cost estimate and what the page may send', () => {
  assert.equal(cost({ input_tokens: 1e6, output_tokens: 1e6, cache_read_input_tokens: 1e6, cache_creation_input_tokens: 1e6 }), 4 + 20 + 0.2 + 5);
  assert.ok(validMessages([{ role: 'user', content: 'hi' }, { role: 'assistant', content: [{ type: 'text', text: 'x' }] }]));
  assert.ok(!validMessages([]));
  assert.ok(!validMessages([{ role: 'assistant', content: 'x' }]));
  assert.ok(!validMessages([{ role: 'system', content: 'x' }]));
  assert.ok(!validMessages([{ role: 'user', content: 'x'.repeat(1_600_000) }]));
});
