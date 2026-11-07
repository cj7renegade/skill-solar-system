// Rendering AI lessons in the lesson viewer. A small, safe markdown renderer (paragraphs, headings,
// lists, bold, italics, inline code, fenced code blocks) with math between $…$ and $$…$$ (or \(…\)
// and \[…\]) rendered by KaTeX, bundled offline. Everything else stays text: a lesson can never add
// markup or links to the page. Solutions stay behind "Show answer" and hints behind "Show hint".
import katex from 'katex';
import { revealBlock } from './lesson-viewer.js';

export function renderMath(el, expression, display) {
  const host = el(display ? 'div' : 'span', { class: display ? 'math-display' : 'math-inline' });
  try { katex.render(expression, host, { displayMode: display, throwOnError: false, trust: false, strict: 'ignore', output: 'htmlAndMathml' }); }
  catch { host.textContent = expression; }
  return host;
}

// Inline pieces: `code`, $$math$$, $math$, \(math\), **bold**, *italic*, plain text.
export function inlineParts(text) {
  const out = [], re = /`([^`]+)`|\$\$([^$]+)\$\$|\$([^$\n]+?)\$|\\\((.+?)\\\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: 'text', text: text.slice(last, m.index) });
    if (m[1] != null) out.push({ t: 'code', text: m[1] });
    else if (m[2] != null) out.push({ t: 'math', text: m[2], display: true });
    else if (m[3] != null) out.push({ t: 'math', text: m[3] });
    else if (m[4] != null) out.push({ t: 'math', text: m[4] });
    else if (m[5] != null) out.push({ t: 'b', text: m[5] });
    else out.push({ t: 'i', text: m[6] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: 'text', text: text.slice(last) });
  return out;
}

// Block structure: fenced code, display math, headings, lists and paragraphs.
export function markdownBlocks(source) {
  const lines = String(source ?? '').replace(/\r/g, '').split('\n'), blocks = [];
  let para = [], list = null;
  const flush = () => { if (para.length) blocks.push({ type: 'p', text: para.join(' ') }); para = []; list = null; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/);
    if (fence) {
      flush(); const code = [];
      while (++i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i]);
      blocks.push({ type: 'code', lang: fence[1] || null, text: code.join('\n') }); continue;
    }
    const display = line.trim().match(/^(\$\$|\\\[)(.*)$/);
    if (display) {
      flush();
      const close = display[1] === '$$' ? '$$' : '\\]', body = [];
      let rest = display[2];
      while (!rest.trimEnd().endsWith(close) && i + 1 < lines.length) { body.push(rest); rest = lines[++i]; }
      const end = rest.trimEnd();
      body.push(end.endsWith(close) ? end.slice(0, -close.length) : end);
      blocks.push({ type: 'math', text: body.join('\n').trim() }); continue;
    }
    if (!line.trim()) { flush(); continue; }
    const heading = line.match(/^\s*(#{1,4})\s+(.*)$/), bullet = line.match(/^\s*[-*•]\s+(.*)$/), number = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (heading) { flush(); blocks.push({ type: 'h', level: heading[1].length, text: heading[2] }); continue; }
    if (bullet || number) {
      if (para.length) { blocks.push({ type: 'p', text: para.join(' ') }); para = []; }
      const type = bullet ? 'ul' : 'ol';
      if (!list || list.type !== type) blocks.push(list = { type, items: [] });
      list.items.push((bullet || number)[1]); continue;
    }
    if (list) { list.items[list.items.length - 1] += ` ${line.trim()}`; continue; }
    para.push(line.trim());
  }
  flush();
  return blocks;
}

export function renderMarkdown(el, source) {
  const inline = text => inlineParts(text).map(p => p.t === 'code' ? el('code', { text: p.text }) : p.t === 'math' ? renderMath(el, p.text, !!p.display)
    : p.t === 'b' ? el('strong', { text: p.text }) : p.t === 'i' ? el('em', { text: p.text }) : document.createTextNode(p.text));
  return el('div', { class: 'md' }, ...markdownBlocks(source).map(b => b.type === 'code' ? el('pre', { class: 'code-block' }, el('code', { text: b.text, title: b.lang || '' }))
    : b.type === 'math' ? renderMath(el, b.text, true) : b.type === 'h' ? el(`h${Math.min(6, b.level + 3)}`, {}, ...inline(b.text))
    : b.type === 'p' ? el('p', {}, ...inline(b.text)) : el(b.type, {}, ...b.items.map(item => el('li', {}, ...inline(item))))));
}

// The practice items of a cached lesson, for review sessions: the same questions every time.
export function practiceItems(lessons) {
  const items = [];
  if (lessons?.ai?.content) {
    const c = lessons.ai.content;
    for (const p of c.independentPractice || []) items.push({ question: p.prompt, answer: `**Answer:** ${p.answer}\n\n${p.solution}` });
    for (const q of c.checkForUnderstanding || []) items.push({ question: q.question, answer: q.answer });
  } else if (lessons?.archive?.content?.lesson) {
    const l = lessons.archive.content.lesson;
    if (l.practice?.question) items.push({ question: l.practice.question, answer: l.practice.answer || '' });
    if (l.boundary_case?.question) items.push({ question: l.boundary_case.question, answer: l.boundary_case.answer || '' });
  }
  return items;
}

const SECTION_TITLES = { objectives: 'Objectives', explanation: 'Explanation', workedExample: 'Worked example', guidedPractice: 'Guided practice', independentPractice: 'Independent practice',
  checkForUnderstanding: 'Check for understanding', safety: 'Safety', demonstration: 'Demonstration', keyTerms: 'Key terms', commonMistakes: 'Common mistakes' };
export const sectionTitle = key => SECTION_TITLES[key] || key;

// An AI lesson in reading order: safety and the explanation open, practice and answers closed.
export function renderAiLesson(el, record) {
  const c = record.content, md = text => renderMarkdown(el, text);
  const section = (key, open, ...children) => el('details', { class: `lesson-section ai-${key}`, open }, el('summary', { text: sectionTitle(key) }), ...children.filter(Boolean));
  const list = items => el('ul', {}, ...items.map(i => el('li', {}, md(i))));
  const disagreement = id => record.verification?.mismatches?.find(m => m.id === id);
  const problem = (p, guided) => el('div', { class: 'lesson-problem', id: `problem-${p.id}` },
    el('div', { class: 'lesson-prompt' }, md(p.prompt)),
    guided && p.hints?.length ? revealBlock(el, { question: el('span'), answer: p.hints.map((h, i) => `Hint ${i + 1}: ${h}`).join('\n\n'), reveal: 'Show hint', hide: 'Hide hint' }, md) : null,
    revealBlock(el, { question: el('span'), answer: `**Answer:** ${p.answer}\n\n${p.solution}` }, md),
    disagreement(p.id) ? el('p', { class: 'lesson-flag', text: `An independent check got a different answer (${disagreement(p.id).check?.answer ?? 'none'}). Check this problem before relying on it.` }) : null);
  return [
    section('objectives', true, list(c.objectives)),
    c.safety ? section('safety', true, el('div', { class: 'lesson-safety' },
      el('h4', { text: 'Hazards' }), list(c.safety.hazards), el('h4', { text: 'Precautions' }), list(c.safety.precautions),
      c.safety.stopConditions?.length ? el('h4', { text: 'Stop if' }) : null, c.safety.stopConditions?.length ? list(c.safety.stopConditions) : null)) : null,
    section('explanation', true, md(c.explanation)),
    section('workedExample', false, el('div', { class: 'lesson-prompt' }, md(c.workedExample.problem)), el('ol', {}, ...c.workedExample.steps.map(s => el('li', {}, md(s)))),
      el('div', { class: 'lesson-result' }, el('strong', { text: 'Result' }), md(c.workedExample.result))),
    section('guidedPractice', false, ...c.guidedPractice.map(p => problem(p, true))),
    section('independentPractice', false, ...c.independentPractice.map(p => problem(p, false))),
    section('checkForUnderstanding', false, ...c.checkForUnderstanding.map(q => revealBlock(el, { question: el('div', {}, md(q.question)), answer: q.answer }, md))),
    c.demonstration ? section('demonstration', false, md(c.demonstration.description), el('h4', { text: 'Evidence to record' }), list(c.demonstration.evidence),
      el('p', { class: 'lesson-flag', text: 'Not satisfied by this lesson. A lesson, simulation or worked answer is never a physical demonstration.' })) : null,
    section('keyTerms', false, el('dl', {}, ...c.keyTerms.flatMap(k => [el('dt', { text: k.term }), el('dd', {}, md(k.definition))]))),
    section('commonMistakes', false, list(c.commonMistakes))
  ].filter(Boolean);
}
