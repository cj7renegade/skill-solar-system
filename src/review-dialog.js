// Guided proficiency review dialog. Only the Yes and No buttons record answers; scrolling,
// dragging, and keys other than normal button activation never do. The host applies answers
// through the map's normal update path (history, draft cache, dirty state).
import { iconElement } from './icons.js';
import { LEVEL_NOTE, proficiencyLabel } from './model.js';
import { isUnmarked, startSession, currentId, answer, skip, back, reviewSkipped, isFinished, progress, createAnswerGate, storeSession, dropSession, findSession } from './review.js';

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key.includes('-')) node.setAttribute(key, value);
    else node[key] = value;
  }
  for (const child of children) if (child) node.append(child);
  return node;
}
const SAVE_NOTE = 'Answers go into the open map and its local draft. Use Save map to write the JSON file.';

export function createReviewDialog({ dialog, opener, getGraph, apply, show, storage, onOpen = () => {} }) {
  const body = dialog.querySelector('#review-body');
  const fill = (...children) => body.replaceChildren(...children.filter(Boolean));
  const gate = createAnswerGate(400);
  let session = null, storedKey = null, notice = '';

  const nodeById = id => getGraph().nodes.find(n => n.id === id);
  function persist() {
    if (!session) return;
    if (!storeSession(storage, session, storedKey)) notice = 'Review progress could not be stored locally. You can still finish this review now.';
    storedKey = session.map;
  }
  // Focus moves synchronously: the content exists as soon as it is rendered, and animation frames
  // are suspended while the window is covered, which would leave focus behind.
  function focusTitle() { dialog.querySelector('#review-title')?.focus({ preventScroll: true }); }
  function focusDefault() { (body.querySelector('#review-unmarked') || body.querySelector('#review-all') || body.querySelector('#review-close'))?.focus(); }
  function status(text) { const line = dialog.querySelector('#review-status'); if (line) line.textContent = text; }

  function renderStart() {
    session = null; storedKey = null;
    const graph = getGraph(), total = graph.nodes.length;
    const unmarked = graph.nodes.filter(n => isUnmarked(n.proficiency80)).length, yes = graph.nodes.filter(n => n.proficiency80 === true).length;
    const found = total ? findSession(storage, graph) : null;
    const actions = el('div', { class: 'review-start-actions' });
    if (found) {
      const s = found.session, pending = s.queue.length - s.position;
      actions.append(el('button', { id: 'review-resume', text: `Resume review · ${pending ? `${pending} left` : 'finished'}${s.skipped.length ? `, ${s.skipped.length} skipped` : ''}`, onclick: () => resume(found) }));
    }
    if (unmarked) actions.append(el('button', { id: 'review-unmarked', class: 'primary', text: `Continue unmarked skills (${unmarked})`, onclick: () => begin('unmarked') }));
    if (total) actions.append(el('button', { id: 'review-all', text: `Review all skills (${total})`, onclick: () => begin('all') }));
    actions.append(el('button', { id: 'review-close', text: 'Close', onclick: () => close() }));
    fill(
      el('h2', { id: 'review-title', tabIndex: -1, text: 'Mark proficiency' }),
      el('p', { text: 'Answer Yes or No for each skill, starting from the bottom of the map and moving upward. This is your own judgment: there is no quiz or scoring.' }),
      el('p', { class: 'review-counts', text: total ? `${total} skills · ${unmarked} unmarked · ${yes} Yes · ${total - unmarked - yes} No` : 'This map has no skills to review.' }),
      total && !unmarked ? el('p', { class: 'review-complete', text: 'Every skill on this map already has an answer. Review all skills to change any of them.' }) : null,
      actions,
      el('p', { class: 'review-note', text: SAVE_NOTE })
    );
    if (dialog.open) focusDefault();
  }

  function begin(mode) {
    session = startSession(getGraph(), mode); storedKey = null; notice = '';
    persist(); renderCurrent(true);
  }
  function resume(found) {
    session = found.session; storedKey = found.storedKey;
    const notes = [];
    if (found.missing.length) notes.push(`${found.missing.length} skill${found.missing.length > 1 ? 's were' : ' was'} removed from the map and left the review.`);
    if (found.undone.length) notes.push(`${found.undone.length} answer${found.undone.length > 1 ? 's were' : ' was'} undone since; ${found.undone.length > 1 ? 'they are' : 'it is'} pending again.`);
    notice = notes.join(' ');
    persist(); renderCurrent(true);
  }

  function renderCurrent(highlight) {
    const id = currentId(session);
    if (id === null) return renderEnd();
    const node = nodeById(id);
    if (!node) { session = skip(session, id); persist(); return renderCurrent(highlight); }
    if (highlight) show(id);
    const p = progress(session, getGraph()), value = node.proficiency80;
    const paragraphs = (node.details || '').trim().split(/\n\s*\n/).filter(Boolean);
    const choose = result => {
      const shown = id;
      return () => {
        if (!gate.accept(shown, currentId(session), performance.now())) return;
        const next = answer(session, shown, result), nextId = currentId(next);
        const outcome = nodeById(shown).proficiency80 === result ? (show(nextId ?? shown), { ok: true, cached: true }) : apply(shown, result, nextId);
        if (!outcome.ok) { status('The answer could not be applied to the map.'); return; }
        session = next; notice = outcome.cached ? '' : 'Draft cache unavailable. Save the map to a JSON file now to keep these answers.';
        persist(); renderCurrent(false);
      };
    };
    const nav = action => () => {
      if (!gate.accept(id, currentId(session), performance.now())) return;
      session = action(session); persist(); renderCurrent(true);
    };
    // A mouse press must not move focus onto the next skill's button (a double-click's second
    // press lands there), or a later Enter would answer it. Keyboard focus and activation still work.
    const answerButton = (result, label, kind) => el('button', { class: `review-answer ${kind}${value === result ? ' current' : ''}`, text: label, 'aria-pressed': String(value === result), onmousedown: event => event.preventDefault(), onclick: choose(result) });
    fill(
      el('div', { class: 'review-progress' },
        el('span', { text: `Skill ${p.position} of ${p.total} · ${p.answered} answered${p.skipped ? ` · ${p.skipped} skipped` : ''}${session.round > 1 ? ' · skipped skills' : ''}` }),
        el('span', { text: `Height ${p.height.index} of ${p.height.count} · ${p.height.positionInHeight} of ${p.height.sizeOfHeight} at this height` }),
        el('progress', { max: p.total, value: p.position - 1, 'aria-label': 'Review progress' })),
      el('div', { class: 'subject-heading' }, iconElement(node.icon), el('div', {},
        el('h2', { id: 'review-title', tabIndex: -1, text: node.name }),
        el('p', { class: 'edge-note', title: LEVEL_NOTE, text: node.domain + (node.skillLevel != null ? ` · Reference level ${node.skillLevel}/100` : '') }))),
      el('p', { class: 'review-question', text: `Do you have at least 80% proficiency in ${node.name}?` }),
      isUnmarked(value) ? null : el('p', { class: `review-existing ${value ? 'yes' : 'no'}`, text: `Current answer: ${proficiencyLabel(value)}. A new answer replaces it.` }),
      el('div', { id: 'review-text', class: 'review-text', tabIndex: 0, role: 'region', 'aria-label': `Description of ${node.name}` },
        node.description ? el('p', { class: 'subject-summary', text: node.description }) : null,
        ...paragraphs.map(text => el('p', { text })),
        !node.description && !paragraphs.length ? el('p', { class: 'edge-note', text: 'No description yet.' }) : null),
      el('div', { class: 'review-answers' }, answerButton(false, 'No — below 80%', 'no'), answerButton(true, 'Yes — at least 80%', 'yes')),
      el('div', { class: 'review-controls' },
        el('button', { id: 'review-back', text: '← Back', disabled: !session.visited.length, onclick: nav(back) }),
        el('button', { id: 'review-skip', text: 'Skip', onclick: nav(s => skip(s, id)) }),
        el('button', { id: 'review-pause', text: 'Pause', onclick: () => close() })),
      el('p', { class: 'review-note', text: `Your judgment only; no quiz or scoring. ${SAVE_NOTE}` }),
      el('p', { id: 'review-status', class: 'review-status', role: 'status', text: notice }));
    focusTitle();
  }

  function renderEnd() {
    const complete = !session.skipped.length, answered = session.queue.filter(id => id in session.answers).length;
    if (complete) { dropSession(storage, session.map); storedKey = null; }
    fill(
      el('h2', { id: 'review-title', tabIndex: -1, text: complete ? 'Review complete: every skill in it is answered' : `Review ended with ${session.skipped.length} skipped skill${session.skipped.length > 1 ? 's' : ''}` }),
      el('p', { class: 'review-counts', text: `${answered} answered in this review${complete ? '' : ` · ${session.skipped.length} skipped and left unchanged`}.` }),
      el('div', { class: 'review-start-actions' },
        complete ? null : el('button', { id: 'review-skipped', class: 'primary', text: 'Review skipped skills', onclick: () => { session = reviewSkipped(session); persist(); renderCurrent(true); } }),
        el('button', { id: 'review-restart', text: 'Start again', onclick: () => { if (!complete) dropSession(storage, session.map); renderStart(); } }),
        el('button', { id: 'review-close', text: 'Close', onclick: () => close() })),
      el('p', { class: 'review-note', text: SAVE_NOTE }),
      el('p', { id: 'review-status', class: 'review-status', role: 'status', text: notice }));
    focusTitle();
  }

  function open() {
    if (dialog.open) return;
    onOpen(); gate.reset(); notice = '';
    renderStart();
    dialog.showModal();
    focusDefault();
  }
  // Pause and close keep an unfinished session for Resume; nothing is answered on the way out.
  function close() {
    if (session && !isFinished(session)) persist();
    if (dialog.open) dialog.close();
  }
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('close', () => opener.focus());
  return { open, close, isOpen: () => dialog.open };
}
