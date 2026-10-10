// @ts-expect-error Node is used only by Vitest to execute the actual App guard.
import { readFileSync } from 'node:fs';
// @ts-expect-error Node is used only by Vitest to execute the actual App guard.
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import * as ts from 'typescript';

const source = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const start = source.indexOf('  const handleDiagnoseAilment = async');
const end = source.indexOf('    if (patientCreationPending.current)', start);
const actualGuard = ts.transpileModule(`${source.slice(start, end)} return 'continue'; };`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;

const runGuard = async (overrides: Record<string, unknown>) => {
  const state = { currentLocationName: 'Forest clearing', activePatientId: null, patients: [], barrows: [], activeDelve: null, ...overrides };
  const showAlert = vi.fn();
  const preventDefault = vi.fn();
  const handler = new Function('state', 'showAlert', `${actualGuard} return handleDiagnoseAilment;`)(state, showAlert);
  return { result: await handler({ preventDefault }), showAlert, preventDefault };
};

describe('p.116 Barrow replaces ordinary patient intake', () => {
  it('blocks an ordinary intake while a Delve is active', async () => {
    const result = await runGuard({ activeDelve: { delveId: 'uneasy-sleep' } });
    expect(result.result).toBeUndefined();
    expect(result.showAlert).toHaveBeenCalledWith(expect.stringContaining('p.116'));
    expect(result.preventDefault).toHaveBeenCalledOnce();
  });

  it('blocks an ordinary intake at a live Barrow before its challenge', async () => {
    const result = await runGuard({ barrows: [{ locationName: 'Forest clearing', removed: false }] });
    expect(result.result).toBeUndefined();
    expect(result.showAlert).toHaveBeenCalledOnce();
  });

  it.each([
    { barrows: [] },
    { barrows: [{ locationName: 'Elsewhere', removed: false }] },
    { barrows: [{ locationName: 'Forest clearing', removed: true }] }
  ])('preserves ordinary intake outside a live local Barrow: %j', async state => {
    const result = await runGuard(state);
    expect(result.result).toBe('continue');
    expect(result.showAlert).not.toHaveBeenCalled();
  });
});
