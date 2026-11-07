// The guided tour behind the "Tour" button: a short walk through moving the camera, where things
// are on screen, and how to use the app well. The steps are plain data (tested on their own); the
// tour card floats beside the part of the screen it describes and never blocks the map, so every
// step can be tried while it is open. Nothing here changes the map, the camera or any answer.

export const TOUR_STEPS = [
  { title: 'Welcome to your skill map', text: [
    'Each sphere is one skill. A line between two spheres records that one skill builds on the other.',
    'Height is the longest chain of prerequisites below a skill: foundations sit low, skills that build on them sit higher. Height is never difficulty and never a measure of what you know.',
    'Use Next and Back to move through this tour; you can try every step while it is open. HelixSkill 0.4.0 works offline, and your answers stay on this computer.'] },
  { target: '#viewport', title: 'Rotate the view', place: 'center', text: [
    'Hold the left mouse button on an empty part of the map and drag. The map turns around its centre, or around the skill you last clicked.',
    'Try it now: drag a little left and right.'] },
  { target: '#viewport', title: 'Zoom and travel', place: 'center', text: [
    'Scroll the mouse wheel. Scrolling forward travels toward the spheres in front of you; scrolling back pulls away. Travel speed adapts, so you can cross the map and still stop next to one skill.',
    'From far away on a large map, each subject becomes one cluster with its name, and a gold core shows how much of it you have marked. Click a cluster to fly into it; zoom in and its skills appear.'] },
  { target: '#viewport', title: 'Pan sideways', place: 'center', text: [
    'Hold the right mouse button and drag to slide the view without turning it.',
    'Or hold an arrow key, or W, A, S, D. Holding a key keeps moving at a steady pace across the map.'] },
  { target: '#viewport', title: 'Pick a skill', place: 'center', text: [
    'Click a sphere to select it. The camera turns toward it and orbits around it from then on, and its links light up. Double-click a sphere to open its full card.',
    'Right-click anywhere on the map to deselect and stay where you are. Press Escape to deselect and see the whole map again.'] },
  { target: '#hud-card', title: 'Your progress card', text: [
    'The card at the top left shows the milestone you are working toward. Choose another in its menu; the progress bar counts the prerequisites you have marked proficient and the rough hours left.',
    'Next up lists skills you are ready to study: everything they rest on is already marked Yes. Click one to fly there. Ready skills also glow softly on the map.'] },
  { target: '#viewport', title: 'Reading the helix', place: 'center', text: [
    'On the humanoid helix, milestones I01 to I09 sit on the spine up the centre; the ones you have completed are filled in. Your target is marked on it.',
    'Faint rings mark where each stage begins, a ruler at the side gives the level, and each course band is labelled where it faces you. Skill labels are kept few and never overlap.'] },
  { target: '#legend', title: 'Colours and courses', text: [
    'Sphere colour shows the course (on the helix, in five colour families) or the domain on other maps. Each course shows how many skills it has and how many you have marked.',
    'Click a course or a family to isolate it; click again to show everything. Proficiency view under View colours the map by your answers: gold for Yes, grey for not yet, dark slate for No.'] },
  { target: '.view-tools', title: 'Map tools', text: [
    'Find skill: type part of a name, then choose a result; the camera travels to it. Fit map shows everything at once, and Front view looks at the map straight on.',
    'View holds the display settings: skill labels, selected links only, proficiency view, subject grouping and sphere spacing. They change only what you see, never the map.'] },
  { target: '#path-mode', title: 'Path mode and the 2D plan', text: [
    'Path mode lights up everything left to learn before your target and dims the rest. Its card says how many skills and hours remain and lists them in an order you can study them in.',
    'Open the 2D plan to see the same path flat: columns from foundations to the target, one row per course. Press Escape to close the plan, and again to leave path mode.'] },
  { target: '#console', title: 'The console', text: [
    'With nothing selected, Today lists what to study next, an unfinished review and what you answered lately.',
    'The list below shows every skill, ready ones first (or A to Z). Type in its search box to narrow it, and click a name to travel there.',
    'In Edit mode, Shift-drag a sphere to move it; the layout tools appear at the end of the console and each asks first.'] },
  { target: '#inspector', title: 'The skill card', text: [
    'A selected skill shows its course, level, stage, tier and rough hours. Path to this lights its own path, Fly to brings the camera to it, and Open lesson opens its lesson when there is one.',
    'The small graph lists what it needs and what it unlocks; click any of them to go there.'] },
  { target: '#inspector', title: 'Your own answers', text: [
    'On a skill\'s card, "At least 80% proficient?" asks for your judgment only. Yes, No and Clear record it, and Undo reverses it.',
    'Opening cards, reading lessons or revealing practice answers never marks anything. Only you do.'] },
  { target: '#mark-proficiency', title: 'Guided review', text: [
    'Mark proficiency walks through the skills from the foundations upward, one at a time, so you can answer Yes or No quickly.',
    'You can skip, go back, pause, and resume later exactly where you stopped. The progress card offers to resume an unfinished review.'] },
  { target: '#map-picker', fallback: '#file-menu', title: 'Opening and saving maps', text: [
    'Your maps opens any map in the project\'s Maps folder in one click. File ▸ Open map can open a map file from anywhere.',
    'Every change is kept on this computer at once: the indicator at the bottom right says Saved ✓. File ▸ Save map exports a portable copy, which is your backup.'] },
  { target: '#tour-button', title: 'Using it well', text: [
    'A good session: open your map, pick something from Next up or start a review, read its card, answer honestly, then File ▸ Save map.',
    'Afterwards, close the app and double-click Backup-User-Data in the project folder. It keeps a verified copy of your maps and answers.',
    'Never open the old copies in Maps\Archived maps: they hold outdated answers. This tour is always here behind the Tour button.'] }
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
