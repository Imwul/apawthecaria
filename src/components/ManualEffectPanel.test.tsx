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
});
