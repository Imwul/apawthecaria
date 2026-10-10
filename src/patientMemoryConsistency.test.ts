// @ts-expect-error Node is used only by Vitest to execute the actual display projection.
import { readFileSync } from 'node:fs';
// @ts-expect-error Node is used only by Vitest to execute the actual display projection.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { AILMENTS } from './rules/data/ailments';

const source = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const start = source.indexOf('const normalizeCaseRecord =');
const end = source.indexOf('const legacyCaseRecordsFromJournals =', start);
const actualProjection = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;
const memories = new Function('AILMENTS', `${actualProjection} return resolvedPatientMemories;`)(AILMENTS);

const fixture = () => ({
  patients: [{ id: 'patient:qa', species: 'Bird' }],
  patientArchive: [{
    caseId: 'case:qa', patientId: 'patient:qa', patientName: 'QA patient',
    status: 'treated', ailments: [{ ailmentId: 'ailment-monthly-chore' }],
    location: 'Forest clearing', encounteredAt: 1, treatedAt: 3
  }],
  patientCasebook: [] as any[]
});

describe('completed patient memories across current and legacy saves', () => {
  it('shows the real canonical treatment rather than an empty legacy-only shelf', () => {
    expect(memories(fixture())[0]).toMatchObject({
      id: 'case:qa', patientName: 'QA patient', species: 'Bird',
      ailmentName: AILMENTS.find(ailment => ailment.id === 'ailment-monthly-chore')!.displayName,
      locationName: 'Forest clearing', outcome: 'success', timestamp: 3
    });
  });

  it('keeps unresolved intake records out of completed memories', () => {
    const state = fixture();
    state.patientArchive[0].status = 'active';
    expect(memories(state)).toEqual([]);
  });

  it('preserves legacy notes and bookmarks while ordering both sources by their recorded times', () => {
    const state = fixture();
    const legacy = { id: 'legacy:qa', timestamp: 4, finalArchiveNote: 'Old memory', isBookmarked: true, outcome: 'success' };
    state.patientCasebook.push(legacy);
    expect(memories(state)).toHaveLength(2);
    expect(memories(state)[0]).toBe(legacy);
  });

  it('projects a failed case without changing saved records or inventing a resolution day', () => {
    const state = fixture();
    state.patientArchive[0].status = 'failed';
    const before = JSON.stringify(state);
    expect(memories(state)[0]).toMatchObject({ outcome: 'failure', resolvedAtDay: 0 });
    expect(JSON.stringify(state)).toBe(before);
  });
});
