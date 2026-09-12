// While proficiency colouring is on, skills marked Yes pulse: their own glow rises and falls in the
// proficiency colour. No and unmarked skills stay steady, so answered skills stand out on their own.
// The wave is a smooth cosine, never a flash, and the viewer holds a steady glow instead when the
// system asks for reduced motion.
export const PULSE_PERIOD = 1.8; // seconds for one rise and fall
export const PULSE_RANGE = { plain: [0.15, 0.85], selected: [0.5, 1.05] };

// Emissive intensity at a moment in time. Selected spheres keep their brighter range.
export function pulseIntensity(seconds, selected = false) {
  const [low, high] = selected ? PULSE_RANGE.selected : PULSE_RANGE.plain;
  if (!Number.isFinite(seconds)) return high;
  const wave = (1 - Math.cos(2 * Math.PI * (seconds / PULSE_PERIOD))) / 2; // 0 at the start, 1 at half a period
  return low + (high - low) * wave;
}

// The steady glow used when motion is reduced: the middle of the same range, so the colour still reads
// as marked without moving.
export function steadyIntensity(selected = false) {
  const [low, high] = selected ? PULSE_RANGE.selected : PULSE_RANGE.plain;
  return (low + high) / 2;
}

// Which skills pulse: only those marked Yes, and only while proficiency colouring is on.
export function pulsingIds(graph, proficiencyOn) {
  return proficiencyOn && graph ? graph.nodes.filter(n => n.proficiency80 === true).map(n => n.id) : [];
}
