# Skill Solar System v0.4.0

Offline desktop reference atlas built with Three.js and Electron.

For an existing installation, copy this folder's contents into your program folder, replace matching files, and run Rebuild-Windows.cmd then Launch-Windows.cmd. For a fresh setup, install Node.js and run Setup-Windows.cmd once with internet access to install the pinned dependencies. Subsequent launches work offline.

See UPDATE-v0.4.0.md for the level/spiral controls and verification limits. The outer release package contains the expanded maps, original backup, source notes, and detailed START-HERE.md instructions.

Development: npm test runs the Node data/interaction tests. npm run build creates the bundled offline renderer. npm start runs Electron. tests/console-smoke.mjs is a separate optional Playwright check with an explicitly stubbed viewer; it is not a WebGL test and was not executed for this release.
