// Integrates the Mechanics Statics authoring batch into an atlas. The batch is content, not a map:
// it carries no positions, levels, or answers, and the shared batch integration supplies them from
// the atlas it is merging into. Nothing that already exists is moved, renamed, or re-answered, and
// applying the batch twice changes nothing. Callers decide what to write.
import { readFileSync } from 'node:fs';
import { mergeBatch, batchSubmap } from '../batch.mjs';
export { edgeKey, normalizeName, clearance } from '../batch.mjs';

export const BATCH_FILE = new URL('./mechanics-statics-batch-01.json', import.meta.url);
export const SUBMAP_TITLE = 'Skill Solar System / Mechanics Statics Batch 01 + prerequisites';
export const EXPANSION = { edition: 'mechanics-statics-batch-01', version: '1.0', created: '2026-09-13', origin: 'sss-mechanics-statics-batch-01' };
// The Mechanics domain already carries the materials strand and the Material Behavior batch. This
// batch keeps its own key so none of the earlier expansion records are overwritten.
export const EXPANSION_KEY = 'mechanicsStaticsExpansion';
const PLACEMENT = 'New skills sit in the Mechanics ribbon of the existing spiral, in rows beyond those their level already uses. Existing skills, coordinates, levels, pins, and answers were not changed.';
const OVERVIEW_NOTE = 'Signed torque, general equilibrium, system isolation, interaction pairs, complete beam diagrams and the load-path overview are reused as they are. Each overlap is a related link recording scope overlap only; it carries no learning order and never transfers an answer.';

export function loadBatch(file = BATCH_FILE) { return JSON.parse(readFileSync(file, 'utf8')); }

export function mergeMechanicsStatics(atlas, batch = loadBatch(), { today = EXPANSION.created } = {}) {
  return mergeBatch(atlas, batch, {
    expansion: EXPANSION, expansionKey: EXPANSION_KEY, placement: PLACEMENT, today,
    extra: { deferred: batch.deferred ?? [], overviewsRetained: OVERVIEW_NOTE }
  });
}

export function staticsSubmap(master, batch = loadBatch(), title = SUBMAP_TITLE) { return batchSubmap(master, batch, title); }
