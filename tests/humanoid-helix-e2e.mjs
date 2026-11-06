// End-to-end check of the Humanoid Protocol Droid Helix map in the real Electron app, in an isolated
// profile: it renders, its filters work, cards open for an Atlas skill and a new skill, and the
// Robotics Atlas still opens as before. Saves screenshots to docs/screenshots/humanoid-helix/.
//
//   SSS_HELIX_MAP=<copy of Maps/Humanoid-Helix-Atlas.json> SSS_ATLAS_MAP=<copy of Maps/Robotics-Atlas.json> node tests/humanoid-helix-e2e.mjs
import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';
import { lessonSections } from '../src/lesson.js';

if (!process.env.SSS_HELIX_MAP) { console.log('Skipped: set SSS_HELIX_MAP to the helix map.'); process.exit(0); }
const { check, passed } = checker();
const ROOT = path.resolve(import.meta.dirname, '..');
const SHOTS = path.join(ROOT, 'docs', 'screenshots', 'humanoid-helix');
mkdirSync(SHOTS, { recursive: true });
const helixData = JSON.parse(readFileSync(process.env.SSS_HELIX_MAP, 'utf8'));
const byId = new Map(helixData.nodes.map(n => [n.id, n]));
const ATLAS_SKILL = 'rob3:K05', NEW_SKILL = 'hx-act-harmonic-drive', PHYSICS_SKILL = 'hx-em-field-lines';
const SKILLS = helixData.nodes.length, TOP = helixData.layout.topLevel;

const app = await launchApp('sss-helix-');
try {
  const { evaluate, open, pageErrors, send } = app;
  const shot = async name => { await sleep(600); const { data } = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(SHOTS, name), Buffer.from(data, 'base64')); console.log(`  screenshot ${name}`); };
  const fromDraft = expression => evaluate(`(()=>{const g=JSON.parse(localStorage.getItem('skill-solar-system-v1'));return ${expression};})()`);
  const selectByName = async name => { await evaluate(`(()=>{const n=${JSON.stringify(name)};[...document.querySelectorAll('.node-item')].find(b=>b.textContent===n).click()})()`); await sleep(300); };
  const openCard = async node => { await selectByName(node.name); await evaluate(`[...document.querySelectorAll('#inspector button')].find(b=>b.id==='open-details').click()`); await sleep(400); };
  const cardText = () => evaluate(`document.getElementById('details-body').textContent`);
  const sectionTitles = () => evaluate(`[...document.querySelectorAll('#details-body details.lesson-section>summary')].map(s=>s.textContent)`);
  const closeCard = () => app.click('#details-close', 250);
  const setFilter = async (key, value) => { await evaluate(`(()=>{const s=document.getElementById('helix-filter-${key}');s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change'));})()`); await sleep(500); };
  const filterCount = () => evaluate(`document.getElementById('helix-filter-count')?.textContent||''`);

  const helixMap = path.join(app.dir, 'Humanoid-Helix-Atlas.json');
  copyFileSync(process.env.SSS_HELIX_MAP, helixMap);
  const t0 = Date.now();
  await open(helixMap);
  console.log(`  opened in ${((Date.now() - t0) / 1000).toFixed(1)} s (including the harness's wait)`);
  check('the helix map opens with every skill', await fromDraft('g.nodes.length') === SKILLS, `${SKILLS} skills`);
  check('and every connection', await fromDraft('g.edges.length') === helixData.edges.length, `${helixData.edges.length} connections`);
  check('it is its own map, with its own answer family', await fromDraft('g.metadata.datasetKey') === 'humanoid-helix-v1' && await fromDraft('g.metadata.atlasFamily') === 'humanoid-helix-v1');
  check('the title and layout summary say helix', (await evaluate(`document.getElementById('map-name').textContent`)) === helixData.title
    && /helix level/.test(await evaluate(`document.getElementById('layout-summary').textContent`)));
  const legendCourses = await evaluate(`[...document.querySelectorAll('#legend .legend-item')].map(e=>e.textContent).filter(t=>/^[A-Z]{3} · /.test(t)).length`);
  check('the legend shows all 16 courses', legendCourses === 16, `${legendCourses}`);
  check('the four filters are offered', await evaluate(`['course','stage','path','tier'].every(k=>document.getElementById('helix-filter-'+k))`));
  await evaluate(`document.getElementById('home').click()`); await sleep(800);
  await shot('01-helix-overview.png');

  // Filters: each one narrows the count to the matching skills, and clearing restores everything.
  const expect = test => helixData.nodes.filter(test).length;
  await setFilter('course', 'ACT');
  check('the course filter narrows to the course', (await filterCount()) === `Showing ${expect(n => n.courseCode === 'ACT')} of ${SKILLS} skills`, await filterCount());
  await shot('02-filter-course-actuation.png');
  await setFilter('stage', '2');
  check('filters combine (course and build stage)', (await filterCount()) === `Showing ${expect(n => n.courseCode === 'ACT' && n.buildStage === 2)} of ${SKILLS} skills`, await filterCount());
  await evaluate(`document.getElementById('clear-helix-filters').click()`); await sleep(400);
  check('clearing the filters shows every skill again', !(await filterCount()));
  await setFilter('path', 'false');
  check('the On Humanoid Path filter works', (await filterCount()) === `Showing ${expect(n => n.onHumanoidPath === false)} of ${SKILLS} skills`, await filterCount());
  await setFilter('path', '');
  const tiers = helixData.metadata.humanoidHelixImport.atlasTiers, tierOf = n => n.helixTier ?? tiers[n.id];
  await setFilter('tier', 'Enrichment');
  check('the level filter works (Enrichment)', (await filterCount()) === `Showing ${expect(n => tierOf(n) === 'Enrichment')} of ${SKILLS} skills`, await filterCount());
  await setFilter('tier', 'Milestone');
  await shot('03-filter-milestones.png');
  await setFilter('tier', '');

  // Cards: one Atlas skill with its lesson, one new skill with none.
  for (const [id, label] of [[ATLAS_SKILL, 'an Atlas skill'], [NEW_SKILL, 'a new humanoid skill'], [PHYSICS_SKILL, 'a physics skill added in edition 2']]) {
    const n = byId.get(id);
    await openCard(n);
    const text = await cardText(), titles = await sectionTitles();
    const ok = text.includes(n.description.slice(0, 60)) && text.includes(`Helix level ${n.helixLevel}/${TOP}`) && JSON.stringify(titles) === JSON.stringify(lessonSections(n).map(s => s.title));
    check(`a card opens for ${label} (${id})`, ok, `${titles.length} lesson sections`);
    await shot(`${({ [ATLAS_SKILL]: '04', [NEW_SKILL]: '05', [PHYSICS_SKILL]: '07' })[id]}-card-${id.replace(/[^a-z0-9]+/gi, '-')}.png`);
    await closeCard();
  }
  check('the new skill has no lesson and is unmarked', !byId.get(NEW_SKILL).lesson && (await fromDraft(`g.nodes.find(n=>n.id==='${NEW_SKILL}').proficiency80`)) === null);
  check('no page errors on the helix map', !pageErrors.length, pageErrors.slice(0, 2).join(' | '));

  // The original map still opens and behaves as before.
  if (process.env.SSS_ATLAS_MAP) {
    const atlasMap = path.join(app.dir, 'Robotics-Atlas.json');
    copyFileSync(process.env.SSS_ATLAS_MAP, atlasMap);
    await open(atlasMap);
    check('the Robotics Atlas still opens with its 1,955 skills', await fromDraft('g.nodes.length') === 1955);
    check('with its own key and the spiral wording, and no helix filters', await fromDraft('g.metadata.datasetKey') === 'robotics-atlas-merged'
      && /reference level/.test(await evaluate(`document.getElementById('layout-summary').textContent`)) && !(await evaluate(`!!document.getElementById('helix-filter-course')`)));
    await evaluate(`document.getElementById('home').click()`); await sleep(800);
    await shot('06-robotics-atlas-unchanged.png');
    check('no page errors on the Robotics Atlas', !pageErrors.length, pageErrors.slice(0, 2).join(' | '));
  }
  console.log(`\n${passed.length} checks passed.`);
} finally {
  await app.stop();
}
