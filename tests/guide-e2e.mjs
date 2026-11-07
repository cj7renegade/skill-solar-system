// Electron checks for the AI Guide with a scripted Claude client (tests/electron-launcher.cjs, so no
// request leaves the computer): the header indicator in each state, saving a key, a question that
// uses a read-only tool and answers with skill links, the links flying to a skill and opening a path,
// the automatic disconnect when the connection drops (while the rest of the app keeps working
// offline) and the automatic reconnect, and that no answer is ever changed by the Guide.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { launchApp, checker, sleep } from './e2e-harness.mjs';

const { check } = checker();
const node = (id, name, extra = {}) => ({ id, name, domain: 'Robotics', description: `About ${name}.`, pinned: false, position: [0, 0, 0], proficiency80: null, ...extra });
const map = {
  schemaVersion: 1, title: 'Guide test map',
  nodes: [node('g-a', 'Gear basics', { position: [-20, 0, 0] }), node('g-b', 'Motor basics', { position: [20, 0, 0] }), node('g-c', 'Drive trains', { position: [0, 20, 0] }),
    node('g-m', 'First milestone', { nodeKind: 'milestone', position: [0, 40, 0] })],
  edges: [{ source: 'g-a', target: 'g-c', type: 'prerequisite' }, { source: 'g-b', target: 'g-c', type: 'prerequisite' }, { source: 'g-c', target: 'g-m', type: 'prerequisite' }]
};

const app = await launchApp('sss-guide-', { env: { SSS_GUIDE_FAKE: '1', ANTHROPIC_API_KEY: '' } });
const net = up => writeFileSync(path.join(app.dir, 'guide-net.json'), JSON.stringify({ up }));
const requests = () => existsSync(path.join(app.dir, 'guide-requests.jsonl')) ? readFileSync(path.join(app.dir, 'guide-requests.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
try {
  const { evaluate, click, open, waitFor, pageErrors } = app;
  const pill = () => evaluate(`(()=>{const p=document.getElementById('guide-state');return {text:p.textContent,state:p.dataset.state};})()`);
  const file = path.join(app.dir, 'Guide-Test.json');
  writeFileSync(file, JSON.stringify(map));
  await open(file);
  const answers = () => evaluate(`JSON.stringify(JSON.parse(localStorage.getItem('skill-solar-system-v1')).nodes.map(n=>n.proficiency80))`);
  const before = await answers();

  check('with no key, the header says Offline and the Guide is off', (await pill()).text === '● Offline' && (await pill()).state === 'off', JSON.stringify(await pill()));
  check('the page itself still has no network access', /connect-src 'none'/.test(await evaluate(`document.querySelector('meta[http-equiv="Content-Security-Policy"]').content`)));
  await click('#guide-button', 300);
  check('the Guide button opens the panel, at Settings when there is no key', await evaluate(`!document.getElementById('guide-panel').hidden && !document.getElementById('guide-settings').hidden`));
  check('the off banner says the rest of the app works offline', /works offline/.test(await evaluate(`document.getElementById('guide-banner').textContent`)));
  check('the input is disabled while the Guide is off', await evaluate(`document.getElementById('guide-input').disabled && document.getElementById('guide-send').disabled`));

  await evaluate(`document.getElementById('guide-key').value='not-a-key';0`);
  await click('#guide-save-key', 300);
  check('a malformed key is refused with a plain message', /does not look like an Anthropic API key/.test(await evaluate(`document.getElementById('guide-settings-message').textContent`)));
  await evaluate(`document.getElementById('guide-key').value='sk-ant-api03-${'t'.repeat(40)}';0`);
  await click('#guide-save-key', 300);
  await waitFor(`document.getElementById('guide-state').dataset.state==='online'`);
  check('saving a key connects: the header says Guide online', (await pill()).text === '● Guide online');
  check('the key field is cleared and the key is stored only in encrypted form', await evaluate(`document.getElementById('guide-key').value===''`) && !readFileSync(path.join(app.dir, 'userdata', 'guide', 'api-key.bin')).includes('sk-ant-'));
  check('usage starts at zero against the default $10 limit', /about \$0\.00 of your \$10\.00 limit · 0 requests/.test(await evaluate(`document.getElementById('guide-usage').textContent`)), await evaluate(`document.getElementById('guide-usage').textContent`));
  await click('#guide-settings-toggle', 200);

  check('starter questions are offered in a new conversation', await evaluate(`document.querySelectorAll('#guide-starters .guide-starter').length`) === 4);
  await click('#guide-starters .guide-starter', 100);
  check('while it answers, Stop replaces Send', await evaluate(`!document.getElementById('guide-stop').hidden && document.getElementById('guide-send').hidden`));
  await waitFor(`document.querySelector('#guide-log .guide-reply .guide-link')`);
  const reply = await evaluate(`(()=>{const r=[...document.querySelectorAll('#guide-log .guide-reply')].pop();return {text:r.textContent,skills:[...r.querySelectorAll('.guide-skill')].map(b=>b.dataset.id),paths:[...r.querySelectorAll('.guide-path')].map(b=>b.dataset.id),items:r.querySelectorAll('li').length};})()`);
  check('the answer uses the next-up lookup and links an entry skill', reply.skills.length === 1 && ['g-a', 'g-b'].includes(reply.skills[0]), JSON.stringify(reply));
  check('lists and a path link render from the reply format', reply.items === 2 && reply.paths[0] === 'g-m');
  const sent = requests();
  check('two model turns were sent: the question, then the tool result', sent.length === 2 && sent[1].messages.at(-1).content[0].type === 'tool_result');
  check('each question carries the app state with the target', /Target milestone: First milestone \(id g-m\)/.test(sent[0].messages[0].content[0].text));
  check('the request uses Claude Opus 5.5 with the read-only tools', sent[0].model === 'claude-opus-5-5' && sent[0].tools.map(t => t.name).join(',') === 'get_overview,search_skills,get_skill,path_to,next_up,course_summary,recent_answers');
  check('the thinking block goes back unchanged', sent[1].messages[1].content[0].signature === 'fake');
  check('usage is counted after the answer', / · 2 requests/.test(await evaluate(`document.getElementById('guide-usage').textContent`)));

  await click(`#guide-log .guide-skill`, 500);
  check('a skill link selects the skill', await evaluate(`document.querySelector('#inspector h3')?.textContent`) === map.nodes.find(n => n.id === reply.skills[0]).name);
  await click(`#guide-log .guide-path`, 500);
  check('a path link opens path mode', await evaluate(`document.getElementById('path-mode').getAttribute('aria-pressed')`) === 'true');
  await evaluate(`document.getElementById('exit-path').click();0`);

  // The connection drops: the next question finds it, the Guide disconnects, the app carries on.
  net(false);
  await evaluate(`document.getElementById('guide-input').value='Plan my week';0`);
  await click('#guide-send', 100);
  await waitFor(`document.getElementById('guide-state').dataset.state==='disconnected'`);
  check('losing the connection switches to Offline · Guide disconnected by itself', (await pill()).text === '● Offline · Guide disconnected');
  check('the panel explains that everything else keeps working offline', /keeps working offline/.test(await evaluate(`document.getElementById('guide-banner').textContent`)));
  check('the failed question says so, and the conversation is kept', /No connection to Claude/.test(await evaluate(`[...document.querySelectorAll('#guide-log .guide-reply')].pop().textContent`)) && await evaluate(`document.querySelectorAll('#guide-log .guide-msg').length`) === 4);
  check('the input waits for the connection', await evaluate(`document.getElementById('guide-input').disabled`));
  await click('#guide-close', 200);
  await click('#home', 200);
  await evaluate(`document.querySelector('.node-item')?.click();0`);
  check('the map, list and card keep working while the Guide is disconnected', await evaluate(`!!document.querySelector('#inspector h3')`) && (await pill()).state === 'disconnected');
  await click('#guide-button', 200);
  check('Try now while still offline stays disconnected', (await (async () => { await click('#guide-retry', 400); return pill(); })()).state === 'disconnected');

  net(true);
  await click('#guide-retry', 400);
  await waitFor(`document.getElementById('guide-state').dataset.state==='online'`);
  check('when the connection returns the Guide is online again, and the input is ready', (await pill()).text === '● Guide online' && !(await evaluate(`document.getElementById('guide-input').disabled`)));

  await click('#guide-settings-toggle', 200);
  await click('#guide-enabled', 300);
  check('turning the Guide off keeps HelixSkill fully offline', (await pill()).state === 'off');
  await click('#guide-enabled', 300);
  await waitFor(`document.getElementById('guide-state').dataset.state==='online'`);
  await evaluate(`document.getElementById('guide-limit').value='1';0`);
  await click('#guide-save-limit', 300);
  check('the monthly limit is saved', /of your \$1\.00 limit/.test(await evaluate(`document.getElementById('guide-usage').textContent`)));
  await app.key('Escape'); await app.key('Escape');
  check('Escape closes Settings, then the panel', await evaluate(`document.getElementById('guide-panel').hidden`));

  check('the Guide never changed an answer', await answers() === before);
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join('\n'));
} finally { await app.stop(); }
console.log('\nGuide checks passed.');
