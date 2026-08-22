// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const manualSource = readFileSync(fileURLToPath(new URL('./components/ManualEffectPanel.tsx', import.meta.url)), 'utf8');

describe('encounter player-experience guards', () => {
  it('waits for account bootstrap before opening an editable campaign', () => {
    expect(appSource).toContain('const [cloudBootstrapComplete, setCloudBootstrapComplete]');
    expect(appSource).toContain('if (loading || !cloudBootstrapComplete || !state)');
    expect(appSource).toContain('if (loading || !cloudBootstrapComplete || !state || initialSetupRouted.current) return;');
  });

  it('makes required spoken or drawn journal prompts explicit and persistent', () => {
    expect(appSource.match(/말하거나 그림으로 장면을 떠올렸습니다/g)).toHaveLength(2);
    expect(appSource).toContain('pendingEncounter: s.pendingEncounter ? { ...s.pendingEncounter, journalAcknowledged } : null');
    expect(appSource).toContain('pendingForaging: s.pendingForaging ? { ...s.pendingForaging, journalAcknowledged } : null');
    expect(appSource).not.toContain('journalAcknowledged: true,\n      state:');
  });

  it('defers rather than resolves an encounter when the player chooses to continue later', () => {
    expect(appSource).toContain('setDeferredEncounterId(state.pendingEncounter?.transactionId || null)');
    expect(appSource).toContain('setDeferredForageEncounterId(state.pendingForaging?.transactionId || null)');
    expect(appSource).not.toContain('const closeForageEncounter = async () => finishForageEncounter');
    expect(appSource.match(/>나중에 계속<\/button>/g)).toHaveLength(2);
  });

  it('prevents a forage encounter from being submitted twice', () => {
    expect(appSource).toContain('if (resolvingForageEncounterRef.current) return false;');
    expect(appSource).toContain("{resolvingForageEncounter ? '조우 해결 중…' : '조우 해결하고 기록하기'}");
  });

  it('can restart a forage after gathering and restore its pre-draw state', () => {
    const cancelStart = appSource.indexOf('const cancelCurrentForagingAttempt');
    const cancelEnd = appSource.indexOf('\n  useEffect(() =>', cancelStart);
    const cancelSource = appSource.slice(cancelStart, cancelEnd);
    expect(appSource).toContain('foragingUndoCheckpointRef');
    expect(appSource).toContain('const undoSnapshot = onStartForaging(transactionId, state)');
    expect(appSource).toContain('채집 처음부터 다시 하기');
    expect(cancelSource).toContain('await requestControlledPrompt');
    expect(cancelSource).toContain("hideField: true");
    expect(cancelSource).toContain("tone: 'destructive'");
    expect(cancelSource).not.toContain('askWindowConfirm');
    expect(appSource).toContain('updateState(() => checkpoint.state)');
    expect(appSource).toContain('item.provenance?.sourceTransactionId !== pending.transactionId');
    expect(appSource).toContain('(patient.foragingPoints || 0) + spent - gained');
    expect(appSource).toContain('toolStates: Array.isArray(undo?.toolStates)');
    expect(appSource).toContain('!id.endsWith(`:${pending.transactionId}`)');
    expect(appSource).toContain('pendingForaging: null');
    expect(appSource).toContain('events.filter(event => event.id !== `${pending.transactionId}:journey-forage`)');
    expect(appSource).toContain('setForagingRestartToken(token => token + 1)');
    expect(appSource).toContain('setForageTargetReagentIds([])');
    expect(appSource).toContain('setForageDrawCard(null)');
  });

  it('does not make the player enter the same manual result twice', () => {
    expect(manualSource).toContain('draft.resultSummary.trim().length > 0;');
    expect(manualSource).toContain('비우면 판정 결과 요약을 그대로 기록합니다');
    expect(appSource).toContain(': { ...draft, journalNote: draft.resultSummary.trim() };');
  });
});
