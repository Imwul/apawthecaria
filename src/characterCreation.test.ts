import { describe, expect, it } from 'vitest';
import { CHARACTER_CREATION_CHOICES, getCharacterCreationIssues, getRestorableCharacterDraftFields, isCharacterChoiceConfirmed, type CharacterChoiceField } from './characterCreation';
import { normalizeCharacterCreationDraft, type CharacterCreationDraft, type CharacterDraftField } from './workflowDrafts';

const defaultValues = {
  name: 'Moss', animal: 'Badger', familiarName: 'Pip', familiarAnimal: 'Mouse',
  descriptorName: 'Burrowing', travelName: 'Rambling and Ready', originName: 'An Accident',
  familiarDescriptorName: 'Small', familiarBenefitName: 'Helpful', relationshipName: 'Old Friends'
};
const identityFields: CharacterDraftField[] = ['name', 'animal', 'familiarName', 'familiarAnimal'];
const emptyEvidence = { existingCharacter: false, touched: identityFields, cards: {} };

describe('character creation completion', () => {
  it('rejects jumping straight to confirmation with only the four identity fields', () => {
    expect(getCharacterCreationIssues(defaultValues, emptyEvidence).map(issue => issue.field))
      .toEqual(CHARACTER_CREATION_CHOICES.map(choice => choice.field));
  });

  it('accepts explicit manual choices, even when they equal all preview defaults', () => {
    const touched = [...identityFields, ...CHARACTER_CREATION_CHOICES.map(choice => choice.field)];
    expect(getCharacterCreationIssues(defaultValues, { ...emptyEvidence, touched })).toEqual([]);
  });

  it('accepts card decisions without requiring changed values or narrative text', () => {
    const cards = Object.fromEntries(CHARACTER_CREATION_CHOICES.map(choice => [choice.card, { suit: '♥', value: 2 }]));
    expect(getCharacterCreationIssues(defaultValues, { ...emptyEvidence, cards })).toEqual([]);
  });

  it('restores mixed card and manual decisions through a saved draft reload', () => {
    const manualChoices = CHARACTER_CREATION_CHOICES.filter((_, index) => index % 2 === 0);
    const draft: CharacterCreationDraft = {
      version: 1, updatedAt: 123,
      touched: [...identityFields, ...manualChoices.map(choice => choice.field)],
      ...defaultValues,
      cards: Object.fromEntries(CHARACTER_CREATION_CHOICES.filter((_, index) => index % 2 !== 0)
        .map(choice => [choice.card, { suit: '♣', value: 13 }]))
    };
    const restored = normalizeCharacterCreationDraft(JSON.parse(JSON.stringify(draft)))!;
    expect(getCharacterCreationIssues(defaultValues, { existingCharacter: false, touched: restored.touched, cards: restored.cards }))
      .toEqual([]);
  });

  it('does not mistake narrative notes or malformed cards for required choices', () => {
    const issues = getCharacterCreationIssues(defaultValues, {
      ...emptyEvidence, touched: [...identityFields, 'originJournal', 'relationshipJournal'],
      cards: { self: { suit: 'bad', value: 2 }, travel: { suit: '♥', value: 0 }, origin: { suit: '♣', value: 1.5 } }
    });
    expect(issues).toHaveLength(6);
  });

  it('lists the specific unfinished step instead of silently applying its fallback', () => {
    const touched = CHARACTER_CREATION_CHOICES.filter(choice => choice.field !== 'familiarBenefitName').map(choice => choice.field);
    expect(getCharacterCreationIssues(defaultValues, { ...emptyEvidence, touched })).toEqual([
      expect.objectContaining({ field: 'familiarBenefitName', label: '길동무 도움', step: 5 })
    ]);
  });

  it('preserves editing compatibility for committed legacy characters', () => {
    expect(getCharacterCreationIssues(defaultValues, { ...emptyEvidence, existingCharacter: true })).toEqual([]);
    expect(getCharacterCreationIssues({ ...defaultValues, name: '  ' }, { ...emptyEvidence, existingCharacter: true }))
      .toEqual([{ field: 'name', step: 0, label: '약제사 이름' }]);
  });

  it('rejects missing selected values and clears selection evidence when abandoning a draft', () => {
    expect(getCharacterCreationIssues({ ...defaultValues, travelName: '' }, {
      ...emptyEvidence, touched: CHARACTER_CREATION_CHOICES.map(choice => choice.field)
    }).map(issue => issue.field)).toEqual(['travelName']);
    expect(isCharacterChoiceConfirmed('travelName', { ...emptyEvidence, touched: [], cards: {} })).toBe(false);
  });

  it('does not promote a corrupt restored choice to the valid display fallback', () => {
    const catalog = Object.fromEntries(CHARACTER_CREATION_CHOICES.map(choice => [choice.field, [{ name: defaultValues[choice.field] }]])) as Record<CharacterChoiceField, { name: string }[]>;
    const restored = normalizeCharacterCreationDraft({
      version: 1, updatedAt: 123, touched: [...identityFields, ...CHARACTER_CREATION_CHOICES.map(choice => choice.field)],
      ...defaultValues, travelName: 'removed-or-corrupt-choice', cards: {}
    })!;
    const touched = getRestorableCharacterDraftFields(restored, catalog);
    expect(touched).toContain('name');
    expect(touched).not.toContain('travelName');
    expect(getCharacterCreationIssues(defaultValues, { ...emptyEvidence, touched }).map(issue => issue.field))
      .toEqual(['travelName']);
  });
});
