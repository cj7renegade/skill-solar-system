// Electron checks for right-click deselection: a right-click clears the selection and keeps the view;
// a right-drag still pans and keeps the selection.
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check } = checker();
const app = await launchApp('sss-deselect-');
try {
  const { evaluate, send, pageErrors } = app;
  const selectedName = () => evaluate(`document.querySelector('#inspector h3')?.textContent ?? null`);
  const empty = () => evaluate(`!!document.querySelector('#inspector .empty')`);
  const labelAt = name => evaluate(`(()=>{const l=[...document.querySelectorAll('#labels .node-label')].find(e=>e.textContent.startsWith(${JSON.stringify(name)}));return l?l.style.left+','+l.style.top:null;})()`);
  const canvas = await evaluate(`(()=>{const r=document.querySelector('#canvas canvas').getBoundingClientRect();return {x:r.left+r.width*0.15,y:r.top+r.height*0.2};})()`);
  const right = async (dx = 0) => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: canvas.x, y: canvas.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: canvas.x, y: canvas.y, button: 'right', buttons: 2, clickCount: 1 });
    for (let k = 1; k <= 6 && dx; k++) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: canvas.x + dx * k / 6, y: canvas.y, button: 'right', buttons: 2 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: canvas.x + dx, y: canvas.y, button: 'right', buttons: 0, clickCount: 1 });
    await sleep(300);
  };
  const select = async name => { await evaluate(`[...document.querySelectorAll('.node-item')].find(b=>b.textContent===${JSON.stringify(name)}).click()`); await sleep(500); };

  await select('Algebra');
  check('a skill is selected to begin with', await selectedName() === 'Algebra');
  const other = await labelAt('Robot integration');
  await right();
  check('a right-click clears the selection', await empty(), String(await selectedName()));
  check('the view stays where it was (no fit, no camera jump)', await labelAt('Robot integration') === other, `${other} -> ${await labelAt('Robot integration')}`);

  await select('Algebra');
  const before = await labelAt('Robot integration');
  await right(80);
  check('a right-drag keeps the selection', await selectedName() === 'Algebra');
  check('a right-drag still pans the view', await labelAt('Robot integration') !== before, `${before} -> ${await labelAt('Robot integration')}`);

  await right();
  const status = await evaluate(`document.getElementById('status').textContent`);
  await right();
  check('a right-click with nothing selected changes nothing', await empty() && await evaluate(`document.getElementById('status').textContent`) === status);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join('\n'));
} finally { await app.stop(); }
console.log('\nRight-click deselection checks passed.');
