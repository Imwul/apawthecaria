import { localizeSavedJourneyText } from './localization/gameplayKo';
import { localizeGameplayMessage } from './localization/engineMessagesKo';
import { localizeManualJournalTitle } from './localization/manualEffectKo';

export type JournalSemanticCategory = 'player-memory' | 'gameplay-event' | 'activity';
export type JournalSemanticOrigin = 'player' | 'encounter' | 'engine' | 'manual';

export interface JournalSemanticContext {
  location?: string;
  season?: string;
  patient?: string;
  journey?: string;
}

export interface JournalSourceDetails {
  page?: number;
  ruleIds?: string[];
  title?: string;
  prompt?: string;
  choices?: string[];
}

export interface JournalAuditDetails {
  /** Player-entered justification for deliberately departing from the printed rule. */
  overrideReason?: string;
}

export interface JournalSemanticData {
  version: 1;
  category: JournalSemanticCategory;
  origin: JournalSemanticOrigin;
  /** Player-authored prose. Never localise or rewrite this field. */
  memory?: string;
  /** Concise record of what canonically happened. */
  outcome?: string;
  context?: JournalSemanticContext;
  source?: JournalSourceDetails;
  /** Audit context is retained verbatim and never passed through localisation. */
  audit?: JournalAuditDetails;
}

export interface JournalEntryLike {
  id?: string;
  title: string;
  text: string;
  type?: string;
  authorship?: 'player' | 'system';
  playerMemory?: string;
  semantic?: JournalSemanticData;
}

export interface TimedJournalEntryLike extends JournalEntryLike {
  id: string;
  timestamp: number;
}

export interface JournalPresentation {
  category: JournalSemanticCategory;
  origin: JournalSemanticOrigin;
  memory: string;
  outcome: string;
  context: JournalSemanticContext;
  source: JournalSourceDetails;
  audit?: JournalAuditDetails;
}

const stringValue = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const finitePage = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
};

export const normalizeJournalSemantic = (value: unknown): JournalSemanticData | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const category = raw.category;
  const origin = raw.origin;
  if (raw.version !== 1
    || !['player-memory', 'gameplay-event', 'activity'].includes(String(category))
    || !['player', 'encounter', 'engine', 'manual'].includes(String(origin))) return undefined;

  const rawContext = raw.context && typeof raw.context === 'object'
    ? raw.context as Record<string, unknown>
    : {};
  const rawSource = raw.source && typeof raw.source === 'object'
    ? raw.source as Record<string, unknown>
    : {};
  const rawAudit = raw.audit && typeof raw.audit === 'object'
    ? raw.audit as Record<string, unknown>
    : {};
  const context = {
    location: stringValue(rawContext.location),
    season: stringValue(rawContext.season),
    patient: stringValue(rawContext.patient),
    journey: stringValue(rawContext.journey)
  };
  const ruleIds = Array.isArray(rawSource.ruleIds)
    ? rawSource.ruleIds.flatMap(ruleId => typeof ruleId === 'string' && ruleId.trim() ? [ruleId.trim()] : [])
    : undefined;
  const source = {
    page: finitePage(rawSource.page),
    ruleIds: ruleIds?.length ? ruleIds : undefined,
    title: stringValue(rawSource.title),
    prompt: stringValue(rawSource.prompt),
    choices: Array.isArray(rawSource.choices)
      ? rawSource.choices.filter((choice): choice is string => typeof choice === 'string' && Boolean(choice.trim()))
      : undefined
  };
  const audit = {
    overrideReason: stringValue(rawAudit.overrideReason)
  };

  return {
    version: 1,
    category: category as JournalSemanticCategory,
    origin: origin as JournalSemanticOrigin,
    memory: typeof raw.memory === 'string' ? raw.memory : undefined,
    outcome: typeof raw.outcome === 'string' ? raw.outcome : undefined,
    context: Object.values(context).some(Boolean) ? context : undefined,
    source: Object.values(source).some(Boolean) ? source : undefined,
    audit: Object.values(audit).some(Boolean) ? audit : undefined
  };
};

export const normalizeJournalSemantics = <T extends { semantic?: unknown }>(entries: readonly T[]): T[] =>
  entries.map(entry => {
    const semantic = normalizeJournalSemantic(entry.semantic);
    if (semantic) return { ...entry, semantic };
    if ('semantic' in entry) {
      const rest = { ...entry } as T & { semantic?: unknown };
      delete rest.semantic;
      return rest as T;
    }
    return entry;
  });

/**
 * Current and legacy saves have historically treated Journal rows as an
 * unvalidated bag of objects. Keep every recoverable piece of writing while
 * removing only values that could crash the reading surface.
 */
export const normalizeStoredJournalEntries = <T extends TimedJournalEntryLike>(value: unknown): T[] => {
  if (!Array.isArray(value)) return [];
  const normalized = normalizeJournalSemantics(value.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return [];
    const raw = entry as Record<string, unknown>;
    const storedSemantic = normalizeJournalSemantic(raw.semantic);
    // A partially written save can retain the structured Journal payload while
    // losing the legacy display string. Recover from the trustworthy semantic
    // layer instead of discarding a valid player memory or gameplay outcome.
    const rawText = typeof raw.text === 'string' ? raw.text : '';
    const text = rawText || storedSemantic?.memory || storedSemantic?.outcome || '';
    const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title : '제목 없는 기록';
    const photos = Array.isArray(raw.photos)
      ? raw.photos.flatMap((photo, photoIndex) => {
        if (!photo || typeof photo !== 'object') return [];
        const candidate = photo as Record<string, unknown>;
        const dataUrl = typeof candidate.dataUrl === 'string' && candidate.dataUrl.trim()
          ? candidate.dataUrl
          : undefined;
        if (!dataUrl) return [];
        return [{
          id: typeof candidate.id === 'string' && candidate.id.trim()
            ? candidate.id
            : `legacy-journal-photo:${index}:${photoIndex}`,
          name: typeof candidate.name === 'string' && candidate.name.trim()
            ? candidate.name
            : `사진 ${photoIndex + 1}`,
          dataUrl,
          ...(typeof candidate.storagePath === 'string' && candidate.storagePath.trim()
            ? { storagePath: candidate.storagePath }
            : {})
        }];
      })
      : [];
    if (!text && photos.length === 0) return [];
    const id = typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : `legacy-journal:${index}:${title.length}:${text.length}`;
    const timestamp = Number.isFinite(Number(raw.timestamp)) ? Number(raw.timestamp) : 0;
    const normalized = { ...raw, id, title, text, timestamp } as Record<string, unknown>;
    const validTypes = ['travel', 'encounter', 'foraging', 'diagnosis', 'treatment', 'failure', 'season', 'downtime'];
    if (!validTypes.includes(String(raw.type))) delete normalized.type;
    if (raw.authorship !== 'player' && raw.authorship !== 'system') delete normalized.authorship;
    if (typeof raw.playerMemory !== 'string') delete normalized.playerMemory;
    if ('photos' in raw) normalized.photos = photos;
    return [normalized as T];
  }));
  return normalized.map(entry => {
    if (entry.semantic) return entry;
    const semantic = exactLegacyApplicationSemantic(entry);
    return semantic ? { ...entry, semantic } : entry;
  });
};

const ENCOUNTER_TITLE = /^(?:판정 대기|여정 조우|채집 조우|사회 조우|사교 조우):\s*/;
const MANUAL_RECORD_TITLE = /^(?:직접 판정|예외 처리):\s*/;
const APPLICATION_EMPTY_MEMORY = '별도 메모 없이 조우를 마쳤습니다.';
const PLAYER_ENTRY_ID = /^(?:user_journal_|character:|origin_|memento_|familiar_|relation_)|(?::(?:social-journal|social-note|reflection)$)/;

const ACTIVITY_TITLES = [
  /^(?:Journey|여정) started$/i,
  /^(?:Journey|여정) ended$/i,
  /^Guild Service Move$/i,
  /^Guild Services ready for (?:Journey|여정)$/i,
  /^Journey Guild Services closed$/i,
  /^Wasp Foraging draw$/i,
  /^Wasp forage pending$/i,
  /^Honeybee milestone$/i,
  /^Companion trigger:/i,
  /^Clay Pots ready$/i,
  /^Passenger available$/i,
  / consumed$/i,
  /^이동:/,
  /^여정 시작$/,
  /^여정 종료$/,
  /^길드 서비스 이동$/,
  /^여정용 길드 서비스 준비$/
];

const isActivityTitle = (title: string): boolean =>
  ACTIVITY_TITLES.some(pattern => pattern.test(title.trim()));

const SYSTEM_ONLY_OUTCOMES = new Set([
  'Downtime effects applied.',
  'Canonical Downtime transaction applied.',
  'All Ailments were resolved before Moving On.',
  'Bid farewell and continued the Journey.'
]);

// These labels were emitted only by application transactions. They are safe
// to persist as engine semantics when loading an older untyped save.
const EXACT_LEGACY_SYSTEM_TITLES = [
  /^환자 타이머 만료/,
  /^친구들과 보낸 휴식$/,
  /^🏡 선배의 진료소/,
  /^🐾 길동무 교감/,
  /^🌿 영약재 획득/,
  /^🗺️ 거수 무덤 소문/,
  /^🧩 약재 대체/,
  /^Barter(?::| abandoned$)/i
];

// These are the exact titles emitted by the canonical Barrow engine before
// Journal authorship was persisted. Plain Delve names and player-result titles
// are intentionally excluded because those rows contain player-written prose.
const EXACT_LEGACY_BARROW_SYSTEM_TITLES = [
  /^(?:Uneasy Sleep|Collapsed Entrance|The Bellies of Many|Inside Job|Potent Poison|Pilfer Unnoticed|Building Trust|Suitable Furnishings): Challenge$/,
  /^(?:Uneasy Sleep|The Bellies of Many|Inside Job|Potent Poison|Suitable Furnishings): Attempt$/,
  /^(?:Uneasy Sleep|The Bellies of Many|Inside Job): Failed$/,
  /^Collapsed Entrance: Bedchambers$/,
  /^Building Trust: Diagnosis$/,
  /^Pilfer Unnoticed: (?:Escaped|Journey Ended)$/
];

const SYSTEM_EVENT_TITLES = [
  ...EXACT_LEGACY_SYSTEM_TITLES,
  ...EXACT_LEGACY_BARROW_SYSTEM_TITLES,
  /^새 환자:/,
  /^치료:/,
  /^조우 효과:/,
  /^계절 전환:/,
  /^이동:/,
  /^여정 다시 준비$/,
  /^약제소 건설:/,
  /^영약재 /,
  /^Make Do /,
  /^Replacement /,
  /^후속 판정 완료:/,
  /^길드 서비스:/,
  /^딱정벌레 동반자 보호$/,
  /^정착지 연주회$/,
  /^사냥감이 되다/,
  /^현지 야수의 질환 해결/,
  /^말벌 동료 채집 카드$/,
  /^자유로운 길동무의 채집$/,
  /^🐻 /,
  /^(?:Journey|Remedy|Ailment|Downtime|Tool|Companion|Passenger|Crossbow|Granite|Knitted|Preparing|Fled|Potent|Collapsed|Building|Pilfer)/i,
  /^물물교환:/
];

const isSystemEventTitle = (title: string): boolean =>
  SYSTEM_EVENT_TITLES.some(pattern => pattern.test(title.trim()));

const hasLegacyPlayerAuthorship = (event: JournalEntryLike): boolean => {
  if (typeof event.playerMemory === 'string') return Boolean(event.playerMemory.trim());
  if (event.authorship === 'player') return true;
  if (event.authorship === 'system') return false;
  if (SYSTEM_ONLY_OUTCOMES.has(event.text.trim())) return false;
  if (/^\d+ Ailments faced their Consequences\.$/.test(event.text.trim())) return false;
  return Boolean(/^(?:Journey (?:success|partial|failure|abandoned)|Remedy:|Ailment consequences|Fled the Barrow|Potent Poison Failed|Collapsed Entrance: Bid Farewell)$/i.test(event.title)
    || event.id?.endsWith(':social-journal')
    || event.id?.endsWith(':social-note')
    || event.id?.endsWith(':reflection')
    || (event.type === 'encounter' && !isSystemEventTitle(event.title)));
};

const localizeEventText = (value: string): string =>
  localizeGameplayMessage(localizeSavedJourneyText(value)).trim();

const engineTitle = (event: { title: string; type?: string }): string => {
  if (event.title === 'Preparing to Leave') {
    return event.type === 'failure' ? '환자를 떠나보내고 다시 길 위로' : '환자 진료를 마치고 다시 길 위로';
  }
  return localizeGameplayMessage(event.title);
};

const engineOutcome = (event: { text: string; title: string }): string => {
  if (event.text.trim() === 'Downtime effects applied.') return '휴식기 활동을 마쳤습니다.';
  const localized = localizeEventText(event.text);
  return localized || engineTitle(event);
};

const engineSourceRuleIds = (text: string): string[] =>
  [...text.matchAll(/\bsource\s+([A-Z][A-Z0-9-]*-\d+)\b/g)]
    .map(match => match[1])
    .filter((ruleId, index, rows) => rows.indexOf(ruleId) === index);

export const semanticForEngineJournal = (event: { title: string; text: string; type?: string }): JournalSemanticData => {
  const ruleIds = engineSourceRuleIds(event.text);
  return {
    version: 1,
    category: isActivityTitle(event.title) || SYSTEM_ONLY_OUTCOMES.has(event.text.trim()) ? 'activity' : 'gameplay-event',
    origin: 'engine',
    outcome: engineOutcome(event),
    source: ruleIds.length ? { ruleIds } : undefined
  };
};

export const playerFacingEngineJournal = <T extends JournalEntryLike>(event: T): T & { semantic: JournalSemanticData } => {
  const title = engineTitle(event);
  if (hasLegacyPlayerAuthorship(event)) {
    const memory = typeof event.playerMemory === 'string' ? event.playerMemory : event.text;
    const hasSeparateOutcome = typeof event.playerMemory === 'string'
      && event.text.trim()
      && event.text.trim() !== event.playerMemory.trim();
    return {
      ...event,
      title,
      text: event.text,
      semantic: {
        version: 1,
        category: 'player-memory',
        origin: 'engine',
        memory,
        outcome: hasSeparateOutcome ? engineOutcome(event) : title
      }
    };
  }
  const semantic = semanticForEngineJournal(event);
  return { ...event, title, text: semantic.outcome || event.text, semantic };
};

export const appendPlayerFacingEngineJournals = <T extends TimedJournalEntryLike>(
  current: readonly T[],
  events: ReadonlyArray<{ id: string; title: string; text: string; type?: string; authorship?: 'player' | 'system'; playerMemory?: string }>,
  timestamp = Date.now()
): T[] => {
  const known = new Set(current.map(row => row.id));
  const incomingIds = new Set<string>();
  const incoming = events
    .filter(row => {
      if (known.has(row.id) || incomingIds.has(row.id)) return false;
      incomingIds.add(row.id);
      return true;
    })
    // Engine runtimes append chronologically; the Journal is newest-first.
    .reverse()
    .map(row => ({ ...playerFacingEngineJournal(row), timestamp } as T));
  return [...incoming, ...current];
};

export const createPlayerMemorySemantic = (memory: string): JournalSemanticData => ({
  version: 1,
  category: 'player-memory',
  origin: 'player',
  memory
});

export const createGameplayEventSemantic = ({
  outcome,
  location,
  season,
  patient,
  journey
}: {
  outcome: string;
  location?: string;
  season?: string;
  patient?: string;
  journey?: string;
}): JournalSemanticData => ({
  version: 1,
  category: 'gameplay-event',
  origin: 'engine',
  outcome,
  context: location || season || patient || journey ? { location, season, patient, journey } : undefined
});

export const createEncounterSemantic = ({
  note,
  outcome,
  location,
  season,
  sourcePage,
  sourceTitle,
  sourcePrompt,
  sourceChoices
}: {
  note: string;
  outcome: string;
  location?: string;
  season?: string;
  sourcePage?: number;
  sourceTitle?: string;
  sourcePrompt?: string;
  sourceChoices?: string[];
}): JournalSemanticData => {
  const hasMemory = Boolean(note.trim());
  return {
    version: 1,
    category: hasMemory ? 'player-memory' : 'gameplay-event',
    origin: 'encounter',
    memory: hasMemory ? note : undefined,
    outcome: outcome || undefined,
    context: location || season ? { location, season } : undefined,
    source: sourcePage || sourceTitle || sourcePrompt || sourceChoices?.length
      ? { page: sourcePage, title: sourceTitle, prompt: sourcePrompt, choices: sourceChoices }
      : undefined
  };
};

export const createManualResolutionSemantic = ({
  resultSummary,
  journalNote,
  overrideReason,
  sourcePage,
  sourceRuleIds,
  sourceTitle,
  sourcePrompt
}: {
  resultSummary: string;
  journalNote: string;
  overrideReason?: string;
  sourcePage?: number;
  sourceRuleIds?: readonly string[];
  sourceTitle?: string;
  sourcePrompt?: string;
}): JournalSemanticData => {
  const result = resultSummary.trim();
  const note = journalNote.trim();
  const hasMemory = Boolean(note);
  const hasOverride = Boolean(overrideReason?.trim());
  return {
    version: 1,
    category: hasMemory ? 'player-memory' : 'gameplay-event',
    origin: 'manual',
    // The note is explicitly player-authored even when it happens to repeat
    // the deterministic result. Keep its original bytes and suppress only the
    // redundant outcome layer in that exact case.
    memory: hasMemory ? journalNote : undefined,
    outcome: result && (!hasMemory || note !== result) ? result : undefined,
    source: sourcePage || sourceRuleIds?.length || sourceTitle || sourcePrompt
      ? { page: sourcePage, ruleIds: sourceRuleIds ? [...sourceRuleIds] : undefined, title: sourceTitle, prompt: sourcePrompt }
      : undefined,
    audit: hasOverride ? { overrideReason } : undefined
  };
};

const parseExactApplicationEncounter = (title: string, text: string): JournalPresentation | null => {
  if (!ENCOUNTER_TITLE.test(title)) return null;
  const current = text.match(/^나의 기록: ?([\s\S]*?)(?:\n\n조우 정보:\n([\s\S]*?))?(?:\n\n조우 맥락:\s*([\s\S]*))?$/);
  if (current) {
    const metadata: Record<string, string> = {};
    (current[2] || '').split('\n').forEach(line => {
      const match = line.match(/^(장소|계절|선택|결과):\s*(.+)$/);
      if (match) metadata[match[1]] = match[2].trim();
    });
    const memory = current[1].trim() === APPLICATION_EMPTY_MEMORY ? '' : current[1];
    return {
      category: memory ? 'player-memory' : 'gameplay-event',
      origin: 'encounter',
      memory,
      outcome: [metadata['선택'], metadata['결과']].filter(Boolean).join('\n'),
      context: { location: metadata['장소'], season: metadata['계절'] },
      source: { prompt: (current[3] || '').trim() || undefined }
    };
  }

  // This delimiter was emitted by the application. It is the only older
  // Encounter format we split; unmatched legacy prose remains untouched.
  const legacy = text.match(/^([\s\S]*?)\n\n나의 선택: ?([\s\S]*)$/);
  if (legacy) {
    const pageMatch = legacy[1].match(/^\[p\.(\d+)\]\s*/);
    return {
      category: legacy[2].trim() ? 'player-memory' : 'gameplay-event',
      origin: 'encounter',
      memory: legacy[2],
      outcome: '',
      context: {},
      source: {
        page: pageMatch ? Number(pageMatch[1]) : undefined,
        prompt: legacy[1].replace(/^\[p\.\d+\]\s*/, '').trim()
      }
    };
  }

  return null;
};

const parseApplicationEncounter = (title: string, text: string): JournalPresentation | null => {
  if (!ENCOUNTER_TITLE.test(title)) return null;
  const exact = parseExactApplicationEncounter(title, text);
  if (exact) return exact;

  // The pre-semantic Foraging format concatenated a canonical prompt, an
  // optional player note, and application-generated follow-up text with no
  // reversible labels. Preserve the complete stored string as memory instead
  // of guessing at a boundary and accidentally translating the player's prose.
  return {
    category: text.trim() ? 'player-memory' : 'gameplay-event',
    origin: 'encounter',
    memory: text,
    outcome: '',
    context: {},
    source: {}
  };
};

const MANUAL_OVERRIDE_DELIMITER = '\n\n예외 처리 사유: ';

const parseApplicationManualRecord = (title: string, text: string): {
  page: number;
  ruleIds: string[];
  body: string;
  overrideReason?: string;
} | null => {
  if (!MANUAL_RECORD_TITLE.test(title)) return null;
  const match = text.match(/^\[([^\]\n]+) · p\.(\d+)\]\n([\s\S]*)$/);
  if (!match) return null;
  const ruleIds = match[1].split(',').map(ruleId => ruleId.trim()).filter(Boolean);
  if (ruleIds.length === 0) return null;

  const body = match[3];
  const overrideIndex = body.lastIndexOf(MANUAL_OVERRIDE_DELIMITER);
  const possibleOverride = overrideIndex >= 0
    ? body.slice(overrideIndex + MANUAL_OVERRIDE_DELIMITER.length)
    : '';
  return {
    page: Number(match[2]),
    ruleIds,
    body: overrideIndex >= 0 && possibleOverride.trim() ? body.slice(0, overrideIndex) : body,
    overrideReason: overrideIndex >= 0 && possibleOverride.trim() ? possibleOverride : undefined
  };
};

const semanticFromPresentation = (presentation: JournalPresentation): JournalSemanticData =>
  normalizeJournalSemantic({
    version: 1,
    category: presentation.category,
    origin: presentation.origin,
    memory: presentation.memory.trim() ? presentation.memory : undefined,
    outcome: presentation.outcome || undefined,
    context: Object.values(presentation.context).some(Boolean) ? presentation.context : undefined,
    source: Object.values(presentation.source).some(Boolean) ? presentation.source : undefined,
    audit: presentation.audit && Object.values(presentation.audit).some(Boolean) ? presentation.audit : undefined
  })!;

/**
 * Persist only legacy boundaries the application can identify exactly. Older
 * Foraging rows without labels remain raw strings and are handled conservatively
 * by the reader; attaching guessed semantics would make that guess permanent.
 */
const exactLegacyApplicationSemantic = (entry: JournalEntryLike): JournalSemanticData | undefined => {
  // Stable player-entry ids are the stronger boundary. A player is free to use
  // a title that happens to resemble an engine event; migration must never
  // reinterpret that prose as system output merely because the titles match.
  if ((entry.id && PLAYER_ENTRY_ID.test(entry.id))
    || entry.authorship === 'player'
    || typeof entry.playerMemory === 'string') return undefined;

  const encounter = parseExactApplicationEncounter(entry.title, entry.text);
  if (encounter) return semanticFromPresentation(encounter);

  const journeyReflection = parseJourneyReflection(entry);
  if (journeyReflection) return semanticFromPresentation(journeyReflection);

  const journeyStart = parseLegacyJourneyStart(entry);
  if (journeyStart) return semanticFromPresentation(journeyStart);

  const manual = parseApplicationManualRecord(entry.title, entry.text);
  if (manual) return semanticFromPresentation({
    category: manual.body.trim() ? 'player-memory' : 'gameplay-event',
    origin: 'manual',
    memory: manual.body,
    outcome: '',
    context: {},
    source: { page: manual.page, ruleIds: manual.ruleIds },
    audit: manual.overrideReason ? { overrideReason: manual.overrideReason } : undefined
  });

  if (entry.authorship === 'system'
    || SYSTEM_ONLY_OUTCOMES.has(entry.text.trim())
    || EXACT_LEGACY_SYSTEM_TITLES.some(pattern => pattern.test(entry.title.trim()))
    || EXACT_LEGACY_BARROW_SYSTEM_TITLES.some(pattern => pattern.test(entry.title.trim()))) {
    return normalizeJournalSemantic(semanticForEngineJournal(entry))!;
  }
  return undefined;
};

const parseJourneyReflection = (entry: JournalEntryLike): JournalPresentation | null => {
  if (!entry.id?.endsWith(':reflection') && !entry.title.startsWith('여정 출발 기록:')) return null;
  const [contextLine = '', ...memoryLines] = entry.text.split('\n');
  if (!/^출발지 .+ · .+ · 여정 기한 \d+일$/.test(contextLine)) return null;
  return {
    category: 'player-memory',
    origin: 'player',
    memory: memoryLines.join('\n'),
    outcome: '여정을 시작했습니다.',
    context: { journey: contextLine },
    source: {}
  };
};

const parseLegacyJourneyStart = (entry: JournalEntryLike): JournalPresentation | null => {
  if (!/^(?:Journey started|여정 시작)$/i.test(entry.title.trim())) return null;
  // Saves made before the semantic Journal boundary embedded map node ids,
  // the player's reason, and a Goal label in one implementation string.
  // Recover only the authored sentence; ids remain canonical state metadata.
  const legacy = entry.text.match(/^.+? to .+?\. Reason: ([\s\S]*?)\. Goal: [\s\S]*\.$/);
  if (!legacy) return null;
  return {
    category: 'player-memory',
    origin: 'engine',
    memory: legacy[1],
    outcome: '여정을 시작했습니다.',
    context: {},
    source: {}
  };
};

export const presentJournalEntry = (entry: JournalEntryLike): JournalPresentation => {
  const semantic = normalizeJournalSemantic(entry.semantic);
  if (semantic) {
    return {
      category: semantic.category,
      origin: semantic.origin,
      memory: semantic.memory || '',
      outcome: semantic.outcome || '',
      context: semantic.context || {},
      source: semantic.source || {},
      ...(semantic.audit ? { audit: semantic.audit } : {})
    };
  }

  const journeyReflection = parseJourneyReflection(entry);
  if (journeyReflection) return journeyReflection;

  const legacyJourneyStart = parseLegacyJourneyStart(entry);
  if (legacyJourneyStart) return legacyJourneyStart;

  const isPlayerEntry = Boolean(entry.id && PLAYER_ENTRY_ID.test(entry.id));
  if (isPlayerEntry) {
    return {
      category: 'player-memory', origin: 'player', memory: entry.text, outcome: '', context: {}, source: {}
    };
  }

  const encounter = parseApplicationEncounter(entry.title, entry.text);
  if (encounter) return encounter;

  const manual = parseApplicationManualRecord(entry.title, entry.text);
  if (manual) {
    // The old formatter placed resultSummary and journalNote into one unlabeled
    // body. They cannot be separated safely (both fields accepted paragraphs),
    // so keep that body verbatim rather than treating it as localisable output.
    return {
      category: manual.body.trim() ? 'player-memory' : 'gameplay-event',
      origin: 'manual',
      memory: manual.body,
      outcome: '',
      context: {},
      source: { page: manual.page, ruleIds: manual.ruleIds },
      audit: manual.overrideReason ? { overrideReason: manual.overrideReason } : undefined
    };
  }

  if (!entry.type && !isActivityTitle(entry.title) && !isSystemEventTitle(entry.title)) {
    // Unknown legacy rows may contain prose typed by the player. Never run an
    // uncertain string through a translation or metadata parser.
    return {
      category: 'player-memory', origin: 'player', memory: entry.text, outcome: '', context: {}, source: {}
    };
  }

  if (hasLegacyPlayerAuthorship(entry)) {
    return {
      category: 'player-memory', origin: 'engine', memory: entry.text,
      outcome: engineTitle(entry), context: {}, source: {}
    };
  }

  return {
    category: isActivityTitle(entry.title) ? 'activity' : 'gameplay-event',
    origin: 'engine',
    memory: '',
    outcome: localizeEventText(entry.text),
    context: {},
    source: {}
  };
};

export const journalDisplayTitle = (entry: JournalEntryLike): string =>
  presentJournalEntry(entry).origin === 'player'
    ? entry.title
    : localizeManualJournalTitle(engineTitle(entry));

export const isActivityJournalEntry = (entry: string | JournalEntryLike): boolean =>
  typeof entry === 'string'
    ? isActivityTitle(entry)
    : presentJournalEntry(entry).category === 'activity';

/**
 * Journal arrays are normally prepended newest-first, but imported and legacy
 * campaigns are not guaranteed to retain that insertion order. Sort a copy by
 * the persisted timestamp while keeping equal/malformed timestamps stable.
 */
export const journalEntriesNewestFirst = <T extends { timestamp?: number }>(entries: readonly T[]): T[] =>
  entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const leftTimestamp = Number.isFinite(left.entry.timestamp) ? left.entry.timestamp! : 0;
      const rightTimestamp = Number.isFinite(right.entry.timestamp) ? right.entry.timestamp! : 0;
      return rightTimestamp - leftTimestamp || left.index - right.index;
    })
    .map(({ entry }) => entry);

export const isLongJournalMemory = (memory: string): boolean =>
  memory.length > 600 || (memory.match(/\n/g)?.length || 0) >= 6;

const compactPreview = (value: string, maxLength = 180): string => {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  const candidate = compact.slice(0, maxLength + 1);
  const boundary = Math.max(candidate.lastIndexOf('. '), candidate.lastIndexOf('。'), candidate.lastIndexOf(' '));
  return `${candidate.slice(0, boundary > Math.floor(maxLength * 0.6) ? boundary : maxLength).trimEnd()}…`;
};

export const journalPreview = (entry: JournalEntryLike, maxLength = 180): string => {
  const presentation = presentJournalEntry(entry);
  if (presentation.memory.trim()) return compactPreview(presentation.memory, maxLength);
  if (presentation.outcome.trim()) return compactPreview(presentation.outcome, maxLength);
  const context = [presentation.context.location, presentation.context.season, presentation.context.patient, presentation.context.journey]
    .filter(Boolean)
    .join(' · ');
  return compactPreview(context || '남긴 내용이 없습니다.', maxLength);
};
