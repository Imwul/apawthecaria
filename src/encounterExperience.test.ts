// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import * as ts from 'typescript';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  hasPendingManualForagingCheckpoint,
  isAwaitingImmediateRemedy
} from './foragingRecovery';
import {
  isAwaitingImmediateRemedy as isAwaitingImmediateRemedyCheckpoint,
  releaseImmediateRemedyCheckpoint,
  withImmediateRemedyCheckpoint,
  type ImmediateRemedyCheckpointState
} from './rules/immediateRemedyEngine';
import type { ManualEffectDraft, PendingForagingState } from './rules';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const manualSource = readFileSync(fileURLToPath(new URL('./components/ManualEffectPanel.tsx', import.meta.url)), 'utf8');
const rulebookContextSource = readFileSync(fileURLToPath(new URL('./components/RulebookSourceContext.tsx', import.meta.url)), 'utf8');

interface AcquisitionGuardState {
  pendingForaging: PendingForagingState | null;
  pendingBarter: (ImmediateRemedyCheckpointState & { status: string }) | null;
  pendingTreatmentReward: object | null;
  manualEffectQueue: ManualEffectDraft[];
}

/** Run the actual App guard initializers, so a new acquisition gate cannot
 * silently be dropped while this test continues to verify a copied condition. */
const acquisitionGuardNames = [
  'awaitingForagingImmediateRemedy', 'awaitingBarterImmediateRemedy',
  'awaitingImmediateRemedy', 'awaitingManualForaging', 'awaitingTreatmentReward',
  'acquisitionInProgress', 'acquisitionCheckpointBlocked', 'forageDisabled', 'newAcquisitionBlocked'
] as const;
const appSyntax = ts.createSourceFile('App.tsx', appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const guardInitializers = new Map<string, ts.Expression>();
const collectGuardInitializers = (node: ts.Node) => {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)
    && acquisitionGuardNames.some(name => name === node.name.getText(appSyntax)) && node.initializer) {
    guardInitializers.set(node.name.text, node.initializer);
  }
  ts.forEachChild(node, collectGuardInitializers);
};
collectGuardInitializers(appSyntax);
const guardJavascript = ts.transpileModule(acquisitionGuardNames.map(name => {
  const initializer = guardInitializers.get(name);
  if (!initializer) throw new Error(`App acquisition guard ${name} was not found`);
  return `const ${name} = ${initializer.getText(appSyntax)};`;
}).join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
const evaluateAcquisitionGuards = new Function(
  'state', 'locationUnavailable', 'isAwaitingImmediateRemedy', 'isAwaitingImmediateRemedyCheckpoint',
  'hasPendingManualForagingCheckpoint',
  `${guardJavascript}\nreturn { ${acquisitionGuardNames.join(', ')} };`
) as (...bindings: unknown[]) => Record<typeof acquisitionGuardNames[number], boolean>;
const runAcquisitionGuards = (state: AcquisitionGuardState, locationUnavailable = false) => evaluateAcquisitionGuards(
  state, locationUnavailable, isAwaitingImmediateRemedy, isAwaitingImmediateRemedyCheckpoint,
  (current: AcquisitionGuardState) => hasPendingManualForagingCheckpoint(current.pendingForaging, current.manualEffectQueue)
);
const emptyAcquisitionState = (): AcquisitionGuardState => ({
  pendingForaging: null, pendingBarter: null, pendingTreatmentReward: null, manualEffectQueue: []
});
const forageTransaction = (phase: PendingForagingState['phase']): PendingForagingState => ({
  transactionId: 'persisted-forage', region: 'Forest', locationRelation: 'current',
  card: { value: 6, suit: '♥' }, timerCostAfterEncounter: 1, encounterId: null, phase
});

const executeAppInitializer = (name: string, bindings: Record<string, unknown>) => {
  let initializer: ts.Expression | undefined;
  const find = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) initializer = node.initializer;
    ts.forEachChild(node, find);
  };
  find(appSyntax);
  if (!initializer) throw new Error(`App initializer ${name} was not found`);
  const javascript = ts.transpileModule(`const result = ${initializer.getText(appSyntax)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
  }).outputText;
  return new Function(...Object.keys(bindings), `${javascript}\nreturn result;`)(...Object.values(bindings));
};

describe('encounter player-experience guards', () => {
  it('uses scene summaries in travel, barter/social, and forage journals instead of generic button labels', () => {
    expect(appSource.match(/encounterOutcomeSummary\(/g)).toHaveLength(3);
    expect(appSource).toContain('const selectedSocialOutcome = encounterOutcomeSummary(');
    expect(appSource).toMatch(/const selectedOutcome = selectedTravelChoice\s*\? encounterOutcomeSummary\(/);
    expect(appSource).toMatch(/const selectedForageOutcome = selectedEncounterChoice\s*\? encounterOutcomeSummary\(/);
  });

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

  it('shows and enforces conditional travel encounter choices before resolution', () => {
    const travelDialogStart = appSource.indexOf('{/* Travel Encounter Dialog Modal */}');
    const forageDialogStart = appSource.indexOf('{/* Foraging Encounter Dialog Modal */}', travelDialogStart);
    const travelDialogSource = appSource.slice(travelDialogStart, forageDialogStart);
    expect(travelDialogSource).toContain('현재 Guild Reputation');
    expect(travelDialogSource).toContain('encounterChoiceAvailability(choice, {');
    expect(travelDialogSource).toContain('disabled={!choiceAvailability.available}');
    expect(travelDialogSource).toContain('현재 선택 불가');
    expect(travelDialogSource).toContain('!travelChoiceReady');
  });

  it('distinguishes a Settlement social encounter from a Wilds travel encounter', () => {
    expect(appSource).toContain("const encounterKindLabel = activeTravelEncounter.encounterType === 'social' ? '사회 조우' : '여정 조우';");
    expect(appSource).toContain("사회 조우는 문양만 사용");
    expect(appSource).toContain("const pendingEncounterLabel = state.pendingEncounter.encounter.encounterType === 'social' ? '사회 조우' : '이동 조우';");
    expect(appSource).toContain("정착지·도시에 도착하면 문양으로 사회 조우를 찾습니다.");
    expect(appSource).toContain("야생·유적·고분에 도착하면 숫자와 계절로 여정 조우를 찾습니다.");
  });

  it('keeps conditional forage encounter choices from reaching resolution while unavailable', () => {
    const forageDialogStart = appSource.indexOf('{/* Foraging Encounter Dialog Modal */}');
    const forageDialogEnd = appSource.indexOf('{/* Seasoned (베테랑 여행자) 카드 선택 모달 */}', forageDialogStart);
    const forageDialogSource = appSource.slice(forageDialogStart, forageDialogEnd);
    expect(forageDialogSource).toContain('const forageChoiceReady =');
    expect(forageDialogSource).toContain('selectedForageChoiceDisabledReason');
    expect(forageDialogSource).toContain('!forageChoiceReady');
    expect(forageDialogSource).toContain('회색 선택지에는 부족한 조건이 표시됩니다.');
  });

  it('records a secondary draw before the player can switch encounter branches', () => {
    const slotStart = appSource.indexOf('const TravelSecondaryDrawSlot');
    const slotEnd = appSource.indexOf('\n// =================================================================\n// 3.5.', slotStart);
    const slotSource = appSource.slice(slotStart, slotEnd);

    expect(slotSource).not.toContain('window.setTimeout');
    expect(slotSource.indexOf('onDraw(drawPlayingCard())')).toBeLessThan(slotSource.indexOf('window.requestAnimationFrame'));
  });

  it('edits the identity attached to an encounter Patient without overwriting the original local Patient', () => {
    expect(appSource).toContain("const isEncounterPatient = typeof focusedAilment?.specialState?.encounterPatientName === 'string'");
    expect(appSource).toContain('specialState: { ...ailment.specialState, encounterPatientName: nextName }');
    expect(appSource).toContain('specialState: { ...ailment.specialState, encounterPatientSpecies: nextSpecies }');
    expect(appSource).toContain('동시에 돌보는 질환과 개별 타이머');
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
    expect(appSource.match(/pendingForagingAfterEncounterCheckpoint\(/g)).toHaveLength(2);
    expect(appSource.match(/settleExpiredPatientAfterTimer\(/g)?.length || 0).toBeGreaterThanOrEqual(6);
    expect(appSource).toContain('!queue.some(row => manualForagingCheckpointMatchesDraft(next.pendingForaging, row))');
    expect(appSource).toContain('manualEffectPending: Boolean(manualDraft)');
    expect(appSource).toContain('manualEffectPending: false');
  });

  it('keeps p.33/p.35 immediate Remedy as a persisted gate until the exact matching treatment commits', () => {
    expect(appSource).toContain('const awaitingForagingImmediateRemedy = isAwaitingImmediateRemedy(state.pendingForaging);');
    expect(appSource).toContain('const awaitingBarterImmediateRemedy = isAwaitingImmediateRemedyCheckpoint(state.pendingBarter);');
    expect(appSource).toContain('const acquisitionCheckpointBlocked = awaitingImmediateRemedy || awaitingManualForaging || awaitingTreatmentReward;');
    expect(appSource).toContain('pendingForaging: pendingForagingAfterEncounterCheckpoint(pending, foragingCheckpoint)');
    expect(appSource).toContain('pendingForaging: pendingForagingAfterEncounterCheckpoint(foragePending, foragingCheckpoint)');
    expect(appSource).toContain('pendingForaging: releaseImmediateRemedyCheckpointRule(s.pendingForaging, nextPatient.id, ailment.id)');
    expect(appSource).toContain('pendingBarter: releaseImmediateRemedyCheckpointRule(s.pendingBarter, nextPatient.id, ailment.id)');
    expect(appSource).toContain('if (hasAcquisitionCheckpoint(state))');
    expect(appSource).toContain('disabled={forageDisabled}');
    expect(appSource).toContain('const canBarter = !acquisitionCheckpointBlocked');
    expect(appSource).toContain('Timer 감소 보류');
    expect(appSource).toContain('치료제를 먼저 만드세요');
  });

  it('prevents a new forage from replacing every unfinished forage or barter transaction', () => {
    expect(runAcquisitionGuards(emptyAcquisitionState()).forageDisabled).toBe(false);
    for (const phase of ['choose-reagent', 'encounter', 'timer'] as const) {
      const guards = runAcquisitionGuards({ ...emptyAcquisitionState(), pendingForaging: forageTransaction(phase) });
      expect(guards.acquisitionCheckpointBlocked, phase).toBe(false);
      expect(guards.acquisitionInProgress, phase).toBe(true);
      expect(guards.forageDisabled, phase).toBe(true);
    }
    for (const status of ['manual-social', 'awaiting-second-card', 'awaiting-payment']) {
      const guards = runAcquisitionGuards({ ...emptyAcquisitionState(), pendingBarter: { status } });
      expect(guards.acquisitionCheckpointBlocked, status).toBe(false);
      expect(guards.acquisitionInProgress, status).toBe(true);
      expect(guards.forageDisabled, status).toBe(true);
    }
    for (const status of ['completed', 'abandoned']) {
      expect(runAcquisitionGuards({ ...emptyAcquisitionState(), pendingBarter: { status } }).forageDisabled, status).toBe(false);
    }
    expect(runAcquisitionGuards(emptyAcquisitionState(), true).forageDisabled).toBe(true);
    expect(runAcquisitionGuards({ ...emptyAcquisitionState(), pendingTreatmentReward: {} }).forageDisabled).toBe(true);
  });

  it.each(['forage', 'barter'] as const)('keeps a restored %s Remedy checkpoint separate from unfinished acquisition until its captured Ailment is treated', kind => {
    const checkpoint = withImmediateRemedyCheckpoint<PendingForagingState | (ImmediateRemedyCheckpointState & { status: string })>(
      kind === 'forage' ? forageTransaction('resolved') : { status: 'completed' },
      'patient-a', ['ailment-a']
    );
    const stateForCheckpoint = (pending: typeof checkpoint | null): AcquisitionGuardState => ({
      ...emptyAcquisitionState(),
      ...(kind === 'forage' ? { pendingForaging: pending as PendingForagingState | null } : { pendingBarter: pending as AcquisitionGuardState['pendingBarter'] })
    });
    const restored = JSON.parse(JSON.stringify(checkpoint)) as typeof checkpoint;
    const guards = runAcquisitionGuards(stateForCheckpoint(restored));
    expect(guards.awaitingImmediateRemedy).toBe(true);
    expect(guards.acquisitionInProgress).toBe(false);
    expect(guards.acquisitionCheckpointBlocked).toBe(true);
    expect(guards.forageDisabled).toBe(true);
    for (const [patientId, ailmentId] of [['patient-b', 'ailment-a'], ['patient-a', 'ailment-b']]) {
      const unrelatedTreatment = releaseImmediateRemedyCheckpoint(restored, patientId, ailmentId);
      expect(unrelatedTreatment).toEqual(restored);
      expect(runAcquisitionGuards(stateForCheckpoint(unrelatedTreatment)).forageDisabled).toBe(true);
    }
    const treated = releaseImmediateRemedyCheckpoint(restored, 'patient-a', 'ailment-a');
    expect(treated).toBeNull();
    expect(runAcquisitionGuards(stateForCheckpoint(treated)).forageDisabled).toBe(false);
  });

  it.each([
    'executeForageDraw', 'handleForageDraw', 'handleIndependentForage', 'executeScroungeForageDraw',
    'handleScroungeForage', 'handleScroungeGainReagent', 'handleSoddenLogHarvest', 'handleBarterAttempt',
    'handleBarrowForage', 'handleFinishScrounging'
  ])('stops the actual %s callback before drawing, spending time, or replacing a pending acquisition', async name => {
    const state = { ...emptyAcquisitionState(), pendingForaging: forageTransaction('choose-reagent') };
    const snapshot = JSON.stringify(state);
    const guards = runAcquisitionGuards(state);
    const showAlert = vi.fn();
    const drawPlayingCard = vi.fn();
    const updateState = vi.fn();
    const callback = executeAppInitializer(name, {
      state, ...guards, showAlert, drawPlayingCard, updateState,
      newAcquisitionBlockingMessage: '진행 중인 획득을 먼저 마치세요.',
      acquisitionCheckpointBlockingMessage: '조제 체크포인트'
    }) as (...args: unknown[]) => unknown;
    await callback();
    expect(showAlert).toHaveBeenCalledWith('진행 중인 획득을 먼저 마치세요.');
    expect(drawPlayingCard).not.toHaveBeenCalled();
    expect(updateState).not.toHaveBeenCalled();
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('allows an unused Independent benefit again once the acquisition gate is clear', () => {
    const drawPlayingCard = vi.fn(() => ({ value: 6, suit: '♥' }));
    const executeForageDraw = vi.fn();
    const showAlert = vi.fn();
    const callback = executeAppInitializer('handleIndependentForage', {
      state: { ...emptyAcquisitionState(), activeAilment: {}, independentUsedThisAilment: false },
      newAcquisitionBlocked: false, newAcquisitionBlockingMessage: '', showAlert,
      scroungeAdjacentRegions: ['Forest'], toRuleRegion: (region: string) => region,
      drawPlayingCard, executeForageDraw
    }) as (region: string) => void;
    callback('Forest');
    expect(drawPlayingCard).toHaveBeenCalledOnce();
    expect(executeForageDraw).toHaveBeenCalledWith('♥', 6, 'Forest', 'familiar-independent');
    expect(showAlert).not.toHaveBeenCalled();
  });

  it.each(['barter', 'remedy', 'reward'] as const)('preserves a queued Wasp draw while %s must finish first', kind => {
    const state = {
      ...emptyAcquisitionState(), companionStates: [{ companionId: 'wasp', pendingForageDraws: 1 }],
      currentRegion: 'Forest', pendingEncounter: null,
      ...(kind === 'barter' ? { pendingBarter: { status: 'awaiting-payment' } }
        : kind === 'remedy' ? { pendingBarter: withImmediateRemedyCheckpoint({ status: 'completed' } as ImmediateRemedyCheckpointState & { status: string }, 'patient-a', ['ailment-a']) }
          : { pendingTreatmentReward: {} })
    };
    const drawPlayingCard = vi.fn();
    const updateState = vi.fn((update: (current: typeof state) => typeof state) => expect(update(state)).toBe(state));
    const callback = executeAppInitializer('openPendingWaspForage', {
      useEffectEvent: (event: unknown) => event, updateState, drawPlayingCard,
      hasAcquisitionCheckpoint: (current: AcquisitionGuardState) => runAcquisitionGuards(current).awaitingImmediateRemedy
    }) as () => void;
    callback();
    expect(updateState).toHaveBeenCalledOnce();
    expect(drawPlayingCard).not.toHaveBeenCalled();
    expect(state.companionStates[0].pendingForageDraws).toBe(1);
  });

  it('places the single departure action before card foraging and keeps long direct-acquisition catalogues collapsed', () => {
    let section: ts.JsxElement | undefined;
    const find = (node: ts.Node) => {
      if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(attribute =>
        ts.isJsxAttribute(attribute) && attribute.name.getText(appSyntax) === 'id'
        && attribute.initializer && ts.isStringLiteral(attribute.initializer)
        && attribute.initializer.text === 'patient-scrounging-panel')) section = node;
      ts.forEachChild(node, find);
    };
    find(appSyntax);
    expect(section).toBeDefined();
    const javascript = ts.transpileModule(`const panel = ${section!.getText(appSyntax)};`, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None, jsx: ts.JsxEmit.React }
    }).outputText;
    const bindings = {
      React, state: { scroungingTimer: 10, currentRegion: 'Forest', patientArchive: [] },
      newAcquisitionBlocked: false, newAcquisitionBlockingMessage: '',
      handleFinishScrounging: vi.fn(), handleScroungeForage: vi.fn(), handleScroungeGainReagent: vi.fn(),
      scroungeAdjacentRegions: ['Forest'], scroungeReagentRegion: 'Forest', setScroungeReagentRegion: vi.fn(),
      localizeRegionLabel: (region: string) => region, toRuleRegion: (region: string) => region,
      REAGENTS: Array.from({ length: 80 }, (_, index) => ({
        id: `reagent-${index}`, displayName: `약재-${index}`, regionAvailability: { Forest: 'Common' },
        preparations: [{ tags: [{ tag: 'TOUGH', value: 2 }] }]
      }))
    };
    const element = new Function(...Object.keys(bindings), `${javascript}\nreturn panel;`)(...Object.values(bindings));
    const html = renderToStaticMarkup(element);
    expect(html.match(/길 떠나기 · 다음 이동 준비/g)).toHaveLength(1);
    expect(appSource.match(/onClick={handleFinishScrounging}/g)).toHaveLength(1);
    expect(html.indexOf('길 떠나기 · 다음 이동 준비')).toBeLessThan(html.indexOf('현재 위치 채집'));
    const catalogues = html.match(/<details class="scrounging-reagent-options"[^>]*>[\s\S]*?<\/details>/g) || [];
    expect(catalogues).toHaveLength(2);
    for (const catalogue of catalogues) {
      expect(catalogue).not.toMatch(/<details[^>]*\bopen(?:=|\s|>)/);
      expect(catalogue.match(/>약재-\d+<\/button>/g)).toHaveLength(80);
    }
    expect(appSource).toContain("targetId: 'patient-scrounging-panel'");
    expect(appSource).toContain('if (barterLimit > 0 && !newAcquisitionBlocked)');
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
    expect(manualSource).toContain('recordText.resultSummary.trim() || automaticSummary.trim()');
    expect(manualSource).toContain('onBlur={commitRecordText}');
    expect(manualSource).toContain('onResolve(false, resolvedRecordText())');
    expect(manualSource).toContain('고른 선택지와 적용할 변화는 자동으로 기록됩니다.');
    expect(manualSource).toContain('비우면 판정 결과 요약을 그대로 기록합니다');
    expect(manualSource).toContain('onCommit={next => updateInput(field.id, next)}');
    expect(manualSource).not.toContain('MANUAL_TEXT_SAVE_DELAY_MS');
    expect(appSource).toContain(': { ...draft, journalNote: draft.resultSummary.trim() };');
  });

  it('presents a pending manual encounter as scene, state change, then record', () => {
    expect(appSource).toContain('phase4-modal phase4-modal--manual-effect');
    expect(manualSource).toContain('localizeEncounterDisplayText(draft.summary, draft.printedText, draft.ownerId)');
    expect(manualSource).toContain('localizeEncounterTitle(draft.summary, draft.ownerId)');
    expect(manualSource).toContain('localizeManualEffectOption(option, encounter ? draft.ownerId : undefined, matchedChoice?.id)');

    const why = manualSource.indexOf('왜 직접 고르나요?');
    const scene = manualSource.indexOf('장면을 읽고 고르기');
    const changes = manualSource.indexOf('바뀌는 값 확인하기');
    // The record stage is rendered by a small child component so its long
    // textarea can stay local while typing.  Assert the parent render order,
    // rather than matching the child's declaration earlier in the module.
    const record = manualSource.indexOf('<ManualEffectRecordStage');
    expect(why).toBeGreaterThan(-1);
    expect(why).toBeLessThan(scene);
    expect(scene).toBeLessThan(changes);
    expect(changes).toBeLessThan(record);

    expect(manualSource).toContain('className={`manual-effect__choice-option${selected ? \' is-selected\' : \'\'}`}');
    expect(manualSource).toContain('aria-pressed={selected}');
    expect(manualSource).toContain('if (selected && field.required) return;');
    expect(manualSource).toContain("updateInput(field.id, selected ? '' : option);");
    expect(manualSource).not.toContain('<select value={String(value ?? \'\')}');
    expect(rulebookContextSource).not.toContain('구현 누락');
    expect(rulebookContextSource).toContain('플레이어가 고른 결과만 기록합니다.');
  });
});
