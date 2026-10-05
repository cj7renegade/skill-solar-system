// The guided tour behind the "Tour" button: a short walk through moving the camera, where things
// are on screen, and how to use the app well. The steps are plain data (tested on their own); the
// tour card floats beside the part of the screen it describes and never blocks the map, so every
// step can be tried while it is open. Nothing here changes the map, the camera or any answer.

export const TOUR_STEPS = [
  { title: 'Welcome to your skill map', text: [
    'Each sphere is one skill. A line between two spheres records that one skill builds on the other.',
    'Height is a reference level built from those links: foundations sit low, skills that build on them sit higher. Height is never difficulty and never a measure of what you know.',
    'Use Next and Back to move through this tour. You can try every step while the tour is open.'] },
  { target: '#viewport', title: 'Rotate the view', place: 'center', text: [
    'Hold the left mouse button on an empty part of the map and drag. The map turns around its centre, or around the skill you last clicked.',
    'Try it now: drag a little left and right.'] },
  { target: '#viewport', title: 'Zoom and travel', place: 'center', text: [
    'Scroll the mouse wheel. Scrolling forward travels toward the spheres in front of you; scrolling back pulls away.',
    'Travel speed adapts to how close you are, so you can cross the whole map from far away and still stop precisely next to one skill.'] },
  { target: '#viewport', title: 'Pan sideways', place: 'center', text: [
    'Hold the right mouse button and drag to slide the view without turning it.',
    'Or hold an arrow key, or W, A, S, D. Holding a key keeps moving at a steady pace across the map.'] },
  { target: '#viewport', title: 'Pick a skill', place: 'center', text: [
    'Click a sphere to select it. The camera turns toward it and orbits around it from then on, and its connections light up.',
    'Double-click a sphere to open its full card.',
    'Right-click anywhere on the map to deselect and stay where you are. Press Escape to deselect and see the whole map again.'] },
  { target: '.view-tools', title: 'Map tools', text: [
    'Find skill: type part of a name, then choose a result. The camera travels to it.',
    'Fit map shows everything at once. Front view looks at the map straight on.',
    'Labels, Selected connections only and Sphere spacing change only what you see. They never move or edit anything.'] },
  { target: '#legend', title: 'Colours and subjects', text: [
    'Sphere colour shows the subject: Mathematics, Physics, Mechanics, Electronics, Computing or Robotics.',
    'Click a subject in this legend to highlight where it sits. Turn on Proficiency in the map tools to colour the map by your own answers instead.'] },
  { target: '#console', title: 'The console', text: [
    'The list shows every skill by name. Type in its search box to narrow it, and click a name to travel there.',
    'Below it, the subject card describes the selected skill. Read subject details opens the full card, with lessons where the map has them.'] },
  { target: '#inspector', title: 'Your own answers', text: [
    'On a skill\'s card, "At least 80% proficient?" asks for your judgment only. Yes, No and Clear record it, and Undo reverses it.',
    'Opening cards, reading lessons or revealing practice answers never marks anything. Only you do.'] },
  { target: '#mark-proficiency', title: 'Guided review', text: [
    'Mark proficiency walks through the skills from the foundations upward, one at a time, so you can answer Yes or No quickly.',
    'You can skip, go back, pause, and resume later exactly where you stopped.'] },
  { target: '#map-picker', fallback: '#load', title: 'Opening and saving maps', text: [
    'Your maps opens any map in the project\'s Maps folder in one click. Open map can open a map file from anywhere.',
    'Save map writes a portable copy. The app also keeps a working draft, but that draft is a convenience, not a backup.'] },
  { target: '#tour-button', title: 'Using it well', text: [
    'A good session: open your map, find a skill or start a review, read its card, answer honestly, then Save map.',
    'Afterwards, close the app and double-click Backup-User-Data in the project folder. It keeps a verified copy of your maps and answers.',
    'Never open the old copies in Maps\\Archived maps: they hold outdated answers. This tour is always here behind the Tour button.'] }
];

const PAD = 8, GAP = 14;

export function createTour({ button, onOpen = () => {}, onClose = () => {} }) {
  let index = 0, open = false;
  const ring = document.createElement('div'); ring.className = 'tour-ring'; ring.hidden = true;
  const card = document.createElement('section'); card.className = 'tour-card'; card.hidden = true;
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'false'); card.setAttribute('aria-labelledby', 'tour-title');
  document.body.append(ring, card);

  const targetOf = step => [step.target, step.fallback].filter(Boolean).map(s => document.querySelector(s)).find(el => el && !el.hidden && el.getClientRects().length) || null;

  function place() {
    if (!open) return;
    const step = TOUR_STEPS[index], target = targetOf(step), box = card.getBoundingClientRect();
    const W = innerWidth, H = innerHeight, clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    if (!target) { ring.hidden = true; card.style.left = `${(W - box.width) / 2}px`; card.style.top = `${(H - box.height) / 2}px`; return; }
    const r = target.getBoundingClientRect();
    ring.hidden = false;
    Object.assign(ring.style, { left: `${r.left - PAD}px`, top: `${r.top - PAD}px`, width: `${r.width + 2 * PAD}px`, height: `${r.height + 2 * PAD}px` });
    if (step.place === 'center') { // a large area: put the card inside it, near the top left
      card.style.left = `${clamp(r.left + 24, 8, W - box.width - 8)}px`; card.style.top = `${clamp(r.top + 110, 8, H - box.height - 8)}px`; return;
    }
    // Beside the target: below if there is room, else above, else to its left or right.
    let left = clamp(r.left, 8, W - box.width - 8), top;
    if (r.bottom + GAP + box.height < H) top = r.bottom + GAP;
    else if (r.top - GAP - box.height > 0) top = r.top - GAP - box.height;
    else { top = clamp(r.top, 8, H - box.height - 8); left = r.left - GAP - box.width > 8 ? r.left - GAP - box.width : clamp(r.right + GAP, 8, W - box.width - 8); }
    card.style.left = `${left}px`; card.style.top = `${top}px`;
  }

  function render() {
    const step = TOUR_STEPS[index], last = index === TOUR_STEPS.length - 1;
    const el = (tag, props = {}, ...children) => { const n = document.createElement(tag); Object.assign(n, props); n.append(...children); return n; };
    card.replaceChildren(
      el('p', { className: 'tour-count', textContent: `Tour · ${index + 1} of ${TOUR_STEPS.length}` }),
      el('h2', { id: 'tour-title', textContent: step.title, tabIndex: -1 }),
      ...step.text.map(t => el('p', { textContent: t })),
      el('div', { className: 'tour-buttons' },
        el('button', { id: 'tour-close', textContent: 'Close', onclick: close }),
        el('span', { className: 'tour-spacer' }),
        el('button', { id: 'tour-back', textContent: '← Back', disabled: index === 0, onclick: () => go(index - 1) }),
        el('button', { id: 'tour-next', className: 'primary', textContent: last ? 'Finish' : 'Next →', onclick: () => last ? close() : go(index + 1) })));
    place();
    card.querySelector('#tour-title').focus({ preventScroll: true });
  }

  function go(next) { index = Math.max(0, Math.min(TOUR_STEPS.length - 1, next)); render(); }
  function start(at = 0) { open = true; card.hidden = false; button.setAttribute('aria-expanded', 'true'); onOpen(); go(at); }
  function close() { if (!open) return; open = false; card.hidden = ring.hidden = true; button.setAttribute('aria-expanded', 'false'); onClose(); button.focus({ preventScroll: true }); }

  button.addEventListener('click', () => open ? close() : start());
  // Escape closes the tour first, before the map's own Escape (clear selection and fit).
  window.addEventListener('keydown', e => { if (open && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } }, true);
  window.addEventListener('resize', place);
  new ResizeObserver(place).observe(document.body);
  return { start, close, go, isOpen: () => open, step: () => index };
}
