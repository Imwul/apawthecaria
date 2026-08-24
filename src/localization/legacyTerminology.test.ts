import { describe, expect, it } from 'vitest';
import { migrateLegacyTerminology } from './legacyTerminology';

describe('legacy terminology migration', () => {
  it('normalizes rule-owned labels while preserving player-authored prose', () => {
    const migrated = migrateLegacyTerminology({
      generatedLabel: '길드 명성 +2 · Draw a Card · 1 Reagent',
      journals: [{
        title: '명성에 관한 시',
        text: '그 시인은 마을에서 명성 2를 얻었다. Journey라는 말을 그대로 썼다.'
      }],
      pendingEncounter: {
        journalNote: '내 환자는 평판 1보다 마음을 더 중요하게 여겼다.'
      },
      activeAilment: {
        initialRememberedNote: 'Reagent라는 낯선 글자를 보았다.'
      },
      bio: {
        name: 'Journey',
        mementoNote: 'Trinket이라는 별명의 장신구'
      },
      bag: [{
        id: 'custom-item',
        name: 'Reagent라는 이름의 수제 약병',
        type: 'item'
      }],
      patients: [{
        id: 'patient-1',
        name: 'Trinket',
        species: 'Journey를 좋아하는 새'
      }],
      customMapLocations: [{
        id: 'custom-place',
        label: 'Reagent Garden',
        source: 'Journey 중 직접 붙인 이름'
      }],
      pendingManualEffect: {
        inputValues: { answer: 'Reputation보다 우정을 골랐다.' }
      }
    }) as any;

    expect(migrated.generatedLabel).toBe('Guild Reputation +2 · 카드를 뽑습니다 · 1 영약재');
    expect(migrated.journals).toEqual([{
      title: '명성에 관한 시',
      text: '그 시인은 마을에서 명성 2를 얻었다. Journey라는 말을 그대로 썼다.'
    }]);
    expect(migrated.pendingEncounter.journalNote).toBe('내 환자는 평판 1보다 마음을 더 중요하게 여겼다.');
    expect(migrated.activeAilment.initialRememberedNote).toBe('Reagent라는 낯선 글자를 보았다.');
    expect(migrated.bio).toEqual({
      name: 'Journey',
      mementoNote: 'Trinket이라는 별명의 장신구'
    });
    expect(migrated.bag[0].name).toBe('Reagent라는 이름의 수제 약병');
    expect(migrated.patients[0]).toMatchObject({
      name: 'Trinket',
      species: 'Journey를 좋아하는 새'
    });
    expect(migrated.customMapLocations[0]).toMatchObject({
      label: 'Reagent Garden',
      source: 'Journey 중 직접 붙인 이름'
    });
    expect(migrated.pendingManualEffect.inputValues.answer).toBe('Reputation보다 우정을 골랐다.');
  });
});
