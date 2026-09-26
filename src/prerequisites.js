// The prerequisite chain behind one skill, and the bulk answer a reader can choose to record for it.
//
// Nothing here writes an answer or infers one. It gathers what a skill depends on and reports what
// each of those skills is currently marked as, so the reader can look at the list and decide. The
// app never marks a prerequisite on its own: marking Modules and imports Yes still says nothing
// about Variables and assignment until the reader says so.
//
// Only `prerequisite` edges are followed. `supports` and `related` are not learning order, so a
// skill reached only through them is not part of the chain.

// Every skill the given one depends on, directly or through another prerequisite, nearest first.
// `steps` is the shortest prerequisite path back from the starting skill, so 1 is a direct
// prerequisite and larger numbers are further down towards the foundations. Within one step count
// the order is by name, which is the order the list is read in.
export function prerequisiteChain(graph, id) {
  const inputs = new Map();
  for (const edge of graph.edges) {
    if (edge.type !== 'prerequisite') continue;
    if (!inputs.has(edge.target)) inputs.set(edge.target, []);
    inputs.get(edge.target).push(edge.source);
  }
  const nodes = new Map(graph.nodes.map(n => [n.id, n]));
  if (!nodes.has(id)) return [];
  const steps = new Map();
  let frontier = [id];
  for (let depth = 1; frontier.length; depth++) {
    const next = [];
    for (const current of frontier) {
      for (const source of inputs.get(current) || []) {
        if (source === id || steps.has(source) || !nodes.has(source)) continue;
        steps.set(source, depth);
        next.push(source);
      }
    }
    frontier = next;
  }
  return [...steps]
    .map(([prerequisiteId, step]) => {
      const node = nodes.get(prerequisiteId);
      return { id: prerequisiteId, name: node.name, domain: node.domain, steps: step, proficiency80: node.proficiency80 ?? null };
    })
    .sort((a, b) => a.steps - b.steps || a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || (a.id < b.id ? -1 : 1));
}

export function chainSummary(chain) {
  return {
    total: chain.length,
    yes: chain.filter(s => s.proficiency80 === true).length,
    no: chain.filter(s => s.proficiency80 === false).length,
    unmarked: chain.filter(s => s.proficiency80 !== true && s.proficiency80 !== false).length,
    depth: chain.reduce((deepest, s) => Math.max(deepest, s.steps), 0)
  };
}

// What is ticked when the list first opens: the skills this answer would actually change. A skill
// already marked with the chosen answer is listed but unticked, because reconfirming it would do
// nothing; the reader can still tick it, and can untick anything they do not want to claim.
export function defaultSelection(chain, value = true) {
  return new Set(chain.filter(s => s.proficiency80 !== value).map(s => s.id));
}

// The skills a confirmed bulk answer would actually change, in chain order. Anything already
// holding that answer is left out, so the reported count is the real one.
export function pendingChanges(chain, selected, value) {
  return chain.filter(s => selected.has(s.id) && s.proficiency80 !== value).map(s => s.id);
}

export const stepLabel = steps => steps === 1 ? 'Direct prerequisites' : `${steps} steps further down`;
