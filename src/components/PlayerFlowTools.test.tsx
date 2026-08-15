import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  DepartureGate,
  QuickCommandPalette,
  SessionCloseAssistant,
  StateIntegrityPanel,
  TravelTimeline
} from './PlayerFlowTools';

describe('PlayerFlowTools', () => {
  it('blocks departure and explains the expected state changes', () => {
    const html = renderToStaticMarkup(
      <DepartureGate
        open
        title="Oak Road → Whitebirch"
        subtitle="Forest · Wilds · 2 paths"
        checks={[
          { id: 'route', label: '지도 경로', detail: '2 paths', status: 'ok' },
          { id: 'pending', label: '미해결 절차', detail: '1건', status: 'blocked', actionLabel: '보류함 열기' }
        ]}
        deltas={[{ label: '위치', before: 'Oak Road', after: 'Whitebirch' }]}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        onFix={() => undefined}
      />
    );

    expect(html).toContain('FINAL DEPARTURE GATE');
    expect(html).toContain('Oak Road → Whitebirch');
    expect(html).toContain('disabled=""');
    expect(html).toContain('직전 행동 되돌리기');
  });

  it('renders integrity, automatic timeline, command search, and session close surfaces', () => {
    const integrity = renderToStaticMarkup(
      <StateIntegrityPanel
        issues={[{ id: 'timer', label: '만료된 활성 환자 타이머', detail: '1개', status: 'warning' }]}
        onResolve={() => undefined}
      />
    );
    const timeline = renderToStaticMarkup(
      <TravelTimeline entries={[{ id: 'move', title: 'Oak Road → Whitebirch', meta: '2 paths', detail: 'Encounter 해결', timestamp: 1, tone: 'move' }]} />
    );
    const palette = renderToStaticMarkup(
      <QuickCommandPalette
        open
        query="지도"
        commands={[{ id: 'map', label: '큰 지도 열기', detail: '전체 지도', group: '여행', onSelect: () => undefined }]}
        onQueryChange={() => undefined}
        onClose={() => undefined}
      />
    );
    const close = renderToStaticMarkup(
      <SessionCloseAssistant
        open
        checks={[{ id: 'save', label: '자동 저장', detail: '저장됨', status: 'ok' }]}
        summary={[{ label: '현재 위치', value: 'Oak Road' }]}
        note="다음에 Whitebirch로 이동"
        onNoteChange={() => undefined}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />
    );

    expect(integrity).toContain('STATE CHECK');
    expect(timeline).toContain('AUTO TRAVEL LOG');
    expect(palette).toContain('큰 지도 열기');
    expect(close).toContain('오늘 플레이를 안전하게 덮기');
  });
});
