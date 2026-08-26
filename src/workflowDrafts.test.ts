import { describe, expect, it } from 'vitest';
import {
  normalizeCharacterCreationDraft,
  normalizeDraftCard,
  normalizeJourneyPreparationDraft,
  normalizePatientCreationDraft,
  normalizePendingTreatmentReward,
  normalizeWorkflowDrafts,
  patientDraftDiagnosisContextKey,
  pendingTreatmentRewardIsCompatible,
  type PatientCreationDraft,
  type PendingTreatmentReward
} from './workflowDrafts';

const context = {
  characterComplete: false,
  activePatient: false,
  journeyActive: false,
  currentLocationId: 'odoak',
  journeyId: null,
  currentSeason: 'spring',
  rulesetId: 'apawthecaria-v1',
  patientDiagnosisKey: 'diagnosis:a',
  appliedTransactionIds: [] as string[],
  patientIds: [] as string[]
};

const patientDraft = (overrides: Partial<PatientCreationDraft> = {}): PatientCreationDraft => ({
  version: 1,
  updatedAt: 17,
  transactionId: 'intake:1',
  context: {
    locationId: 'odoak',
    journeyId: null,
    rulesetId: 'apawthecaria-v1',
    diagnosisKey: 'diagnosis:a'
  },
  name: 'Pip',
  initialNote: 'At the gate',
  personalityCard: { suit: '♥', value: 3 },
  personalityChoice: 1,
  descriptorCard: { suit: '♦', value: 4 },
  species: 'Mole',
  severityCard: { suit: '♣', value: 5 },
  ailmentCard: { suit: '♠', value: 6 },
  ailmentCandidateCards: [],
  selectedAilmentCandidateIndex: null,
  multipleAilmentCards: [],
  chosenAilmentId: null,
  missiveChoiceResolved: false,
  diagnosisChoices: {},
  diagnosisCards: {},
  ...overrides
});

const pendingReward = (overrides: Partial<PendingTreatmentReward> = {}): PendingTreatmentReward => ({
  version: 1,
  createdAt: 23,
  transactionId: 'treatment:1',
  patientId: 'patient:1',
  ailmentInstanceId: 'ailment:1',
  sourceFingerprint: 'treatment-source:v1',
  selectedItemIds: ['reagent:1'],
  selectedToolIds: ['tool:1'],
  preserve: false,
  purify: false,
  purifyEligible: false,
  toolCards: {},
  trinketRewardBonus: 0,
  doseCount: 1,
  journalText: 'A careful remedy',
  ...overrides
});

describe('interrupted workflow persistence', () => {
  it('builds a stable Patient context from malformed legacy collections without throwing', () => {
    const malformed = patientDraftDiagnosisContextKey({
      rulesetId: 'legacy',
      reputation: '15',
      bio: { familiarBenefit: 'Helpful' },
      effectiveFamiliarBenefit: 'Observant',
      ingenuitiveToolId: 'steel-axe',
      currentLocationType: 'settlement',
      currentRegion: 'Forest',
      inClinicServiceArea: true,
      companionStates: [null, 4, { companionId: 'caterpillar' }],
      clinicAgendaIds: ['library', null, 7],
      clinics: [null, 'bad', { id: 'clinic:1', locationName: 'Odoak', agendaService: 'library', status: 'active' }],
      missiveSettlements: {},
      bag: [null, {
        id: 'tool:1',
        canonicalToolId: 'satchel',
        qty: '2',
        guildNote: { kind: 'ledger', region: 'Forest' }
      }],
      toolStates: [null, { instanceId: 'tool:1', broken: false }]
    });

    expect(JSON.parse(malformed)).toMatchObject({
      rulesetId: 'legacy',
      reputation: 15,
      familiarBenefit: 'Observant',
      ingenuitiveToolId: 'steel-axe',
      currentLocationType: 'settlement',
      currentRegion: 'Forest',
      inClinicServiceArea: true,
      caterpillarActive: true,
      clinicAgendaIds: ['library'],
      missiveSettlements: [],
      clinics: [['clinic:1', '', 'Odoak', 'library', 'active']],
      bag: [['tool:1', 'satchel', '', '', 2, 0, { kind: 'ledger', region: 'Forest' }]],
      toolStates: [{ instanceId: 'tool:1', broken: false }]
    });
  });

  it('changes the Patient diagnosis context for every branch-affecting input', () => {
    const base = {
      rulesetId: 'apawthecaria-v1',
      reputation: 20,
      effectiveFamiliarBenefit: 'Observant',
      ingenuitiveToolId: 'steel-axe',
      currentLocationType: 'settlement',
      currentRegion: 'Forest',
      inClinicServiceArea: true,
      companionStates: [{ companionId: 'caterpillar' }],
      clinicAgendaIds: ['library'],
      clinics: [{ id: 'clinic:1', locationId: 'odoak', locationName: 'Odoak', agendaService: 'library', status: 'active' }],
      missiveSettlements: ['Odoak'],
      bag: [{ id: 'note:1', qty: 1, guildNote: { kind: 'ledger', region: 'Forest' } }],
      toolStates: []
    };
    const key = patientDraftDiagnosisContextKey(base);

    expect(patientDraftDiagnosisContextKey({ ...base, effectiveFamiliarBenefit: 'Helpful' })).not.toBe(key);
    expect(patientDraftDiagnosisContextKey({ ...base, ingenuitiveToolId: 'birch-broom' })).not.toBe(key);
    expect(patientDraftDiagnosisContextKey({ ...base, currentLocationType: 'wilds' })).not.toBe(key);
    expect(patientDraftDiagnosisContextKey({ ...base, currentRegion: 'Meadow' })).not.toBe(key);
    expect(patientDraftDiagnosisContextKey({ ...base, inClinicServiceArea: false })).not.toBe(key);
    expect(patientDraftDiagnosisContextKey({
      ...base,
      bag: [{ id: 'note:1', qty: 1, guildNote: { kind: 'map', region: 'Forest' } }]
    })).not.toBe(key);
    expect(patientDraftDiagnosisContextKey({
      ...base,
      clinics: [{ ...base.clinics[0], locationId: 'fort-bulrush' }]
    })).not.toBe(key);
  });

  it('accepts only canonical playing cards and the exact supported draft version', () => {
    expect(normalizeDraftCard({ suit: '♥', value: 1 })).toEqual({ suit: '♥', value: 1 });
    expect(normalizeDraftCard({ suit: '♠', value: '13' })).toEqual({ suit: '♠', value: 13 });
    expect(normalizeDraftCard({ suit: 'hearts', value: 3 })).toBeNull();
    expect(normalizeDraftCard({ suit: '♥️', value: 3 })).toBeNull();
    expect(normalizeDraftCard({ suit: '♥', value: 0 })).toBeNull();
    expect(normalizeDraftCard({ suit: '♥', value: 14 })).toBeNull();
    expect(normalizeDraftCard({ suit: '♥', value: 2.5 })).toBeNull();

    expect(normalizeCharacterCreationDraft({ version: '1', touched: ['name'], name: 'Moss', cards: {} })).toBeNull();
    expect(normalizePatientCreationDraft({ ...patientDraft(), version: 2 })).toBeNull();
    expect(normalizeJourneyPreparationDraft({ version: 0, context: { originId: 'odoak', season: 'spring' } })).toBeNull();
    expect(normalizePendingTreatmentReward({ ...pendingReward(), version: '1' })).toBeNull();
  });

  it('distinguishes an empty Character placeholder from explicitly touched work', () => {
    expect(normalizeCharacterCreationDraft({ version: 1, touched: [], cards: {} })).toBeNull();
    expect(normalizeCharacterCreationDraft({ version: 1, touched: ['popoverOpen'], cards: {} })).toBeNull();
    expect(normalizeCharacterCreationDraft({
      version: 1,
      updatedAt: -4,
      touched: ['name', 'name'],
      name: '',
      animal: 'Untouched default',
      cards: {}
    })).toEqual({ version: 1, updatedAt: 0, touched: ['name'], name: '', cards: {} });

    expect(normalizeCharacterCreationDraft({
      version: 1,
      touched: [],
      cards: { self: { suit: '♣', value: 7 }, debug: { suit: '♥', value: 1 } }
    })).toEqual({ version: 1, updatedAt: 0, touched: [], cards: { self: { suit: '♣', value: 7 } } });

    expect(normalizeCharacterCreationDraft({
      version: 1,
      touched: [],
      cards: { self: { suit: 'clubs', value: 7 } }
    })).toBeNull();
  });

  it('keeps campaign-compatible meaningful drafts and rejects presentation junk', () => {
    const result = normalizeWorkflowDrafts({
      character: { version: 1, touched: ['name', 'animal'], name: 'Moss', animal: 'Badger', cards: { self: { suit: '♥', value: 3 } }, openPopover: true },
      patient: { ...patientDraft(), tooltip: 'open' },
      journey: { version: 1, context: { originId: 'odoak', season: 'spring' }, reason: 'A promise', destinationId: 'fort-bulrush', hover: 'map' }
    }, context);

    expect(result.character).toMatchObject({ name: 'Moss', animal: 'Badger', cards: { self: { suit: '♥', value: 3 } } });
    expect(result.patient).toMatchObject({ name: 'Pip', initialNote: 'At the gate' });
    expect(result.journey).toMatchObject({ reason: 'A promise', destinationId: 'fort-bulrush' });
    expect(result.character).not.toHaveProperty('openPopover');
    expect(result.patient).not.toHaveProperty('tooltip');
    expect(result.journey).not.toHaveProperty('hover');
  });

  it('drops transaction-only Patient and context-only Journey placeholders but keeps explicit modes', () => {
    expect(normalizePatientCreationDraft(patientDraft({
      name: '',
      initialNote: '',
      personalityCard: null,
      personalityChoice: null,
      descriptorCard: null,
      species: '',
      severityCard: null,
      ailmentCard: null
    }))).toBeNull();
    expect(normalizeJourneyPreparationDraft({
      version: 1,
      updatedAt: 5,
      context: { originId: 'odoak', season: 'spring' }
    })).toBeNull();
    expect(normalizeJourneyPreparationDraft({
      version: 1,
      updatedAt: 5,
      context: { originId: 'odoak', season: 'spring' },
      destinationMode: 'choose',
      goalMode: 'invent'
    })).toMatchObject({ destinationMode: 'choose', goalMode: 'invent' });
  });

  it('round-trips post-submit Journey choices that precede canonical commit', () => {
    expect(normalizeJourneyPreparationDraft({
      version: 1,
      updatedAt: 9,
      context: { originId: 'odoak', season: 'spring' },
      clayPotReagentId: 'reagent-marigold',
      resourcefulReagent: 'Rosehips',
      ingenuitiveTool: 'glass-alembic'
    })).toMatchObject({
      clayPotReagentId: 'reagent-marigold',
      resourcefulReagent: 'Rosehips',
      ingenuitiveTool: 'glass-alembic'
    });
  });

  it.each([
    ['an active Patient', { activePatient: true }],
    ['a changed location', { currentLocationId: 'fort-bulrush' }],
    ['a changed Journey', { journeyId: 'journey:2' }],
    ['a changed ruleset', { rulesetId: 'apawthecaria-v2' }],
    ['a changed diagnosis context', { patientDiagnosisKey: 'diagnosis:b' }],
    ['an already-applied intake transaction', { appliedTransactionIds: ['intake:1'] }],
    ['the already-created canonical Patient', { patientIds: ['patient-intake:1'] }]
  ])('invalidates a Patient draft after %s', (_label, override) => {
    const result = normalizeWorkflowDrafts({ patient: patientDraft() }, { ...context, ...override });
    expect(result.patient).toBeNull();
  });

  it('keeps the Patient draft only inside its exact campaign context', () => {
    expect(normalizeWorkflowDrafts({ patient: patientDraft() }, context).patient).toEqual(patientDraft());
    const journeyPatient = patientDraft({
      context: { ...patientDraft().context, journeyId: 'journey:1' }
    });
    expect(normalizeWorkflowDrafts({ patient: journeyPatient }, { ...context, journeyId: 'journey:1' }).patient)
      .toEqual(journeyPatient);
    expect(normalizeWorkflowDrafts({ patient: journeyPatient }, context).patient).toBeNull();
  });

  it('invalidates completed Character and started Journey drafts, including a changed season', () => {
    const source = {
      character: { version: 1, touched: ['name'], name: 'Moss', cards: {} },
      journey: { version: 1, context: { originId: 'odoak', season: 'spring' }, destinationId: 'fort-bulrush' }
    };
    expect(normalizeWorkflowDrafts(source, { ...context, characterComplete: true }).character).toBeNull();
    expect(normalizeWorkflowDrafts(source, { ...context, journeyActive: true }).journey).toBeNull();
    expect(normalizeWorkflowDrafts(source, { ...context, currentSeason: 'summer' }).journey).toBeNull();
    expect(normalizeWorkflowDrafts(source, context).journey).toMatchObject({ destinationId: 'fort-bulrush' });
  });

  it('normalizes a pending reward without restoring malformed or duplicate input', () => {
    const normalized = normalizePendingTreatmentReward({
      ...pendingReward(),
      createdAt: -1,
      selectedItemIds: ['reagent:1', '', 'reagent:1', 3],
      selectedToolIds: ['tool:1', 'tool:1', null],
      catalyse: [
        { tag: 'MOOD', itemIds: ['reagent:1', 'reagent:2'] },
        { tag: 'FORM', itemIds: ['only-one'] },
        null
      ],
      toolCards: {
        'tool:1': { suit: '♦', value: 8 },
        broken: { suit: 'diamonds', value: 8 }
      },
      trinketRewardBonus: -2,
      doseCount: '2',
      preserve: 'false',
      purify: 1,
      purifyEligible: 'true',
      confirmedManualRequirements: ['spoken', 'spoken', '', 4],
      unknownCheckpointUi: true
    });

    expect(normalized).toEqual({
      ...pendingReward(),
      createdAt: 0,
      selectedItemIds: ['reagent:1'],
      selectedToolIds: ['tool:1'],
      catalyse: [{ tag: 'MOOD', itemIds: ['reagent:1', 'reagent:2'] }],
      toolCards: { 'tool:1': { suit: '♦', value: 8 } },
      trinketRewardBonus: 0,
      doseCount: 1,
      preserve: false,
      purify: false,
      purifyEligible: false,
      confirmedManualRequirements: ['spoken']
    });
    expect(normalizePendingTreatmentReward({ ...pendingReward(), transactionId: '' })).toBeNull();
    expect(normalizePendingTreatmentReward({ ...pendingReward(), patientId: '' })).toBeNull();
    expect(normalizePendingTreatmentReward({ ...pendingReward(), ailmentInstanceId: '' })).toBeNull();
    expect(normalizePendingTreatmentReward({ ...pendingReward(), sourceFingerprint: '' })).toBeNull();
    expect(normalizePatientCreationDraft({ ...patientDraft(), missiveChoiceResolved: 'false' })).toMatchObject({ missiveChoiceResolved: false });
  });

  it.each([
    ['the transaction was already applied', { appliedTransactionIds: ['treatment:1'] }, false],
    ['another Patient is active', { patientId: 'patient:2' }, false],
    ['the Ailment is no longer active', { activeAilmentInstanceIds: ['ailment:2'] }, false],
    ['a selected reagent disappeared', { inventoryItemIds: [] }, false],
    ['a selected Tool disappeared', { toolInstanceIds: [] }, false],
    ['a Catalyse reagent is not part of the remedy', {
      pending: pendingReward({ catalyse: [{ tag: 'MOOD', itemIds: ['reagent:1', 'reagent:2'] }] }),
      inventoryItemIds: ['reagent:1', 'reagent:2']
    }, false],
    ['the prepared source state changed', { sourceFingerprint: 'treatment-source:changed' }, false],
    ['the same uncommitted context remains', {}, true]
  ])('checks pending Treatment compatibility when %s', (_label, override, expected) => {
    const base = {
      appliedTransactionIds: [] as string[],
      patientId: 'patient:1',
      activeAilmentInstanceIds: ['ailment:1'],
      inventoryItemIds: ['reagent:1'],
      toolInstanceIds: ['tool:1'],
      sourceFingerprint: 'treatment-source:v1'
    };
    const { pending = pendingReward(), ...contextOverride } = override as typeof override & { pending?: PendingTreatmentReward };
    expect(pendingTreatmentRewardIsCompatible(pending, { ...base, ...contextOverride })).toBe(expected);
  });

  it('is stable across repeated normalization and a JSON save/reload round trip', () => {
    const once = normalizeWorkflowDrafts({
      character: { version: 1, updatedAt: 11, touched: ['name'], name: 'Moss', cards: { travel: { suit: '♣', value: 7 } } },
      patient: patientDraft(),
      journey: { version: 1, updatedAt: 12, context: { originId: 'odoak', season: 'spring' }, reason: 'A promise' }
    }, context);
    const roundTripped = JSON.parse(JSON.stringify(once));
    expect(normalizeWorkflowDrafts(once, context)).toEqual(once);
    expect(normalizeWorkflowDrafts(roundTripped, context)).toEqual(once);

    const pendingOnce = normalizePendingTreatmentReward(pendingReward({
      catalyse: [{ tag: 'MOOD', itemIds: ['reagent:1', 'reagent:2'] }],
      confirmedManualRequirements: ['spoken']
    }));
    expect(normalizePendingTreatmentReward(pendingOnce)).toEqual(pendingOnce);
    expect(normalizePendingTreatmentReward(JSON.parse(JSON.stringify(pendingOnce)))).toEqual(pendingOnce);
  });
});
