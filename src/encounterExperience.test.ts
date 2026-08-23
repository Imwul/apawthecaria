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
    expect(appSource).toContain('readSerializedForagingRollbackSnapshot(');
    expect(appSource).toContain('restoreSerializedForagingRollbackState(');
    expect(appSource).toContain('item.provenance?.sourceTransactionId !== pending.transactionId');
    expect(appSource).toContain('(patient.foragingPoints || 0) + spent - gained');
    expect(appSource).toContain('toolStates: Array.isArray(undo?.toolStates)');
    expect(appSource).toContain('!id.endsWith(`:${pending.transactionId}`)');
    expect(appSource).toContain('pendingForaging: null');
    expect(appSource).toContain('events.filter(event => event.id !== `${pending.transactionId}:journey-forage`)');
    expect(appSource).toContain('setForageTargetReagentIds([])');
    expect(appSource).toContain('setForageDrawCard(null)');
    expect(appSource).toContain("setForageLocationType('current')");
    expect(appSource).toContain("setForageAdjacentRegion('Forest')");
    expect(appSource).toContain('onRestartForaging={cancelCurrentForagingAttempt}');
    expect(appSource).toContain('이번 채집 처음부터');
    expect(appSource).toContain('채집 조우 이어가기');
    const recoveryPanelStart = appSource.indexOf('<aside className="forage-recovery-panel patient-workflow__forage-recovery"');
    const acquisitionPanelStart = appSource.indexOf('<details\n                  id="patient-acquisition-panel"');
    expect(recoveryPanelStart).toBeGreaterThan(-1);
    expect(acquisitionPanelStart).toBeGreaterThan(recoveryPanelStart);
  });

  it('finishes manual forage effects before applying the p.33 Remedy or Timer checkpoint', () => {
    expect(appSource.match(/resolveForagingPostEncounterCheckpoint\(\{/g)).toHaveLength(2);
    expect(appSource).toContain("!queue.some(row => row.context.continuation === 'foraging')");
    expect(appSource).toContain('manualEffectPending: Boolean(manualDraft)');
    expect(appSource).toContain('manualEffectPending: false');
  });

  it('lets the player remove a mistaken reagent without leaving a stale treatment draft', () => {
    const discardStart = appSource.indexOf('const handleDiscardTreatmentReagent');
    const discardEnd = appSource.indexOf('\n  useEffect(() =>', discardStart);
    const discardSource = appSource.slice(discardStart, discardEnd);
    expect(discardSource).toContain('await requestControlledPrompt');
    expect(discardSource).toContain("tone: 'destructive'");
    expect(discardSource).toContain("item.provenance?.source === 'forage'");
    expect(discardSource).toContain('item.provenance.sourceTransactionId === state.pendingForaging?.transactionId');
    expect(discardSource).toContain('화면 위의 진행 중인 채집');
    expect(discardSource).toContain('const nextBag = current.bag.filter(row => row.id !== item.id)');
    expect(discardSource).toContain('reconcileTreatmentDraftAfterBagRemoval({');
    expect(discardSource).toContain('removedItemId: item.id');
    expect(discardSource).toContain('remainingInventory: nextBag');
    expect(appSource).toContain('>재료 빼기</button>');
    expect(appSource).not.toContain('아래의 ‘이번 채집 처음부터’');
    expect(appSource).not.toContain("? treatmentPreview.requiresCatalyse ? 'CATALYSE로 완성' : '치료제 완성'\n                        : '준비 조건 확인'");
  });

  it('keeps an uncommitted forage plan mounted above the Play chapter boundary', () => {
    const playViewSource = appSource.slice(appSource.indexOf('function PlayView('));
    expect(appSource).toContain('forageDrawCard={forageDrawCard}');
    expect(appSource).toContain('forageTargetReagentIds={forageTargetReagentIds}');
    expect(appSource).toContain('forageLocationType={forageLocationType}');
    expect(playViewSource).not.toContain('const [forageDrawCard, setForageDrawCard] = useState');
    expect(playViewSource).not.toContain('const [forageLocationType, setForageLocationType] = useState');
  });

  it('lets the player clear a mistaken concoction without discarding inventory', () => {
    const clearStart = appSource.indexOf('const clearTreatmentDraft');
    const clearEnd = appSource.indexOf('\n\n  const handleDiscardTreatmentReagent', clearStart);
    const clearSource = appSource.slice(clearStart, clearEnd);
    expect(clearSource).toContain('setSelectedBagItems([])');
    expect(clearSource).toContain('setSelectedTools([])');
    expect(clearSource).toContain('setUsePurify(false)');
    expect(clearSource).toContain('treatmentDraft: null');
    expect(clearSource).not.toContain('bag:');
    expect(appSource).toContain('조제대 비우기');
    expect(appSource).toContain('가방의 재료와 도구는 그대로입니다.');
  });

  it('keeps destructive bag actions inside the journal interface', () => {
    const trinketStart = appSource.indexOf('const handleSpendTrinket');
    const trinketEnd = appSource.indexOf('\n\n  const handleToggleBandolier', trinketStart);
    const trinketSource = appSource.slice(trinketStart, trinketEnd);
    expect(trinketSource).toContain('await requestControlledPrompt');
    expect(trinketSource).toContain("tone: 'destructive'");
    expect(trinketSource).not.toContain('askWindowConfirm');
    expect(appSource).toContain('className="trinket-spend-button"');
  });

  it('does not make the player enter the same manual result twice', () => {
    expect(manualSource).toContain('draft.resultSummary.trim().length > 0;');
    expect(manualSource).toContain('비우면 판정 결과 요약을 그대로 기록합니다');
    expect(appSource).toContain(': { ...draft, journalNote: draft.resultSummary.trim() };');
  });
});
