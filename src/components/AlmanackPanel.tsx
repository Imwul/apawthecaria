import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ManualEffectDraft, ManualEffectRecord } from '../rules';
import {
  RULEBOOK_COVERAGE,
  RULEBOOK_REFERENCE_BY_ID,
  RULEBOOK_REFERENCE_ENTRIES,
  searchReferenceEntries
} from '../rulebook/referenceRegistry';
import { CHAPTER_FOR_PAGE } from '../rulebook/chapters';
import { loadPersonalRulebookState, savePersonalRulebookState } from '../rulebook/personalState';
import { loadRulebookPage, searchRulebookPages } from '../rulebook/sourceLoader';
import type {
  PersonalRulebookState,
  RulebookReferenceEntry,
  RulebookReferenceKind,
  RulebookSourcePage
} from '../rulebook/types';

type ResolutionFilter = 'all' | 'canonical' | 'automatic' | 'manual' | 'ambiguous' | 'reference-only' | 'pending' | 'resolved' | 'override';

const KIND_LABELS: Record<RulebookReferenceKind | 'all', string> = {
  all: '전체', rule: '챕터', procedure: '절차', encounter: '조우', ailment: '질환', 'printed-effect': '원문 효과', remedy: '처방 재료', ingredient: '영약재', tag: '태그', tool: '도구', service: '서비스', clinic: '약제소', wagon: '마차', companion: '동료', barrow: '고분', downtime: '다운타임', region: '지역', season: '계절', table: '표', example: '예시', guidance: '플레이 지침', source: '원문 페이지'
};

const STATUS_LABELS: Record<Exclude<ResolutionFilter, 'all'>, string> = {
  canonical: 'Canonical', automatic: '자동 처리', manual: '직접 판정', ambiguous: '원문 모호함', 'reference-only': '원문 참고', pending: '판정 대기', resolved: '해결 완료', override: '예외 기록'
};

const consultationCategories: PersonalRulebookState['consultations'][number]['category'][] = ['rule wording', 'encounter', 'ailment', 'remedy', 'table', 'map', 'season', 'example', 'guidance', 'terminology'];

const sourceEntry = (page: RulebookSourcePage): RulebookReferenceEntry => {
  const chapter = CHAPTER_FOR_PAGE(page.page);
  const firstLine = page.text.split('\n').map(line => line.trim()).find(Boolean) || `Rulebook p.${page.page}`;
  return {
    id: `source:p${page.page}`,
    kind: 'source',
    title: `p.${page.page} · ${firstLine.slice(0, 72)}`,
    summary: page.text.replace(/\s+/g, ' ').slice(0, 240),
    sourcePage: page.page,
    ruleIds: chapter?.ruleIds || [],
    runtimeStatus: 'reference-only',
    details: [{ label: 'Source section', value: chapter?.title || '원본 Rulebook' }],
    relatedIds: chapter ? [chapter.id] : [],
    searchText: page.text.toLowerCase()
  };
};

export default function AlmanackPanel({
  pendingManualEffects = [],
  manualEffectRecords = []
}: {
  ownedIds?: string[];
  discoveredIds?: string[];
  pendingManualEffects?: ManualEffectDraft[];
  manualEffectRecords?: ManualEffectRecord[];
}) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<RulebookReferenceKind | 'all'>('all');
  const [status, setStatus] = useState<ResolutionFilter>('all');
  const [visibleLimit, setVisibleLimit] = useState(80);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageResults, setPageResults] = useState<RulebookSourcePage[]>([]);
  const [sourcePage, setSourcePage] = useState<RulebookSourcePage | null>(null);
  const [personal, setPersonal] = useState<PersonalRulebookState>(() => loadPersonalRulebookState());
  const [consultationCategory, setConsultationCategory] = useState<PersonalRulebookState['consultations'][number]['category']>('rule wording');
  const [consultationReason, setConsultationReason] = useState('');

  const persistPersonal = useCallback((next: PersonalRulebookState) => {
    setPersonal(next);
    savePersonalRulebookState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!query.trim() || query.trim().length < 2) {
      return;
    }
    searchRulebookPages(query, 30).then(rows => {
      if (!cancelled) setPageResults(rows);
    }).catch(() => {
      if (!cancelled) setPageResults([]);
    });
    return () => { cancelled = true; };
  }, [query]);

  const statusFor = useCallback((entry: RulebookReferenceEntry): ResolutionFilter => {
    const ownerId = entry.ownerId;
    if (ownerId && pendingManualEffects.some(draft => draft.ownerId === ownerId)) return 'pending';
    const record = ownerId ? [...manualEffectRecords].reverse().find(candidate => candidate.ownerId === ownerId) : null;
    if (record?.override) return 'override';
    if (record) return 'resolved';
    return entry.runtimeStatus;
  }, [manualEffectRecords, pendingManualEffects]);

  const visible = useMemo(() => {
    const canonical = searchReferenceEntries(query, kind).filter(entry => status === 'all' || statusFor(entry) === status);
    const source = (kind === 'all' || kind === 'source') && query.trim().length >= 2 ? pageResults.map(sourceEntry).filter(entry => status === 'all' || status === 'reference-only') : [];
    const seen = new Set<string>();
    return [...canonical, ...source].filter(entry => !seen.has(entry.id) && seen.add(entry.id));
  }, [kind, pageResults, query, status, statusFor]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    if (selectedId.startsWith('source:p')) return pageResults.map(sourceEntry).find(entry => entry.id === selectedId) || null;
    return RULEBOOK_REFERENCE_BY_ID.get(selectedId) || null;
  }, [pageResults, selectedId]);

  useEffect(() => {
    let cancelled = false;
    if (!selected) return;
    loadRulebookPage(selected.sourcePage).then(page => {
      if (!cancelled) setSourcePage(page);
    }).catch(() => {
      if (!cancelled) setSourcePage(null);
    });
    return () => { cancelled = true; };
  }, [selected]);

  const openEntry = (id: string) => {
    setSelectedId(id);
    window.setTimeout(() => document.getElementById('rulebook-reference-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  const bookmarked = selected ? personal.bookmarks.includes(selected.id) : false;
  const note = selected ? personal.notes[selected.id] || '' : '';
  const sourceLoading = Boolean(selected && sourcePage?.page !== selected.sourcePage);

  return (
    <section className="almanack rulebook-hub" aria-labelledby="almanack-title">
      <header className="almanack__header rulebook-hub__header">
        <div>
          <span className="document-kicker">개인용 통합 Rulebook · First Edition, Third Printing</span>
          <h2 id="almanack-title">자연사 색인과 룰북</h2>
          <p>현재 행동에서 원문 맥락과 source page까지 이어 읽습니다. 직접 판정은 구현 누락이 아니라 원작의 선택과 서술을 보존한 절차입니다.</p>
        </div>
        <div className="almanack__counts" aria-label="통합 참조 항목 수"><strong>{RULEBOOK_REFERENCE_ENTRIES.length}</strong><span>연결 항목</span></div>
      </header>

      <div className="rulebook-coverage-strip" aria-label="룰북 이식 범위">
        <span>Travel <strong>{RULEBOOK_COVERAGE.travel}</strong></span>
        <span>Foraging <strong>{RULEBOOK_COVERAGE.foraging}</strong></span>
        <span>Social <strong>{RULEBOOK_COVERAGE.social}</strong></span>
        <span>Ailment <strong>{RULEBOOK_COVERAGE.ailments}</strong></span>
        <span>Printed Effect <strong>{RULEBOOK_COVERAGE.printedEffects}</strong></span>
        <span>Remedy Part <strong>{RULEBOOK_COVERAGE.remedies}</strong></span>
      </div>

      <div className="almanack__controls">
        <label><span>통합 검색</span><input value={query} onChange={event => { setQuery(event.target.value); setVisibleLimit(80); }} placeholder="rule, encounter, tag, p.171 검색" /></label>
        <label><span>분류</span><select value={kind} onChange={event => { setKind(event.target.value as RulebookReferenceKind | 'all'); setVisibleLimit(80); }}>{Object.entries(KIND_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label><span>처리 방식</span><select value={status} onChange={event => { setStatus(event.target.value as ResolutionFilter); setVisibleLimit(80); }}><option value="all">전체</option>{Object.entries(STATUS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </div>

      <div className="rulebook-index-summary">
        <span>검색 결과 {visible.length}개</span>
        <span>책갈피 {personal.bookmarks.length}개</span>
        <span>PDF 확인 기록 {personal.consultations.length}회</span>
      </div>

      <div className="almanack__index" role="list">
        {visible.slice(0, visibleLimit).map(entry => {
          const isBookmarked = personal.bookmarks.includes(entry.id);
          const resolutionStatus = statusFor(entry);
          return (
            <article key={entry.id} className={`almanack-entry ${selectedId === entry.id ? 'almanack-entry--selected' : ''}`} role="listitem">
              <button className="almanack-entry__favorite" aria-label={`${entry.title} 책갈피 ${isBookmarked ? '해제' : '추가'}`} aria-pressed={isBookmarked} onClick={() => persistPersonal({ ...personal, bookmarks: isBookmarked ? personal.bookmarks.filter(id => id !== entry.id) : [...personal.bookmarks, entry.id] })}>{isBookmarked ? '★' : '☆'}</button>
              <button type="button" className="almanack-entry__open" onClick={() => openEntry(entry.id)}>
                <div className="almanack-entry__body"><span className="almanack-entry__kind">{KIND_LABELS[entry.kind]}</span><h3>{entry.title}</h3><p>{entry.summary}</p></div>
                <div className="almanack-entry__meta"><span>{entry.ownerId || 'source index'}</span><span className={`automation-mark automation-mark--${resolutionStatus}`}>{STATUS_LABELS[resolutionStatus as Exclude<ResolutionFilter, 'all'>]}</span><span>p.{entry.sourcePage}</span></div>
              </button>
            </article>
          );
        })}
      </div>
      {visible.length > visibleLimit && <button type="button" className="almanack__more" onClick={() => setVisibleLimit(current => current + 80)}>다음 {Math.min(80, visible.length - visibleLimit)}개 보기</button>}
      {visible.length === 0 && <p className="rulebook-empty">일치하는 기록이 없습니다. 영문 원문 용어 또는 `p.페이지` 형식으로 다시 찾아보세요.</p>}

      {selected && (
        <article id="rulebook-reference-detail" className="rulebook-reference-detail" aria-labelledby="rulebook-reference-title">
          <header>
            <div><span className="document-kicker">{KIND_LABELS[selected.kind]} · p.{selected.sourcePage}</span><h3 id="rulebook-reference-title">{selected.title}</h3><p>{selected.summary}</p></div>
            <button type="button" aria-label="상세 참조 닫기" onClick={() => setSelectedId(null)}>닫기</button>
          </header>
          <div className="rulebook-reference-detail__layers">
            <section><span>Layer 1 · Play</span><h4>현재 실행 기준</h4><p>{STATUS_LABELS[statusFor(selected) as Exclude<ResolutionFilter, 'all'>]} · {selected.ownerId || 'source reference'}</p></section>
            <section><span>Layer 2 · Context</span><h4>판정 맥락</h4><dl>{selected.details.map(row => <div key={`${row.label}:${row.value}`}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></section>
            <section><span>Layer 3 · Reference</span><h4>원문과 연결</h4><p>{selected.ruleIds.length ? selected.ruleIds.join(' · ') : '별도 Rule ID 없음'} · source p.{selected.sourcePage}</p></section>
          </div>

          <section className="rulebook-source-text" aria-busy={sourceLoading}>
            <h4>원본 Rulebook · p.{selected.sourcePage}</h4>
            {sourceLoading ? <p>원문 페이지를 여는 중...</p> : <pre>{sourcePage?.text || '페이지 텍스트를 불러오지 못했습니다.'}</pre>}
          </section>

          {selected.relatedIds.length > 0 && <nav className="rulebook-crosslinks" aria-label="관련 룰북 항목"><strong>함께 읽기</strong>{selected.relatedIds.slice(0, 20).map(id => { const related = RULEBOOK_REFERENCE_BY_ID.get(id); return related ? <button type="button" key={id} onClick={() => openEntry(id)}>{related.title} · p.{related.sourcePage}</button> : null; })}</nav>}

          <div className="rulebook-personal-layer">
            <div><h4>Personal Note</h4><p>이 메모는 canonical engine과 campaign save를 바꾸지 않습니다.</p><textarea aria-label={`${selected.title} 개인 메모`} rows={4} value={note} onChange={event => persistPersonal({ ...personal, notes: { ...personal.notes, [selected.id]: event.target.value } })} /></div>
            <div><h4>PDF Consultation Log</h4><select aria-label="PDF 확인 분류" value={consultationCategory} onChange={event => setConsultationCategory(event.target.value as typeof consultationCategory)}>{consultationCategories.map(value => <option key={value} value={value}>{value}</option>)}</select><input aria-label="PDF를 다시 연 이유" value={consultationReason} onChange={event => setConsultationReason(event.target.value)} placeholder="PDF를 따로 확인한 이유" /><button type="button" disabled={!consultationReason.trim()} onClick={() => { persistPersonal({ ...personal, consultations: [{ id: `consultation:${Date.now()}`, page: selected.sourcePage, category: consultationCategory, reason: consultationReason.trim(), referenceId: selected.id, createdAt: Date.now() }, ...personal.consultations] }); setConsultationReason(''); }}>PDF 확인 기록 추가</button></div>
          </div>
        </article>
      )}
    </section>
  );
}
