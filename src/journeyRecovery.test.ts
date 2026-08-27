import { describe, expect, it } from 'vitest';
import { resetJourneyForPlanning } from './journeyRecovery';

describe('journey recovery reset', () => {
  it('discards the active journey workflow while preserving character and campaign data', () => {
    const state = {
      journeyActive: true,
      journey: { journeyId: 'journey-1', originId: 'odoak' },
      journeyOrigin: 'Odoak',
      journeyDestination: 'Fort Bulrush',
      calendarDays: 2,
      cumulativeDays: 19,
      bio: { name: 'Moss' },
      bag: [{ id: 'knife' }],
      reputation: 15,
      currentLocationName: 'Sailors Fang',
      customMapEdges: [{ from: 'a', to: 'b' }],
      journals: [{ id: 'old-memory' }],
      patientArchive: [{ caseId: 'old-patient' }],
      activePatientId: 'current-patient',
      patients: [
        { id: 'old-patient', status: 'cured' },
        { id: 'current-patient', status: 'active' }
      ],
      pendingEncounter: { id: 'encounter' },
      pendingForaging: { id: 'forage' },
      needsLocalHelpBeforeMove: true,
      routeDraft: {
        stops: [{ id: 'a', name: 'A', kind: 'Wilds' as const, terrain: 'Forest' as const, hasClinic: false, x: 0, y: 0 }],
        edgeKinds: []
      }
    };

    const reset = resetJourneyForPlanning(state, {
      id: 'odoak',
      name: 'Odoak',
      locationType: 'City',
      region: 'Forest'
    });
    expect(reset).toMatchObject({
      journeyActive: false,
      journey: null,
      journeyDestination: '',
      calendarDays: 0,
      cumulativeDays: 19,
      bio: { name: 'Moss' },
      bag: [{ id: 'knife' }],
      reputation: 15,
      currentLocationName: 'Odoak',
      currentMapLocationId: 'odoak',
      currentLocationType: 'City',
      currentRegion: 'Forest',
      customMapEdges: [{ from: 'a', to: 'b' }],
      journals: [{ id: 'old-memory' }],
      patientArchive: [{ caseId: 'old-patient' }],
      activePatientId: null,
      patients: [{ id: 'old-patient', status: 'cured' }],
      pendingEncounter: null,
      pendingForaging: null,
      needsLocalHelpBeforeMove: false,
      routeDraft: { stops: [], edgeKinds: [] }
    });
  });

  it('keeps the current location only when a legacy journey has no saved origin', () => {
    const reset = resetJourneyForPlanning({
      journeyActive: true,
      journey: null,
      journeyOrigin: '',
      currentLocationName: 'Unknown legacy stop',
      currentMapLocationId: 'legacy-stop'
    });
    expect(reset).toMatchObject({
      journeyActive: false,
      currentLocationName: 'Unknown legacy stop',
      currentMapLocationId: 'legacy-stop'
    });
  });

  it('removes journey-owned and legacy bear markers while keeping older permanent barrow rumours', () => {
    const reset = resetJourneyForPlanning({
      journeyActive: true,
      journey: { journeyId: 'journey-2', originId: 'odoak', startDate: 100 },
      journeyOrigin: 'Odoak',
      currentLocationName: 'Forest',
      barrows: [
        { id: 'journey-barrow', journeyId: 'journey-2', createdAt: 120 },
        { id: 'legacy-barrow', createdAt: 80 },
        { id: 'bear-barrow:forest' },
        { id: 'barrow_1', createdAt: 120 }
      ]
    });
    expect(reset.barrows).toEqual([{ id: 'legacy-barrow', createdAt: 80 }]);
  });
});
