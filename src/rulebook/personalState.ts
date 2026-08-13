import type { PersonalRulebookState } from './types';

export const PERSONAL_RULEBOOK_STORAGE_KEY = 'apawthecaria_personal_rulebook_v1';

export const EMPTY_PERSONAL_RULEBOOK_STATE: PersonalRulebookState = { bookmarks: [], notes: {}, consultations: [] };

export const loadPersonalRulebookState = (): PersonalRulebookState => {
  try {
    const raw = localStorage.getItem(PERSONAL_RULEBOOK_STORAGE_KEY);
    if (!raw) return EMPTY_PERSONAL_RULEBOOK_STATE;
    const parsed = JSON.parse(raw) as Partial<PersonalRulebookState>;
    return {
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks.filter(value => typeof value === 'string') : [],
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      consultations: Array.isArray(parsed.consultations) ? parsed.consultations : []
    };
  } catch {
    return EMPTY_PERSONAL_RULEBOOK_STATE;
  }
};

export const savePersonalRulebookState = (state: PersonalRulebookState) => {
  localStorage.setItem(PERSONAL_RULEBOOK_STORAGE_KEY, JSON.stringify(state));
};
