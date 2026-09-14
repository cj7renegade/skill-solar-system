// Integrates the Material Behavior authoring batch into an atlas. The batch is content, not a map:
// it carries no positions, levels, or answers, and the shared batch integration supplies them from
// the atlas it is merging into. Nothing that already exists is moved, renamed, or re-answered, and
// applying the batch twice changes nothing. Callers decide what to write.
import { readFileSync } from 'node:fs';
import { mergeBatch, batchSubmap } from '../batch.mjs';
export { edgeKey, normalizeName, clearance } from '../batch.mjs';

export const BATCH_FILE = new URL('./material-behavior-batch-01.json', import.meta.url);
export const SUBMAP_TITLE = 'Skill Solar System / Material Behavior Batch 01 + prerequisites';
export const EXPANSION = { edition: 'material-behavior-batch-01', version: '1.0', created: '2026-09-13', origin: 'sss-material-behavior-batch-01' };
// Materials live in the Mechanics domain in this atlas, which already carries broad stress, strain,
// elasticity, plasticity and tensile-test topics. This batch keeps its own key so none of the
// earlier expansion records are overwritten.
export const EXPANSION_KEY = 'materialBehaviorExpansion';
const PLACEMENT = 'New skills sit in the Mechanics ribbon of the existing spiral, in rows beyond those their level already uses. Existing skills, coordinates, levels, pins, and answers were not changed.';
const OVERVIEW_NOTE = 'The broad stress, strain, elasticity, plasticity, tensile-test, axial and selection topics are kept exactly as they were. Each overlap is a related link recording scope overlap only; it carries no learning order and never transfers an answer.';

export function loadBatch(file = BATCH_FILE) { return JSON.parse(readFileSync(file, 'utf8')); }

export function mergeMaterialBehavior(atlas, batch = loadBatch(), { today = EXPANSION.created } = {}) {
  return mergeBatch(atlas, batch, {
    expansion: EXPANSION, expansionKey: EXPANSION_KEY, placement: PLACEMENT, today,
    extra: { deferred: batch.deferred ?? [], overviewsRetained: OVERVIEW_NOTE }
  });
}

export function materialSubmap(master, batch = loadBatch(), title = SUBMAP_TITLE) { return batchSubmap(master, batch, title); }
