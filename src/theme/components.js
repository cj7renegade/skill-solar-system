// The Cyberpunk HUD component kit: small builders that return DOM nodes with the classes of
// src/theme/components.css. They are plain functions so the app (phase 3) and the style guide use the
// same parts. All drawing is original (CSS and small inline SVGs); nothing is traced from the
// reference images. Decoration stays on frame edges and headers, never inside reading content.

const SVG = 'http://www.w3.org/2000/svg';
function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v; else if (k === 'text') node.textContent = v; else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'style') node.style.cssText = v; else if (k in node && typeof v !== 'string') node[k] = v; else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c);
  return node;
}
function s(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) node.setAttribute(k, v);
  for (const c of children) if (c) node.append(c);
  return node;
}
const shape = () => h('span', { class: 'cp-shape', 'aria-hidden': 'true' });

// Small original icons, drawn in a 16 px box with 1.5 px strokes.
export const ICONS = {
  check: () => s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' }, s('path', { d: 'M3 8.5l3 3 7-7', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8' })),
  warning: () => s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' }, s('path', { d: 'M8 1.5l7 13H1z', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linejoin': 'miter' }), s('path', { d: 'M8 6v4M8 11.5v1.5', stroke: 'currentColor', 'stroke-width': '1.6' })),
  shield: () => s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' }, s('path', { d: 'M8 1.5l5.5 2v4.5c0 3.2-2.4 5.6-5.5 6.5C4.9 13.6 2.5 11.2 2.5 8V3.5z', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' }), s('path', { d: 'M8 5v4M8 10.5v1.4', stroke: 'currentColor', 'stroke-width': '1.6' })),
  error: () => s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' }, s('path', { d: 'M5 1.5h6L14.5 5v6L11 14.5H5L1.5 11V5z', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' }), s('path', { d: 'M5.5 5.5l5 5M10.5 5.5l-5 5', stroke: 'currentColor', 'stroke-width': '1.6' })),
  flag: () => s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' }, s('path', { d: 'M3.5 15V2M3.5 2.5h9l-2 3.5 2 3.5h-9', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' })),
  ring: () => s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' }, s('circle', { cx: 8, cy: 8, r: 5.5, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' })),
  diamond: () => s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' }, s('path', { d: 'M8 1.5L14.5 8 8 14.5 1.5 8z', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' })),
  up: () => s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' }, s('path', { d: 'M8 3l6 9H2z', fill: 'currentColor' })),
  arrow: () => s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true', class: 'cp-icon' }, s('path', { d: 'M3 8h9M9 4.5L12.5 8 9 11.5', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6' }))
};

// HudPanel: chamfered frame, corner brackets, a header bar with a display-face title and an optional
// serial at the right (real data only), and one hatch strip on the bottom edge.
export function HudPanel({ title, serial = null, variant = 'default', boot = false, hatch = true, body = [], id = null }) {
  return h('section', { id, class: `cp-frame cp-panel${variant === 'active' ? ' is-active' : variant === 'alert' ? ' is-alert' : ''}${boot ? ' cp-boot' : ''}`, 'aria-label': title },
    shape(), h('span', { class: 'cp-brackets', 'aria-hidden': 'true' }), hatch ? h('span', { class: 'cp-hatch', 'aria-hidden': 'true' }) : null,
    h('header', { class: 'cp-panel-head' }, h('span', { class: 'cp-head-mark', 'aria-hidden': 'true' }), h('h3', { class: 'cp-title', text: title }), serial ? h('span', { class: 'cp-serial', text: serial }) : null),
    h('div', { class: 'cp-panel-body' }, body));
}

// HudButton: primary (amber fill), secondary (cyan outline), ghost (corner brackets) and danger (red).
// state: 'hover' | 'pressed' | 'focus' forces the look for the style guide; disabled is real.
export function HudButton({ label, variant = 'secondary', icon = null, disabled = false, state = null, fill = false, onclick = null, title = null }) {
  return h('button', { type: 'button', class: `cp-frame cp-btn ${variant}${fill ? ' fill' : ''}${state ? ` is-${state}` : ''}`, disabled, onclick, title },
    shape(), icon ? ICONS[icon]() : null, h('span', { text: label }));
}

// SegmentedProgress: a segmented bar with a percentage readout, or an indeterminate scan.
export function SegmentedProgress({ label, value = 0, segments = 20, tone = 'cyan', scanning = false, readout = null }) {
  const pct = Math.max(0, Math.min(100, value)), on = Math.round(pct / 100 * segments);
  return h('div', { class: `cp-seg${tone !== 'cyan' ? ` ${tone}` : ''}${scanning ? ' is-scanning' : ''}`, role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', ...(scanning ? { 'aria-busy': 'true' } : { 'aria-valuenow': String(Math.round(pct)) }) },
    h('span', { class: 'cp-seg-label', text: label }),
    h('span', { class: 'cp-seg-track' }, Array.from({ length: segments }, (_, i) => h('i', { class: !scanning && i < on ? 'on' : '' }))),
    h('span', { class: 'cp-seg-value', text: scanning ? '···' : readout ?? `${Math.round(pct)}%` }));
}

// ProgressRing: a gauge with 60 tick marks (every fifth long), a track, a value arc and the value inside.
export function ProgressRing({ label, value = 0, size = 92, tone = 'cyan', unit = '%', rotating = false, color = null, center = null }) {
  const r = size / 2, arcR = r - 14, circ = 2 * Math.PI * arcR, pct = Math.max(0, Math.min(100, value));
  const ticks = s('g', { class: 'ticks' });
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * 2 * Math.PI - Math.PI / 2, major = i % 5 === 0, r1 = r - (major ? 7 : 4);
    ticks.append(s('line', { class: major ? 'major' : null, x1: r + Math.cos(a) * r1, y1: r + Math.sin(a) * r1, x2: r + Math.cos(a) * (r - 1), y2: r + Math.sin(a) * (r - 1) }));
  }
  const svg = s('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, role: 'img', 'aria-label': `${label}: ${Math.round(pct)}${unit}` },
    ticks, s('circle', { class: 'track', cx: r, cy: r, r: arcR, 'stroke-width': 4 }),
    s('circle', { class: 'arc', cx: r, cy: r, r: arcR, 'stroke-width': 4, 'stroke-dasharray': circ, 'stroke-dashoffset': circ * (1 - pct / 100), transform: `rotate(-90 ${r} ${r})`, style: color ? `stroke:${color}` : null }),
    s('text', { class: 'value', x: r, y: r - 3 }, document.createTextNode(center ?? String(Math.round(pct)))), s('text', { class: 'unit', x: r, y: r + 12 }, document.createTextNode(unit)));
  return h('figure', { class: `cp-ring${tone !== 'cyan' ? ` ${tone}` : ''}${rotating ? ' is-rotating' : ''}`, style: 'margin:0' }, svg, h('figcaption', { class: 'cp-ring-label', text: label }));
}

// StatReadout: a small-caps label over a monospace value with an optional unit.
export function StatReadout({ label, value, unit = null, small = false, title = null }) {
  return h('div', { class: `cp-stat${small ? ' small' : ''}`, title }, h('span', { class: 'cp-stat-label', text: label }), h('span', { class: 'cp-stat-value' }, String(value), unit ? h('small', { text: unit }) : null));
}

// Course chip: course colour dot + code. Selectable chips are buttons with aria-pressed.
export function CourseChip({ code, name = null, color, selectable = false, selected = false, onclick = null }) {
  const props = { class: `cp-frame cp-chip${selectable ? ' selectable' : ''}${selected ? ' is-selected' : ''}`, title: name || code, style: `--dot:${color}`, onclick };
  return selectable ? h('button', { type: 'button', ...props, 'aria-pressed': String(selected) }, shape(), h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { text: code }))
    : h('span', props, shape(), h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { text: code }));
}
// Status badges: every state has its own icon and words, so none relies on colour.
export const BADGES = {
  reviewed: { label: 'Reviewed', icon: 'check' }, unreviewed: { label: 'AI-generated · unreviewed', icon: 'diamond' }, flagged: { label: 'Flagged', icon: 'flag' },
  none: { label: 'No lesson yet', icon: 'ring' }, frontier: { label: 'Frontier', icon: 'up' }, proficient: { label: 'Proficient', icon: 'check' }
};
export function StatusBadge(kind) { const b = BADGES[kind]; return h('span', { class: `cp-frame cp-badge ${kind}` }, shape(), ICONS[b.icon](), h('span', { text: b.label })); }

// Alert blocks: WARNING, SAFETY and ERROR. Red is reserved for these and destructive actions.
const ALERT_ICON = { warning: 'warning', safety: 'shield', error: 'error' };
export function AlertBlock({ kind = 'warning', title, body }) {
  return h('div', { class: 'cp-frame cp-alert', role: kind === 'error' ? 'alert' : 'note' }, shape(),
    h('span', { class: 'cp-alert-icon' }, ICONS[ALERT_ICON[kind]]()), h('span', { class: 'cp-alert-title', text: `${kind.toUpperCase()}${title ? ` · ${title}` : ''}` }),
    h('div', { class: 'cp-alert-body' }, body));
}

// Four original line ornaments for headers and edges.
export function Ornament(n = 1) {
  const g = s('svg', { class: 'cp-ornament', viewBox: '0 0 240 12', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  const line = (x1, x2, y = 6, cls = null, w = 1) => g.append(s('line', { x1, x2, y1: y, y2: y, stroke: 'currentColor', 'stroke-width': w, class: cls }));
  if (n === 1) { line(0, 240); for (let i = 0; i < 5; i++) g.append(s('rect', { x: 4 + i * 6, y: 3, width: 2, height: 6, fill: 'currentColor', class: 'hi' })); }
  else if (n === 2) { g.append(s('path', { d: 'M0 9H150L156 3H240', fill: 'none', stroke: 'currentColor' })); line(160, 200, 3, 'hi', 2); }
  else if (n === 3) { line(40, 240); for (let i = 0; i < 6; i++) g.append(s('circle', { cx: 4 + i * 6, cy: 6, r: 1.4, fill: 'currentColor', class: i < 2 ? 'hi' : null })); }
  else { line(10, 230); g.append(s('path', { d: 'M10 1V11M230 1V11', stroke: 'currentColor' })); line(10, 34, 6, 'hi', 2); }
  return g;
}

// Tooltip: a framed hint on hover and keyboard focus. Modal: the same frame language in a <dialog>.
export function withTooltip(target, { label = null, text }) {
  return h('span', { class: 'cp-tip-host' }, target, h('span', { class: 'cp-frame cp-tooltip', role: 'tooltip' }, shape(), label ? h('span', { class: 'cp-tip-label', text: label }) : null, text));
}
export function Tooltip({ label = null, text }) { return h('span', { class: 'cp-frame cp-tooltip is-static' }, shape(), label ? h('span', { class: 'cp-tip-label', text: label }) : null, text); }
export function ModalFrame({ title, serial = null, body, actions = [], variant = 'default' }) {
  const panel = HudPanel({ title, serial, variant, body: [body] });
  panel.classList.add('cp-modal-frame');
  panel.append(h('div', { class: 'cp-modal-actions' }, actions));
  return panel;
}
export function Modal({ title, serial, body, actions, variant }) { return h('dialog', { class: 'cp-modal', 'aria-label': title }, ModalFrame({ title, serial, body, actions, variant })); }

// Inputs: text field, dropdown, toggle and slider.
export function TextField({ label, value = '', placeholder = '', disabled = false, id = null }) {
  return h('label', { class: 'cp-field' }, h('span', { text: label }), h('span', { class: `cp-frame cp-input-wrap${disabled ? ' is-disabled' : ''}` }, shape(), h('input', { class: 'cp-input', id, value, placeholder, disabled })));
}
export function Dropdown({ label, options, value, disabled = false, id = null }) {
  return h('label', { class: 'cp-field' }, h('span', { text: label }), h('span', { class: `cp-frame cp-input-wrap cp-select-wrap${disabled ? ' is-disabled' : ''}` }, shape(),
    h('select', { class: 'cp-select', id, disabled }, options.map(([v, t]) => h('option', { value: v, text: t, selected: v === value })))));
}
export function Toggle({ label, checked = false, disabled = false, id = null }) {
  const input = h('input', { type: 'checkbox', id, checked, disabled }), state = h('span', { class: 'state', text: checked ? 'ON' : 'OFF' });
  input.addEventListener('change', () => { state.textContent = input.checked ? 'ON' : 'OFF'; });
  return h('label', { class: 'cp-toggle' }, input, h('span', { class: 'track', 'aria-hidden': 'true' }, h('span', { class: 'knob' })), state, h('span', { text: label }));
}
export function Slider({ label, min = 0, max = 100, step = 1, value = 50, unit = '', disabled = false, format = v => `${v}${unit}`, id = null }) {
  const out = h('output', { text: format(value) });
  const input = h('input', { type: 'range', id, min, max, step, value, disabled, 'aria-label': label });
  const sync = () => { out.textContent = format(Number(input.value)); input.style.setProperty('--fill-pct', `${(input.value - min) / (max - min) * 100}%`); };
  input.addEventListener('input', sync); sync();
  return h('label', { class: 'cp-field' }, h('span', { text: label }), h('span', { class: 'cp-slider' }, input, out));
}

export { h as el };
