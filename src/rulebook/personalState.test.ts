import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EMPTY_PERSONAL_RULEBOOK_STATE,
  PERSONAL_RULEBOOK_STORAGE_KEY,
  loadPersonalRulebookState,
  savePersonalRulebookState
} from './personalState';

describe('personal rulebook storage', () => {
  let stored: Map<string, string>;

  beforeEach(() => {
    stored = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value)
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('upgrades legacy personal state with an isolated House Rule layer', () => {
    stored.set(PERSONAL_RULEBOOK_STORAGE_KEY, JSON.stringify({
      bookmarks: ['procedure:travel'],
      notes: { 'procedure:travel': '개인 메모' },
      consultations: []
    }));

    expect(loadPersonalRulebookState()).toEqual({
      bookmarks: ['procedure:travel'],
      notes: { 'procedure:travel': '개인 메모' },
      houseRules: {},
      consultations: []
    });
  });

  it('persists House Rule notes only in personal rulebook storage', () => {
    const next = {
      ...EMPTY_PERSONAL_RULEBOOK_STATE,
      houseRules: { 'procedure:travel': '개인용 이동 판정 메모' }
    };

    savePersonalRulebookState(next);

    expect(stored.size).toBe(1);
    expect(stored.has(PERSONAL_RULEBOOK_STORAGE_KEY)).toBe(true);
    expect(loadPersonalRulebookState()).toEqual(next);
  });
});
