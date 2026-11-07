// Checks the map palette (src/palette.js) for colour-vision deficiency: every pair of courses that
// sit next to each other (around the helix and inside a legend family) and the proficiency states,
// under normal vision and simulated deuteranopia and protanopia (Machado, Oliveira & Fernandes 2009,
// severity 1.0, in linear RGB). Differences are CIEDE2000 (ΔE00): about 2 is just noticeable, 10 or
// more is clearly distinct at a glance.
//
//   node scripts/check-palette.mjs            prints the table; exits 1 if a pair is below the floor
import { FAMILIES, COURSE_COLORS, PROFICIENCY } from '../src/palette.js';

const ORDER = ['MTH', 'PHY', 'MAT', 'MEC', 'ACT', 'ELX', 'PWR', 'EMB', 'CST', 'KDC', 'LOC', 'MAN', 'PER', 'AIL', 'HRI', 'SYS'];
const FLOOR = { neighbour: 10, family: 6, state: 10 };   // the minimum ΔE00 each kind of pair must keep
const MATRICES = {
  normal: null,
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]
};
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const toLinear = c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
function lab(rgb, matrix) {
  let lin = rgb.map(toLinear);
  if (matrix) lin = matrix.map(row => Math.min(1, Math.max(0, row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2])));
  const [r, g, b] = lin;
  const xyz = [(0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883];
  const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
  const [fx, fy, fz] = xyz.map(f);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
// CIEDE2000 (Sharma, Wu & Dalal 2005).
function de2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h = (a, b) => { if (!a && !b) return 0; const v = Math.atan2(b, a) / rad; return v < 0 ? v + 360 : v; };
  const h1p = h(a1p, b1), h2p = h(a2p, b2), dL = L2 - L1, dC = C2p - C1p;
  let dh = h2p - h1p; if (C1p * C2p === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin(dh / 2 * rad), Lm = (L1 + L2) / 2, Cmp = (C1p + C2p) / 2;
  let hm = h1p + h2p; if (C1p * C2p !== 0) hm = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + (h1p + h2p < 360 ? 360 : -360)) / 2 : (h1p + h2p) / 2;
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
  const SL = 1 + 0.015 * (Lm - 50) ** 2 / Math.sqrt(20 + (Lm - 50) ** 2), SC = 1 + 0.045 * Cmp, SH = 1 + 0.015 * Cmp * T;
  const RT = -2 * Math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hm - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}

export function pairResults(courses = COURSE_COLORS, states = PROFICIENCY, families = FAMILIES.map(f => Object.keys(f.courses))) {
const pairs = [];
ORDER.forEach((code, i) => pairs.push({ kind: 'neighbour', a: code, b: ORDER[(i + 1) % ORDER.length] }));
for (const codes of families) { for (let i = 0; i < codes.length; i++) for (let j = i + 1; j < codes.length; j++) pairs.push({ kind: 'family', a: codes[i], b: codes[j] }); }
pairs.push({ kind: 'state', a: 'yes', b: 'unset' }, { kind: 'state', a: 'yes', b: 'no' }, { kind: 'state', a: 'no', b: 'unset' });
const color = id => courses[id] ?? states[id];
for (const p of pairs) { p.values = Object.values(MATRICES).map(m => de2000(lab(hex(color(p.a)), m), lab(hex(color(p.b)), m))); p.low = Math.min(...p.values); p.ok = p.low >= FLOOR[p.kind]; }
return pairs;
}
if (import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) main();
function main() {
const pairs = pairResults();
let failed = 0;
console.log('pair            kind       normal  deutan  protan  floor');
for (const p of pairs) {
  const { values, ok } = p;
  if (!ok) failed++;
  console.log(`${`${p.a}–${p.b}`.padEnd(15)} ${p.kind.padEnd(10)} ${values.map(v => v.toFixed(1).padStart(6)).join('  ')}  ${String(FLOOR[p.kind]).padStart(5)}${ok ? '' : '  BELOW'}`);
}
const worst = kind => pairs.filter(p => p.kind === kind).map(p => ({ p, v: Math.min(...p.values) })).sort((x, y) => x.v - y.v)[0];
for (const kind of Object.keys(FLOOR)) { const w = worst(kind); console.log(`lowest ${kind}: ${w.p.a}–${w.p.b} ΔE00 ${w.v.toFixed(1)}`); }
console.log(failed ? `\n${failed} pair(s) below the floor.` : '\nEvery pair keeps its floor under all three kinds of vision.');
process.exit(failed ? 1 : 0);
}
