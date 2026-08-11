import { useCallback, useMemo, useState } from 'react';
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
  classifyPrintedEffect,
  type ManualEffectDraft,
  type ManualEffectRecord,
  type PrintedEffectDefinition
} from '../rules';
import { localizeManualEffectText, localizeManualEffectTrigger, localizeManualEffectValue } from '../localization/manualEffectKo';
import { localizeRegionLabel } from '../localization/gameplayKo';

type AlmanackKind = 'reagents' | 'ailments' | 'services' | 'tools' | 'upgrades' | 'wagons' | 'companions' | 'clinics' | 'encounters' | 'barrows';

interface AlmanackRow {
  id: string;
  kind: AlmanackKind;
  title: string;
  detail: string;
  page: number;
  automation: 'automatic' | 'choice' | 'manual' | 'ambiguous';
  effect?: PrintedEffectDefinition;
}

type ResolutionStatus = AlmanackRow['automation'] | 'pending' | 'resolved' | 'override';

const reagentTypeLabels: Record<string, string> = { PLANT: '식물', INSECT: '곤충', ANIMAL: '동물', MINERAL: '광물', TITAN: 'Titan' };
const triggerLabels: Record<string, string> = { forage: '채집', gather: '획득', 'ailment-start': '질병 시작', treatment: '치료', pound: '빻기' };
const encounterTypeLabels: Record<string, string> = { travel: '여정', foraging: '채집', social: '사교' };
const behemothClassLabels: Record<string, string> = { Towering: '거대한', Many: '다수의', Violent: '폭력적인', Demanding: '까다로운' };
const clinicRequirementLabels: Record<string, string> = {
  'Reputation 15+': '명성 15 이상',
  'Visited Summit and completed Reconnecting with Guildmates': 'Summit 방문 및 길드 동료와의 재회 완료',
  'Visited Spoolkeep': 'Spoolkeep 방문',
  'Visited Noonhill': 'Noonhill 방문',
  'Gardens and visited Glasswall': '약초 정원 보유 및 Glasswall 방문',
  'Visited Odoak': 'Odoak 방문',
  'Visited Vessel': 'Vessel 방문',
  Taproom: '선술집 보유',
  None: '요구 조건 없음'
};

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
  ...REAGENTS.map(row => ({ id: row.id, kind: 'reagents' as const, title: row.displayName || row.canonicalName, detail: `${reagentTypeLabels[row.type] || row.type} · 기본 희귀도 ${row.baseRarity} · 조제법 ${row.preparations.length}개`, page: row.sourcePage, automation: 'automatic' as const })),
  ...AILMENTS.map(row => ({ id: row.id, kind: 'ailments' as const, title: row.displayName || row.canonicalName, detail: `${({ Lesser: '가벼운', Intermediate: '중간', Greater: '중한' } as Record<string, string>)[row.severity] || row.severity} · 타이머 ${row.timer}`, page: row.sourcePage, automation: automationFor(row.id), effect: PRINTED_EFFECT_BY_OWNER.get(row.id) })),
  ...GUILD_SERVICES.map(row => ({ id: row.id, kind: 'services' as const, title: row.name, detail: `${row.provider} · 장신구 ${Array.isArray(row.cost) ? row.cost.join('/') : row.cost}개`, page: row.sourcePage, automation: 'automatic' as const })),
  ...ALMANACK_TOOLS.map(row => ({ id: row.id, kind: 'tools' as const, title: row.canonicalName, detail: `무게 ${row.weight} · ${row.cost == null ? '구매 불가' : `장신구 ${row.cost}개`}`, page: row.sourcePage, automation: 'automatic' as const })),
  ...TOOL_UPGRADES.map(row => ({ id: row.id, kind: 'upgrades' as const, title: row.canonicalName, detail: `${ALMANACK_TOOLS.find(tool => tool.id === row.baseToolId)?.canonicalName || row.baseToolId} · ${triggerLabels[row.trigger] || row.trigger}`, page: row.sourcePage, automation: 'automatic' as const })),
  ...WAGON_EXPANSIONS.map(row => ({ id: row.id, kind: 'wagons' as const, title: row.canonicalName, detail: `${row.location === 'Any City' ? '모든 도시' : row.location} · 장신구 ${row.cost}개`, page: row.sourcePage, automation: 'automatic' as const })),
  ...COMPANIONS.map(row => ({ id: row.id, kind: 'companions' as const, title: row.canonicalName, detail: `${row.regions.map(localizeRegionLabel).join(', ')} · 장신구 ${row.cost}개`, page: row.sourcePage, automation: 'automatic' as const })),
  ...CLINIC_AGENDAS.map(row => ({ id: row.id, kind: 'clinics' as const, title: row.canonicalName, detail: clinicRequirementLabels[row.requirement] || row.requirement, page: row.sourcePage, automation: 'automatic' as const })),
  ...ENCOUNTERS.map(row => ({ id: row.id, kind: 'encounters' as const, title: PRINTED_EFFECT_BY_OWNER.get(row.id)?.ownerName || row.title, detail: `${encounterTypeLabels[row.encounterType] || row.encounterType} · ${localizeRegionLabel(row.region)}`, page: row.sourcePage, automation: automationFor(row.id), effect: PRINTED_EFFECT_BY_OWNER.get(row.id) })),
  ...BARROW_DELVES.map(row => ({ id: row.id, kind: 'barrows' as const, title: row.name, detail: `${behemothClassLabels[row.behemothClass] || row.behemothClass} · ${row.challenge}`, page: row.sourcePage, automation: 'automatic' as const }))
];

const labels: Record<AlmanackKind | 'all', string> = { all: '전체', reagents: '영약재', ailments: '질병', services: '길드 서비스', tools: '도구', upgrades: '도구 개조', wagons: '마차', companions: '동료', clinics: '약제소', encounters: '조우', barrows: '고분' };

export default function AlmanackPanel({
  ownedIds = [],
  discoveredIds = [],
  pendingManualEffects = [],
  manualEffectRecords = []
}: {
  ownedIds?: string[];
  discoveredIds?: string[];
  pendingManualEffects?: ManualEffectDraft[];
  manualEffectRecords?: ManualEffectRecord[];
}) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<AlmanackKind | 'all'>('all');
  const [automation, setAutomation] = useState<'all' | ResolutionStatus>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [visibleLimit, setVisibleLimit] = useState(80);
  const [expanded, setExpanded] = useState<string | null>(null);
  const owned = useMemo(() => new Set(ownedIds), [ownedIds]);
  const discovered = useMemo(() => new Set([...discoveredIds, ...ownedIds]), [discoveredIds, ownedIds]);
  const statusFor = useCallback((row: AlmanackRow): ResolutionStatus => {
    if (pendingManualEffects.some(draft => draft.ownerId === row.id && !draft.transactionId)) return 'pending';
    const record = [...manualEffectRecords].reverse().find(candidate => candidate.ownerId === row.id);
    if (record?.override) return 'override';
    if (record) return 'resolved';
    return row.automation;
  }, [manualEffectRecords, pendingManualEffects]);
  const visible = useMemo(() => rows.filter(row => {
    if (kind !== 'all' && row.kind !== kind) return false;
    if (automation !== 'all' && statusFor(row) !== automation) return false;
    return `${row.title} ${row.detail}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [automation, kind, query, statusFor]);

  return (
    <section className="almanack" aria-labelledby="almanack-title">
      <header className="almanack__header">
        <div><span className="document-kicker">들녘의 참고 기록</span><h2 id="almanack-title">자연사 색인</h2><p>발견 기록과 원문 판정 범위를 한곳에서 확인합니다.</p></div>
        <div className="almanack__counts" aria-label="도감 항목 수"><strong>{visible.length}</strong><span>항목</span></div>
      </header>
      <div className="almanack__controls">
        <label><span>검색</span><input value={query} onChange={event => { setQuery(event.target.value); setVisibleLimit(80); }} placeholder="이름, 지역, 판정 검색" /></label>
        <label><span>분류</span><select value={kind} onChange={event => { setKind(event.target.value as AlmanackKind | 'all'); setVisibleLimit(80); }}>{Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label><span>처리 방식</span><select value={automation} onChange={event => { setAutomation(event.target.value as typeof automation); setVisibleLimit(80); }}><option value="all">전체</option><option value="automatic">자동 처리</option><option value="choice">선택 필요</option><option value="manual">직접 처리</option><option value="pending">판정 대기</option><option value="resolved">해결 완료</option><option value="override">예외 처리</option><option value="ambiguous">모호함</option></select></label>
      </div>
      {recent.length > 0 && <p className="almanack__recent">최근 본 항목: {recent.slice(0, 4).map(id => rows.find(row => row.id === id)?.title).filter(Boolean).join(' · ')}</p>}
      <div className="almanack__index" role="list">
        {visible.slice(0, visibleLimit).map(row => {
          const hiddenKnowledge = row.kind === 'reagents' && !discovered.has(row.id);
          const favorite = favorites.includes(row.id);
          const resolutionStatus = statusFor(row);
          const isExpanded = expanded === `${row.kind}:${row.id}`;
          return <article key={`${row.kind}:${row.id}`} className="almanack-entry" role="listitem" onClick={() => { setRecent(current => [row.id, ...current.filter(id => id !== row.id)].slice(0, 6)); setExpanded(isExpanded ? null : `${row.kind}:${row.id}`); }}>
            <button className="almanack-entry__favorite" aria-label={`${row.title} 즐겨찾기 ${favorite ? '해제' : '추가'}`} aria-pressed={favorite} onClick={event => { event.stopPropagation(); setFavorites(current => favorite ? current.filter(id => id !== row.id) : [...current, row.id]); }}>{favorite ? '★' : '☆'}</button>
            <div className="almanack-entry__body"><span className="almanack-entry__kind">{labels[row.kind]}</span><h3>{hiddenKnowledge ? '미발견 영약재' : row.title}</h3><p>{hiddenKnowledge ? '현장에서 발견하면 상세 정보가 기록됩니다.' : row.detail}</p></div>
            <div className="almanack-entry__meta"><span>{owned.has(row.id) ? '현재 보유' : hiddenKnowledge ? '잠김' : '기본 공개'}</span><span className={`automation-mark automation-mark--${resolutionStatus}`}>{resolutionStatus === 'automatic' ? '자동 처리' : resolutionStatus === 'choice' ? '선택 필요' : resolutionStatus === 'ambiguous' ? '모호함' : resolutionStatus === 'pending' ? '판정 대기' : resolutionStatus === 'resolved' ? '해결 완료' : resolutionStatus === 'override' ? '예외 처리' : '직접 처리'}</span><span>p.{row.page}</span></div>
            {isExpanded && row.effect && <div className="almanack-entry__effect"><strong>{row.effect.ruleIds.join(' · ')} · p.{row.effect.sourcePage}</strong><p>{localizeManualEffectText(row.effect.ownerName, row.effect.printedText)}</p><details><summary>영문 원문 보기</summary><p>{row.effect.printedText}</p></details>{row.effect.manualResolution && <><h4>해야 할 일</h4><p>{localizeManualEffectValue(row.effect.manualResolution.decision)}</p>{row.effect.supportedTriggers.length > 1 && <ul>{row.effect.supportedTriggers.map(trigger => <li key={trigger}><strong>{localizeManualEffectTrigger(trigger)}</strong>: {localizeManualEffectValue(row.effect.manualResolutionByTrigger[trigger]?.decision || '')}</li>)}</ul>}</>}</div>}
          </article>;
        })}
      </div>
      {visible.length > visibleLimit && <button type="button" className="almanack__more" onClick={() => setVisibleLimit(current => current + 80)}>다음 {Math.min(80, visible.length - visibleLimit)}개 보기</button>}
    </section>
  );
}
