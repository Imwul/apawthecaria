import { describe, expect, it } from 'vitest';
import { resolvePatientCards } from './patientEngine';
import type { AilmentSeverity, CardSuit } from './types';

const resolveSeverity = (suit: CardSuit, reputation: number, cardValue = 1) => resolvePatientCards({
  transactionId: `severity-${suit}-${reputation}-${cardValue}`,
  patientName: 'Moss',
  species: 'Mouse',
  personalityCard: 1,
  personalityChoice: 0,
  descriptorCard: 1,
  severityCard: { value: cardValue, suit },
  ailmentCard: 1,
  reputation
});

describe('patient severity draw (rulebook p.29)', () => {
  it.each([
    ['♥', 'lesser'],
    ['♦', 'intermediate'],
    ['♣', 'severe'],
    ['♠', 'dire']
  ] satisfies Array<[CardSuit, AilmentSeverity]>)('maps %s to %s at Trusted Guild Reputation', (suit, severity) => {
    const result = resolveSeverity(suit, 35);

    expect(result.status).toBe('resolved');
    expect(result.value).toMatchObject({
      drawnSeverity: severity,
      appliedSeverity: severity,
      reputationSeverityLimit: 'dire',
      severityCappedByReputation: false
    });
    expect(result.value?.patient.ailments.length).toBeGreaterThan(0);
    expect(result.value?.patient.ailments.every(ailment => ailment.severity === severity)).toBe(true);
  });

  it.each([
    [0, 'lesser'],
    [14, 'lesser'],
    [15, 'intermediate'],
    [24, 'intermediate'],
    [25, 'severe'],
    [34, 'severe'],
    [35, 'dire']
  ] satisfies Array<[number, AilmentSeverity]>)('caps a drawn Dire result at the exact Reputation boundary %i', (reputation, appliedSeverity) => {
    const result = resolveSeverity('♠', reputation);

    expect(result.status).toBe('resolved');
    expect(result.value).toMatchObject({
      drawnSeverity: 'dire',
      reputationSeverityLimit: appliedSeverity,
      appliedSeverity,
      severityCappedByReputation: appliedSeverity !== 'dire'
    });
    expect(result.value?.patient.ailments.length).toBeGreaterThan(0);
    expect(result.value?.patient.ailments.every(ailment => ailment.severity === appliedSeverity)).toBe(true);
  });

  it('never promotes a lower suit just because Guild Reputation permits more responsibility', () => {
    const result = resolveSeverity('♦', 35);

    expect(result.value).toMatchObject({
      drawnSeverity: 'intermediate',
      reputationSeverityLimit: 'dire',
      appliedSeverity: 'intermediate',
      severityCappedByReputation: false
    });
  });

  it('uses the suit rather than the card value to determine severity', () => {
    const ace = resolveSeverity('♣', 35, 1);
    const monarch = resolveSeverity('♣', 35, 13);

    expect(ace.value?.drawnSeverity).toBe('severe');
    expect(monarch.value?.drawnSeverity).toBe('severe');
  });
});
