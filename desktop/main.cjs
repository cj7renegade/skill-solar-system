const { app, BrowserWindow, session, ipcMain, dialog } = require('electron');
const path = require('node:path');
const { writeFileAtomic } = require('./save.cjs');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
let win, saving = null;
// A save in progress finishes before the app quits, so closing during a save cannot leave a partial file.
app.on('before-quit', event => { if (saving) { event.preventDefault(); saving.catch(() => {}).then(() => app.quit()); } });
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
  ipcMain.handle('save-map', async (event, content) => {
    if (event.sender !== win.webContents || typeof content !== 'string' || Buffer.byteLength(content) > 10_000_000) throw Error('Invalid save request.');
    const result = await dialog.showSaveDialog(win, { defaultPath: 'Skill-Solar-System.json', filters: [{ name: 'Skill map', extensions: ['json'] }] });
    if (result.canceled) return false;
    saving = writeFileAtomic(result.filePath, content);
    try { await saving; } finally { saving = null; }
    return true;
  });
  win.loadFile(path.join(__dirname, '../dist/index.html'));
});
app.on('window-all-closed', () => app.quit());
