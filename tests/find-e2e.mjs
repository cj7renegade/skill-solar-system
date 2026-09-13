// End-to-end checks in the real Electron app: the Find skill box in the map tools, and collapsing
// the map tools and the subject card.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check, passed } = checker();
const app = await launchApp('sss-find-e2e-');
try {
  const { evaluate, open, click, key, selectedLabel, sphereOnScreen, canvasCenter, pageErrors } = app;
  const node = (id, name, position) => ({ id, name, domain: 'Computing', description: `${name}.`, details: '', position, pinned: false, proficiency80: null, icon: 'code', placementNote: '', layoutMode: 'saved' });
  const file = path.join(app.dir, 'find.json');
  writeFileSync(file, JSON.stringify({ schemaVersion: 1, title: 'Find test map', edges: [], nodes: [
    node('a', 'Loops and iteration', [-260, 200, 0]), node('b', 'Variables and assignment', [0, 200, 0]),
    node('c', 'Lists and dictionaries', [260, 200, 0]), node('d', 'Recursion', [0, 380, -160])] }));
  await open(file);
  await click('#home', 400);
  const type = async text => { await evaluate(`(()=>{const f=document.getElementById('find-skill');f.focus();f.value=${JSON.stringify(text)};f.dispatchEvent(new Event('input'));})()`); await sleep(250); };
  const options = () => evaluate(`[...document.querySelectorAll('#find-results button')].map(b=>b.textContent.replace('Computing','').trim()).join('|')`);
  const open_ = () => evaluate(`!document.getElementById('find-results').hidden`);
  const visible = id => evaluate(`!!document.getElementById(${JSON.stringify(id)})?.offsetParent`);

  await type('r');
  check('typing shows matching skills, those beginning with the text first', await open_() && await options() === 'Recursion|Lists and dictionaries|Loops and iteration|Variables and assignment', await options());
  await type('zzz');
  const resultsText = () => evaluate(`document.getElementById('find-results').textContent.trim()`);
  check('a query with no matches says so instead of showing stale results', await open_() && await options() === '' && await resultsText() === 'No skills found.', await resultsText());
  await type('recur');
  await key('Enter');
  await sleep(600);
  const middle = await canvasCenter(), found = await sphereOnScreen('Recursion');
  check('Enter selects the matching skill and moves the view to it', await selectedLabel() === 'Recursion' && Math.hypot(found.x - middle.x, found.y - middle.y) < 6, `${Math.round(Math.hypot(found.x - middle.x, found.y - middle.y))} px from centre`);
  check('choosing a result closes the list', !(await open_()));
  await type('loops');
  await key('Escape');
  check('Escape closes the list and clears the box', !(await open_()) && await evaluate(`document.getElementById('find-skill').value === ''`));

  // The point of a second search box: it still works when the console is hidden.
  await click('#console-toggle', 300);
  check('the console can be hidden', await evaluate(`document.body.classList.contains('console-hidden')`) && !(await visible('search')));
  await type('variab');
  await key('Enter');
  await sleep(500);
  check('Find skill still works with the console hidden', await selectedLabel() === 'Variables and assignment');
  await click('#console-toggle', 300);

  // Collapsing the map tools.
  await click('#view-tools-toggle', 300);
  check('collapsing the map tools hides the controls but keeps the handle', !(await visible('home')) && !(await visible('find-skill')) && await visible('view-tools-toggle') && await evaluate(`document.getElementById('view-tools-toggle').getAttribute('aria-expanded')==='false'`));
  await click('#view-tools-toggle', 300);
  check('expanding brings the controls back', await visible('home') && await visible('find-skill') && await evaluate(`document.getElementById('view-tools-toggle').getAttribute('aria-expanded')==='true'`));

  // Collapsing the subject card.
  check('the subject card is expanded by default', await visible('inspector-toggle') && await evaluate(`!!document.querySelector('#inspector .inspector-body')?.offsetParent`));
  const heading = () => evaluate(`document.querySelector('#inspector .subject-heading h3')?.textContent ?? ''`);
  await click('#inspector-toggle', 300);
  check('collapsing the subject card hides its body but keeps the subject name', await heading() === 'Variables and assignment' && !(await evaluate(`!!document.querySelector('#inspector .inspector-body')?.offsetParent`)));
  await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent==='Recursion').click()`); await sleep(400);
  check('the card stays collapsed when another subject is selected', await heading() === 'Recursion' && !(await evaluate(`!!document.querySelector('#inspector .inspector-body')?.offsetParent`)));
  await click('#inspector-toggle', 300);
  check('expanding the subject card brings its description and buttons back', await evaluate(`!!document.querySelector('#inspector .inspector-body')?.offsetParent && !!document.querySelector('#inspector .proficiency-controls')`));

  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  console.log(`\n${passed.length} find and collapse checks passed.`);
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally { app.close(); }
