import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlayGuide from './components/PlayGuide';
import { getCampaignContinuity } from './campaignContinuity';
import { getJourneyUiContext } from './journeyUiContext';
import { GUIDE_PAGES, GUIDE_TERMS, getFirstPlayMilestones, getGuideNextAction, searchGuideTerms, type PlayGuideState } from './playGuide';
import type { PendingBarterState } from './rules/barterEngine';
import type { PendingEncounterState, PendingForagingState } from './rules/gameplay';
import type { PatientState } from './rules/state';
import { JOURNAL_TABS } from './sessionNavigation';
import { RULEBOOK_REFERENCE_ENTRIES } from './rulebook/referenceRegistry';

const journeyState = (overrides: Partial<PlayGuideState> = {}): PlayGuideState => ({
  bio: { name: '클로버', familiarName: '도토리' }, journeyActive: true,
  journey: { journeyId: 'first-journey', destinationId: 'summit', status: 'active' },
  currentMapLocationId: 'odoak', currentLocationName: 'Odoak', journeyDestination: 'Summit',
  patients: [], bag: [], manualEffectQueue: [], ...overrides
});
const foraging = (overrides: Partial<PendingForagingState> = {}): PendingForagingState => ({
  transactionId: 'forage-1', region: 'Forest', locationRelation: 'current', card: { value: 3, suit: '♥' },
  timerCostAfterEncounter: 1, encounterId: null, phase: 'choose-reagent', ...overrides
});
const barter = (overrides: Partial<PendingBarterState> = {}): PendingBarterState => ({
  barterId: 'barter-1', patientId: 'patient-1', targetReagentId: 'reagent-1', preparationId: 'part-1',
  locationId: 'odoak', locationType: 'City', attemptIndex: 1, attemptsRemaining: 2,
  socialEncounter: null, firstCard: null, secondCard: null, calculatedBR: 4,
  modifiers: [], availability: { region: 'Common', season: 'Common' }, paymentRequired: 2,
  paymentSelection: { trinkets: 0, reputation: 0 }, status: 'awaiting-second-card', appliedEffectIds: [], ...overrides
});
const encounter = {
  transactionId: 'encounter-1', encounterId: 'travel-forest-3-4', phase: 'pending', unresolvedEffectCodes: [],
  card: { value: 4 }, encounter: { encounterType: 'travel', sourcePage: 78 }
} as PendingEncounterState;

describe('state-aware playing guidance', () => {
  it('finishes the last local encounter before offering the destination ending', () => {
    const state = journeyState({ currentMapLocationId: 'summit', pendingEncounter: encounter });
    expect(getJourneyUiContext(state).phase).toBe('encounter-pending');
    expect(getGuideNextAction(state).actionId).toBe('pending-encounter');
    expect(getGuideNextAction({ ...state, pendingEncounter: null }).actionId).toBe('journey-end');
  });

  it('keeps persisted blocker priority even when several old drafts coexist', () => {
    const state = journeyState({
      pendingManualEffect: {}, pendingEncounter: encounter, pendingForaging: foraging(),
      pendingBarter: barter(), pendingPatientArchive: { outcome: 'success' }, activeAilment: { timer: 3 }
    });
    expect(getGuideNextAction(state).actionId).toBe('manual-effect');
    expect(getGuideNextAction({ ...state, pendingManualEffect: null }).actionId).toBe('pending-encounter');
    expect(getGuideNextAction({ ...state, pendingManualEffect: null, pendingEncounter: null }).actionId).toBe('pending-foraging');
    const pendingBarter = { ...state, pendingManualEffect: null, pendingEncounter: null, pendingForaging: null };
    expect(getGuideNextAction(pendingBarter).targetId).toBe('patient-acquisition-panel');
    expect(getGuideNextAction({ ...pendingBarter, pendingBarter: null }).actionId).toBe('archive-patient');
  });

  it('finishes treatment reward before resuming an acquisition or writing the archive', () => {
    const state = journeyState({
      pendingTreatmentReward: { patientId: 'p' }, pendingForaging: foraging(),
      pendingBarter: barter(), pendingPatientArchive: { outcome: 'success' }
    });
    expect(getGuideNextAction(state)).toMatchObject({
      kind: 'treatment-reward', actionId: 'active-patient', targetId: 'treatment-workspace'
    });
    expect(getGuideNextAction({ ...state, pendingEncounter: encounter }).actionId).toBe('pending-encounter');
  });

  it('points an immediate-remedy checkpoint to treatment instead of another acquisition', () => {
    const fromForage = getGuideNextAction(journeyState({ pendingForaging: foraging({ phase: 'timer', awaitingImmediateRemedy: true }) }));
    expect(fromForage.targetId).toBe('treatment-workspace');
    expect(fromForage.reason).toContain('치료 기한을 줄이기 전에');
    const fromBarter = getGuideNextAction(journeyState({ pendingBarter: barter({ status: 'completed', awaitingImmediateRemedy: true }) }));
    expect(fromBarter.actionId).toBe('barter-immediate-remedy');
    expect(fromBarter.targetId).toBe('treatment-workspace');
  });

  it('uses canonical terminal journeys and campaign continuity for downtime', () => {
    const closed = journeyState({ journey: { journeyId: 'j', status: 'completed' }, downtimeRequired: true });
    expect(getCampaignContinuity(closed).stage).toBe('downtime-required');
    expect(getGuideNextAction(closed).actionId).toBe('downtime-activities');
    expect(getGuideNextAction({ ...closed, downtimeCompleted: true }).actionId).toBe('season-advance');
    expect(getGuideNextAction({ ...closed, downtimeRequired: false }).actionId).toBe('start-journey');
    expect(getGuideNextAction({ ...closed, pendingManualEffect: {} }).actionId).toBe('manual-effect');
  });

  it('does not revive treatment from a stale patient id after the patient is gone', () => {
    expect(getGuideNextAction(journeyState({ activePatientId: 'cured-patient', activeAilment: null })).actionId).toBe('travel-next');
  });

  it('shows the shortest live ailment timer and excludes a treated ailment', () => {
    const patient = {
      id: 'p', ailments: [{ status: 'active', timerIds: ['live-1', 'live-2'] }, { status: 'treated', timerIds: ['old'] }],
      timers: [{ id: 'live-1', current: 5, status: 'active' }, { id: 'live-2', current: 2, status: 'active' }, { id: 'old', current: 0, status: 'expired' }]
    } as PatientState;
    const next = getGuideNextAction(journeyState({ activePatientId: 'p', patients: [patient], activeAilment: { timer: 9 } }));
    expect(next.actionId).toBe('active-patient');
    expect(next.reason).toContain('2시간');
    expect(next.reason).not.toContain('0시간');
  });

  it('uses canonical active ailments when the legacy mirror is absent and rejects a cured mirror', () => {
    const patient = {
      id: 'p', status: 'active', ailments: [{ id: 'a', status: 'active', timerIds: ['t'] }],
      timers: [{ id: 't', current: 4, status: 'active' }]
    } as PatientState;
    expect(getGuideNextAction(journeyState({ activePatientId: 'p', patients: [patient], activeAilment: null })).actionId).toBe('active-patient');
    expect(getGuideNextAction(journeyState({ activePatientId: 'p', patients: [{ ...patient, status: 'cured' }], activeAilment: { timer: 99 } })).actionId).toBe('travel-next');
  });

  it('resolves escape and Delve obligations before ordinary treatment', () => {
    const chase = journeyState({ pursuedByBehemoth: {}, activeAilment: { timer: 4 } });
    expect(getGuideNextAction(chase).actionId).toBe('behemoth-chase');
    expect(getGuideNextAction({ ...chase, activeDelve: {} }).actionId).toBe('active-delve');
    expect(getGuideNextAction({ ...chase, pendingPatientArchive: {} }).actionId).toBe('archive-patient');
    expect(getGuideNextAction({ ...chase, pendingForaging: foraging() }).actionId).toBe('pending-foraging');
  });
});

describe('first-play evidence and embedded rules', () => {
  it('distinguishes a starting gift from forage and barter acquisitions, including consumed ingredients', () => {
    expect(getFirstPlayMilestones(journeyState({ bag: [{ type: 'reagent', canonicalReagentId: 'gift' }] }))[3].complete).toBe(false);
    for (const source of ['forage', 'barter']) {
      expect(getFirstPlayMilestones(journeyState({ bag: [{ type: 'reagent', provenance: { source } }] }))[3].complete).toBe(true);
    }
    const patient = { id: 'p', reagentsGathered: ['root'] } as PatientState;
    expect(getFirstPlayMilestones(journeyState({ patients: [patient], bag: [] }))[3].complete).toBe(true);
  });
  it('marks only evidence found in the save and never mistakes a failed archive for acquired medicine', () => {
    const steps = getFirstPlayMilestones(journeyState({ patientArchive: [{ treatmentResult: 'failure', success: false, remedyParts: [] }] }));
    expect(steps.map(step => step.complete)).toEqual([true, true, true, false, false]);
    expect(steps.find(step => step.current)?.id).toBe('reagents');
  });

  it('recognizes historical treatment after its consumed ingredients left the bag', () => {
    const steps = getFirstPlayMilestones(journeyState({
      journey: { status: 'completed' }, journeyActive: false, patientArchive: [{ treatmentResult: 'success', remedyParts: ['root'] }]
    }));
    expect(steps.every(step => step.complete)).toBe(true);
    expect(steps.some(step => step.current)).toBe(false);
  });

  it('keeps a partial legacy patient readable when treatment history is missing', () => {
    const legacyPatient = { id: 'old-patient', treatmentHistory: null } as PatientState;
    expect(() => getFirstPlayMilestones(journeyState({ patients: [legacyPatient] }))).not.toThrow();
    expect(getFirstPlayMilestones(journeyState({ patients: [legacyPatient] }))[3].complete).toBe(false);
  });

  it('has a page guide for each existing tab and valid rule references', () => {
    expect(Object.keys(GUIDE_PAGES).sort()).toEqual([...JOURNAL_TABS].sort());
    const ids = new Set(RULEBOOK_REFERENCE_ENTRIES.map(entry => entry.id));
    for (const item of [...Object.values(GUIDE_PAGES), ...GUIDE_TERMS]) {
      expect(ids.has(item.reference.entryId!), item.reference.entryId).toBe(true);
    }
    const recommendationStates = [
      journeyState(), journeyState({ bio: { name: '' } }),
      journeyState({ pendingManualEffect: {} }), journeyState({ pendingEncounter: encounter }),
      journeyState({ pendingEncounter: { ...encounter, encounter: { ...encounter.encounter, encounterType: 'social' } } }),
      journeyState({ pendingForaging: foraging() }), journeyState({ pendingForaging: foraging({ awaitingImmediateRemedy: true }) }),
      journeyState({ pendingBarter: barter() }), journeyState({ pendingBarter: barter({ awaitingImmediateRemedy: true }) }),
      journeyState({ pendingPatientArchive: { outcome: 'success' } }), journeyState({ activeDelve: {} }),
      journeyState({ scroungingMode: true }), journeyState({ activeAilment: { timer: 3 } }),
      journeyState({ needsLocalHelpBeforeMove: true }), journeyState({ currentMapLocationId: 'summit' }),
      journeyState({ pursuedByBehemoth: {} }), journeyState({ journey: null, journeyActive: false }),
      journeyState({ journey: null, journeyActive: false, downtimeRequired: true }),
      journeyState({ journey: null, journeyActive: false, downtimeCompleted: true })
    ];
    for (const state of recommendationStates) {
      const next = getGuideNextAction(state);
      expect(ids.has(next.reference.entryId!), next.reference.entryId).toBe(true);
    }
  });

  it('provides a focusable help target with the longer instructions initially folded', () => {
    const html = renderToStaticMarkup(createElement(PlayGuide, {
      state: journeyState(), tab: 'play', onNavigate: () => {}, onOpenReference: () => {}
    }));
    expect(html).toContain('id="play-guide" tabindex="-1"');
    expect(html).toContain('<details class="play-guide__details">');
    expect(html).toContain('<details class="play-guide__glossary">');
    expect(html).not.toMatch(/<details[^>]*\bopen(?:=|[\s>])/);
    expect(html).toContain('물물교환');
    expect(html).not.toContain('물꼬 거래');
  });

  it('keeps the play scene as the sole main action in help-only mode', () => {
    const props = { state: journeyState(), tab: 'play' as const, onNavigate: () => {}, onOpenReference: () => {} };
    const html = renderToStaticMarkup(createElement(PlayGuide, { ...props, mode: 'help-only' }));
    expect(html).toContain('play-guide--help-only');
    expect(html).toContain('플레이 도움말 · 지금 단계와 규칙');
    expect(html).not.toContain('class="play-guide__overview"');
    expect(html).not.toContain('class="play-guide__action"');
    expect(html).toMatch(/<details class="play-guide__details">[\s\S]*class="play-guide__current"/);
    expect(html).toContain(getGuideNextAction(props.state).reason);
    expect(html).not.toMatch(/<details[^>]*\bopen(?:=|[\s>])/);

  });

  it('keeps ordinary next actions available inside help without competing with reference tasks', () => {
    for (const tab of JOURNAL_TABS.filter(tab => tab !== 'play')) {
      const state = journeyState();
      const html = renderToStaticMarkup(createElement(PlayGuide, {
        state, tab, onNavigate: () => {}, onOpenReference: () => {}
      }));
      expect(html).not.toContain('class="play-guide__overview"');
      expect(html).toMatch(/<details class="play-guide__details">[\s\S]*class="play-guide__action"/);
      expect(html).toContain(getGuideNextAction(state).label);
      expect(html).toContain(GUIDE_PAGES[tab].title);
      expect(html).not.toMatch(/<details[^>]*\bopen(?:=|[\s>])/);
    }
  });

  it('keeps unfinished transactions visible on reference pages while avoiding a second play CTA', () => {
    const state = journeyState({ pendingEncounter: encounter });
    const props = { state, tab: 'reagents' as const, onNavigate: () => {}, onOpenReference: () => {} };
    const html = renderToStaticMarkup(createElement(PlayGuide, props));
    expect(html.indexOf('class="play-guide__overview"')).toBeLessThan(html.indexOf('<details'));
    expect(html).toContain('play-guide--urgent');
    expect(html).toContain(getGuideNextAction(state).label);
    expect(html).not.toContain('class="play-guide__current"');

    const play = renderToStaticMarkup(createElement(PlayGuide, { ...props, tab: 'play', mode: 'help-only' }));
    expect(play).not.toContain('class="play-guide__overview"');
    expect(play).not.toContain('class="play-guide__action"');
    expect(play).toContain(getGuideNextAction(state).reason);
  });

  it('finds both Korean and abbreviated terms without loose unrelated results', () => {
    expect(searchGuideTerms('fp').map(term => term.id)).toEqual(['fp']);
    expect(searchGuideTerms('약효 세기').map(term => term.id)).toContain('tag');
    expect(searchGuideTerms('FAIR FOUL').map(term => term.id)).toEqual(['fair-foul']);
    expect(searchGuideTerms('무존재단어')).toEqual([]);
    expect(searchGuideTerms('Make Do').map(term => term.id)).toContain('make-do');
    expect(searchGuideTerms('Replacement').map(term => term.id)).toContain('replacement');
    expect(searchGuideTerms('여분 약재').map(term => term.id)).toContain('scrounging');
  });
});
