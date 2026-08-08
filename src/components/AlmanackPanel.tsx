import { useMemo, useState } from 'react';
import {
  AILMENTS,
  BARROW_DELVES,
  CLINIC_AGENDAS,
  COMPANIONS,
  ENCOUNTERS,
  GUILD_SERVICES,
  PRINTED_EFFECT_BY_OWNER,
  REAGENTS,
  TOOL_UPGRADES,
  WAGON_EXPANSIONS,
  ALMANACK_TOOLS,
  classifyPrintedEffect
} from '../rules';

type AlmanackKind = 'reagents' | 'ailments' | 'services' | 'tools' | 'upgrades' | 'wagons' | 'companions' | 'clinics' | 'encounters' | 'barrows';

interface AlmanackRow {
  id: string;
  kind: AlmanackKind;
  title: string;
  detail: string;
  page: number;
  automation: 'automatic' | 'choice' | 'manual' | 'ambiguous';
}

const automationFor = (ownerId: string): AlmanackRow['automation'] => {
  const effect = PRINTED_EFFECT_BY_OWNER.get(ownerId);
  if (!effect) return 'automatic';
  const classification = classifyPrintedEffect(effect);
  return classification === 'deterministic' ? 'automatic'
    : classification === 'structured-choice' ? 'choice'
      : classification === 'ambiguous' ? 'ambiguous'
        : 'manual';
};

const rows: AlmanackRow[] = [
  ...REAGENTS.map(row => ({ id: row.id, kind: 'reagents' as const, title: row.displayName || row.canonicalName, detail: `${row.type} · BR ${row.baseRarity} · ${row.preparations.length} preparations`, page: row.sourcePage, automation: 'automatic' as const })),
  ...AILMENTS.map(row => ({ id: row.id, kind: 'ailments' as const, title: row.displayName || row.canonicalName, detail: `${row.severity} · Timer ${row.timer}`, page: row.sourcePage, automation: automationFor(row.id) })),
  ...GUILD_SERVICES.map(row => ({ id: row.id, kind: 'services' as const, title: row.name, detail: `${row.provider} · ${Array.isArray(row.cost) ? row.cost.join('/') : row.cost} Trinkets`, page: row.sourcePage, automation: 'automatic' as const })),
  ...ALMANACK_TOOLS.map(row => ({ id: row.id, kind: 'tools' as const, title: row.canonicalName, detail: `Weight ${row.weight} · ${row.cost ?? 'not purchasable'} Trinkets`, page: row.sourcePage, automation: 'automatic' as const })),
  ...TOOL_UPGRADES.map(row => ({ id: row.id, kind: 'upgrades' as const, title: row.canonicalName, detail: `${row.baseToolId} · ${row.trigger}`, page: row.sourcePage, automation: 'automatic' as const })),
  ...WAGON_EXPANSIONS.map(row => ({ id: row.id, kind: 'wagons' as const, title: row.canonicalName, detail: `${row.location} · ${row.cost} Trinkets`, page: row.sourcePage, automation: 'automatic' as const })),
  ...COMPANIONS.map(row => ({ id: row.id, kind: 'companions' as const, title: row.canonicalName, detail: `${row.regions.join(', ')} · ${row.cost} Trinkets`, page: row.sourcePage, automation: 'automatic' as const })),
  ...CLINIC_AGENDAS.map(row => ({ id: row.id, kind: 'clinics' as const, title: row.canonicalName, detail: row.requirement, page: row.sourcePage, automation: 'automatic' as const })),
  ...ENCOUNTERS.map(row => ({ id: row.id, kind: 'encounters' as const, title: row.title, detail: `${row.encounterType} · ${row.region}`, page: row.sourcePage, automation: automationFor(row.id) })),
  ...BARROW_DELVES.map(row => ({ id: row.id, kind: 'barrows' as const, title: row.name, detail: `${row.behemothClass} · ${row.challenge}`, page: row.sourcePage, automation: 'automatic' as const }))
];

const labels: Record<AlmanackKind | 'all', string> = { all: '전체', reagents: '영약재', ailments: '질병', services: '길드 서비스', tools: '도구', upgrades: '도구 개조', wagons: '마차', companions: '동료', clinics: '약제소', encounters: '조우', barrows: '고분' };

export default function AlmanackPanel({ ownedIds = [], discoveredIds = [] }: { ownedIds?: string[]; discoveredIds?: string[] }) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<AlmanackKind | 'all'>('all');
  const [automation, setAutomation] = useState<'all' | AlmanackRow['automation']>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [visibleLimit, setVisibleLimit] = useState(80);
  const owned = useMemo(() => new Set(ownedIds), [ownedIds]);
  const discovered = useMemo(() => new Set([...discoveredIds, ...ownedIds]), [discoveredIds, ownedIds]);
  const visible = useMemo(() => rows.filter(row => {
    if (kind !== 'all' && row.kind !== kind) return false;
    if (automation !== 'all' && row.automation !== automation) return false;
    return `${row.title} ${row.detail}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [automation, kind, query]);

  return (
    <section className="almanack" aria-labelledby="almanack-title">
      <header className="almanack__header">
        <div><span className="document-kicker">Field reference</span><h2 id="almanack-title">Almanack</h2><p>발견 기록과 원문 판정 범위를 한곳에서 확인합니다.</p></div>
        <div className="almanack__counts" aria-label="도감 항목 수"><strong>{visible.length}</strong><span>entries</span></div>
      </header>
      <div className="almanack__controls">
        <label><span>검색</span><input value={query} onChange={event => { setQuery(event.target.value); setVisibleLimit(80); }} placeholder="이름, 지역, 판정 검색" /></label>
        <label><span>분류</span><select value={kind} onChange={event => { setKind(event.target.value as AlmanackKind | 'all'); setVisibleLimit(80); }}>{Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label><span>처리 방식</span><select value={automation} onChange={event => { setAutomation(event.target.value as typeof automation); setVisibleLimit(80); }}><option value="all">전체</option><option value="automatic">자동 처리</option><option value="choice">선택 필요</option><option value="manual">직접 처리</option><option value="ambiguous">모호함</option></select></label>
      </div>
      {recent.length > 0 && <p className="almanack__recent">최근 본 항목: {recent.slice(0, 4).map(id => rows.find(row => row.id === id)?.title).filter(Boolean).join(' · ')}</p>}
      <div className="almanack__index" role="list">
        {visible.slice(0, visibleLimit).map(row => {
          const hiddenKnowledge = row.kind === 'reagents' && !discovered.has(row.id);
          const favorite = favorites.includes(row.id);
          return <article key={`${row.kind}:${row.id}`} className="almanack-entry" role="listitem" onClick={() => setRecent(current => [row.id, ...current.filter(id => id !== row.id)].slice(0, 6))}>
            <button className="almanack-entry__favorite" aria-label={`${row.title} 즐겨찾기 ${favorite ? '해제' : '추가'}`} aria-pressed={favorite} onClick={event => { event.stopPropagation(); setFavorites(current => favorite ? current.filter(id => id !== row.id) : [...current, row.id]); }}>{favorite ? '★' : '☆'}</button>
            <div className="almanack-entry__body"><span className="almanack-entry__kind">{labels[row.kind]}</span><h3>{hiddenKnowledge ? '미발견 영약재' : row.title}</h3><p>{hiddenKnowledge ? '현장에서 발견하면 상세 정보가 기록됩니다.' : row.detail}</p></div>
            <div className="almanack-entry__meta"><span>{owned.has(row.id) ? '현재 보유' : hiddenKnowledge ? '잠김' : '기본 공개'}</span><span className={`automation-mark automation-mark--${row.automation}`}>{row.automation === 'automatic' ? '자동 처리' : row.automation === 'choice' ? '선택 필요' : row.automation === 'ambiguous' ? '모호함' : '직접 처리'}</span><span>p.{row.page}</span></div>
          </article>;
        })}
      </div>
      {visible.length > visibleLimit && <button type="button" className="almanack__more" onClick={() => setVisibleLimit(current => current + 80)}>다음 {Math.min(80, visible.length - visibleLimit)}개 보기</button>}
    </section>
  );
}
