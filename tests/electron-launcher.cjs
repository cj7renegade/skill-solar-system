// End-to-end test launcher: isolates userData (never touches a real draft cache or shared
// proficiency record), replaces the native save dialog with a fixed path in the test folder, then
// runs the real desktop/main.cjs. SSS_FAIL_PROFICIENCY_WRITES=1 makes shared-record writes fail,
// to test how the app reports a failed write.
const { app, dialog } = require('electron');
const path = require('node:path');
const dir = process.env.SSS_E2E_DIR;
app.setPath('userData', path.join(dir, 'userdata'));
dialog.showSaveDialog = async () => ({ canceled: false, filePath: path.join(dir, 'saved.json') });
dialog.showMessageBoxSync = () => 1;
if (process.env.SSS_FAIL_PROFICIENCY_WRITES === '1') {
  const fs = require('node:fs/promises'), rename = fs.rename;
  fs.rename = async (from, to) => {
    if (String(to).includes(`${path.sep}proficiency${path.sep}`)) throw Object.assign(Error('Simulated disk failure'), { code: 'EIO' });
    return rename(from, to);
  };
}
require(path.join(__dirname, '..', 'desktop', 'main.cjs'));
