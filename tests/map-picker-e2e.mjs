// Electron check for the "Your maps" dropdown, against a temporary Maps folder (never the real one).
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const maps = mkdtempSync(path.join(tmpdir(), 'sss-picker-maps-'));
const node = (id, name, x) => ({ id, name, domain: 'Robotics', description: `${name}.`, position: [x, 0, 0], pinned: false, proficiency80: null });
const put = (relative, title, nodes) => { mkdirSync(path.dirname(path.join(maps, relative)), { recursive: true }); writeFileSync(path.join(maps, relative), JSON.stringify({ schemaVersion: 1, title, nodes, edges: [], metadata: { atlasFamily: 'picker-e2e-test' } }, null, 2)); };
put('Picker-Master.json', 'Picker master map', [node('a', 'Alpha', 0), node('b', 'Beta', 60), node('c', 'Gamma', 120)]);
put('Curriculum/Picker-Curriculum.json', 'Picker curriculum map', [node('x', 'Xi', 0), node('y', 'Ypsilon', 60)]);
put('Archived maps/Stale.json', 'Stale archived map', [node('s', 'Stale', 0)]);

const { check } = checker();
const app = await launchApp('sss-picker-', { env: { SSS_MAPS_DIR: maps } });
try {
  const { evaluate, waitFor, pageErrors } = app;
  await waitFor(`!document.getElementById('map-picker').hidden`);
  const options = await evaluate(`[...document.querySelectorAll('#map-picker option')].map(o=>({value:o.value,text:o.textContent}))`);
  check('the dropdown offers the working maps, top level first', options.map(o => o.value).join('|') === '|Picker-Master.json|Curriculum/Picker-Curriculum.json', options.map(o => o.value).join(', '));
  check('each map is shown by its title and its place in the Maps folder', options[2].text === 'Picker curriculum map — Curriculum/Picker-Curriculum.json', options[2].text);
  check('archived maps are never offered', !options.some(o => /Stale|Archived/.test(o.value + o.text)));

  const choose = value => evaluate(`(()=>{const p=document.getElementById('map-picker');p.value=${JSON.stringify(value)};p.dispatchEvent(new Event('change'));})()`);
  await choose('Curriculum/Picker-Curriculum.json');
  await waitFor(`/^Opened Picker-Curriculum\\.json/.test(document.getElementById('status').textContent)`);
  check('choosing a map opens it', await evaluate(`document.getElementById('counts').textContent`) === '2 subjects / 0 connections' && await evaluate(`document.getElementById('map-name').textContent`) === 'Picker curriculum map');
  check('the dropdown returns to its prompt, so the same map can be chosen again', await evaluate(`document.getElementById('map-picker').value`) === '');

  await choose('Picker-Master.json');
  await waitFor(`/^Opened Picker-Master\\.json/.test(document.getElementById('status').textContent)`);
  check('another map replaces it', await evaluate(`document.getElementById('counts').textContent`) === '3 subjects / 0 connections');

  // A forged request for a file the list does not offer is refused by the desktop side.
  const refused = await evaluate(`window.desktop.maps.read('Archived maps/Stale.json').then(()=>'read',e=>String(e.message))`);
  check('a map outside the list cannot be read', /not in the Maps folder list/.test(refused), refused);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join('\n'));
  await sleep(50);
} finally { await app.stop(); }
console.log('\nMap picker checks passed.');
