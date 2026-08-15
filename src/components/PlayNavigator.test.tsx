import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PlayNavigator } from './PlayNavigator';

const actions = [
  { id: 'encounter', label: '미해결 이동 조우', detail: '판정을 먼저 해결합니다.', tone: 'warning' as const },
  { id: 'travel', label: '다음 위치로 이동', detail: '지도를 보고 목적지를 고릅니다.' },
  { id: 'clinic', label: '새 환자 진료', detail: '현재 위치에서 환자를 만납니다.' }
];

const signals = [
  { label: '일정', value: '4일', detail: '8/12일 진행', tone: 'watch' as const },
  { label: '보류', value: '1건', detail: '먼저 해결', tone: 'urgent' as const }
];

describe('PlayNavigator', () => {
  it('presents one primary action, two upcoming actions, and safety signals', () => {
    const html = renderToStaticMarkup(
      <PlayNavigator
        actions={actions}
        primaryActionId="encounter"
        signals={signals}
        handoffNote=""
        savedHandoffNote=""
        onActivate={() => undefined}
        onHandoffNoteChange={() => undefined}
        onSaveHandoff={() => undefined}
      />
    );

    expect(html).toContain('data-play-primary-action="true"');
    expect(html).toContain('미해결 이동 조우');
    expect(html).toContain('다음 위치로 이동');
    expect(html).toContain('새 환자 진료');
    expect(html).toContain('is-urgent');
    expect(html).toContain('<kbd>N</kbd>');
  });

  it('shows the saved handoff time and locks an unchanged checkpoint', () => {
    const html = renderToStaticMarkup(
      <PlayNavigator
        actions={actions}
        signals={signals}
        handoffNote="Widim에서 환자를 먼저 찾기"
        savedHandoffNote="Widim에서 환자를 먼저 찾기"
        handoffSavedAt="2026-08-15T09:30:00.000Z"
        onActivate={() => undefined}
        onHandoffNoteChange={() => undefined}
        onSaveHandoff={() => undefined}
      />
    );

    expect(html).toContain('다음 접속을 위한 중단 메모');
    expect(html).toContain('Widim에서 환자를 먼저 찾기');
    expect(html).toContain('disabled=""');
  });
});
