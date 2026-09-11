// Shared proficiency records on disk: one JSON file per atlas family in the app's user-data
// folder. Writes are atomic (temporary file, then rename) and run one at a time per family.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { writeFileAtomic } = require('./save.cjs');

const FAMILY = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/;

function fileFor(dir, family) {
  if (typeof family !== 'string' || !FAMILY.test(family)) throw Error('Invalid atlas family.');
  const readable = family.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
  const digest = crypto.createHash('sha256').update(family).digest('hex').slice(0, 12);
  return path.join(dir, `${readable}-${digest}.json`);
}

function createProficiencyStore(dir) {
  const queues = new Map();
  return {
    fileFor: family => fileFor(dir, family),
    async load(family) {
      try { return await fs.readFile(fileFor(dir, family), 'utf8'); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async save(family, text) {
      const file = fileFor(dir, family);
      if (typeof text !== 'string' || Buffer.byteLength(text) > 5_000_000) throw Error('Invalid proficiency record.');
      let record;
      try { record = JSON.parse(text); } catch { throw Error('Invalid proficiency record.'); }
      if (record?.format !== 'skill-solar-system-proficiency' || record.family !== family) throw Error('The record does not match its atlas family.');
      const run = (queues.get(file) || Promise.resolve()).catch(() => {}).then(async () => {
        await fs.mkdir(dir, { recursive: true });
        await writeFileAtomic(file, text);
      });
      queues.set(file, run);
      return run;
    }
  };
}

module.exports = { createProficiencyStore };
