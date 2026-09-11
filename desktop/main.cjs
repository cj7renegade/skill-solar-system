const { app, BrowserWindow, session, ipcMain, dialog } = require('electron');
const path = require('node:path');
const { writeFileAtomic } = require('./save.cjs');
const { createProficiencyStore } = require('./proficiency-store.cjs');
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
  win = new BrowserWindow({ width: 1500, height: 960, minWidth: 1000, minHeight: 680, backgroundColor: '#080e19', autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.webContents.on('will-prevent-unload', event => {
    const choice = dialog.showMessageBoxSync(win, { type: 'question', buttons: ['Keep editing', 'Close'], defaultId: 0, cancelId: 0, title: 'Unsaved map', message: 'Close without saving a JSON copy?', detail: 'The local draft may be recovered next time, but it is not a backup.' });
    if (choice === 1) event.preventDefault();
  });
  const fromWindow = event => event.sender === win.webContents;
  ipcMain.handle('save-map', async (event, content, options = {}) => {
    if (!fromWindow(event) || typeof content !== 'string' || Buffer.byteLength(content) > 10_000_000) throw Error('Invalid save request.');
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
  win.loadFile(path.join(__dirname, '../dist/index.html'));
});
app.on('window-all-closed', () => app.quit());
