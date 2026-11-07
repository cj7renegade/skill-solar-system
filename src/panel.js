// The data console's learner views: the Today view (nothing selected), the skill list order, and the
// mini graph on a selected skill's card. They read the map, the learner state and the shared record's
// timestamps; every action goes back through the app, and nothing here writes an answer.
import { isProficient, levelOf, formatHours } from './learner.js';
import { proficiencyLabel } from './model.js';

// When each skill was last answered (Yes, No or cleared), from the shared record, newest first.
export function recentAnswers(record, graph, limit = Infinity) {
  const present = new Set(graph.nodes.map(n => n.id));
  return Object.entries(record?.entries || {}).filter(([id, e]) => present.has(id) && e?.updatedAt)
    .sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt)).slice(0, limit).map(([id, e]) => ({ id, at: e.updatedAt }));
}

// The skill list's suggested order: ready to study first, then recently answered, then lowest level,
// then name. 'az' keeps the alphabetical order.
export function listOrder(nodes, { frontier, recent, mode = 'suggested' }) {
  const az = (a, b) => a.name.localeCompare(b.name);
  if (mode === 'az') return [...nodes].sort(az);
  const rank = new Map(recent.map((r, i) => [r.id, i]));
  return [...nodes].sort((a, b) => (frontier.has(b.id) - frontier.has(a.id))
    || (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) || levelOf(a) - levelOf(b) || az(a, b));
}

// Today: ready skills on the way to the target, an unfinished review, and what was answered lately.
export function renderToday(host, { graph, state, record, reviewCount, el, palette, actions }) {
  host.replaceChildren();
  host.append(el('h2', { class: 'today-title', text: 'Today' }));
  if (reviewCount > 0) host.append(el('button', { id: 'today-review', class: 'hud-review', text: `Resume your review · ${reviewCount.toLocaleString('en')} left`, onclick: actions.openReview }));
  const byId = state.index.byId, target = state.target && byId.get(state.target);
  // Without a milestone to aim at, the ready skills of the whole map, lowest first.
  const next = target ? state.next : [...state.frontier].map(id => byId.get(id)).sort((a, b) => levelOf(a) - levelOf(b)).slice(0, 20).map(node => ({ node, hours: null }));
  host.append(el('h4', { class: 'today-heading', text: target ? `Next up toward ${target.name}` : 'Ready to study' }));
  if (!next.length) host.append(el('p', { class: 'edge-note', text: target ? 'Nothing is ready on this path: mark the skills it rests on first.' : 'Nothing is ready yet.' }));
  const list = el('ol', { class: 'today-list', id: 'today-next' });
  for (const { node, hours } of next) {
    const chip = node.courseCode ? el('span', { class: 'chip', text: node.courseCode }) : null;
    if (chip && palette?.[node.courseCode]) chip.style.setProperty('--chip', palette[node.courseCode]);
    list.append(el('li', {}, el('button', { class: 'today-item', onclick: () => actions.select(node.id) }, el('span', { class: 'hud-next-name', text: node.name }), chip, hours != null ? el('span', { class: 'hud-hours', text: formatHours(hours) }) : null)));
  }
  if (next.length) host.append(list);
  const recent = recentAnswers(record, graph, 8);
  host.append(el('h4', { class: 'today-heading', text: 'Recently studied' }));
  if (!recent.length) host.append(el('p', { class: 'edge-note', text: 'Skills you mark Yes or No appear here.' }));
  const done = el('ul', { class: 'today-list', id: 'today-recent' });
  for (const { id, at } of recent) {
    const node = byId.get(id), when = new Date(at);
    done.append(el('li', {}, el('button', { class: 'today-item', onclick: () => actions.select(id) }, el('span', { class: 'hud-next-name', text: node.name }),
      el('span', { class: 'hud-hours', text: `${proficiencyLabel(node.proficiency80)} · ${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` }))));
  }
  if (recent.length) host.append(done);
}

// The mini graph: two steps of prerequisites above the skill and what it unlocks below, as an
// indented tree with its links drawn in a gutter. Gold = proficient, grey = not, a pale ring = ready.
const SVGNS = 'http://www.w3.org/2000/svg', svg = (tag, attrs = {}) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
export function miniGraph(node, { index, frontier, onSelect, limit = 6 }) {
  const take = ids => [...new Set(ids)].slice(0, limit);
  const parents = take(index.parents.get(node.id)), grand = take(parents.flatMap(p => index.parents.get(p))).filter(id => !parents.includes(id));
  const children = take(index.children.get(node.id));
  const rows = [...grand.map(id => ({ id, level: 0 })), ...parents.map(id => ({ id, level: 1 })), { id: node.id, level: 2 }, ...children.map(id => ({ id, level: 3 }))];
  const ROW = 20, width = 300, root = svg('svg', { width, height: rows.length * ROW + 8, class: 'mini-graph', role: 'img', 'aria-label': `${node.name}: ${parents.length} direct prerequisites, ${children.length} skills it unlocks` });
  const y = new Map(rows.map((r, i) => [r.id, i * ROW + 12])), x = level => 10 + level * 14;
  const at = new Map(rows.map(r => [r.id, r]));
  // Links: grandparent -> parent -> skill -> unlock, where the map has that prerequisite.
  let d = '';
  for (const r of rows) for (const c of index.children.get(r.id)) {
    const t = at.get(c); if (!t || t.level !== r.level + 1) continue;
    d += `M${x(r.level)} ${y.get(r.id)}C${x(r.level) - 8} ${(y.get(r.id) + y.get(c)) / 2} ${x(t.level) - 8} ${(y.get(r.id) + y.get(c)) / 2} ${x(t.level)} ${y.get(c)}`;
  }
  root.append(svg('path', { d, class: 'mini-links' }));
  const names = ['Two steps back', 'Needs', '', 'Unlocks'];
  let last = -1;
  for (const r of rows) {
    const n = index.byId.get(r.id), g = svg('g', { class: `mini-node${r.id === node.id ? ' self' : ''}${isProficient(n) ? ' done' : ''}${frontier.has(r.id) ? ' ready' : ''}`, transform: `translate(${x(r.level)} ${y.get(r.id)})`, tabindex: r.id === node.id ? -1 : 0, role: 'button', 'aria-label': n.name });
    g.append(svg('circle', { r: r.id === node.id ? 5 : 4 }));
    const label = svg('text', { x: 9, y: 4 }); const max = 40 - r.level * 2;
    label.textContent = `${r.level !== last && names[r.level] ? `${names[r.level]}: ` : ''}${n.name.length > max ? `${n.name.slice(0, max - 1)}…` : n.name}`;
    last = r.level; g.append(label);
    const tip = svg('title'); tip.textContent = n.name; g.append(tip);
    if (r.id !== node.id) { g.addEventListener('click', () => onSelect(r.id)); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(r.id); } }); }
    root.append(g);
  }
  return root;
}
