// Integrates the Robotics Foundations authoring batch into an atlas. The batch is content, not a
// map: it carries no positions, levels, or answers, and the shared batch integration supplies them
// from the atlas it is merging into. Nothing that already exists is moved, renamed, or re-answered,
// and applying the batch twice changes nothing. Callers decide what to write.
import { readFileSync } from 'node:fs';
import { mergeBatch, batchSubmap } from '../batch.mjs';
export { edgeKey, normalizeName, clearance } from '../batch.mjs';

export const BATCH_FILE = new URL('./robotics-foundations-batch-01.json', import.meta.url);
export const SUBMAP_TITLE = 'Skill Solar System / Robotics Foundations Batch 01 + prerequisites';
export const EXPANSION = { edition: 'robotics-foundations-batch-01', version: '1.0', created: '2026-09-13', origin: 'sss-robotics-foundations-batch-01' };
// Distinct from the atlas family id (sss-robotics-foundations-2026-09), which names the whole map
// and its shared proficiency record. This key records only what this batch added.
export const EXPANSION_KEY = 'roboticsFoundationsExpansion';
const PLACEMENT = 'New skills sit in the Robotics ribbon of the existing spiral, in rows beyond those their level already uses. Existing skills, coordinates, levels, pins, and answers were not changed.';
const OVERVIEW_NOTE = 'The broad frame, rigid-transform, degrees-of-freedom, configuration, forward, inverse, Jacobian and singularity topics are kept exactly as they were. Each overlap is a related link recording scope overlap only; it carries no learning order and never transfers an answer.';
const CONVENTIONS = 'Right-handed frames and column vectors; T_AB maps coordinates from B into A; the second joint angle is relative to link 1; joint rates are in radians. The planar Jacobian here maps joint rates to Cartesian tip-position rates and is not a spatial twist Jacobian.';

export function loadBatch(file = BATCH_FILE) { return JSON.parse(readFileSync(file, 'utf8')); }

export function mergeRoboticsFoundations(atlas, batch = loadBatch(), { today = EXPANSION.created } = {}) {
  return mergeBatch(atlas, batch, {
    expansion: EXPANSION, expansionKey: EXPANSION_KEY, placement: PLACEMENT, today,
    extra: { deferred: batch.deferred ?? [], overviewsRetained: OVERVIEW_NOTE, conventions: CONVENTIONS }
  });
}

export function roboticsSubmap(master, batch = loadBatch(), title = SUBMAP_TITLE) { return batchSubmap(master, batch, title); }
