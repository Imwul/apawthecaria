import { describe, expect, it } from 'vitest';
import { getCampaignContinuity, getCampaignNextAction, type CampaignContinuityState } from '../campaignContinuity';
import { getGuideNextAction } from '../playGuide';
import { referenceForJournalTab } from './context';

const journey: CampaignContinuityState = { journeyActive: true, bio: { name: '약제사' } };
const cases: Array<[string, CampaignContinuityState, string, number]> = [
  ['manual', { ...journey, pendingManualEffect: {} }, 'chapter:patients', 28],
  ['manual source', { ...journey, pendingManualEffect: { registryEffectId: 'printed:travel-forest-3-4', sourcePage: 79 } }, 'printed-effect:printed:travel-forest-3-4', 79],
  ['queued manual source', { ...journey, manualEffectQueue: [{ ownerId: 'ailment-firstfever', ownerType: 'ailment', sourcePage: 106 }] }, 'ailment:ailment-firstfever', 106],
  ['encounter', { ...journey, pendingEncounter: { encounter: { encounterType: 'social', sourcePage: 196 } } }, 'chapter:social-encounters', 196],
  ['reward', { ...journey, pendingTreatmentReward: {} }, 'procedure:leave', 36],
  ['forage', { ...journey, pendingForaging: { phase: 'choose-reagent' } }, 'procedure:foraging', 32],
  ['immediate forage', { ...journey, pendingForaging: { awaitingImmediateRemedy: true } }, 'procedure:foraging', 33],
  ['barter', { ...journey, pendingBarter: { status: 'awaiting-payment' } }, 'procedure:bartering', 35],
  ['archive', { ...journey, pendingPatientArchive: {} }, 'procedure:leave', 36],
  ['scrounging', { ...journey, scroungingMode: true, scroungingTimer: 5 }, 'procedure:leave', 37],
  ['ending', { ...journey, journey: { status: 'ending' } }, 'procedure:journey-close', 38],
  ['downtime', { bio: { name: '약제사' }, downtimeRequired: true }, 'procedure:downtime', 40],
  ['season', { bio: { name: '약제사' }, downtimeCompleted: true }, 'procedure:downtime', 43]
];
describe('current action references', () => {
  it.each(cases)('%s has one recommendation across scene, guide and source link', (_, state, entryId, page) => {
    const next = getCampaignNextAction(state);
    const continuity = getCampaignContinuity(state);
    expect(next.reference).toMatchObject({ entryId, page });
    expect(referenceForJournalTab('play', state)).toEqual(next.reference);
    expect(getGuideNextAction(state as Parameters<typeof getGuideNextAction>[0])).toEqual(next);
    expect(continuity.nextAction).toBe(next.title);
    expect(continuity.continueLabel).toBe(next.label);
  });
});
