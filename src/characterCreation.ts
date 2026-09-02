import type { CharacterCreationDraft, CharacterDraftCardKey, CharacterDraftField, DraftCard } from './workflowDrafts';

export const CHARACTER_CREATION_CHOICES = [
  { field: 'descriptorName', card: 'self', step: 0, label: '약제사 동물 유형' },
  { field: 'travelName', card: 'travel', step: 1, label: '이동 방식' },
  { field: 'originName', card: 'origin', step: 2, label: '출발 계기' },
  { field: 'familiarDescriptorName', card: 'familiar', step: 4, label: '길동무 동물 유형' },
  { field: 'familiarBenefitName', card: 'familiarBenefit', step: 5, label: '길동무 도움' },
  { field: 'relationshipName', card: 'relationship', step: 6, label: '길동무와의 관계' }
] as const;

export type CharacterChoiceField = typeof CHARACTER_CREATION_CHOICES[number]['field'];

export const getRestorableCharacterDraftFields = (
  draft: CharacterCreationDraft | null | undefined,
  catalog: Record<CharacterChoiceField, readonly { name: string }[]>
): CharacterDraftField[] => (draft?.touched || []).filter(field => !(field in catalog)
  || catalog[field as CharacterChoiceField].some(item => item.name === draft?.[field]));

export interface CharacterChoiceEvidence {
  /** Already committed characters predate selection tracking and remain editable. */
  existingCharacter: boolean;
  touched: Iterable<CharacterDraftField>;
  cards: Partial<Record<CharacterDraftCardKey, DraftCard | null>>;
}

export const isCharacterChoiceConfirmed = (field: CharacterChoiceField, evidence: CharacterChoiceEvidence): boolean => {
  if (evidence.existingCharacter || new Set(evidence.touched).has(field)) return true;
  const key = CHARACTER_CREATION_CHOICES.find(choice => choice.field === field)!.card;
  const card = evidence.cards[key];
  return Boolean(card && ['♥', '♦', '♣', '♠'].includes(card.suit)
    && Number.isInteger(card.value) && card.value >= 1 && card.value <= 13);
};

export interface CharacterCreationIssue {
  field: CharacterDraftField;
  step: number;
  label: string;
}

/** Default preview values are not evidence of a player decision. Narrative notes stay optional. */
export const getCharacterCreationIssues = (
  values: Partial<Record<CharacterDraftField, string>>,
  evidence: CharacterChoiceEvidence
): CharacterCreationIssue[] => {
  const identities = [
    { field: 'name', step: 0, label: '약제사 이름' },
    { field: 'animal', step: 0, label: '약제사 실제 동물/외형' },
    { field: 'familiarName', step: 4, label: '길동무 이름' },
    { field: 'familiarAnimal', step: 4, label: '길동무 실제 동물/외형' }
  ] as const;
  return [
    ...identities.filter(identity => !values[identity.field]?.trim()),
    ...CHARACTER_CREATION_CHOICES.filter(choice => !values[choice.field]?.trim()
      || !isCharacterChoiceConfirmed(choice.field, evidence))
  ].sort((left, right) => left.step - right.step);
};
