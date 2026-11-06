// The learner HUD: where the learner is (progress to the active target and overall), what to do next
// (frontier skills on the remaining path), and an unfinished review, in one compact card over the
// map. It reads the map and the learner state only; every action goes back through the app (select,
// fly, change target, resume review), so the HUD never writes an answer.
import { prerequisiteIndex, frontier, milestones, defaultTarget, finalMilestone, targetProgress, nextUp, formatHours, isProficient } from './learner.js';
import { mapKey, findSession } from './review.js';

const TARGET_STORE = 'skill-solar-system-target-v1';
export function storedTarget(storage, graph) {
  try { return JSON.parse(storage.getItem(TARGET_STORE) || '{}')[mapKey(graph)] ?? null; } catch { return null; }
}
export function storeTarget(storage, graph, id) {
  try { const all = JSON.parse(storage.getItem(TARGET_STORE) || '{}'); if (id) all[mapKey(graph)] = id; else delete all[mapKey(graph)]; storage.setItem(TARGET_STORE, JSON.stringify(all)); } catch {}
}
// The active target: the stored choice while it is still a milestone of this map, else the default.
export function activeTarget(graph, storage) {
  const chosen = storedTarget(storage, graph);
  return chosen && graph.nodes.some(n => n.id === chosen && n.nodeKind === 'milestone') ? chosen : defaultTarget(graph);
}

// Everything the HUD, the frontier glow and the Today view show, computed once per map version and
// target: a selection change re-renders without recomputing it.
const cache = new WeakMap();
export function learnerState(graph, target, { limit = 20 } = {}) {
  let byTarget = cache.get(graph);
  if (!byTarget) cache.set(graph, byTarget = new Map());
  const key = `${target}|${limit}`;
  if (byTarget.has(key)) return byTarget.get(key);
  const index = prerequisiteIndex(graph), front = frontier(graph, index), final = finalMilestone(graph);
  const state = {
    index, frontier: front, milestones: milestones(graph), target, final,
    progress: target ? targetProgress(graph, target, index) : null,
    overall: final ? targetProgress(graph, final, index) : null,
    next: target ? nextUp(graph, target, { limit, index, front }) : []
  };
  byTarget.set(key, state);
  return state;
}

// An unfinished guided review for this map: how many skills it still has to ask about.
export function reviewLeft(storage, graph) {
  const found = findSession(storage, graph);
  return found ? found.session.queue.length - found.session.position + found.session.skipped.length : 0;
}

const number = n => n.toLocaleString('en');
function bar(percent, label) {
  const track = document.createElement('div'); track.className = 'hud-bar'; track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', '100'); track.setAttribute('aria-valuenow', String(percent)); track.setAttribute('aria-label', label);
  const fill = document.createElement('span'); fill.style.width = `${percent}%`; track.append(fill);
  return track;
}

// el: the app's element helper. palette: course colours (null on maps without courses).
// actions: { setTarget(id), select(id), openReview(), pathTo(id) }.
export function renderHud(host, { graph, state, palette, reviewCount, el, actions }) {
  host.replaceChildren();
  const { milestones: chain, target, progress, overall, next } = state;
  if (!chain.length || !target) { host.hidden = true; return; }
  host.hidden = false;
  const byId = state.index.byId, targetNode = byId.get(target);
  const picker = el('select', { id: 'hud-target', ariaLabel: 'Active target milestone', title: 'The milestone you are working toward. Progress and Next up follow it.', onchange: e => actions.setTarget(e.target.value) },
    ...chain.map(m => el('option', { value: m.id, text: `${isProficient(m) ? '✓ ' : ''}${m.name}`, selected: m.id === target })));
  host.append(el('div', { class: 'hud-label', text: 'Working toward' }), el('div', { class: 'hud-target-row' }, picker,
    el('button', { id: 'hud-path', class: 'hud-path', text: 'Path', title: `Show the path to ${targetNode.name}: what is left, in study order`, onclick: () => actions.pathTo(target) })));

  host.append(el('div', { class: 'hud-row' }, el('span', { class: 'hud-row-label', text: 'Progress to target' }), el('span', { class: 'hud-percent', text: `${progress.percent}%` })),
    bar(progress.percent, `Progress to ${targetNode.name}`),
    el('p', { class: 'hud-detail', id: 'hud-progress', text: progress.complete ? `${targetNode.name} is marked proficient.` : `${number(progress.proficient)} / ${number(progress.prerequisites)} prerequisites proficient · ${formatHours(progress.hoursLeft)} left` }));
  if (overall && state.final !== target) {
    const finalNode = byId.get(state.final);
    host.append(el('div', { class: 'hud-row' }, el('span', { class: 'hud-row-label', text: `Overall · ${shortName(finalNode.name)}` }), el('span', { class: 'hud-percent', id: 'hud-overall', text: `${overall.percent}%` })),
      bar(overall.percent, `Overall progress to ${finalNode.name}`));
  }
  if (reviewCount > 0) host.append(el('button', { class: 'hud-review', id: 'hud-review', text: `Review in progress · ${number(reviewCount)} left`, title: 'Resume your guided proficiency review', onclick: actions.openReview }));

  host.append(el('div', { class: 'hud-label hud-next-label', text: 'Next up' }));
  if (!next.length) host.append(el('p', { class: 'hud-detail', text: progress.complete ? 'Choose the next milestone above.' : 'Nothing is ready: mark the prerequisites below these skills first.' }));
  const list = el('ol', { class: 'hud-next', id: 'hud-next' });
  for (const { node, hours } of next.slice(0, 8)) {
    const chip = node.courseCode ? el('span', { class: 'chip', text: node.courseCode }) : null;
    if (chip && palette?.[node.courseCode]) chip.style.setProperty('--chip', palette[node.courseCode]);
    list.append(el('li', {}, el('button', { class: 'hud-next-item', title: `Select and fly to ${node.name}`, onclick: () => actions.select(node.id) },
      el('span', { class: 'hud-next-name', text: node.name }), chip, el('span', { class: 'hud-hours', text: formatHours(hours) }))));
  }
  if (next.length) host.append(list);
}
// "Milestone I08: verify a conversational …" -> "I08"; other names unchanged.
const shortName = name => /^Milestone (I\d+)/.exec(name)?.[1] ?? name;
