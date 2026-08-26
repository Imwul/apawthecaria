import { describe, expect, it } from 'vitest';
import {
  ALMANACK_TOOLS,
  BARROW_DELVES,
  CLINIC_AGENDAS,
  COMPANIONS,
  CURRENT_SCHEMA_VERSION,
  GUILD_SERVICES,
  REAGENTS,
  TOOL_UPGRADES,
  WAGON_EXPANSIONS,
  advanceCompanionSeason,
  advanceCompanions,
  beginBarrowChallenge,
  clinicServiceArea,
  commissionWagon,
  commissionClinic,
  createReplacementAcquisition,
  createTrinketRecord,
  drawCollapsedEntranceCard,
  equipToolUpgrade,
  fleeBarrowDelve,
  migrateSavedRulesState,
  resolveGuildService,
  resolveCompanionTravel,
  resolveCompanionTrigger,
  resolveForaging,
  resolveRumour,
  resolveWagonCapabilities,
  resolveWagonUpgrade,
  restoreSeasonalServiceMutations,
  startBarrowDelve,
  type BarrowRuntimeState,
  type ClinicRuntimeState,
  type ServiceRuntimeState,
  type TravelGraphNode
} from './index';

const graph = (): Record<string, TravelGraphNode> => {
  const rows: Record<string, TravelGraphNode> = {};
  for (let index = 0; index <= 6; index += 1) {
    const id = `n${index}`;
    rows[id] = { id, name: index === 0 ? 'Newdam' : `Node ${index}`, region: index === 0 ? 'Meadow' : index === 1 ? 'Loch' : 'Forest', locationType: index === 0 ? 'City' : index === 6 ? 'Settlement' : 'Wilds', edges: [] };
    if (index > 0) {
      rows[id].edges.push({ to: `n${index - 1}`, kind: 'path' });
      rows[`n${index - 1}`].edges.push({ to: id, kind: 'path' });
    }
  }
  return rows;
};

const serviceState = (): ServiceRuntimeState => ({ currentLocationId: 'n0', currentLocationName: 'Newdam', currentLocationType: 'City', currentRegion: 'Meadow', currentSeason: 'Summer', calendarDays: 0, trinkets: 100, inventory: [], graph: graph(), mapMutations: [], pendingServices: [], usedJourneyServiceIds: [], weatherProtectionMoves: 0, weatherProtectionActive: false, travelEncounterRerolls: 0, missiveSettlementIds: [], removedThreatIds: [], appliedTransactionIds: [], journalEvents: [] });

const barrowState = (): BarrowRuntimeState => ({ currentLocationId: 'n0', calendarDays: 0, reputation: 0, trinkets: 0, carry: 4, speed: 3, inventory: [], companions: [], graph: graph(), barrows: [{ id: 'b1', name: 'Barrow', behemothClass: 'Towering', locationId: 'n0', removed: false }], activeDelve: null, movementBlocked: false, needsLocalHelp: false, nextMoveSpeedOverride: null, pursuit: null, journeyEnded: false, appliedTransactionIds: [], journalEvents: [] });

describe('Phase 4 canonical catalogues', () => {
  it('[BARROW-001/SERVICE-001/TOOL-001/WAGON-001/COMPANION-001/CLINIC-003] preserves exact table counts and sources', () => {
    expect(BARROW_DELVES).toHaveLength(8);
    expect(GUILD_SERVICES).toHaveLength(17);
    expect(ALMANACK_TOOLS).toHaveLength(18);
    expect(TOOL_UPGRADES).toHaveLength(7);
    expect(WAGON_EXPANSIONS).toHaveLength(10);
    expect(COMPANIONS).toHaveLength(9);
    expect(CLINIC_AGENDAS).toHaveLength(10);
    expect([...BARROW_DELVES, ...GUILD_SERVICES, ...TOOL_UPGRADES, ...WAGON_EXPANSIONS, ...COMPANIONS, ...CLINIC_AGENDAS].every(row => row.source.kind === 'rulebook' && row.sourcePage > 0)).toBe(true);
  });
});

describe('Phase 4 Barrow state machines', () => {
  it('preserves authored Barrow notes while still rejecting whitespace-only notes', () => {
    const entry = '  입구에서 숨을 고른다.\n발자국을 기록한다.  ';
    const started = startBarrowDelve({ transactionId: 'start:prose', state: barrowState(), barrowId: 'b1', suit: '♥', journalNote: entry });
    expect(started.value?.journalEvents.at(-1)).toMatchObject({ text: entry, playerMemory: entry });
    expect(startBarrowDelve({ transactionId: 'start:blank', state: barrowState(), barrowId: 'b1', suit: '♥', journalNote: ' \n ' }).status).toBe('invalid');

    const retreat = '\n  아직 깨우지 않고 물러났다.  ';
    const fled = fleeBarrowDelve('flee:prose', started.value!, retreat);
    expect(fled.value?.journalEvents.at(-1)).toMatchObject({ text: retreat, playerMemory: retreat });
  });

  it('[BARROW-002/BARROW-003] permits rulebook Flee only before challenge and prevents free cancellation', () => {
    const started = startBarrowDelve({ transactionId: 'start', state: barrowState(), barrowId: 'b1', suit: '♥', journalNote: 'Approached.' }).value!;
    const fled = fleeBarrowDelve('flee', started, 'Retreated.');
    expect(fled.value?.calendarDays).toBe(1);
    expect(fled.value?.nextMoveSpeedOverride).toBe(1);
    expect(fled.value?.activeDelve).toBeNull();
    const begun = beginBarrowChallenge('begin', started).value!;
    expect(fleeBarrowDelve('late-flee', begun, 'Too late.').status).toBe('invalid');
  });

  it('[BARROW-004/CORE-001/SAVE-004] treats Q/K as 12, resumes state, removes the Barrow, and blocks duplicate rewards', () => {
    let state = startBarrowDelve({ transactionId: 'start-c', state: barrowState(), barrowId: 'b1', suit: '♣', journalNote: 'Dig.' }).value!;
    state = beginBarrowChallenge('begin-c', state).value!;
    state = drawCollapsedEntranceCard('draw-q', structuredClone(state), { value: 12, suit: '♥' }).value!;
    expect(state.activeDelve?.progress).toBe(12);
    state = drawCollapsedEntranceCard('draw-k', state, { value: 13, suit: '♥' }).value!;
    expect(state.activeDelve?.progress).toBe(24);
    state = drawCollapsedEntranceCard('draw-3', state, { value: 13, suit: '♥' }).value!;
    state = drawCollapsedEntranceCard('draw-4', state, { value: 13, suit: '♥' }).value!;
    state = drawCollapsedEntranceCard('draw-5', state, 2).value!;
    expect(state.barrows[0].removed).toBe(true);
    expect(state.activeDelve).toBeNull();
    expect(drawCollapsedEntranceCard('draw-5', state, 2).status).toBe('invalid');
  });
});

describe('Phase 4 Services', () => {
  it('preserves the exact Guild Service journal note', () => {
    const note = '  구름 가장자리를 읽었다.\n비 냄새가 났다.  ';
    const state = { ...serviceState(), currentLocationId: 'n2', currentLocationName: 'Bogstead', currentLocationType: 'Settlement' as const, currentRegion: 'Bog' as const };
    const result = resolveGuildService({ transactionId: 'forecast:prose', state, serviceId: 'forecast', journalNote: note });
    expect(result.value?.nextState.journalEvents.at(-1)).toMatchObject({ text: note, playerMemory: note });
    expect(resolveGuildService({ transactionId: 'forecast:blank', state, serviceId: 'forecast', journalNote: ' \n ' }).status).toBe('invalid');
  });

  it('[SERVICE-001] applies the rulebook page 59 Forecast for exactly three Moves', () => {
    const bog = { ...serviceState(), currentLocationId: 'n2', currentLocationName: 'Bogstead', currentLocationType: 'Settlement' as const, currentRegion: 'Bog' as const };
    const result = resolveGuildService({ transactionId: 'forecast', state: bog, serviceId: 'forecast', journalNote: 'Cloud signs.' });
    expect(result.value?.nextState.weatherProtectionMoves).toBe(3);
  });

  it('[SERVICE-003/SERVICE-005] restores Floodplain in Spring and validates Retrieval at 5+ Paths', () => {
    const base = serviceState();
    const flooded = resolveGuildService({ transactionId: 'flood', state: base, serviceId: 'floodplain', targetIds: ['n2'], journalNote: 'Opened the dam.' }).value!.nextState;
    expect(flooded.graph.n2.region).toBe('Loch');
    expect(restoreSeasonalServiceMutations(flooded, 'Winter').graph.n2.region).toBe('Loch');
    expect(restoreSeasonalServiceMutations(flooded, 'Spring').graph.n2.region).toBe('Forest');
    const vessel = { ...base, currentLocationName: 'Vessel' };
    expect(resolveGuildService({ transactionId: 'near', state: vessel, serviceId: 'retrieval', targetIds: ['n1'], journalNote: 'Fetch.' }).status).toBe('invalid');
    expect(resolveGuildService({ transactionId: 'far', state: vessel, serviceId: 'retrieval', targetIds: ['n6'], journalNote: 'Fetch.' }).status).toBe('manual');
  });
});

describe('Phase 4 Tools, mobility, downtime, and Clinics', () => {
  it('[TOOL-003] only equips seven Upgrades to their canonical base Tool', () => {
    const knife = { instanceId: 'knife', toolId: 'belt-knife', upgradeId: null, charges: null, broken: false, consumed: false, acquiredBy: 'start', appliedEffectIds: [] };
    expect(equipToolUpgrade(knife, 'silver-sickle').upgradeId).toBe('silver-sickle');
    expect(() => equipToolUpgrade(knife, 'double-boiler')).toThrow();
  });

  it('[WAGON-002/WAGON-003/COMPANION-002/COMPANION-004] constrains Soar/Waterway and advances seasonal/path effects', () => {
    const commissioned = commissionWagon({ wagon: { commissioned: false, expansionIds: [], clayPotReagentId: null, clayPotMoves: 0 }, isCity: true, trinkets: 20 });
    expect(commissioned.trinkets).toBe(0);
    expect(resolveWagonCapabilities(commissioned.wagon)).toMatchObject({ carryBonus: 4, speedBonus: 1, canSoar: false });
    const expanded = resolveWagonCapabilities({ commissioned: true, expansionIds: ['base-unit', 'sealed-carriage', 'experimental-contraption'], clayPotReagentId: null, clayPotMoves: 0 });
    expect(expanded).toMatchObject({ canSoar: true, soarDays: 3, canUseWaterway: true });
    const wasp = advanceCompanions([{ instanceId: 'w', companionId: 'wasp', pathsTravelled: 0, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null }], 10)[0];
    expect(wasp.pendingForage).toBe('insect');
    const companionTravel = resolveCompanionTravel([
      { instanceId: 'w', companionId: 'wasp', pathsTravelled: 9, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null },
      { instanceId: 'h', companionId: 'honeybee', pathsTravelled: 9, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null }
    ], 1);
    expect(companionTravel).toMatchObject({ honeyHarvests: 1, waspForageDraws: 1 });
    expect(companionTravel.companions[0]).toMatchObject({ pathsTravelled: 0, pendingForageDraws: 1 });
    const waspForage = resolveForaging({
      transactionId: 'wasp-forage',
      state: { season: 'Summer', currentRegion: 'Forest', currentLocationType: 'Settlement', foragingPoints: 0, inventory: [], toolIds: [] },
      forageRegion: 'Forest', locationRelation: 'current', card: { value: 7, suit: '♥' }, reagentTypeFilter: 'INSECT', source: 'companion-wasp'
    });
    expect(waspForage.value?.candidates.length).toBeGreaterThan(0);
    expect(waspForage.value?.candidates.every(candidate => REAGENTS.find(row => row.id === candidate.reagentId)?.type === 'INSECT')).toBe(true);
    const caterpillar = advanceCompanionSeason([{ instanceId: 'c', companionId: 'caterpillar', pathsTravelled: 0, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null }], 'Summer')[0];
    expect(caterpillar.companionId).toBe('butterfly');
  });

  it('[WAGON-001/WAGON-004/SAVE-004] commits expansion cost and Coracle recycling in one Mobility transaction', () => {
    const coracle = { id: 'coracle:1', name: 'Bark Coracle', type: 'tool' as const, weight: 1, canonicalToolId: 'bark-coracle' };
    const result = resolveWagonUpgrade({
      transactionId: 'wagon:sealed',
      state: {
        wagon: { commissioned: true, expansionIds: [], clayPotReagentId: null, clayPotMoves: 0 },
        companions: [], storedCompanions: [], passenger: null, passengerPickupReady: false,
        reputation: 0, trinkets: 20, inventory: [coracle], season: 'Spring',
        appliedTransactionIds: [], journalEvents: [], downtimeRequired: true, downtimeCompleted: false
      },
      action: 'install', expansionId: 'sealed-carriage', locationName: 'Newdam', isCity: true,
      recycleCoracleItemId: coracle.id
    });
    expect(result.value).toMatchObject({ trinkets: 15, inventory: [], downtimeRequired: false, downtimeCompleted: true });
    expect(result.value?.wagon.expansionIds).toContain('sealed-carriage');
    expect(result.value?.appliedTransactionIds).toContain('wagon:sealed');
  });

  it('[COMPANION-001/COMPANION-005] commits once-per-Journey use and Contraption sacrifice through Mobility', () => {
    const state = {
      wagon: { commissioned: false, expansionIds: [], clayPotReagentId: null, clayPotMoves: 0 },
      companions: [
        { instanceId: 'beetle:1', companionId: 'beetle', pathsTravelled: 0, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null },
        { instanceId: 'cranky:1', companionId: 'cranky-contraption', pathsTravelled: 0, seasonsTravelled: 0, usedThisJourney: false, pendingForage: null }
      ],
      storedCompanions: [], passenger: null, passengerPickupReady: false,
      reputation: 0, trinkets: 0, inventory: [], season: 'Spring' as const,
      appliedTransactionIds: [], journalEvents: [], behemothPursuitActive: true
    };
    const beetle = resolveCompanionTrigger({ transactionId: 'companion:beetle', state, trigger: 'beast' });
    expect(beetle.value?.companions[0].usedThisJourney).toBe(true);
    expect(resolveCompanionTrigger({ transactionId: 'companion:beetle:again', state: beetle.value!, trigger: 'beast' }).status).toBe('invalid');
    const cranky = resolveCompanionTrigger({ transactionId: 'companion:cranky', state: beetle.value!, trigger: 'behemoth' });
    expect(cranky.value?.companions.some(row => row.companionId === 'cranky-contraption')).toBe(false);
    expect(cranky.value?.behemothPursuitActive).toBe(false);
  });

  it('[DOWNTIME-002] resolves a four-card Rumour only against a canonical map candidate', () => {
    const resolved = resolveRumour({ transactionId: 'rumour', reputation: 15, atCity: true, downtimeCompleted: false, cards: [{ value: 1, suit: '♥' }, { value: 1, suit: '♣' }, { value: 1, suit: '♣' }, { value: 1, suit: '♥' }], candidates: [{ locationId: 'east-bog', region: 'Bog', direction: 'East', pathDistance: 2 }], targetLocationId: 'east-bog' });
    expect(resolved.status).toBe('resolved');
    expect(resolved.rumour?.behemoth).toBe('Towering');
  });

  it('[CLINIC-001/CLINIC-003] commissions for next Season and uses graph distance 3', () => {
    const state: ClinicRuntimeState = { currentSeason: 'Spring', completedSeasons: 4, trinkets: 15, reputation: 15, clinics: [], agendaIds: [], goodwillWeight: 0, graph: graph(), appliedTransactionIds: [], journalEvents: [] };
    const next = commissionClinic({ transactionId: 'clinic', state, locationId: 'n2', name: 'Moss House', locationType: 'Wild', curedHere: true, agendaId: 'mailbox' });
    expect(next.clinics[0]).toMatchObject({ status: 'building', completesAtSeason: 'Summer' });
    const active = { ...next, clinics: [{ ...next.clinics[0], status: 'active' as const }] };
    expect(clinicServiceArea(active, next.clinics[0].id)).toEqual(expect.arrayContaining(['n0', 'n5']));
    expect(clinicServiceArea(active, next.clinics[0].id)).not.toContain('n6');
  });
});

describe('Phase 4 Almanack, replacement, and schema', () => {
  it('[ALMANACK-002] creates an individual three-card Trinket record', () => {
    expect(createTrinketRecord({ transactionId: 't', cards: [1, 8, 5], acquiredAt: 4, source: 'Treatment', journalEntryId: 'j' })).toMatchObject({ object: 'Implement or Gadget', material: 'Flint', origin: 'Handmade by owner', spent: false });
  });

  it('[REMEDY-003/SAVE-001] preserves replacement BR/Weight and legacy aggregate Trinkets in the current schema', () => {
    expect(createReplacementAcquisition({ targetTag: 'PAIN', requiredPotency: 2, name: 'Moon Sap', preparation: 'Brewed' })).toMatchObject({ baseRarity: 12, weight: 2 / 3 });
    const migrated = migrateSavedRulesState({ schemaVersion: 4, trinkets: ['a', 'b'], companions: [] });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.legacyTrinketCount).toBe(2);
    expect(migrated.trinketRecords).toEqual([]);
    expect(migrated.offlineOutbox).toEqual([]);
  });
});
