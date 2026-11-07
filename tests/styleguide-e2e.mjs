// Electron checks for the Cyberpunk HUD foundations: Settings ▸ Appearance switches the theme and
// keeps the choice; Classic stays exactly as it was; the style guide opens from Settings ▸ Developer
// with every component and real readouts; keyboard focus is visible; reduced motion and glow apply.
// With SSS_SHOTS=1 it also saves docs/screenshots/cyberpunk/styleguide-*.png.
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check } = checker();
const out = path.join(import.meta.dirname, '..', 'docs', 'screenshots', 'cyberpunk');
const app = await launchApp('sss-styleguide-');
try {
  const { evaluate, click, open, pageErrors, key } = app;
  // The starter map has no milestones or courses, so its guide shows fewer rings and chips (and says why).
  const helix = !!process.env.SSS_HELIX_MAP;
  if (helix) { const f = path.join(app.dir, 'Humanoid-Helix-Atlas.json'); copyFileSync(process.env.SSS_HELIX_MAP, f); await open(f); await sleep(1200); }
  const attrs = () => evaluate(`(()=>{const r=document.documentElement;return {theme:r.dataset.theme,glow:r.dataset.glow,motion:r.dataset.motion,atmosphere:r.dataset.atmosphere,bg:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily};})()`);
  const classic = await attrs();
  check('Classic is the default theme, with the Classic background and font', classic.theme === 'classic' && classic.bg === 'rgb(8, 14, 25)' && /Segoe UI/.test(classic.font) && !/Inter/.test(classic.font), JSON.stringify(classic));
  check('atmosphere effects are off by default', classic.atmosphere === 'off' && await evaluate(`getComputedStyle(document.getElementById('atmosphere')).display`) === 'none');

  await click('#file-menu', 200); await click('#settings-open', 300);
  check('File ▸ Settings opens Appearance with Theme, Atmosphere, Reduce motion and Glow (choices as buttons)', await evaluate(`['settings-theme','settings-atmosphere','settings-reduce-motion','settings-glow'].every(id=>document.getElementById(id))`));
  // A real mouse click on the option button (the dropdowns these replaced ignored mouse clicks).
  const choose = (id, value) => click(`#${id}-${value}`, 200);
  await choose('settings-theme', 'cyberpunk'); await sleep(200);
  const cp = await attrs();
  check('choosing Cyberpunk HUD applies the theme at once (near-black, Inter body)', cp.theme === 'cyberpunk' && cp.bg === 'rgb(7, 9, 13)' && /Inter/.test(cp.font), JSON.stringify(cp));
  check('the bundled fonts load offline', await evaluate(`document.fonts.ready.then(()=>['Inter','Chakra Petch','JetBrains Mono'].every(f=>[...document.fonts].some(x=>x.family.replace(/"/g,'')===f)))`));
  await evaluate(`document.getElementById('settings-atmosphere').click();0`); await sleep(100);
  check('Atmosphere effects show faint scanlines (≤ 3 %)', (await attrs()).atmosphere === 'on' && Number(await evaluate(`getComputedStyle(document.getElementById('atmosphere')).opacity`)) <= 0.03);
  await evaluate(`document.getElementById('settings-atmosphere').click();0`);
  await evaluate(`document.getElementById('settings-reduce-motion').click();0`); await sleep(100);
  check('Reduce motion sets every motion duration to 0', (await attrs()).motion === 'reduced' && await evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--cp-base').trim()`) === '0ms');
  await evaluate(`document.getElementById('settings-reduce-motion').click();0`);
  await choose('settings-glow', 'off'); await sleep(100);
  check('Glow intensity Off sets the glow to 0', await evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--cp-glow').trim()`) === '0');
  await choose('settings-glow', 'normal');
  check('the appearance is kept on this computer', JSON.parse(await evaluate(`localStorage.getItem('helixskill-appearance-v1')`)).theme === 'cyberpunk');

  await click('#settings-tab-developer', 200); await click('#settings-styleguide', 600);
  check('Settings ▸ Developer ▸ Style guide opens the style guide', await evaluate(`document.getElementById('styleguide-dialog').open`));
  const counts = await evaluate(`(()=>{const q=s=>document.querySelectorAll('#styleguide-body '+s).length;return {panels:q('.cp-panel'),buttons:q('.cp-btn'),disabled:q('.cp-btn:disabled'),seg:q('.cp-seg'),scan:q('.cp-seg.is-scanning'),rings:q('.cp-ring'),stats:q('.cp-stat'),chips:q('.cp-chip'),badges:q('.cp-badge'),alerts:q('.cp-alert'),ornaments:q('.cp-ornament'),tips:q('.cp-tooltip'),inputs:q('.cp-input'),selects:q('.cp-select'),toggles:q('.cp-toggle'),sliders:q('.cp-slider')};})()`);
  check('every component appears: panels, buttons in all states, progress, rings, readouts, chips, badges, alerts, ornaments, tooltip, modal and inputs',
    counts.panels >= 16 && counts.buttons >= 25 && counts.disabled >= 5 && counts.seg >= (helix ? 3 : 1) && counts.scan === 1 && counts.rings >= (helix ? 2 : 0) && counts.chips >= (helix ? 3 : 0) && counts.stats >= 3 && counts.badges === 6 && counts.alerts === 3 && counts.ornaments >= 5 && counts.tips >= 2 && counts.inputs === 3 && counts.selects === 2 && counts.toggles === 3 && counts.sliders === 2, JSON.stringify(counts));
  const readouts = await evaluate(`[...document.querySelectorAll('#styleguide-body .cp-serial, #styleguide-body .cp-stat-value')].map(e=>e.textContent)`);
  check('readouts show real map data (no fake codes)', readouts.some(t => /SKILLS$/.test(t)) && !readouts.some(t => /0x|lorem|ipsum/i.test(t)), readouts.join(' | '));
  check('the six status badges have their own words and icons', await evaluate(`[...document.querySelectorAll('#styleguide-body .cp-badge')].every(b=>b.querySelector('svg')&&b.textContent.trim().length>3)`));
  check('alert blocks are red-framed; red appears nowhere else as decoration', await evaluate(`[...document.querySelectorAll('#styleguide-body .cp-alert')].every(a=>getComputedStyle(a).getPropertyValue('--frame').trim()==='#FF3B4A'||getComputedStyle(a.querySelector('.cp-shape')).backgroundColor==='rgb(255, 59, 74)')`));
  await key('Tab'); await key('Tab');
  check('keyboard focus is visible as a 2 px cyan ring', await evaluate(`(()=>{const f=document.activeElement;const s=getComputedStyle(f);return f.closest('#styleguide-body')&&s.outlineStyle!=='none'&&s.outlineWidth==='2px';})()`));
  const text = await evaluate(`(()=>{const sizes=[...document.querySelectorAll('#styleguide-body *')].filter(e=>e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&!e.closest('svg')).map(e=>parseFloat(getComputedStyle(e).fontSize));return {min:Math.min(...sizes),prose:parseFloat(getComputedStyle(document.querySelector('#styleguide-body .cp-prose p')).fontSize)};})()`);
  check('UI text is at least 11 px and reading text 16 px', text.min >= 11 && text.prose === 16, JSON.stringify(text));
  check('reading content carries no decoration', await evaluate(`!document.querySelector('#styleguide-body .cp-prose .cp-hatch, #styleguide-body .cp-prose .cp-ornament, #styleguide-body .cp-prose .cp-brackets')`));
  await evaluate(`[...document.querySelectorAll('#styleguide-body .cp-btn')].find(b=>b.textContent==='Open the modal').click();0`); await sleep(300);
  check('the modal opens in the same frame language', await evaluate(`!!document.querySelector('#styleguide-body dialog.cp-modal[open] .cp-panel.is-alert')`));
  await evaluate(`document.querySelector('#styleguide-body dialog.cp-modal[open]').close();0`);

  if (process.env.SSS_SHOTS) {
    mkdirSync(out, { recursive: true });
    const shot = async name => { const { data } = await app.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(out, name), Buffer.from(data, 'base64')); console.log(`saved ${name}`); };
    const panels = await evaluate(`[...document.querySelectorAll('#styleguide-body .sg-columns > .cp-panel')].map(p=>p.getAttribute('aria-label'))`);
    let i = 1;
    for (let p = 0; p < panels.length; p += 2) {
      await evaluate(`(()=>{const d=document.getElementById('styleguide-dialog');const t=document.querySelectorAll('#styleguide-body .sg-columns > .cp-panel')[${p}];d.scrollTop=t.offsetTop-12;})()`); await sleep(250);
      await shot(`styleguide-${String(i++).padStart(2, '0')}-${panels[p].toLowerCase().replace(/[^a-z]+/g, '-')}.png`);
    }
    await evaluate(`document.querySelector('#styleguide-body .cp-tip-host .cp-btn').focus();(()=>{const d=document.getElementById('styleguide-dialog');d.scrollTop=document.querySelector('#styleguide-body .cp-tip-host').closest('.cp-panel').offsetTop-12;})()`); await sleep(250);
    await shot(`styleguide-${String(i++).padStart(2, '0')}-tooltip-on-focus.png`);
    await evaluate(`[...document.querySelectorAll('#styleguide-body .cp-btn')].find(b=>b.textContent==='Open the modal').click();0`); await sleep(300);
    await shot(`styleguide-${String(i++).padStart(2, '0')}-modal-open.png`);
  }
  await key('Escape'); await key('Escape');
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join('\n'));
} finally { await app.stop(); }
console.log('\nStyle guide checks passed.');
