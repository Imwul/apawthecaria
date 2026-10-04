import { GAME_DATA } from './gameData';
import { localizeAilmentPresentationText } from './localization/gameplayKo';
import { LEGACY_EMPTY_AILMENT_OUTCOME } from './rules/data/ailments';
import type { AilmentDefinition, RequirementExpression } from './rules/types';

// Read the actual prescription expression: the old flat legacy tag string
// hid Crestfallen's second recipe and made alternative tags look cumulative.
export const ailmentRequirementText = (requirement: RequirementExpression): string => {
  if (requirement.kind === 'tag') return `${requirement.tag} ${requirement.threshold}`;
  if (requirement.kind === 'special') return localizeAilmentPresentationText(requirement.description);
  if (requirement.kind === 'alternatives') return requirement.alternatives
    .map(row => `(${ailmentRequirementText(row)})`).join(' 또는 ');
  const children = requirement.requirements.map(ailmentRequirementText);
  return requirement.kind === 'allOf' ? children.join(' + ') : `(${children.join(' 또는 ')})`;
};

export const ailmentDisplayRecord = (row: AilmentDefinition) => {
  const legacy = GAME_DATA.ailments.find(ailment =>
    ailment.rawName === row.canonicalName
    || ailment.name === row.displayName
    || ailment.name.toLowerCase().includes(row.canonicalName.toLowerCase())
  );
  const effectText = (effects: typeof row.successEffects) => effects
    .map(item => item.effect.type === 'customEffect' ? localizeAilmentPresentationText(item.effect.description) : '')
    .filter(Boolean).join('\n');
  const isBite = row.id === 'ailment-bite-the-hand-that-cures';
  const printedOutcome = legacy?.outcome === LEGACY_EMPTY_AILMENT_OUTCOME ? '' : legacy?.outcome || '';
  return {
    name: row.displayName,
    rawName: row.canonicalName,
    severity: row.severity,
    timer: row.timer,
    sourceNote: ['ailment-crestfallen', 'ailment-nervefright', 'ailment-seasonshift'].includes(row.id)
      ? '원문 개별 항목의 등급 표기와 질환 뽑기 표가 다릅니다. 앱은 뽑기 표의 등급을 사용합니다.' : '',
    tags: ailmentRequirementText(row.requirements),
    description: legacy?.description || (isBite
      ? '약과 의사를 몹시 무서워하는 환자가 숨어 버렸습니다. 가족과 친구들은 치료를 바라지만 우선 환자를 찾아야 합니다. 가벼운 또는 중간 질환을 뽑고, 현재 또는 인접한 위치에서 기본 희귀도 8의 영약재처럼 환자를 찾은 뒤 치료제를 투여합니다.' : ''),
    outcome: printedOutcome || effectText(row.successEffects) || (isBite
      ? '집에는 돌아왔으니: 환자를 찾았지만 치료제를 만들지 못했다면 뽑은 질환의 실패 결과를 적용하되 길드 명예는 잃지 않습니다. 치료받지 못한 병세가 어떻게 변하나요?' : ''),
    consequence: legacy?.consequence || effectText(row.failureEffects)
  };
};
