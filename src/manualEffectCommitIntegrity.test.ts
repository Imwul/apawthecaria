// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');

describe('manual effect commit integrity', () => {
  it('re-scopes a reloaded draft after merging saved values so context owns the printed branch', () => {
    const start = appSource.indexOf('const refreshManualDraftFromRegistry');
    const end = appSource.indexOf('\n\nconst encounterChoiceSlug', start);
    const refreshSource = appSource.slice(start, end);

    expect(refreshSource).toContain('return scopeManualEffectDraftForEncounterChoice({');
    expect(refreshSource).toContain("inputValues: { ...canonical.inputValues, ...savedInputValues }");
    expect(refreshSource).toContain('}, draft.updatedAt);');
  });

  it('uses captured state only for preview and resolves again against the latest functional state before mutation', () => {
    const start = appSource.indexOf('onResolve={override => {');
    const end = appSource.indexOf('\n              }}', start) + '\n              }}'.length;
    const resolveSource = appSource.slice(start, end);
    const updaterStart = resolveSource.indexOf('updateState(s => {');
    const updaterSource = resolveSource.slice(updaterStart);

    expect(resolveSource).toContain('resolveManualEffectAgainstGameState(state, previewDraft, transaction, override)');
    expect(resolveSource).toContain('if (!preview.resolution.value)');
    expect(updaterSource).toContain('const currentDraft = s.pendingManualEffect;');
    expect(updaterSource).toContain('resolveManualEffectAgainstGameState(s, currentDraft, transaction, override)');
    expect(updaterSource).toContain('if (!commit.resolution.value) return s;');
    expect(updaterSource).toContain('const outcome = commit.resolution.value;');
    expect(updaterSource).not.toContain('preview.resolution.value!');
    expect(updaterSource).not.toContain('resolved.value!');
  });

  it('does not relabel an automatic result-summary fallback as player-authored memory', () => {
    const start = appSource.indexOf('onResolve={override => {');
    const end = appSource.indexOf('\n              }}', start);
    const resolveSource = appSource.slice(start, end);

    expect(resolveSource).toContain('text: outcome.record.journalNote.trim() ? outcome.record.journalNote : outcome.record.resultSummary.trim()');
    expect(resolveSource).toContain('journalNote: currentDraft.journalNote,');
    expect(resolveSource).not.toContain('journalNote: outcome.record.journalNote,');
  });

  it('auto-opens only fresh manual drafts while leaving deferred drafts for explicit resume', () => {
    const enqueueStart = appSource.indexOf('const enqueueManualDrafts');
    const enqueueEnd = appSource.indexOf('\n\nconst appendEngineJournals', enqueueStart);
    const enqueueSource = appSource.slice(enqueueStart, enqueueEnd);
    const resolveStart = appSource.indexOf('onResolve={override => {');
    const resolveEnd = appSource.indexOf('\n              }}', resolveStart);
    const resolveSource = appSource.slice(resolveStart, resolveEnd);

    expect(enqueueSource).toContain('open ? selectAutoOpenManualDraft(queue) : null');
    expect(enqueueSource).not.toContain('open ? queue[0]');
    expect(resolveSource).toContain('pendingManualEffect: selectAutoOpenManualDraft(queue)');
    expect(resolveSource).not.toContain('pendingManualEffect: queue[0]');
    expect(appSource).toContain('pendingManualEffect: s.manualEffectQueue[0] || null');
  });

  it('projects Bags and pending follow-ups from the state supplied at resolution time', () => {
    const start = appSource.indexOf('const resolveManualEffectAgainstGameState');
    const end = appSource.indexOf('\n\nconst toMobilityRuntime', start);
    const helperSource = appSource.slice(start, end);

    expect(helperSource).toContain('inventory: toEngineInventory(s.bag)');
    expect(helperSource).toContain('pendingFollowUps: s.pendingManualFollowUps');
    expect(helperSource).toContain('appliedTransactionIds: s.appliedTransactionIds');
    expect(helperSource).not.toContain('inventory: toEngineInventory(state.bag)');
  });

  it('commits a follow-up against the latest Bags and Companion state before marking it resolved', () => {
    const start = appSource.indexOf('const handleCompleteManualFollowUp');
    const end = appSource.indexOf('\n\n  const finishForageEncounter', start);
    const followUpSource = appSource.slice(start, end);
    const updaterStart = followUpSource.indexOf('updateState(s => {');
    const updaterSource = followUpSource.slice(updaterStart);

    expect(followUpSource).toContain('resolveManualFollowUpTransaction({');
    expect(updaterSource).toContain('inventory: toEngineInventory(s.bag)');
    expect(updaterSource).toContain('companions: s.companionStates');
    expect(updaterSource).toContain('pendingFollowUps: s.pendingManualFollowUps');
    expect(updaterSource).toContain('bag: fromEngineInventory(outcome.value.nextState.inventory, s.bag)');
    expect(updaterSource).toContain('companionStates: outcome.value.nextState.companions');
    expect(updaterSource).not.toContain("status: 'resolved' as const");
  });

  it('requires the printed Cocoon hatch condition and carries it through preview and commit', () => {
    const start = appSource.indexOf('const handleCompleteManualFollowUp');
    const end = appSource.indexOf('\n\n  const finishForageEncounter', start);
    const followUpSource = appSource.slice(start, end);

    expect(followUpSource).toContain("followUp.kind === 'cocoon-hatch'");
    expect(followUpSource).toContain("'travelled-10-paths'");
    expect(followUpSource).toContain("'journey-ended'");
    expect(followUpSource.match(/eligibilityEvidence,/g)).toHaveLength(2);
  });
});
