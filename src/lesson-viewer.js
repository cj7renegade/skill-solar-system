// The lesson viewer: one reading view for every lesson, opened from a skill card. A reviewed archive
// renders its own sections (src/lesson.js); answers stay behind "Show answer". Opening, reading or
// revealing never touches proficiency.
import { lessonSections } from './lesson.js';

// One question with its answer behind a control the reader has to press.
export function revealBlock(el, { question, answer, reveal = 'Show answer', hide = 'Hide answer' }, render = text => el('p', { class: 'lesson-answer-text', text })) {
  const shown = el('div', { class: 'lesson-answer', hidden: true }, render(answer));
  const button = el('button', { class: 'reveal', text: reveal, onclick: () => { shown.hidden = !shown.hidden; button.textContent = shown.hidden ? reveal : hide; button.setAttribute('aria-expanded', String(!shown.hidden)); } });
  button.setAttribute('aria-expanded', 'false');
  return el('div', { class: 'lesson-question' }, typeof question === 'string' ? el('p', { class: 'lesson-prompt', text: question }) : question,
    answer ? button : null, answer ? shown : el('p', { class: 'edge-note', text: 'No answer key was supplied for this question.' }));
}
function archiveBlock(el, block) {
  if (block.type === 'note') return el('p', { class: 'lesson-note', text: block.text });
  if (block.type === 'reveal') return revealBlock(el, block);
  if (block.type === 'list') return el('div', { class: 'lesson-block' }, block.label ? el('h4', { text: block.label }) : null, el('ul', {}, ...block.items.map(item => el('li', { text: item }))));
  if (block.type === 'links') return el('div', { class: 'lesson-block' }, block.label ? el('h4', { text: block.label }) : null, el('ul', {}, ...block.items.map(item => el('li', {}, el('span', { class: 'lesson-url', text: item.url }), item.use ? el('p', { class: 'edge-note', text: item.use }) : null))));
  return el('div', { class: 'lesson-block' }, block.label ? el('h4', { text: block.label }) : null, el('p', { text: block.text }));
}
// A reviewed archive: its sections, all closed to begin with, in the same markup the cards used.
export function renderArchive(el, node, archive) {
  const merged = { ...node, ...archive.content }, sections = lessonSections(merged);
  const out = [];
  if (merged.lesson?.instructional_scope) out.push(el('p', { class: 'edge-note', text: merged.lesson.instructional_scope }));
  out.push(...sections.map(section => el('details', { class: 'lesson-section' }, el('summary', { text: section.title }), ...section.blocks.map(b => archiveBlock(el, b)))));
  return out;
}
