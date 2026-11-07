// The one skill card, used for every node of every map: in the console and in the full card dialog.
// Skills with a reviewed archive lesson, with an AI lesson and with no lesson render the identical
// layout; the only differences are the lesson badge and the state of the lesson button. Milestones
// and checkpoints use the same card with a demonstration checklist in place of the lesson button.
// No lesson body is ever shown on a card: lessons open in the lesson viewer.
// The card only reads the map, the learner state and the lesson index; every action goes back
// through the app, and nothing here writes an answer.
import { isProficient, effortHours, formatHours } from './learner.js';
import { tierOf, isHelixMap } from './helix.js';
import { proficiencyLabel } from './model.js';

// QUANT or QUAL: the map's own type where it has one, otherwise from how the skill is assessed.
const QUANT_MODES = /written calculation|calculation and explanation/i;
export const skillType = node => node.helixType ?? (QUANT_MODES.test(node.assessmentMode || '') ? 'QUANT' : node.assessmentMode ? 'QUAL' : null);
export const isDemonstrationNode = node => node.nodeKind === 'milestone' || node.nodeKind === 'checkpoint';

// The facts on the card face, as plain data (tested without a browser).
export function cardFacts(graph, node, { index, frontier }) {
  const stages = graph.metadata?.humanoidHelixImport?.buildStages || {};
  const parents = index.parents.get(node.id) || [], children = index.children.get(node.id) || [];
  const brief = id => { const n = index.byId.get(id); return { id, name: n.name, answer: n.proficiency80 === true ? 'yes' : n.proficiency80 === false ? 'no' : 'unset' }; };
  return {
    name: node.name, description: node.description || '',
    course: node.courseCode ? { code: node.courseCode, name: node.course ?? null } : { code: null, name: node.domain },
    subject: node.subdomain ?? null,
    helixLevel: isHelixMap(graph) && node.helixLevel != null ? { level: node.helixLevel, top: graph.layout.topLevel } : null,
    referenceLevel: !isHelixMap(graph) && node.skillLevel != null ? node.skillLevel : null,
    stage: node.buildStage != null ? { stage: node.buildStage, name: stages[node.buildStage] ?? null } : null,
    tier: tierOf(graph, node), type: skillType(node), hours: formatHours(effortHours(graph, node)),
    proficient: isProficient(node), ready: frontier.has(node.id), answer: proficiencyLabel(node.proficiency80),
    prerequisites: parents.map(brief), unlocks: children.map(brief), demonstration: isDemonstrationNode(node)
  };
}

// The demonstration checklist of a milestone or checkpoint: its prerequisites, each with the
// learner's own answer. It shows what is done; it never marks anything.
export function demonstrationChecklist(facts) {
  const items = facts.prerequisites.map(p => ({ ...p, done: p.answer === 'yes' }));
  return { items, done: items.filter(i => i.done).length, total: items.length };
}

// The lesson button: Generate when there is no lesson, Open when there is one. `generation` says
// whether generating is possible now ({ ok, reason }).
export function lessonAction(state, generation) {
  if (state.has) return { primary: 'open', label: 'Open lesson', regenerate: generation.ok, regenerateReason: generation.reason, update: state.outdated };
  return { primary: 'generate', label: 'Generate lesson (~30 min)', disabled: !generation.ok, reason: generation.reason };
}

// el: the app's element helper. palette: course colours. colors: { yes, no, unset, ready }.
// actions: { select(id), path(id), fly(id), openLesson(), generate(), regenerate() }. extra: elements
// appended at the end (the proficiency controls, and in the dialog the full details).
export function renderSkillCard(graph, node, { learner, lessonState, generation, palette, colors, el, actions, extra = [], showName = false }) {
  const facts = cardFacts(graph, node, learner);
  const card = el('section', { class: 'skill-card' });
  card.dataset.id = node.id; card.dataset.lesson = lessonState.kind;
  if (showName) card.append(el('h3', { class: 'skill-card-name', text: facts.name }));

  const chips = el('div', { class: 'skill-chips' });
  const chip = (text, title, color) => { const c = el('span', { class: 'chip', text, title }); if (color) c.style.setProperty('--chip', color); chips.append(c); };
  chip(facts.course.code ? `${facts.course.code}${facts.course.name ? ` · ${facts.course.name}` : ''}` : facts.course.name, 'Course', palette?.[facts.course.code]);
  if (facts.subject) chip(facts.subject, 'Subject');
  if (facts.helixLevel) chip(`Helix level ${facts.helixLevel.level}/${facts.helixLevel.top}`, 'Height on the helix: 1 + 3 × the longest prerequisite chain below this skill');
  else if (facts.referenceLevel != null) chip(`Level ${facts.referenceLevel}/100`, 'Reference level');
  if (facts.stage) chip(`Stage ${facts.stage.stage}${facts.stage.name ? ` · ${facts.stage.name}` : ''}`, 'Build stage');
  if (facts.tier) chip(facts.tier, 'Level of the skill on the path');
  if (facts.type) chip(facts.type, facts.type === 'QUANT' ? 'Quantitative: worked with numbers and units' : 'Qualitative: worked with reasoning, design or description');
  chip(facts.hours, 'Rough study effort: an estimate from the tier, doubled for hands-on practice');
  if (facts.proficient) chip('✓ Proficient', 'Your own answer', colors.yes); else if (facts.ready) chip('Ready to study', 'Every prerequisite is marked proficient', colors.ready);
  card.append(chips, el('p', { class: 'skill-card-description', text: facts.description || 'No description yet.' }));

  // The lesson: a badge, then the button (or, on milestones and checkpoints, the checklist).
  const badge = el('span', { class: `lesson-badge lesson-${lessonState.kind}`, text: lessonState.label, title: lessonState.kind === 'unreviewed' ? 'Written by AI and not yet checked. Check it before relying on it.' : '' });
  badge.id = 'lesson-badge';
  if (facts.demonstration) {
    const list = demonstrationChecklist(facts);
    card.append(el('div', { class: 'lesson-row' }, el('span', { class: 'lesson-badge lesson-demo', text: `Demonstration · ${list.done}/${list.total} prerequisites marked Yes` })),
      el('ul', { class: 'demo-checklist', id: 'demo-checklist' }, ...list.items.map(i => el('li', { class: i.done ? 'done' : '' },
        el('span', { class: 'demo-mark', text: i.done ? '✓' : i.answer === 'no' ? '✗' : '○', ariaLabel: i.done ? 'Marked Yes' : i.answer === 'no' ? 'Marked No' : 'Not marked' }),
        el('button', { class: 'skill-link', text: i.name, onclick: () => actions.select(i.id) })))),
      el('p', { class: 'edge-note', text: 'The demonstration itself is real work, recorded by you. A lesson or practice never satisfies it.' }));
  } else {
    const action = lessonAction(lessonState, generation);
    const primary = el('button', { id: 'lesson-primary', class: 'primary', text: action.label, disabled: !!action.disabled, title: action.reason || '', onclick: action.primary === 'open' ? actions.openLesson : actions.generate });
    const row = el('div', { class: 'lesson-row' }, badge, primary);
    if (action.primary === 'open' && action.regenerate !== undefined) row.append(el('button', { id: 'lesson-regenerate', class: 'link-button', text: action.update ? 'Update available' : 'Regenerate', disabled: !action.regenerate, title: action.regenerate ? 'Write a new AI lesson. Replaces the current AI lesson; reviewed lessons are kept.' : action.regenerateReason || '', onclick: actions.regenerate }));
    card.append(row);
    if (action.disabled && action.reason) card.append(el('p', { class: 'edge-note', id: 'lesson-unavailable', text: action.reason }));
  }

  card.append(el('div', { class: 'button-row skill-actions' },
    el('button', { id: 'path-to-selected', text: 'Path to this', title: `Light up everything left to learn before ${node.name}`, onclick: () => actions.path(node.id) }),
    el('button', { id: 'fly-to-selected', text: 'Fly to', title: `Fly the camera to ${node.name}`, onclick: () => actions.fly(node.id) }),
    actions.openDetails ? el('button', { id: 'open-details', text: 'Full card', title: 'Open the full card: longer description, where it sits, and every link', onclick: actions.openDetails }) : null));

  // Prerequisites and Unlocks, each clickable, with the learner's own answer as the dot colour.
  const links = (title, list, id, empty) => el('div', { class: 'skill-links', id },
    el('h4', { class: 'mini-title', text: `${title} (${list.length})` }),
    list.length ? el('ul', {}, ...list.map(p => { const dot = el('span', { class: 'dot', title: p.answer === 'yes' ? 'Marked Yes' : p.answer === 'no' ? 'Marked No' : 'Not marked' }); dot.style.background = colors[p.answer];
      return el('li', {}, dot, el('button', { class: 'skill-link', text: p.name, onclick: () => actions.select(p.id) })); })) : el('p', { class: 'edge-note', text: empty }));
  if (!facts.demonstration) card.append(links('Prerequisites', facts.prerequisites, 'card-prerequisites', 'None recorded: a starting point.'));
  card.append(links('Unlocks', facts.unlocks, 'card-unlocks', 'Nothing further on this map.'));
  for (const e of extra) if (e) card.append(e);
  return card;
}
