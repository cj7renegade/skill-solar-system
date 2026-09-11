// Shared offline proficiency record: one record per atlas family, keyed by stable node id.
// Entry values are true (Yes), false (No), or null (a deliberate Clear). An absent entry means
// the family has no answer for that skill yet, so a map's own Yes or No may initialize it.
// Answers are never inferred for related skills or prerequisites.

export const RECORD_FORMAT = 'skill-solar-system-proficiency';
// Atlas files written before metadata.atlasFamily existed are recognized by their dataset id.
export const KNOWN_DATASET_FAMILIES = { 'sss-robotics-foundations-2026-09': 'sss-robotics-foundations-2026-09' };
const FAMILY = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/;
const isValue = value => value === true || value === false || value === null;
export const isAnswer = value => value === true || value === false;

// The family a map belongs to: its explicit metadata.atlasFamily, else a known dataset id, else none.
// Maps without a family never share answers, even if they reuse node ids.
export function atlasFamily(graph) {
  const metadata = graph?.metadata;
  if (typeof metadata?.atlasFamily === 'string' && FAMILY.test(metadata.atlasFamily)) return metadata.atlasFamily;
  return (typeof metadata?.datasetId === 'string' && KNOWN_DATASET_FAMILIES[metadata.datasetId]) || null;
}

export function emptyRecord(family) {
  return { format: RECORD_FORMAT, version: 1, family, revision: 0, updatedAt: null, entries: {} };
}

export function validateRecord(value, family = null) {
  if (!value || typeof value !== 'object' || value.format !== RECORD_FORMAT || value.version !== 1) throw Error('This is not a Skill Solar System proficiency record.');
  if (typeof value.family !== 'string' || !FAMILY.test(value.family)) throw Error('The record has no valid atlas family.');
  if (family && value.family !== family) throw Error(`The record belongs to atlas family "${value.family}", not "${family}".`);
  if (!value.entries || typeof value.entries !== 'object' || Array.isArray(value.entries)) throw Error('The record has no entries.');
  const ids = Object.keys(value.entries);
  if (ids.length > 50000) throw Error('The record has too many entries.');
  const entries = {};
  for (const id of ids) {
    const entry = value.entries[id];
    if (!id || id.length > 100) throw Error('A record entry has an invalid skill id.');
    if (!entry || typeof entry !== 'object' || !isValue(entry.value)) throw Error(`The entry for ${id} must be Yes, No, or Clear.`);
    entries[id] = {
      value: entry.value,
      revision: Number.isInteger(entry.revision) && entry.revision > 0 ? entry.revision : 1,
      updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : null,
      source: typeof entry.source === 'string' ? entry.source.slice(0, 40) : 'unknown',
      map: typeof entry.map === 'string' ? entry.map.slice(0, 200) : null
    };
  }
  return { format: RECORD_FORMAT, version: 1, family: value.family, revision: Number.isInteger(value.revision) && value.revision >= 0 ? value.revision : 0, updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null, entries };
}

// Writes answers into a record as one new revision. Revisions and timestamps are diagnostic only.
export function recordAnswers(record, changes, { source, map = null, now = new Date().toISOString() }) {
  if (!changes.length) return record;
  const revision = record.revision + 1, entries = { ...record.entries };
  for (const { id, value } of changes) {
    if (!isValue(value)) throw Error('Proficiency must be Yes, No, or Clear.');
    entries[id] = { value, revision, updatedAt: now, source, map };
  }
  return { ...record, revision, updatedAt: now, entries };
}

// Applies the family record to a validated map. Shared entries take precedence, including an
// explicit Clear. A map's own Yes or No initializes a skill the record does not have yet. An
// unmarked skill in the map never erases a shared answer. Only proficiency80 is touched.
export function reconcile(graph, record, { map = null, now } = {}) {
  const applied = [], adopted = [];
  const nodes = graph.nodes.map(node => {
    const entry = record.entries[node.id], current = node.proficiency80 ?? null;
    if (entry) {
      if (current === entry.value) return node;
      applied.push(node.id);
      return { ...node, proficiency80: entry.value };
    }
    if (isAnswer(current)) adopted.push({ id: node.id, value: current });
    return node;
  });
  const next = adopted.length ? recordAnswers(record, adopted, { source: 'initialized from map', map, now }) : record;
  return { graph: applied.length ? { ...graph, nodes } : graph, record: next, applied, adopted: adopted.map(a => a.id) };
}

// Proficiency changes between two versions of the same map (skills present in both).
export function diffProficiency(before, after) {
  const old = new Map(before.nodes.map(node => [node.id, node.proficiency80 ?? null]));
  return after.nodes.filter(node => old.has(node.id) && old.get(node.id) !== (node.proficiency80 ?? null)).map(node => ({ id: node.id, value: node.proficiency80 ?? null }));
}

// Import policy: answers in the imported record replace shared answers for the same skills;
// skills that are not in the imported record keep their shared answer.
export function mergeImport(record, incoming, { now = new Date().toISOString() } = {}) {
  if (incoming.family !== record.family) throw Error(`The record belongs to atlas family "${incoming.family}", not "${record.family}".`);
  let added = 0, changed = 0, unchanged = 0;
  const changes = [];
  for (const [id, entry] of Object.entries(incoming.entries)) {
    const current = record.entries[id];
    if (!current) added++; else if (current.value !== entry.value) changed++; else { unchanged++; continue; }
    changes.push({ id, value: entry.value });
  }
  return { record: recordAnswers(record, changes, { source: 'imported record', now }), added, changed, unchanged };
}

// Deliberately replaces shared answers for every skill in a map with the answers embedded in that
// file as it was opened. A skill unmarked in the file becomes an explicit Clear.
export function adoptFileAnswers(record, fileAnswers, { map = null, now = new Date().toISOString() } = {}) {
  return recordAnswers(record, [...fileAnswers].map(([id, value]) => ({ id, value: value ?? null })), { source: 'adopted from file', map, now });
}

export function recordSummary(record) {
  const values = Object.values(record?.entries || {}).map(entry => entry.value);
  return { total: values.length, yes: values.filter(v => v === true).length, no: values.filter(v => v === false).length, cleared: values.filter(v => v === null).length };
}
