// Appearance settings: the theme (Classic | Cyberpunk HUD), atmosphere effects, reduced motion and
// glow intensity. Kept per computer in local storage and applied as attributes on <html>, which the
// theme CSS reads. Classic is the default until the Cyberpunk style guide is approved; Classic
// ignores every Cyberpunk attribute, so it stays exactly as it was.

export const APPEARANCE_STORE = 'helixskill-appearance-v1';
export const THEMES = [['classic', 'Classic'], ['cyberpunk', 'Cyberpunk HUD']];
export const GLOWS = [['off', 'Off'], ['low', 'Low'], ['normal', 'Normal']];
export const DEFAULTS = { theme: 'classic', atmosphere: false, reduceMotion: false, glow: 'low', bloom: false };

export function readAppearance(storage) {
  let saved = {};
  try { saved = JSON.parse(storage.getItem(APPEARANCE_STORE) || '{}') || {}; } catch {}
  const pick = (value, list, fallback) => list.some(([k]) => k === value) ? value : fallback;
  return { theme: pick(saved.theme, THEMES, DEFAULTS.theme), atmosphere: saved.atmosphere === true, reduceMotion: saved.reduceMotion === true, glow: pick(saved.glow, GLOWS, DEFAULTS.glow), bloom: saved.bloom === true };
}
export function saveAppearance(storage, value) { try { storage.setItem(APPEARANCE_STORE, JSON.stringify(value)); } catch {} }

// The attributes the CSS reads. Atmosphere only shows in the Cyberpunk theme.
export function appearanceAttributes(a) {
  return { 'data-theme': a.theme, 'data-glow': a.glow, 'data-motion': a.reduceMotion ? 'reduced' : 'full', 'data-atmosphere': a.theme === 'cyberpunk' && a.atmosphere ? 'on' : 'off' };
}
export function applyAppearance(root, a) { for (const [k, v] of Object.entries(appearanceAttributes(a))) root.setAttribute(k, v); }
// Whether motion should play: the app's own toggle or the system's reduced-motion setting.
export const motionAllowed = (a, matchMedia = globalThis.matchMedia) => !a.reduceMotion && !(matchMedia?.('(prefers-reduced-motion: reduce)').matches);
