import { useId, useState } from 'react';
import { GUIDE_PAGES, getFirstPlayMilestones, getGuideNextAction, searchGuideTerms, type GuideTarget, type PlayGuideState } from '../playGuide';
import type { RulebookReferenceRequest } from '../rulebook/types';
import type { JournalTab } from '../sessionNavigation';

export interface PlayGuideProps {
  state: PlayGuideState;
  tab: JournalTab;
  mode?: 'help-only' | 'contextual';
  onNavigate: (tab: JournalTab, targetId?: string, actionId?: string) => void;
  onOpenReference: (request: RulebookReferenceRequest) => void;
}

/** Guidance never changes the campaign; every shortcut uses the existing UI. */
export default function PlayGuide({ state, tab, mode = 'contextual', onNavigate, onOpenReference }: PlayGuideProps) {
  const id = useId();
  const [query, setQuery] = useState('');
  const next = getGuideNextAction(state);
  const page = GUIDE_PAGES[tab];
  const milestones = getFirstPlayMilestones(state);
  const terms = searchGuideTerms(query);
  const completed = milestones.filter(step => step.complete).length;
  const helpOnly = mode === 'help-only';
  // Ordinary next steps belong to help on reference pages. Keep existing
  // unfinished/urgent gameplay obligations visible without opening help.
  const showOverview = !helpOnly && Boolean(next.urgent);
  const navigate = (target: GuideTarget) => onNavigate(target.tab, target.targetId, target.actionId);

  return (
    <section id="play-guide" tabIndex={-1} className={`play-guide${!showOverview ? ' play-guide--help-only' : ''}${next.urgent ? ' play-guide--urgent' : ''}`} aria-labelledby={`${id}-title`}>
      {showOverview && <div className="play-guide__overview">
        <div className="play-guide__copy">
          <p className="play-guide__eyebrow">작은 여행 길잡이 · {next.urgent ? '먼저 마칠 일' : '지금의 한 걸음'}</p>
          <h2 id={`${id}-title`} className="play-guide__title">{next.title}</h2>
          <p className="play-guide__reason">{next.reason}</p>
        </div>
        <button type="button" className="play-guide__action" onClick={() => navigate(next)}>
          {next.label}<span aria-hidden="true"> ↗</span>
        </button>
      </div>}

      <details className="play-guide__details">
        <summary id={!showOverview ? `${id}-title` : undefined} className="play-guide__summary">
          <span>{helpOnly ? '플레이 도움말 · 지금 단계와 규칙' : '이 화면 사용법과 규칙'}</span>
          {!helpOnly && <span>첫 플레이 순서 · 용어 찾기</span>}
        </summary>
        <div className="play-guide__body">
          {!showOverview && <section className="play-guide__current" aria-labelledby={`${id}-current-title`}>
            <p className="play-guide__eyebrow">{next.urgent ? '먼저 마칠 일' : '지금의 한 걸음'}</p>
            <h3 id={`${id}-current-title`} className="play-guide__title">{next.title}</h3>
            <p className="play-guide__reason">{next.reason}</p>
            {!helpOnly && <button type="button" className="play-guide__action" onClick={() => navigate(next)}>
              {next.label}<span aria-hidden="true"> ↗</span>
            </button>}
          </section>}
          <section className="play-guide__section" aria-labelledby={`${id}-page-title`}>
            <div className="play-guide__section-heading">
              <h3 id={`${id}-page-title`}>{page.title}</h3>
              <button type="button" className="play-guide__reference" onClick={() => onOpenReference(page.reference)}>규칙 근거</button>
            </div>
            <ol className="play-guide__steps">
              {page.steps.map((step, index) => (
                <li key={step.title} className="play-guide__step">
                  <span className="play-guide__step-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <div className="play-guide__step-copy">
                    <h4>{step.title}</h4><p>{step.body}</p>
                    {step.target && <button type="button" onClick={() => navigate(step.target!)}>해당 화면으로 <span aria-hidden="true">→</span></button>}
                  </div>
                </li>
              ))}
            </ol>
            <p className="play-guide__tip"><strong>기억해 두세요</strong> {page.tip}</p>
          </section>

          <details className="play-guide__first-play">
            <summary>첫 플레이의 다섯 걸음 <span>{completed}/5 기록됨</span></summary>
            <p>저장된 여정·환자·약재 기록으로 해본 단계를 표시합니다. 지금 진행 중인 일은 위의 한 걸음 안내에서 이어가세요.</p>
            <ol>
              {milestones.map(step => (
                <li key={step.id} className={`play-guide__milestone${step.complete ? ' play-guide__milestone--complete' : ''}${step.current ? ' play-guide__milestone--current' : ''}`}>
                  <span className="play-guide__check" aria-hidden="true">{step.complete ? '✓' : '○'}</span>
                  <div><strong>{step.title}</strong><p>{step.body}</p></div>
                  <span>{step.complete ? '기록됨' : step.current ? '다음 경험' : '앞으로'}</span>
                </li>
              ))}
            </ol>
          </details>

          <details className="play-guide__glossary">
            <summary>낯선 말 찾기 <span>카드 · 약효 · 채집 · 거래</span></summary>
            <label htmlFor={`${id}-search`} className="play-guide__search">
              <span>궁금한 용어</span>
              <input id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="예: FP, FAIR, 치료 기한" autoComplete="off" />
            </label>
            <p className="play-guide__aliases" role="status">{query.trim() ? `${terms.length}개 용어를 찾았습니다.` : '한글과 영문 용어를 모두 검색할 수 있어요.'}</p>
            <dl>
              {terms.map(term => (
                <div className="play-guide__term" key={term.id}>
                  <dt className="play-guide__term-heading">{term.title}<span className="play-guide__aliases">{term.aliases.join(' · ')}</span></dt>
                  <dd><p>{term.description}</p>{term.example && <p className="play-guide__tip">{term.example}</p>}
                    <button type="button" className="play-guide__reference" onClick={() => onOpenReference(term.reference)}>규칙 근거</button>
                  </dd>
                </div>
              ))}
            </dl>
            {terms.length === 0 && <p className="play-guide__empty">검색 결과가 없습니다. 다른 이름이나 짧은 단어로 찾아보세요.</p>}
          </details>

          <button type="button" className="play-guide__reference" onClick={() => onOpenReference(next.reference)}>지금 단계의 규칙 근거</button>
        </div>
      </details>
    </section>
  );
}
