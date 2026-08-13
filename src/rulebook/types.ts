export type RulebookReferenceKind =
  | 'rule'
  | 'procedure'
  | 'encounter'
  | 'ailment'
  | 'printed-effect'
  | 'remedy'
  | 'ingredient'
  | 'tag'
  | 'tool'
  | 'service'
  | 'clinic'
  | 'wagon'
  | 'companion'
  | 'barrow'
  | 'downtime'
  | 'region'
  | 'season'
  | 'table'
  | 'example'
  | 'guidance'
  | 'source';

export interface RulebookReferenceDetail {
  label: string;
  value: string;
}

export interface RulebookReferenceEntry {
  id: string;
  kind: RulebookReferenceKind;
  title: string;
  summary: string;
  sourcePage: number;
  endPage?: number;
  ownerId?: string;
  ruleIds: string[];
  runtimeStatus: 'canonical' | 'automatic' | 'manual' | 'ambiguous' | 'reference-only';
  details: RulebookReferenceDetail[];
  relatedIds: string[];
  searchText: string;
}

export interface RulebookSourcePage {
  page: number;
  text: string;
}

export interface RulebookSourcePayload {
  source: string;
  edition: string;
  sha256: string;
  pageCount: number;
  pages: RulebookSourcePage[];
}

export interface RulebookReferenceRequest {
  entryId?: string;
  page?: number;
  query?: string;
  title?: string;
  context?: RulebookReferenceDetail[];
}

export interface PersonalRulebookState {
  bookmarks: string[];
  notes: Record<string, string>;
  consultations: Array<{
    id: string;
    page: number;
    category: 'rule wording' | 'encounter' | 'ailment' | 'remedy' | 'table' | 'map' | 'season' | 'example' | 'guidance' | 'terminology';
    reason: string;
    referenceId?: string;
    createdAt: number;
  }>;
}
