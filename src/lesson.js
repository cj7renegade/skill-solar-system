// Reads the authored learning content a node may carry and describes the card sections for it.
//
// This module decides *what* a card shows, not how it looks: it returns plain data so the same
// logic can be checked without a browser. It only reads fields; nothing here touches proficiency.
// A node with no authored lesson produces no sections at all, so maps without this content keep
// the card they always had.

export const hasLesson = node => !!node?.lesson;

const text = value => String(value ?? '').trim();
const block = (label, value) => text(value) ? { type: 'text', label, text: text(value) } : null;
const blocks = (...items) => items.filter(Boolean);

// How the introductory exercise on this card relates to the demonstration the entry actually
// requires. Introductory exercises, simulated results and physical evidence are different things,
// and the card says which one it is offering.
export function exerciseKind(node) {
  const mode = text(node?.lessonCard?.practiceMode);
  if (/physical or target-device/i.test(mode)) return 'Introductory exercise: paper or code preparation. The full demonstration also needs physical or target-device evidence.';
  if (/paper\/code\/design/i.test(mode)) return 'Introductory exercise on paper, in code or as a design. The full demonstration is done separately.';
  return 'Introductory exercise. The full demonstration is done separately.';
}

// The six assessment modes the reviewed specification uses, said in reader-facing words. An
// unrecognised mode is shown as written rather than dropped or guessed at.
const DEMONSTRATION_KIND = {
  'runnable code or trace': 'Software: code that runs, or a worked trace of it.',
  'calculation and explanation': 'Written work: a calculation with the reasoning shown.',
  'written calculation': 'Written work: a calculation with the reasoning shown.',
  'documented scenario': 'Written work: a documented scenario.',
  'circuit analysis or supervised measurement': 'Physical work: circuit analysis or a supervised measurement on real hardware.',
  'drawing, calculation or supervised fabrication': 'Physical work: a drawing or calculation, or supervised fabrication of a real part.'
};
export function demonstrationKind(node) {
  const mode = text(node?.lessonCard?.assessmentContract?.mode);
  if (!mode) return null;
  return DEMONSTRATION_KIND[mode] || `Assessed as: ${mode}.`;
}

export const SIMULATION_NOTE = 'A simulated or calculated result is supporting evidence, not a record of physical work.';

// One line naming what content this entry has, for the top of the card.
export function contentStatusLine(node) {
  const status = text(node?.contentStatus);
  if (!status) return null;
  const card = node.lessonCard;
  if (!card) return status.charAt(0).toUpperCase() + status.slice(1);
  const edition = text(card.edition).replace('shared-foundations-01', 'shared foundations, edition 01').replace('controlled-joint-02', 'controlled joint, edition 02');
  return `Introductory lesson authored · ${edition}${text(card.authored) ? ` · ${card.authored}` : ''}`;
}

// The expandable sections, in reading order. A section whose blocks are all empty is left out, so
// an entry that supplies no references simply has no references section.
export function lessonSections(node) {
  if (!hasLesson(node)) return [];
  const lesson = node.lesson, card = node.lessonCard || {}, contract = card.assessmentContract || {};
  const sections = [];

  sections.push({
    key: 'explanation', title: 'Explanation and worked example',
    blocks: blocks(block('Explanation', lesson.explanation), block('Worked example', lesson.worked_example))
  });

  sections.push({
    key: 'why', title: 'Why this matters and what it builds on',
    // The prerequisites themselves come from the map's own edges, not from this text, so the card
    // never disagrees with the graph. The renderer appends them to this section.
    blocks: blocks(block(null, lesson.why_it_matters)),
    prerequisites: true
  });

  if (text(lesson.practice?.question)) sections.push({
    key: 'practice', title: 'Practice question',
    blocks: blocks(
      { type: 'note', text: exerciseKind(node) },
      { type: 'reveal', question: text(lesson.practice.question), answer: text(lesson.practice.answer), reveal: 'Show answer', hide: 'Hide answer' }
    )
  });

  if (text(lesson.boundary_case?.question)) sections.push({
    key: 'boundary', title: 'Boundary or misconception check',
    blocks: blocks(
      { type: 'reveal', question: text(lesson.boundary_case.question), answer: text(lesson.boundary_case.answer), reveal: 'Show answer', hide: 'Hide answer' }
    )
  });

  // The specification records the assessment task with the same wording as the demonstration, so it
  // is shown once. Everything else in the contract is rendered as labelled text, never as JSON.
  const demonstration = text(card.demonstration), kind = demonstrationKind(node);
  const task = text(contract.task) === demonstration ? null : contract.task;
  const evidence = Array.isArray(contract.evidence_record) ? contract.evidence_record.map(text).filter(Boolean) : [];
  const policies = [text(contract.answer_policy), text(lesson.evidence_policy)].filter(Boolean);
  const demonstrationBlocks = blocks(
    block('What must be demonstrated', demonstration),
    kind ? { type: 'note', text: `${kind} ${SIMULATION_NOTE}` } : null,
    block('Assessment task', task),
    block('Cases required', contract.case_requirements),
    block('Acceptance', contract.acceptance),
    evidence.length ? { type: 'list', label: 'Evidence to record', items: evidence } : null,
    block('Tolerances', contract.tolerance_policy),
    block('Scope limit', card.scopeBoundary),
    block('Assessment status', contract.status),
    block('How to use this card', lesson.assessment_rule),
    policies.length ? { type: 'list', label: 'Proficiency policy', items: [...new Set(policies)] } : null
  );
  if (demonstrationBlocks.length) sections.push({ key: 'demonstration', title: 'Full demonstration and evidence', blocks: demonstrationBlocks });

  const references = (Array.isArray(lesson.references) ? lesson.references : []).filter(r => text(r?.url));
  const closing = blocks(
    references.length ? { type: 'links', label: 'References', items: references.map(r => ({ url: text(r.url), use: text(r.use) })) } : null,
    block('Still to come', lesson.required_future_work)
  );
  if (closing.length) sections.push({ key: 'references', title: 'References and remaining learning work', blocks: closing });

  return sections;
}
