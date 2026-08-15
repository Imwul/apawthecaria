import { useEffect, useMemo, useRef } from 'react';

export type FlowStatus = 'ok' | 'warning' | 'blocked';

export interface FlowCheck {
  id: string;
  label: string;
  detail: string;
  status: FlowStatus;
  actionLabel?: string;
}

export interface OutcomeDelta {
  label: string;
  before?: string;
  after: string;
  tone?: 'neutral' | 'warning';
}

export interface IntegrityIssue extends FlowCheck {
  targetId?: string;
}

export interface TravelTimelineEntry {
  id: string;
  title: string;
  meta: string;
  detail: string;
  timestamp: number;
  tone?: 'move' | 'encounter' | 'session';
}

export interface FlowCommand {
  id: string;
  label: string;
  detail: string;
  group: string;
  keywords?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export function DepartureGate({
  open,
  title,
  subtitle,
  checks,
  deltas,
  confirmLabel = '이 조건으로 출발',
  onCancel,
  onConfirm,
  onFix
}: {
  open: boolean;
  title: string;
  subtitle: string;
  checks: FlowCheck[];
  deltas: OutcomeDelta[];
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  onFix: (checkId: string) => void;
}) {
  if (!open) return null;
  const blocked = checks.some(check => check.status === 'blocked');

  return (
    <div className="flow-dialog-backdrop" role="presentation">
      <section className="flow-dialog departure-gate" role="dialog" aria-modal="true" aria-labelledby="departure-gate-title">
        <header>
          <div><span>FINAL DEPARTURE GATE</span><h2 id="departure-gate-title">{title}</h2><p>{subtitle}</p></div>
          <button type="button" aria-label="출발 점검 닫기" onClick={onCancel}>×</button>
        </header>
        <div className="departure-gate__body">
          <section>
            <h3>출발 조건</h3>
            <ul className="flow-check-list">
              {checks.map(check => (
                <li key={check.id} className={`is-${check.status}`}>
                  <span aria-hidden="true">{check.status === 'ok' ? '✓' : check.status === 'warning' ? '!' : '×'}</span>
                  <div><strong>{check.label}</strong><small>{check.detail}</small></div>
                  {check.actionLabel && <button type="button" onClick={() => onFix(check.id)}>{check.actionLabel}</button>}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3>확정하면 바뀌는 것</h3>
            <dl className="outcome-delta-list">
              {deltas.map(delta => (
                <div key={delta.label} className={delta.tone === 'warning' ? 'is-warning' : ''}>
                  <dt>{delta.label}</dt>
                  <dd>{delta.before && <del>{delta.before}</del>}<strong>{delta.after}</strong></dd>
                </div>
              ))}
            </dl>
            <p className="departure-gate__undo-note">확정 후에는 직전 행동 되돌리기로 이 이동 전 상태를 한 번 복원할 수 있습니다.</p>
          </section>
        </div>
        <footer>
          <button type="button" onClick={onCancel}>계획 수정</button>
          <button type="button" className="is-primary" onClick={onConfirm} disabled={blocked}>{blocked ? '막힌 조건을 먼저 해결하세요' : confirmLabel}</button>
        </footer>
      </section>
    </div>
  );
}

export function FlowUndoBanner({ label, onUndo, onDismiss }: { label: string; onUndo: () => void; onDismiss: () => void }) {
  return (
    <aside className="flow-undo" role="status" aria-label="직전 행동 되돌리기">
      <div><span>방금 반영됨</span><strong>{label}</strong></div>
      <button type="button" onClick={onUndo}>되돌리기</button>
      <button type="button" aria-label="되돌리기 알림 닫기" onClick={onDismiss}>×</button>
    </aside>
  );
}

export function StateIntegrityPanel({ issues, onResolve }: { issues: IntegrityIssue[]; onResolve: (issue: IntegrityIssue) => void }) {
  const blocking = issues.filter(issue => issue.status === 'blocked').length;
  const warning = issues.filter(issue => issue.status === 'warning').length;

  return (
    <details className={`integrity-panel${issues.length ? ' has-issues' : ' is-clean'}`}>
      <summary>
        <span>STATE CHECK</span>
        <strong>{issues.length ? `${blocking} blocked · ${warning} warning` : '상태 이상 없음'}</strong>
      </summary>
      {issues.length ? (
        <ul className="flow-check-list">
          {issues.map(issue => (
            <li key={issue.id} className={`is-${issue.status}`}>
              <span aria-hidden="true">{issue.status === 'blocked' ? '×' : '!'}</span>
              <div><strong>{issue.label}</strong><small>{issue.detail}</small></div>
              {(issue.actionLabel || issue.targetId) && <button type="button" onClick={() => onResolve(issue)}>{issue.actionLabel || '확인하기'}</button>}
            </li>
          ))}
        </ul>
      ) : <p>현재 위치, 여정, 보류 판정, 환자 타이머와 가방 기록이 서로 일치합니다.</p>}
    </details>
  );
}

export function TravelTimeline({ entries }: { entries: TravelTimelineEntry[] }) {
  if (!entries.length) return null;
  return (
    <details className="smart-travel-log">
      <summary><span>AUTO TRAVEL LOG</span><strong>{entries.length}개 기록</strong></summary>
      <ol>
        {entries.slice(0, 12).map(entry => (
          <li key={entry.id} className={`is-${entry.tone || 'move'}`}>
            <time>{new Date(entry.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</time>
            <div><strong>{entry.title}</strong><span>{entry.meta}</span><small>{entry.detail}</small></div>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function QuickCommandPalette({
  open,
  query,
  commands,
  onQueryChange,
  onClose
}: {
  open: boolean;
  query: string;
  commands: FlowCommand[];
  onQueryChange: (value: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => commands.filter(command => !normalized || `${command.label} ${command.detail} ${command.group} ${command.keywords || ''}`.toLowerCase().includes(normalized)), [commands, normalized]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Enter') {
        const command = filtered.find(row => !row.disabled);
        if (command) {
          event.preventDefault();
          command.onSelect();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtered, onClose, open]);

  if (!open) return null;
  return (
    <div className="flow-dialog-backdrop command-palette-backdrop" role="presentation">
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="빠른 행동 검색">
        <header><span>QUICK ACTION</span><kbd>⌘K</kbd></header>
        <input ref={inputRef} value={query} onChange={event => onQueryChange(event.target.value)} placeholder="이동, 지도, 환자, 세션 마감…" aria-label="행동 검색" />
        <div className="command-palette__results">
          {filtered.length ? filtered.map(command => (
            <button key={command.id} type="button" disabled={command.disabled} onClick={() => { command.onSelect(); onClose(); }}>
              <span>{command.group}</span><strong>{command.label}</strong><small>{command.detail}</small>
            </button>
          )) : <p>일치하는 행동이 없습니다.</p>}
        </div>
        <footer>Enter 첫 행동 실행 · Esc 닫기</footer>
      </section>
    </div>
  );
}

export function SessionCloseAssistant({
  open,
  checks,
  summary,
  note,
  onNoteChange,
  onCancel,
  onConfirm
}: {
  open: boolean;
  checks: FlowCheck[];
  summary: Array<{ label: string; value: string }>;
  note: string;
  onNoteChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="flow-dialog-backdrop" role="presentation">
      <section className="flow-dialog session-close" role="dialog" aria-modal="true" aria-labelledby="session-close-title">
        <header><div><span>SESSION CLOSE</span><h2 id="session-close-title">오늘 플레이를 안전하게 덮기</h2><p>미해결 절차와 다음 행동을 한 번에 저장합니다.</p></div><button type="button" aria-label="세션 마감 닫기" onClick={onCancel}>×</button></header>
        <div className="session-close__body">
          <dl>{summary.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
          <ul className="flow-check-list">{checks.map(check => <li key={check.id} className={`is-${check.status}`}><span>{check.status === 'ok' ? '✓' : '!'}</span><div><strong>{check.label}</strong><small>{check.detail}</small></div></li>)}</ul>
          <label>다음 접속에서 기억할 것<textarea rows={4} value={note} onChange={event => onNoteChange(event.target.value)} placeholder="다음 판단, 경로 계획, 환자 상태를 적어두세요." /></label>
        </div>
        <footer><button type="button" onClick={onCancel}>계속 플레이</button><button type="button" className="is-primary" onClick={onConfirm}>저장하고 세션 마감</button></footer>
      </section>
    </div>
  );
}
