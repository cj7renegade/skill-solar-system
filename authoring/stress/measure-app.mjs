// Measures the real app with one map, in an isolated profile, and prints one JSON line per run.
//
//   node authoring/stress/measure-app.mjs <map.json> [--runs 3] [--label name]
//
// Every run launches Electron through tests/electron-launcher.cjs with a new temporary folder as its
// user-data directory (so the real %APPDATA%\skill-solar-system is never read or written) and its
// save dialog replaced by a fixed path in that folder. Maps are read only from outside the
// repository and outside OneDrive. The test harness (tests/e2e-harness.mjs) gives up after 20 s per
// step, which a large map can exceed, so this script speaks the same debug protocol with longer
// timeouts and reports slowness as a number instead of failing.
//
// Timings are taken inside the page (performance.now) from the triggering event to the moment the
// result is on screen, and "first frame" waits two animation frames so the frame has been painted.
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, existsSync, statSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const inside = (parent, child) => { const r = path.relative(path.resolve(parent), path.resolve(child)); return !r.startsWith('..') && !path.isAbsolute(r); };

export function checkMapPath(file) {
  const resolved = path.resolve(file);
  if (inside(ROOT, resolved)) throw Error(`Refusing to open a map inside the repository (real maps live there): ${resolved}`);
  if (process.env.OneDrive && inside(process.env.OneDrive, resolved)) throw Error(`Refusing to open a map inside OneDrive: ${resolved}`);
  if (process.env.APPDATA && inside(process.env.APPDATA, resolved)) throw Error(`Refusing to open a map inside APPDATA: ${resolved}`);
  if (!existsSync(resolved)) throw Error(`No such map file: ${resolved}`);
  return resolved;
}

async function launch() {
  const electron = createRequire(import.meta.url)('electron');
  const dir = mkdtempSync(path.join(tmpdir(), 'sss-capacity-'));
  if (process.env.APPDATA && inside(process.env.APPDATA, dir)) throw Error('Temporary folder is inside APPDATA.');
  const port = 9100 + Math.floor(Math.random() * 800);
  const flags = ['--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
  const child = spawn(electron, [...flags, `--remote-debugging-port=${port}`, path.join(ROOT, 'tests', 'electron-launcher.cjs')], { env: { ...process.env, SSS_E2E_DIR: dir }, stdio: 'ignore' });
  const exited = new Promise(r => child.on('exit', r));
  let target;
  for (let i = 0; i < 300 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page' && t.url.endsWith('index.html')); } catch {} }
  if (!target) { child.kill(); throw Error('Electron window did not start within 60 s'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map(), pageErrors = [];
  const send = (method, params = {}, timeout = 600000) => new Promise((resolve, reject) => {
    const id = ++seq, timer = setTimeout(() => { if (pending.delete(id)) reject(Error(`${method} got no reply within ${timeout / 1000} s`)); }, timeout);
    pending.set(id, { resolve: v => { clearTimeout(timer); resolve(v); }, reject: e => { clearTimeout(timer); reject(e); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
  ws.onmessage = m => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(Error(JSON.stringify(msg.error))) : p.resolve(msg.result); }
    else if (msg.method === 'Runtime.exceptionThrown') pageErrors.push(String(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text).slice(0, 300));
    else if (msg.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
  };
  ws.onclose = () => { for (const p of pending.values()) p.reject(Error('connection closed')); pending.clear(); };
  const evaluate = async (expression, timeout) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, timeout); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };
  await send('Runtime.enable'); await send('Page.enable'); await send('DOM.enable');
  for (let t = Date.now(); Date.now() - t < 60000;) { if (await evaluate(`document.getElementById('counts')?.textContent.includes('subjects')`)) break; await sleep(100); }
  const stop = async () => { try { await evaluate('window.close();0', 5000); } catch {} await Promise.race([exited, sleep(15000)]); try { ws.close(); } catch {} child.kill(); await sleep(500); try { rmSync(dir, { recursive: true, force: true }); } catch {} };
  return { send, evaluate, dir, pid: child.pid, pageErrors, stop };
}

// Private memory of the app's main process and every process it started (renderer, GPU, utility).
function processMemoryMB(rootPid) {
  const script = `$all=Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId,WorkingSetSize,PrivatePageCount;$ids=@(${rootPid});do{$n=$ids.Count;$ids=@($ids+($all|Where-Object{$ids -contains $_.ParentProcessId}|ForEach-Object ProcessId)|Select-Object -Unique)}while($ids.Count -gt $n);$p=$all|Where-Object{$ids -contains $_.ProcessId};'{0} {1} {2}' -f $p.Count,(($p|Measure-Object PrivatePageCount -Sum).Sum/1MB),(($p|Measure-Object WorkingSetSize -Sum).Sum/1MB)`;
  const [count, priv, ws] = execFileSync('powershell', ['-NoProfile', '-Command', script], { encoding: 'utf8' }).trim().split(/\s+/).map(Number);
  return { processes: count, privateMB: Math.round(priv), workingSetMB: Math.round(ws) };
}

const FRAME = 'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(performance.now()))))';
const percentile = (values, p) => { const s = [...values].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const round = v => v == null ? null : Math.round(v * 10) / 10;

async function orbit(app, seconds = 10) {
  const box = await app.evaluate(`(()=>{const r=document.querySelector('#canvas canvas').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,r:Math.min(r.width,r.height)/5};})()`);
  await app.evaluate(`window.__frames=[];window.__rec=true;(()=>{let last;const f=t=>{if(last!==undefined)__frames.push(t-last);last=t;if(__rec)requestAnimationFrame(f);};requestAnimationFrame(f);})();0`);
  const mouse = (type, x, y, extra = {}) => app.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', ...extra });
  await mouse('mousePressed', box.x + box.r, box.y, { buttons: 1, clickCount: 1 });
  let moves = 0; const started = Date.now();
  while (Date.now() - started < seconds * 1000) {
    const a = (Date.now() - started) / 1000 * Math.PI; // half a turn of the pointer per second
    await mouse('mouseMoved', box.x + Math.cos(a) * box.r, box.y + Math.sin(a) * box.r * 0.4, { buttons: 1 });
    moves++;
  }
  const elapsed = (Date.now() - started) / 1000;
  await mouse('mouseReleased', box.x, box.y, { buttons: 0, clickCount: 1 });
  const frames = await app.evaluate(`(()=>{__rec=false;return __frames;})()`);
  const median = percentile(frames, 0.5), worst = percentile(frames, 0.95);
  return { seconds: round(elapsed), frames: frames.length, medianFrameMs: round(median), worst5pctFrameMs: round(worst), medianFps: round(1000 / median), worst5pctFps: round(1000 / worst), pointerMovesHandledPerSecond: round(moves / elapsed) };
}

export async function measureOnce(file, { labelsOffOrbit = true } = {}) {
  const app = await launch(), result = { file: path.basename(file), profile: app.dir };
  try {
    await app.evaluate(`window.confirm=()=>true;window.__t={};window.addEventListener('change',e=>{if(e.target.id==='file')__t.openStart=performance.now();},true);window.addEventListener('pointerup',()=>{__t.clickStart=performance.now();},true);0`);
    // Open
    await app.evaluate(`window.__opened=new Promise(res=>{const st=document.getElementById('status');const o=new MutationObserver(()=>{const tx=st.textContent;if(/^Opened |^Could not open map/.test(tx)){o.disconnect();const at=performance.now();${FRAME}.then(f=>res({text:tx,status:at,frame:f}));}});o.observe(st,{childList:true,characterData:true,subtree:true});});0`);
    const { root } = await app.send('DOM.getDocument');
    const { nodeId } = await app.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#file' });
    await app.send('DOM.setFileInputFiles', { nodeId, files: [file] });
    const opened = await app.evaluate(`window.__opened.then(o=>({...o,start:__t.openStart}))`);
    result.open = { message: opened.text.slice(0, 200), ok: opened.text.startsWith('Opened '), toStatusMs: round(opened.status - opened.start), toFirstFrameMs: round(opened.frame - opened.start) };
    if (!result.open.ok) return result;
    result.counts = await app.evaluate(`document.getElementById('counts').textContent`);
    await sleep(1500);
    const heap = await app.send('Runtime.getHeapUsage');
    result.memoryAfterOpen = { jsHeapUsedMB: Math.round(heap.usedSize / 1048576), ...processMemoryMB(app.pid) };
    result.draftAfterOpen = await app.evaluate(`(()=>{const d=localStorage.getItem('skill-solar-system-v1');return {stored:!!d,chars:d?d.length:0,isThisMap:!!d&&d.slice(0,300).includes(${JSON.stringify('"title":')})&&d.slice(0,300).includes(document.getElementById('map-name').textContent.slice(0,25))};})()`);
    // Orbit, with labels on (the default) and once with labels off
    result.orbitLabelsOn = await orbit(app);
    if (labelsOffOrbit) {
      await app.evaluate(`document.getElementById('show-labels').click();0`);
      result.orbitLabelsOff = await orbit(app);
      await app.evaluate(`document.getElementById('show-labels').click();0`);
    }
    await app.evaluate(FRAME);
    // Click a sphere: the visible nameplate with the largest scale marks the nearest sphere's centre.
    const pick = await app.evaluate(`(()=>{const host=document.getElementById('labels').getBoundingClientRect(),c=document.querySelector('#canvas canvas').getBoundingClientRect();let best=null;
      for(const el of document.querySelectorAll('#labels .node-label')){if(el.hidden)continue;const s=Number((el.style.transform.match(/scale\\(([^)]+)\\)/)||[])[1]);const x=host.left+parseFloat(el.style.left),y=host.top+parseFloat(el.style.top)-11*s;
        if(!(s>0)||x<c.left+20||x>c.right-20||y<c.top+20||y>c.bottom-20)continue;if(!best||s>best.s)best={s,x,y,name:el.textContent.replace(/ · pinned$/,'')};}return best;})()`);
    if (pick) {
      await app.evaluate(`window.__card=new Promise(res=>{const ins=document.getElementById('inspector');const o=new MutationObserver(()=>{if(ins.querySelector('h3')?.textContent===${JSON.stringify(pick.name)}){o.disconnect();const at=performance.now();${FRAME}.then(f=>res({shown:at,frame:f}));}});o.observe(ins,{childList:true,subtree:true,characterData:true});});0`);
      await app.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pick.x, y: pick.y });
      await app.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pick.x, y: pick.y, button: 'left', buttons: 1, clickCount: 1 });
      await app.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pick.x, y: pick.y, button: 'left', buttons: 0, clickCount: 1 });
      const card = await Promise.race([app.evaluate(`window.__card.then(c=>({...c,start:__t.clickStart}))`), sleep(120000).then(() => null)]);
      result.clickToCard = card ? { sphereRadiusPx: round(8 * pick.s), toCardMs: round(card.shown - card.start), toFirstFrameMs: round(card.frame - card.start) } : { sphereRadiusPx: round(8 * pick.s), missed: true };
      await sleep(600); // the camera turns toward the sphere for 320 ms
    } else result.clickToCard = { missed: true, reason: 'no nameplate inside the canvas' };
    // Search: the Find skill box and the console list filter, both with the query "e"
    const search = id => app.evaluate(`(async()=>{const el=document.getElementById('${id}');const t0=performance.now();el.value='e';el.dispatchEvent(new Event('input',{bubbles:true}));const t1=performance.now();const f=await ${FRAME};const out={handlerMs:t1-t0,toFrameMs:f-t0};el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));await ${FRAME};return out;})()`);
    const find = await search('find-skill'), list = await search('search');
    result.search = { findBoxMs: round(find.toFrameMs), findBoxHandlerMs: round(find.handlerMs), listFilterMs: round(list.toFrameMs), listFilterHandlerMs: round(list.handlerMs) };
    // Arrange level spiral (edit mode only), measured from the click to the next painted frame
    const arrange = await app.evaluate(`(async()=>{const edit=document.getElementById('edit-mode');const e0=performance.now();edit.click();await ${FRAME};const e1=performance.now();
      const t0=performance.now();document.getElementById('vortex').click();const t1=performance.now();const f=await ${FRAME};const status=document.getElementById('status').textContent;
      edit.click();await ${FRAME};return {editModeOnMs:e1-e0,handlerMs:t1-t0,toFrameMs:f-t0,status};})()`);
    result.arrangeSpiral = { ok: /^Spiral arranged/.test(arrange.status), toFrameMs: round(arrange.toFrameMs), handlerMs: round(arrange.handlerMs), editModeOnMs: round(arrange.editModeOnMs), status: arrange.status.slice(0, 160) };
    result.draftAfterArrange = await app.evaluate(`(()=>{const d=localStorage.getItem('skill-solar-system-v1');return {stored:!!d,chars:d?d.length:0};})()`);
    // Save through the real desktop bridge; the isolated launcher writes to <profile>/saved.json
    const save = await app.evaluate(`new Promise(res=>{const st=document.getElementById('status');const o=new MutationObserver(()=>{const tx=st.textContent;if(/^Map saved to file|^Save failed|^Save canceled/.test(tx)){o.disconnect();const at=performance.now();${FRAME}.then(f=>res({text:tx,status:at,frame:f,start:t0}));}});o.observe(st,{childList:true,characterData:true,subtree:true});const t0=performance.now();document.getElementById('save').click();})`);
    const saved = path.join(app.dir, 'saved.json');
    result.save = { ok: save.text.startsWith('Map saved'), message: save.text.slice(0, 200), toStatusMs: round(save.status - save.start), bytes: existsSync(saved) ? statSync(saved).size : null };
    // Start a review: open the dialog, then begin with unmarked skills
    const review = await app.evaluate(`(async()=>{const t0=performance.now();document.getElementById('mark-proficiency').click();await ${FRAME};const t1=performance.now();
      const b=document.getElementById('review-unmarked');if(!b)return {error:'no unmarked button'};b.click();const t2=performance.now();await ${FRAME};const t3=performance.now();
      const title=document.getElementById('review-title')?.textContent;const s=localStorage.getItem('skill-solar-system-review-v1');document.getElementById('review-pause')?.click();await ${FRAME};
      return {openDialogMs:t1-t0,beginHandlerMs:t2-t1,beginToFrameMs:t3-t1,totalMs:t3-t0,started:!!title&&title!=='Mark proficiency',sessionStoreChars:s?s.length:0};})()`);
    result.review = Object.fromEntries(Object.entries(review).map(([k, v]) => [k, typeof v === 'number' ? round(v) : v]));
    const heapEnd = await app.send('Runtime.getHeapUsage');
    result.memoryAtEnd = { jsHeapUsedMB: Math.round(heapEnd.usedSize / 1048576), ...processMemoryMB(app.pid) };
    result.profileUsed = existsSync(path.join(app.dir, 'userdata')) ? readdirSync(path.join(app.dir, 'userdata')).filter(n => /Local Storage|proficiency/.test(n)) : [];
  } catch (error) {
    result.error = String(error.message || error).slice(0, 400);
  } finally {
    result.pageErrors = app.pageErrors.slice(0, 5);
    await app.stop();
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = checkMapPath(process.argv[2]);
  const option = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
  const runs = Number(option('runs', 3)), label = option('label', path.basename(file));
  for (let run = 1; run <= runs; run++) {
    const started = Date.now(), result = await measureOnce(file);
    console.log(JSON.stringify({ label, run, wallSeconds: Math.round((Date.now() - started) / 1000), ...result }));
    if (!result.open?.ok) break; // a rejected map is rejected the same way every time
  }
}
