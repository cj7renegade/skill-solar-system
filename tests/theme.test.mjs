// The Cyberpunk HUD theme's foundations: the token CSS, the appearance settings (Classic stays the
// default and untouched), and WCAG contrast for every token pair.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tokensCss, COLORS } from '../src/theme/tokens.js';
import { readAppearance, saveAppearance, appearanceAttributes, DEFAULTS, APPEARANCE_STORE } from '../src/theme/appearance.js';
import { check } from '../scripts/check-contrast.mjs';

const memory = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };

test('tokens: the palette from the brief, scoped to the Cyberpunk theme only', () => {
  assert.deepEqual([COLORS.bg0, COLORS.panel, COLORS.line, COLORS.cyan, COLORS.amber, COLORS.red, COLORS.gold], ['#07090D', '#0E141B', '#1E2A36', '#2EE6F0', '#F5C518', '#FF3B4A', '#E8B54A']);
  assert.ok(COLORS.panelAlpha >= 0.85 && COLORS.panelAlpha <= 0.92);
  const css = tokensCss();
  assert.match(css, /^:root\[data-theme="cyberpunk"\], \.cp-scope \{/m);
  assert.match(css, /--cp-cut-m: 11px;/); assert.match(css, /--cp-panel: rgba\(14, 20, 27, 0\.9\);/);
  assert.match(css, /data-motion="reduced"[^{]*\{ --cp-fast: 0ms/); assert.match(css, /prefers-reduced-motion: reduce/);
  for (const line of css.split('\n').filter(l => /^\s*--/.test(l) === false && /\{/.test(l))) assert.ok(/cyberpunk|cp-scope|data-glow|data-motion|prefers-reduced-motion|:root, \.cp-scope/.test(line), line);
  assert.ok(!/#(?:[0-9a-f]{6})/i.test(css.replace(/--cp-[\w-]+: #[0-9A-F]{6};/g, '')), 'no stray colours outside the tokens');
});

test('no green: the theme never introduces one', () => {
  for (const [name, hex] of Object.entries(COLORS).filter(([, v]) => typeof v === 'string')) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    assert.ok(!(g > r + 40 && g > b + 40), `${name} ${hex} reads as green`);
  }
});

test('appearance: Classic by default, saved choices read back, bad values ignored', () => {
  const s = memory();
  assert.deepEqual(readAppearance(s), DEFAULTS); assert.equal(DEFAULTS.theme, 'classic'); assert.equal(DEFAULTS.atmosphere, false);
  saveAppearance(s, { theme: 'cyberpunk', atmosphere: true, reduceMotion: true, glow: 'off' });
  assert.deepEqual(readAppearance(s), { theme: 'cyberpunk', atmosphere: true, reduceMotion: true, glow: 'off' });
  s.setItem(APPEARANCE_STORE, JSON.stringify({ theme: 'neon', glow: 'max', atmosphere: 'yes' }));
  assert.deepEqual(readAppearance(s), DEFAULTS);
  s.setItem(APPEARANCE_STORE, '{broken');
  assert.deepEqual(readAppearance(s), DEFAULTS);
  assert.deepEqual(appearanceAttributes({ theme: 'classic', atmosphere: true, reduceMotion: false, glow: 'low' }), { 'data-theme': 'classic', 'data-glow': 'low', 'data-motion': 'full', 'data-atmosphere': 'off' }, 'atmosphere shows in the Cyberpunk theme only');
});

test('contrast: every token pair meets WCAG AA (4.5:1 text, 3:1 large text and UI outlines)', () => {
  const failed = check().filter(r => !r.ok);
  assert.deepEqual(failed, []);
  assert.ok(check().length >= 25);
});

test('the Classic stylesheet is not touched by the theme, and every theme rule is scoped', () => {
  const base = readFileSync(new URL('../src/theme/base.css', import.meta.url), 'utf8');
  for (const rule of base.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map(r => r.split('{')[0].trim()).filter(Boolean)) {
    if (rule.startsWith('@font-face') || rule.startsWith('#atmosphere') || rule.startsWith('.settings-')) continue;
    assert.ok(/data-theme="cyberpunk"|\.cp-scope|data-atmosphere/.test(rule), rule);
  }
});
