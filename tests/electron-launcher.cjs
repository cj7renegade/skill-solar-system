// End-to-end test launcher: isolates userData (never touches a real draft cache), replaces the
// native save dialog with a fixed path in the test folder, then runs the real desktop/main.cjs.
const { app, dialog } = require('electron');
const path = require('node:path');
const dir = process.env.SSS_E2E_DIR;
app.setPath('userData', path.join(dir, 'userdata'));
dialog.showSaveDialog = async () => ({ canceled: false, filePath: path.join(dir, 'saved.json') });
dialog.showMessageBoxSync = () => 1;
require(path.join(__dirname, '..', 'desktop', 'main.cjs'));
