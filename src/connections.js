// Immediate incident edges only; never traverse to neighbors of neighbors.
export function visibleConnections(edges,selected,selectedOnly=true) {
  if(!selectedOnly)return edges;
  if(!selected)return [];
  return edges.filter(edge=>edge.source===selected||edge.target===selected);
}
