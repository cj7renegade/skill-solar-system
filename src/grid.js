// Spacing for the ground grid. The floor is drawn in a shader, and a fixed cell size either shimmers
// when the camera is close or disappears when it pulls back, because the cells fall below a pixel.
// Instead the spacing steps up by GRID_STEP whenever cells would grow too dense, so a readable grid is
// always on screen. gridBlend says how far through the current step the camera is, which fades the
// finer subdivision out as the next one takes over. Mirrored in GRID_SHADER for the fragment shader.
export const GRID_BASE = 50;        // finest spacing, in world units
export const GRID_STEP = 5;         // each level is this many times coarser
export const GRID_TARGET_PIXELS = 60; // aim to start a level with cells about this wide

// perPixel is world units covered by one pixel of the floor at the point being drawn.
export function gridLevel(perPixel) {
  if (!(perPixel > 0) || !Number.isFinite(perPixel)) return 0;
  return Math.max(Math.log(perPixel * GRID_TARGET_PIXELS / GRID_BASE) / Math.log(GRID_STEP), 0);
}
export function gridSpacing(perPixel) { return GRID_BASE * GRID_STEP ** Math.floor(gridLevel(perPixel)); }
export function gridBlend(perPixel) { const level = gridLevel(perPixel); return level - Math.floor(level); }

export const GRID_SHADER = `
const float GRID_BASE = ${GRID_BASE.toFixed(1)};
const float GRID_STEP = ${GRID_STEP.toFixed(1)};
const float GRID_TARGET = ${GRID_TARGET_PIXELS.toFixed(1)};
float gridLevel(float perPixel) { return max(log2(perPixel * GRID_TARGET / GRID_BASE) / log2(GRID_STEP), 0.0); }
float gridSpacing(float perPixel) { return GRID_BASE * pow(GRID_STEP, floor(gridLevel(perPixel))); }
float gridBlend(float perPixel) { return fract(gridLevel(perPixel)); }`;
