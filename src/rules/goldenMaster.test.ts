// @ts-expect-error Golden Master tests run in Node while the app build intentionally exposes browser types only.
import { readFileSync, writeFileSync } from 'node:fs';
// @ts-expect-error Golden Master tests run in Node while the app build intentionally exposes browser types only.
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PRINTED_EFFECT_REGISTRY, classifyPrintedEffect } from './printedEffects';
import { migrateSavedRulesState } from './migrations';
import { CURRENT_SCHEMA_VERSION } from './state';
import { GOLDEN_MIGRATION_FIXTURES, GOLDEN_SAVE_FIXTURES } from './fixtures/goldenSaves';

const rootFile = (name: string) => fileURLToPath(new URL(`../../${name}`, import.meta.url));
const fixtureFile = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const intentionalEvidence = new Set(['CORE-001', 'CHARACTER-003', 'CHARACTER-004', 'PATIENT-005', 'CLINIC-004', 'SERVICE-004', 'TABLE-006', 'SAVE-001', 'SAVE-006', 'SAVE-007', 'OFFLINE-003', 'UX-002']);
const intentionalNarrative = new Set(['CORE-002', 'CORE-003', 'CORE-004', 'CHARACTER-001', 'CHARACTER-007', 'TRAVEL-009', 'AILMENT-003', 'AILMENT-007', 'REMEDY-008', 'FORAGE-006', 'ALMANACK-003']);
const intentionalAmbiguous = new Set(['DOWNTIME-007']);

const buildRuleSnapshot = () => readFileSync(rootFile('RULE_TRACEABILITY.md'), 'utf8')
  .split('\n')
  .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
  .filter(cells => /^[A-Z][A-Z0-9-]+$/.test(cells[0] || '') && (cells[5] === 'Exact' || cells[5] === 'Partial'))
  .map(cells => ({
    id: cells[0],
    sourcePage: cells[1],
    executor: cells[4].replaceAll('`', ''),
    status: cells[5],
    classification: cells[5] === 'Exact'
      ? 'exact'
      : intentionalEvidence.has(cells[0])
        ? 'intentional-evidence-limit'
        : intentionalNarrative.has(cells[0])
          ? 'intentional-narrative'
          : intentionalAmbiguous.has(cells[0])
            ? 'intentional-ambiguous'
            : 'unclassified-partial'
  }))
  .sort((left, right) => left.id.localeCompare(right.id));

const buildPrintedEffectSnapshot = () => PRINTED_EFFECT_REGISTRY
  .map(effect => ({
    id: effect.id,
    ownerId: effect.ownerId,
    sourcePage: effect.sourcePage,
    status: effect.status,
    classification: classifyPrintedEffect(effect),
    executor: effect.executor,
    ruleIds: [...effect.ruleIds].sort(),
    triggers: [...effect.supportedTriggers].sort()
  }))
  .sort((left, right) => left.id.localeCompare(right.id));

const updateSnapshots = (globalThis as any).process?.env?.UPDATE_GOLDEN_MASTER_SNAPSHOTS === '1';
const currentRuleSnapshot = buildRuleSnapshot();
const currentPrintedEffectSnapshot = buildPrintedEffectSnapshot();

if (updateSnapshots) {
  writeFileSync(fixtureFile('rule-registry.snapshot.json'), `${JSON.stringify(currentRuleSnapshot, null, 2)}\n`);
  writeFileSync(fixtureFile('printed-effects.snapshot.json'), `${JSON.stringify(currentPrintedEffectSnapshot, null, 2)}\n`);
}

const frozenRuleSnapshot = JSON.parse(readFileSync(fixtureFile('rule-registry.snapshot.json'), 'utf8'));
const frozenPrintedEffectSnapshot = JSON.parse(readFileSync(fixtureFile('printed-effects.snapshot.json'), 'utf8'));

describe('v1.0.0 Golden Master regression contract', () => {
  it('[SAVE-001] preserves every synthetic campaign fixture at the current schema', () => {
    expect(Object.keys(GOLDEN_SAVE_FIXTURES).sort()).toEqual([
      'activeBarrow', 'activeJourney', 'activePatient', 'archiveHeavy', 'clinicAndService', 'freshCampaign',
      'midDowntime', 'pendingManualResolution', 'postSeason', 'toolAndUpgrade', 'wagonAndCompanion'
    ]);

    for (const [name, fixture] of Object.entries(GOLDEN_SAVE_FIXTURES)) {
      const migrated = migrateSavedRulesState(clone(fixture));
      expect(migrated.schemaVersion, name).toBe(CURRENT_SCHEMA_VERSION);
      expect(migrated.rulesetId, name).toBe('original-1e-3p');
      expect(migrated.rulebookEdition, name).toBe('first-edition-third-printing-may-2023');
    }

    expect(GOLDEN_SAVE_FIXTURES.activeJourney.journey).toBeTruthy();
    expect(GOLDEN_SAVE_FIXTURES.activePatient.activePatientId).toBe('golden-patient');
    expect(GOLDEN_SAVE_FIXTURES.pendingManualResolution.pendingManualEffect).toBeTruthy();
    expect(GOLDEN_SAVE_FIXTURES.activeBarrow.activeDelve).toBeTruthy();
    expect(GOLDEN_SAVE_FIXTURES.toolAndUpgrade.toolStates).toHaveLength(1);
    expect(GOLDEN_SAVE_FIXTURES.wagonAndCompanion.wagonState).toBeTruthy();
    expect(GOLDEN_SAVE_FIXTURES.clinicAndService.pendingServices).toHaveLength(1);
    expect(GOLDEN_SAVE_FIXTURES.archiveHeavy.patientArchive).toHaveLength(12);
  });

  it('[SAVE-001/SAVE-005] migrates preserved v6, v7, v8, and final release fixtures', () => {
    const migrated = Object.fromEntries(Object.entries(GOLDEN_MIGRATION_FIXTURES).map(([name, fixture]) => [name, migrateSavedRulesState(clone(fixture))]));
    expect(Object.values(migrated).every(save => save.schemaVersion === CURRENT_SCHEMA_VERSION)).toBe(true);
    expect(migrated.schemaV6.manualEffectQueue).toHaveLength(1);
    expect(migrated.schemaV7.activeDelve).toMatchObject({ delveId: 'uneasy-sleep', barrowId: 'golden-barrow' });
    expect(migrated.schemaV7.toolStates).toEqual(expect.arrayContaining([expect.objectContaining({ instanceId: 'golden-tool', toolId: 'mortar-and-pestle' })]));
    expect(migrated.schemaV8.saveRevision).toBe(8);
    expect(migrated.finalReleaseSchema.appliedTransactionIds).toContain('golden-final-release');
  });

  it('freezes Rule IDs, status, source page, executor, and intentional classification', () => {
    expect(currentRuleSnapshot).toEqual(frozenRuleSnapshot);
    expect(currentRuleSnapshot).toHaveLength(141);
    expect(currentRuleSnapshot.filter(rule => rule.status === 'Exact')).toHaveLength(117);
    expect(currentRuleSnapshot.filter(rule => rule.status === 'Partial')).toHaveLength(24);
    expect(currentRuleSnapshot.filter(rule => rule.classification === 'unclassified-partial')).toHaveLength(0);
  });

  it('freezes all 358 Printed Effect identities and execution classifications', () => {
    expect(currentPrintedEffectSnapshot).toEqual(frozenPrintedEffectSnapshot);
    expect(currentPrintedEffectSnapshot).toHaveLength(358);
    expect(new Set(currentPrintedEffectSnapshot.map(effect => effect.id)).size).toBe(358);
    expect(new Set(currentPrintedEffectSnapshot.map(effect => effect.ownerId)).size).toBe(358);
    expect(currentPrintedEffectSnapshot.filter(effect => effect.status === 'implemented')).toHaveLength(46);
    expect(currentPrintedEffectSnapshot.filter(effect => effect.status === 'manual')).toHaveLength(312);
    expect(currentPrintedEffectSnapshot.every(effect => effect.sourcePage >= 6 && effect.sourcePage <= 213)).toBe(true);
    expect(currentPrintedEffectSnapshot.every(effect => effect.executor && effect.ruleIds.length > 0 && effect.triggers.length > 0)).toBe(true);
  });
});
