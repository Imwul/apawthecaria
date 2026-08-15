export type PlayNavigatorTone = 'primary' | 'warning' | 'neutral' | 'done';

export interface PlayNavigatorAction {
  id: string;
  label: string;
  detail: string;
  meta?: string;
  tone?: PlayNavigatorTone;
  disabled?: boolean;
}

export interface PlayNavigatorSignal {
  label: string;
  value: string;
  detail: string;
  tone?: 'stable' | 'watch' | 'urgent';
}

interface PlayNavigatorProps {
  actions: PlayNavigatorAction[];
  primaryActionId?: string;
  signals: PlayNavigatorSignal[];
  handoffNote: string;
  savedHandoffNote: string;
  handoffSavedAt?: string | null;
  onActivate: (actionId: string) => void;
  onHandoffNoteChange: (value: string) => void;
  onSaveHandoff: () => void;
}

const formatSavedTime = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function PlayNavigator({
  actions,
  primaryActionId,
  signals,
  handoffNote,
  savedHandoffNote,
  handoffSavedAt,
  onActivate,
  onHandoffNoteChange,
  onSaveHandoff
}: PlayNavigatorProps) {
  const enabledActions = actions.filter(action => !action.disabled);
  const primary = enabledActions.find(action => action.id === primaryActionId) || enabledActions[0];
  if (!primary) return null;

  const upcoming = enabledActions.filter(action => action.id !== primary.id).slice(0, 2);
  const savedTime = formatSavedTime(handoffSavedAt);
  const handoffDirty = handoffNote !== savedHandoffNote || !handoffSavedAt;

  return (
    <section className={`play-navigator play-navigator--${primary.tone || 'neutral'}`} aria-label="플레이 내비게이터">
      <header className="play-navigator__header">
        <div>
          <span>PLAY NAVIGATOR · NOW</span>
          <h2>{primary.label}</h2>
          <p>{primary.detail}</p>
          {primary.meta && <small>{primary.meta}</small>}
        </div>
        <button
          type="button"
          className="play-navigator__primary"
          data-play-primary-action="true"
          onClick={() => onActivate(primary.id)}
        >
          <span>지금 진행</span>
          <kbd>N</kbd>
        </button>
      </header>

      <div className="play-navigator__body">
        <section className="play-navigator__queue" aria-label="이어지는 행동">
          <span>NEXT</span>
          {upcoming.length > 0 ? (
            <ol>
              {upcoming.map((action, index) => (
                <li key={action.id}>
                  <button type="button" onClick={() => onActivate(action.id)}>
                    <em>{index + 2}</em>
                    <span><strong>{action.label}</strong><small>{action.detail}</small></span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p>현재 행동을 마치면 다음 절차가 자동으로 표시됩니다.</p>
          )}
        </section>

        <dl className="play-navigator__signals" aria-label="진행 안전 신호">
          {signals.map(signal => (
            <div key={signal.label} className={`is-${signal.tone || 'stable'}`}>
              <dt>{signal.label}</dt>
              <dd>{signal.value}</dd>
              <small>{signal.detail}</small>
            </div>
          ))}
        </dl>
      </div>

      <details className="play-navigator__handoff">
        <summary>
          <span>다음 접속을 위한 중단 메모</span>
          <small>{savedTime ? `${savedTime} 저장` : '아직 저장하지 않음'}</small>
        </summary>
        <div>
          <textarea
            rows={2}
            value={handoffNote}
            onChange={event => onHandoffNoteChange(event.target.value)}
            placeholder="다음에 열었을 때 기억해야 할 판단이나 계획을 짧게 적으세요."
          />
          <button type="button" onClick={onSaveHandoff} disabled={!handoffDirty}>중단 지점 저장</button>
        </div>
      </details>
    </section>
  );
}
