// Loads and saves shared proficiency records: through the desktop bridge (atomic files in the
// app's user-data folder) or, outside Electron, in localStorage. Loaded records are validated.
import { validateRecord } from './proficiency.js';

export function createRecordStore(bridge, storage) {
  if (bridge) return {
    location: 'this computer',
    async load(family) { const text = await bridge.load(family); return text === null ? null : validateRecord(JSON.parse(text), family); },
    async save(family, record) { await bridge.save(family, JSON.stringify(record, null, 1)); }
  };
  const key = family => `skill-solar-system-proficiency:${family}`;
  return {
    location: 'this browser',
    async load(family) { const text = storage.getItem(key(family)); return text === null ? null : validateRecord(JSON.parse(text), family); },
    async save(family, record) { storage.setItem(key(family), JSON.stringify(record)); }
  };
}
