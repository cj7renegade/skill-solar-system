// Electron checks for the guided tour: the button, every step, the highlight, closing, and that the
// map still answers to the mouse while the tour is open.
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check } = checker();
const app = await launchApp('sss-tour-');
try {
  const { evaluate, click, key, pageErrors } = app;
  const state = () => evaluate(`(()=>{const c=document.querySelector('.tour-card'),r=document.querySelector('.tour-ring'),b=c?.getBoundingClientRect();
    return {open:!!c&&!c.hidden,count:c?.querySelector('.tour-count')?.textContent,title:c?.querySelector('h2')?.textContent,ring:!!r&&!r.hidden,
      inside:!!b&&b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,expanded:document.getElementById('tour-button').getAttribute('aria-expanded')};})()`);
  const rect = sel => evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);

  const button = await rect('#tour-button');
  check('the Tour button sits in the top left of the window', button.x < 400 && button.y < 90, `${Math.round(button.x)}, ${Math.round(button.y)}`);
  check('until it is opened, the button glows to invite a first look', await evaluate(`document.getElementById('tour-button').classList.contains('unseen')`));

  await click('#tour-button', 300);
  let s = await state();
  check('the button opens the tour at its first step', s.open && /1 of \d+/.test(s.count) && s.expanded === 'true', s.count);
  check('opening it once stops the glow and is remembered', !(await evaluate(`document.getElementById('tour-button').classList.contains('unseen')`)) && await evaluate(`localStorage.getItem('skill-solar-system-tour-seen-v1')`) === '1');
  const total = Number(s.count.match(/of (\d+)/)[1]);

  const titles = [s.title];
  for (let i = 2; i <= total; i++) {
    await click('#tour-next', 250);
    s = await state();
    titles.push(s.title);
    check(`step ${i} shows inside the window`, s.open && s.count.includes(`${i} of ${total}`) && s.inside, `${s.title}`);
    if (i > 1) check(`step ${i} highlights the part of the screen it describes`, s.ring, s.title);
    if (s.title === 'Rotate the view') {
      // The tour never blocks the map: a drag on the canvas still turns the view.
      const before = await evaluate(`document.querySelector('#labels .node-label')?.style.left`);
      const c = await rect('#canvas'); const at = { x: c.x + 200, y: c.y + 120 };
      await app.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', buttons: 1, clickCount: 1 });
      for (let k = 1; k <= 8; k++) await app.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x + k * 15, y: at.y, button: 'left', buttons: 1 });
      await app.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x + 120, y: at.y, button: 'left', buttons: 0, clickCount: 1 });
      await sleep(150);
      check('the map still turns while the tour is open', (await evaluate(`document.querySelector('#labels .node-label')?.style.left`)) !== before && (await state()).open);
    }
  }
  check('the steps cover moving, finding, the console, answers, review, maps and good habits', ['Rotate the view', 'Zoom and travel', 'Pan sideways', 'Pick a skill', 'Map tools', 'The console', 'Your own answers', 'Guided review', 'Opening and saving maps', 'Using it well'].every(t => titles.includes(t)), titles.join(' | '));
  check('the last step offers Finish', await evaluate(`document.getElementById('tour-next').textContent`) === 'Finish');

  await click('#tour-back', 200);
  check('Back returns to the previous step', (await state()).count.includes(`${total - 1} of ${total}`));
  await key('Escape');
  s = await state();
  check('Escape closes the tour and leaves the button ready', !s.open && !s.ring && s.expanded === 'false');

  await click('#tour-button', 300);
  check('the tour can be opened again at any time', (await state()).open);
  await click('#tour-close', 200);
  check('Close ends it', !(await state()).open);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join('\n'));
} finally { await app.stop(); }
console.log('\nTour checks passed.');
