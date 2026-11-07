// The Cyberpunk HUD design tokens: the one source of truth for its colours, frame geometry, line
// weights, glow, spacing, type and motion. scripts/build.mjs writes them out as CSS custom properties
// (dist/theme-tokens.css, scoped to the Cyberpunk theme), and scripts/check-contrast.mjs checks every
// text and outline pair against WCAG AA. The Classic theme does not read any of this.

export const COLORS = {
  // Base: near-black background, translucent panels, dark hairlines.
  bg0: '#07090D', bg1: '#0B0F14', panel: '#0E141B', panelAlpha: 0.9, raised: '#131B24', line: '#1E2A36', lineStrong: '#2C3D4E',
  // Text on the base.
  text: '#E6EDF3', text2: '#A9B6C3', text3: '#8494A3',
  // Primary accent: chrome, frames, focus.
  cyan: '#2EE6F0', cyanDim: '#1D9AA3', cyanDeep: '#0D3438',
  // Secondary accent: the active target, highlights, primary actions.
  amber: '#F5C518', amberDim: '#B38F10', onAmber: '#0B0F14',
  // Alert: warnings, safety, errors and destructive actions only. Never decorative.
  red: '#FF3B4A', redDeep: '#3A1016', onRed: '#0B0F14',
  // Proficient: the gold of the proficiency palette. There is no green.
  gold: '#E8B54A'
};

export const GEOMETRY = { cutS: 8, cutM: 11, cutL: 14, hair: 1, stroke: 2, bracket: 10 };
// Glow is a highlight on focus, hover, selection, frontier and the active milestone only.
export const GLOW = { off: 0, low: 0.2, normal: 0.36 };
export const SPACE = [0, 4, 8, 12, 16, 24, 32, 48];
export const FONTS = {
  display: "'Chakra Petch', 'Segoe UI', system-ui, sans-serif",
  mono: "'JetBrains Mono', Consolas, 'Cascadia Mono', monospace",
  body: "'Inter', 'Segoe UI', system-ui, sans-serif"
};
export const TYPE = { ui: 13, uiSmall: 12, body: 15, lessonBody: 16, lineHeight: 1.55, displayTracking: '0.1em' };
export const MOTION = { fast: 120, base: 180, slow: 220, boot: 220, ringTurn: 24000 };

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const rgba = (h, a) => `rgba(${hex(h).join(', ')}, ${a})`;

// The CSS written to dist/theme-tokens.css. Scoped to the Cyberpunk theme and to .cp-scope (the style
// guide previews the kit while the Classic theme is active).
export function tokensCss() {
  const c = COLORS, v = {
    '--cp-bg-0': c.bg0, '--cp-bg-1': c.bg1, '--cp-panel': rgba(c.panel, c.panelAlpha), '--cp-panel-solid': c.panel, '--cp-raised': c.raised,
    '--cp-line': c.line, '--cp-line-strong': c.lineStrong, '--cp-text': c.text, '--cp-text-2': c.text2, '--cp-text-3': c.text3,
    '--cp-cyan': c.cyan, '--cp-cyan-dim': c.cyanDim, '--cp-cyan-deep': c.cyanDeep, '--cp-cyan-soft': rgba(c.cyan, 0.1), '--cp-cyan-line': rgba(c.cyan, 0.45),
    '--cp-amber': c.amber, '--cp-amber-dim': c.amberDim, '--cp-on-amber': c.onAmber, '--cp-amber-soft': rgba(c.amber, 0.12),
    '--cp-red': c.red, '--cp-red-deep': c.redDeep, '--cp-on-red': c.onRed, '--cp-red-soft': rgba(c.red, 0.1), '--cp-gold': c.gold,
    '--cp-cut-s': `${GEOMETRY.cutS}px`, '--cp-cut-m': `${GEOMETRY.cutM}px`, '--cp-cut-l': `${GEOMETRY.cutL}px`, '--cp-hair': `${GEOMETRY.hair}px`, '--cp-stroke': `${GEOMETRY.stroke}px`, '--cp-bracket': `${GEOMETRY.bracket}px`,
    '--cp-glow': String(GLOW.normal),
    ...Object.fromEntries(SPACE.map((s, i) => [`--cp-s${i}`, `${s}px`])),
    '--cp-font-display': FONTS.display, '--cp-font-mono': FONTS.mono, '--cp-font-body': FONTS.body,
    '--cp-size-ui': `${TYPE.ui}px`, '--cp-size-small': `${TYPE.uiSmall}px`, '--cp-size-body': `${TYPE.body}px`, '--cp-size-lesson': `${TYPE.lessonBody}px`, '--cp-leading': String(TYPE.lineHeight), '--cp-tracking': TYPE.displayTracking,
    '--cp-fast': `${MOTION.fast}ms`, '--cp-base': `${MOTION.base}ms`, '--cp-slow': `${MOTION.slow}ms`, '--cp-boot': `${MOTION.boot}ms`, '--cp-ring-turn': `${MOTION.ringTurn}ms`
  };
  const body = Object.entries(v).map(([k, x]) => `  ${k}: ${x};`).join('\n');
  return `/* Generated from src/theme/tokens.js by scripts/build.mjs. Edit the tokens there. */
:root[data-theme="cyberpunk"], .cp-scope {
${body}
}
/* Glow intensity (Settings > Appearance). */
:root[data-glow="low"], :root[data-glow="low"] .cp-scope { --cp-glow: ${GLOW.low}; }
:root[data-glow="off"], :root[data-glow="off"] .cp-scope { --cp-glow: 0; }
/* Reduced motion: the system setting or the app's own toggle. */
:root[data-motion="reduced"], :root[data-motion="reduced"] .cp-scope { --cp-fast: 0ms; --cp-base: 0ms; --cp-slow: 0ms; --cp-boot: 0ms; }
@media (prefers-reduced-motion: reduce) { :root, .cp-scope { --cp-fast: 0ms; --cp-base: 0ms; --cp-slow: 0ms; --cp-boot: 0ms; } }
`;
}
