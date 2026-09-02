// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/App.tsx', 'utf8');

describe('Encounter Timer settlement shell integration', () => {
  it('settles every encounter and knitting path through the same recovery adapter', () => {
    expect(appSource).toContain('reconcileUnsettledPatientTimers(next, `${pending.barterId}:social-timer`)');
    expect(appSource).toContain('reconcileUnsettledPatientTimers(next, `${pending.transactionId}:encounter-timer`)');
    expect(appSource).toContain('reconcileUnsettledPatientTimers(next, `${pending.transactionId}:post-foraging-timer`)');
    expect(appSource).toContain('reconcileUnsettledPatientTimers(next, `${transaction.id}:knitting-timer`)');
    expect(appSource).toContain('reconcileUnsettledPatientTimers(next, `${transaction.id}:manual-encounter-timer`)');
    expect(appSource).toContain('reconcileUnsettledPatientTimers(timerState, transaction.id)');
  });

  it('continues Barter from the settled case instead of restoring pre-penalty snapshots', () => {
    expect(appSource).toContain('const resolvedGameState = applyResolvedSocialEncounter(state);');
    expect(appSource).toContain('updateState(applyResolvedSocialEncounter);');
    expect(appSource).toContain('if (!patientHasActiveAilments(resolvedPatient))');
    expect(appSource).toContain('runtime = toBarterRuntime(resolvedGameState, resolvedPatient);');
    expect(appSource).not.toContain('runtime = toBarterRuntime(resolvedGameState, resolvedSocialState.patient');
  });

  it('recovers pre-fix local, cloud and imported saves and preserves another active case', () => {
    expect(appSource).toContain("reconcileUnsettledPatientTimers(migrated.state, 'recovered-timer-expiry')");
    expect(appSource).toContain('currentPatientId && currentPatientId !== patient.id');
    expect(appSource).toContain('activePatientId: restorePatient.id');
    expect(appSource).toContain("status: 'abandoned',\n          manualResolution: undefined");
    expect(appSource).toContain('const patientIds = currentTimerRecoveryPatientIds({');
    expect(appSource).toContain('for (const patientId of patientIds)');
    expect(appSource).toContain('archiveContext: patientTimerArchiveContext(patient.id, s.patientArchive, {');
  });
});
