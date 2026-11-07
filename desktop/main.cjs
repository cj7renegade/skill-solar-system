const { app, BrowserWindow, session, ipcMain, dialog, safeStorage, net } = require('electron');
const path = require('node:path');
const { writeFileAtomic } = require('./save.cjs');
const { createProficiencyStore } = require('./proficiency-store.cjs');
const { listMaps, readMap } = require('./map-library.cjs');
const { createGuide } = require('./guide.cjs');
const { createLessons } = require('./lessons.cjs');
// The same id as build.appId, so a pinned taskbar shortcut and the running window share one button.
app.setAppUserModelId('local.skillsolarsystem.atlas');
// The folder the "Your maps" dropdown lists. Tests point it at their own folder.
const MAPS_DIR = process.env.SSS_MAPS_DIR || path.join(__dirname, '..', 'Maps');
// The largest map that can be saved: the same as LIMITS.mapBytes in src/model.js (checked by tests/limits.test.mjs).
const MAX_MAP_BYTES = 150_000_000;
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
let win;
// Writes in progress (map saves and shared proficiency) finish before the app quits, so closing
// during a save cannot leave a partial file.
const pending = new Set();
const track = promise => { pending.add(promise); promise.then(() => pending.delete(promise), () => pending.delete(promise)); return promise; };
app.on('before-quit', event => { if (pending.size) { event.preventDefault(); Promise.allSettled([...pending]).then(() => app.quit()); } });
app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*'] }, (_, done) => done({ cancel: true }));
  session.defaultSession.setPermissionRequestHandler((_, __, done) => done(false));
  win = new BrowserWindow({ width: 1500, height: 960, minWidth: 1000, minHeight: 680, backgroundColor: '#080e19', autoHideMenuBar: true, icon: path.join(__dirname, 'icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.webContents.on('will-prevent-unload', event => {
    const choice = dialog.showMessageBoxSync(win, { type: 'question', buttons: ['Keep editing', 'Close'], defaultId: 0, cancelId: 0, title: 'Unsaved map', message: 'Close without saving a JSON copy?', detail: 'The local draft may be recovered next time, but it is not a backup.' });
    if (choice === 1) event.preventDefault();
  });
  const fromWindow = event => event.sender === win.webContents;
  ipcMain.handle('save-map', async (event, content, options = {}) => {
    if (!fromWindow(event) || typeof content !== 'string' || Buffer.byteLength(content) > MAX_MAP_BYTES) throw Error('Invalid save request.');
    const record = options?.kind === 'record';
    const defaultPath = typeof options?.defaultName === 'string' && /^[\w.-]{1,120}$/.test(options.defaultName) ? options.defaultName : 'Skill-Solar-System.json';
    const result = await dialog.showSaveDialog(win, { defaultPath, filters: [{ name: record ? 'Proficiency record' : 'Skill map', extensions: ['json'] }] });
    if (result.canceled) return false;
    await track(writeFileAtomic(result.filePath, content));
    return true;
  });
  // Shared proficiency: one record per atlas family in the app's user-data folder, outside any map file.
  const proficiency = createProficiencyStore(path.join(app.getPath('userData'), 'proficiency'));
  ipcMain.handle('proficiency-load', (event, family) => { if (!fromWindow(event)) throw Error('Invalid request.'); return proficiency.load(family); });
  ipcMain.handle('proficiency-save', async (event, family, text) => { if (!fromWindow(event)) throw Error('Invalid request.'); await track(proficiency.save(family, text)); return true; });
  // "Your maps": read-only. The page can list the Maps folder's maps and read one the list offers.
  ipcMain.handle('maps-list', event => { if (!fromWindow(event)) throw Error('Invalid request.'); return listMaps(MAPS_DIR); });
  ipcMain.handle('maps-read', (event, relative) => { if (!fromWindow(event)) throw Error('Invalid request.'); return readMap(MAPS_DIR, relative); });
  // The AI Guide: the only part of HelixSkill that goes online, and only from this process. Tests
  // swap in a scripted client (tests/electron-launcher.cjs) so no real request is ever made.
  const SDK = require('@anthropic-ai/sdk');
  const guide = createGuide({ dir: path.join(app.getPath('userData'), 'guide'), secure: safeStorage, SDK, online: () => net.isOnline(),
    createClient: global.__sssGuideClient || (apiKey => new SDK.default({ apiKey, maxRetries: 1, timeout: 120_000 })),
    onStatus: status => { if (!win.isDestroyed()) win.webContents.send('guide-status', status); } });
  const guarded = handler => (event, ...args) => { if (!fromWindow(event)) throw Error('Invalid request.'); return handler(event, ...args); };
  ipcMain.handle('guide-status', guarded(() => guide.status()));
  ipcMain.handle('guide-retry', guarded(() => guide.probe()));
  ipcMain.handle('guide-set-key', guarded((_, key) => guide.setKey(key)));
  ipcMain.handle('guide-clear-key', guarded(() => guide.clearKey()));
  ipcMain.handle('guide-settings', guarded((_, next) => guide.setSettings(next)));
  ipcMain.handle('guide-turn', guarded((event, id, request) => guide.turn(id, request, text => { if (!event.sender.isDestroyed()) event.sender.send('guide-delta', id, text); })));
  ipcMain.handle('guide-cancel', guarded((_, id) => guide.cancel(id)));
  ipcMain.handle('guide-memory-load', guarded((_, family) => guide.loadMemory(family)));
  ipcMain.handle('guide-memory-save', guarded((_, family, text) => guide.saveMemory(family, text)));
  // Lessons: kept outside map files, in userData/lessons (see docs/ai-lessons-plan.md).
  const lessons = createLessons({ dir: app.getPath('userData'), guide, SDK });
  ipcMain.handle('lessons-get', guarded((_, mapKey, nodeId) => lessons.get(mapKey, nodeId)));
  ipcMain.handle('lessons-list', guarded((_, mapKey) => lessons.list(mapKey)));
  ipcMain.handle('lessons-absorb', guarded((_, mapKey, nodes) => lessons.absorb(mapKey, nodes)));
  ipcMain.handle('lessons-status', guarded(() => lessons.status()));
  ipcMain.handle('lessons-settings', guarded((_, next) => lessons.setSettings(next)));
  ipcMain.handle('lessons-generate', guarded((event, jobId, mapKey, nodeId, context, options) => lessons.generate(jobId, mapKey, nodeId, context, options,
    progress => { if (!event.sender.isDestroyed()) event.sender.send('lessons-progress', jobId, progress); })));
  ipcMain.handle('lessons-cancel', guarded((_, jobId) => lessons.cancel(jobId)));
  ipcMain.handle('lessons-review', guarded((_, mapKey, nodeId, change) => lessons.review(mapKey, nodeId, change)));
  guide.load().catch(() => {});
  app.on('before-quit', () => guide.stop());
  win.loadFile(path.join(__dirname, '../dist/index.html'));
});
app.on('window-all-closed', () => app.quit());
