// The Lessons dialog (File ▸ Lessons…): the model, the learner profile, the monthly cap, "Ask before
// generating", this month's usage, pre-generating the next skills, and exporting or importing the
// lesson store. Settings are kept by the main process; nothing here touches proficiency.
import { modelName } from './lesson-ui.js';
import { DEFAULT_BATCH } from './lesson-queue.js';

const money = n => `$${Number(n || 0).toFixed(2)}`;
export const usageText = s => `This month: ${s.usage.lessons} ${s.usage.lessons === 1 ? 'lesson' : 'lessons'} · ${s.usage.tokensIn.toLocaleString('en')} tokens in, ${s.usage.tokensOut.toLocaleString('en')} out · about ${money(s.usage.cost)} of your ${money(s.settings.monthlyCap)} cap`;

export function createLessonSettings({ bridge, dialog, body, el, getStatus, refresh, queue, candidates }) {
  const note = el('p', { class: 'edge-note', id: 'lessons-message', role: 'status' });
  const say = text => { note.textContent = text; };
  const apply = async next => { try { await bridge.settings(next); await refresh(); say('Saved.'); render(); } catch (error) { say(String(error.message || error).replace(/^Error invoking remote method '[^']+': (Error: )?/, '')); } };

  function render() {
    const s = getStatus();
    if (!s) { body.replaceChildren(el('p', { class: 'edge-note', text: 'Lesson settings are available in the desktop app.' })); return; }
    const model = el('select', { id: 'lessons-model', ariaLabel: 'Model', onchange: () => apply({ model: model.value }) },
      ...s.models.map(m => el('option', { value: m, text: `${modelName(m)}${m === 'claude-haiku-5-5' ? ' · cheap drafts' : m === 'claude-opus-5-5' ? ' · hard topics' : ' · default'}`, selected: m === s.settings.model })));
    const profile = el('textarea', { id: 'lessons-profile', rows: 3, maxLength: 1000, value: s.settings.learnerProfile, ariaLabel: 'Learner profile' });
    const cap = el('input', { id: 'lessons-cap', type: 'number', min: 1, max: 1000, step: 1, value: String(s.settings.monthlyCap), ariaLabel: 'Monthly spending cap for lessons in US dollars' });
    const ask = el('input', { id: 'lessons-ask', type: 'checkbox', checked: s.settings.askBeforeGenerating, onchange: () => apply({ askBeforeGenerating: ask.checked }) });
    const count = el('input', { id: 'lessons-batch', type: 'number', min: 1, max: 50, step: 1, value: String(DEFAULT_BATCH), ariaLabel: 'How many lessons to pre-generate' });
    const q = queue.state();
    const queueLine = el('p', { class: 'edge-note', id: 'lessons-queue-state', text: q.total ? `${q.running ? 'Generating' : q.paused ? 'Paused' : 'Finished'}: ${q.done} of ${q.total}${q.results.filter(r => !r.ok).length ? ` · ${q.results.filter(r => !r.ok).length} failed` : ''}${q.stopReason && !q.running ? ` · ${q.stopReason}` : ''}` : 'Not running.' });
    body.replaceChildren(
      el('h3', { text: 'Generating lessons' }),
      el('label', { class: 'field' }, document.createTextNode('Model'), model),
      el('label', { class: 'field' }, document.createTextNode('Learner profile (sent with each lesson request)'), profile),
      el('div', { class: 'button-row' }, el('button', { id: 'lessons-save-profile', text: 'Save profile', onclick: () => apply({ learnerProfile: profile.value }) })),
      el('label', { class: 'field' }, document.createTextNode('Monthly spending cap for lessons (US$)'), cap),
      el('div', { class: 'button-row' }, el('button', { id: 'lessons-save-cap', text: 'Save cap', onclick: () => apply({ monthlyCap: Number(cap.value) }) })),
      el('label', { class: 'guide-check' }, ask, document.createTextNode(' Ask before generating')),
      el('h3', { text: 'Usage' }),
      el('p', { id: 'lessons-usage', text: usageText(s) }),
      el('p', { class: 'edge-note', text: `Estimated from token counts with the prices checked ${s.pricingChecked} (desktop/claude-pricing.json). Generation stops when the cap is reached; your Anthropic Console shows the real bill.` }),
      s.availability.ok ? null : el('p', { class: 'lesson-flag', id: 'lessons-unavailable', text: s.availability.reason }),
      el('h3', { text: 'Pre-generate next up' }),
      el('p', { class: 'edge-note', text: 'Writes lessons for the next skills you can study, one at a time in the background. It respects the cap and can be paused.' }),
      el('div', { class: 'button-row' }, count,
        el('button', { id: 'lessons-queue-start', text: q.running ? 'Running…' : 'Start', disabled: q.running || !s.availability.ok, onclick: () => { const ids = candidates(Math.max(1, Math.min(50, Number(count.value) || DEFAULT_BATCH))); if (!ids.length) { say('Every next-up skill already has a lesson.'); return; } queue.start(ids); render(); } }),
        el('button', { id: 'lessons-queue-pause', text: q.running ? 'Pause' : 'Resume', disabled: !q.running && !(q.paused && q.done < q.total), onclick: () => { if (q.running) queue.pause(); else queue.resume(); render(); } })),
      queueLine,
      el('h3', { text: 'Back up or move lessons' }),
      el('div', { class: 'button-row' },
        el('button', { id: 'lessons-export', text: 'Export lessons (zip)…', onclick: async () => { try { const r = await bridge.exportStore(); say(r ? `Exported to ${r.file}.` : 'Export cancelled.'); } catch (error) { say(error.message); } } }),
        el('button', { id: 'lessons-import', text: 'Import lessons (zip)…', onclick: async () => { try { const r = await bridge.importStore(); if (!r) { say('Import cancelled.'); return; } await refresh(true); say(`Imported: ${r.added} added, ${r.same} already here, ${r.keptExisting} kept as they were (yours differ), ${r.invalid} not valid.`); } catch (error) { say(String(error.message || error).replace(/^Error invoking remote method '[^']+': (Error: )?/, '')); } } })),
      el('p', { class: 'edge-note', text: 'Import only adds lessons: a lesson you already have is never replaced.' }),
      note);
  }
  function open() { render(); if (!dialog.open) dialog.showModal(); }
  return { open, render, close: () => dialog.open && dialog.close() };
}
