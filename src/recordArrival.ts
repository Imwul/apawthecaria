import { useEffect, useState } from 'react';

export interface RecordSnapshot { scope: string; ids: readonly string[] }

/** Restoring a campaign, changing slots, and editing a record are not new discoveries. */
export function newlyAddedRecordIds(previous: RecordSnapshot | null, current: RecordSnapshot): string[] {
  if (!previous || previous.scope !== current.scope) return [];
  const known = new Set(previous.ids);
  return [...new Set(current.ids)].filter(id => !known.has(id));
}

export function useRecordArrivals(ids: readonly string[], scope: string, ready: boolean): readonly string[] {
  const key = ready ? `${scope}:${JSON.stringify(ids)}` : '';
  const [snapshot, setSnapshot] = useState<{ key: string; records: RecordSnapshot | null; arrived: string[] }>(() => ({
    key, records: ready ? { scope, ids } : null, arrived: []
  }));
  if (snapshot.key !== key) {
    const records = ready ? { scope, ids } : null;
    setSnapshot({ key, records, arrived: records ? newlyAddedRecordIds(snapshot.records, records) : [] });
  }
  useEffect(() => {
    if (!snapshot.arrived.length) return;
    const timer = window.setTimeout(() => setSnapshot(current => current.key === snapshot.key
      ? { ...current, arrived: [] } : current), 9000);
    return () => window.clearTimeout(timer);
  }, [snapshot.key, snapshot.arrived.length]);
  return snapshot.arrived;
}
