// The lesson dialog: opening a lesson (an AI lesson, a reviewed archive, or both), generating one
// with a live "Generating…" view that can be cancelled, regenerating after a confirmation, and the
// learner's own review of an AI lesson (Mark reviewed, Flag a problem). Generating, opening or
// finishing a lesson never changes proficiency, and AI practice is never a demonstration.
import { renderArchive } from './lesson-viewer.js';
import { renderAiLesson, sectionTitle } from './lesson-render.js';
import { lessonKey } from './lessons.js';
import { buildLessonContext } from './lesson-context.js';

const MODEL_NAMES = { 'claude-sonnet-5-5': 'Claude Sonnet 5.5', 'claude-haiku-5-5': 'Claude Haiku 5.5', 'claude-opus-5-5': 'Claude Opus 5.5' };
export const modelName = id => MODEL_NAMES[id] || id;
// Honest rough figures for the confirmation, from the real run (docs/samples): a lesson is about
// 3–5k tokens in and 5–7k out, a little more with the QUANT check. Shown as a range, never a promise.
const ESTIMATE = { 'claude-haiku-5-5': 'under $0.01', 'claude-sonnet-5-5': 'about $0.05–0.15', 'claude-opus-5-5': 'about $0.10–0.30' };
export const costEstimate = model => ESTIMATE[model] || 'a few cents';
const PROGRESS_SECTIONS = ['objectives', 'explanation', 'workedExample', 'guidedPractice', 'independentPractice', 'checkForUnderstanding', 'keyTerms', 'commonMistakes'];

// bridge: window.desktop.lessons. index: the lesson index (src/lessons.js). getGraph(), getLearner():
// the open map and its learner state. onChanged(): re-render the app after a lesson changes.
export function createLessonUI({ bridge, index, el, dialog, title, body, getGraph, getLearner, getStatus, onChanged = () => {}, beforeOpen = () => {} }) {
  let openId = null, job = null, view = 'ai', sequence = 0;
  const progress = new Map();
  bridge?.onProgress((jobId, p) => progress.get(jobId)?.(p));

  const nodeById = id => getGraph().nodes.find(n => n.id === id);
  function show(node) { beforeOpen(); openId = node.id; title.textContent = node.name; if (!dialog.open) dialog.showModal(); }

  async function open(id, preferred = null) {
    const node = nodeById(id); if (!node) return;
    show(node); body.replaceChildren(el('p', { class: 'edge-note', text: 'Opening the lesson…' }));
    const lessons = await index.getLesson(getGraph(), node);
    if (openId !== id || job) return;
    if (preferred) view = preferred; else view = lessons.ai ? 'ai' : 'archive';
    body.replaceChildren(...content(node, lessons));
    body.querySelector('details.lesson-section>summary')?.focus();
  }

  function content(node, lessons) {
    const out = [];
    if (lessons.ai && lessons.archive) out.push(el('div', { class: 'lesson-tabs', role: 'tablist' },
      ...[['ai', 'AI lesson'], ['archive', 'Reviewed lesson']].map(([key, label]) => { const b = el('button', { class: view === key ? 'chosen' : '', text: label, role: 'tab', onclick: () => open(node.id, key) }); b.setAttribute('aria-selected', String(view === key)); return b; })));
    const record = view === 'ai' ? lessons.ai : lessons.archive;
    if (!record) { out.push(el('p', { class: 'edge-note', text: 'This skill has no lesson yet. Use Generate lesson on its card.' })); return out; }
    if (record.source === 'reviewed-archive') {
      out.push(el('p', { class: 'lesson-badge lesson-reviewed', id: 'lesson-viewer-badge', text: 'Reviewed lesson' }), ...renderArchive(el, node, record));
      return out;
    }
    const status = getStatus(), outdated = status && record.promptVersion !== status.promptVersion;
    const badge = record.status === 'flagged' ? 'Flagged' : record.status === 'reviewed' ? 'AI-generated · reviewed by you' : 'AI-generated · not yet reviewed';
    out.push(el('div', { class: 'lesson-head' },
      el('span', { class: `lesson-badge lesson-${record.status === 'flagged' ? 'flagged' : record.status === 'reviewed' ? 'reviewed' : 'unreviewed'}`, id: 'lesson-viewer-badge', text: badge }),
      el('span', { class: 'edge-note', text: `${modelName(record.model)} · ${record.createdAt.slice(0, 10)} · about ${record.content.estimatedMinutes} min` }),
      outdated ? el('span', { class: 'lesson-badge lesson-demo', id: 'lesson-update', text: 'Update available', title: 'A newer lesson prompt exists. Regenerate to use it; this lesson is kept until you do.' }) : null));
    if (record.verification) {
      const v = record.verification;
      out.push(el('p', { class: v.mismatches.length ? 'lesson-flag' : 'edge-note', id: 'lesson-verification', text: v.mismatches.length
        ? `Answer check: ${v.mismatches.length} practice ${v.mismatches.length === 1 ? 'problem disagrees' : 'problems disagree'} with an independent re-solve (${v.mismatches.map(m => m.id).join(', ')}). Check ${v.mismatches.length === 1 ? 'it' : 'them'} before relying on the answers.`
        : `Answer check: ${v.checked} of ${v.total} practice answers agree with an independent re-solve${v.notChecked.length ? `; ${v.notChecked.length} without a single number were not checked automatically` : ''}.` }));
    }
    if (record.userNotes) out.push(el('p', { class: 'lesson-notes', id: 'lesson-notes', text: `Your notes: ${record.userNotes}` }));
    const flagNote = el('textarea', { id: 'lesson-flag-note', rows: 2, maxLength: 2000, placeholder: 'What is wrong? (kept with the lesson)', ariaLabel: 'What is wrong with this lesson' });
    const flagForm = el('div', { class: 'lesson-flag-form', hidden: true }, flagNote,
      el('div', { class: 'button-row' }, el('button', { id: 'lesson-flag-save', text: 'Save flag', onclick: () => review(node, 'flagged', flagNote.value) }), el('button', { text: 'Cancel', onclick: () => { flagForm.hidden = true; } })));
    out.push(el('div', { class: 'button-row lesson-actions' },
      el('button', { id: 'lesson-mark-reviewed', text: record.status === 'reviewed' ? 'Reviewed ✓' : 'Mark reviewed', disabled: record.status === 'reviewed', title: 'After you have checked the lesson yourself. This marks the lesson, never your proficiency.', onclick: () => review(node, 'reviewed') }),
      el('button', { id: 'lesson-flag', text: 'Flag a problem', onclick: () => { flagForm.hidden = false; flagNote.focus(); } }),
      el('button', { id: 'lesson-regenerate-viewer', text: 'Regenerate', disabled: !status?.availability.ok, title: status?.availability.ok ? 'Replaces the current AI lesson; reviewed lessons are kept.' : status?.availability.reason || '', onclick: () => regenerate(node.id) })), flagForm);
    out.push(el('p', { class: 'lesson-note' , text: 'Written by AI. Practice here is preparation: it never counts as a physical demonstration, and only you mark proficiency.' }), ...renderAiLesson(el, record));
    return out;
  }

  async function review(node, status, note = '') {
    try { await bridge.review(lessonKey(getGraph()), node.id, { status, note }); } catch (error) { body.prepend(el('p', { class: 'lesson-flag', text: error.message })); return; }
    await index.invalidate(getGraph(), node.id); onChanged(); open(node.id, 'ai');
  }

  // Generates a lesson (or a replacement), showing progress section by section. Never saves a partial lesson.
  async function generate(id, { replace = false } = {}) {
    const node = nodeById(id), status = getStatus();
    if (!node || job || !bridge) return;
    if (!status?.availability.ok) { show(node); body.replaceChildren(el('p', { class: 'lesson-flag', text: status?.availability.reason || 'Lesson generation is not available.' })); return; }
    if (replace && !confirm('Replaces the current AI lesson; reviewed lessons are kept.')) return;
    if (!replace && status.settings.askBeforeGenerating && !confirm(`Generate a 30-minute lesson for "${node.name}" with ${modelName(status.settings.model)}? It usually takes about 30–60 seconds (longer when practice answers are checked) and costs ${costEstimate(status.settings.model)}.`)) return;
    const graph = getGraph(), learner = getLearner(), context = buildLessonContext(graph, node, { index: learner.index, learnerProfile: status.settings.learnerProfile });
    show(node);
    const jobId = `L${Date.now()}-${++sequence}`; job = jobId;
    const stage = el('p', { class: 'lesson-stage', id: 'lesson-stage', text: 'Writing the lesson…' });
    const items = new Map(PROGRESS_SECTIONS.map(key => [key, el('li', { text: sectionTitle(key) })]));
    const started = Date.now(), clock = el('span', { class: 'edge-note', id: 'lesson-clock' });
    const timer = setInterval(() => { clock.textContent = `${Math.round((Date.now() - started) / 1000)} s · usually about 30–60 s${context.skill.type === 'QUANT' ? ', plus the answer check' : ''}`; }, 500);
    body.replaceChildren(el('div', { class: 'lesson-generating', id: 'lesson-generating' },
      el('h3', { text: replace ? 'Writing a new lesson…' : 'Generating…' }), stage, clock,
      el('ul', { class: 'lesson-progress' }, ...items.values()),
      el('button', { id: 'lesson-cancel', text: 'Cancel', onclick: () => bridge.cancel(jobId) }),
      el('p', { class: 'edge-note', text: `${modelName(status.settings.model)} writes the lesson from this skill, its prerequisites and what it unlocks. Nothing is saved until it is complete and checked.` })));
    progress.set(jobId, p => {
      stage.textContent = p.stage === 'verifying' ? 'Checking every practice answer with an independent re-solve…' : p.stage === 'repairing' ? `Rewriting practice problem ${p.problem}, which failed the check…` : p.stage === 'retrying' ? 'Something went wrong; trying once more…' : 'Writing the lesson…';
      for (const [key, li] of items) li.classList.toggle('done', (p.sections || []).includes(key));
    });
    let result;
    try { result = await bridge.generate(jobId, lessonKey(graph), node.id, context, { replace }); }
    catch (error) { result = { ok: false, kind: 'failed', message: error.message }; }
    finally { clearInterval(timer); progress.delete(jobId); job = null; }
    if (openId !== id) { await index.invalidate(graph, id); onChanged(); return; }
    if (result.ok) { await index.invalidate(graph, id); onChanged(); return open(id, 'ai'); }
    body.replaceChildren(el('p', { class: result.kind === 'cancelled' ? 'edge-note' : 'lesson-flag', id: 'lesson-error', text: result.kind === 'cancelled' ? 'Cancelled. Nothing was saved.' : `The lesson could not be generated: ${result.message} Nothing was saved.` }),
      el('div', { class: 'button-row' }, el('button', { id: 'lesson-try-again', text: 'Try again', onclick: () => generate(id, { replace }) }), el('button', { text: 'Close', onclick: close })));
  }
  const regenerate = id => generate(id, { replace: true });
  // For the pre-generate queue: one lesson without the dialog. Resolves to the main process's result.
  async function generateQuietly(id) {
    const node = nodeById(id), status = getStatus();
    if (!node || !bridge) return { ok: false, kind: 'failed', message: 'Unknown skill.' };
    if (!status?.availability.ok) return { ok: false, kind: 'unavailable', message: status?.availability.reason };
    const graph = getGraph(), context = buildLessonContext(graph, node, { index: getLearner().index, learnerProfile: status.settings.learnerProfile });
    const jobId = `Q${Date.now()}-${++sequence}`; queueJob = jobId;
    try { return await bridge.generate(jobId, lessonKey(graph), id, context, {}); }
    catch (error) { return { ok: false, kind: 'failed', message: error.message }; }
    finally { queueJob = null; await index.invalidate(graph, id); onChanged(); }
  }
  let queueJob = null;
  const cancelQuiet = () => { if (queueJob) bridge.cancel(queueJob); };
  function close() { if (job) bridge.cancel(job); openId = null; if (dialog.open) dialog.close(); }
  dialog.addEventListener('close', () => { if (job) bridge.cancel(job); openId = null; });

  return { open, generate, regenerate, generateQuietly, cancelQuiet, close, isGenerating: () => !!job };
}
