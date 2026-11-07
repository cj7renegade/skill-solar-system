// WCAG 2.2 contrast check for the Cyberpunk HUD tokens (src/theme/tokens.js). Every text pair must
// reach 4.5:1 (body and small text), large display text 3:1, and UI outlines and focus rings 3:1
// against what they sit on. Translucent colours are composited over what is behind them.
//   node scripts/check-contrast.mjs         prints every pair; exits 1 if any fails
import { COLORS as C } from '../src/theme/tokens.js';

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
export const over = (fg, alpha, bg) => toHex(rgb(fg).map((v, i) => v * alpha + rgb(bg)[i] * (1 - alpha)));
const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = h => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Hairlines (#1E2A36) are decoration only: no control relies on them as its only boundary.
// What panels look like over the background, and the soft fills used by states.
export const SURFACES = {
  background: C.bg0, background2: C.bg1, panel: over(C.panel, C.panelAlpha, C.bg0), raised: C.raised,
  cyanSoft: over(C.cyan, 0.1, over(C.panel, C.panelAlpha, C.bg0)), redSoft: over(C.red, 0.1, over(C.panel, C.panelAlpha, C.bg0)), amberSoft: over(C.amber, 0.12, over(C.panel, C.panelAlpha, C.bg0))
};
const S = SURFACES;
// [name, foreground, background, minimum, kind]
export const PAIRS = [
  ['body text on background', C.text, S.background, 4.5, 'text'], ['body text on panel', C.text, S.panel, 4.5, 'text'], ['body text on raised', C.text, S.raised, 4.5, 'text'],
  ['secondary text on panel', C.text2, S.panel, 4.5, 'text'], ['secondary text on raised', C.text2, S.raised, 4.5, 'text'], ['muted label on panel', C.text3, S.panel, 4.5, 'text'], ['muted label on background', C.text3, S.background, 4.5, 'text'],
  ['cyan label on panel', C.cyan, S.panel, 4.5, 'text'], ['cyan label on cyan-soft', C.cyan, S.cyanSoft, 4.5, 'text'], ['amber text on panel', C.amber, S.panel, 4.5, 'text'], ['amber text on amber-soft', C.amber, S.amberSoft, 4.5, 'text'],
  ['dark text on amber (primary button)', C.onAmber, C.amber, 4.5, 'text'], ['red text on panel (alert)', C.red, S.panel, 4.5, 'text'], ['red text on red-soft (alert block)', C.red, S.redSoft, 4.5, 'text'], ['body text on red-soft', C.text, S.redSoft, 4.5, 'text'],
  ['dark text on red (danger fill)', C.onRed, C.red, 4.5, 'text'], ['gold on panel (proficient)', C.gold, S.panel, 4.5, 'text'], ['dark text on cyan (selected chip)', C.bg1, C.cyan, 4.5, 'text'],
  ['display header, secondary on panel', C.text2, S.panel, 3, 'large'],
  ['cyan outline on panel', C.cyan, S.panel, 3, 'ui'], ['cyan outline on background', C.cyan, S.background, 3, 'ui'], ['cyan 45 % outline on panel (secondary frames)', over(C.cyan, 0.45, S.panel), S.panel, 3, 'ui'],
  ['amber outline on panel', C.amber, S.panel, 3, 'ui'], ['red outline on panel', C.red, S.panel, 3, 'ui'],
  ['input border (cyan 45 %) on panel', over(C.cyan, 0.45, S.panel), S.panel, 3, 'ui'],
  // The focus ring is drawn 2 px outside the control, so it sits on the panel or background, never on the button's own fill.
  ['focus ring (cyan) on panel', C.cyan, S.panel, 3, 'ui'], ['focus ring (cyan) on background', C.cyan, S.background, 3, 'ui'], ['dim cyan chrome on panel', C.cyanDim, S.panel, 3, 'ui']
];

export function check() { return PAIRS.map(([name, fg, bg, min, kind]) => ({ name, fg, bg, min, kind, ratio: Math.round(ratio(fg, bg) * 100) / 100, ok: ratio(fg, bg) >= min })); }

if (process.argv[1]?.endsWith('check-contrast.mjs')) {
  const results = check();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.ratio.toFixed(2).padStart(5)}:1  (min ${r.min})  ${r.name}  ${r.fg} on ${r.bg}`);
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length} of ${results.length} pairs pass.`);
  if (failed.length) process.exit(1);
}
