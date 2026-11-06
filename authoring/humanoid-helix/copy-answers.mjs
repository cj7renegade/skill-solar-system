// Copies answers from the Robotics Atlas's shared answer record into the Humanoid Helix map's own
// record, for skills both maps share. A copy, never a move: the Robotics Atlas record is only read.
//
//   node authoring/humanoid-helix/copy-answers.mjs            dry run: lists what would be copied
//   node authoring/humanoid-helix/copy-answers.mjs --write    writes the helix family's record
//   --ids a,b                                                 copy only these skills
//
// Without --ids it copies every answer the Robotics Atlas record holds that the helix map's file does
// not (on 2026-11-05: rob3:B-C01 = Yes). Run with the app closed: the app writes records too. If the
// helix record does not exist yet, it is first created exactly as the app's first open would create
// it (reconcile in src/proficiency.js adopts the file's own answers), then the copies are added.
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { validate } from '../../src/model.js';
import { atlasFamily, emptyRecord, validateRecord, reconcile, recordAnswers } from '../../src/proficiency.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const STORE = path.join(process.env.APPDATA, 'skill-solar-system', 'proficiency');
// The app's file name for a family's record (desktop/proficiency-store.cjs).
const fileFor = family => path.join(STORE, `${family.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80)}-${createHash('sha256').update(family).digest('hex').slice(0, 12)}.json`);

const helix = validate(JSON.parse(readFileSync(path.join(ROOT, 'Maps', 'Humanoid-Helix-Atlas.json'), 'utf8')));
const atlas = validate(JSON.parse(readFileSync(path.join(ROOT, 'Maps', 'Robotics-Atlas.json'), 'utf8')));
const [helixFamily, atlasFamilyName] = [atlasFamily(helix), atlasFamily(atlas)];
if (!helixFamily || helixFamily === atlasFamilyName) throw Error('The helix map must have its own answer family.');
const sourceFile = fileFor(atlasFamilyName), targetFile = fileFor(helixFamily);
const sourceBytes = readFileSync(sourceFile), source = validateRecord(JSON.parse(sourceBytes), atlasFamilyName);

const byId = new Map(helix.nodes.map(n => [n.id, n]));
const wanted = args.includes('--ids') ? args[args.indexOf('--ids') + 1].split(',') : null;
const copies = Object.entries(source.entries)
  .filter(([id, e]) => byId.has(id) && (wanted ? wanted.includes(id) : (byId.get(id).proficiency80 ?? null) !== (e.value ?? null)))
  .map(([id, e]) => ({ id, value: e.value ?? null, from: e }));
if (wanted) for (const id of wanted) if (!copies.some(c => c.id === id)) throw Error(`${id} has no entry in the Robotics Atlas record, or is not in the helix map.`);

// The helix record: the existing one, or the one the app's first open would make.
const existed = existsSync(targetFile);
let record = existed ? validateRecord(JSON.parse(readFileSync(targetFile, 'utf8')), helixFamily) : emptyRecord(helixFamily);
const initialized = existed ? [] : reconcile(helix, record, { map: helix.title }).adopted;
if (!existed) record = reconcile(helix, record, { map: helix.title }).record;
const next = copies.length ? recordAnswers(record, copies.map(c => ({ id: c.id, value: c.value })), { source: `copied from ${atlasFamilyName}`, map: helix.title }) : record;
validateRecord(next, helixFamily);

console.log(JSON.stringify({
  from: { family: atlasFamilyName, file: sourceFile, entries: Object.keys(source.entries).length },
  to: { family: helixFamily, file: targetFile, existed, initializedFromMapFile: initialized.length, entriesAfter: Object.keys(next.entries).length },
  copies: copies.map(c => ({ id: c.id, value: c.value, answeredInAtlas: c.from.updatedAt }))
}, null, 2));
if (!args.includes('--write')) { console.log('\nDry run: nothing written. Add --write to write the helix record.'); process.exit(0); }
mkdirSync(STORE, { recursive: true });
const temp = `${targetFile}.${process.pid}.tmp`; writeFileSync(temp, JSON.stringify(next)); renameSync(temp, targetFile);
if (!readFileSync(sourceFile).equals(sourceBytes)) throw Error('The Robotics Atlas record changed during the copy.');
console.log(`\nWrote ${targetFile}. The Robotics Atlas record is unchanged.`);
