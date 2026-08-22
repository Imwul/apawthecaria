import { describe, expect, it } from 'vitest';
import {
  localizeAilmentPresentationText,
  localizeAvailabilityLabel,
  localizeBehemothClass,
  localizeCharacterDescriptor,
  localizeCanonicalToolName,
  localizeInventoryItemName,
  localizeJourneyGoalText,
  localizeLocationName,
  localizePatientPersonality,
  localizeDirectionLabel,
  localizePreparationMethod,
  localizePreparationName,
  localizeReagentType,
  localizeRegionLabel,
  localizeRegionList,
  localizeSavedJourneyText,
  localizeSeverityLabel,
  localizeTravelStyle,
  localizeTreatmentResult
} from './gameplayKo';

describe('gameplay presentation localization', () => {
  it('translates canonical state labels without changing their stored values', () => {
    expect(localizeRegionLabel('Forest')).toBe('숲');
    expect(localizeRegionList('Bog, Forest')).toBe('늪지, 숲');
    expect(localizeDirectionLabel('North')).toBe('북쪽');
    expect(localizeCharacterDescriptor('Burrowing')).toBe('땅을 파는 포유류');
    expect(localizeCharacterDescriptor('Bescaled')).toBe('비늘이 있는 파충류');
    expect(localizePatientPersonality('Scared')).toBe('겁이 많은');
    expect(localizeTravelStyle('Rambling and Ready')).toBe('방랑하며 든든하게');
    expect(localizeReagentType('PLANT')).toBe('식물');
    expect(localizeSeverityLabel('DIRE')).toBe('위급');
    expect(localizeTreatmentResult('pending')).toBe('대기 중');
    expect(localizeBehemothClass('Towering')).toBe('거대한');
    expect(localizeAvailabilityLabel('Any Settlement or City')).toBe('모든 정착지와 도시');
    expect(localizeLocationName('오크 길')).toBe('Odoak');
    expect(localizeLocationName('starting oak road')).toBe('Odoak');
    expect(localizeLocationName('눈힐')).toBe('Noonhill');
    expect(localizeLocationName('오도악')).toBe('Odoak');
  });

  it('translates preparation and legacy display fragments', () => {
    expect(localizePreparationName('Leaves')).toBe('잎');
    expect(localizePreparationMethod('BREWED')).toBe('우려냄');
    expect(localizeInventoryItemName('Nettles (Leaves, BREWED)')).toBe('Nettles (잎, 우려냄)');
    expect(localizeInventoryItemName('Nettles (Leaves)')).toBe('Nettles (잎)');
    expect(localizeInventoryItemName('기념품 (Memento)')).toBe('기념품');
    expect(localizeCanonicalToolName('paws')).toBe('앞발/발톱');
    expect(localizeInventoryItemName('Paws/Claws')).toBe('앞발/발톱');
    expect(localizeCanonicalToolName('glass-alembic')).toBe('유리 증류기');
    expect(localizeSavedJourneyText('목표 ♦ 2, Urgency 12일, 이유: 기록')).toBe('목표 ♦ 2, 긴급도 12일, 이유: 기록');
    expect(localizeSavedJourneyText('Suspicious · Befurred\n첫 열병 (Firstfever)')).toBe('의심 많은 · 풍성한 털을 지닌 포유류\n첫 열병 (Firstfever)');
  });

  it('translates generic rule wording while preserving proper names and rule tags', () => {
    expect(localizeJourneyGoalText('Journal in Bog, Forest, Loch, Meadow, and Mountain.'))
      .toBe('늪지, 숲, 호수, 초원, 산맥 각 지역에서 일지를 기록합니다.');
    expect(localizeJourneyGoalText('End the 여정 with 5 more Guild 길드 명성 than at its start.'))
      .toBe('출발할 때보다 길드 명성을 5 이상 높인 채 여정을 마칩니다.');
    expect(localizeAilmentPresentationText('Steel Axe가 필요하며 하루를 소모(Mark 1 Day)합니다.'))
      .toBe('Steel Axe가 필요하며 하루를 소모합니다.');
    expect(localizeAilmentPresentationText('치료제에 COOKED Preparation을 사용합니다.'))
      .toBe('치료제에 COOKED 조제법을 사용합니다.');
    expect(localizeAilmentPresentationText('모든 Bee 및 Hive 영약재가 영구적으로 Unavailable이 됩니다.'))
      .toBe('모든 Bee 및 Hive 영약재가 영구적으로 채집할 수 없게 됩니다.');
    expect(localizeAilmentPresentationText('Include a brightly coloured Plant Reagent.'))
      .toBe('밝은 색의 식물 영약재를 포함합니다.');
    expect(localizeAilmentPresentationText('부목용 약재 (부목용 약재 (부목용 약재 (부목용 약재 (SOMETHING TO SET A BONE))))'))
      .toBe('부목용 약재');
    expect(localizeAilmentPresentationText('INSTINCTS 3, PARASITES 1, SCALES 2'))
      .toBe('INSTINCT 3, PARASITE 1, SCALE 2');
  });
});
