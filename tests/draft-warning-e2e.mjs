// Electron check: when the draft cannot be stored, the status line keeps saying so after Open map,
// an edit, Undo and Redo, instead of the next message hiding it. Storage failure is simulated inside
// the isolated profile; nothing real is touched.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check } = checker();
const app = await launchApp('sss-draft-warning-');
try {
  const { evaluate, open, click, pageErrors } = app;
  const status = () => evaluate(`document.getElementById('status').textContent`);
  const warned = async () => /Draft cache unavailable: save the map to a JSON file now\./.test(await status());
  const node = (id, name, x) => ({ id, name, domain: 'Robotics', description: `${name}.`, position: [x, 0, 0], pinned: false, proficiency80: null });
  const file = path.join(app.dir, 'small-map.json');
  writeFileSync(file, JSON.stringify({ schemaVersion: 1, title: 'Draft warning map', nodes: [node('a', 'Alpha', 0), node('b', 'Beta', 60)], edges: [] }));
  // Make every draft write fail, as a full browser storage would.
  await evaluate(`(()=>{const set=Storage.prototype.setItem;window.__restoreStorage=()=>{Storage.prototype.setItem=set};Storage.prototype.setItem=function(k,v){if(k==='skill-solar-system-v1')throw new DOMException('Quota exceeded','QuotaExceededError');return set.call(this,k,v);};})()`);

  await open(file);
  check('after opening a map, the warning stays visible beside "Opened"', /^Opened small-map\.json\./.test(await status()) && await warned(), await status());
  await click('#edit-mode', 300);
  await click('#add-node', 300);
  check('after an edit, the warning is shown', await warned(), await status());
  await click('#undo', 400);
  check('after Undo, the warning stays visible', /^Previous map restored\./.test(await status()) && await warned(), await status());
  await click('#redo', 400);
  check('after Redo, the warning stays visible', /^Change redone\./.test(await status()) && await warned(), await status());

  await evaluate('window.__restoreStorage()');
  await click('#undo', 400);
  check('once storage works again, the warning disappears', /^Previous map restored\./.test(await status()) && !(await warned()), await status());
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join('\n'));
  await sleep(50);
} finally { await app.stop(); }
console.log('\nDraft warning checks passed.');
