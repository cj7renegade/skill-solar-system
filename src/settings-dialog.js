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
    // A choice of a few options as on-screen buttons (a radio group), not a native dropdown: its popup
    // list is drawn outside the page and did not take mouse clicks inside this dialog. Arrow keys move
    // between the options, as in any radio group.
    const select = (id, label, options, value, onchange) => {
      const group = el('div', { id, class: 'settings-choice', role: 'radiogroup', ariaLabel: label });
      options.forEach(([k, text], i) => {
        const b = el('button', { id: `${id}-${k}`, type: 'button', text, class: k === value ? 'chosen' : '', role: 'radio', tabIndex: k === value ? 0 : -1, onclick: () => { if (k !== value) onchange(k); } });
        b.setAttribute('aria-checked', String(k === value));
        b.addEventListener('keydown', e => {
          const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
          if (!step) return;
          e.preventDefault();
          const next = options[(i + step + options.length) % options.length][0];
          onchange(next); body.querySelector(`#${id}-${next}`)?.focus();
        });
        group.append(b);
      });
      return el('div', { class: 'row' }, el('span', { class: 'settings-label', text: label }), group);
    };
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
