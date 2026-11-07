// One real end-to-end lesson run (docs/ai-lessons-plan.md, Verification): generates lessons for three
// skills of the helix map with the cheapest model, through the same main-process code the app uses,
// with the key the app saved (decrypted by Electron safeStorage in this process; never printed or
// written). Saves the lessons into the app's lesson store and copies the records to docs/samples/.
//
//   npx electron scripts/real-lesson-run.cjs [model]        (default claude-haiku-5-5)
const { app, safeStorage, net } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
app.setPath('userData', path.join(process.env.APPDATA, 'skill-solar-system'));
const model = process.argv.find(a => /^claude-/.test(a)) || 'claude-haiku-5-5';

app.whenReady().then(async () => {
  try {
    const SDK = require('@anthropic-ai/sdk');
    const { createGuide } = require('../desktop/guide.cjs');
    const { createLessons } = require('../desktop/lessons.cjs');
    const userData = app.getPath('userData');
    const guide = createGuide({ dir: path.join(userData, 'guide'), secure: safeStorage, SDK, online: () => net.isOnline(), createClient: apiKey => new SDK.default({ apiKey, maxRetries: 1, timeout: 180_000 }) });
    const status = await guide.load();
    console.log(`Guide connection: ${status.state} (key ${status.hasKey ? `found, ${status.keySource}` : 'missing'})`);
    if (status.state !== 'online') throw Error('The Guide is not online, so no lesson can be generated.');
    const lessons = createLessons({ dir: userData, guide, SDK });
    const before = await lessons.status();
    await lessons.setSettings({ model, askBeforeGenerating: before.settings.askBeforeGenerating });

    const { buildLessonContext } = await import(pathToFileURL(path.join(root, 'src', 'lesson-context.js')));
    const { prerequisiteIndex } = await import(pathToFileURL(path.join(root, 'src', 'learner.js')));
    const graph = JSON.parse(fs.readFileSync(path.join(root, 'Maps', 'Humanoid-Helix-Atlas.json'), 'utf8'));
    const index = prerequisiteIndex(graph), mapKey = graph.metadata.atlasFamily;
    const listed = await lessons.list(mapKey);
    const pick = test => graph.nodes.filter(n => test(n) && !listed[n.id] && n.nodeKind !== 'milestone' && n.nodeKind !== 'checkpoint').sort((a, b) => (a.helixLevel ?? 999) - (b.helixLevel ?? 999))[0];
    const skills = [
      ['MTH QUANT', pick(n => n.courseCode === 'MTH' && (n.helixType === 'QUANT' || /written calculation|calculation and explanation/.test(n.assessmentMode || '')))],
      ['hands-on ELX/PWR', pick(n => ['ELX', 'PWR'].includes(n.courseCode) && n.helixPractice === 'hands-on')],
      ['AIL QUAL', pick(n => n.courseCode === 'AIL' && n.helixType === 'QUAL')]
    ];
    // SSS_LESSON_IDS=id,id… runs those skills instead (for example a numeric maths skill).
    if (process.env.SSS_LESSON_IDS) skills.splice(0, skills.length, ...process.env.SSS_LESSON_IDS.split(',').map(id => [`chosen ${id}`, graph.nodes.find(n => n.id === id)]));
    const out = path.join(root, 'docs', 'samples'); fs.mkdirSync(out, { recursive: true });
    const summary = [];
    for (const [label, node] of skills) {
      const context = buildLessonContext(graph, node, { index, learnerProfile: before.settings.learnerProfile });
      console.log(`\n${label}: ${node.name} (${node.id}) — generating with ${model}…`);
      const started = Date.now();
      const result = await lessons.generate(`real-${node.id}`, mapKey, node.id, context, {}, p => { if (p.stage !== 'writing') console.log(`  ${p.stage}${p.problem ? ` ${p.problem}` : ''}`); });
      const seconds = Math.round((Date.now() - started) / 100) / 10;
      if (!result.ok) { console.log(`  FAILED (${result.kind}): ${result.message}`); summary.push({ label, id: node.id, name: node.name, ok: false, kind: result.kind, message: result.message, seconds }); continue; }
      const r = result.record;
      fs.writeFileSync(path.join(out, `${node.id.replace(/[^\w.-]/g, '_')}.json`), JSON.stringify({ ...r, context }, null, 2) + '\n');
      console.log(`  ${r.status} · ${seconds} s · ${r.tokensIn} tokens in, ${r.tokensOut} out · ~$${r.cost.toFixed(4)}${r.verification ? ` · check ${r.verification.checked}/${r.verification.total}, ${r.verification.mismatches.length} disagree, repaired ${r.verification.repaired.length}` : ''}`);
      summary.push({ label, id: node.id, name: node.name, ok: true, status: r.status, model: r.model, seconds, tokensIn: r.tokensIn, tokensOut: r.tokensOut, cost: r.cost, verification: r.verification && { checked: r.verification.checked, total: r.verification.total, mismatches: r.verification.mismatches.map(m => m.id), repaired: r.verification.repaired, notChecked: r.verification.notChecked } });
    }
    await lessons.setSettings({ model: before.settings.model });
    fs.writeFileSync(path.join(out, 'run-summary.json'), JSON.stringify({ ranAt: new Date().toISOString(), model, promptVersion: before.promptVersion, skills: summary }, null, 2) + '\n');
    console.log('\nSaved to docs/samples/.');
    guide.stop(); app.exit(0);
  } catch (error) { console.error(`Run stopped: ${error.message}`); app.exit(1); }
});
