import type { PersonalRulebookState } from './types';

export const PERSONAL_RULEBOOK_STORAGE_KEY = 'apawthecaria_personal_rulebook_v1';

export const EMPTY_PERSONAL_RULEBOOK_STATE: PersonalRulebookState = {
  bookmarks: [],
  notes: {},
  houseRules: {},
  consultations: []
};

const stringRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
};

export const normalizePersonalRulebookState = (value: unknown): PersonalRulebookState => {
  const parsed = value && typeof value === 'object' ? value as Partial<PersonalRulebookState> : {};
  return {
    bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks.filter(value => typeof value === 'string') : [],
    notes: stringRecord(parsed.notes),
    houseRules: stringRecord(parsed.houseRules),
    consultations: Array.isArray(parsed.consultations) ? parsed.consultations : []
  };
};

export const loadPersonalRulebookState = (): PersonalRulebookState => {
  try {
    const raw = localStorage.getItem(PERSONAL_RULEBOOK_STORAGE_KEY);
    if (!raw) return EMPTY_PERSONAL_RULEBOOK_STATE;
    return normalizePersonalRulebookState(JSON.parse(raw));
  } catch {
    return EMPTY_PERSONAL_RULEBOOK_STATE;
  }
};

export const savePersonalRulebookState = (state: PersonalRulebookState) => {
  localStorage.setItem(PERSONAL_RULEBOOK_STORAGE_KEY, JSON.stringify(state));
};
