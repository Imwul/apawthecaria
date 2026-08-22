import { AILMENTS } from './data/ailments';
import { ENCOUNTERS, FORAGING_ENCOUNTERS, SOCIAL_ENCOUNTERS, TRAVEL_ENCOUNTERS } from './data/encounters';
import { REAGENTS } from './data/reagents';
import { REGIONS } from './data/regions';
import { SEASONS } from './data/seasons';
import { ALMANACK_TOOLS, TOOLS } from './data/tools';
import { BARROW_DELVES } from './data/barrows';
import { CLINIC_AGENDAS } from './data/clinics';
import { COMPANIONS, WAGON_EXPANSIONS } from './data/mobility';
import { GUILD_SERVICES } from './data/services';
import { TOOL_UPGRADES } from './data/upgrades';
import { RULESETS } from './rulesets';
import { PRINTED_EFFECT_REGISTRY } from './printedEffects';
import { RULE_TAGS, TAG_DEFINITIONS } from './tags';
import { RULEBOOK_EDITION, type CanonicalRuleRecord, type RequirementExpression } from './types';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  dataset: string;
  recordId?: string;
  message: string;
}

export interface ValidationReport {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  counts: {
    reagents: number;
    preparations: number;
    ailments: number;
    travelEncounters: number;
    foragingEncounters: number;
    socialEncounters: number;
    regions: number;
    seasons: number;
    tools: number;
    almanackTools: number;
    tags: number;
    printedEffects: number;
    implementedPrintedEffects: number;
    manualPrintedEffects: number;
    completeManualEffects: number;
    barrowDelves: number;
    guildServices: number;
    toolUpgrades: number;
    wagonExpansions: number;
    companions: number;
    clinicAgendas: number;
  };
}

export const findDuplicateIds = (ids: readonly string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  ids.forEach(id => seen.has(id) ? duplicates.add(id) : seen.add(id));
  return [...duplicates].sort();
};

const requirementTags = (requirement: RequirementExpression): string[] => {
  if (requirement.kind === 'tag') return [requirement.tag];
  if (requirement.kind === 'special') return [];
  if (requirement.kind === 'alternatives') return requirement.alternatives.flatMap(requirementTags);
  return requirement.requirements.flatMap(requirementTags);
};

export const validateCanonicalData = (): ValidationReport => {
  const issues: ValidationIssue[] = [];
  const issue = (severity: ValidationSeverity, code: string, dataset: string, message: string, recordId?: string) =>
    issues.push({ severity, code, dataset, recordId, message });
  const duplicateCheck = (dataset: string, ids: readonly string[]) =>
    findDuplicateIds(ids).forEach(id => issue('error', 'DUPLICATE_ID', dataset, `Duplicate ID: ${id}`, id));
  const metadataCheck = (dataset: string, id: string, record: CanonicalRuleRecord) => {
    if (!Number.isInteger(record.sourcePage) || record.sourcePage < 1 || record.sourcePage > 213) {
      issue('error', 'INVALID_PAGE', dataset, `Invalid source page: ${record.sourcePage}`, id);
    }
    if (record.rulebookEdition !== RULEBOOK_EDITION || record.source.edition !== RULEBOOK_EDITION) {
      issue('error', 'INVALID_EDITION', dataset, 'Edition metadata does not match the canonical rulebook.', id);
    }
    if (record.source.kind !== 'rulebook' || record.source.page !== record.sourcePage) {
      issue('error', 'INVALID_SOURCE', dataset, 'Source metadata does not match sourcePage.', id);
    }
  };

  const preparations = REAGENTS.flatMap(reagent => reagent.preparations);
  duplicateCheck('Reagents', REAGENTS.map(row => row.id));
  duplicateCheck('Preparations', preparations.map(row => row.id));
  duplicateCheck('Ailments', AILMENTS.map(row => row.id));
  duplicateCheck('Encounters', ENCOUNTERS.map(row => row.id));
  duplicateCheck('Encounter Keys', ENCOUNTERS.map(row => [
    row.encounterType,
    row.region,
    row.locationType || '',
    row.city || '',
    row.season || '',
    row.suit || '',
    row.cardKey || ''
  ].join('|')));
  duplicateCheck('Regions', REGIONS.map(row => row.id));
  duplicateCheck('Seasons', SEASONS.map(row => row.id));
  duplicateCheck('Tools', TOOLS.map(row => row.id));
  duplicateCheck('Tags', TAG_DEFINITIONS.map(row => row.id));
  duplicateCheck('Printed Effects', PRINTED_EFFECT_REGISTRY.map(row => row.id));
  duplicateCheck('Printed Effect Owners', PRINTED_EFFECT_REGISTRY.map(row => `${row.ownerType}:${row.ownerId}`));
  duplicateCheck('Barrow Delves', BARROW_DELVES.map(row => row.id));
  duplicateCheck('Guild Services', GUILD_SERVICES.map(row => row.id));
  duplicateCheck('Tool Upgrades', TOOL_UPGRADES.map(row => row.id));
  duplicateCheck('Wagon Expansions', WAGON_EXPANSIONS.map(row => row.id));
  duplicateCheck('Companions', COMPANIONS.map(row => row.id));
  duplicateCheck('Clinic Agendas', CLINIC_AGENDAS.map(row => row.id));

  const tagIds = new Set(RULE_TAGS);
  const regionIds = new Set(REGIONS.map(row => row.id));
  const seasonIds = new Set(SEASONS.map(row => row.id));
  const toolIds = new Set(TOOLS.map(row => row.id));

  REAGENTS.forEach(reagent => {
    metadataCheck('Reagents', reagent.id, reagent);
    if (reagent.preparations.length === 0) issue('error', 'MISSING_PREPARATION', 'Reagents', 'Reagent has no preparation.', reagent.id);
    Object.keys(reagent.regionAvailability).forEach(region => {
      if (!regionIds.has(region as never)) issue('error', 'INVALID_REGION_REFERENCE', 'Reagents', `Unknown region: ${region}`, reagent.id);
    });
    Object.keys(reagent.seasonAvailability).forEach(season => {
      if (!seasonIds.has(season as never)) issue('error', 'INVALID_SEASON', 'Reagents', `Unknown season: ${season}`, reagent.id);
    });
    reagent.preparations.forEach(preparation => {
      metadataCheck('Preparations', preparation.id, preparation);
      if (!preparation.name || !preparation.method || preparation.weight <= 0 || preparation.uses <= 0) {
        issue('error', 'INVALID_PREPARATION', 'Preparations', 'Preparation is missing method, weight, or uses.', preparation.id);
      }
      preparation.requiredTools.forEach(toolId => {
        if (toolId !== 'none' && !toolIds.has(toolId)) {
          issue('error', 'INVALID_TOOL_REFERENCE', 'Preparations', `Unknown tool: ${toolId}`, preparation.id);
        }
      });
      preparation.tags.forEach(tag => {
        if (!tagIds.has(tag.tag)) issue('error', 'INVALID_TAG', 'Preparations', `Unknown tag: ${tag.tag}`, preparation.id);
        if (!Number.isInteger(tag.value) || tag.value <= 0) issue('error', 'INVALID_TAG_VALUE', 'Preparations', `Invalid ${tag.tag} value: ${tag.value}`, preparation.id);
      });
    });
  });

  const expectedSeverity = { lesser: 12, intermediate: 11, severe: 11, dire: 11 } as const;
  AILMENTS.forEach(ailment => {
    metadataCheck('Ailments', ailment.id, ailment);
    if (!(ailment.severity in expectedSeverity)) issue('error', 'INVALID_SEVERITY', 'Ailments', `Unknown severity: ${ailment.severity}`, ailment.id);
    if (!Number.isInteger(ailment.timer) || ailment.timer <= 0) issue('error', 'INVALID_TIMER', 'Ailments', `Invalid timer: ${ailment.timer}`, ailment.id);
    requirementTags(ailment.requirements).forEach(tag => {
      if (!tagIds.has(tag as never)) issue('error', 'INVALID_TAG', 'Ailments', `Unknown requirement tag: ${tag}`, ailment.id);
    });
    if (ailment.allowsMultiple !== Boolean(ailment.repeatCount)) {
      issue('error', 'INVALID_MULTIPLE_AILMENT', 'Ailments', 'allowsMultiple and repeatCount disagree.', ailment.id);
    }
  });
  Object.entries(expectedSeverity).forEach(([severity, expected]) => {
    const actual = AILMENTS.filter(ailment => ailment.severity === severity).length;
    if (actual !== expected) issue('error', 'INVALID_SEVERITY_COUNT', 'Ailments', `${severity}: expected ${expected}, found ${actual}`);
  });

  const travelKeys = new Set(['A&2', '3&4', '5&6', '7&8', '9&10', 'J', 'M']);
  const foragingKeys = new Set(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'M']);
  const suits = new Set(['♥', '♦', '♣', '♠']);
  ENCOUNTERS.forEach(encounter => {
    metadataCheck('Encounters', encounter.id, encounter);
    if (!regionIds.has(encounter.region)) issue('error', 'INVALID_REGION_REFERENCE', 'Encounters', `Unknown region: ${encounter.region}`, encounter.id);
    if (encounter.season && !seasonIds.has(encounter.season)) issue('error', 'INVALID_SEASON', 'Encounters', `Unknown season: ${encounter.season}`, encounter.id);
    if (encounter.encounterType === 'travel' && !travelKeys.has(encounter.cardKey || '')) issue('error', 'INVALID_CARD_RANGE', 'Encounters', `Invalid travel key: ${encounter.cardKey}`, encounter.id);
    if (encounter.encounterType === 'foraging' && !foragingKeys.has(encounter.cardKey || '')) issue('error', 'INVALID_CARD_RANGE', 'Encounters', `Invalid foraging key: ${encounter.cardKey}`, encounter.id);
    if (encounter.encounterType === 'social' && !suits.has(encounter.suit || '')) issue('error', 'INVALID_CARD_RANGE', 'Encounters', `Invalid social suit: ${encounter.suit}`, encounter.id);
    if (encounter.isTitan !== (encounter.region === 'Titan')) issue('error', 'INVALID_TITAN_FLAG', 'Encounters', 'isTitan does not match the canonical region.', encounter.id);
    if (encounter.isSettlement !== (encounter.locationType === 'Settlement')) issue('error', 'INVALID_SETTLEMENT_FLAG', 'Encounters', 'isSettlement does not match locationType.', encounter.id);
    if (encounter.prompt.includes('remains manual until') || encounter.prompt.includes('source row is indexed')) {
      issue('warning', 'MANUAL_ENCOUNTER_TEXT', 'Encounters', 'Encounter index exists, but this row still delegates to the printed page.', encounter.id);
    }
  });

  const encounterIds = new Set(ENCOUNTERS.map(row => row.id));
  const ailmentIds = new Set(AILMENTS.map(row => row.id));
  PRINTED_EFFECT_REGISTRY.forEach(effect => {
    if (!Number.isInteger(effect.sourcePage) || effect.sourcePage < 1 || effect.sourcePage > 213) {
      issue('error', 'INVALID_PAGE', 'Printed Effects', `Invalid source page: ${effect.sourcePage}`, effect.id);
    }
    if (!effect.executor.trim()) issue('error', 'MISSING_EXECUTOR', 'Printed Effects', 'Printed effect has no executor.', effect.id);
    if (!effect.ownerName.trim()) issue('error', 'MISSING_OWNER_NAME', 'Printed Effects', 'Printed effect has no owner name.', effect.id);
    if (!effect.printedText.trim()) issue('error', 'MISSING_PRINTED_TEXT', 'Printed Effects', 'Printed effect has no faithful printed text.', effect.id);
    const ownerExists = effect.ownerType === 'encounter' ? encounterIds.has(effect.ownerId) : ailmentIds.has(effect.ownerId);
    if (!ownerExists) issue('error', 'INVALID_OWNER_REFERENCE', 'Printed Effects', `Unknown ${effect.ownerType}: ${effect.ownerId}`, effect.id);
    if (effect.ruleIds.length === 0) issue('error', 'MISSING_RULE_ID', 'Printed Effects', 'Printed effect has no traceability Rule ID.', effect.id);
    if (!effect.supportedTriggers.includes(effect.trigger)) issue('error', 'INVALID_EFFECT_TRIGGER', 'Printed Effects', 'Primary trigger is not included in supportedTriggers.', effect.id);
    if (effect.status === 'manual' && !effect.manualResolution) {
      issue('error', 'MISSING_MANUAL_RESOLUTION', 'Printed Effects', 'Manual effect must explain the decision and follow-up state.', effect.id);
    }
    if (effect.status === 'manual') effect.supportedTriggers.forEach(trigger => {
      const metadata = effect.manualResolutionByTrigger[trigger];
      if (!effect.triggerText[trigger]?.trim()) issue('error', 'MISSING_TRIGGER_TEXT', 'Printed Effects', `Missing printed text for ${trigger}.`, effect.id);
      if (!metadata) {
        issue('error', 'MISSING_TRIGGER_RESOLUTION', 'Printed Effects', `Missing resolution metadata for ${trigger}.`, effect.id);
        return;
      }
      if (!metadata.reason.trim() || !metadata.decision.trim() || !metadata.journalInstruction.trim()) {
        issue('error', 'INCOMPLETE_MANUAL_RESOLUTION', 'Printed Effects', `${trigger} lacks reason, decision, or journal instruction.`, effect.id);
      }
      if (metadata.inputFields.length === 0) issue('error', 'MISSING_MANUAL_INPUT', 'Printed Effects', `${trigger} has no effect-specific input.`, effect.id);
      if (findDuplicateIds(metadata.inputFields.map(field => field.id)).length > 0) issue('error', 'DUPLICATE_MANUAL_INPUT', 'Printed Effects', `${trigger} has duplicate input IDs.`, effect.id);
      if (findDuplicateIds(metadata.actionTemplates.map(action => action.id)).length > 0) issue('error', 'DUPLICATE_MANUAL_ACTION', 'Printed Effects', `${trigger} has duplicate action IDs.`, effect.id);
      if (metadata.actionTemplates.some(action => !action.label.trim() || !action.sourceText.trim())) {
        issue('error', 'INCOMPLETE_MANUAL_ACTION', 'Printed Effects', `${trigger} has an action without a label or source sentence.`, effect.id);
      }
      if (/^resolve this effect manually\.?$/i.test(metadata.decision.trim())) {
        issue('error', 'GENERIC_MANUAL_PROMPT', 'Printed Effects', `${trigger} uses a generic placeholder prompt.`, effect.id);
      }
    });
  });

  const phase4Rows: Array<[string, readonly CanonicalRuleRecord[]]> = [
    ['Barrow Delves', BARROW_DELVES],
    ['Guild Services', GUILD_SERVICES],
    ['Tool Upgrades', TOOL_UPGRADES],
    ['Wagon Expansions', WAGON_EXPANSIONS],
    ['Companions', COMPANIONS],
    ['Clinic Agendas', CLINIC_AGENDAS]
  ];
  phase4Rows.forEach(([dataset, rows]) => rows.forEach((row, index) => metadataCheck(dataset, `${dataset}-${index + 1}`, row)));
  TOOL_UPGRADES.forEach(row => {
    if (!toolIds.has(row.baseToolId)) issue('error', 'INVALID_TOOL_REFERENCE', 'Tool Upgrades', `Unknown base Tool: ${row.baseToolId}`, row.id);
  });
  COMPANIONS.forEach(row => row.regions.forEach(region => {
    if (!regionIds.has(region)) issue('error', 'INVALID_REGION_REFERENCE', 'Companions', `Unknown Region: ${region}`, row.id);
  }));

  const expectedCounts: Array<[string, number, number]> = [
    ['Reagents', REAGENTS.length, 83],
    ['Ailments', AILMENTS.length, 45],
    ['Travel Encounters', TRAVEL_ENCOUNTERS.length, 103],
    ['Foraging Encounters', FORAGING_ENCOUNTERS.length, 144],
    ['Social Encounters', SOCIAL_ENCOUNTERS.length, 66],
    ['Regions', REGIONS.length, 7],
    ['Tools', TOOLS.length, 23],
    ['Almanack Tools', ALMANACK_TOOLS.length, 18],
    ['Seasons', SEASONS.length, 4],
    ['Tags', TAG_DEFINITIONS.length, 22],
    ['Printed Effects', PRINTED_EFFECT_REGISTRY.length, ENCOUNTERS.length + AILMENTS.length]
    ,['Implemented Printed Effects', PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'implemented').length, 16]
    ,['Manual Printed Effects', PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'manual').length, 342]
    ,['Barrow Delves', BARROW_DELVES.length, 8]
    ,['Guild Services', GUILD_SERVICES.length, 17]
    ,['Tool Upgrades', TOOL_UPGRADES.length, 7]
    ,['Wagon Expansions', WAGON_EXPANSIONS.length, 10]
    ,['Companions', COMPANIONS.length, 9]
    ,['Clinic Agendas', CLINIC_AGENDAS.length, 10]
  ];
  expectedCounts.forEach(([dataset, actual, expected]) => {
    if (actual !== expected) issue('error', 'INVALID_COUNT', dataset, `Expected ${expected}, found ${actual}`);
  });
  if (!TOOLS.some(entry => entry.id === 'titan-thingamabob')) issue('error', 'MISSING_TOOL', 'Tools', 'Titan Thingamabob is missing.');
  if (!Object.values(RULESETS['original-1e-3p'].houseRules).every(value => value === false)) {
    issue('error', 'INVALID_RULESET', 'Rulesets', 'The original ruleset enables a house rule.');
  }

  return {
    errors: issues.filter(entry => entry.severity === 'error'),
    warnings: issues.filter(entry => entry.severity === 'warning'),
    counts: {
      reagents: REAGENTS.length,
      preparations: preparations.length,
      ailments: AILMENTS.length,
      travelEncounters: TRAVEL_ENCOUNTERS.length,
      foragingEncounters: FORAGING_ENCOUNTERS.length,
      socialEncounters: SOCIAL_ENCOUNTERS.length,
      regions: REGIONS.length,
      seasons: SEASONS.length,
      tools: TOOLS.length,
      almanackTools: ALMANACK_TOOLS.length,
      tags: TAG_DEFINITIONS.length,
      printedEffects: PRINTED_EFFECT_REGISTRY.length
      ,implementedPrintedEffects: PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'implemented').length
      ,manualPrintedEffects: PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'manual').length
      ,completeManualEffects: PRINTED_EFFECT_REGISTRY.filter(row => row.status === 'manual' && row.supportedTriggers.every(trigger => Boolean(row.manualResolutionByTrigger[trigger]))).length
      ,barrowDelves: BARROW_DELVES.length
      ,guildServices: GUILD_SERVICES.length
      ,toolUpgrades: TOOL_UPGRADES.length
      ,wagonExpansions: WAGON_EXPANSIONS.length
      ,companions: COMPANIONS.length
      ,clinicAgendas: CLINIC_AGENDAS.length
    }
  };
};

export const formatValidationIssues = (issues: readonly ValidationIssue[]): string =>
  issues.map(issue => `[${issue.code}] ${issue.dataset}${issue.recordId ? `/${issue.recordId}` : ''}: ${issue.message}`).join('\n');
