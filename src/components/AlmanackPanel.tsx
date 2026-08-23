import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ManualEffectDraft, ManualEffectRecord, RuleTag } from '../rules';
import {
  RULEBOOK_REFERENCE_BY_ID,
  referenceSearchReason,
  searchReferenceEntries
} from '../rulebook/referenceRegistry';
import { CHAPTER_FOR_PAGE } from '../rulebook/chapters';
import { localizeRegionLabel, localizeSeasonLabel } from '../localization/gameplayKo';
import { EMPTY_PERSONAL_RULEBOOK_STATE, loadPersonalRulebookState, savePersonalRulebookState } from '../rulebook/personalState';
import { loadRulebookPage, searchRulebookPages } from '../rulebook/sourceLoader';
import type {
  PersonalRulebookState,
  RulebookReferenceEntry,
  RulebookReferenceKind,
  RulebookSourcePage
} from '../rulebook/types';
import {
  CONSULTATION_CATEGORY_LABELS,
  formatRulebookDetailValue,
  RULEBOOK_DETAIL_LABELS,
  RULEBOOK_KIND_LABELS,
  RULEBOOK_STATUS_LABELS
} from './rulebookPresentation';

type ResolutionFilter = 'all' | 'canonical' | 'automatic' | 'manual' | 'ambiguous' | 'reference-only' | 'pending' | 'resolved' | 'override';

interface AlmanackGameplayContext {
  currentLocationName: string;
  currentRegion: string;
  currentSeason: string;
  patientName?: string;
  ailmentName?: string;
  activeAilmentId?: string;
  requirements: Array<{ tag: RuleTag; threshold: number }>;
}

const KIND_LABELS: Record<RulebookReferenceKind | 'all', string> = {
  all: '전체',
  ...RULEBOOK_KIND_LABELS
};

const STATUS_LABELS: Record<Exclude<ResolutionFilter, 'all'>, string> = {
  canonical: RULEBOOK_STATUS_LABELS.canonical,
  automatic: RULEBOOK_STATUS_LABELS.automatic,
  manual: RULEBOOK_STATUS_LABELS.manual,
  ambiguous: RULEBOOK_STATUS_LABELS.ambiguous,
  'reference-only': RULEBOOK_STATUS_LABELS['reference-only'],
  pending: RULEBOOK_STATUS_LABELS.pending,
  resolved: RULEBOOK_STATUS_LABELS.resolved,
  override: RULEBOOK_STATUS_LABELS.override
};

const consultationCategories: PersonalRulebookState['consultations'][number]['category'][] = ['rule wording', 'encounter', 'ailment', 'remedy', 'table', 'map', 'season', 'example', 'guidance', 'terminology'];

const sourceEntry = (page: RulebookSourcePage): RulebookReferenceEntry => {
  const chapter = CHAPTER_FOR_PAGE(page.page);
  const firstLine = page.text.split('\n').map(line => line.trim()).find(Boolean) || `룰북 p.${page.page}`;
  return {
    id: `source:p${page.page}`,
    kind: 'source',
    title: `p.${page.page} · ${firstLine.slice(0, 72)}`,
    summary: page.text.replace(/\s+/g, ' ').slice(0, 240),
    sourcePage: page.page,
    ruleIds: chapter?.ruleIds || [],
    runtimeStatus: 'reference-only',
    details: [{ label: 'Source section', value: chapter?.title || '원본 룰북' }],
    relatedIds: chapter ? [chapter.id] : [],
    searchText: page.text.toLowerCase()
  };
};

export default function AlmanackPanel({
  ownedIds = [],
  gameplayContext,
  onReturnToGameplay,
  pendingManualEffects = [],
  manualEffectRecords = []
}: {
  ownedIds?: string[];
  discoveredIds?: string[];
  gameplayContext: AlmanackGameplayContext;
  onReturnToGameplay: () => void;
  pendingManualEffects?: ManualEffectDraft[];
  manualEffectRecords?: ManualEffectRecord[];
}) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<RulebookReferenceKind | 'all'>('all');
  const [status, setStatus] = useState<ResolutionFilter>('all');
  const [visibleLimit, setVisibleLimit] = useState(80);
  const [detailOpen, setDetailOpen] = useState(false);
  const [trail, setTrail] = useState<{ ids: string[]; index: number }>({ ids: [], index: -1 });
  const [fieldContextOnly, setFieldContextOnly] = useState(false);
  const [patientContextOnly, setPatientContextOnly] = useState(false);
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [pageResults, setPageResults] = useState<RulebookSourcePage[]>([]);
  const [sourcePage, setSourcePage] = useState<RulebookSourcePage | null>(null);
  const [personal, setPersonal] = useState<PersonalRulebookState>(() => loadPersonalRulebookState());
  const [consultationCategory, setConsultationCategory] = useState<PersonalRulebookState['consultations'][number]['category']>('rule wording');
  const [consultationReason, setConsultationReason] = useState('');
  const [confirmClearPersonal, setConfirmClearPersonal] = useState(false);

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

  const currentRegionId = gameplayContext.currentRegion === 'Barrow' ? 'Titan' : gameplayContext.currentRegion;
  const ownedIdSet = useMemo(() => new Set(ownedIds), [ownedIds]);

  const patientMatches = useCallback((entry: RulebookReferenceEntry) => {
    if (entry.kind !== 'remedy' || gameplayContext.requirements.length === 0) return false;
    const potency = entry.details.find(row => row.label === 'Potency')?.value || '';
    const values = [...potency.matchAll(/\b([A-Z]{3,})\s+(\d+)\b/g)].map(match => ({ tag: match[1], value: Number(match[2]) }));
    return gameplayContext.requirements.some(requirement => values.some(value =>
      value.tag === requirement.tag
      && (value.tag === 'FAIR' || value.tag === 'FOUL' || value.value >= requirement.threshold)
    ));
  }, [gameplayContext.requirements]);

  const entryIngredient = useCallback((entry: RulebookReferenceEntry) => {
    if (entry.kind === 'ingredient') return entry;
    if (entry.kind !== 'remedy') return null;
    const ingredientId = entry.relatedIds.find(id => id.startsWith('ingredient:'));
    return ingredientId ? RULEBOOK_REFERENCE_BY_ID.get(ingredientId) || null : null;
  }, []);

  const isOwnedEntry = useCallback((entry: RulebookReferenceEntry) => Boolean(entry.ownerId && ownedIdSet.has(entry.ownerId)), [ownedIdSet]);

  const visible = useMemo(() => {
    const canonical = searchReferenceEntries(query, kind).filter(entry => {
      if (status !== 'all' && statusFor(entry) !== status) return false;
      if (bookmarkedOnly && !personal.bookmarks.includes(entry.id)) return false;
      if (ownedOnly && !isOwnedEntry(entry)) return false;
      if (patientContextOnly && !patientMatches(entry)) return false;
      if (fieldContextOnly) {
        const ingredient = entryIngredient(entry);
        if (!ingredient?.relatedIds.includes(`region:${currentRegionId}`) || !ingredient.relatedIds.includes(`season:${gameplayContext.currentSeason}`)) return false;
      }
      return true;
    });
    const source = (kind === 'all' || kind === 'source') && query.trim().length >= 2 && (status === 'all' || status === 'reference-only') ? pageResults.map(sourceEntry) : [];
    const seen = new Set<string>();
    return [...canonical, ...source].filter(entry => !seen.has(entry.id) && seen.add(entry.id));
  }, [bookmarkedOnly, currentRegionId, entryIngredient, fieldContextOnly, gameplayContext.currentSeason, isOwnedEntry, kind, ownedOnly, pageResults, patientContextOnly, patientMatches, personal.bookmarks, query, status, statusFor]);

  const selectedId = detailOpen && trail.index >= 0 ? trail.ids[trail.index] : null;

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

  useEffect(() => {
    if (!selectedId) return;
    document.querySelector('#rulebook-reference-detail > header')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  }, [pageResults.length, selectedId]);

  const openEntry = (id: string) => {
    setTrail(current => {
      const prefix = current.ids.slice(0, current.index + 1);
      if (prefix[prefix.length - 1] === id) return current;
      const ids = [...prefix, id];
      return { ids, index: ids.length - 1 };
    });
    setDetailOpen(true);
  };

  const moveInTrail = (offset: number) => setTrail(current => ({
    ...current,
    index: Math.max(0, Math.min(current.ids.length - 1, current.index + offset))
  }));

  const clearContextFilters = () => {
    setFieldContextOnly(false);
    setPatientContextOnly(false);
    setOwnedOnly(false);
    setBookmarkedOnly(false);
  };

  const contextLabelsFor = (entry: RulebookReferenceEntry) => {
    const labels: string[] = [];
    const ingredient = entryIngredient(entry);
    if (isOwnedEntry(entry) || (ingredient?.ownerId && ownedIdSet.has(ingredient.ownerId))) labels.push('보유 중');
    if (ingredient?.relatedIds.includes(`region:${currentRegionId}`)) labels.push(`현재 ${localizeRegionLabel(currentRegionId)} 지역`);
    if (ingredient?.relatedIds.includes(`season:${gameplayContext.currentSeason}`)) labels.push(`현재 ${localizeSeasonLabel(gameplayContext.currentSeason)}`);
    if (patientMatches(entry)) labels.push('현재 환자에 기여');
    if (entry.ownerId === gameplayContext.activeAilmentId) labels.push('현재 질환');
    return labels;
  };

  const note = selected ? personal.notes[selected.id] || '' : '';
  const houseRule = selected ? personal.houseRules[selected.id] || '' : '';
  const sourceLoading = Boolean(selected && sourcePage?.page !== selected.sourcePage);

  const updatePersonalText = (field: 'notes' | 'houseRules', id: string, value: string) => {
    const next = { ...personal[field] };
    if (value) next[id] = value;
    else delete next[id];
    persistPersonal({ ...personal, [field]: next });
  };

  return (
    <section className="almanack rulebook-hub" aria-labelledby="almanack-title">
      <header className="almanack__header rulebook-hub__header">
        <div>
          <span className="document-kicker">여행 약제사의 들녘 색인 · 제1판 제3쇄</span>
          <h2 id="almanack-title">자연사 색인과 룰북</h2>
          <p>이름을 몰라도 지역, 계절, 환자의 증상에서 시작해 관련 기록을 따라갈 수 있습니다. 필요한 경우에만 원문 페이지를 펼치세요.</p>
        </div>
        <button type="button" className="rulebook-return-to-play" onClick={onReturnToGameplay}>오늘의 플레이로 돌아가기</button>
      </header>

      <section className="rulebook-context-shelf" aria-labelledby="rulebook-context-title">
        <div className="rulebook-context-shelf__heading"><span className="document-kicker">지금 펼칠 기록</span><h3 id="rulebook-context-title">현재 들녘에서 바로 찾기</h3></div>
        <button type="button" aria-pressed={fieldContextOnly} onClick={() => { setQuery(''); setKind('ingredient'); setFieldContextOnly(true); setPatientContextOnly(false); setOwnedOnly(false); setBookmarkedOnly(false); }}>
          <span>현재 지역·계절</span>
          <strong>{gameplayContext.currentLocationName || '위치 미기록'} · {localizeRegionLabel(currentRegionId)} · {localizeSeasonLabel(gameplayContext.currentSeason)}</strong>
          <small>지금 찾을 수 있는 영약재</small>
        </button>
        <button type="button" disabled={!gameplayContext.requirements.length} aria-pressed={patientContextOnly} onClick={() => { setQuery(''); setKind('remedy'); setPatientContextOnly(true); setFieldContextOnly(false); setOwnedOnly(false); setBookmarkedOnly(false); }}>
          <span>현재 환자</span>
          <strong>{gameplayContext.patientName || '진료 중인 환자 없음'}</strong>
          <small>{gameplayContext.requirements.length ? `${gameplayContext.ailmentName || '병증'} · ${gameplayContext.requirements.map(row => `${row.tag} ${row.threshold}`).join(' · ')}` : '환자가 생기면 필요한 약효가 연결됩니다'}</small>
        </button>
        <button type="button" aria-pressed={ownedOnly} onClick={() => { setQuery(''); setKind('all'); setOwnedOnly(true); setFieldContextOnly(false); setPatientContextOnly(false); setBookmarkedOnly(false); }}>
          <span>펼쳐둔 배낭</span>
          <strong>{ownedIdSet.size}종 보유</strong>
          <small>내 영약재와 도구 다시 보기</small>
        </button>
      </section>

      <div className="almanack__controls">
        <label><span>색인 검색</span><input value={query} onChange={event => { setQuery(event.target.value); setVisibleLimit(80); clearContextFilters(); }} placeholder="이름, 지역, 계절, 약효 또는 p.141" /></label>
        <label><span>분류</span><select value={kind} onChange={event => { setKind(event.target.value as RulebookReferenceKind | 'all'); setVisibleLimit(80); }}>{Object.entries(KIND_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label><span>처리 방식</span><select value={status} onChange={event => { setStatus(event.target.value as ResolutionFilter); setVisibleLimit(80); }}><option value="all">전체</option>{Object.entries(STATUS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </div>

      <div className="rulebook-index-summary">
        <span aria-live="polite">찾은 기록 {visible.length}개</span>
        <button type="button" className={bookmarkedOnly ? 'is-active' : ''} aria-pressed={bookmarkedOnly} onClick={() => { setBookmarkedOnly(value => !value); setFieldContextOnly(false); setPatientContextOnly(false); setOwnedOnly(false); }}>책갈피 {personal.bookmarks.length}개</button>
        {(fieldContextOnly || patientContextOnly || ownedOnly || bookmarkedOnly || query || kind !== 'all' || status !== 'all') && <button type="button" className="rulebook-filter-reset" onClick={() => { setQuery(''); setKind('all'); setStatus('all'); clearContextFilters(); }}>전체 색인 보기</button>}
        <span>PDF 확인 기록 {personal.consultations.length}회</span>
        {confirmClearPersonal ? (
          <span className="rulebook-personal-clear-confirm">
            <button type="button" onClick={() => { persistPersonal(EMPTY_PERSONAL_RULEBOOK_STATE); setConfirmClearPersonal(false); }}>개인 참고 기록 정말 비우기</button>
            <button type="button" onClick={() => setConfirmClearPersonal(false)}>취소</button>
          </span>
        ) : (
          <button type="button" className="rulebook-personal-clear" onClick={() => setConfirmClearPersonal(true)}>개인 참고 기록 비우기</button>
        )}
      </div>

      <div className="almanack__index" role="list">
        {visible.slice(0, visibleLimit).map(entry => {
          const isBookmarked = personal.bookmarks.includes(entry.id);
          const resolutionStatus = statusFor(entry);
          return (
            <article key={entry.id} className={`almanack-entry ${selectedId === entry.id ? 'almanack-entry--selected' : ''}`} role="listitem">
              <button className="almanack-entry__favorite" aria-label={`${entry.title} 책갈피 ${isBookmarked ? '해제' : '추가'}`} aria-pressed={isBookmarked} onClick={() => persistPersonal({ ...personal, bookmarks: isBookmarked ? personal.bookmarks.filter(id => id !== entry.id) : [...personal.bookmarks, entry.id] })}>{isBookmarked ? '★' : '☆'}</button>
              <button type="button" className="almanack-entry__open" onClick={() => openEntry(entry.id)}>
                <div className="almanack-entry__body"><span className="almanack-entry__kind">{KIND_LABELS[entry.kind]}</span><h3>{entry.title}</h3><p>{entry.summary}</p>{contextLabelsFor(entry).length > 0 && <div className="rulebook-context-marks">{contextLabelsFor(entry).map(label => <span key={label}>{label}</span>)}</div>}{query.trim() && <small className="rulebook-match-reason">{referenceSearchReason(entry, query)}에서 찾음</small>}</div>
                <div className="almanack-entry__meta"><span>{entry.ownerId ? '앱 규칙과 연결' : '원문 색인'}</span><span className={`automation-mark automation-mark--${resolutionStatus}`}>{STATUS_LABELS[resolutionStatus as Exclude<ResolutionFilter, 'all'>]}</span><span>p.{entry.sourcePage}</span></div>
              </button>
            </article>
          );
        })}
      </div>
      {visible.length > visibleLimit && <button type="button" className="almanack__more" onClick={() => setVisibleLimit(current => current + 80)}>다음 {Math.min(80, visible.length - visibleLimit)}개 보기</button>}
      {visible.length === 0 && <div className="rulebook-empty"><strong>맞는 기록을 찾지 못했습니다.</strong><p>이름 일부, 영문 원문, 지역·계절, 약효 태그 또는 `p.페이지` 형식으로 다시 찾아보세요.</p><button type="button" onClick={() => { setQuery(''); setKind('all'); setStatus('all'); clearContextFilters(); }}>전체 색인으로 돌아가기</button></div>}

      {selected && (
        <article id="rulebook-reference-detail" className="rulebook-reference-detail" aria-labelledby="rulebook-reference-title">
          <header>
            <div><span className="document-kicker">{KIND_LABELS[selected.kind]} · p.{selected.sourcePage}</span><h3 id="rulebook-reference-title">{selected.title}</h3><p>{selected.summary}</p></div>
            <div className="rulebook-reference-detail__actions">
              <button type="button" disabled={trail.index <= 0} onClick={() => moveInTrail(-1)} aria-label="이전 참고 기록">← 이전</button>
              <button type="button" disabled={trail.index >= trail.ids.length - 1} onClick={() => moveInTrail(1)} aria-label="다음 참고 기록">다음 →</button>
              <button type="button" aria-label="상세 참조 닫기" onClick={() => setDetailOpen(false)}>목록으로</button>
            </div>
          </header>
          <div className="rulebook-reference-detail__layers">
            <section><span>실전 요약</span><h4>현재 판정 기준</h4><p>{STATUS_LABELS[statusFor(selected) as Exclude<ResolutionFilter, 'all'>]} · {selected.ownerId ? '앱 규칙과 연결' : '원문 참고'}</p>{contextLabelsFor(selected).length > 0 && <div className="rulebook-context-marks">{contextLabelsFor(selected).map(label => <span key={label}>{label}</span>)}</div>}</section>
            <section><span>현장 정보</span><h4>항목 정보</h4><dl>{selected.details.map(row => <div key={`${row.label}:${row.value}`}><dt>{RULEBOOK_DETAIL_LABELS[row.label] || row.label}</dt><dd>{formatRulebookDetailValue(row.label, row.value)}</dd></div>)}</dl></section>
            <section><span>출처</span><h4>원문 위치</h4><p>{selected.ruleIds.length ? `연결된 규칙 ${selected.ruleIds.length}개` : '별도 규칙 연결 없음'} · p.{selected.sourcePage}</p></section>
          </div>

          {selected.relatedIds.length > 0 && <nav className="rulebook-crosslinks" aria-label="관련 룰북 항목"><strong>함께 읽기</strong><span>책의 ‘함께 보기’처럼 관련 지역·계절·약효·도구를 따라갑니다.</span>{selected.relatedIds.slice(0, 28).map(id => { const related = RULEBOOK_REFERENCE_BY_ID.get(id); return related ? <button type="button" key={id} onClick={() => openEntry(id)}><small>{KIND_LABELS[related.kind]}</small>{related.title}<span>p.{related.sourcePage}</span></button> : null; })}</nav>}

          <details className="rulebook-source-text" aria-busy={sourceLoading}>
            <summary>원본 룰북 p.{selected.sourcePage} 펼치기</summary>
            {sourceLoading ? <p>원문 페이지를 여는 중...</p> : <pre>{sourcePage?.text || '페이지 텍스트를 불러오지 못했습니다.'}</pre>}
          </details>

          <div className="rulebook-personal-layer">
            <div><h4>개인 메모</h4><p>이 메모는 정식 규칙 데이터나 캠페인 저장 기록을 바꾸지 않습니다.</p><textarea aria-label={`${selected.title} 개인 메모`} rows={4} value={note} onChange={event => updatePersonalText('notes', selected.id, event.target.value)} /></div>
            <div className="rulebook-personal-layer__house-rule"><h4>하우스 룰 메모</h4><p>개인 해석을 기록할 뿐 정식 규칙 데이터나 캠페인 저장 기록을 덮어쓰지 않습니다.</p><textarea aria-label={`${selected.title} 하우스 룰 메모`} rows={4} value={houseRule} onChange={event => updatePersonalText('houseRules', selected.id, event.target.value)} /></div>
            <div><h4>PDF 확인 기록</h4><select aria-label="PDF 확인 분류" value={consultationCategory} onChange={event => setConsultationCategory(event.target.value as typeof consultationCategory)}>{consultationCategories.map(value => <option key={value} value={value}>{CONSULTATION_CATEGORY_LABELS[value]}</option>)}</select><input aria-label="PDF를 다시 연 이유" value={consultationReason} onChange={event => setConsultationReason(event.target.value)} placeholder="PDF를 따로 확인한 이유" /><button type="button" disabled={!consultationReason.trim()} onClick={() => { persistPersonal({ ...personal, consultations: [{ id: `consultation:${Date.now()}`, page: selected.sourcePage, category: consultationCategory, reason: consultationReason.trim(), referenceId: selected.id, createdAt: Date.now() }, ...personal.consultations] }); setConsultationReason(''); }}>PDF 확인 기록 추가</button></div>
          </div>
        </article>
      )}
    </section>
  );
}
