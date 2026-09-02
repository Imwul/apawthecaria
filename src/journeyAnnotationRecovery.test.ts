import { describe, expect, it } from 'vitest';
import { reconcileAbandonedJourneyAnnotations, setBarrowAnnotationRemoved, visibleMapEncounterRecords } from './journeyAnnotationRecovery';

describe('abandoned journey annotation recovery', () => {
  it('repairs a legacy reset using its start/reset journals and timestamp-based barrow ids', () => {
    const state = {
      journals: [
        { id: 'journey:100:old:journal', timestamp: 100 },
        { id: 'journey-reset:200', timestamp: 200 },
        { id: 'journey:300:new:journal', timestamp: 300 }
      ],
      journey: { journeyId: 'journey:300:new', startDate: 300 },
      barrows: [
        { id: 'barrow_50', name: 'Established rumour' },
        { id: 'barrow_150', name: 'Abandoned mark' },
        { id: 'bear-barrow:legacy', name: 'Old bear' },
        { id: 'bear-barrow:new', journeyId: 'journey:300:new', createdAt: 310 },
        { id: 'completed-journey-landmark', journeyId: 'completed', createdAt: 150 }
      ],
      mapEncounterRecords: [
        { id: 'old', createdAt: 50 },
        { id: 'abandoned', createdAt: 180 },
        { id: 'new', journeyId: 'journey:300:new', createdAt: 320 }
      ]
    };
    const repaired = reconcileAbandonedJourneyAnnotations(state);
    expect(repaired.barrows?.map(row => row.id)).toEqual(['barrow_50', 'bear-barrow:legacy', 'bear-barrow:new', 'completed-journey-landmark']);
    expect(repaired.mapEncounterRecords?.map(row => row.id)).toEqual(['old', 'new']);
    expect(repaired.journals).toEqual(state.journals);
    expect(reconcileAbandonedJourneyAnnotations(repaired)).toBe(repaired);
  });

  it('never treats every past journey as abandoned or guesses unknown landmark ownership', () => {
    const state = {
      journals: [{ id: 'journey-reset:200', timestamp: 200 }],
      journey: { journeyId: 'current' },
      barrows: [{ id: 'barrow_150' }, { id: 'unknown' }, { id: 'old', journeyId: 'completed' }]
    };
    expect(reconcileAbandonedJourneyAnnotations(state)).toBe(state);
  });

  it('uses explicit reset identity even when legacy records lack timestamps', () => {
    const state = {
      journeyResetHistory: [{ journeyId: 'abandoned', startedAt: 0, resetAt: 200 }],
      barrows: [{ id: 'discard', journeyId: 'abandoned' }, { id: 'keep', journeyId: 'completed' }],
      mapEncounterRecords: [{ id: 'discard-note', journeyId: 'abandoned' }]
    };
    expect(reconcileAbandonedJourneyAnnotations(state)).toMatchObject({
      barrows: [{ id: 'keep', journeyId: 'completed' }], mapEncounterRecords: []
    });
  });

  it('does not infer an abandoned journey from an older completed start when the actual start journal was deleted', () => {
    const state = {
      journals: [
        { id: 'journey:50:earlier:journal', timestamp: 50 },
        { id: 'journey:100:completed:journal', timestamp: 100 },
        { id: 'journey:100:completed:ending:journal', timestamp: 180 },
        { id: 'journey-reset:300', timestamp: 300 }
      ],
      barrows: [
        { id: 'earlier-landmark', journeyId: 'journey:50:earlier', createdAt: 75 },
        { id: 'completed-landmark', journeyId: 'journey:100:completed', createdAt: 150 },
        { id: 'unknown-mark', createdAt: 250 }
      ],
      mapEncounterRecords: [{ id: 'completed-memory', journeyId: 'journey:100:completed', createdAt: 160 }]
    };
    expect(reconcileAbandonedJourneyAnnotations(state)).toBe(state);
  });

  it('still repairs a proven later reset without touching the earlier completed journey', () => {
    const state = {
      journals: [
        { id: 'journey:100:completed:journal', timestamp: 100 },
        { id: 'journey:100:completed:ending:journal', timestamp: 180 },
        { id: 'journey:200:reset:journal', timestamp: 200 },
        { id: 'journey-reset:300', timestamp: 300 }
      ],
      barrows: [
        { id: 'completed-landmark', journeyId: 'journey:100:completed', createdAt: 150 },
        { id: 'reset-landmark', journeyId: 'journey:200:reset', createdAt: 250 }
      ]
    };
    expect(reconcileAbandonedJourneyAnnotations(state).barrows).toEqual([state.barrows[0]]);
  });

  it('leaves malformed annotation elements for the normal save validator instead of throwing', () => {
    const state = {
      journeyResetHistory: [{ journeyId: 'abandoned', startedAt: 100, resetAt: 200 }],
      mapEncounterRecords: [null, { id: 12, createdAt: 50 }, { id: 'discard', createdAt: 150 }]
    };
    const repaired = reconcileAbandonedJourneyAnnotations(state as unknown as Parameters<typeof reconcileAbandonedJourneyAnnotations>[0]);
    expect(repaired.mapEncounterRecords).toEqual([null, { id: 12, createdAt: 50 }]);
  });

  it('lets a player hide and restore an ambiguous legacy mark without granting rewards or erasing prose', () => {
    const state = {
      barrows: [{ id: 'bear-barrow:forest', locationId: 'forest', removed: false }],
      mapEncounterRecords: [
        { id: 'generated', locationId: 'forest', sourceEncounterId: 'foraging-forest-m-spring' },
        { id: 'personal', locationId: 'forest' }
      ],
      journals: [{ id: 'memory', timestamp: 1 }], reputation: 8, calendarDays: 2
    };
    const hidden = setBarrowAnnotationRemoved(state, 'bear-barrow:forest', true);
    expect(hidden.barrows[0].removed).toBe(true);
    expect(hidden.mapEncounterRecords).toBe(state.mapEncounterRecords);
    expect(visibleMapEncounterRecords(hidden.mapEncounterRecords, hidden.barrows)).toEqual([state.mapEncounterRecords[1]]);
    expect(hidden.journals).toBe(state.journals);
    expect(hidden.reputation).toBe(8);
    expect(hidden.calendarDays).toBe(2);
    const reloaded = JSON.parse(JSON.stringify(hidden)) as typeof hidden;
    expect(visibleMapEncounterRecords(reloaded.mapEncounterRecords, reloaded.barrows)).toEqual([state.mapEncounterRecords[1]]);
    const restored = setBarrowAnnotationRemoved(reloaded, 'bear-barrow:forest', false);
    expect(restored.barrows[0].removed).toBe(false);
    expect(visibleMapEncounterRecords(restored.mapEncounterRecords, restored.barrows)).toEqual(state.mapEncounterRecords);
  });

  it('keeps unrelated or unscoped personal map notes visible when hiding a bear landmark', () => {
    const records = [
      { id: 'other-location', locationId: 'bog', sourceEncounterId: 'foraging-forest-m-spring' },
      { id: 'other-encounter', locationId: 'forest', sourceEncounterId: 'foraging-forest-5-spring' },
      { id: 'personal', locationId: 'forest' },
      { id: 'unknown-location', sourceEncounterId: 'foraging-forest-m-spring' }
    ];
    const barrows = [{ id: 'bear-barrow:forest', locationId: 'forest', removed: true }];
    expect(visibleMapEncounterRecords(records, barrows)).toEqual(records);
  });
});
