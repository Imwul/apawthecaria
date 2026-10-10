// @ts-expect-error Vitest runs this source integration check in Node.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import * as ts from 'typescript';
import { getRuleCardValue } from './rules/cards';
import {
  resolveMushroomPickers,
  resolveSnapCrackleAfterEncounter,
  resolveSnapCrackleChoice,
  type EncounterP1TransactionState
} from './rules/encounterP1Transactions';
import { recordSainDeClawsMatch, type ForagingEncounterTransactionState, type SainDeClawsQuest } from './rules/foragingEncounterTransactions';
import { appendSecondaryCard, readSecondaryCardHistory } from './secondaryCardHistory';

const app = ts.createSourceFile('App.tsx', readFileSync('src/App.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

const findExpression = (match: (node: ts.Node) => ts.Expression | undefined): ts.Expression => {
  let found: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    found ??= match(node);
    if (!found) ts.forEachChild(node, visit);
  };
  visit(app);
  if (!found) throw new Error('The app card boundary was not found');
  return found;
};

const evaluate = (expression: ts.Expression, bindings: Record<string, unknown>): unknown => {
  const javascript = ts.transpileModule(`const expression = ${expression.getText(app)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
  }).outputText;
  return new Function(...Object.keys(bindings), `${javascript}\nreturn expression;`)(...Object.values(bindings));
};

const p1State = (): EncounterP1TransactionState => ({
  revision: 7, currentSeason: 'Spring', reputation: 3, trinkets: 2, foragingPoints: 4,
  inventory: [], patient: null, tools: [], companions: [], conditions: [], knightsQuests: [],
  clinics: [], clinicAgendaIds: [], appliedTransactionIds: []
});

const forageP1Callback = (runtime: EncounterP1TransactionState, extra: Record<string, unknown> = {}) => evaluate(
  findExpression(node => ts.isVariableDeclaration(node) && node.name.getText(app) === 'resolveForageP1Patch'
    ? node.initializer : undefined),
  {
    state: {}, getRuleCardValue,
    resolveCurrentMapLocationKey: () => 'forest-1', toTravelEngineGraph: () => ({}),
    toEncounterP1TransactionState: () => runtime, showAlert: vi.fn(), ...extra
  }
) as (input: Record<string, unknown>) => Promise<{ nextState: EncounterP1TransactionState } | false>;

describe('physical secondary cards at the app rule boundary', () => {
  it('runs the actual Mushroom Junior callback with a saved King without changing its physical history', async () => {
    const history = appendSecondaryCard(undefined, { value: 13, suit: '♥' }, 'junior');
    const runtime = p1State();
    const resolve = vi.fn(resolveMushroomPickers);
    const callback = forageP1Callback(runtime, { resolveMushroomPickers: resolve });
    const result = await callback({
      encounter: { id: 'foraging-forest-4' }, choiceId: 'junior',
      pending: { transactionId: 'saved-king' }, secondaryCards: readSecondaryCardHistory(history)
    });

    expect(resolve.mock.calls[0][0]).toMatchObject({ card: { value: 12, suit: '♥' } });
    expect(result).not.toBe(false);
    if (result === false) return;
    expect(result.nextState.trinkets).toBe(3);
    expect(runtime.trinkets).toBe(2);
    expect(history.secondaryCard).toEqual({ value: 13, suit: '♥' });
    expect(readSecondaryCardHistory(history)).toEqual([{ value: 13, suit: '♥' }]);
  });

  it('runs the actual first Snap Quick check with a newly drawn King', async () => {
    const check = vi.fn(resolveSnapCrackleAfterEncounter);
    const callback = forageP1Callback(p1State(), {
      resolveSnapCrackleChoice, resolveSnapCrackleAfterEncounter: check,
      drawPlayingCard: () => ({ value: 13, suit: '♥' })
    });
    const result = await callback({
      encounter: { id: 'foraging-titan-8' }, choiceId: 'quick',
      pending: { transactionId: 'quick-king' }, secondaryCards: []
    });

    expect(check.mock.calls[0][0]).toMatchObject({ card: { value: 12, suit: '♥' } });
    expect(result).not.toBe(false);
    if (result === false) return;
    expect(result.nextState.conditions).toContainEqual(expect.objectContaining({ kind: 'snap-crackle-pop', mode: 'quick' }));
  });

  it('matches a physical King to a Queen target by Monarch value in the actual Sain predicate and command', () => {
    const quest: SainDeClawsQuest = {
      id: 'present-quest', sourceTransactionId: 'presents-start', locationId: 'forest-1', status: 'finding' as const,
      targetCards: [{ value: 12, suit: '♥' as const }, { value: 2, suit: '♥' as const }, { value: 3, suit: '♥' as const }],
      matchedTargetIndexes: [], returnedTargetIndexes: [], matchedForageTransactionIds: []
    };
    const bindings = { sainQuest: quest, effectiveCardValue: 13, effectiveDrawnSuit: '♣', getRuleCardValue };
    const predicate = evaluate(findExpression(node => ts.isCallExpression(node)
      && node.expression.getText(app) === 'sainQuest?.targetCards.findIndex' ? node.arguments[0] : undefined), bindings) as
      (target: { value: number; suit: string }, index: number) => boolean;
    const targetIndex = quest.targetCards.findIndex(predicate);
    expect(targetIndex).toBe(0);
    const cardExpression = findExpression(node => {
      if (!ts.isCallExpression(node) || node.expression.getText(app) !== 'recordSainDeClawsMatch') return undefined;
      const input = node.arguments[0];
      if (!ts.isObjectLiteralExpression(input)) return undefined;
      const property = input.properties.find(row => ts.isPropertyAssignment(row) && row.name.getText(app) === 'forageCard');
      return property && ts.isPropertyAssignment(property) ? property.initializer : undefined;
    });
    const forageCard = evaluate(cardExpression, bindings) as { value: number; suit: '♣' };
    const runtime: ForagingEncounterTransactionState = {
      revision: 1, reputation: 3, trinkets: 2, foragingPoints: 4, inventory: [], patient: null, tools: [],
      companions: [], conditions: [], deliveries: [], sainDeClawsQuests: [quest], appliedTransactionIds: []
    };
    const result = recordSainDeClawsMatch({
      transactionId: 'king-present-match', encounterId: 'sain-de-claws-match', expectedRevision: 1, state: runtime,
      questId: quest.id, forageTransactionId: 'king-forage', locationId: 'forest-1', forageCard, targetIndex
    });
    expect(result.status).toBe('resolved');
    expect(result.value?.nextState.sainDeClawsQuests[0].matchedTargetIndexes).toEqual([0]);
  });
});
