// @ts-expect-error Node is used only by Vitest to execute the actual App handlers.
import { readFileSync } from 'node:fs';
// @ts-expect-error Node is used only by Vitest to execute the actual App handlers.
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import * as ts from 'typescript';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const section = (start: string, end: string) => appSource.slice(appSource.indexOf(start), appSource.indexOf(end, appSource.indexOf(start)));
const actualHandlers = ts.transpileModule(section('  const MAX_MANUAL_TRINKET_DELTA =', '  const handleManualReagentAddition ='), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;
const actualResize = ts.transpileModule(section('const resizeTrinkets =', '/** p.84 Taken Prisoner'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;

const fixture = (overrides: Record<string, unknown> = {}) => {
  let state: any = { reputation: 5, trinkets: ['Memento'], patients: [], activePatientId: null, activeAilment: null, bag: [], ...overrides };
  const showAlert = vi.fn();
  const appendManualAdjustmentJournal = vi.fn((next: any) => next);
  const createClientTransaction = () => ({ id: 'manual:qa', at: 1 });
  const updateState = (update: (value: any) => any) => { state = update(state); };
  const factory = new Function('dependencies', `
    const { updateState, showAlert, appendManualAdjustmentJournal, createClientTransaction, raw } = dependencies;
    const manualTrinketDelta = raw;
    const manualReputationDelta = raw;
    const manualForagingPointsDelta = raw;
    const manualBagDelta = raw;
    const selectedManualBagItemId = 'bag:qa';
    const setManualTrinketDelta = () => {};
    const setManualReputationDelta = () => {};
    const setManualForagingPointsDelta = () => {};
    const setManualBagDelta = () => {};
    const updateActivePatient = (current, update) => current.patients.map(patient => patient.id === current.activePatientId ? update(patient) : patient);
    ${actualResize}
    ${actualHandlers}
    return { parseManualDelta, handleManualTrinketAdjustment, handleManualReputationAdjustment, handleManualForagingPointsAdjustment, handleManualBagAdjustment };
  `);
  const execute = (raw: string) => factory({ updateState, showAlert, appendManualAdjustmentJournal, createClientTransaction, raw });
  return { execute, state: () => state, showAlert, appendManualAdjustmentJournal };
};

const event = () => ({ preventDefault: vi.fn() });

describe('manual numeric input safety', () => {
  it.each(['', '0', '1.5', 'Infinity', 'NaN', '9007199254740992', '-9007199254740992'])('rejects nonzero-unsafe-integer delta %s', raw => {
    expect(fixture().execute(raw).parseManualDelta(raw)).toBeNull();
  });

  it.each(['4294967296', '1001', '-1001', '1.5'])('rejects Trinket allocation delta %s before updating the campaign', raw => {
    const setup = fixture();
    const before = setup.state();
    setup.execute(raw).handleManualTrinketAdjustment(event());
    expect(setup.state()).toBe(before);
    expect(setup.appendManualAdjustmentJournal).not.toHaveBeenCalled();
  });

  it('adds the exact accepted delta and records it once, without an overall balance cap', () => {
    const setup = fixture({ trinkets: Array(1001).fill('Existing') });
    setup.execute('2').handleManualTrinketAdjustment(event());
    expect(setup.state().trinkets).toHaveLength(1003);
    expect(setup.state().trinkets.slice(-2)).toEqual(['수동 판정 장신구', '수동 판정 장신구']);
    expect(setup.appendManualAdjustmentJournal).toHaveBeenCalledTimes(1);
  });

  it('retains normal removal semantics at zero', () => {
    const setup = fixture();
    setup.execute('-2').handleManualTrinketAdjustment(event());
    expect(setup.state().trinkets).toEqual([]);
  });

  it.each([
    ['handleManualReputationAdjustment', { reputation: Number.MAX_SAFE_INTEGER }],
    ['handleManualForagingPointsAdjustment', { activeAilment: { foragingPoints: Number.MAX_SAFE_INTEGER } }],
    ['handleManualBagAdjustment', { bag: [{ id: 'bag:qa', name: 'Reagent', type: 'reagent', qty: Number.MAX_SAFE_INTEGER }] }]
  ])('rejects overflow after a valid delta in %s without saving a rounded result', (name, overrides) => {
    const setup = fixture(overrides as Record<string, unknown>);
    const before = setup.state();
    setup.execute('2')[name as string](event());
    expect(setup.state()).toBe(before);
    expect(setup.showAlert).toHaveBeenCalledOnce();
    expect(setup.appendManualAdjustmentJournal).not.toHaveBeenCalled();
  });
});
