// Shared harness for the Electron end-to-end checks: launches the real app (real WebGL viewer and
// desktop save path) through tests/electron-launcher.cjs in an isolated profile, and drives it with
// real input events over the Chrome DevTools Protocol. Confirmation dialogs are accepted.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function checker() {
  const passed = [];
  const check = (name, condition, detail = '') => { assert.ok(condition, `${name} ${detail}`); passed.push(name); console.log(`PASS ${name}${detail ? ` (${detail})` : ''}`); };
  return { check, passed };
}

// options.dir reuses a profile folder (to test persistence across restarts); options.env adds launcher settings.
export async function launchApp(prefix, options = {}) {
  const root = path.resolve(import.meta.dirname, '..');
  const electron = createRequire(import.meta.url)('electron');
  const dir = options.dir || mkdtempSync(path.join(tmpdir(), prefix));
  const port = 9500 + Math.floor(Math.random() * 400);
  // Chromium stops producing frames for a covered window, and mouse-move and wheel input waits for a
  // frame, so keep the test window rendering even when another window (such as the real app) is on top.
  const rendering = ['--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
  const child = spawn(electron, [...rendering, `--remote-debugging-port=${port}`, path.join(root, 'tests', 'electron-launcher.cjs')], { env: { ...process.env, ...options.env, SSS_E2E_DIR: dir }, stdio: 'ignore' });
  const exited = new Promise(resolve => child.on('exit', resolve));
  let ws, seq = 0;
  const pending = new Map(), pageErrors = [], dialogs = [];
  const close = () => { ws?.close(); child.kill(); };
  try {
    let target;
    for (let i = 0; i < 150 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page' && t.url.endsWith('index.html')); } catch {} }
    assert.ok(target, 'Electron window did not start');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  } catch (error) { close(); throw error; }
  // Every request times out with its method name, so a hang is reported instead of silently ending the run.
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq, timer = setTimeout(() => { if (pending.delete(id)) reject(Error(`CDP ${method} got no reply within 20 s`)); }, 20000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
  ws.onmessage = m => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id); msg.error ? reject(Error(JSON.stringify(msg.error))) : resolve(msg.result); }
    else if (msg.method === 'Runtime.exceptionThrown') pageErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    else if (msg.method === 'Page.javascriptDialogOpening') { dialogs.push(msg.params.message); send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {}); }
  };
  ws.onclose = () => { for (const { reject } of pending.values()) reject(Error('connection closed')); pending.clear(); };
  const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  const waitFor = async (expression, timeout = 20000) => { const t = Date.now(); while (Date.now() - t < timeout) { if (await evaluate(expression)) return; await sleep(50); } throw Error(`timeout: ${expression}`); };
  await send('Runtime.enable'); await send('DOM.enable'); await send('Page.enable');
  await waitFor(`document.getElementById('counts').textContent.includes('subjects')`);

  const open = async file => { const { root: doc } = await send('DOM.getDocument'); const { nodeId } = await send('DOM.querySelector', { nodeId: doc.nodeId, selector: '#file' }); await send('DOM.setFileInputFiles', { nodeId, files: [file] }); await waitFor(`/Opened ${path.basename(file).replace(/[.]/g, '\\.')}/.test(document.getElementById('status').textContent)`); await sleep(200); };
  const setFiles = async (selector, file) => { const { root: doc } = await send('DOM.getDocument'); const { nodeId } = await send('DOM.querySelector', { nodeId: doc.nodeId, selector }); await send('DOM.setFileInputFiles', { nodeId, files: [file] }); };
  const mouse = (type, p, extra = {}) => send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, ...extra });
  const center = sel => evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()`);
  const clickAt = async (p, wait = 450) => { await mouse('mouseMoved', p); await mouse('mousePressed', p, { button: 'left', buttons: 1, clickCount: 1 }); await mouse('mouseReleased', p, { button: 'left', buttons: 0, clickCount: 1 }); await sleep(wait); };
  // Real clicks need the element on screen: scroll it into view only if it is not already (for example in the console panel).
  const click = async (sel, wait = 450) => { await evaluate(`document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({block:'nearest',inline:'nearest'});0`); const p = await center(sel); assert.ok(p, `missing ${sel}`); await clickAt(p, wait); };
  const drag = async (from, to, button = 'left', steps = 10) => {
    const buttons = button === 'left' ? 1 : 2;
    await mouse('mouseMoved', from); await mouse('mousePressed', from, { button, buttons, clickCount: 1 });
    for (let i = 1; i <= steps; i++) { await mouse('mouseMoved', { x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps }, { button, buttons }); await sleep(16); }
    await mouse('mouseReleased', to, { button, buttons: 0, clickCount: 1 }); await sleep(150);
  };
  const wheel = async (deltaY, count, p) => { for (let i = 0; i < count; i++) { await mouse('mouseWheel', p, { deltaX: 0, deltaY }); await sleep(12); } await sleep(150); };
  const keys = { ArrowRight: ['ArrowRight', 39], ArrowDown: ['ArrowDown', 40], w: ['KeyW', 87], Enter: ['Enter', 13, '\r'], Escape: ['Escape', 27], ' ': ['Space', 32, ' '], Tab: ['Tab', 9] };
  const key = async (k, repeats = 0) => {
    const [code, vk, text] = keys[k], base = { key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...base, ...(text ? { text } : {}) });
    for (let i = 0; i < repeats; i++) { await sleep(33); await send('Input.dispatchKeyEvent', { type: 'keyDown', autoRepeat: true, ...base, ...(text ? { text } : {}) }); }
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base }); await sleep(120);
  };
  const labels = () => evaluate(`[...document.querySelectorAll('#labels .node-label')].filter(e=>!e.hidden).map(e=>e.textContent.split(' · ')[0]+'@'+e.style.left+','+e.style.top+','+e.style.transform).sort().join('|')`);
  const selectedLabel = () => evaluate(`document.querySelector('#labels .node-label.selected')?.textContent.split(' · ')[0] ?? null`);
  // Screen position (page pixels) of a sphere, derived from its nameplate: the plate sits 11 world
  // units below the sphere centre and its CSS scale is pixels per world unit at the sphere's depth.
  const sphereOnScreen = name => evaluate(`(()=>{const host=document.getElementById('labels').getBoundingClientRect();const e=[...document.querySelectorAll('#labels .node-label')].find(e=>e.textContent.split(' · ')[0]===${JSON.stringify(name)});if(!e||e.hidden)return null;const scale=parseFloat((e.style.transform.match(/scale\\(([^)]+)\\)/)||[0,1])[1]);return {x:host.left+parseFloat(e.style.left),y:host.top+parseFloat(e.style.top)-11*scale,scale}})()`);
  const canvasCenter = () => evaluate(`(()=>{const r=document.getElementById('canvas').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
  // Closes the window like a user would (the unsaved-map prompt answers Close) and waits for pending writes and exit.
  const stop = async () => { try { await evaluate('window.close();0'); } catch {} await Promise.race([exited, sleep(10000)]); close(); };
  return { dir, send, evaluate, waitFor, open, setFiles, mouse, center, clickAt, click, drag, wheel, key, labels, selectedLabel, sphereOnScreen, canvasCenter, pageErrors, dialogs, stop, close };
}
