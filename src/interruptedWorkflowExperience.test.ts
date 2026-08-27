// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync('src/App.tsx', 'utf8');

describe('interrupted workflow lifecycle wiring', () => {
  it('flushes only the three scoped meaningful drafts at the pagehide boundary', () => {
    expect(appSource.match(/window\.addEventListener\('pagehide'/g)).toHaveLength(3);
    expect(appSource).toContain('flushSync(() => persistJourneyDraftNow())');
    expect(appSource).toContain('flushSync(() => persistPatientIdentity())');
    expect(appSource).toContain('flushSync(() => persistCharacterDraftNow())');
    expect(appSource.match(/window\.addEventListener\(WORKFLOW_DRAFT_FLUSH_EVENT/g)).toHaveLength(3);
    expect(appSource.match(/window\.addEventListener\(WORKFLOW_DRAFT_CONTROL_EVENT/g)).toHaveLength(3);
    expect(appSource).toContain('const flushWorkflowDrafts = () => window.dispatchEvent(new Event(WORKFLOW_DRAFT_FLUSH_EVENT))');
    expect(appSource.match(/flushWorkflowDrafts\(\);/g)).toHaveLength(8);
  });

  it('flushes the old campaign before cloud replacement, import, sign-out, or upload reads', () => {
    const replacementBoundaries = [
      ['const loadCloudRecord =', 'resetCampaignScopedUi();'],
      ['const handleSignOut =', 'await signOut(auth);'],
      ['const handleDownloadCloudSlot =', 'resetCampaignScopedUi();'],
      ['const handleUploadCloudSlot =', 'safeLocalStorageGetItem(CAMPAIGN_SAVE_KEY)'],
      ['onCampaignImported={(nextState: GameState) => {', 'resetCampaignScopedUi();']
    ] as const;
    for (const [startMarker, endMarker] of replacementBoundaries) {
      const start = appSource.indexOf(startMarker);
      const end = appSource.indexOf(endMarker, start);
      const boundarySource = appSource.slice(start, end);
      expect(start).toBeGreaterThan(-1);
      expect(end).toBeGreaterThan(start);
      expect(boundarySource).toContain('flushWorkflowDrafts();');
    }
    expect(appSource).toContain('if (record.slot !== readActiveCloudSlot()) flushWorkflowDrafts();');
    expect(appSource).toContain('const previousSlot = readActiveCloudSlot();');
    expect(appSource).toContain("controlWorkflowDrafts('suspend')");
    expect(appSource).toContain("controlWorkflowDrafts('discard')");
    expect(appSource).toContain("if (resumeSuspendedWorkflowDrafts) controlWorkflowDrafts('resume')");
    expect(appSource).toContain('const remaining = await flushQueuedCloudSavesForCurrentUser();');
    expect(appSource).toContain('(entry.slot === previousSlot || entry.slot === slot)');
    const uploadStart = appSource.indexOf('const handleUploadCloudSlot =');
    const uploadEnd = appSource.indexOf('const handleReset =', uploadStart);
    const uploadSource = appSource.slice(uploadStart, uploadEnd);
    expect(uploadSource).toContain('remaining.some(entry => entry.ownerUid === uid && entry.slot === slot)');
    const downloadStart = appSource.indexOf('const handleDownloadCloudSlot =');
    const downloadEnd = appSource.indexOf('const handleUploadCloudSlot =', downloadStart);
    const downloadSource = appSource.slice(downloadStart, downloadEnd);
    expect(downloadSource).not.toContain('if (readCloudAccountBinding() === uid)');
    expect(downloadSource).toContain('const remaining = await flushQueuedCloudSavesForCurrentUser();');
    expect(downloadSource).toContain('entry.ownerUid === uid');
    expect(appSource).toContain('const latestSlots = await refreshCloudSlots(uid);');
    expect(appSource.indexOf('const latestSlots = await refreshCloudSlots(uid);'))
      .toBeLessThan(appSource.indexOf('const payload = await readCloudSlotPayload(record, uid);', appSource.indexOf('const handleDownloadCloudSlot =')));
  });

  it('keeps the cloud slot dialog modal while a slot operation is in flight', () => {
    expect(appSource).toContain("if (event.key === 'Escape' && !busy) onClose();");
    expect(appSource).toContain('<button type="button" autoFocus disabled={busy} onClick={onClose}>');
    expect(appSource).toContain('if (!auth || cloudSlotBusy || cloudSlotOperationInFlightRef.current) return;');
    expect(appSource).toContain('if (cloudSlotBusy || cloudSlotOperationInFlightRef.current) return;');
    expect(appSource).toContain('if (!cloudSlotBusy && !cloudSlotOperationInFlightRef.current) setShowCloudSlots(false);');
    expect(appSource).toContain("if (busy && event.key === 'Tab')");
    expect(appSource).toContain('busyStatusRef.current?.focus();');
  });

  it('invalidates stale async bootstrap work when the signed-in account changes', () => {
    expect(appSource).toContain('const authBootstrapGenerationRef = useRef(0);');
    expect(appSource).toContain('const authBootstrapUserUidRef = useRef<string | null>(null);');
    expect(appSource).toContain('if (authBootstrapUserUidRef.current !== nextUid) cloudBootstrapSkipped.current = false;');
    expect(appSource).toContain('const bootstrapGeneration = ++authBootstrapGenerationRef.current;');
    expect(appSource).toContain('auth.currentUser?.uid === u?.uid');
    expect(appSource).toContain('if (cloudBootstrapSkipped.current || !bootstrapStillCurrent()) return;');
    expect(appSource).toContain('if (bootstrapStillCurrent()) setCloudBootstrapComplete(true);');
    expect(appSource).toContain('const cloudSlotOperationGenerationRef = useRef(0);');
    expect(appSource).toContain('auth?.currentUser?.uid === uid;');
    expect(appSource).toContain('// Slot labels are account data too.');
    expect(appSource).toContain('setShowCloudSlots(false);\n      setCloudSlotViews(emptyCloudSlotViews());');
    expect(appSource).toContain('readSaveOutbox().some(entry => entry.ownerUid === u.uid && entry.slot === cloudRecord.slot)');
    expect(appSource).toContain('if (auth?.currentUser?.uid !== expectedUid) return;');
  });

  it('flushes the old campaign before an intentional full reset, then lets the reset win', () => {
    const resetStart = appSource.indexOf('const handleReset =');
    const resetEnd = appSource.indexOf('if (loading || !cloudBootstrapComplete || !state)', resetStart);
    const resetSource = appSource.slice(resetStart, resetEnd);
    expect(resetSource.indexOf("changeActiveTab('bio')")).toBeLessThan(resetSource.indexOf('updateState(() => syncWorldMemory(INITIAL_STATE))'));
  });

  it('fully abandons Journey preparation modes as well as their values', () => {
    const replaceStart = appSource.indexOf('const replaceJourneyPreparationLocalState =');
    const replaceEnd = appSource.indexOf('const buildJourneyPreparationDraft =', replaceStart);
    const replaceSource = appSource.slice(replaceStart, replaceEnd);
    const clearStart = appSource.indexOf('const clearJourneyStartDraft =');
    const clearEnd = appSource.indexOf('const handleResetJourneyStartDraft =', clearStart);
    const clearSource = appSource.slice(clearStart, clearEnd);
    expect(replaceSource).toContain("setJourneyDestinationMode(draft?.destinationMode || 'draw')");
    expect(replaceSource).toContain("setJourneyGoalMode(draft?.goalMode || 'table')");
    expect(clearSource).toContain('replaceJourneyPreparationLocalState(null)');
    expect(clearSource).toContain('workflowDrafts: { ...current.workflowDrafts, journey: null }');
  });

  it('invalidates a Journey draft when its origin or season changed during navigation', () => {
    expect(appSource).toContain('journeyDraftCandidate.context.originId === journeyOriginId');
    expect(appSource).toContain('candidate.context.season !== current.currentSeason');
    expect(appSource).toContain('const journeyDraftContextRef = useRef');
    expect(appSource).toContain('replaceJourneyPreparationLocalState(savedJourneyDraft)');
    expect(appSource).toContain('debounce/navigation flush cannot resurrect the old context as a new draft');
  });

  it('persists the exact Journey destination selected from either map interaction path', () => {
    const mapPickStart = appSource.indexOf('const handlePlayMapPick =');
    const mapPickEnd = appSource.indexOf('const handlePlayMapTravel =', mapPickStart);
    const mapSelectionSource = appSource.slice(mapPickStart, mapPickEnd);
    expect(mapSelectionSource.match(/scheduleJourneyDraftPersistence\('destinationId'/g)).toHaveLength(3);
    expect(mapSelectionSource.match(/setJourneyDistanceConfirmedManually\(false\)/g)).toHaveLength(3);
  });

  it('persists Journey-start choices made after submit but before canonical commit', () => {
    const start = appSource.indexOf('const handleStartJourney =');
    const end = appSource.indexOf('const executeCanonicalTravelMoveTransaction =', start);
    const journeyCommitSource = appSource.slice(start, end);
    expect(journeyCommitSource).toContain("journeyDraftFieldsTouchedRef.current.add('clayPotReagentId')");
    expect(journeyCommitSource).toContain("journeyDraftFieldsTouchedRef.current.add('resourcefulReagent')");
    expect(journeyCommitSource).toContain("journeyDraftFieldsTouchedRef.current.add('ingenuitiveTool')");
    expect(journeyCommitSource.match(/flushSync\(\(\) => persistJourneyDraftNow\(\)\)/g)).toHaveLength(4);
    expect(journeyCommitSource).toContain('if (capabilityDraftPruned) flushSync(() => persistJourneyDraftNow());');
    expect(journeyCommitSource).toContain("let resourcefulReagent = familiarMechanic === 'resourceful' ? journeyResourcefulReagentRef.current : '';");
    expect(journeyCommitSource).toContain("let ingenuitiveTool = familiarMechanic === 'ingenuitive' ? journeyIngenuitiveToolRef.current : '';");
    expect(journeyCommitSource).toContain("journeyDraftFieldsTouchedRef.current.delete('resourcefulReagent')");
    expect(journeyCommitSource).toContain("journeyDraftFieldsTouchedRef.current.delete('ingenuitiveTool')");
    expect(journeyCommitSource).toContain("journeyDraftFieldsTouchedRef.current.delete('clayPotReagentId')");
    expect(journeyCommitSource).not.toContain('journeyResourcefulReagentRef.current || state.resourcefulReagent');
    expect(journeyCommitSource).not.toContain('journeyIngenuitiveToolRef.current || state.ingenuitiveTool');
  });

  it('clears Patient identity after any committed intake outcome, including no active Patient', () => {
    expect(appSource).toContain('state.appliedTransactionIds.includes(draftTransactionId)');
    expect(appSource).toContain('if (patientCommitApplied) clearPatientIdentityLocalState()');
    expect(appSource).toContain("workflowDrafts: { ...current.workflowDrafts, patient: null }");
  });

  it('invalidates stale Patient cards before resuming while retaining safe identity text', () => {
    expect(appSource).toContain('const patientDiagnosisContextKeyFor = (value: GameState): string =>');
    expect(appSource).toContain('clinicServiceArea(clinicRuntime, clinic.id).includes(currentLocationId)');
    expect(appSource).toContain("getActiveFamiliarMechanic(value) === 'ingenuitive'");
    expect(appSource).toContain('patientDiagnosisKey: patientDiagnosisContextKeyFor(pendingRewardMigrationState)');
    expect(appSource).toContain('patientDiagnosisContextKeyFor(current) !== intakeDraft.context.diagnosisKey');
    expect(appSource.match(/patientDraftDiagnosisContextKey\(/g)).toHaveLength(1);
    expect(appSource).toContain('JSON.stringify(existingDraftCandidate.context) === JSON.stringify(currentIntakeContext)');
    expect(appSource).toContain('이름과 첫 만남 메모는 유지한 채 새 접수를 시작합니다.');
  });

  it('makes an unmounted Patient intake continuation inert after a campaign switch', () => {
    expect(appSource).toContain('const playViewAliveRef = useRef(true);');
    expect(appSource).toContain('if (!playViewAliveRef.current) return false;');
    expect(appSource).toContain('if (!playViewAliveRef.current) return;');
  });

  it('freezes Treatment inputs before reward choice and guards the one-shot commit', () => {
    expect(appSource).toContain('sourceFingerprint: treatmentRewardSourceFingerprint(state, patient.id)');
    expect(appSource).toContain('s.pendingTreatmentReward.sourceFingerprint === treatmentRewardSourceFingerprint(s, patient.id)');
    expect(appSource).toContain('// The Treatment engine returns a complete Patient snapshot.');
    expect(appSource).toContain('if (state.pendingTreatmentReward?.patientId === patient.id)');
    expect(appSource).toContain('if (s.appliedTransactionIds.includes(transactionId))');
    expect(appSource).toContain('pendingTreatmentReward: null');
    expect(appSource).toContain('toolInstanceIds: canonicalToolsFromState(pendingRewardMigrationState).map(tool => tool.instanceId)');
    expect(appSource).toContain('sourceFingerprint: pendingTreatmentRewardCandidate');
    expect(appSource).toContain('const treatmentRewardPendingForPatient = state.pendingTreatmentReward?.patientId === patient.id;');
    expect(appSource).toContain('if (current.pendingTreatmentReward?.patientId === patient.id) return current;');
  });
});
