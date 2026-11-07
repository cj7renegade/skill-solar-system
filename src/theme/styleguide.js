// The style guide (Settings ▸ Developer ▸ Style guide): every Cyberpunk HUD component in every state,
// for review before the kit is applied to the app. Readouts use the open map's real data (its name,
// counts, a real skill's code, level and stage, real progress); where the map has no such data, the
// guide says so instead of inventing a value.
import { COLORS, GEOMETRY, MOTION, FONTS, TYPE } from './tokens.js';
import { check } from '../../scripts/check-contrast.mjs';
import { HudPanel, HudButton, SegmentedProgress, ProgressRing, StatReadout, CourseChip, StatusBadge, BADGES, AlertBlock, Ornament, Tooltip, withTooltip, ModalFrame, Modal, TextField, Dropdown, Toggle, Slider, el } from './components.js';
import { skillCodes, levelReadout, stageReadout, countReadout, timeReadout } from './readouts.js';
import { COURSE_COLORS } from '../palette.js';
import { targetProgress, isProficient, milestones } from '../learner.js';

// What the guide shows, from the map: pure, so it is tested without a browser.
export function guideData(graph, learner) {
  const codes = skillCodes(graph), index = learner.index;
  const sample = (learner.next?.[0]?.node) ?? graph.nodes.find(n => learner.frontier.has(n.id)) ?? graph.nodes[0];
  const target = learner.target ? index.byId.get(learner.target) : null;
  const chain = milestones(graph), done = chain.filter(isProficient);
  const courses = new Map();
  for (const n of graph.nodes) { const c = n.courseCode; if (!c) continue; const r = courses.get(c) ?? { code: c, name: n.course ?? c, total: 0, yes: 0 }; r.total++; if (isProficient(n)) r.yes++; courses.set(c, r); }
  return {
    map: graph.title || 'Untitled map', skills: graph.nodes.length, links: graph.edges.length,
    sample: sample ? { id: sample.id, name: sample.name, code: codes.get(sample.id), level: levelReadout(sample), stage: stageReadout(sample), course: sample.courseCode ?? null, helixLevel: sample.helixLevel ?? null } : null,
    target: target ? { name: target.name, percent: learner.progress?.percent ?? targetProgress(graph, target.id, index).percent } : null,
    overall: learner.overall ? learner.overall.percent : null,
    completed: done.length ? { name: done[done.length - 1].name } : null, milestones: chain.length,
    courses: [...courses.values()].sort((a, b) => b.total - a.total).slice(0, 6).map(r => ({ ...r, percent: Math.round(100 * r.yes / r.total) }))
  };
}

const STATES = [['default', null], ['hover', 'hover'], ['pressed', 'pressed'], ['focus', 'focus']];

export function renderStyleGuide(host, { graph, learner, onClose }) {
  const d = guideData(graph, learner);
  const section = (title, serial, ...body) => HudPanel({ title, serial, body });
  const row = (...items) => el('div', { class: 'sg-row' }, items);
  const caption = text => el('p', { class: 'sg-caption', text });

  // Tokens: swatches with their real hex values and contrast on the panel.
  const contrast = new Map(check().map(r => [r.name, r]));
  const swatch = (name, hex, note) => el('div', { class: 'sg-swatch' }, el('span', { class: 'sg-chip', style: `background:${hex}` }), el('span', { class: 'sg-sw-name', text: name }), el('span', { class: 'sg-sw-hex', text: hex }), note ? el('span', { class: 'sg-sw-note', text: note }) : null);
  const ratio = n => contrast.get(n) ? `${contrast.get(n).ratio.toFixed(1)}:1 on panel` : '';
  const tokens = section('Tokens', `${Object.keys(COLORS).length} COLOURS`,
    el('div', { class: 'sg-swatches' },
      swatch('Background', COLORS.bg0), swatch('Panel 90 %', COLORS.panel), swatch('Hairline', COLORS.line, 'decoration only'),
      swatch('Text', COLORS.text, ratio('body text on panel')), swatch('Text 2', COLORS.text2, ratio('secondary text on panel')), swatch('Text 3', COLORS.text3, ratio('muted label on panel')),
      swatch('Cyan · chrome', COLORS.cyan, ratio('cyan label on panel')), swatch('Amber · action', COLORS.amber, ratio('amber text on panel')),
      swatch('Red · alert only', COLORS.red, ratio('red text on panel (alert)')), swatch('Gold · proficient', COLORS.gold, ratio('gold on panel (proficient)'))),
    el('div', { class: 'sg-type' },
      el('p', { class: 'sg-display', text: 'Display · Chakra Petch · uppercase' }),
      el('p', { class: 'sg-mono', text: `Mono · JetBrains Mono · ${d.sample?.code ?? 'no skill'} · ${d.sample?.level ?? ''}` }),
      el('p', { class: 'sg-body', text: `Body · Inter ${TYPE.lessonBody} px / ${TYPE.lineHeight}. Lesson text and every paragraph use this face, in sentence case, for long reading.` })),
    caption(`Chamfers ${GEOMETRY.cutS} / ${GEOMETRY.cutM} / ${GEOMETRY.cutL} px · lines ${GEOMETRY.hair} px, focus ${GEOMETRY.stroke} px · motion ${MOTION.fast}–${MOTION.slow} ms · spacing on a 4 / 8 px grid.`));

  const panels = section('HudPanel', 'DEFAULT · ACTIVE · ALERT',
    el('div', { class: 'sg-grid' },
      HudPanel({ title: d.map, serial: `${countReadout(d.skills)} SKILLS`, body: [caption(`${countReadout(d.links)} links. Default panel: hairline frame, brackets, one hatch strip.`)] }),
      HudPanel({ title: d.sample ? d.sample.name : 'No skill', serial: d.sample?.code, variant: 'active', body: [caption('Active: cyan frame and a soft glow (focus, selection).')] }),
      HudPanel({ title: 'Unsaved changes', serial: timeReadout(), variant: 'alert', body: [caption('Alert: red frame, for warnings and errors only.')] }),
      HudPanel({ title: 'Boot reveal', serial: `${MOTION.boot} MS`, boot: true, body: [caption('Opens with a short wipe; none with reduced motion.')] })));

  const buttonRow = (variant, label, extra = {}) => el('div', { class: 'sg-btnrow' }, el('span', { class: 'sg-label', text: variant }),
    ...STATES.map(([name, state]) => el('div', { class: 'sg-state' }, HudButton({ label, variant, state, ...extra }), el('span', { class: 'sg-state-name', text: name }))),
    el('div', { class: 'sg-state' }, HudButton({ label, variant, disabled: true, ...extra }), el('span', { class: 'sg-state-name', text: 'disabled' })));
  const buttons = section('HudButton', 'PRIMARY · SECONDARY · GHOST · DANGER',
    buttonRow('primary', 'Generate'), buttonRow('secondary', 'Path', { icon: 'arrow' }), buttonRow('ghost', 'Fly to'), buttonRow('danger', 'Delete'), buttonRow('danger', 'Discard', { fill: true }),
    caption('Focus shows a 2 px cyan ring outside the button. Disabled keeps readable text (6:1) without glow.'));

  const progress = section('SegmentedProgress', 'REAL PROGRESS',
    d.target ? SegmentedProgress({ label: 'Target', value: d.target.percent, tone: 'amber' }) : caption('This map has no target milestone.'),
    d.overall != null ? SegmentedProgress({ label: 'Overall', value: d.overall }) : caption('No overall milestone on this map.'),
    ...d.courses.slice(0, 2).map(c => SegmentedProgress({ label: c.code, value: c.percent, tone: 'gold', readout: `${c.yes}/${c.total}` })),
    SegmentedProgress({ label: 'Loading', scanning: true }),
    caption('Scanning is the indeterminate state, for example while a lesson is being written. With reduced motion it is a still hatch.'));

  const rings = section('ProgressRing', `${d.milestones} MILESTONES`,
    el('div', { class: 'sg-rings' },
      d.target ? ProgressRing({ label: `Active · ${d.target.name}`, value: d.target.percent, tone: 'amber', rotating: true }) : caption('No active milestone.'),
      d.completed ? ProgressRing({ label: `Complete · ${d.completed.name}`, value: 100, tone: 'gold' }) : el('div', { class: 'sg-note' }, caption('Completed milestones show in gold. None is complete on this map yet.')),
      ...d.courses.slice(0, 3).map(c => ProgressRing({ label: `${c.code} proficient`, value: c.percent, color: COURSE_COLORS[c.code] ?? null, size: 80 }))),
    caption('Tick ring: 60 ticks, every fifth long. The active ring turns slowly (off with reduced motion). Course rings use the course colour: data, not chrome.'));

  const stats = section('StatReadout', 'MONOSPACE VALUES',
    el('div', { class: 'sg-stats' },
      d.sample ? StatReadout({ label: 'Skill code', value: d.sample.code, title: 'Course, type (QNT/QL) and place in the course, lowest level first' }) : null,
      d.sample ? StatReadout({ label: 'Helix level', value: d.sample.helixLevel != null ? String(d.sample.helixLevel).padStart(3, '0') : '---', unit: d.sample.helixLevel != null ? `/${graph.layout?.topLevel ?? ''}` : null }) : null,
      d.sample ? StatReadout({ label: 'Stage', value: d.sample.stage }) : null,
      StatReadout({ label: 'Skills', value: countReadout(d.skills) }), StatReadout({ label: 'Links', value: countReadout(d.links) }),
      StatReadout({ label: 'Opened', value: timeReadout(), small: true })));

  const chipCourses = d.courses.length ? d.courses : [];
  const chips = section('Chips and badges', `${chipCourses.length} COURSES`,
    el('div', { class: 'sg-wrap' }, chipCourses.length ? chipCourses.map((c, i) => CourseChip({ code: c.code, name: c.name, color: COURSE_COLORS[c.code] ?? COLORS.cyan, selectable: true, selected: i === 0 })) : caption('This map has no courses.')),
    caption('Course chips are selectable buttons (the first is selected). The dot is the course colour.'),
    el('div', { class: 'sg-wrap' }, Object.keys(BADGES).map(StatusBadge)),
    caption('Every status has its own icon and words, so none relies on colour or glow alone.'));

  const alerts = section('Alert blocks', 'WARNING · SAFETY · ERROR',
    AlertBlock({ kind: 'warning', title: 'Replaces the map', body: [el('p', { text: 'Restore starter replaces the open map with the starter example. Undo reverses it.' })] }),
    AlertBlock({ kind: 'safety', title: 'Hands-on lessons', body: [el('p', { text: 'A lesson\'s safety section appears in this block: hazards, precautions and when to stop.' })] }),
    AlertBlock({ kind: 'error', title: 'Map not opened', body: [el('p', { text: 'Could not open map: Expected a version 1 HelixSkill map.' })] }),
    caption('Red frame and a hazard stripe on one edge. Red is used for these and for destructive actions only.'));

  const ornaments = section('Line ornaments', '4 ORIGINAL', el('div', { class: 'sg-ornaments' }, [1, 2, 3, 4].map(n => el('div', {}, Ornament(n), el('span', { class: 'sg-state-name', text: `ornament ${n}` })))),
    caption('For header and edge lines only. At most one per panel edge; never inside reading content.'));

  const modal = Modal({ title: 'Delete skill?', serial: d.sample?.code, variant: 'alert', body: el('div', { class: 'cp-prose' }, el('p', { text: `Delete ${d.sample?.name ?? 'this skill'} and its links? Undo is available.` })),
    actions: [HudButton({ label: 'Keep', variant: 'secondary', onclick: () => modal.close() }), HudButton({ label: 'Delete', variant: 'danger', fill: true, onclick: () => modal.close() })] });
  const overlays = section('Tooltip and modal', 'SAME FRAME LANGUAGE',
    el('div', { class: 'sg-wrap' }, Tooltip({ label: d.sample?.code, text: 'Rough study effort comes from the tier.' }),
      withTooltip(HudButton({ label: 'Hover or focus me', variant: 'ghost' }), { label: 'TOOLTIP', text: 'Shown on hover and on keyboard focus.' })),
    el('div', { class: 'sg-modal-preview' }, ModalFrame({ title: 'Delete skill?', serial: d.sample?.code, variant: 'alert', body: el('div', { class: 'cp-prose' }, el('p', { text: `Delete ${d.sample?.name ?? 'this skill'} and its links? Undo is available.` })),
      actions: [HudButton({ label: 'Keep', variant: 'secondary' }), HudButton({ label: 'Delete', variant: 'danger', fill: true })] })),
    HudButton({ label: 'Open the modal', variant: 'secondary', onclick: () => modal.showModal() }), modal);

  const inputs = section('Inputs', 'FIELD · DROPDOWN · TOGGLE · SLIDER',
    el('div', { class: 'sg-grid' },
      TextField({ label: 'Find skill', placeholder: 'Part of a name…' }), TextField({ label: 'Find skill (filled)', value: d.sample?.name ?? '' }), TextField({ label: 'Disabled', value: 'Not available', disabled: true }),
      Dropdown({ label: 'Theme', options: [['classic', 'Classic'], ['cyberpunk', 'Cyberpunk HUD']], value: 'cyberpunk' }), Dropdown({ label: 'Disabled', options: [['x', 'Glow: low']], value: 'x', disabled: true }),
      el('div', { class: 'cp-field' }, el('span', { text: 'Toggles' }), Toggle({ label: 'Atmosphere effects', checked: false }), Toggle({ label: 'Proficiency view', checked: true }), Toggle({ label: 'Disabled', checked: false, disabled: true })),
      Slider({ label: 'Sphere spacing', min: 0.5, max: 10, step: 0.05, value: 1, format: v => `${v.toFixed(2)}×` }), Slider({ label: 'Disabled', value: 40, unit: ' %', disabled: true })),
    caption('Toggles say ON/OFF in text. Fields and dropdowns glow cyan only while focused.'));

  const prose = section('Reading content', 'NO DECORATION',
    el('div', { class: 'cp-prose' }, el('h4', { text: 'Explanation' }),
      el('p', { text: 'Lesson text is set in the body face at 16 px with a line height of 1.55, on a calm panel. No hatch, ticks or glow appear inside it, so long study sessions stay comfortable.' }),
      el('p', { text: 'Headings inside a lesson use the display face in small caps; every paragraph stays in sentence case.' })));

  host.replaceChildren(
    el('header', { class: 'sg-head' }, el('div', {}, el('h2', { id: 'styleguide-title', class: 'cp-title sg-title', text: 'Style guide · Cyberpunk HUD' }),
      el('p', { class: 'sg-caption', text: `Component kit for review. Readouts come from the open map: ${d.map} · ${countReadout(d.skills)} skills · ${countReadout(d.links)} links.` })),
      HudButton({ label: 'Close', variant: 'secondary', onclick: onClose })),
    Ornament(2),
    el('div', { class: 'sg-columns' }, tokens, panels, buttons, progress, rings, stats, chips, alerts, ornaments, overlays, inputs, prose));
}
