/**
 * Interrupted-workflow state classification
 *
 * A — committed gameplay remains in the canonical campaign fields.
 * B — only costly, unfinished player thought lives in `WorkflowDrafts`.
 * C — focus, open panels, validation notices, hover and other presentation state
 *     intentionally remain component-local.
 *
 * A pending Treatment reward is not a generic draft: it is a durable workflow
 * checkpoint whose underlying Treatment transaction has been prepared but has
 * not yet been committed. Restoring any value in this module is side-effect free.
 *
 * Lifecycle contract for every workflow in this file:
 * CREATE/UPDATE write only meaningful player work; RESUME restores it without
 * applying gameplay effects; COMMIT moves it into canonical campaign state and
 * clears the draft atomically; CLEAR/ABANDON remove only the matching workflow;
 * INVALIDATE drops stale work when its campaign context or transaction no longer
 * matches. Presentation-only state is never promoted into this lifecycle.
 */

export type DraftCard = {
  suit: string;
  value: number;
};

export type CharacterDraftCardKey =
  | 'self'
  | 'travel'
  | 'origin'
  | 'familiar'
  | 'familiarBenefit'
  | 'relationship';

export type CharacterDraftField =
  | 'name'
  | 'descriptorName'
  | 'animal'
  | 'travelName'
  | 'originName'
  | 'originJournal'
  | 'mementoNote'
  | 'familiarName'
  | 'familiarDescriptorName'
  | 'familiarAnimal'
  | 'familiarBenefitName'
  | 'relationshipName'
  | 'familiarJournal'
  | 'relationshipJournal'
  | 'resourcefulReagent'
  | 'ingenuitiveTool';

export interface CharacterCreationDraft {
  version: 1;
  updatedAt: number;
  touched: CharacterDraftField[];
  name?: string;
  descriptorName?: string;
  animal?: string;
  travelName?: string;
  originName?: string;
  originJournal?: string;
  mementoNote?: string;
  familiarName?: string;
  familiarDescriptorName?: string;
  familiarAnimal?: string;
  familiarBenefitName?: string;
  relationshipName?: string;
  familiarJournal?: string;
  relationshipJournal?: string;
  resourcefulReagent?: string;
  ingenuitiveTool?: string;
  cards: Partial<Record<CharacterDraftCardKey, DraftCard>>;
}

export interface PatientCreationDraft {
  version: 1;
  updatedAt: number;
  transactionId: string;
  context: {
    locationId: string;
    journeyId: string | null;
    rulesetId: string;
    diagnosisKey: string;
  };
  name: string;
  initialNote: string;
  personalityCard: DraftCard | null;
  personalityChoice: 0 | 1 | 2 | null;
  descriptorCard: DraftCard | null;
  species: string;
  severityCard: DraftCard | null;
  ailmentCard: DraftCard | null;
  ailmentCandidateCards: DraftCard[];
  selectedAilmentCandidateIndex: number | null;
  multipleAilmentCards: DraftCard[];
  chosenAilmentId: string | null;
  missiveChoiceResolved: boolean;
  diagnosisChoices: Record<string, string>;
  diagnosisCards: Record<string, DraftCard>;
}

export interface JourneyPreparationDraft {
  version: 1;
  updatedAt: number;
  context: {
    originId: string;
    season: string;
  };
  destinationMode?: 'draw' | 'choose';
  destinationCard?: DraftCard | null;
  destinationId?: string;
  distanceConfirmedManually?: boolean;
  reason?: string;
  goalMode?: 'table' | 'invent';
  goalCard?: DraftCard | null;
  customGoalTitle?: string;
  customGoalRequirement?: string;
  reflection?: string;
  clayPotReagentId?: string;
  resourcefulReagent?: string;
  ingenuitiveTool?: string;
}

export interface WorkflowDrafts {
  character: CharacterCreationDraft | null;
  patient: PatientCreationDraft | null;
  journey: JourneyPreparationDraft | null;
}

export interface PendingTreatmentReward {
  version: 1;
  createdAt: number;
  transactionId: string;
  patientId: string;
  ailmentInstanceId: string;
  /** Fingerprint of every canonical input used to prepare this unresolved Treatment. */
  sourceFingerprint: string;
  selectedItemIds: string[];
  selectedToolIds: string[];
  catalyse?: Array<{ tag: string; itemIds: [string, string] }>;
  preserve: boolean;
  purify: boolean;
  purifyEligible: boolean;
  toolCards: Record<string, DraftCard>;
  trinketRewardBonus: number;
  doseCount: number;
  journalText: string;
  badIdeaOutcome?:
    | { kind: 'upgrade-basic-tool'; toolInstanceId: string; upgradeId: string }
    | { kind: 'lighten-tool'; toolInstanceId: string };
  confirmedManualRequirements?: string[];
}

export const patientCreationDraftHasMeaningfulWork = (draft: PatientCreationDraft): boolean => Boolean(
  draft.name.trim()
  || draft.initialNote.trim()
  || draft.personalityCard
  || draft.personalityChoice !== null
  || draft.descriptorCard
  || draft.species.trim()
  || draft.severityCard
  || draft.ailmentCard
  || draft.ailmentCandidateCards.length > 0
  || draft.selectedAilmentCandidateIndex !== null
  || draft.multipleAilmentCards.length > 0
  || draft.chosenAilmentId
  || draft.missiveChoiceResolved
  || Object.keys(draft.diagnosisChoices).length > 0
  || Object.keys(draft.diagnosisCards).length > 0
);

export const journeyPreparationDraftHasMeaningfulWork = (draft: JourneyPreparationDraft): boolean => Boolean(
  draft.destinationMode !== undefined
  || draft.destinationCard
  || draft.destinationId?.trim()
  || draft.distanceConfirmedManually
  || draft.reason?.trim()
  || draft.goalMode !== undefined
  || draft.goalCard
  || draft.customGoalTitle?.trim()
  || draft.customGoalRequirement?.trim()
  || draft.reflection?.trim()
  || draft.clayPotReagentId?.trim()
  || draft.resourcefulReagent?.trim()
  || draft.ingenuitiveTool?.trim()
);

export const EMPTY_WORKFLOW_DRAFTS: WorkflowDrafts = {
  character: null,
  patient: null,
  journey: null
};

const text = (value: unknown): string => typeof value === 'string' ? value : '';
const timestamp = (value: unknown): number => Number.isFinite(value) && Number(value) >= 0 ? Number(value) : 0;
const stringArray = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry)))]
  : [];

/** Stable diagnosis inputs only; malformed legacy collections collapse safely. */
export const patientDraftDiagnosisContextKey = (value: unknown): string => {
  const row = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const bio = row.bio && typeof row.bio === 'object' && !Array.isArray(row.bio)
    ? row.bio as Record<string, unknown>
    : {};
  const records = (input: unknown): Record<string, unknown>[] => Array.isArray(input)
    ? input.filter((entry): entry is Record<string, unknown> => Boolean(entry)
      && typeof entry === 'object'
      && !Array.isArray(entry))
    : [];
  const strings = (input: unknown): string[] => Array.isArray(input)
    ? input.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const normalizedGuildNote = (value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const note = value as Record<string, unknown>;
    const kind = text(note.kind);
    if (!kind) return null;
    return { kind, region: text(note.region) || null };
  };
  return JSON.stringify({
    rulesetId: text(row.rulesetId),
    reputation: Number(row.reputation) || 0,
    familiarBenefit: text(row.effectiveFamiliarBenefit) || text(bio.familiarBenefit),
    ingenuitiveToolId: text(row.ingenuitiveToolId),
    currentLocationType: text(row.currentLocationType),
    currentRegion: text(row.currentRegion),
    inClinicServiceArea: row.inClinicServiceArea === true,
    caterpillarActive: records(row.companionStates).some(entry => entry.companionId === 'caterpillar'),
    clinicAgendaIds: strings(row.clinicAgendaIds).sort(),
    clinics: records(row.clinics)
      .map(entry => [text(entry.id), text(entry.locationId), text(entry.locationName), text(entry.agendaService), text(entry.status)])
      .sort(),
    missiveSettlements: strings(row.missiveSettlements).sort(),
    bag: records(row.bag).map(entry => [
      text(entry.id),
      text(entry.canonicalToolId),
      text(entry.canonicalReagentId),
      text(entry.preparationId),
      Number(entry.qty) || 0,
      Number(entry.usesRemaining) || 0,
      normalizedGuildNote(entry.guildNote)
    ]),
    toolStates: records(row.toolStates)
  });
};

export const normalizeDraftCard = (value: unknown): DraftCard | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { suit?: unknown; value?: unknown };
  const numericValue = Number(candidate.value);
  if (!['♥', '♦', '♣', '♠'].includes(String(candidate.suit))
    || !Number.isInteger(numericValue) || numericValue < 1 || numericValue > 13) return null;
  return { suit: String(candidate.suit), value: numericValue };
};

const normalizeCardRecord = <K extends string>(value: unknown, allowed: readonly K[]): Partial<Record<K, DraftCard>> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  return Object.fromEntries(allowed.flatMap(key => {
    const card = normalizeDraftCard(source[key]);
    return card ? [[key, card]] : [];
  })) as Partial<Record<K, DraftCard>>;
};

export const normalizeCharacterCreationDraft = (value: unknown): CharacterCreationDraft | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (row.version !== 1) return null;
  const allowedFields: CharacterDraftField[] = [
    'name', 'descriptorName', 'animal', 'travelName', 'originName', 'originJournal', 'mementoNote',
    'familiarName', 'familiarDescriptorName', 'familiarAnimal', 'familiarBenefitName', 'relationshipName',
    'familiarJournal', 'relationshipJournal', 'resourcefulReagent', 'ingenuitiveTool'
  ];
  const touched = Array.isArray(row.touched)
    ? [...new Set(row.touched.filter((field): field is CharacterDraftField => allowedFields.includes(field as CharacterDraftField)))]
    : [];
  const cards = normalizeCardRecord(row.cards, ['self', 'travel', 'origin', 'familiar', 'familiarBenefit', 'relationship'] as const);
  if (touched.length === 0 && Object.keys(cards).length === 0) return null;
  const fields = Object.fromEntries(touched.map(field => [field, text(row[field])])) as Partial<CharacterCreationDraft>;
  return {
    version: 1,
    updatedAt: timestamp(row.updatedAt),
    touched,
    ...fields,
    cards
  };
};

export const normalizePatientCreationDraft = (value: unknown): PatientCreationDraft | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (row.version !== 1) return null;
  const context = row.context && typeof row.context === 'object' && !Array.isArray(row.context)
    ? row.context as Record<string, unknown>
    : {};
  const transactionId = text(row.transactionId);
  if (!transactionId) return null;
  const hasPersonalityChoice = row.personalityChoice !== null && row.personalityChoice !== undefined;
  const choice = Number(row.personalityChoice);
  const diagnosisChoices = row.diagnosisChoices && typeof row.diagnosisChoices === 'object' && !Array.isArray(row.diagnosisChoices)
    ? Object.fromEntries(Object.entries(row.diagnosisChoices as Record<string, unknown>)
      .flatMap(([key, entry]) => typeof entry === 'string' && entry ? [[key, entry]] : []))
    : {};
  const diagnosisCards = row.diagnosisCards && typeof row.diagnosisCards === 'object' && !Array.isArray(row.diagnosisCards)
    ? Object.fromEntries(Object.entries(row.diagnosisCards as Record<string, unknown>)
      .flatMap(([key, entry]) => {
        const card = normalizeDraftCard(entry);
        return card ? [[key, card]] : [];
      }))
    : {};
  const normalized: PatientCreationDraft = {
    version: 1,
    updatedAt: timestamp(row.updatedAt),
    transactionId,
    context: {
      locationId: text(context.locationId),
      journeyId: typeof context.journeyId === 'string' && context.journeyId ? context.journeyId : null,
      rulesetId: text(context.rulesetId),
      diagnosisKey: text(context.diagnosisKey)
    },
    name: text(row.name),
    initialNote: text(row.initialNote),
    personalityCard: normalizeDraftCard(row.personalityCard),
    personalityChoice: hasPersonalityChoice && [0, 1, 2].includes(choice) ? choice as 0 | 1 | 2 : null,
    descriptorCard: normalizeDraftCard(row.descriptorCard),
    species: text(row.species),
    severityCard: normalizeDraftCard(row.severityCard),
    ailmentCard: normalizeDraftCard(row.ailmentCard),
    ailmentCandidateCards: Array.isArray(row.ailmentCandidateCards)
      ? row.ailmentCandidateCards.map(normalizeDraftCard).filter((card): card is DraftCard => Boolean(card)).slice(0, 2)
      : [],
    selectedAilmentCandidateIndex: row.selectedAilmentCandidateIndex !== null
      && row.selectedAilmentCandidateIndex !== undefined
      && [0, 1].includes(Number(row.selectedAilmentCandidateIndex))
      ? Number(row.selectedAilmentCandidateIndex)
      : null,
    multipleAilmentCards: Array.isArray(row.multipleAilmentCards)
      ? row.multipleAilmentCards.map(normalizeDraftCard).filter((card): card is DraftCard => Boolean(card))
      : [],
    chosenAilmentId: typeof row.chosenAilmentId === 'string' && row.chosenAilmentId ? row.chosenAilmentId : null,
    missiveChoiceResolved: row.missiveChoiceResolved === true,
    diagnosisChoices,
    diagnosisCards
  };
  return patientCreationDraftHasMeaningfulWork(normalized) ? normalized : null;
};

export const normalizeJourneyPreparationDraft = (value: unknown): JourneyPreparationDraft | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (row.version !== 1) return null;
  const context = row.context && typeof row.context === 'object' && !Array.isArray(row.context)
    ? row.context as Record<string, unknown>
    : {};
  const result: JourneyPreparationDraft = {
    version: 1,
    updatedAt: timestamp(row.updatedAt),
    context: { originId: text(context.originId), season: text(context.season) }
  };
  if (row.destinationMode === 'draw' || row.destinationMode === 'choose') result.destinationMode = row.destinationMode;
  if ('destinationCard' in row) result.destinationCard = normalizeDraftCard(row.destinationCard);
  if (typeof row.destinationId === 'string') result.destinationId = row.destinationId;
  if (typeof row.distanceConfirmedManually === 'boolean') result.distanceConfirmedManually = row.distanceConfirmedManually;
  if (typeof row.reason === 'string') result.reason = row.reason;
  if (row.goalMode === 'table' || row.goalMode === 'invent') result.goalMode = row.goalMode;
  if ('goalCard' in row) result.goalCard = normalizeDraftCard(row.goalCard);
  if (typeof row.customGoalTitle === 'string') result.customGoalTitle = row.customGoalTitle;
  if (typeof row.customGoalRequirement === 'string') result.customGoalRequirement = row.customGoalRequirement;
  if (typeof row.reflection === 'string') result.reflection = row.reflection;
  if (typeof row.clayPotReagentId === 'string') result.clayPotReagentId = row.clayPotReagentId;
  if (typeof row.resourcefulReagent === 'string') result.resourcefulReagent = row.resourcefulReagent;
  if (typeof row.ingenuitiveTool === 'string') result.ingenuitiveTool = row.ingenuitiveTool;
  return journeyPreparationDraftHasMeaningfulWork(result) ? result : null;
};

export const normalizeWorkflowDrafts = (value: unknown, context: {
  characterComplete: boolean;
  activePatient: boolean;
  journeyActive: boolean;
  currentLocationId: string;
  journeyId: string | null;
  currentSeason?: string;
  rulesetId?: string;
  patientDiagnosisKey?: string;
  appliedTransactionIds?: readonly string[];
  patientIds?: readonly string[];
}): WorkflowDrafts => {
  const row = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const character = context.characterComplete ? null : normalizeCharacterCreationDraft(row.character);
  const patientCandidate = normalizePatientCreationDraft(row.patient);
  const patient = context.activePatient
    || (patientCandidate && (patientCandidate.context.locationId !== context.currentLocationId
      || patientCandidate.context.journeyId !== context.journeyId
      || (context.rulesetId !== undefined && patientCandidate.context.rulesetId !== context.rulesetId)
      || (context.patientDiagnosisKey !== undefined && patientCandidate.context.diagnosisKey !== context.patientDiagnosisKey)
      || Boolean(context.appliedTransactionIds?.includes(patientCandidate.transactionId))
      || Boolean(context.patientIds?.includes(`patient-${patientCandidate.transactionId}`))))
    ? null
    : patientCandidate;
  const journeyCandidate = normalizeJourneyPreparationDraft(row.journey);
  const journey = context.journeyActive
    || (journeyCandidate && (journeyCandidate.context.originId !== context.currentLocationId
      || (context.currentSeason !== undefined && journeyCandidate.context.season !== context.currentSeason)))
    ? null
    : journeyCandidate;
  return { character, patient, journey };
};

export const normalizePendingTreatmentReward = (value: unknown): PendingTreatmentReward | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (row.version !== 1) return null;
  const transactionId = text(row.transactionId);
  const patientId = text(row.patientId);
  const ailmentInstanceId = text(row.ailmentInstanceId);
  const sourceFingerprint = text(row.sourceFingerprint);
  if (!transactionId || !patientId || !ailmentInstanceId || !sourceFingerprint) return null;
  const catalyse = Array.isArray(row.catalyse) ? row.catalyse.flatMap(entry => {
    if (!entry || typeof entry !== 'object') return [];
    const candidate = entry as { tag?: unknown; itemIds?: unknown };
    if (typeof candidate.tag !== 'string' || !Array.isArray(candidate.itemIds) || candidate.itemIds.length !== 2
      || candidate.itemIds.some(item => typeof item !== 'string')) return [];
    return [{ tag: candidate.tag, itemIds: [candidate.itemIds[0], candidate.itemIds[1]] as [string, string] }];
  }) : undefined;
  const badIdea = row.badIdeaOutcome && typeof row.badIdeaOutcome === 'object' && !Array.isArray(row.badIdeaOutcome)
    ? row.badIdeaOutcome as Record<string, unknown>
    : null;
  const badIdeaOutcome = badIdea?.kind === 'upgrade-basic-tool'
    && typeof badIdea.toolInstanceId === 'string'
    && typeof badIdea.upgradeId === 'string'
    ? { kind: 'upgrade-basic-tool' as const, toolInstanceId: badIdea.toolInstanceId, upgradeId: badIdea.upgradeId }
    : badIdea?.kind === 'lighten-tool' && typeof badIdea.toolInstanceId === 'string'
      ? { kind: 'lighten-tool' as const, toolInstanceId: badIdea.toolInstanceId }
      : undefined;
  return {
    version: 1,
    createdAt: timestamp(row.createdAt),
    transactionId,
    patientId,
    ailmentInstanceId,
    sourceFingerprint,
    selectedItemIds: stringArray(row.selectedItemIds),
    selectedToolIds: stringArray(row.selectedToolIds),
    catalyse,
    preserve: row.preserve === true,
    purify: row.purify === true,
    purifyEligible: row.purifyEligible === true,
    toolCards: normalizeCardRecord(row.toolCards, Object.keys((row.toolCards || {}) as object)),
    trinketRewardBonus: Math.max(0, Number.isFinite(row.trinketRewardBonus) ? Number(row.trinketRewardBonus) : 0),
    doseCount: row.doseCount === 2 ? 2 : 1,
    journalText: text(row.journalText),
    badIdeaOutcome,
    confirmedManualRequirements: stringArray(row.confirmedManualRequirements)
  };
};

export const pendingTreatmentRewardIsCompatible = (pending: PendingTreatmentReward | null, context: {
  appliedTransactionIds: readonly string[];
  patientId: string | null;
  activeAilmentInstanceIds: readonly string[];
  inventoryItemIds: readonly string[];
  toolInstanceIds?: readonly string[];
  sourceFingerprint?: string;
}): boolean => Boolean(pending
  && !context.appliedTransactionIds.includes(pending.transactionId)
  && pending.patientId === context.patientId
  && context.activeAilmentInstanceIds.includes(pending.ailmentInstanceId)
  && pending.selectedItemIds.every(itemId => context.inventoryItemIds.includes(itemId))
  && pending.catalyse?.every(selection => selection.itemIds.every(itemId =>
    pending.selectedItemIds.includes(itemId) && context.inventoryItemIds.includes(itemId)
  )) !== false
  && (context.toolInstanceIds === undefined
    || pending.selectedToolIds.every(toolId => context.toolInstanceIds!.includes(toolId)))
  && (context.toolInstanceIds === undefined
    || !pending.badIdeaOutcome
    || context.toolInstanceIds.includes(pending.badIdeaOutcome.toolInstanceId))
  && (context.sourceFingerprint === undefined || pending.sourceFingerprint === context.sourceFingerprint));
