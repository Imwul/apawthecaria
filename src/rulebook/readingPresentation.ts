import { ENCOUNTERS } from '../rules/data/encounters';
import { PRINTED_EFFECT_REGISTRY } from '../rules/printedEffects';
import { localizeEncounterDisplayText, localizeEncounterTitle, localizeManualEffectOption, localizeManualEffectText, localizeManualEffectValue } from '../localization/manualEffectKo';
import { localizeAilmentPresentationText, localizeCanonicalToolName, localizeInventoryItemName, localizePreparationMethod, localizePreparationName, localizeRegionLabel, localizeSeasonLabel } from '../localization/gameplayKo';
import { RULEBOOK_REFERENCE_ENTRIES, searchReferenceEntries } from './referenceRegistry';
import { readerGuideForPage } from './readerGuide';
import { CATALOGUE_READING_KO } from './catalogueReadingKo';
import { GUILD_SERVICE_BY_ID, type GuildServiceId } from '../rules/data/services';
import { REAGENT_BY_ID } from '../rules/data/reagents';
import { formatReagentName } from '../foragingInventoryPresentation';
import { formatRuleTag } from '../localization/tagReadingKo';
import type { RulebookReferenceEntry, RulebookReferenceKind } from './types';

const terms: Record<string, string> = {
  Introduction: '게임 소개', Overview: '플레이 흐름', 'Introducing Yourself': '약제사 소개', 'Starting a Journey': '여정 시작',
  Travelling: '여행', 'Explaining Ailments': '질환 읽기', 'Identifying Reagents': '약재 읽기', 'Helping Local Beasts': '현지 환자 돕기',
  'Ending a Journey': '여정 마무리', Downtime: '휴식기', Clinics: '약제소', 'Co-op Play': '협동 플레이', 'General Almanack': '여행 도구와 서비스',
  'Travel Encounters': '이동 조우', 'Named Ailments': '질환 도감', 'Barrow Delves': '거수 고분 탐험', Reagents: '약재',
  'Foraging Encounters': '채집 조우', 'Social Encounters': '사회 조우', 'Character Sheets': '기록지',
  'Card Values': '카드 값', 'Travel Style': '이동 방식', 'Familiar Benefits': '길동무 도움', 'Journey Destination and Goal': '목적지와 목표',
  'Regions and Movement': '지역과 이동', 'Ailment Severity': '질환 중증도', 'Reagent Tags and Potency': '약효 태그와 강도',
  Foraging: '채집', Bartering: '거래', 'Preparing to Leave': '떠날 준비', 'Journey Conclusion': '여정 결말',
  'Downtime Actions': '휴식기 활동', 'Clinic Agendas': '약제소 설비', 'Guild Services': '길드 서비스', Tools: '도구',
  'Tool Upgrades': '도구 개조', 'Wagon Expansions': '마차 확장', Companions: '동료', 'Lesser Ailments': '가벼운 질환',
  'Intermediate Ailments': '보통 질환', 'Severe Ailments': '심각한 질환', 'Dire Ailments': '위급한 질환', 'Reagent Almanack': '약재 도감',
  'Specific Overrides General': '구체적인 규칙이 우선', Journaling: '일지 남기기',
  'Apothecary identity examples': '약제사 동물 선택 예시', 'Move across Paths': '경로 이동 예시', 'Patient card pairing': '환자 카드 조합',
  'Reagent Rarity by location': '위치에 따른 희귀도', 'Journey consequence prompts': '여정 결말 예시', 'Behemoth and Barrow prompt': '거수 고분 소문',
  'Trinket card values': '장신구 만들기', 'Combining Tool properties': '도구 효과 조합', 'Instrument requirements': '악기 연주 조건',
  'Basic Tool Upgrade': '기본 도구 개조', 'Soar Travel Encounter': '비행 조우 예시', 'Foraging Encounter lookup': '채집 조우 찾기',
  'Character / Apothecary setup': '약제사와 길동무 만들기', 'Journey 시작': '새 여정 준비', Move: '경로 이동',
  '환자와 Ailment 진단': '환자 접수와 진단', 'Remedy와 Treatment': '처방 만들기와 치료', 'Journey 종료': '여정 마무리',
  Clinic: '약제소 운영', 'Tools와 Upgrades': '도구와 개조', Wagon: '마차', Soaring: '비행', 'Barrow Delve': '거수 고분 탐험'
};
const preciseSummaries: Record<string, string> = {
  'chapter:reagent-basics': '약효 태그와 강도, 부위의 조제법, 치료제 구성법을 확인합니다.',
  'chapter:patients': '환자 접수부터 채집·거래·치료·떠날 준비까지의 순서입니다.',
  'procedure:treatment': '부위의 약효·조제법·필요 도구와 환자의 특수 조건을 확인한 뒤 처방을 적용합니다.',
  'procedure:diagnosis': '환자 카드와 중증도로 질환을 정하고 남은 시간·필요 약효를 확인합니다.',
  'procedure:services': '이용 장소와 비용을 확인하고 서비스를 고릅니다. 즉시 보상과 다음 이동·도착 시 적용되는 효과를 구분합니다.',
  'procedure:soaring': '비행 경로를 따라 이동하고 비행 조우를 해결합니다. 과적·마차와 미방문 유적·고분의 착륙 제한을 확인합니다.'
};
const tagMeanings: Record<string, string> = {
  ELSEWHERE: '죽음과 이별을 기리기', INSTINCT: '격한 본능 진정', JOY: '기쁨과 용기', MOOD: '감정 안정', NERVES: '긴장 완화',
  INFECTION: '감염 억제', PAIN: '통증과 피로 완화', PARASITE: '기생충 제거', SENSES: '감각 회복', SLEEP: '수면과 회복',
  BREATH: '호흡', BURN: '화상과 자극 진정', FEATHER: '깃털 관리', FUR: '털 관리', HIDE: '피부 관리', POISON: '해독',
  SCALE: '비늘 관리', STOMACH: '소화기 진정', TEMPERATURE: '체온 조절', WOUND: '상처와 지혈', FAIR: '좋은 거래 가치', FOUL: '나쁜 거래 가치'
};
const technicalLabels = new Set(['Canonical ID', 'Owner', 'Transaction', 'Canonical consumer', '현재 consumer', 'Canonical handling', 'Canonical flow', 'Lifecycle']);
const cache = new Map<string, RulebookReferenceEntry>();

export const readableReference = (entry: RulebookReferenceEntry): RulebookReferenceEntry => {
  const cached = cache.get(entry.id);
  if (cached) return cached;
  const guide = readerGuideForPage(entry.sourcePage);
  const encounter = entry.kind === 'encounter' ? ENCOUNTERS.find(row => row.id === entry.ownerId) : undefined;
  const effect = entry.kind === 'printed-effect' ? PRINTED_EFFECT_REGISTRY.find(row => row.ownerId === entry.ownerId) : undefined;
  const catalogue = CATALOGUE_READING_KO[entry.id];
  let title = terms[entry.title] || entry.title;
  let summary = localizeManualEffectValue(entry.summary);
  if (encounter) {
    title = localizeEncounterTitle(encounter.title, encounter.id);
    summary = localizeEncounterDisplayText(encounter.title, encounter.prompt, encounter.id);
  } else if (effect) {
    title = localizeEncounterTitle(effect.ownerName, effect.ownerId);
    summary = localizeManualEffectText(effect.ownerName, effect.printedText);
  } else if (entry.kind === 'procedure' || entry.kind === 'rule' || entry.kind === 'downtime') {
    title = terms[entry.title] || guide?.title || entry.title;
    summary = preciseSummaries[entry.id] || guide?.steps[0] || summary;
  } else if (entry.kind === 'table') {
    title = terms[entry.title] || entry.title.replace(/Travel Encounters|Foraging Encounters|Social Encounters/g, value => terms[value])
      .replace(/\b(Bog|Forest|Loch|Meadow|Mountain|Soar|Titan)\b/g, localizeRegionLabel);
    summary = `${title} 원문 표입니다. 아래 한국어 안내와 연결 항목을 함께 확인하세요.`;
  } else if (entry.kind === 'tool') title = localizeCanonicalToolName(entry.title);
  else if (entry.kind === 'ingredient') {
    const reagent = REAGENT_BY_ID.get(entry.ownerId || '');
    title = reagent ? formatReagentName(reagent) : localizeInventoryItemName(entry.title);
  }
  else if (entry.kind === 'remedy') {
    const reagent = REAGENT_BY_ID.get(entry.relatedIds.find(id => id.startsWith('ingredient:'))?.slice('ingredient:'.length) || '');
    title = entry.title.split(' · ').map((part, index) => index === 0 ? reagent ? formatReagentName(reagent) : localizeInventoryItemName(part) : index === 1 ? localizePreparationName(part) : localizePreparationMethod(part)).join(' · ');
    const potency = entry.details.find(row => row.label === 'Potency')?.value;
    summary = `약효: ${potency?.replace(/\b[A-Z]+\b/g, formatRuleTag) || '특수 조건 확인'}`;
  } else if (entry.kind === 'ailment') {
    title = localizeAilmentPresentationText(entry.title);
    summary = localizeAilmentPresentationText(entry.summary).replace(/Timer/g, '남은 시간');
  } else if (entry.kind === 'tag') { title = `${entry.title} · ${tagMeanings[entry.title]}`; summary = `${tagMeanings[entry.title]}. ${['FAIR', 'FOUL'].includes(entry.title) ? '서로 합산하고 상쇄합니다.' : '일반 처방에서 같은 태그의 강도는 합산하지 않습니다.'}`; }
  else if (entry.kind === 'region') { title = localizeRegionLabel(entry.title); summary = `${title}의 이동·채집·사회 조우와 약재를 살펴봅니다.`; }
  else if (entry.kind === 'season') { title = localizeSeasonLabel(entry.title); summary = `${title}의 조우와 약재, 계절 전환 효과를 살펴봅니다.`; }
  if (catalogue) { title = catalogue.title; summary = catalogue.summary; }
  const result = { ...entry, title, summary, details: entry.details.filter(row => !technicalLabels.has(row.label)).map(row => {
    let value = localizeManualEffectValue(row.value);
    if (entry.kind === 'ailment' && !['Timer', 'Severity', 'Canonical name'].includes(row.label)) {
      value = value.split('\n').map(localizeAilmentPresentationText).join('\n');
    }
    if (catalogue && ['Effect', 'Challenge'].includes(row.label)) value = catalogue.summary;
    if (catalogue?.unlock && row.label === 'Unlock') value = catalogue.unlock;
    if (row.label === 'Unlock / Location') {
      const location = GUILD_SERVICE_BY_ID.get(entry.ownerId as GuildServiceId)?.locationRequirement;
      if (location) value = location.kind === 'named' ? location.location
        : location.kind === 'any-city' ? '모든 도시'
          : location.kind === 'any-settlement-or-city' ? '모든 정착지와 도시'
            : `${localizeRegionLabel(location.region)} 정착지${location.orAnyCity ? ' 또는 모든 도시' : ''}`;
    }
    if (row.label === 'Location') value = value.replace(/Any City/g, '모든 도시').replace(/Settlement/g, '정착지').replace(/Starting \/ special/g, '시작 장비 또는 특수 획득').replace(/\bAny\b/g, '모든 정착지와 도시').replace(/\b(Bog|Forest|Loch|Meadow|Mountain)\b/g, localizeRegionLabel);
    if (row.label === 'Restriction') value = value.replace('Agenda가 없으면 해당 action을 사용할 수 없음', '해당 설비가 있는 약제소에서 이용합니다.');
    return { ...row, value };
  }) };
  cache.set(entry.id, result);
  return result;
};

export const referenceChoices = (entry: RulebookReferenceEntry): string[] => {
  const encounter = entry.kind === 'encounter' ? ENCOUNTERS.find(row => row.id === entry.ownerId) : undefined;
  return encounter?.choices.map(choice => localizeManualEffectOption(choice.label, encounter.id, choice.id)) || [];
};

export const searchReadableReferences = (query: string, kind: RulebookReferenceKind | 'all' = 'all'): RulebookReferenceEntry[] => {
  const canonical = searchReferenceEntries(query, kind);
  if (!/[가-힣]/.test(query)) return canonical;
  const words = query.trim().toLowerCase().split(/\s+/);
  const ids = new Set(canonical.map(row => row.id));
  return [...canonical, ...RULEBOOK_REFERENCE_ENTRIES.filter(entry => {
    if (ids.has(entry.id) || (kind !== 'all' && entry.kind !== kind)) return false;
    const row = readableReference(entry);
    const text = `${row.title} ${row.summary} ${row.details.map(detail => detail.value).join(' ')}`.toLowerCase();
    return words.every(word => text.includes(word));
  })];
};
