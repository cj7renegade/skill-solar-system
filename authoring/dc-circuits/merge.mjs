// Integrates the DC Circuits authoring batch into an atlas. The batch is content, not a map: it
// carries no positions, levels, or answers, and the shared batch integration supplies them from the
// atlas it is merging into. Nothing that already exists is moved, renamed, or re-answered, and
// applying the batch twice changes nothing. Callers decide what to write.
import { readFileSync } from 'node:fs';
import { mergeBatch, batchSubmap } from '../batch.mjs';
export { edgeKey, normalizeName, clearance } from '../batch.mjs';

export const BATCH_FILE = new URL('./dc-circuits-batch-01.json', import.meta.url);
export const SUBMAP_TITLE = 'Skill Solar System / DC Circuits + prerequisites';
export const EXPANSION = { edition: 'dc-circuits-batch-01', version: '1.0', created: '2026-09-13', origin: 'sss-dc-batch-01' };
export const EXPANSION_KEY = 'dcCircuitsExpansion';
const PLACEMENT = 'New skills sit in the Electronics ribbon of the existing spiral, in rows beyond those their level already uses. Existing skills, coordinates, levels, pins, and answers were not changed.';

export function loadBatch(file = BATCH_FILE) { return JSON.parse(readFileSync(file, 'utf8')); }

export function mergeDcCircuits(atlas, batch = loadBatch(), { today = EXPANSION.created } = {}) {
  return mergeBatch(atlas, batch, { expansion: EXPANSION, expansionKey: EXPANSION_KEY, placement: PLACEMENT, today });
}

export function dcSubmap(master, batch = loadBatch(), title = SUBMAP_TITLE) { return batchSubmap(master, batch, title); }
