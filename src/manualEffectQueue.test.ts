import { describe, expect, it } from 'vitest';
import type { ManualEffectDraft } from './rules';
import { selectAutoOpenManualDraft } from './manualEffectQueue';

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
    const fresh = draft('fresh', 'manual');

    expect(selectAutoOpenManualDraft([deferred, completed, fresh])).toBe(fresh);
  });
});
