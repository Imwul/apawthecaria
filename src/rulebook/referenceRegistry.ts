import {
  AILMENTS,
  BARROW_DELVES,
  CLINIC_AGENDAS,
  COMPANIONS,
  ENCOUNTERS,
  FORAGING_ENCOUNTERS,
  GUILD_SERVICES,
  PRINTED_EFFECT_REGISTRY,
  REAGENTS,
  REGIONS,
  SEASONS,
  SOCIAL_ENCOUNTERS,
  TAG_DEFINITIONS,
  TOOLS,
  TOOL_REFERENCE_EFFECTS,
  TOOL_UPGRADES,
  TRAVEL_ENCOUNTERS,
  WAGON_EXPANSIONS,
  classifyPrintedEffect,
  type RequirementExpression,
  type RuleEffect,
  type StructuredRuleEffect
} from '../rules';
import { normalizeCanonicalGuildReputationTerms } from '../localization/guildReputation';
import { RULEBOOK_CHAPTERS } from './chapters';
import type { RulebookReferenceEntry, RulebookReferenceKind } from './types';

const detail = (label: string, value: unknown) => ({ label, value: String(value) });
const compact = (value: string) => value.replace(/\s+/g, ' ').trim();
const unique = <T,>(values: T[]) => [...new Set(values)];

const requirementText = (requirement: RequirementExpression): string => {
  if (requirement.kind === 'tag') return `${requirement.tag} ${requirement.threshold}`;
  if (requirement.kind === 'special') return requirement.description;
  if (requirement.kind === 'allOf') return requirement.requirements.map(requirementText).join(' + ');
  if (requirement.kind === 'anyOf') return `다음 중 하나: ${requirement.requirements.map(requirementText).join(' / ')}`;
  return requirement.alternatives.map(requirementText).join(' 또는 ');
};

const ruleEffectText = (effect: RuleEffect): string => {
  if (effect.type === 'modifyReputation') return `Reputation ${effect.amount >= 0 ? '+' : ''}${effect.amount}`;
  if (effect.type === 'modifyTrinkets') return `Trinkets ${effect.amount >= 0 ? '+' : ''}${effect.amount}`;
  if (effect.type === 'markDays') return `Calendar +${effect.amount} Days`;
  if (effect.type === 'modifyForagingPoints') return `Foraging Points ${effect.amount >= 0 ? '+' : ''}${effect.amount}`;
  if (effect.type === 'modifyTimer') return `${effect.target} Timer ${effect.amount >= 0 ? '+' : ''}${effect.amount}`;
  if (effect.type === 'addItem') return `${effect.itemId} +${effect.quantity}`;
  if (effect.type === 'removeItem') return `${effect.itemId} -${effect.quantity}`;
  if (effect.type === 'blockMovement' || effect.type === 'requireLocalHelp') return effect.reason;
  if (effect.type === 'requireChoice') return `선택: ${effect.choiceIds.join(', ')}`;
  if (effect.type === 'addCondition') return `Condition: ${effect.conditionId}`;
  if (effect.type === 'unlockEntry') return `Unlock: ${effect.entryId}`;
  return effect.description;
};

const structuredEffectsText = (effects: StructuredRuleEffect[]) => effects.length
  ? effects.map(row => `${({ implemented: '앱에서 자동 적용', 'structured-but-not-executed': '플레이어가 직접 적용', 'manual-only': '플레이어가 직접 판정', ambiguous: '원문 확인 필요' } as const)[row.support]}: ${ruleEffectText(row.effect)}`).join(' / ')
  : '없음';

const createEntry = (input: Omit<RulebookReferenceEntry, 'searchText'> & { search?: string[] }): RulebookReferenceEntry => {
  const { search = [], ...entry } = input;
  const canonicalEntry = {
    ...entry,
    title: normalizeCanonicalGuildReputationTerms(entry.title),
    summary: normalizeCanonicalGuildReputationTerms(entry.summary),
    details: entry.details.map(row => ({
      label: normalizeCanonicalGuildReputationTerms(row.label),
      value: normalizeCanonicalGuildReputationTerms(row.value)
    }))
  };
  return {
    ...canonicalEntry,
    searchText: compact([
      entry.id, entry.kind, entry.title, entry.summary, entry.ownerId || '', entry.ruleIds.join(' '),
      entry.details.map(row => `${row.label} ${row.value}`).join(' '),
      canonicalEntry.title, canonicalEntry.summary,
      canonicalEntry.details.map(row => `${row.label} ${row.value}`).join(' '),
      search.join(' '), `p.${entry.sourcePage}`
    ].join(' ')).toLowerCase()
  };
};

const PROCEDURES: RulebookReferenceEntry[] = [
  ['character-setup', 'Character / Apothecary setup', 10, 17, '종, Travel Style, Equipment, Guild, Familiar와 관계를 순서대로 정합니다.', ['CHARACTER-001', 'CHARACTER-002', 'CHARACTER-005']],
  ['journey-start', 'Journey 시작', 18, 21, '목적지, 거리, 방향, 이유, 목표와 Calendar를 정하고 Journey transaction을 시작합니다.', ['JOURNEY-001', 'JOURNEY-002']],
  ['move', 'Move', 22, 25, '현재 Speed만큼 Path를 따라 이동하되 Waterway, Carry, Soar와 도착 가능 조건을 적용합니다.', ['TRAVEL-001', 'TRAVEL-002']],
  ['diagnosis', '환자와 Ailment 진단', 26, 31, '환자 카드, Severity, Ailment, Timer와 필요한 Tag를 확인합니다.', ['PATIENT-001', 'AILMENT-003']],
  ['foraging', 'Foraging', 32, 33, 'Region, Season, Tool, FP, Rarity와 Part 선택을 거쳐 Inventory에 기록합니다.', ['FORAGE-001']],
  ['bartering', 'Bartering', 34, 35, 'FAIR/FOUL, Rarity, Reputation과 거래 선택을 판정합니다.', ['BARTER-001']],
  ['treatment', 'Remedy와 Treatment', 27, 31, 'Preparation, Potency, Tool, FAIR/FOUL과 Requirement를 원자적 transaction으로 판정합니다.', ['TREATMENT-001']],
  ['leave', 'Preparing to Leave', 36, 37, '성공, 실패, 환자 Archive, Timer, Reputation과 Journal을 한 번에 마감합니다.', ['LEAVE-006']],
  ['journey-close', 'Journey 종료', 38, 39, '목표 달성과 결론 선택을 확인하고 보상과 후속 기록을 적용합니다.', ['JOURNEY-006']],
  ['downtime', 'Downtime', 40, 43, 'Journey 뒤 한 번의 Downtime 활동과 계절 경계 효과를 적용합니다.', ['DOWNTIME-001', 'SEASON-001']],
  ['clinic', 'Clinic', 44, 47, 'Clinic을 열고 Agenda 조건을 충족한 action만 사용합니다.', ['CLINIC-001', 'CLINIC-005']],
  ['services', 'Guild Services', 58, 61, '구입, pending lifecycle, 소비 시점과 canonical consumer를 추적합니다.', ['ALMANACK-004', 'SERVICE-001', 'SERVICE-002', 'SERVICE-005']],
  ['tools', 'Tools와 Upgrades', 62, 67, 'Tool effect, trigger, replacement, break/repair와 Upgrade를 공통 resolver로 처리합니다.', ['TOOL-003', 'TOOL-005']],
  ['wagon', 'Wagon', 68, 69, 'Carry, Speed, Waterway, Passenger, Clay Pots와 expansion lifecycle을 적용합니다.', ['WAGON-001', 'WAGON-002', 'WAGON-004']],
  ['companions', 'Companions', 70, 71, '지역 제한, Journey/Encounter/Season trigger, milestone과 reward를 적용합니다.', ['COMPANION-001', 'COMPANION-005']],
  ['soaring', 'Soaring', 72, 73, 'Flightpath, 도착, 고유 조우와 이동 비용을 판정합니다.', ['TRAVEL-002', 'TRAVEL-009']],
  ['barrows', 'Barrow Delve', 116, 125, '진입 조건, class/suit challenge, 선택, 결과와 지도 귀환을 처리합니다.', ['BARROW-001', 'BARROW-007']]
].map(([id, title, sourcePage, endPage, summary, ruleIds]) => createEntry({
  id: `procedure:${id}`,
  kind: 'procedure',
  title: String(title),
  summary: String(summary),
  sourcePage: Number(sourcePage),
  endPage: Number(endPage),
  ruleIds: ruleIds as string[],
  runtimeStatus: 'canonical',
  details: [detail('절차 범위', `p.${sourcePage}-${endPage}`), detail('현재 consumer', 'Canonical resolver / transaction')],
  relatedIds: [`chapter:${id}`]
}));

const TABLE_SPECS: Array<[string, string, number, number, string]> = [
  ['card-values', 'Card Values', 6, 6, 'Card normalizer'],
  ['travel-style', 'Travel Style', 11, 11, 'Character / Travel resolver'],
  ['familiar', 'Familiar Benefits', 14, 17, 'Character / Mobility resolver'],
  ['journey-destination', 'Journey Destination and Goal', 19, 21, 'Journey resolver'],
  ['regions', 'Regions and Movement', 23, 25, 'Travel resolver'],
  ['ailment-severity', 'Ailment Severity', 26, 26, 'Patient resolver'],
  ['reagent-tags', 'Reagent Tags and Potency', 27, 27, 'Treatment resolver'],
  ['foraging', 'Foraging', 32, 33, 'Foraging resolver'],
  ['bartering', 'Bartering', 34, 35, 'Barter resolver'],
  ['leave', 'Preparing to Leave', 36, 37, 'Leave resolver'],
  ['journey-conclusion', 'Journey Conclusion', 38, 39, 'Journey resolver'],
  ['downtime', 'Downtime Actions', 40, 43, 'Downtime / Season resolver'],
  ['clinics', 'Clinic Agendas', 44, 47, 'Clinic resolver'],
  ['guild-services', 'Guild Services', 58, 61, 'Service resolver'],
  ['tools', 'Tools', 62, 65, 'Tool resolver'],
  ['upgrades', 'Tool Upgrades', 66, 67, 'Tool resolver'],
  ['wagons', 'Wagon Expansions', 68, 69, 'Mobility resolver'],
  ['companions', 'Companions', 70, 71, 'Mobility resolver'],
  ...['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Soar', 'Titan'].map((region, index) => [`travel-${region.toLowerCase()}`, `${region} Travel Encounters`, 74 + index * 4, 77 + index * 4, 'Encounter resolver'] as [string, string, number, number, string]),
  ['ailment-lesser', 'Lesser Ailments', 102, 115, 'Patient / Treatment resolver'],
  ['ailment-intermediate', 'Intermediate Ailments', 103, 115, 'Patient / Treatment resolver'],
  ['ailment-severe', 'Severe Ailments', 103, 115, 'Patient / Treatment resolver'],
  ['ailment-dire', 'Dire Ailments', 103, 115, 'Patient / Treatment resolver'],
  ['barrow-index', 'Barrow Delves', 116, 125, 'Barrow resolver'],
  ['reagent-index', 'Reagent Almanack', 126, 151, 'Reagent / Treatment resolver'],
  ...['Bog', 'Forest', 'Loch', 'Meadow', 'Mountain', 'Titan'].map((region, index) => [`forage-${region.toLowerCase()}`, `${region} Foraging Encounters`, 154 + index * 6, 159 + index * 6, 'Encounter resolver'] as [string, string, number, number, string]),
  ['social-bog', 'Bog / Noonhill Social Encounters', 190, 193, 'Encounter resolver'],
  ['social-forest', 'Forest / Odoak Social Encounters', 194, 197, 'Encounter resolver'],
  ['social-loch', 'Loch / Newdam / Vessel Social Encounters', 198, 203, 'Encounter resolver'],
  ['social-meadow', 'Meadow / Summit Social Encounters', 204, 207, 'Encounter resolver'],
  ['social-mountain', 'Mountain / Spoolkeep Social Encounters', 208, 211, 'Encounter resolver'],
  ['social-glasswall', 'Glasswall Social Encounters', 212, 213, 'Encounter resolver']
];

const TABLES = TABLE_SPECS.map(([id, title, sourcePage, endPage, consumer]) => createEntry({
  id: `table:${id}`, kind: 'table', title, summary: `${title} 원문 표와 현재 runtime consumer.`, sourcePage, endPage,
  ruleIds: [], runtimeStatus: 'reference-only', details: [detail('현재 consumer', consumer), detail('범위', `p.${sourcePage}${endPage !== sourcePage ? `-${endPage}` : ''}`)], relatedIds: []
}));

const ENCOUNTER_ENTRIES = ENCOUNTERS.map(row => {
  const effect = PRINTED_EFFECT_REGISTRY.find(candidate => candidate.ownerId === row.id);
  const runtimeStatus = effect
    ? classifyPrintedEffect(effect) === 'deterministic' ? 'automatic' : classifyPrintedEffect(effect) === 'ambiguous' ? 'ambiguous' : 'manual'
    : 'manual';
  return createEntry({
    id: `encounter:${row.id}`, kind: 'encounter', title: effect?.ownerName || row.title, summary: compact(row.prompt), sourcePage: row.sourcePage,
    ownerId: row.id, ruleIds: effect?.ruleIds || [], runtimeStatus,
    details: [
      detail('분류', row.encounterType), detail('지역', row.region), detail('카드', row.cardKey || row.suit || '원문 참조'),
      detail('계절', row.season || 'Any Season'), detail('장소', row.city || row.locationType || (row.isSettlement ? 'Settlement' : 'Wild')),
      detail('Canonical consumer', effect?.executor || 'resolveEncounter')
    ],
    relatedIds: [`printed-effect:${effect?.id || row.id}`, `region:${row.region}`, ...(row.season ? [`season:${row.season}`] : [])],
    search: [row.city || '', row.locationType || '', row.cardKey || '', row.suit || '', effect?.printedText || '']
  });
});

const AILMENT_ENTRIES = AILMENTS.map(row => {
  const effect = PRINTED_EFFECT_REGISTRY.find(candidate => candidate.ownerId === row.id);
  const requirement = requirementText(row.requirements);
  const tags = unique([...requirement.matchAll(/\b[A-Z]{3,}\b/g)].map(match => match[0])).filter(tag => TAG_DEFINITIONS.some(row => row.id === tag));
  return createEntry({
    id: `ailment:${row.id}`, kind: 'ailment', title: row.displayName || row.canonicalName, summary: `${row.severity} · Timer ${row.timer} · ${requirement}`,
    sourcePage: row.sourcePage, ownerId: row.id, ruleIds: effect?.ruleIds || [], runtimeStatus: effect?.status === 'implemented' ? 'automatic' : 'manual',
    details: [
      detail('Canonical name', row.canonicalName), detail('Severity', row.severity), detail('Timer', row.timer), detail('Requirement', requirement),
      detail('복수 Ailment', row.allowsMultiple ? `가능${row.repeatCount ? ` · ${row.repeatCount}회` : ''}` : '아님'),
      detail('성공', structuredEffectsText(row.successEffects)), detail('실패', structuredEffectsText(row.failureEffects)), detail('특수 규칙', structuredEffectsText(row.specialRules)),
      detail('Canonical handling', effect?.executor || 'resolvePatient / resolveTreatment')
    ],
    relatedIds: [`printed-effect:${effect?.id || row.id}`, 'procedure:treatment', ...tags.map(tag => `tag:${tag}`)],
    search: [row.canonicalName, requirement, effect?.printedText || '']
  });
});

const PRINTED_EFFECT_ENTRIES = PRINTED_EFFECT_REGISTRY.map(row => {
  const classification = classifyPrintedEffect(row);
  const manual = row.manualResolution;
  return createEntry({
    id: `printed-effect:${row.id}`, kind: 'printed-effect', title: row.ownerName, summary: compact(row.printedText), sourcePage: row.sourcePage,
    ownerId: row.ownerId, ruleIds: row.ruleIds, runtimeStatus: row.status === 'implemented' ? 'automatic' : classification === 'ambiguous' ? 'ambiguous' : 'manual',
    details: [
      detail('Canonical ID', row.id), detail('Owner', row.ownerId), detail('Trigger', row.supportedTriggers.join(', ')), detail('분류', classification),
      detail('상태', row.status), detail('필요한 결정', manual?.decision || '자동 처리'), detail('선택', manual?.choices.join(' / ') || '없음'),
      detail('입력', manual?.inputFields.map(field => `${field.label}${field.required ? ' *' : ''}`).join(' / ') || '없음'),
      detail('상태 변화', manual?.actionTemplates.map(action => action.label).join(' / ') || row.mandatoryEffects.map(change => change.operation).join(' / ') || '서사 기록'),
      detail('후속', manual?.followUpRequirements.join(' / ') || row.followUpState || '없음'), detail('Transaction', row.executor)
    ],
    relatedIds: [`${row.ownerType}:${row.ownerId}`],
    search: [row.printedText, manual?.reason || '', manual?.decision || '', manual?.choices.join(' ') || '', manual?.followUpRequirements.join(' ') || '']
  });
});

const INGREDIENT_ENTRIES = REAGENTS.map(row => createEntry({
  id: `ingredient:${row.id}`, kind: 'ingredient', title: row.displayName || row.canonicalName, summary: row.description,
  sourcePage: row.sourcePage, ownerId: row.id, ruleIds: [], runtimeStatus: 'canonical',
  details: [detail('Canonical name', row.canonicalName), detail('Type', row.type), detail('Base Rarity', row.baseRarity), detail('Preparation', `${row.preparations.length}개`), detail('Region', Object.entries(row.regionAvailability).map(([id, value]) => `${id}: ${value}`).join(' / ')), detail('Season', Object.entries(row.seasonAvailability).map(([id, value]) => `${id}: ${value}`).join(' / '))],
  relatedIds: [
    ...row.preparations.map(preparation => `remedy:${preparation.id}`),
    ...Object.entries(row.regionAvailability).filter(([, value]) => value !== 'Unavailable').map(([id]) => `region:${id}`),
    ...Object.entries(row.seasonAvailability).filter(([, value]) => value !== 'Unavailable').map(([id]) => `season:${id}`)
  ],
  search: [
    row.canonicalName,
    row.description,
    ...Object.entries(row.regionAvailability).filter(([, value]) => value !== 'Unavailable').map(([id, value]) => `${id} ${value}`),
    ...Object.entries(row.seasonAvailability).filter(([, value]) => value !== 'Unavailable').map(([id, value]) => `${id} ${value}`),
    ...row.preparations.flatMap(preparation => [preparation.name, preparation.method, ...preparation.tags.map(tag => `${tag.tag} ${tag.value}`)])
  ]
}));

const REMEDY_ENTRIES = REAGENTS.flatMap(reagent => reagent.preparations.map(preparation => createEntry({
  id: `remedy:${preparation.id}`, kind: 'remedy', title: `${reagent.displayName || reagent.canonicalName} · ${preparation.name} · ${preparation.method}`,
  summary: `${preparation.method} · Potency ${preparation.tags.map(tag => `${tag.tag} ${tag.value}`).join(', ') || '특수'}`,
  sourcePage: preparation.sourcePage, ownerId: preparation.id, ruleIds: ['TREATMENT-001'], runtimeStatus: 'canonical',
  details: [detail('Ingredient', reagent.canonicalName), detail('Preparation', preparation.method), detail('Potency', preparation.tags.map(tag => `${tag.tag} ${tag.value}`).join(' / ') || '원문 특수'), detail('Weight', preparation.weight), detail('Uses', preparation.uses), detail('Required Tool', preparation.requiredTools.join(', ') || preparation.requiredTool), detail('Restrictions', structuredEffectsText(preparation.specialRules))],
  relatedIds: [
    `ingredient:${reagent.id}`,
    ...preparation.tags.map(tag => `tag:${tag.tag}`),
    ...preparation.requiredTools.filter(toolId => toolId !== 'none').map(toolId => `tool:${toolId}`),
    'procedure:treatment'
  ],
  search: [reagent.canonicalName, preparation.method, preparation.tags.map(tag => tag.tag).join(' ')]
})));

const TAG_MEANINGS: Record<string, string> = {
  ELSEWHERE: 'Commemorating death.', INSTINCT: 'Calming primal fighting urges.', JOY: 'Lifting spirits and inspiring courage.', MOOD: 'Supporting emotional stability.', NERVES: 'Assuaging flighty reactions.',
  INFECTION: 'Hampering a spreading rot.', PAIN: 'Easing bodily hurts and fatigue.', PARASITE: 'Purging unwanted passengers.', SENSES: 'Processing of stimuli.', SLEEP: 'Regulation of rest and recovery.',
  BREATH: 'Lungs and their power.', BURN: 'Soothing irritations and shocks.', FEATHER: 'Maintaining oil and gloss.', FUR: 'Grooming insulating layers.', HIDE: 'Caring for hard-wearing skin.',
  POISON: 'Neutralising deadly toxins.', SCALE: 'Cleaning and polishing.', STOMACH: 'Calming upset guts.', TEMPERATURE: 'Regulating core heat.', WOUND: 'Sealing cuts and clotting blood.',
  FAIR: 'Barter value that supports a fair trade.', FOUL: 'Barter value that supports a foul trade.'
};

const TAG_ENTRIES = TAG_DEFINITIONS.map(row => createEntry({
  id: `tag:${row.id}`, kind: 'tag', title: row.id, summary: TAG_MEANINGS[row.id] || row.id, sourcePage: row.sourcePage,
  ownerId: row.id, ruleIds: ['TREATMENT-001'], runtimeStatus: 'canonical',
  details: [
    detail('Category', row.category),
    detail('Stacks', row.stacks ? 'Yes' : 'No'),
    detail('Related remedies', REMEDY_ENTRIES.filter(entry => entry.relatedIds.includes(`tag:${row.id}`)).length),
    detail('Related ailments', AILMENT_ENTRIES.filter(entry => entry.relatedIds.includes(`tag:${row.id}`)).length)
  ],
  relatedIds: [
    ...AILMENT_ENTRIES.filter(entry => entry.relatedIds.includes(`tag:${row.id}`)).map(entry => entry.id),
    ...REMEDY_ENTRIES.filter(entry => entry.relatedIds.includes(`tag:${row.id}`)).map(entry => entry.id)
  ], search: [TAG_MEANINGS[row.id] || '']
}));

const TOOL_ENTRIES = TOOLS.map(row => createEntry({
  id: `tool:${row.id}`, kind: 'tool', title: row.canonicalName, summary: TOOL_REFERENCE_EFFECTS[row.id] || `${row.category} · Weight ${row.weight}${row.cost == null ? '' : ` · Cost ${row.cost}`}`,
  sourcePage: row.sourcePage, ownerId: row.id, ruleIds: ['ALMANACK-005', 'TOOL-003'], runtimeStatus: 'canonical',
  details: [detail('Effect', TOOL_REFERENCE_EFFECTS[row.id] || '원문 페이지 참조'), detail('Weight', row.weight), detail('Cost', row.cost ?? 'Not sold'), detail('Location', row.purchaseLocations.join(', ') || 'Starting / special'), detail('Preparation', row.preparationMethods.join(', ') || '없음'), detail('Replacement', row.replacesToolIds?.join(', ') || '아님'), detail('Canonical consumer', 'resolveToolEffects')],
  relatedIds: [
    'procedure:tools',
    ...TOOL_UPGRADES.filter(upgrade => upgrade.baseToolId === row.id).map(upgrade => `tool:${upgrade.id}`),
    ...REMEDY_ENTRIES.filter(remedy => remedy.relatedIds.includes(`tool:${row.id}`)).map(remedy => remedy.id)
  ],
  search: [TOOL_REFERENCE_EFFECTS[row.id] || '', row.purchaseLocations.join(' '), row.preparationMethods.join(' ')]
}));

const UPGRADE_ENTRIES = TOOL_UPGRADES.map(row => createEntry({
  id: `tool:${row.id}`, kind: 'tool', title: row.canonicalName, summary: row.effect, sourcePage: row.sourcePage, ownerId: row.id, ruleIds: row.ruleIds,
  runtimeStatus: 'canonical', details: [detail('Base Tool', row.baseToolId), detail('Weight', row.weight), detail('Trigger', row.trigger), detail('Effect', row.effect), detail('Canonical consumer', 'resolveUpgrade / resolveToolEffects')],
  relatedIds: [`tool:${row.baseToolId}`, 'procedure:tools'], search: [row.effect, row.trigger]
}));

const SERVICE_ENTRIES = GUILD_SERVICES.map(row => createEntry({
  id: `service:${row.id}`, kind: 'service', title: row.name, summary: row.followUp, sourcePage: row.sourcePage, ownerId: row.id, ruleIds: row.ruleIds,
  runtimeStatus: 'canonical', details: [detail('Provider', row.provider), detail('Cost', Array.isArray(row.cost) ? row.cost.join(' / ') : row.cost), detail('Unlock / Location', JSON.stringify(row.locationRequirement)), detail('Target', row.target), detail('Duration', row.duration), detail('Map effect', row.mapEffect), detail('Canonical consumer', 'resolveGuildService / resolveServiceConsumer')],
  relatedIds: ['procedure:services'], search: [row.provider, row.followUp, JSON.stringify(row.locationRequirement)]
}));

const CLINIC_ENTRIES = CLINIC_AGENDAS.map(row => createEntry({
  id: `clinic:${row.id}`, kind: 'clinic', title: row.canonicalName, summary: row.effect, sourcePage: row.sourcePage, ownerId: row.id, ruleIds: row.ruleIds,
  runtimeStatus: 'canonical', details: [detail('Unlock', row.requirement), detail('Effect', row.effect), detail('Restriction', 'Agenda가 없으면 해당 action을 사용할 수 없음'), detail('Canonical consumer', 'resolveClinicAgenda / resolveSeason')],
  relatedIds: ['procedure:clinic'], search: [row.requirement, row.effect]
}));

const WAGON_ENTRIES = WAGON_EXPANSIONS.map(row => createEntry({
  id: `wagon:${row.id}`, kind: 'wagon', title: row.canonicalName, summary: row.effect, sourcePage: row.sourcePage, ownerId: row.id, ruleIds: row.ruleIds,
  runtimeStatus: 'canonical', details: [detail('Cost', row.cost), detail('Location', row.location), detail('Effect', row.effect), detail('Canonical consumer', 'resolveMobilityEffects / resolveTravel')],
  relatedIds: ['procedure:wagon'], search: [row.location, row.effect]
}));

const COMPANION_ENTRIES = COMPANIONS.map(row => createEntry({
  id: `companion:${row.id}`, kind: 'companion', title: row.canonicalName, summary: row.effect, sourcePage: row.sourcePage, ownerId: row.id, ruleIds: row.ruleIds,
  runtimeStatus: 'canonical', details: [detail('Cost', row.cost), detail('Regions', row.regions.join(', ')), detail('Effect', row.effect), detail('Lifecycle', 'Journey / encounter / season / milestone state'), detail('Canonical consumer', 'resolveMobilityEffects')],
  relatedIds: ['procedure:companions', ...row.regions.map(region => `region:${region}`)], search: [row.regions.join(' '), row.effect]
}));

const BARROW_ENTRIES = BARROW_DELVES.map(row => createEntry({
  id: `barrow:${row.id}`, kind: 'barrow', title: row.name, summary: `${row.behemothClass} · ${row.challenge}`, sourcePage: row.sourcePage, ownerId: row.id, ruleIds: row.ruleIds,
  runtimeStatus: 'canonical', details: [detail('Class', row.behemothClass), detail('Suits', row.suits.join(' / ')), detail('Challenge', row.challenge), detail('Timer', row.initialTimer), detail('Requirement', row.requiredTags.map(tag => `${tag.tag} ${tag.value}${tag.count ? ` x${tag.count}` : ''}`).join(' / ') || '원문 선택'), detail('Canonical flow', 'entry → challenge → choice → consequence → return')],
  relatedIds: ['procedure:barrows', ...row.requiredTags.map(tag => `tag:${tag.tag}`)], search: [row.challenge, row.behemothClass]
}));

const REGION_ENTRIES = REGIONS.map(row => {
  const encounters = ENCOUNTER_ENTRIES.filter(entry => entry.details.some(detail => detail.label === '지역' && detail.value === row.id));
  return createEntry({
    id: `region:${row.id}`, kind: 'region', title: row.id, summary: `${row.id}의 Travel, Foraging, Social과 계절별 원문을 연결합니다.`, sourcePage: row.sourcePage,
    ownerId: row.id, ruleIds: ['TRAVEL-002'], runtimeStatus: 'canonical', details: [detail('Travel', row.travelRegion), detail('Foraging', row.foragingRegion), detail('Reagent region', row.reagentRegion), detail('관련 조우', encounters.length)],
    relatedIds: encounters.map(entry => entry.id), search: [row.id, 'travel forage social season']
  });
});

const SEASON_ENTRIES = SEASONS.map(row => createEntry({
  id: `season:${row.id}`, kind: 'season', title: row.id, summary: `${row.id}의 encounter, forage availability, downtime와 clinic 경계 효과.`, sourcePage: row.sourcePage,
  ownerId: row.id, ruleIds: ['SEASON-001'], runtimeStatus: 'canonical', details: [detail('Order', row.order + 1), detail('Next Season', row.nextSeason), detail('계절 조우', ENCOUNTERS.filter(encounter => encounter.season === row.id).length), detail('Canonical consumer', 'resolveSeason')],
  relatedIds: ENCOUNTER_ENTRIES.filter(entry => entry.details.some(detail => detail.label === '계절' && detail.value === row.id)).map(entry => entry.id), search: ['season forage clinic downtime']
}));

const DOWNTIME_ENTRIES = [createEntry({
  id: 'downtime:general-practice', kind: 'downtime', title: 'General Practice and Downtime',
  summary: 'Journey 뒤 한 번의 Downtime action, General Practice, 영구 지도 기록과 계절 경계를 함께 확인합니다.',
  sourcePage: 40, endPage: 43, ownerId: 'general-practice', ruleIds: ['DOWNTIME-001', 'SEASON-001'], runtimeStatus: 'canonical',
  details: [detail('Requirement', 'Journey 종료 뒤 Downtime이 필요할 때'), detail('Effect', '선택한 한 가지 canonical Downtime action'), detail('Permanence', '원문이 영구로 지정한 지도/Clinic 변화만 유지'), detail('Canonical consumer', 'resolveDowntime / resolveSeasonBoundary')],
  relatedIds: ['procedure:downtime', 'chapter:downtime', ...SEASON_ENTRIES.map(season => season.id)], search: ['general practice map season clinic permanence']
})];

const GUIDANCE_ENTRIES = [
  createEntry({ id: 'guidance:specific-overrides-general', kind: 'guidance', title: 'Specific Overrides General', summary: '두 규칙이 충돌하면 더 구체적인 규칙이 우선합니다.', sourcePage: 6, ruleIds: ['CORE-001'], runtimeStatus: 'reference-only', details: [detail('Source type', 'Player guidance')], relatedIds: ['chapter:introduction'] }),
  createEntry({ id: 'guidance:journaling', kind: 'guidance', title: 'Journaling', summary: 'Journal prompt는 글, 말, 그림 등 원하는 형식으로 멈춰 생각하는 지시입니다.', sourcePage: 7, ruleIds: [], runtimeStatus: 'reference-only', details: [detail('Source type', 'Player guidance')], relatedIds: ['chapter:introduction'] }),
  createEntry({ id: 'guidance:manual-is-intentional', kind: 'guidance', title: 'Manual Resolution은 누락이 아닙니다', summary: '원문이 선택, 서술 또는 후속 판단을 플레이어에게 맡긴 경우 앱은 결론을 만들지 않고 필요한 맥락과 기록 수단을 제공합니다.', sourcePage: 7, ruleIds: [], runtimeStatus: 'reference-only', details: [detail('347개 Manual', '원작의 player choice / narrative / follow-up을 보존')], relatedIds: [] })
];

const EXAMPLE_ENTRIES = [
  createEntry({ id: 'example:character-identity', kind: 'example', title: 'Apothecary identity examples', summary: '크기와 생김새를 나타내는 카드 값을 동물 예시와 대조하는 Character 생성 예시.', sourcePage: 10, ruleIds: ['CHARACTER-001'], runtimeStatus: 'reference-only', details: [detail('구분', 'Example; canonical choice가 아님')], relatedIds: ['chapter:character'] }),
  createEntry({ id: 'example:movement', kind: 'example', title: 'Move across Paths', summary: 'Travel Style과 Speed를 이용해 여러 Path를 지나 목적지에 도착하는 이동 예시.', sourcePage: 24, endPage: 25, ruleIds: ['TRAVEL-002'], runtimeStatus: 'reference-only', details: [detail('구분', 'Worked movement example')], relatedIds: ['procedure:move', 'chapter:travel'] }),
  createEntry({ id: 'example:patient-cards', kind: 'example', title: 'Patient card pairing', summary: '두 카드 값을 조합해 환자의 Descriptor와 species를 만드는 예시.', sourcePage: 28, ruleIds: ['PATIENT-001'], runtimeStatus: 'reference-only', details: [detail('구분', 'Patient generation example')], relatedIds: ['chapter:patients'] }),
  createEntry({ id: 'example:rarity', kind: 'example', title: 'Reagent Rarity by location', summary: 'Current 또는 Adjacent Location에 따라 Reagent Rarity가 달라지는 예시.', sourcePage: 30, ruleIds: ['FORAGE-001'], runtimeStatus: 'reference-only', details: [detail('구분', 'Rarity example')], relatedIds: ['procedure:foraging'] }),
  createEntry({ id: 'example:journey-consequence', kind: 'example', title: 'Journey consequence prompts', summary: 'Journey 결말을 서술할 때 사용할 수 있는 결과 예시와 질문.', sourcePage: 39, ruleIds: ['JOURNEY-006'], runtimeStatus: 'reference-only', details: [detail('구분', 'Narrative example')], relatedIds: ['procedure:journey-close'] }),
  createEntry({ id: 'example:behemoth-barrow', kind: 'example', title: 'Behemoth and Barrow prompt', summary: '카드 suit로 Behemoth archetype을 정하고 Barrow를 기록하는 예시.', sourcePage: 40, ruleIds: ['BARROW-001'], runtimeStatus: 'reference-only', details: [detail('구분', 'Barrow prompt example')], relatedIds: ['procedure:barrows'] }),
  createEntry({ id: 'example:trinket', kind: 'example', title: 'Trinket card values', summary: '여러 카드 값을 조합해 Trinket의 종류와 가치를 정하는 예시.', sourcePage: 56, ruleIds: ['ALMANACK-003'], runtimeStatus: 'reference-only', details: [detail('구분', 'Almanack example')], relatedIds: ['chapter:general-almanack'] }),
  createEntry({ id: 'example:combine-tools', kind: 'example', title: 'Combining Tool properties', summary: '도구와 조제법의 속성을 함께 적용하는 Tool 사용 예시.', sourcePage: 63, ruleIds: ['TOOL-003'], runtimeStatus: 'reference-only', details: [detail('구분', 'Tool example')], relatedIds: ['procedure:tools'] }),
  createEntry({ id: 'example:instruments', kind: 'example', title: 'Instrument requirements', summary: 'Instrument를 연주하는 데 필요한 도구와 신체 조건을 설명하는 예시.', sourcePage: 64, ruleIds: ['TOOL-003'], runtimeStatus: 'reference-only', details: [detail('구분', 'Tool requirement example')], relatedIds: ['procedure:tools'] }),
  createEntry({ id: 'example:upgrade', kind: 'example', title: 'Basic Tool Upgrade', summary: 'Basic Tool을 적격 Upgrade로 바꾸는 절차 예시.', sourcePage: 66, ruleIds: ['TOOL-005'], runtimeStatus: 'reference-only', details: [detail('구분', 'Upgrade example')], relatedIds: ['table:upgrades', 'procedure:tools'] }),
  createEntry({ id: 'example:soar-encounter', kind: 'example', title: 'Soar Travel Encounter', summary: '현재 지역을 기준으로 Soar encounter row를 읽는 예시.', sourcePage: 72, ruleIds: ['TRAVEL-009'], runtimeStatus: 'reference-only', details: [detail('구분', 'Encounter lookup example')], relatedIds: ['procedure:soaring'] }),
  createEntry({ id: 'example:forage-encounter', kind: 'example', title: 'Foraging Encounter lookup', summary: '현재 지역과 계절, 카드 결과를 이용해 Foraging encounter를 찾는 예시.', sourcePage: 152, ruleIds: ['FORAGE-001'], runtimeStatus: 'reference-only', details: [detail('구분', 'Encounter lookup example')], relatedIds: ['procedure:foraging'] })
];

const AILMENT_CROSS_LINKED_ENTRIES = AILMENT_ENTRIES.map(entry => {
  const tagIds = entry.relatedIds.filter(id => id.startsWith('tag:'));
  const remedies = REMEDY_ENTRIES.filter(remedy => tagIds.some(tagId => remedy.relatedIds.includes(tagId))).map(remedy => remedy.id);
  return { ...entry, relatedIds: unique([...entry.relatedIds, ...remedies]) };
});

const REMEDY_CROSS_LINKED_ENTRIES = REMEDY_ENTRIES.map(entry => ({
  ...entry,
  relatedIds: unique([...entry.relatedIds, ...AILMENT_CROSS_LINKED_ENTRIES.filter(ailment => ailment.relatedIds.includes(entry.id)).map(ailment => ailment.id)])
}));

const REGION_CROSS_LINKED_ENTRIES = REGION_ENTRIES.map(entry => {
  const regionName = entry.ownerId?.toLowerCase() || '';
  const tables = TABLES.filter(table => table.searchText.includes(regionName)).map(table => table.id);
  const ingredients = INGREDIENT_ENTRIES.filter(ingredient => ingredient.relatedIds.includes(entry.id)).map(ingredient => ingredient.id);
  return { ...entry, relatedIds: unique([...entry.relatedIds, ...ingredients, ...tables, ...SEASON_ENTRIES.map(season => season.id)]) };
});

const SEASON_CROSS_LINKED_ENTRIES = SEASON_ENTRIES.map(entry => ({
  ...entry,
  relatedIds: unique([
    ...entry.relatedIds,
    ...INGREDIENT_ENTRIES.filter(ingredient => ingredient.relatedIds.includes(entry.id)).map(ingredient => ingredient.id)
  ])
}));

export const RULEBOOK_REFERENCE_ENTRIES: RulebookReferenceEntry[] = [
  ...RULEBOOK_CHAPTERS, ...PROCEDURES, ...TABLES, ...ENCOUNTER_ENTRIES, ...AILMENT_CROSS_LINKED_ENTRIES, ...PRINTED_EFFECT_ENTRIES,
  ...INGREDIENT_ENTRIES, ...REMEDY_CROSS_LINKED_ENTRIES, ...TAG_ENTRIES, ...TOOL_ENTRIES, ...UPGRADE_ENTRIES, ...SERVICE_ENTRIES,
  ...CLINIC_ENTRIES, ...WAGON_ENTRIES, ...COMPANION_ENTRIES, ...BARROW_ENTRIES, ...REGION_CROSS_LINKED_ENTRIES, ...SEASON_CROSS_LINKED_ENTRIES, ...DOWNTIME_ENTRIES, ...GUIDANCE_ENTRIES, ...EXAMPLE_ENTRIES
];

export const RULEBOOK_REFERENCE_BY_ID = new Map(RULEBOOK_REFERENCE_ENTRIES.map(entry => [entry.id, entry]));

export const RULEBOOK_KIND_COUNTS = RULEBOOK_REFERENCE_ENTRIES.reduce((counts, entry) => {
  counts[entry.kind] = (counts[entry.kind] || 0) + 1;
  return counts;
}, {} as Partial<Record<RulebookReferenceKind, number>>);

export const RULEBOOK_COVERAGE = {
  rules: RULEBOOK_CHAPTERS.length,
  procedures: PROCEDURES.length,
  travel: TRAVEL_ENCOUNTERS.length,
  foraging: FORAGING_ENCOUNTERS.length,
  social: SOCIAL_ENCOUNTERS.length,
  ailments: AILMENTS.length,
  printedEffects: PRINTED_EFFECT_REGISTRY.length,
  remedies: REMEDY_ENTRIES.length,
  ingredients: REAGENTS.length,
  tags: TAG_DEFINITIONS.length,
  tools: TOOLS.length + TOOL_UPGRADES.length,
  services: GUILD_SERVICES.length,
  clinic: CLINIC_AGENDAS.length,
  wagon: WAGON_EXPANSIONS.length,
  companions: COMPANIONS.length,
  barrows: BARROW_DELVES.length,
  downtime: DOWNTIME_ENTRIES.length,
  regions: REGIONS.length,
  seasons: SEASONS.length,
  tables: TABLES.length,
  sourceLinkage: RULEBOOK_REFERENCE_ENTRIES.filter(entry => Number.isInteger(entry.sourcePage) && entry.sourcePage > 0).length
} as const;

const normalizeSearchValue = (value: string) => value.normalize('NFKC').trim().toLowerCase();

const editDistance = (left: string, right: string): number => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
};

export const fuzzyReferenceTextMatch = (text: string, query: string): boolean => {
  const normalizedText = normalizeSearchValue(text);
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;
  if (normalizedText.includes(normalizedQuery)) return true;
  const words = normalizedText.split(/[^a-z0-9가-힣]+/).filter(Boolean);
  const queryWords = normalizedQuery.split(/[^a-z0-9가-힣]+/).filter(Boolean);
  return queryWords.length > 0 && queryWords.every(queryWord => {
    if (queryWord.length < 5) return false;
    const threshold = queryWord.length >= 8 ? 2 : 1;
    return words.some(word => Math.abs(word.length - queryWord.length) <= threshold && editDistance(word, queryWord) <= threshold);
  });
};

export type ReferenceSearchReason = '이름' | '설명·관계' | '비슷한 이름' | '원문 페이지' | '';

export const referenceSearchReason = (entry: RulebookReferenceEntry, query: string): ReferenceSearchReason => {
  const normalized = normalizeSearchValue(query);
  if (!normalized) return '';
  const pageMatch = normalized.match(/^p(?:age)?\.?\s*(\d+)$/i);
  if (pageMatch) {
    const page = Number(pageMatch[1]);
    return page >= entry.sourcePage && page <= (entry.endPage || entry.sourcePage) ? '원문 페이지' : '';
  }
  if (normalizeSearchValue(entry.title).includes(normalized)) return '이름';
  if (normalizeSearchValue(entry.searchText).includes(normalized)) return '설명·관계';
  return fuzzyReferenceTextMatch(`${entry.title} ${entry.ownerId || ''}`, normalized) ? '비슷한 이름' : '';
};

export const searchReferenceEntries = (query: string, kind: RulebookReferenceKind | 'all' = 'all') => {
  const normalized = normalizeSearchValue(query);
  const rows = RULEBOOK_REFERENCE_ENTRIES.filter(entry => kind === 'all' || entry.kind === kind);
  if (!normalized) return rows;
  return rows
    .map(entry => ({ entry, reason: referenceSearchReason(entry, normalized) }))
    .filter(row => Boolean(row.reason))
    .sort((left, right) => {
      const score = (reason: ReferenceSearchReason) => reason === '이름' ? 0 : reason === '원문 페이지' ? 1 : reason === '설명·관계' ? 2 : 3;
      return score(left.reason) - score(right.reason) || left.entry.title.localeCompare(right.entry.title);
    })
    .map(row => row.entry);
};

export const validateRulebookReferenceDrift = (): string[] => {
  const errors: string[] = [];
  const ids = new Set<string>();
  RULEBOOK_REFERENCE_ENTRIES.forEach(entry => {
    if (ids.has(entry.id)) errors.push(`Duplicate reference ID: ${entry.id}`);
    ids.add(entry.id);
    if (!Number.isInteger(entry.sourcePage) || entry.sourcePage < 1 || entry.sourcePage > 220) errors.push(`Invalid source page: ${entry.id}`);
  });
  if (ENCOUNTER_ENTRIES.length !== ENCOUNTERS.length) errors.push('Encounter reference count drift');
  if (AILMENT_ENTRIES.length !== AILMENTS.length) errors.push('Ailment reference count drift');
  if (PRINTED_EFFECT_ENTRIES.length !== PRINTED_EFFECT_REGISTRY.length) errors.push('Printed Effect reference count drift');
  if (INGREDIENT_ENTRIES.length !== REAGENTS.length) errors.push('Ingredient reference count drift');
  if (REMEDY_ENTRIES.length !== REAGENTS.reduce((sum, reagent) => sum + reagent.preparations.length, 0)) errors.push('Remedy reference count drift');
  if (TOOL_ENTRIES.length !== TOOLS.length || UPGRADE_ENTRIES.length !== TOOL_UPGRADES.length) errors.push('Tool reference count drift');
  return errors;
};
