import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ManualEffectDraft } from '../rules';
import ManualEffectPanel from './ManualEffectPanel';

const staleProjectLaunchDraft: ManualEffectDraft = {
  effectId: 'stale-project-launch',
  ruleId: 'EVENT-174',
  ruleIds: ['EVENT-174'],
  sourcePage: 174,
  summary: '신작 공개',
  registryEffectId: null,
  ownerId: 'foraging-meadow-9-spring',
  ownerType: 'encounter',
  trigger: 'encounter',
  printedText: '오래된 번역 본문: 발명품이 치명적으로 잘못되면 어떻게 되나요?',
  resolutionInstruction: '신작 공개의 원문 선택을 직접 해결하세요.',
  mandatoryConditions: [],
  choices: [
    '신작 공개 지켜보기 — 모든 타이머를 2 줄입니다.',
    '고개 숙이기 — 발명가의 혼란을 피합니다.'
  ],
  canonicalActions: [],
  inputFields: [{
    id: 'printed-choice',
    type: 'choice',
    label: '적용한 원문 분기 또는 선택',
    required: false,
    options: [
      '신작 공개 지켜보기 — 모든 타이머를 2 줄입니다.',
      '고개 숙이기 — 발명가의 혼란을 피합니다.'
    ]
  }],
  inputValues: {},
  actionTemplates: [],
  selectedActionIds: [],
  actionTargets: {},
  followUpRequirements: [],
  context: { continuation: 'foraging' },
  resultSummary: '',
  journalNote: '',
  status: 'manual',
  transactionId: null,
  overrideReason: '',
  createdAt: 1,
  updatedAt: 1
};

describe('ManualEffectPanel', () => {
  const primaryActionTag = (markup: string): string => (
    markup.match(/<button type="button" class="btn-cozy-primary"[^>]*>/)?.[0] || ''
  );

  it('repairs stale encounter copy by stable ids and presents choices as toggle buttons', () => {
    const markup = renderToStaticMarkup(<ManualEffectPanel
      draft={staleProjectLaunchDraft}
      onChange={() => undefined}
      onDefer={() => undefined}
      onResolve={() => undefined}
    />);

    expect(markup).toContain('새 발명품 공개');
    expect(markup).toContain('각지에서 온 야수들이 현지 장인발 길드원의 최신 발명품 공개를 보려고 모였습니다.');
    expect(markup).toContain('공개 지켜보기');
    expect(markup).toContain('몸을 사리기');
    expect(markup).toContain('저장 당시 문구 보기');
    expect(markup.indexOf('치명적으로 잘못')).toBeGreaterThan(markup.indexOf('저장 당시 문구 보기'));
    expect(markup).not.toContain('고개 숙이기');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).not.toContain('<select');
  });

  it('keeps the player-facing sequence in decision order', () => {
    const markup = renderToStaticMarkup(<ManualEffectPanel
      draft={staleProjectLaunchDraft}
      onChange={() => undefined}
      onDefer={() => undefined}
      onResolve={() => undefined}
    />);

    const why = markup.indexOf('왜 직접 고르나요?');
    const scene = markup.indexOf('장면을 읽고 고르기');
    const changes = markup.indexOf('바뀌는 값 확인하기');
    const record = markup.indexOf('결과를 기록하기');
    expect(why).toBeLessThan(scene);
    expect(scene).toBeLessThan(changes);
    expect(changes).toBeLessThan(record);
  });

  it('does not relabel a nested choice list with the top-level encounter choices', () => {
    const nestedChoiceDraft: ManualEffectDraft = {
      ...staleProjectLaunchDraft,
      effectId: 'betting-nested-choice',
      ownerId: 'social-forest-summer-♣',
      summary: 'Betting Match',
      printedText: 'Betting Match',
      choices: ['An Opportunity', 'Place a Bet'],
      inputFields: [
        {
          id: 'printed-choice',
          type: 'choice',
          label: '적용한 원문 분기 또는 선택',
          required: true,
          options: ['An Opportunity', 'Place a Bet']
        },
        {
          id: 'betting-opportunity-choice',
          type: 'choice',
          label: '뜻밖의 기회 결과',
          required: true,
          options: ['A Snack!', 'A Friend!']
        }
      ],
      inputValues: { 'printed-choice': 'An Opportunity' }
    };

    const markup = renderToStaticMarkup(<ManualEffectPanel
      draft={nestedChoiceDraft}
      onChange={() => undefined}
      onDefer={() => undefined}
      onResolve={() => undefined}
    />);

    expect(markup).toContain('A Snack!');
    expect(markup).toContain('A Friend!');
  });

  it('renders one authoritative selector for an affected inventory item', () => {
    const inventoryTargetDraft: ManualEffectDraft = {
      ...staleProjectLaunchDraft,
      effectId: 'inventory-target',
      inputFields: [],
      inputValues: {},
      actionTemplates: [{
        id: 'remove-item',
        kind: 'remove-inventory',
        label: '영향을 받은 물품 버리기',
        sourceText: 'Discard the affected item.',
        targetType: 'inventory-item',
        required: true
      }],
      selectedActionIds: ['remove-item'],
      actionTargets: {}
    };

    const markup = renderToStaticMarkup(<ManualEffectPanel
      draft={inventoryTargetDraft}
      inventoryItems={[{ id: 'parcel', name: 'Parcel' }]}
      onChange={() => undefined}
      onDefer={() => undefined}
      onResolve={() => undefined}
    />);

    expect(markup.match(/<select/g)).toHaveLength(1);
    expect(markup).toContain('value="parcel"');
    expect(markup).not.toContain('영향을 받은 물품 또는 자원');
  });

  it('offers the current map node and existing nodes for map records', () => {
    const draft: ManualEffectDraft = {
      ...staleProjectLaunchDraft,
      inputFields: [{
        id: 'map-target',
        type: 'target',
        label: '기록할 지도 위치',
        required: true
      }],
      inputValues: {},
      mapTargetIds: {},
      resultSummary: '기록'
    };
    const markup = renderToStaticMarkup(<ManualEffectPanel
      draft={draft}
      mapLocations={[{ id: 'odoak', name: 'Odoak', region: 'Forest', kind: 'city' }, { id: 'loc-1', name: '숲 위치 1', region: 'Forest', kind: 'wild' }]}
      currentLocation={{ id: 'odoak', name: 'Odoak', region: 'Forest', kind: 'city' }}
      onChange={() => undefined}
      onDefer={() => undefined}
      onResolve={() => undefined}
    />);

    expect(markup).toContain('이 장소에 표기 · Odoak');
    expect(markup).toContain('기존 지도 위치에서 선택');
    expect(markup).toContain('숲 위치 1');
  });

  it('does not offer the current-place shortcut for last-seen directions', () => {
    const draft: ManualEffectDraft = {
      ...staleProjectLaunchDraft,
      inputFields: [],
      inputValues: {},
      actionTemplates: [{
        id: 'last-seen',
        kind: 'record-map-change',
        label: '지도 변경 기록',
        targetType: 'location',
        sourceText: 'Show on the map where you last saw the fugitive.'
      }],
      selectedActionIds: ['last-seen'],
      actionTargets: {},
      resultSummary: '기록',
      journalNote: '기록'
    };
    const markup = renderToStaticMarkup(<ManualEffectPanel
      draft={draft}
      mapLocations={[{ id: 'odoak', name: 'Odoak', region: 'Forest', kind: 'city' }]}
      currentLocation={{ id: 'odoak', name: 'Odoak', region: 'Forest', kind: 'city' }}
      onChange={() => undefined}
      onDefer={() => undefined}
      onResolve={() => undefined}
    />);

    expect(markup).not.toContain('이 장소에 표기 · Odoak');
    expect(markup).toContain('기존 지도 위치에서 선택');
  });

  it.each([
    { name: 'unchecked condition', inputValues: { confirmation: false, choice: 'Allowed choice' } },
    { name: 'string-shaped condition', inputValues: { confirmation: 'true', choice: 'Allowed choice' } },
    { name: 'choice outside printed options', inputValues: { confirmation: true, choice: 'Forged choice' } }
  ] as const)('keeps resolution disabled for a malformed required $name', ({ inputValues }) => {
    const draft: ManualEffectDraft = {
      ...staleProjectLaunchDraft,
      inputFields: [{
        id: 'confirmation',
        type: 'condition',
        label: 'Confirm printed condition',
        required: true
      }, {
        id: 'choice',
        type: 'choice',
        label: 'Printed choice',
        required: true,
        options: ['Allowed choice']
      }],
      inputValues,
      resultSummary: 'Recorded result'
    };
    const markup = renderToStaticMarkup(<ManualEffectPanel
      draft={draft}
      onChange={() => undefined}
      onDefer={() => undefined}
      onResolve={() => undefined}
    />);

    expect(primaryActionTag(markup)).toContain('disabled=""');
  });

  it('enables resolution only when the condition is true and the choice is printed', () => {
    const draft: ManualEffectDraft = {
      ...staleProjectLaunchDraft,
      inputFields: [{
        id: 'confirmation',
        type: 'condition',
        label: 'Confirm printed condition',
        required: true
      }, {
        id: 'choice',
        type: 'choice',
        label: 'Printed choice',
        required: true,
        options: ['Allowed choice']
      }],
      inputValues: { confirmation: true, choice: 'Allowed choice' },
      resultSummary: 'Recorded result'
    };
    const markup = renderToStaticMarkup(<ManualEffectPanel
      draft={draft}
      onChange={() => undefined}
      onDefer={() => undefined}
      onResolve={() => undefined}
    />);

    expect(primaryActionTag(markup)).not.toContain('disabled');
  });
});
