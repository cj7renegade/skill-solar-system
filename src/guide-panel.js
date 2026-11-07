// The Guide panel and the connection indicator in the header. The panel holds one conversation for
// this session (never saved), the settings (API key, on/off, monthly limit) and a banner for every
// state that is not "online". When the Guide is disconnected the rest of the app is unaffected: the
// panel says so, keeps the conversation, and comes back by itself when the connection does.
import { ask, parseReply, STARTERS } from './guide.js';

// What the header indicator and the panel say in each state. Text carries the meaning; colour only repeats it.
export const STATE_TEXT = {
  off: { pill: '● Offline', banner: 'The Guide is off. Add an Anthropic API key in Settings to use it. Everything else in HelixSkill works offline.' },
  connecting: { pill: '◌ Guide connecting…', banner: 'Connecting to Claude…' },
  online: { pill: '● Guide online', banner: '' },
  disconnected: { pill: '● Offline · Guide disconnected', banner: 'No connection to Claude. Everything else in HelixSkill keeps working offline, and the Guide reconnects by itself when the connection returns.' },
  'key-rejected': { pill: '● Offline · Guide key refused', banner: 'Claude refused the API key. Check it in Settings, or save a new one.' },
  paused: { pill: '● Offline · Guide paused', banner: 'This month\'s spending limit is reached, so the Guide is paused. Raise the limit in Settings, or it resumes next month.' }
};
export function pillTitle(status) {
  if (!status) return 'Everything runs on this computer.';
  if (status.state === 'online') return `The Guide is connected to Claude (${status.model}). Only your questions and a short summary of your progress are sent; maps and answers stay here.`;
  if (status.state === 'off') return status.hasKey ? 'Everything runs on this computer. The Guide is turned off.' : 'Everything runs on this computer. The Guide needs an API key (Guide ▸ Settings).';
  return `${STATE_TEXT[status.state]?.banner || ''}${status.detail ? ` (${status.detail})` : ''}`;
}
const money = n => `$${n < 1000 ? n.toFixed(2) : Math.round(n).toLocaleString('en')}`;
export const usageLine = status => `This month: about ${money(status.usage.cost)} of your ${money(status.monthlyLimit)} limit · ${status.usage.requests.toLocaleString('en')} requests`;

// bridge: window.desktop.guide. getContext(): the tool context (graph, target, selected, …).
// actions: { select(id), path(id), lesson(id) }. el: the app's element helper.
export function createGuidePanel({ bridge, button, pill, panel, getContext, actions, el, onToggle = () => {} }) {
  if (!bridge) { button.hidden = true; return { open() {}, close() {}, isOpen: () => false, status: () => null }; }
  let status = null, conversation = [], busy = null, sequence = 0;
  const deltas = new Map();
  bridge.onDelta((id, text) => deltas.get(id)?.(text));

  const state = el('span', { id: 'guide-panel-state', class: 'guide-panel-state' });
  const settingsToggle = el('button', { id: 'guide-settings-toggle', text: 'Settings', ariaExpanded: 'false', onclick: () => showSettings(settings.hidden) });
  const fresh = el('button', { id: 'guide-new', text: 'New', title: 'Start a new conversation', onclick: () => { if (!busy) { conversation = []; log.replaceChildren(); renderStarters(); input.focus(); } } });
  const banner = el('div', { id: 'guide-banner', class: 'guide-banner', role: 'status' });
  const retry = el('button', { id: 'guide-retry', text: 'Try now', onclick: async () => { retry.disabled = true; try { setStatus(await bridge.retry()); } finally { retry.disabled = false; } } });
  const log = el('div', { id: 'guide-log', class: 'guide-log', ariaLive: 'polite' });
  const starters = el('div', { id: 'guide-starters', class: 'guide-starters' });
  const input = el('textarea', { id: 'guide-input', rows: 2, maxLength: 2000, placeholder: 'Ask for direction: what next, a plan, where you stand…', ariaLabel: 'Ask the Guide' });
  const send = el('button', { id: 'guide-send', class: 'primary', text: 'Send', type: 'submit' });
  const stop = el('button', { id: 'guide-stop', text: 'Stop', type: 'button', hidden: true, onclick: () => busy && bridge.cancel(busy) });
  const form = el('form', { id: 'guide-form', class: 'guide-form', onsubmit: e => { e.preventDefault(); submit(input.value); } }, input, el('div', { class: 'guide-form-buttons' }, stop, send));
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input.value); } });

  // Settings: the key (stored encrypted by the operating system, never shown again), on/off and the limit.
  const keyInput = el('input', { id: 'guide-key', type: 'password', autocomplete: 'off', placeholder: 'sk-ant-…', ariaLabel: 'Anthropic API key' });
  const keyNote = el('p', { id: 'guide-key-note', class: 'edge-note' });
  const enabled = el('input', { id: 'guide-enabled', type: 'checkbox', onchange: () => apply({ enabled: enabled.checked }) });
  const limit = el('input', { id: 'guide-limit', type: 'number', min: 1, max: 1000, step: 1, ariaLabel: 'Monthly spending limit in US dollars' });
  const usage = el('p', { id: 'guide-usage', class: 'edge-note' });
  const settingsMessage = el('p', { id: 'guide-settings-message', class: 'edge-note', role: 'status' });
  const settings = el('div', { id: 'guide-settings', class: 'guide-settings', hidden: true },
    el('h3', { text: 'Guide settings' }),
    el('label', { class: 'field' }, document.createTextNode('Anthropic API key'), keyInput),
    el('div', { class: 'button-row' }, el('button', { id: 'guide-save-key', text: 'Save key', onclick: () => apply(null, () => bridge.setKey(keyInput.value)).then(() => { keyInput.value = ''; }) }),
      el('button', { id: 'guide-remove-key', text: 'Remove key', onclick: () => apply(null, () => bridge.clearKey()) })), keyNote,
    el('label', { class: 'guide-check' }, enabled, document.createTextNode(' Use the Guide (off keeps HelixSkill fully offline)')),
    el('label', { class: 'field' }, document.createTextNode('Monthly spending limit (US$)'), limit),
    el('div', { class: 'button-row' }, el('button', { id: 'guide-save-limit', text: 'Save limit', onclick: () => apply({ monthlyLimit: Number(limit.value) }) })), usage,
    el('p', { class: 'edge-note', text: 'Your questions and a short summary of your progress (target, counts, the selected skill and what the Guide looks up) are sent to Anthropic to answer them. Map files and answers stay on this computer, and the Guide cannot change them. Costs are estimates; your Anthropic Console shows the real bill.' }),
    settingsMessage);

  panel.replaceChildren(
    el('div', { class: 'guide-head' }, el('h2', { text: 'Guide' }), state, el('span', { class: 'tour-spacer' }), fresh, settingsToggle,
      el('button', { id: 'guide-close', text: '×', title: 'Close the Guide', ariaLabel: 'Close the Guide', onclick: () => close() })),
    el('div', { class: 'guide-banner-row' }, banner, retry), settings, log, starters, form,
    el('p', { class: 'guide-note', text: 'Guidance only: the Guide plans and points the way. It does not teach lessons or mark anything; only you mark proficiency.' }));
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!settings.hidden) showSettings(false); else close(); } });

  async function apply(next, call = () => bridge.settings(next)) {
    settingsMessage.textContent = '';
    try { setStatus(await call()); settingsMessage.textContent = 'Saved.'; }
    catch (error) { settingsMessage.textContent = String(error.message || error).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''); }
  }
  function showSettings(show) { settings.hidden = !show; settingsToggle.setAttribute('aria-expanded', String(show)); if (show) (status?.hasKey ? limit : keyInput).focus(); else if (settings.contains(document.activeElement) || document.activeElement === document.body) settingsToggle.focus(); }

  function setStatus(next) {
    status = next;
    const text = STATE_TEXT[status.state] || STATE_TEXT.off;
    pill.textContent = text.pill; pill.dataset.state = status.state; pill.title = pillTitle(status);
    state.textContent = status.state === 'online' ? 'Online' : status.state === 'connecting' ? 'Connecting…' : 'Not connected';
    state.dataset.state = status.state;
    banner.textContent = text.banner; banner.hidden = !text.banner;
    retry.hidden = !['disconnected', 'key-rejected'].includes(status.state);
    keyNote.textContent = status.hasKey ? (status.keySource === 'environment' ? 'Using the key from the ANTHROPIC_API_KEY environment variable.' : 'A key is saved, encrypted by Windows for your account.') : status.canStoreKey ? 'No key saved yet. Create one in the Anthropic Console.' : 'This computer cannot encrypt a saved key; set ANTHROPIC_API_KEY instead.';
    enabled.checked = status.enabled;
    if (document.activeElement !== limit) limit.value = String(status.monthlyLimit);
    usage.textContent = usageLine(status);
    renderInput();
  }
  function renderInput() {
    const ready = status?.state === 'online' || status?.state === 'connecting';
    input.disabled = !ready && !busy; send.disabled = !!busy || !ready; send.hidden = !!busy; stop.hidden = !busy;
    starters.hidden = !!conversation.length || !ready;
  }
  function renderStarters() {
    starters.replaceChildren(...STARTERS.map(q => el('button', { class: 'guide-starter', text: q, onclick: () => submit(q) })));
    renderInput();
  }

  // A reply: paragraphs, lists and headings as text; skill and path links as buttons when the id
  // exists on the open map, otherwise as plain text.
  function inline(parts) {
    const graph = getContext().graph, ids = new Set(graph.nodes.map(n => n.id));
    return parts.map(p => {
      if (p.t === 'b') return el('strong', { text: p.text });
      if (p.t === 'code') return el('code', { text: p.text });
      if ((p.t === 'skill' || p.t === 'path') && ids.has(p.id)) {
        const b = el('button', { class: `guide-link guide-${p.t}`, text: p.t === 'path' ? `⇢ ${p.text}` : p.text, title: p.t === 'path' ? `Show the path to this in path mode` : 'Fly to this skill', onclick: () => p.t === 'path' ? actions.path(p.id) : actions.select(p.id) });
        b.dataset.id = p.id; return b;
      }
      return document.createTextNode(p.text);
    });
  }
  function renderReply(host, text) {
    host.replaceChildren(...parseReply(text).map(b => b.type === 'p' ? el('p', {}, ...inline(b.inline)) : b.type === 'h' ? el('h4', {}, ...inline(b.inline))
      : el(b.type, {}, ...b.items.map(item => el('li', {}, ...inline(item))))));
  }
  const LOOKUPS = { get_overview: 'your progress', search_skills: 'skills', get_skill: 'a skill', path_to: 'a path', next_up: 'what is ready', course_summary: 'courses', recent_answers: 'recent answers' };

  async function submit(text) {
    const question = String(text || '').trim();
    if (!question || busy || !['online', 'connecting'].includes(status?.state)) return;
    input.value = '';
    log.append(el('div', { class: 'guide-msg guide-user' }, el('p', { text: question })));
    const reply = el('div', { class: 'guide-msg guide-reply' }), body = el('div', { class: 'guide-body' }), note = el('p', { class: 'guide-step', text: 'Thinking…' });
    reply.append(note, body); log.append(reply); log.scrollTop = log.scrollHeight;
    const id = `q${Date.now()}-${++sequence}`; busy = id; renderInput();
    let live = '';
    deltas.set(id, delta => { live += delta; note.hidden = true; body.textContent = live; log.scrollTop = log.scrollHeight; });
    try {
      const result = await ask(conversation, question, getContext(), {
        turn: request => bridge.turn(id, request).then(r => { if (r.status) setStatus(r.status); return r; })
      }, { onStep: names => { live = ''; body.textContent = ''; note.hidden = false; note.textContent = `Looking up ${[...new Set(names.map(n => LOOKUPS[n] || n))].join(', ')}…`; } });
      note.hidden = true;
      if (result.ok) renderReply(body, result.text || '(No answer.)');
      else {
        reply.classList.add('guide-failed');
        body.textContent = result.reason === 'aborted' ? 'Stopped.' : result.reason === 'refusal' ? 'The Guide could not answer that one. Try asking about your plan or the map in other words.'
          : result.reason === 'busy' ? 'Claude is busy right now. Try again in a minute.' : result.reason === 'too-many-steps' ? 'That took too many lookups. Try a narrower question.'
          : STATE_TEXT[result.reason]?.banner || `The Guide could not answer: ${result.error || result.reason}.`;
      }
    } catch (error) { reply.classList.add('guide-failed'); note.hidden = true; body.textContent = `The Guide could not answer: ${error.message || error}`; }
    finally { deltas.delete(id); busy = null; renderInput(); log.scrollTop = log.scrollHeight; }
  }

  function open() { panel.hidden = false; button.setAttribute('aria-expanded', 'true'); onToggle(true); if (!status || status.state === 'off' && !status.hasKey) showSettings(true); else input.focus(); }
  function close() { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); onToggle(false); button.focus({ preventScroll: true }); }
  button.addEventListener('click', () => panel.hidden ? open() : close());
  bridge.onStatus(setStatus);
  // The page's own network signal: a returning connection retries at once instead of waiting.
  window.addEventListener('online', () => { if (status && status.state === 'disconnected') bridge.retry().then(setStatus, () => {}); });
  renderStarters();
  bridge.status().then(setStatus, () => {});
  return { open, close, isOpen: () => !panel.hidden, status: () => status };
}
