import { useEffect, useMemo, useRef, useState } from 'react';
import { RULEBOOK_REFERENCE_BY_ID, searchReferenceEntries } from '../rulebook/referenceRegistry';
import { loadRulebookPage } from '../rulebook/sourceLoader';
import type { RulebookReferenceEntry, RulebookReferenceRequest, RulebookSourcePage } from '../rulebook/types';

export default function RulebookReferenceDrawer({ request, onClose }: { request: RulebookReferenceRequest; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [source, setSource] = useState<RulebookSourcePage | null>(null);
  const [activeId, setActiveId] = useState(request.entryId || '');
  const candidates = useMemo(() => request.entryId
    ? [RULEBOOK_REFERENCE_BY_ID.get(request.entryId)].filter(Boolean) as RulebookReferenceEntry[]
    : searchReferenceEntries(request.query || `p.${request.page || 6}`).slice(0, 24), [request.entryId, request.page, request.query]);
  const active = RULEBOOK_REFERENCE_BY_ID.get(activeId) || candidates[0] || null;
  const page = active?.sourcePage || request.page || 6;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const dialog = closeRef.current?.closest('[role="dialog"]');
      const focusable = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')) : [];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    loadRulebookPage(page).then(row => { if (!cancelled) setSource(row); }).catch(() => { if (!cancelled) setSource(null); });
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="rulebook-drawer-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="rulebook-drawer" role="dialog" aria-modal="true" aria-labelledby="rulebook-drawer-title">
        <header><div><span className="document-kicker">Contextual Rulebook</span><h2 id="rulebook-drawer-title">{request.title || active?.title || `Rulebook p.${page}`}</h2></div><button ref={closeRef} type="button" onClick={onClose}>닫기</button></header>
        {candidates.length > 1 && <nav aria-label="관련 원문 항목">{candidates.map(entry => <button type="button" key={entry.id} className={active?.id === entry.id ? 'is-active' : ''} onClick={() => setActiveId(entry.id)}>{entry.title}<span>p.{entry.sourcePage}</span></button>)}</nav>}
        {active && <section className="rulebook-drawer__context"><span>{active.kind} · {active.runtimeStatus}</span><p>{active.summary}</p><dl>{[...(request.context || []), ...active.details].map(row => <div key={`${row.label}:${row.value}`}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></section>}
        {active && active.relatedIds.length > 0 && <nav className="rulebook-drawer__related" aria-label="관련 규칙과 표">{active.relatedIds.slice(0, 24).map(id => { const related = RULEBOOK_REFERENCE_BY_ID.get(id); return related ? <button type="button" key={id} className={active.id === id ? 'is-active' : ''} onClick={() => setActiveId(id)}>{related.title}<span>{related.kind} · p.{related.sourcePage}</span></button> : null; })}</nav>}
        <section className="rulebook-source-text"><h3>원본 Rulebook · p.{page}</h3><pre>{source?.page === page ? source.text : '원문 페이지를 불러오는 중...'}</pre></section>
      </aside>
    </div>
  );
}
