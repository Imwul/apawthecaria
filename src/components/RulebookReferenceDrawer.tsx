import { useEffect, useMemo, useRef, useState } from 'react';
import { RULEBOOK_REFERENCE_BY_ID, searchReferenceEntries } from '../rulebook/referenceRegistry';
import { loadRulebookPage } from '../rulebook/sourceLoader';
import type { RulebookReferenceEntry, RulebookReferenceRequest, RulebookSourcePage } from '../rulebook/types';
import { localizeRegionLabel, localizeSeasonLabel } from '../localization/gameplayKo';

const DETAIL_LABELS: Record<string, string> = {
  'Canonical name': '원문 이름', Type: '분류', Category: '범주', 'Base Rarity': '기본 희귀도', Preparation: '조제법', Region: '지역', Season: '계절', Ingredient: '영약재', Potency: '약효', Weight: '무게', Uses: '사용 횟수', 'Required Tool': '필요 도구', Restrictions: '특수 조건', Location: '구입 위치', Cost: '가격', Effect: '효과', Trigger: '발동 조건', Severity: '중증도', Timer: '남은 시간', Requirement: '필요 약효', Stacks: '중첩 여부', Replacement: '대체 도구', 'Canonical consumer': '앱 적용 경로', 'Related remedies': '관련 처방 재료', 'Related ailments': '관련 질환', 'Canonical handling': '앱 처리 방식', 'Source section': '원문 구간'
};

const KIND_LABELS: Record<string, string> = { ingredient: '영약재', remedy: '처방 재료', tag: '약효 태그', ailment: '질환', tool: '도구', region: '지역', season: '계절', procedure: '절차', rule: '챕터' };
const STATUS_LABELS: Record<string, string> = { canonical: '정식 데이터', automatic: '자동 처리', manual: '직접 판정', ambiguous: '원문 확인 필요', 'reference-only': '원문 참고' };

const formatDetailValue = (label: string, value: string) => {
  if (label === 'Cost' && value === 'Not sold') return '판매하지 않음';
  if (label === 'Location' && value === 'Starting / special') return '시작 장비 또는 특수 획득';
  if (label === 'Region' || label === 'Season') return value.split(' / ').map(pair => {
    const [id, availability] = pair.split(':').map(part => part.trim());
    const localizedId = label === 'Region' ? localizeRegionLabel(id) : localizeSeasonLabel(id);
    const localizedAvailability = ({ Common: '흔함', Rare: '드묾', Unavailable: '없음' } as Record<string, string>)[availability] || availability;
    return `${localizedId}: ${localizedAvailability}`;
  }).join(' · ');
  if (label !== 'Weight') return value;
  const weight = Number(value);
  if (!Number.isFinite(weight)) return value;
  if (Math.abs(weight - 1 / 3) < 0.001) return '1/3';
  if (Math.abs(weight - 2 / 3) < 0.001) return '2/3';
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
};

export default function RulebookReferenceDrawer({ request, onClose }: { request: RulebookReferenceRequest; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [source, setSource] = useState<RulebookSourcePage | null>(null);
  const candidates = useMemo(() => request.entryId
    ? [RULEBOOK_REFERENCE_BY_ID.get(request.entryId)].filter(Boolean) as RulebookReferenceEntry[]
    : searchReferenceEntries(request.query || `p.${request.page || 6}`).slice(0, 24), [request.entryId, request.page, request.query]);
  const initialId = request.entryId || candidates[0]?.id || '';
  const [trail, setTrail] = useState<{ ids: string[]; index: number }>(() => initialId ? { ids: [initialId], index: 0 } : { ids: [], index: -1 });
  const activeId = trail.index >= 0 ? trail.ids[trail.index] : '';
  const active = RULEBOOK_REFERENCE_BY_ID.get(activeId) || candidates[0] || null;
  const relatedEntries = (active?.relatedIds || []).map(id => RULEBOOK_REFERENCE_BY_ID.get(id)).filter(Boolean) as RulebookReferenceEntry[];
  const page = active?.sourcePage || request.page || 6;

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
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const locksPageScroll = window.matchMedia('(max-width: 820px)').matches;
    if (locksPageScroll) document.body.style.overflow = 'hidden';
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
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (locksPageScroll) document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    loadRulebookPage(page).then(row => { if (!cancelled) setSource(row); }).catch(() => { if (!cancelled) setSource(null); });
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="rulebook-drawer-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="rulebook-drawer" role="dialog" aria-modal="true" aria-labelledby="rulebook-drawer-title">
        <header><div><span className="document-kicker">Contextual Rulebook</span><h2 id="rulebook-drawer-title">{active?.title || request.title || `Rulebook p.${page}`}</h2></div><div className="rulebook-drawer__actions"><button type="button" disabled={trail.index <= 0} onClick={() => moveInTrail(-1)} aria-label="이전 참고 기록">←</button><button type="button" disabled={trail.index >= trail.ids.length - 1} onClick={() => moveInTrail(1)} aria-label="다음 참고 기록">→</button><button ref={closeRef} type="button" onClick={onClose}>플레이로 돌아가기</button></div></header>
        {candidates.length > 1 && <nav aria-label="관련 원문 항목">{candidates.map(entry => <button type="button" key={entry.id} className={active?.id === entry.id ? 'is-active' : ''} onClick={() => openEntry(entry.id)}>{entry.title}<span>{KIND_LABELS[entry.kind] || entry.kind} · p.{entry.sourcePage}</span></button>)}</nav>}
        {active && <section className="rulebook-drawer__context"><span>{KIND_LABELS[active.kind] || active.kind} · {STATUS_LABELS[active.runtimeStatus] || active.runtimeStatus}</span><p>{active.summary}</p><dl>{[...(request.context || []), ...active.details].map(row => <div key={`${row.label}:${row.value}`}><dt>{DETAIL_LABELS[row.label] || row.label}</dt><dd>{formatDetailValue(row.label, row.value)}</dd></div>)}</dl></section>}
        {active && relatedEntries.length > 0 && <nav className="rulebook-drawer__related" aria-label="관련 규칙과 표">{relatedEntries.slice(0, 28).map(related => <button type="button" key={related.id} className={active.id === related.id ? 'is-active' : ''} onClick={() => openEntry(related.id)}>{related.title}<span>{KIND_LABELS[related.kind] || related.kind} · p.{related.sourcePage}</span></button>)}{relatedEntries.length > 28 && <details className="rulebook-related-overflow"><summary>나머지 관계 {relatedEntries.length - 28}개 보기</summary><div>{relatedEntries.slice(28).map(related => <button type="button" key={related.id} onClick={() => openEntry(related.id)}>{related.title}<span>{KIND_LABELS[related.kind] || related.kind} · p.{related.sourcePage}</span></button>)}</div></details>}</nav>}
        <details className="rulebook-source-text"><summary>원본 Rulebook · p.{page} 펼치기</summary><pre>{source?.page === page ? source.text : '원문 페이지를 불러오는 중...'}</pre></details>
      </aside>
    </div>
  );
}
