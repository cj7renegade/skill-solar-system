// While proficiency colouring is on, skills marked Yes pulse: their glow rises and falls and their
// colour travels with it, from the marked-Yes green to a pale tea green at the peak. Everything else
// stays steady red. The wave is a smooth cosine, never a flash, and the viewer holds a steady
// mid-pulse colour instead when the system asks for reduced motion.
export const PULSE_PERIOD = 1.44; // seconds for one rise and fall
// Emissive intensity adds light on top of the already lit colour, so the glow range stays small: the
// pale end of the pulse is close to full brightness on its own. Measured on a real atlas, a peak of
// 0.1 still renders that end as tea green, 0.2 washes it to near-white, and 0.5 or more is pure white.
export const PULSE_RANGE = { plain: [0, 0.1], selected: [0.05, 0.15] };
// from must stay equal to PROFICIENCY_COLORS.yes, so a steady sphere and a pulsing one start alike.
export const PULSE_COLORS = { from: '#32CD32', to: '#DBF3C9' };

// Position in the cycle: 0 at the dim green start, 1 at the pale bright peak.
export function pulseWave(seconds) {
  if (!Number.isFinite(seconds)) return 1;
  return (1 - Math.cos(2 * Math.PI * (seconds / PULSE_PERIOD))) / 2;
}

// Emissive intensity at a moment in time. Selected spheres keep their brighter range.
export function pulseIntensity(seconds, selected = false) {
  const [low, high] = selected ? PULSE_RANGE.selected : PULSE_RANGE.plain;
  return low + (high - low) * pulseWave(seconds);
}

// The steady glow used when motion is reduced: the middle of the same range, so the colour still
// reads as marked without moving.
export function steadyIntensity(selected = false) {
  const [low, high] = selected ? PULSE_RANGE.selected : PULSE_RANGE.plain;
  return (low + high) / 2;
}

// Which skills pulse: only those marked Yes, and only while proficiency colouring is on.
export function pulsingIds(graph, proficiencyOn) {
  return proficiencyOn && graph ? graph.nodes.filter(n => n.proficiency80 === true).map(n => n.id) : [];
}
