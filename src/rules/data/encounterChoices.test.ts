import { describe, expect, it } from 'vitest';
import { encounterChoiceAvailability, executeEncounter } from '../encounterEngine';
import { BEAR_SCURRY_ENCOUNTER, ENCOUNTERS, FORAGING_ENCOUNTERS, SOCIAL_ENCOUNTERS, TRAVEL_ENCOUNTERS, findEncounter } from './encounters';
import { encounterChoiceRequiresJournal, enrichEncounterChoices, leftoverNeeded, parseMechanicalEffects, splitEncounterChoices } from './encounterChoices';
import { resolvePatient } from '../engine';
import { GAME_DATA } from '../../gameData';
import { PRINTED_EFFECT_BY_OWNER } from '../printedEffects';

describe('printed encounter choice execution', () => {
  it('splits labeled forage choices and applies reputation and timer changes', () => {
    const split = splitEncounterChoices(
      'A grouchy hare lectures you. Listen & Learn - Decrease Timers by 4. However, from now on everytime you Forage in a Bog, gain 1 Foraging Point. Interrupt - Lose 1 Reputation as the grouchy hare tells everyone they meet how rude you were.'
    );
    expect(split.choices.map(choice => choice.id)).toEqual(['listen-learn', 'interrupt']);
    const interrupt = split.choices.find(choice => choice.id === 'interrupt')!;
    expect(interrupt.effects).toEqual([
      { support: 'implemented', effect: { type: 'modifyReputation', amount: -1 } }
    ]);
    const listen = split.choices.find(choice => choice.id === 'listen-learn')!;
    expect(listen.effects).toEqual(expect.arrayContaining([
      { support: 'implemented', effect: { type: 'modifyTimer', amount: -4, target: 'all' } },
      { support: 'implemented', effect: { type: 'addCondition', conditionId: 'forage-bonus:Bog:1' } }
    ]));
  });

  it('parses reduce/increase timers, lost foraging points, and extra calendar days', () => {
    expect(parseMechanicalEffects('Reduce Timers by 1. Lose 2 Foraging Points. Add 1 Day to your Calendar.')).toEqual(expect.arrayContaining([
      { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
      { support: 'implemented', effect: { type: 'modifyForagingPoints', amount: -2 } },
      { support: 'implemented', effect: { type: 'markDays', amount: 1 } }
    ]));
    expect(parseMechanicalEffects('Sit And Soak - Mark a Day. Gain a reed-woven Trinket.')).toEqual(expect.arrayContaining([
      { support: 'implemented', effect: { type: 'markDays', amount: 1 } },
      { support: 'implemented', effect: { type: 'modifyTrinkets', amount: 1 } }
    ]));
    expect(parseMechanicalEffects('Spare Material - Trade a Trinket to gain any Common or Rare Bog Reagent.')).toEqual(expect.arrayContaining([
      { support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } }
    ]));
    expect(leftoverNeeded('Draw a card and add a Titan Thingamabob to your Bags.')).toBe(true);
    expect(leftoverNeeded('Lose 1 Reputation as the grouchy hare tells everyone they meet how rude you were.')).toBe(false);
  });

  it('does not award a conditional or delayed reward when its choice is first selected', () => {
    expect(parseMechanicalEffects("Add a 'Parcel' to your Bags. Gain 3 Trinkets if you go to that Location, delivering it."))
      .not.toContainEqual({ support: 'implemented', effect: { type: 'modifyTrinkets', amount: 3 } });
    expect(leftoverNeeded('Gain 3 Trinkets if you go to that Location, delivering it.')).toBe(true);

    const encounter = findEncounter({ encounterType: 'travel', region: 'Meadow', card: 8 })!;
    const deliver = encounter.choices.find(choice => choice.id === 'deliver-the-parcel')!;
    const result = executeEncounter({
      transactionId: 'parcel-pickup',
      encounter,
      choiceId: deliver.id,
      state: {
        reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: 0,
        inventory: [], patient: null, movementBlocked: true, conditions: [], appliedEffectIds: []
      }
    });
    expect(result.status).toBe('manual');
    expect(result.value?.nextState.trinkets).toBe(0);
  });

  it('does not apply the mechanical result of an unresolved card-suit branch', () => {
    const legacyInMud = parseMechanicalEffects(
      'You may scout. Draw a Card: ♥ or ♦ - It holds. Gain 3 Foraging Points ♣ or ♠ - Discard an Item.'
    );
    expect(legacyInMud).not.toContainEqual({
      support: 'implemented',
      effect: { type: 'modifyForagingPoints', amount: 3 }
    });

    const napBeforeDraw = parseMechanicalEffects(
      'Decrease Timers by 1 and Draw a Card: ♥ or ♦ - Gain 5 Foraging Points. ♣ or ♠ - Lose 1 Foraging Point.'
    );
    expect(napBeforeDraw).toContainEqual({
      support: 'implemented',
      effect: { type: 'modifyTimer', amount: -1, target: 'all' }
    });
    expect(napBeforeDraw.some(({ effect }) => effect.type === 'modifyForagingPoints')).toBe(false);

    expect(parseMechanicalEffects('If you have a Tent, set camp. Decrease Timers by 1.'))
      .not.toContainEqual({ support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } });
    expect(parseMechanicalEffects('Draw a card. Higher — Gain 3 Reputation.'))
      .not.toContainEqual({ support: 'implemented', effect: { type: 'modifyReputation', amount: 3 } });
  });

  it('lets the bog Ace interrupt complete without a leftover printed dump', () => {
    const encounter = findEncounter({
      encounterType: 'foraging',
      region: 'Bog',
      card: 1
    });
    expect(encounter?.choices.length).toBeGreaterThan(0);
    const result = executeEncounter({
      transactionId: 'forage-ace',
      encounter: encounter!,
      choiceId: encounter!.choices.find(choice => choice.id === 'interrupt')?.id,
      state: {
        reputation: 5,
        trinkets: 0,
        calendarDays: 0,
        foragingPoints: 0,
        inventory: [],
        patient: null,
        movementBlocked: false,
        conditions: [],
        appliedEffectIds: []
      }
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.reputation).toBe(4);
  });

  it('offers the two printed Bear’s Necessities branches and applies Scurry costs', () => {
    const bear = findEncounter({ encounterType: 'foraging', region: 'Forest', card: 12, season: 'Spring' });
    expect(bear?.choices.map(choice => choice.id)).toEqual(['mark-barrow', 'appease']);

    const patient = resolvePatient({ id: 'bear-patient', name: 'Thistle', species: 'Squirrel', ailmentIds: ['ailment-dullsweats'] }).value!;
    const before = patient.timers[0].current;
    const result = executeEncounter({
      transactionId: 'bear-scurry-cost',
      encounter: BEAR_SCURRY_ENCOUNTER,
      choiceId: 'lose-foraging-points',
      state: {
        reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: 5,
        inventory: [], patient, movementBlocked: false, conditions: [], appliedEffectIds: []
      }
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.foragingPoints).toBe(2);
    expect(result.value?.nextState.patient?.timers[0].current).toBe(before - 2);
  });

  it('enforces every Fowl Fare branch and always leaves a no-cost way to continue', () => {
    const fowlFare = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-meadow-8')!;
    expect(fowlFare.sourcePage).toBe(173);
    expect(fowlFare.choices.map(choice => choice.id)).toEqual(['airlift', 'taxi', 'decline']);
    const [airlift, taxi, decline] = fowlFare.choices;

    expect(encounterChoiceAvailability(airlift, { reputation: 35, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(airlift, { reputation: 34, trinkets: 10 }).available).toBe(false);
    expect(encounterChoiceAvailability(taxi, { reputation: 34, trinkets: 1 }).available).toBe(true);
    expect(encounterChoiceAvailability(taxi, { reputation: 35, trinkets: 1 }).available).toBe(false);
    expect(encounterChoiceAvailability(taxi, { reputation: 25, trinkets: 0 }).available).toBe(false);
    expect(encounterChoiceAvailability(decline, { reputation: 0, trinkets: 0 }).available).toBe(true);

    const baseState = {
      reputation: 35, trinkets: 0, calendarDays: 0, foragingPoints: 2,
      inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
    };
    const lifted = executeEncounter({ transactionId: 'fowl-airlift', encounter: fowlFare, choiceId: 'airlift', state: baseState });
    expect(lifted.status).toBe('resolved');
    expect(lifted.value?.nextState.foragingPoints).toBe(6);

    const paid = executeEncounter({
      transactionId: 'fowl-taxi', encounter: fowlFare, choiceId: 'taxi',
      state: { ...baseState, reputation: 25, trinkets: 1 }
    });
    expect(paid.status).toBe('resolved');
    expect(paid.value?.nextState).toMatchObject({ trinkets: 0, foragingPoints: 6 });
    expect(executeEncounter({
      transactionId: 'fowl-taxi-empty', encounter: fowlFare, choiceId: 'taxi',
      state: { ...baseState, reputation: 25, trinkets: 0 }
    }).status).toBe('invalid');

    const continued = executeEncounter({
      transactionId: 'fowl-decline', encounter: fowlFare, choiceId: 'decline',
      state: { ...baseState, reputation: 25, trinkets: 0 }
    });
    expect(continued.status).toBe('resolved');
    expect(continued.value?.nextState).toMatchObject({ trinkets: 0, foragingPoints: 2 });
  });

  it('does not grant benefits from optional one-Trinket offers when the Bags contain no Trinkets', () => {
    const paidChoices: Array<[string, string]> = [
      ['foraging-bog-3', 'communal'],
      ['foraging-bog-m-winter', 'bargain'],
      ['travel-forest-m-winter', 'aid'],
      ['social-meadow-settlement-♦', 'weave-a-trinket'],
      ['social-loch-vessel-♦', 'homecooked-meal']
    ];
    const emptyState = {
      reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: 0,
      inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
    };

    for (const [encounterId, choiceId] of paidChoices) {
      const encounter = ENCOUNTERS.find(row => row.id === encounterId)!;
      const choice = encounter.choices.find(row => row.id === choiceId)!;
      expect(encounterChoiceAvailability(choice, { reputation: 0, trinkets: 0 }), encounterId).toMatchObject({ available: false });
      expect(encounterChoiceAvailability(choice, { reputation: 0, trinkets: 1 }), encounterId).toMatchObject({ available: true });
      expect(executeEncounter({
        transactionId: `empty-payment:${encounterId}`,
        encounter,
        choiceId,
        state: emptyState
      }).status, encounterId).toBe('invalid');
    }
  });

  it('gates the other unambiguous Guild Reputation encounter branches at their printed thresholds', () => {
    const baseState = {
      reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: 2,
      inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
    };

    const aerialSupport = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-bog-j-summer')!;
    const helpingWing = aerialSupport.choices.find(choice => choice.id === 'helping-wing')!;
    const unknown = aerialSupport.choices.find(choice => choice.id === 'unknown')!;
    expect(encounterChoiceAvailability(helpingWing, { reputation: 25, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(helpingWing, { reputation: 24, trinkets: 0 }).available).toBe(false);
    expect(encounterChoiceAvailability(unknown, { reputation: 24, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(unknown, { reputation: 25, trinkets: 0 }).available).toBe(false);
    expect(executeEncounter({
      transactionId: 'aerial-help', encounter: aerialSupport, choiceId: 'helping-wing',
      state: { ...baseState, reputation: 25 }
    }).value?.nextState.foragingPoints).toBe(6);

    const insectPicnic = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-forest-9-autumn')!;
    const refused = insectPicnic.choices.find(choice => choice.id === 'guild-level-is-established-or-lower')!;
    const offered = insectPicnic.choices.find(choice => choice.id === 'guild-level-is-upstanding-or-higher')!;
    expect(encounterChoiceAvailability(refused, { reputation: 24, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(refused, { reputation: 25, trinkets: 0 }).available).toBe(false);
    expect(encounterChoiceAvailability(offered, { reputation: 25, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(offered, { reputation: 24, trinkets: 0 }).available).toBe(false);
    expect(executeEncounter({
      transactionId: 'insect-low', encounter: insectPicnic,
      choiceId: 'guild-level-is-upstanding-or-higher', state: { ...baseState, reputation: 24 }
    }).status).toBe('invalid');

    const freshlyGrilled = TRAVEL_ENCOUNTERS.find(row => row.id === 'travel-forest-j-summer')!;
    const recognised = freshlyGrilled.choices.find(choice => choice.id === 'recognised-by-the-guild')!;
    const passedBy = freshlyGrilled.choices.find(choice => choice.id === 'unknown-to-the-guild')!;
    expect(encounterChoiceAvailability(recognised, { reputation: 15, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(recognised, { reputation: 14, trinkets: 0 }).available).toBe(false);
    expect(encounterChoiceAvailability(passedBy, { reputation: 14, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(passedBy, { reputation: 15, trinkets: 0 }).available).toBe(false);
    const invited = executeEncounter({
      transactionId: 'freshly-grilled-invited', encounter: freshlyGrilled,
      choiceId: 'recognised-by-the-guild', state: { ...baseState, reputation: 15 }
    });
    expect(invited.status).toBe('manual');
    expect(invited.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ type: 'customEffect', code: 'FRESHLY_GRILLED_NEXT_TIMER' })
    }));
    expect(executeEncounter({
      transactionId: 'freshly-grilled-pass', encounter: freshlyGrilled,
      choiceId: 'unknown-to-the-guild', state: { ...baseState, reputation: 14 }
    }).status).toBe('resolved');
  });

  it('models The Branded compassion as an immediate no-reward Patient follow-up', () => {
    const branded = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-forest-9-spring')!;
    expect(branded.sourcePage).toBe(162);
    expect(branded.choices.map(choice => choice.id)).toEqual(['compassion', 'duty']);
    expect(branded.choices.find(choice => choice.id === 'compassion')?.followUp).toEqual({
      type: 'start-patient',
      timing: 'immediate',
      severity: 'lesser',
      rewardMode: 'none',
      deadline: 'before-overstay',
      patientKind: 'exiled-beast'
    });

    const baseState = {
      reputation: 10, trinkets: 2, calendarDays: 0, foragingPoints: 0,
      inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
    };
    const compassion = executeEncounter({
      transactionId: 'branded-compassion', encounter: branded, choiceId: 'compassion', state: baseState
    });
    expect(compassion.status).toBe('manual');
    expect(compassion.value?.nextState).toMatchObject({
      reputation: 10,
      trinkets: 2,
      conditions: ['helped-exiled-or-branded-beast']
    });
    expect(compassion.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ type: 'customEffect', code: 'START_BRANDED_LESSER_AILMENT' })
    }));

    const duty = executeEncounter({
      transactionId: 'branded-duty', encounter: branded, choiceId: 'duty', state: baseState
    });
    expect(duty.status).toBe('resolved');
    expect(duty.value?.nextState.reputation).toBe(11);
  });

  it('carries canonical help for a Branded beast into the later Fangs a’Hungering Kindness branch', () => {
    const rightThing = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-bog-j-winter')!;
    const fangs = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-forest-m-winter')!;
    const baseState = {
      reputation: 10, trinkets: 0, calendarDays: 0, foragingPoints: 0,
      inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
    };

    expect(rightThing.sourcePage).toBe(159);
    expect(rightThing.choices.map(choice => choice.id)).toEqual(['help', 'turn-away']);
    expect(encounterChoiceRequiresJournal(rightThing, 'help')).toBe(true);
    expect(encounterChoiceRequiresJournal(rightThing, 'turn-away')).toBe(false);
    expect(fangs.sourcePage).toBe(165);
    expect(fangs.choices.map(choice => choice.id)).toEqual(['flee', 'kindness']);

    const flee = fangs.choices.find(choice => choice.id === 'flee')!;
    const kindness = fangs.choices.find(choice => choice.id === 'kindness')!;
    expect(encounterChoiceAvailability(flee, baseState).available).toBe(true);
    expect(encounterChoiceAvailability(kindness, baseState)).toEqual({
      available: false,
      reasons: ['Requires encounter condition: helped-exiled-or-branded-beast.']
    });
    expect(executeEncounter({
      transactionId: 'fangs-kindness-too-soon', encounter: fangs, choiceId: 'kindness', state: baseState
    }).status).toBe('invalid');

    const helped = executeEncounter({
      transactionId: 'right-thing-help', encounter: rightThing, choiceId: 'help',
      journalAcknowledged: true, state: baseState
    });
    expect(helped.status).toBe('resolved');
    expect(helped.value?.nextState.conditions).toContain('helped-exiled-or-branded-beast');
    const reloadedAfterHelp = JSON.parse(JSON.stringify(helped.value!.nextState));
    expect(encounterChoiceAvailability(kindness, reloadedAfterHelp).available).toBe(true);
    expect(executeEncounter({
      transactionId: 'fangs-kindness-after-help', encounter: fangs, choiceId: 'kindness', state: reloadedAfterHelp
    }).status).toBe('resolved');

    const turnedAway = executeEncounter({
      transactionId: 'right-thing-turn-away', encounter: rightThing, choiceId: 'turn-away', state: baseState
    });
    expect(turnedAway.status).toBe('resolved');
    expect(turnedAway.value?.nextState.conditions).not.toContain('helped-exiled-or-branded-beast');

    expect(executeEncounter({
      transactionId: 'right-thing-help-without-journal', encounter: rightThing, choiceId: 'help', state: baseState
    }).status).toBe('invalid');
  });

  it('does not silently extend the p.180 Upstanding PURIFY lesson to Trusted', () => {
    const specialTechnique = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-mountain-10-spring')!;
    expect(specialTechnique.sourcePage).toBe(180);
    expect(specialTechnique.choices.map(choice => choice.id)).toEqual([
      'secrets-of-the-craft',
      'shunned',
      'trusted-source-gap'
    ]);
    const [secrets, shunned, trustedGap] = specialTechnique.choices;

    expect(encounterChoiceAvailability(secrets, { reputation: 25, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(secrets, { reputation: 34, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(secrets, { reputation: 35, trinkets: 0 }).available).toBe(false);
    expect(encounterChoiceAvailability(shunned, { reputation: 24, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(shunned, { reputation: 25, trinkets: 0 }).available).toBe(false);
    expect(encounterChoiceAvailability(trustedGap, { reputation: 35, trinkets: 0 }).available).toBe(true);

    const taught = executeEncounter({
      transactionId: 'special-technique-upstanding', encounter: specialTechnique, choiceId: secrets.id,
      state: {
        reputation: 25, trinkets: 0, calendarDays: 0, foragingPoints: 0,
        inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
      }
    });
    expect(taught.status).toBe('resolved');
    expect(taught.value?.nextState.conditions).toContain('purify-trained');

    const trusted = executeEncounter({
      transactionId: 'special-technique-trusted', encounter: specialTechnique, choiceId: trustedGap.id,
      state: {
        reputation: 35, trinkets: 0, calendarDays: 0, foragingPoints: 0,
        inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
      }
    });
    expect(trusted.status).toBe('manual');
    expect(trusted.value?.nextState.conditions).not.toContain('purify-trained');
  });

  it('gates the p.158 Rusty Pick free ore and keeps a neutral way to continue', () => {
    const rustyPick = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-bog-9-autumn')!;
    expect(rustyPick.sourcePage).toBe(158);
    expect(rustyPick.choices.map(choice => choice.id)).toEqual(['bog-bargains', 'pounder-s-take', 'continue']);
    const freeOre = rustyPick.choices.find(choice => choice.id === 'pounder-s-take')!;
    const continueChoice = rustyPick.choices.find(choice => choice.id === 'continue')!;
    expect(encounterChoiceAvailability(freeOre, { reputation: 34, trinkets: 0 }).available).toBe(false);
    expect(encounterChoiceAvailability(freeOre, { reputation: 35, trinkets: 0 }).available).toBe(true);
    expect(encounterChoiceAvailability(continueChoice, { reputation: 0, trinkets: 0 }).available).toBe(true);

    const rejected = executeEncounter({
      transactionId: 'rusty-pick-under-ranked', encounter: rustyPick, choiceId: freeOre.id,
      state: {
        reputation: 34, trinkets: 0, calendarDays: 0, foragingPoints: 0,
        inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
      }
    });
    expect(rejected.status).toBe('invalid');
    const continued = executeEncounter({
      transactionId: 'rusty-pick-continue', encounter: rustyPick, choiceId: continueChoice.id,
      state: {
        reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: 0,
        inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
      }
    });
    expect(continued.status).toBe('resolved');
  });

  it('keeps every forage and social encounter selectable', () => {
    const forageWithChoices = FORAGING_ENCOUNTERS.filter(row => row.choices.length > 0);
    expect(forageWithChoices.length).toBe(FORAGING_ENCOUNTERS.length);
    expect(SOCIAL_ENCOUNTERS.every(row => row.choices.length > 0)).toBe(true);
    const enriched = enrichEncounterChoices({
      ...FORAGING_ENCOUNTERS[0],
      choices: [{ id: 'keep', label: 'Keep existing', effects: [] }]
    });
    expect(enriched.choices[0].id).toBe('keep');
  });

  it('keeps adjacent social-reference columns out of player choices', () => {
    const expectedChoices: Record<string, string[]> = {
      'social-bog-settlement-♦': ['time-capsule', 'guild-offering'],
      'social-bog-noonhill-♥': ['hivewarden', 'noonmessenger', 'fleeing-thickblood'],
      'social-bog-noonhill-♦': ['smell-the-flowers', 'keen-eye', 'connoisseur-of-scents'],
      'social-forest-settlement-♦': ['swinging', 'new-paths'],
      'social-forest-odoak-♥': ['a-quick-cure', 'work-in-progress'],
      'social-loch-newdam-♦': ['regrowth', 'mother-o-fruits'],
      'social-meadow-settlement-♦': ['weave-a-trinket', 'leave-the-monument', 'a-curious-marking'],
      'social-meadow-summit-♦': ['sorry', 'pocketpaws'],
      'social-mountain-settlement-♦': ['ease-of-access', 'unaccommodating-spaces'],
      'social-mountain-spoolkeep-♦': ['bleated-wisdom', 'woolworks']
    };
    Object.entries(expectedChoices).forEach(([id, choices]) => {
      expect(SOCIAL_ENCOUNTERS.find(row => row.id === id)?.choices.map(choice => choice.id), id).toEqual(choices);
    });
    const choiceText = SOCIAL_ENCOUNTERS.flatMap(row => row.choices.map(choice => choice.label)).join('\n');
    expect(choiceText).not.toMatch(/Amongst thin streams|Forest Settlements are threaded|Open rolling hills of wild grasses|The architecture of mountain settlements|In a word, Spoolkeep/);
  });

  it('keeps the Beaver Dam and its post-Winter burst as one continuous result', () => {
    const dam = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-forest-5')!;
    expect(dam.choices.map(choice => choice.id)).toEqual(['record-beaver-dam']);
    expect(dam.choices[0].label).toContain('겨울이 끝나면');
    expect(dam.choices[0].effects).toEqual([
      expect.objectContaining({ support: 'manual-only', effect: expect.objectContaining({ type: 'customEffect', code: 'BEAVER_DAM_CYCLE' }) })
    ]);
    expect(PRINTED_EFFECT_BY_OWNER.get(dam.id)?.manualResolution?.choices).toEqual([
      dam.choices[0].label
    ]);
  });

  it('resolves the optional Monuments trinket without a duplicate manual panel', () => {
    const monuments = SOCIAL_ENCOUNTERS.find(row => row.id === 'social-meadow-settlement-♦')!;
    const baseState = { reputation: 5, trinkets: 1, calendarDays: 0, foragingPoints: 0, inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: [] };
    const woven = executeEncounter({ transactionId: 'monument-woven', encounter: monuments, choiceId: 'weave-a-trinket', state: baseState });
    const observed = executeEncounter({ transactionId: 'monument-observed', encounter: monuments, choiceId: 'leave-the-monument', state: baseState });
    const marking = executeEncounter({ transactionId: 'monument-marking', encounter: monuments, choiceId: 'a-curious-marking', state: baseState });

    expect(woven.value?.nextState).toMatchObject({ reputation: 6, trinkets: 0 });
    expect(woven.value?.unresolvedEffects).toEqual([]);
    expect(observed.value?.nextState).toMatchObject({ reputation: 5, trinkets: 1 });
    expect(marking.value?.unresolvedEffects).toEqual([]);
    expect(executeEncounter({ transactionId: 'monument-empty', encounter: monuments, choiceId: 'weave-a-trinket', state: { ...baseState, trinkets: 0 } }).status).toBe('invalid');
  });

  it('keeps every canonical encounter ID unique', () => {
    expect(new Set(ENCOUNTERS.map(row => row.id)).size).toBe(ENCOUNTERS.length);
  });

  it('keeps every transcribed event row represented in the canonical inventory', () => {
    const sourceRows = [
      ...Object.values(GAME_DATA.travelEncounters).flat(),
      ...Object.values(GAME_DATA.foragingEncounters).flat(),
      ...Object.values(GAME_DATA.socialEncounters).flat()
    ].filter(row => (row.page >= 74 && row.page <= 99)
      || (row.page >= 154 && row.page <= 187)
      || (row.page >= 190 && row.page <= 213));
    const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const canonicalText = ENCOUNTERS.map(encounter => compact([
      encounter.title,
      encounter.prompt,
      ...encounter.choices.map(choice => choice.label)
    ].join(' ')));
    const missing = sourceRows.filter(row => {
      if (row.page === 169 && row.title.startsWith('Summertime Swim')) {
        return !ENCOUNTERS.some(encounter => encounter.id === 'foraging-loch-10-summer'
          && encounter.choices.some(choice => choice.id === 'summertime-swim'));
      }
      if (row.page === 169 && row.title.startsWith('The Boat That Rocks')) {
        return !ENCOUNTERS.some(encounter => encounter.id === 'foraging-loch-10-summer'
          && encounter.choices.some(choice => choice.id === 'the-boat-that-rocks'));
      }
      const signature = compact(row.title.split('\n')[0]).slice(0, 12);
      return signature && !canonicalText.some(text => text.includes(signature));
    });
    expect(missing.map(row => `${row.page}:${row.title.split('\n')[0]}`)).toEqual([]);
  });

  it('maps printed seasonal icons instead of assuming source-row order', () => {
    const expected: Record<string, string> = {
      'travel-bog-j-autumn': 'Fungi Founder',
      'travel-bog-j-winter': 'Chilled To The Core',
      'travel-forest-j-spring': 'Danger Ahead',
      'travel-forest-j-summer': 'Freshly Grilled',
      'travel-loch-m-autumn': 'Two-Faced',
      'travel-loch-m-winter': 'Hospitality',
      'travel-mountain-j-autumn': 'Red Sky',
      'travel-mountain-j-winter': 'Tobogganing',
      'travel-mountain-m-autumn': 'Do You Nose',
      'travel-mountain-m-winter': 'Treacherous Footing',
      'travel-soar-9-10-winter': 'Talons',
      'travel-soar-m-summer': 'High Above It All',
      'travel-soar-m-autumn': 'Windwall',
      'foraging-loch-10-autumn': 'Showboat',
      'foraging-loch-10-winter': 'Ice Fishing',
      'foraging-loch-j-autumn': 'Brisk Beach Party',
      'social-forest-spring-♠': 'Deep Fried Delicacy',
      'social-forest-summer-♠': 'To Glide',
      'social-forest-autumn-♣': 'Spike Defence',
      'social-forest-winter-♣': 'Sauna'
    };
    Object.entries(expected).forEach(([id, title]) => {
      expect(ENCOUNTERS.find(row => row.id === id)?.title, id).toContain(title);
    });
    expect(TRAVEL_ENCOUNTERS.find(row => row.id === 'travel-soar-9-10-winter')?.sourcePage).toBe(95);
  });

  it('keeps choices separated when the printed transcription omitted terminal punctuation', () => {
    const idsAndChoices: Array<[string, string[]]> = [
      ['travel-forest-m-winter', ['roadside-tea', 'aid', 'cold-shoulder']],
      ['travel-meadow-9-10-autumn', ['find-shelter', 'push-on']],
      ['travel-mountain-j-winter', ['sled', 'long-walk']],
      ['travel-mountain-m-summer', ['fetch-the-oil', 'shrug']],
      ['foraging-loch-m-winter', ['trade', 'visit', 'help']],
      ['foraging-mountain-m-winter', ['start-ailment', 'decline-ailment']],
      ['social-bog-winter-♣', ['wish-them-luck', 'pitch-in-briefly', 'pitch-in-for-the-day']]
    ];
    idsAndChoices.forEach(([id, choices]) => {
      expect(ENCOUNTERS.find(row => row.id === id)?.choices.map(choice => choice.id), id).toEqual(choices);
    });

    const squeaky = ENCOUNTERS.find(row => row.id === 'travel-mountain-m-summer')!;
    const fetch = executeEncounter({
      transactionId: 'squeaky-fetch', encounter: squeaky, choiceId: 'fetch-the-oil',
      state: { reputation: 5, trinkets: 0, calendarDays: 0, foragingPoints: 0, inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: [] }
    });
    expect(fetch.value?.nextState).toMatchObject({ reputation: 5, trinkets: 1, calendarDays: 1 });
  });

  it('keeps the p.158 Duchy of Deer separate from the p.159 Winged Menace', () => {
    const duchy = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-bog-m-autumn')!;
    expect(duchy.sourcePage).toBe(158);
    expect(duchy.title).toContain('Duchy of Deer');
    expect(duchy.choices.map(choice => choice.id)).toEqual(['instant-trial']);
    expect(duchy.choices[0].label).toMatch(/카드.*뽑/);
    expect(duchy.choices[0].effects).toContainEqual(expect.objectContaining({ support: 'manual-only' }));

    const winged = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-bog-m-winter')!;
    expect({
      sourcePage: winged.sourcePage,
      title: winged.title,
      prompt: winged.prompt,
      choices: winged.choices.map(choice => ({ id: choice.id, label: choice.label }))
    }).toEqual({
      sourcePage: 159,
      title: 'Winged Menace',
      prompt: 'A massive heron swoops down at you, giving you just enough time to take cover. It laughs and taunts as it raises its wings to put you in shade. It seems like it might be a clawlicker or a bandit. What do they want?',
      choices: [
        {
          id: 'bold',
          label: '용감하게 맞서기 — 자신은 카드 1장, 왜가리는 카드 2장을 뽑습니다. 자신이 고슴도치보다 크다면 카드 1장을 더 뽑습니다. 합계가 더 높으면 왜가리를 쫓아내고 길드 명성 1을 얻습니다. 합계가 더 낮으면 도망치기 전에 심하게 쪼입니다. 이 만남으로 어떤 흉터가 남았나요?'
        },
        {
          id: 'bargain',
          label: '흥정하기 — 장신구 1개를 주고 왜가리를 돌려보냅니다. 어떤 눈에 띄는 표식이 있었나요? 신고할 건가요?'
        }
      ]
    });
    expect(winged.choices[0].effects).toEqual([
      expect.objectContaining({
        support: 'manual-only',
        effect: expect.objectContaining({ type: 'customEffect', code: 'WINGED_MENACE_BOLD' })
      })
    ]);
    expect(winged.choices[1].effects).toEqual([
      { support: 'implemented', effect: { type: 'modifyTrinkets', amount: -1 } }
    ]);
    expect(`${winged.title}\n${winged.prompt}\n${winged.choices.map(choice => choice.label).join('\n')}`)
      .not.toMatch(/Duchy of Deer|instant trial|사슴|공작령/i);

    const baseState = {
      reputation: 0,
      trinkets: 1,
      calendarDays: 0,
      foragingPoints: 0,
      inventory: [],
      patient: null,
      movementBlocked: false,
      conditions: [],
      appliedEffectIds: []
    };
    const bargain = executeEncounter({
      transactionId: 'winged-menace-bargain',
      encounter: winged,
      choiceId: 'bargain',
      state: baseState
    });
    expect(bargain.status).toBe('resolved');
    expect(bargain.value?.nextState.trinkets).toBe(0);
    expect(executeEncounter({
      transactionId: 'winged-menace-bargain-empty',
      encounter: winged,
      choiceId: 'bargain',
      state: { ...baseState, trinkets: 0 }
    }).status).toBe('invalid');
  });

  it('preserves the printed card branches for Winter Feast', () => {
    const feast = FORAGING_ENCOUNTERS.find(row => row.id === 'foraging-forest-j-winter')!;
    expect(feast.choices.map(choice => choice.id)).toEqual(['pass-by', 'charity', 'sing']);
    expect(feast.choices.find(choice => choice.id === 'charity')?.label).toMatch(/카드.*뽑/);
    expect(feast.choices.find(choice => choice.id === 'charity')?.effects).toEqual(expect.arrayContaining([
      { support: 'implemented', effect: { type: 'modifyTimer', amount: -1, target: 'all' } },
      expect.objectContaining({ support: 'manual-only' })
    ]));

    const sing = executeEncounter({
      transactionId: 'winter-feast-sing', encounter: feast, choiceId: 'sing',
      state: { reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: 0, inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: [] }
    });
    expect(sing.status).toBe('resolved');
    expect(sing.value?.nextState.trinkets).toBe(1);
  });

  it('keeps non-scalar printed procedures manual instead of silently resolving them', () => {
    const manualChoices: Array<[string, string]> = [
      ['travel-loch-m-autumn', 'keep-quiet'],
      ['travel-meadow-9-10-winter', 'challenge-accepted'],
      ['travel-mountain-m-spring', 'drink-up'],
      ['foraging-bog-9-autumn', 'pounder-s-take'],
      ['foraging-bog-m-autumn', 'instant-trial'],
      ['foraging-bog-m-winter', 'bold'],
      ['foraging-forest-9-spring', 'compassion'],
      ['foraging-loch-9-summer', 'tadpediatrician'],
      ['foraging-loch-10-summer', 'summertime-swim'],
      ['foraging-meadow-10-winter', 'hot-toddy'],
      ['foraging-mountain-10-autumn', 'blood-to-blood'],
      ['foraging-titan-2', 'look-around'],
      ['foraging-titan-7', 'attend-to-the-remains']
    ];
    manualChoices.forEach(([encounterId, choiceId]) => {
      const choice = ENCOUNTERS.find(row => row.id === encounterId)?.choices.find(row => row.id === choiceId);
      expect(choice?.effects.some(effect => effect.support === 'manual-only'), `${encounterId}/${choiceId}`).toBe(true);
    });

    const hailstorm = ENCOUNTERS.find(row => row.id === 'travel-soar-m-winter')!;
    expect(hailstorm.mandatoryEffects.every(effect => effect.support === 'manual-only')).toBe(true);
    expect(hailstorm.mandatoryEffects.some(effect => effect.effect.type === 'modifyTimer')).toBe(false);
  });

  it('does not allow a voluntary trinket payment when the balance is empty', () => {
    const hunger = ENCOUNTERS.find(row => row.id === 'travel-forest-m-winter')!;
    const result = executeEncounter({
      transactionId: 'hunger-aid', encounter: hunger, choiceId: 'aid',
      state: { reputation: 5, trinkets: 0, calendarDays: 0, foragingPoints: 0, inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: [] }
    });
    expect(result.status).toBe('invalid');
    expect(result.value).toBeNull();
  });

  it('keeps voluntary travel trades and a tool-gated rescue escapable', () => {
    const baseState = {
      reputation: 0, trinkets: 0, calendarDays: 0, foragingPoints: 0,
      inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: []
    };

    const spareMaterial = TRAVEL_ENCOUNTERS.find(row => row.id === 'travel-bog-3-4')!;
    expect(spareMaterial.sourcePage).toBe(74);
    expect(spareMaterial.choices.map(choice => choice.id)).toEqual([
      'trade-spare-material',
      'continue-without-trading'
    ]);
    const trade = spareMaterial.choices[0];
    expect(encounterChoiceAvailability(trade, baseState).available).toBe(false);
    expect(executeEncounter({
      transactionId: 'spare-material-empty', encounter: spareMaterial,
      choiceId: trade.id, state: baseState
    }).status).toBe('invalid');
    const paid = executeEncounter({
      transactionId: 'spare-material-paid', encounter: spareMaterial,
      choiceId: trade.id, state: { ...baseState, trinkets: 1 }
    });
    expect(paid.status).toBe('manual');
    expect(paid.value?.nextState.trinkets).toBe(0);
    expect(paid.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ type: 'customEffect', code: 'SPARE_MATERIAL_REAGENT' })
    }));
    expect(executeEncounter({
      transactionId: 'spare-material-pass', encounter: spareMaterial,
      choiceId: 'continue-without-trading', state: baseState
    }).status).toBe('resolved');

    const cafe = TRAVEL_ENCOUNTERS.find(row => row.id === 'travel-bog-9-10-autumn')!;
    expect(cafe.sourcePage).toBe(76);
    expect(cafe.choices.map(choice => choice.id)).toEqual(['buy-boxes-of-treats', 'leave-the-cafe']);
    expect(encounterChoiceAvailability(cafe.choices[0], baseState).available).toBe(false);
    const cafePurchase = executeEncounter({
      transactionId: 'pumpkin-cafe-buy', encounter: cafe,
      choiceId: 'buy-boxes-of-treats', state: { ...baseState, trinkets: 2 }
    });
    expect(cafePurchase.status).toBe('manual');
    expect(cafePurchase.value?.nextState.trinkets).toBe(2);
    expect(cafePurchase.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ type: 'customEffect', code: 'PUMPKIN_CAFE_TREATS' })
    }));
    expect(executeEncounter({
      transactionId: 'pumpkin-cafe-pass', encounter: cafe,
      choiceId: 'leave-the-cafe', state: baseState
    }).status).toBe('resolved');

    const wasp = TRAVEL_ENCOUNTERS.find(row => row.id === 'travel-loch-j-autumn')!;
    expect(wasp.sourcePage).toBe(84);
    expect(wasp.choices.map(choice => choice.id)).toEqual(['a-second-chance', 'do-not-risk-it']);
    const rescued = executeEncounter({
      transactionId: 'wasp-rescue', encounter: wasp,
      choiceId: 'a-second-chance', state: baseState
    });
    expect(rescued.status).toBe('manual');
    expect(rescued.value?.unresolvedEffects).toContainEqual(expect.objectContaining({
      effect: expect.objectContaining({ type: 'customEffect', code: 'WASP_COMPANION_RESCUE' })
    }));
    expect(executeEncounter({
      transactionId: 'wasp-pass', encounter: wasp,
      choiceId: 'do-not-risk-it', state: baseState
    }).status).toBe('resolved');
  });

  it('requires acknowledgement only for a current printed journaling prompt', () => {
    const highway = ENCOUNTERS.find(row => row.id === 'travel-meadow-9-10-spring')!;
    expect(encounterChoiceRequiresJournal(highway, 'pay-with-your-life')).toBe(true);
    const blank = executeEncounter({
      transactionId: 'highway-journal', encounter: highway, choiceId: 'pay-with-your-life',
      state: { reputation: 5, trinkets: 0, calendarDays: 0, foragingPoints: 0, inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: [] }
    });
    expect(blank.status).toBe('invalid');
    const acknowledged = executeEncounter({
      transactionId: 'highway-journal', encounter: highway, choiceId: 'pay-with-your-life', journalAcknowledged: true,
      state: { reputation: 5, trinkets: 0, calendarDays: 0, foragingPoints: 0, inventory: [], patient: null, movementBlocked: false, conditions: [], appliedEffectIds: [] }
    });
    expect(acknowledged.value?.nextState.calendarDays).toBe(1);

    const paperPage = ENCOUNTERS.find(row => row.id === 'travel-loch-j-spring')!;
    expect(encounterChoiceRequiresJournal(paperPage, 'refuse')).toBe(false);
    const future = ENCOUNTERS.find(row => row.id === 'foraging-meadow-10-winter')!;
    expect(encounterChoiceRequiresJournal(future, 'hot-toddy')).toBe(false);
  });
});
