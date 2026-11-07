// The 2D plan view: a set of skills (a remaining path, or one course) laid out flat as a layered
// graph. Columns are prerequisite depth inside the set, rows are grouped into one lane per course,
// and inside a lane each column is ordered by the average row of its prerequisites (one barycentre
// sweep, left to right), so most links run forward without crossing. Display only.
import { isProficient } from './learner.js';

export const PLAN = { column: 190, row: 22, box: 172, lanePad: 10, left: 120, top: 34 };

export function planLayout(graph, ids, index, courseOrder = []) {
  const set = ids instanceof Set ? ids : new Set(ids);
  const parents = id => index.parents.get(id).filter(p => set.has(p));
  // Depth inside the set: the longest chain of in-set prerequisites (Kahn's order).
  const depth = new Map(), pending = new Map([...set].map(id => [id, parents(id).length])), queue = [...set].filter(id => !pending.get(id));
  for (const id of queue) depth.set(id, 0);
  for (let i = 0; i < queue.length; i++) for (const c of index.children.get(queue[i])) if (set.has(c)) {
    depth.set(c, Math.max(depth.get(c) ?? 0, depth.get(queue[i]) + 1));
    pending.set(c, pending.get(c) - 1); if (!pending.get(c)) queue.push(c);
  }
  const laneOf = n => n.courseCode ?? n.domain ?? '—';
  const order = [...courseOrder, ...[...new Set([...set].map(id => laneOf(index.byId.get(id))))].filter(c => !courseOrder.includes(c)).sort()];
  const columns = Math.max(0, ...depth.values()) + 1;
  // cells[lane][column] = ids, then lane heights from the busiest column.
  const cells = new Map(order.map(c => [c, Array.from({ length: columns }, () => [])]));
  for (const id of set) cells.get(laneOf(index.byId.get(id)))[depth.get(id) ?? 0].push(id);
  const lanes = [], row = new Map();
  let y = PLAN.top;
  for (const course of order) {
    const lane = cells.get(course), height = Math.max(0, ...lane.map(c => c.length));
    if (!height) continue;
    lanes.push({ course, y, height: height * PLAN.row + PLAN.lanePad });
    for (let col = 0; col < columns; col++) {
      const at = id => { const ps = parents(id).filter(p => row.has(p)); return ps.length ? ps.reduce((s, p) => s + row.get(p), 0) / ps.length : Infinity; };
      lane[col].sort((a, b) => at(a) - at(b) || index.byId.get(a).name.localeCompare(index.byId.get(b).name));
      lane[col].forEach((id, i) => row.set(id, y + i * PLAN.row));
    }
    y += height * PLAN.row + PLAN.lanePad;
  }
  const nodes = [...set].map(id => ({ id, node: index.byId.get(id), x: PLAN.left + (depth.get(id) ?? 0) * PLAN.column, y: row.get(id) }));
  const edges = [];
  for (const id of set) for (const p of parents(id)) edges.push([p, id]);
  return { nodes, edges, lanes, columns, width: PLAN.left + columns * PLAN.column, height: y + PLAN.row };
}

const SVG = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => { const e = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

// colorOf(node) -> fill; frontier: ids ready to study (drawn with a bright outline); onSelect(id).
export function renderPlan(host, plan, { colorOf, frontier = new Set(), selected = null, onSelect, title = '' }) {
  host.replaceChildren();
  const root = svg('svg', { width: plan.width, height: plan.height, role: 'img', 'aria-label': title });
  const at = new Map(plan.nodes.map(n => [n.id, n]));
  root.append(svg('text', { x: 8, y: 18, class: 'plan-title' })); root.lastChild.textContent = title;
  for (let c = 0; c < plan.columns; c++) { const t = svg('text', { x: PLAN.left + c * PLAN.column, y: PLAN.top - 8, class: 'plan-col' }); t.textContent = `Depth ${c + 1}`; root.append(t); }
  for (const lane of plan.lanes) {
    root.append(svg('rect', { x: 0, y: lane.y - 4, width: plan.width, height: lane.height, class: 'plan-lane' }));
    const t = svg('text', { x: 8, y: lane.y + 12, class: 'plan-lane-label' }); t.textContent = lane.course; root.append(t);
  }
  // Every link in one path element: thousands of links stay one DOM node.
  let d = '';
  for (const [a, b] of plan.edges) { const p = at.get(a), q = at.get(b); d += `M${p.x + PLAN.box} ${p.y + 8}C${p.x + PLAN.box + 14} ${p.y + 8} ${q.x - 14} ${q.y + 8} ${q.x} ${q.y + 8}`; }
  root.append(svg('path', { d, class: 'plan-edges' }));
  for (const n of plan.nodes) {
    const g = svg('g', { class: `plan-node${n.id === selected ? ' selected' : ''}${frontier.has(n.id) ? ' frontier' : ''}${isProficient(n.node) ? ' done' : ''}`, transform: `translate(${n.x} ${n.y})`, tabindex: 0, role: 'button', 'aria-label': n.node.name });
    const box = svg('rect', { width: PLAN.box, height: 17, rx: 4 }); box.style.fill = colorOf(n.node); g.append(box);
    const label = svg('text', { x: 6, y: 12 }); label.textContent = n.node.name.length > 27 ? `${n.node.name.slice(0, 26)}…` : n.node.name; g.append(label);
    const tip = svg('title'); tip.textContent = n.node.name; g.append(tip);
    g.addEventListener('click', () => onSelect(n.id));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(n.id); } });
    root.append(g);
  }
  host.append(root);
  const chosen = selected && at.get(selected);
  if (chosen) host.scrollTo({ left: Math.max(0, chosen.x - host.clientWidth / 2), top: Math.max(0, chosen.y - host.clientHeight / 2) });
}
