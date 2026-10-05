// Turns measure-app.mjs output (one JSON line per run) into a Markdown table per map, using the
// median of the runs for every number. Rejected maps report their exact message.
//
//   node authoring/stress/summarize-measurements.mjs C:\sss-scratch\stress\task3-results.jsonl
import { readFileSync } from 'node:fs';

const median = values => { const s = values.filter(v => typeof v === 'number').sort((a, b) => a - b); return s.length ? s[(s.length - 1) >> 1] : null; };
const rows = readFileSync(process.argv[2], 'utf8').trim().split(/\r?\n/).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
const byLabel = new Map();
for (const r of rows) { if (!byLabel.has(r.label)) byLabel.set(r.label, []); byLabel.get(r.label).push(r); }

const fmt = (v, unit = '') => v == null ? '—' : `${typeof v === 'number' ? v.toLocaleString('en-US') : v}${unit}`;
const m = (runs, get) => median(runs.map(r => { try { return get(r); } catch { return undefined; } }));
const spread = (runs, get) => { const v = runs.map(r => { try { return get(r); } catch { return undefined; } }).filter(x => typeof x === 'number'); return v.length > 1 ? ` (runs: ${v.map(x => x.toLocaleString('en-US')).join(' / ')})` : ''; };

for (const [label, runs] of byLabel) {
  console.log(`\n### ${label}\n`);
  const first = runs[0];
  if (first.toolError || first.error && !first.open) { console.log(`Measurement tool error: ${first.error || 'see raw log'}\n`); continue; }
  if (!first.open?.ok) { console.log(`**Rejected on open.** Message shown in the status bar: \`${first.open?.message}\` (after ${fmt(first.open?.toStatusMs, ' ms')}).\n`); continue; }
  console.log(`${runs.length} run(s); median shown${runs.length > 1 ? ', individual runs in brackets' : ''}. ${first.counts}.\n`);
  console.log('| Measure | Result |\n| --- | --- |');
  const line = (name, get, unit) => console.log(`| ${name} | ${fmt(m(runs, get), unit)}${spread(runs, get)} |`);
  line('Open → status "Opened"', r => r.open.toStatusMs, ' ms');
  line('Open → first painted frame', r => r.open.toFirstFrameMs, ' ms');
  line('Memory after open: JS heap used', r => r.memoryAfterOpen.jsHeapUsedMB, ' MB');
  line('Memory after open: all app processes, private', r => r.memoryAfterOpen.privateMB, ' MB');
  line('Memory at end of run: all app processes, private', r => r.memoryAtEnd.privateMB, ' MB');
  line('Orbit 10 s, labels on: median fps', r => r.orbitLabelsOn.medianFps);
  line('Orbit 10 s, labels on: worst 5% fps', r => r.orbitLabelsOn.worst5pctFps);
  line('Orbit 10 s, labels on: worst 5% frame', r => r.orbitLabelsOn.worst5pctFrameMs, ' ms');
  line('Orbit 10 s, labels off: median fps', r => r.orbitLabelsOff.medianFps);
  line('Orbit 10 s, labels off: worst 5% fps', r => r.orbitLabelsOff.worst5pctFps);
  line('Click sphere → card painted', r => r.clickToCard.toFirstFrameMs, ' ms');
  line('Find box ("e") → painted', r => r.search.findBoxMs, ' ms');
  line('Console list filter ("e") → painted', r => r.search.listFilterMs, ' ms');
  line('Arrange level spiral → painted', r => r.arrangeSpiral.toFrameMs, ' ms');
  line('Switching edit mode on → painted', r => r.arrangeSpiral.editModeOnMs, ' ms');
  line('Save → "Map saved" status', r => r.save.toStatusMs, ' ms');
  line('Saved file size', r => r.save.bytes, ' bytes');
  line('Start review (open dialog + begin) → painted', r => r.review.totalMs, ' ms');
  line('Review session stored', r => r.review.sessionStoreChars, ' characters');
  const ok = (name, get) => console.log(`| ${name} | ${runs.map(r => { try { return get(r); } catch { return '?'; } }).join(' / ')} |`);
  ok('Draft saved after open (per run)', r => r.draftAfterOpen.isThisMap ? `yes, ${r.draftAfterOpen.chars.toLocaleString('en-US')} chars` : r.draftAfterOpen.stored ? 'no — an older draft remains' : 'no — nothing stored');
  ok('Draft after arranging (per run)', r => r.draftAfterArrange.stored ? `${r.draftAfterArrange.chars.toLocaleString('en-US')} chars` : 'none');
  ok('Save result (per run)', r => r.save.ok ? 'saved' : `failed: ${r.save.message}`);
  ok('Arrange result (per run)', r => r.arrangeSpiral.ok ? 'arranged' : `failed: ${r.arrangeSpiral.status}`);
  ok('Click hit a sphere (per run)', r => r.clickToCard.missed ? 'missed' : `yes (sphere ${r.clickToCard.sphereRadiusPx} px radius)`);
  ok('Page errors (per run)', r => r.pageErrors.length ? r.pageErrors.join('; ') : 'none');
  ok('Errors from the run (per run)', r => r.error || 'none');
  ok('Isolated profile written (per run)', r => (r.profileUsed || []).join(', ') || 'nothing');
}
