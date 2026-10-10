import { useEffect, useMemo, useRef, useState } from 'react';
import { RULEBOOK_REFERENCE_BY_ID } from '../rulebook/referenceRegistry';
import { readableReference, referenceChoices, searchReadableReferences } from '../rulebook/readingPresentation';
import { selectRulebookSource } from '../rulebook/sourceSelection';
import type { RulebookReferenceEntry, RulebookReferenceRequest } from '../rulebook/types';
import ReaderGuide from './ReaderGuide';
import RulebookSourceText from './RulebookSourceText';
import { useDialogFocus } from './useDialogFocus';
import {
  formatRulebookDetailValue,
  RULEBOOK_DETAIL_LABELS,
  RULEBOOK_KIND_LABELS,
  RULEBOOK_STATUS_LABELS
} from './rulebookPresentation';

export default function RulebookReferenceDrawer({ request, onClose }: { request: RulebookReferenceRequest; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  const candidates = useMemo(() => request.entryId
    ? [RULEBOOK_REFERENCE_BY_ID.get(request.entryId)].filter(Boolean) as RulebookReferenceEntry[]
    : searchReadableReferences(request.query || `p.${request.page || 6}`).slice(0, 24), [request.entryId, request.page, request.query]);
  const initialId = request.entryId || candidates[0]?.id || '';
  const [trail, setTrail] = useState<{ ids: string[]; index: number }>(() => initialId ? { ids: [initialId], index: 0 } : { ids: [], index: -1 });
  const activeId = trail.index >= 0 ? trail.ids[trail.index] : '';
  const canonicalActive = RULEBOOK_REFERENCE_BY_ID.get(activeId) || candidates[0] || null;
  const active = canonicalActive ? readableReference(canonicalActive) : null;
  const relatedEntries = (active?.relatedIds || []).map(id => RULEBOOK_REFERENCE_BY_ID.get(id)).filter(Boolean) as RulebookReferenceEntry[];
  const source = selectRulebookSource(active, request.page, trail.index);
  const page = source.page;

  const openEntry = (id: string) => setTrail(current => {
    const prefix = current.ids.slice(0, current.index + 1);
    if (prefix[prefix.length - 1] === id) return current;
    const ids = [...prefix, id];
    return { ids, index: ids.length - 1 };
  });

  const moveInTrail = (offset: number) => setTrail(current => ({
    ...current,
    index: Math.max(0, Math.min(current.ids.length - 1, current.index + offset))
  }));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const locksPageScroll = window.matchMedia('(max-width: 820px)').matches;
    if (locksPageScroll) document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      if (locksPageScroll) document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="rulebook-drawer-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
      <aside ref={dialogRef} tabIndex={-1} className="rulebook-drawer" role="dialog" aria-modal="true" aria-labelledby="rulebook-drawer-title">
        <header><div><span className="document-kicker">상황별 룰북</span><h2 id="rulebook-drawer-title">{active?.title || request.title || `룰북 p.${page}`}</h2></div><div className="rulebook-drawer__actions"><button type="button" disabled={trail.index <= 0} onClick={() => moveInTrail(-1)} aria-label="이전 참고 기록">←</button><button type="button" disabled={trail.index >= trail.ids.length - 1} onClick={() => moveInTrail(1)} aria-label="다음 참고 기록">→</button><button ref={closeRef} type="button" onClick={onClose}>닫고 돌아가기</button></div></header>
        {candidates.length > 1 && <nav aria-label="관련 원문 항목">{candidates.map(entry => <button type="button" key={entry.id} className={active?.id === entry.id ? 'is-active' : ''} onClick={() => openEntry(entry.id)}>{readableReference(entry).title}<span>{RULEBOOK_KIND_LABELS[entry.kind]} · p.{entry.sourcePage}</span></button>)}</nav>}
        {active && <section className="rulebook-drawer__context"><span>{RULEBOOK_KIND_LABELS[active.kind]} · {RULEBOOK_STATUS_LABELS[active.runtimeStatus]}</span><p>{active.summary}</p><dl>{[...(request.context || []), ...active.details].map(row => <div key={`${row.label}:${row.value}`}><dt>{RULEBOOK_DETAIL_LABELS[row.label] || row.label}</dt><dd>{formatRulebookDetailValue(row.label, row.value)}</dd></div>)}</dl></section>}
        {active && referenceChoices(active).length > 0 && <section><h3>이 장면의 선택과 결과</h3><ul className="reference-choices">{referenceChoices(active).map((choice, index) => <li key={index}>{choice}</li>)}</ul></section>}
        <ReaderGuide page={page} />
        <RulebookSourceText page={page} endPage={source.endPage} />
        {active && relatedEntries.length > 0 && <nav className="rulebook-drawer__related" aria-label="관련 규칙과 표">{relatedEntries.slice(0, 28).map(related => <button type="button" key={related.id} className={active.id === related.id ? 'is-active' : ''} onClick={() => openEntry(related.id)}>{readableReference(related).title}<span>{RULEBOOK_KIND_LABELS[related.kind]} · p.{related.sourcePage}</span></button>)}{relatedEntries.length > 28 && <details className="rulebook-related-overflow"><summary>나머지 관계 {relatedEntries.length - 28}개 보기</summary><div>{relatedEntries.slice(28).map(related => <button type="button" key={related.id} onClick={() => openEntry(related.id)}>{readableReference(related).title}<span>{RULEBOOK_KIND_LABELS[related.kind]} · p.{related.sourcePage}</span></button>)}</div></details>}</nav>}
      </aside>
    </div>
  );
}
