import { describe, expect, it } from 'vitest';
import type { ManualEffectDraft } from './rules';
import {
  actionableManualEffectDrafts,
  manualEffectDraftNeedsPlayerResolution,
  selectAutoOpenManualDraft
} from './manualEffectQueue';

const draft = (effectId: string, status: ManualEffectDraft['status'], transactionId: string | null = null): ManualEffectDraft => ({
  effectId,
  ruleId: effectId,
  ruleIds: [effectId],
  sourcePage: 1,
  summary: effectId,
  registryEffectId: null,
  ownerId: effectId,
  ownerType: 'encounter',
  trigger: 'encounter',
  printedText: effectId,
  resolutionInstruction: effectId,
  mandatoryConditions: [],
  choices: [],
  canonicalActions: [],
  inputFields: [],
  inputValues: {},
  actionTemplates: [],
  selectedActionIds: [],
  actionTargets: {},
  followUpRequirements: [],
  context: { continuation: 'none' },
  resultSummary: '',
  journalNote: '',
  status,
  transactionId,
  overrideReason: '',
  createdAt: 1,
  updatedAt: 1
});

describe('manual effect queue auto-open selection', () => {
  it('does not reopen a deferred draft merely because another draft was enqueued or resolved', () => {
    const deferred = draft('deferred', 'deferred');

    expect(selectAutoOpenManualDraft([deferred])).toBeNull();
  });

  it('skips deferred and completed rows while selecting the next fresh manual draft', () => {
    const deferred = draft('deferred', 'deferred');
    const completed = draft('completed', 'resolved', 'manual:completed');
    const fresh = { ...draft('fresh', 'manual'), ownerType: 'service' as const };

    expect(selectAutoOpenManualDraft([deferred, completed, fresh])).toBe(fresh);
  });

  it('does not reopen a narrative-only encounter choice that was already selected', () => {
    const narrative = {
      ...draft('narrative', 'manual'),
      choices: ['잠시 이야기를 나눈다'],
      inputFields: [{
        id: 'printed-choice',
        type: 'choice' as const,
        label: '고른 선택',
        required: true,
        options: ['잠시 이야기를 나눈다']
      }],
      inputValues: { 'printed-choice': '잠시 이야기를 나눈다' }
    };

    expect(manualEffectDraftNeedsPlayerResolution(narrative)).toBe(false);
    expect(actionableManualEffectDrafts([narrative])).toEqual([]);
    expect(selectAutoOpenManualDraft([narrative])).toBeNull();
  });

  it('keeps typed outcomes, mechanical actions, and non-Encounter follow-ups actionable', () => {
    const typed = {
      ...draft('typed', 'manual'),
      inputFields: [{ id: 'card-result', type: 'choice' as const, label: '카드 결과', required: true, options: ['성공', '실패'] }]
    };
    const mechanical = {
      ...draft('mechanical', 'manual'),
      actionTemplates: [{ id: 'gain', kind: 'modify-reputation' as const, label: 'Guild Reputation +1', required: true, amount: 1, sourceText: 'Gain 1 Reputation.' }]
    };
    const service = { ...draft('service', 'manual'), ownerType: 'service' as const };

    expect(manualEffectDraftNeedsPlayerResolution(typed)).toBe(true);
    expect(manualEffectDraftNeedsPlayerResolution(mechanical)).toBe(true);
    expect(manualEffectDraftNeedsPlayerResolution(service)).toBe(true);
  });
});
