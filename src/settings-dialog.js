// File ▸ Settings…: Appearance (theme, atmosphere effects, reduced motion, glow) and Developer (the
// style guide). Appearance changes apply at once and are kept on this computer; they never touch a
// map, an answer or a lesson.
import { THEMES, GLOWS, readAppearance, saveAppearance, applyAppearance } from './theme/appearance.js';

export function createSettingsDialog({ dialog, body, el, storage, root = document.documentElement, onStyleGuide = () => {}, onChange = () => {} }) {
  let tab = 'appearance';
  function set(change) {
    const next = { ...readAppearance(storage), ...change };
    saveAppearance(storage, next); applyAppearance(root, next); onChange(next); render();
  }
  function render() {
    const a = readAppearance(storage);
    const tabButton = (key, label) => { const b = el('button', { id: `settings-tab-${key}`, text: label, role: 'tab', onclick: () => { tab = key; render(); } }); b.setAttribute('aria-selected', String(tab === key)); return b; };
    const select = (id, label, options, value, onchange) => el('label', { class: 'row' }, document.createTextNode(label),
      el('select', { id, ariaLabel: label, onchange: e => onchange(e.target.value) }, ...options.map(([k, text]) => el('option', { value: k, text, selected: k === value }))));
    const toggle = (id, label, checked, onchange, note) => el('label', { class: 'row', title: note || '' }, el('input', { id, type: 'checkbox', checked, onchange: e => onchange(e.target.checked) }), document.createTextNode(label));
    const appearance = el('section', { class: 'settings-section', id: 'settings-appearance', role: 'tabpanel' },
      select('settings-theme', 'Theme', THEMES, a.theme, theme => set({ theme })),
      toggle('settings-atmosphere', 'Atmosphere effects (faint scanlines; Cyberpunk HUD only)', a.atmosphere, atmosphere => set({ atmosphere })),
      toggle('settings-reduce-motion', 'Reduce motion', a.reduceMotion, reduceMotion => set({ reduceMotion }), 'Turns off panel reveals, scans and ring rotation. The system setting is followed too.'),
      select('settings-glow', 'Glow intensity', GLOWS, a.glow, glow => set({ glow })),
      toggle('settings-bloom', 'Bloom on bright 3D elements (quality; Cyberpunk HUD only)', a.bloom, bloom => set({ bloom }), 'Softly blooms the selection, the active milestone and frontier glow. Costs some speed on large maps.'),
      el('p', { class: 'edge-note', text: 'These change only how HelixSkill looks, never a map, an answer or a lesson. The component kit is shown in Developer ▸ Style guide.' }));
    const developer = el('section', { class: 'settings-section', id: 'settings-developer', role: 'tabpanel' },
      el('p', { text: 'The style guide shows every Cyberpunk HUD component in every state, with readouts taken from the open map.' }),
      el('button', { id: 'settings-styleguide', text: 'Open style guide', onclick: () => { dialog.close(); onStyleGuide(); } }));
    body.replaceChildren(el('div', { class: 'settings-tabs', role: 'tablist' }, tabButton('appearance', 'Appearance'), tabButton('developer', 'Developer')), tab === 'appearance' ? appearance : developer);
  }
  function open(at = 'appearance') { tab = at; render(); if (!dialog.open) dialog.showModal(); }
  return { open, render, close: () => dialog.open && dialog.close() };
}
