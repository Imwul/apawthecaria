import { afterEach, describe, expect, it } from 'vitest';
import { PLAYER_MARKER_STORAGE_KEY, loadPlayerMarkers, upsertPlayerMarkerRecords } from './playerMarkerStore';

const memory = new Map<string, string>();

describe('player marker store', () => {
  afterEach(() => {
    memory.clear();
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('stores corrected node positions and keeps later edits', () => {
    Object.assign(globalThis, {
      window: {
        localStorage: {
          getItem: (key: string) => memory.get(key) ?? null,
          setItem: (key: string, value: string) => { memory.set(key, value); },
          removeItem: (key: string) => { memory.delete(key); }
        }
      }
    });
    window.localStorage.removeItem(PLAYER_MARKER_STORAGE_KEY);
    upsertPlayerMarkerRecords([
      { id: 'oak', label: 'Odoak', x: 26, y: 34, kind: 'wild', region: 'Forest', updatedAt: 1 }
    ]);
    upsertPlayerMarkerRecords([
      { id: 'oak', label: 'Odoak', x: 28.5, y: 33.2, kind: 'wild', region: 'Forest', updatedAt: 2 }
    ]);
    expect(loadPlayerMarkers()).toEqual([
      expect.objectContaining({ id: 'oak', x: 28.5, y: 33.2, kind: 'wild' })
    ]);
  });
});
