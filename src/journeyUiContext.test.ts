import { describe, expect, it } from 'vitest';
import {
  getJourneyUiContext,
  journeyGoalConfirmationDefault,
  journeyOutcomePromptValue,
  journeyPhaseTransitionFocusTarget,
  type JourneyUiState
} from './journeyUiContext';

const active = (patch: Partial<JourneyUiState> = {}): JourneyUiState => ({
  journeyActive: true,
  journey: { journeyId: 'journey-1', destinationId: 'destination', status: 'active' },
  currentMapLocationId: 'origin',
  currentLocationName: 'Origin',
  journeyDestination: 'Destination',
  ...patch
});

describe('Journey UI context', () => {
  it('projects the meaningful A-H boundaries from canonical state', () => {
    expect(getJourneyUiContext({ journeyActive: false }).phase).toBe('idle');
    expect(getJourneyUiContext(active()).phase).toBe('route-ready');
    expect(getJourneyUiContext(active({ pendingEncounter: { id: 'encounter' } })).phase).toBe('encounter-pending');
    expect(getJourneyUiContext(active({ needsLocalHelpBeforeMove: true })).phase).toBe('local-care');
    expect(getJourneyUiContext(active({ currentMapLocationId: 'destination' })).phase).toBe('destination-ready');
    expect(getJourneyUiContext(active({
      currentMapLocationId: 'destination',
      journey: { journeyId: 'journey-1', destinationId: 'destination', status: 'ending' },
      pendingEnding: { journeyId: 'journey-1' }
    })).phase).toBe('ending');
    expect(getJourneyUiContext(active({
      journeyActive: true,
      journey: { journeyId: 'journey-1', destinationId: 'destination', status: 'completed' }
    }))).toMatchObject({ phase: 'completed', active: false, canMove: false });
  });

  it('keeps arrival prerequisites ahead of ending and never exposes another Move', () => {
    const encounter = getJourneyUiContext(active({ currentMapLocationId: 'destination', pendingEncounter: { id: 'encounter' } }));
    expect(encounter).toMatchObject({ phase: 'encounter-pending', atDestination: true, canMove: false, primaryActionId: 'pending-encounter' });

    const patient = getJourneyUiContext(active({ currentMapLocationId: 'destination', needsLocalHelpBeforeMove: true }));
    expect(patient).toMatchObject({ phase: 'local-care', atDestination: true, canMove: false, primaryActionId: 'local-help' });

    const ready = getJourneyUiContext(active({ currentMapLocationId: 'destination' }));
    expect(ready).toMatchObject({ phase: 'destination-ready', canMove: false, primaryActionId: 'journey-end' });
  });

  it('does not let an ending draft hide an unresolved arrival prerequisite', () => {
    const context = getJourneyUiContext(active({
      currentMapLocationId: 'destination',
      journey: { journeyId: 'journey-1', destinationId: 'destination', status: 'ending' },
      pendingEnding: { journeyId: 'journey-1' },
      pendingEncounter: { id: 'encounter' }
    }));
    expect(context).toMatchObject({
      phase: 'encounter-pending',
      primaryActionId: 'pending-encounter',
      canMove: false
    });
  });

  it('ignores terminal Barter receipts unless their immediate Remedy checkpoint is still open', () => {
    expect(getJourneyUiContext(active({
      pendingBarter: { status: 'completed' }
    }))).toMatchObject({ phase: 'route-ready', canMove: true });
    expect(getJourneyUiContext(active({
      pendingBarter: { status: 'abandoned' }
    }))).toMatchObject({ phase: 'route-ready', canMove: true });
    expect(getJourneyUiContext(active({
      pendingBarter: {
        status: 'completed',
        awaitingImmediateRemedy: true,
        immediateRemedyPatientId: 'patient-1',
        immediateRemedyAilmentIds: ['ailment-1']
      }
    }))).toMatchObject({ phase: 'local-care', canMove: false, primaryActionId: 'active-patient' });
  });

  it('uses printed names only as a legacy fallback when canonical ids are unavailable', () => {
    const mismatchedIds = getJourneyUiContext(active({
      currentMapLocationId: 'odoak-id',
      currentLocationName: 'Odoak',
      journeyDestination: 'Odoak',
      journey: { journeyId: 'journey-1', destinationId: 'sailors-fang-id', status: 'active' }
    }));
    expect(mismatchedIds.atDestination).toBe(false);

    const legacyNames = getJourneyUiContext(active({
      currentMapLocationId: '',
      currentLocationName: 'Sailors Fang',
      journeyDestination: 'Sailors Fang',
      journey: { journeyId: 'journey-1', destinationId: '', status: 'active' }
    }));
    expect(legacyNames.atDestination).toBe(true);
  });

  it('uses canonical status instead of a contradictory legacy journeyActive mirror', () => {
    expect(getJourneyUiContext(active({ journeyActive: false })).active).toBe(true);
    expect(getJourneyUiContext(active({
      journeyActive: true,
      journey: { journeyId: 'journey-1', destinationId: 'destination', status: 'abandoned' }
    }))).toMatchObject({ phase: 'completed', active: false });
  });

  it('requests focus only for a semantic phase change', () => {
    const route = getJourneyUiContext(active());
    expect(journeyPhaseTransitionFocusTarget('idle', route.phase, route.focusTargetId)).toBe('route-planning-panel');
    expect(journeyPhaseTransitionFocusTarget('route-ready', route.phase, route.focusTargetId)).toBeNull();
    const ending = getJourneyUiContext(active({ currentMapLocationId: 'destination' }));
    expect(journeyPhaseTransitionFocusTarget('route-ready', ending.phase, ending.focusTargetId)).toBe('journey-ending-panel');
  });

  it('uses the saved outcome before any initial default and never treats partial as goal-complete', () => {
    expect(journeyOutcomePromptValue(undefined, true)).toBe('1');
    expect(journeyOutcomePromptValue(undefined, false)).toBe('2');
    expect(journeyOutcomePromptValue('partial', true)).toBe('2');
    expect(journeyOutcomePromptValue('failure', true)).toBe('3');
    expect(journeyOutcomePromptValue('abandoned', true)).toBe('4');
    expect(journeyGoalConfirmationDefault('partial', undefined, true)).toBe('not-confirmed');
    expect(journeyGoalConfirmationDefault('success', undefined, true)).toBe('confirmed');
    expect(journeyGoalConfirmationDefault('success', false, true)).toBe('not-confirmed');
  });
});
