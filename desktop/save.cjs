// Writes a map file atomically: the full content goes to a temporary file in the same folder, is
// checked, and then replaces the target in one rename. An interrupted save leaves the previous
// file intact instead of an empty or partly written one.
const fs = require('node:fs/promises');
const path = require('node:path');

async function writeFileAtomic(target, content) {
  const temp = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${Date.now()}.tmp`);
  try {
    const handle = await fs.open(temp, 'wx');
    try { await handle.writeFile(content, 'utf8'); await handle.sync(); }
    finally { await handle.close(); }
    const { size } = await fs.stat(temp);
    if (size !== Buffer.byteLength(content, 'utf8')) throw Error('The saved file is incomplete.');
    await fs.rename(temp, target);
  } catch (error) {
    await fs.rm(temp, { force: true });
    throw error;
  }
}

module.exports = { writeFileAtomic };
