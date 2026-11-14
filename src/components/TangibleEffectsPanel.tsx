import { useMemo, useState } from 'react';

/**
 * p.39 Tangible Effects. The printed table is a menu of example consequences
 * the player may choose after a Journey; every cell is offered here so the
 * book is not needed. Cells that map onto campaign state are applied by App;
 * the rest are kept as a journal record with the printed wording.
 */

export type TangibleEffect =
  | { kind: 'retire' }
  | { kind: 'lose-trinkets'; amount: number }
  | { kind: 'lose-companion'; companionId: string }
  | { kind: 'record'; title: string; text: string }
  | { kind: 'stat'; stat: 'speed' | 'carry' }
  | { kind: 'familiar-end' }
  | { kind: 'guild-level'; direction: 'down' | 'up' }
  | { kind: 'reputation'; amount: 5 | -5 }
  | { kind: 'remove-settlement'; locationId: string }
  | { kind: 'close-path'; from: string; to: string }
  | { kind: 'add-path'; from: string; to: string }
  | { kind: 'change-region'; locationId: string; region: string }
  | { kind: 'location-ban'; locationId: string };

export interface TangibleLocationOption {
  id: string;
  name: string;
  kind?: string;
  region?: string;
  neighbors: readonly string[];
}

type Tone = 'major-negative' | 'minor-negative' | 'minor-positive' | 'major-positive';

const TONE_LABEL: Record<Tone, string> = {
  'major-negative': '큰 손해',
  'minor-negative': '작은 손해',
  'minor-positive': '작은 이득',
  'major-positive': '큰 이득'
};

type CellId =
  | 'you-retire' | 'you-lose' | 'you-tool' | 'you-stat'
  | 'familiar-end' | 'familiar-skip' | 'familiar-improve' | 'familiar-learn'
  | 'guild-revert' | 'guild-minus' | 'guild-plus' | 'guild-up'
  | 'map-remove-settlement' | 'map-remove-path' | 'map-add-path' | 'map-region'
  | 'beasts-service-ban' | 'beasts-location-ban' | 'beasts-discount' | 'beasts-clinic';

interface Cell { id: CellId; tone: Tone; label: string; detail: string; automatic: boolean }

const TABLE: Array<{ subject: string; cells: Cell[] }> = [
  {
    subject: '나 (약제사)',
    cells: [
      { id: 'you-retire', tone: 'major-negative', label: '은퇴', detail: '이 캐릭터를 은퇴시킵니다.', automatic: true },
      { id: 'you-lose', tone: 'minor-negative', label: '동료 또는 장신구를 잃음', detail: '길동무가 아닌 동료 하나, 또는 장신구 몇 개를 잃습니다.', automatic: true },
      { id: 'you-tool', tone: 'minor-positive', label: '도구 또는 개조 획득', detail: '도구 하나나 업그레이드 하나를 얻습니다. 무엇을 얻었는지 적고, 도구·마차 화면에서 장비에 추가하세요.', automatic: false },
      { id: 'you-stat', tone: 'major-positive', label: '속도 +1 또는 짐 +1', detail: '이동 속도나 짐 칸 중 하나가 영구히 1 늘어납니다.', automatic: true }
    ]
  },
  {
    subject: '길동무 (Familiar)',
    cells: [
      { id: 'familiar-end', tone: 'major-negative', label: '관계가 끝남', detail: '길동무가 더 이상 함께하지 않습니다. 길동무 혜택이 사라집니다.', automatic: true },
      { id: 'familiar-skip', tone: 'minor-negative', label: '다음 여정에 빠짐', detail: '길동무가 다음 여정에는 함께하지 않습니다. 다음 여정 동안 길동무 혜택을 쓰지 마세요.', automatic: false },
      { id: 'familiar-improve', tone: 'minor-positive', label: '혜택이 좋아짐', detail: '길동무가 주는 혜택이 나아집니다. 어떻게 나아졌는지 적으세요.', automatic: false },
      { id: 'familiar-learn', tone: 'major-positive', label: '새 혜택을 배움', detail: '길동무가 혜택 하나를 더 배웁니다. 배운 혜택을 적으세요.', automatic: false }
    ]
  },
  {
    subject: '길드',
    cells: [
      { id: 'guild-revert', tone: 'major-negative', label: '이전 단계로 강등', detail: 'Guild Reputation을 이전 단계의 시작 값으로 되돌립니다.', automatic: true },
      { id: 'guild-minus', tone: 'minor-negative', label: 'Guild Reputation -5', detail: 'Guild Reputation이 5 줄어듭니다.', automatic: true },
      { id: 'guild-plus', tone: 'minor-positive', label: 'Guild Reputation +5', detail: 'Guild Reputation이 5 늘어납니다.', automatic: true },
      { id: 'guild-up', tone: 'major-positive', label: '다음 단계로 승급', detail: 'Guild Reputation을 다음 단계의 시작 값으로 올립니다.', automatic: true }
    ]
  },
  {
    subject: '지도',
    cells: [
      { id: 'map-remove-settlement', tone: 'major-negative', label: '정착지 하나가 사라짐', detail: '고른 정착지가 지도에서 야생 위치로 바뀝니다.', automatic: true },
      { id: 'map-remove-path', tone: 'minor-negative', label: '경로 하나가 사라짐', detail: '이어진 두 위치 사이의 경로를 더는 지날 수 없습니다.', automatic: true },
      { id: 'map-add-path', tone: 'minor-positive', label: '경로 하나가 생김', detail: '두 위치 사이에 새 경로를 냅니다.', automatic: true },
      { id: 'map-region', tone: 'major-positive', label: '정착지의 지역이 바뀜', detail: '고른 정착지의 지역 종류를 바꿉니다.', automatic: true }
    ]
  },
  {
    subject: '브리슬리 숲의 야수들',
    cells: [
      { id: 'beasts-service-ban', tone: 'major-negative', label: '길드 서비스 하나 금지', detail: '길드가 특정 서비스를 쓸 수 없게 됩니다. 어떤 서비스인지 적고, 앞으로 그 서비스를 고르지 마세요.', automatic: false },
      { id: 'beasts-location-ban', tone: 'minor-negative', label: '정착지·도시 출입 금지', detail: '이 약제사는 고른 도시나 정착지에 들어가거나 지나갈 수 없습니다.', automatic: true },
      { id: 'beasts-discount', tone: 'minor-positive', label: '물물교환 할인', detail: '특정 정착지에서 물물교환할 때 할인을 받습니다. 원문에 할인 폭이 없으니 정한 내용을 적으세요.', automatic: false },
      { id: 'beasts-clinic', tone: 'major-positive', label: '진료소 개설 또는 제한 해제', detail: '알맞은 위치에 진료소를 열거나 길드 제한을 풉니다. 진료소는 휴식기 화면의 진료소 개설로 기록하세요.', automatic: false }
    ]
  }
];

const REGIONS: Array<{ id: string; label: string }> = [
  { id: 'Forest', label: '숲' },
  { id: 'Meadow', label: '초원' },
  { id: 'Loch', label: '호수' },
  { id: 'Bog', label: '수렁' },
  { id: 'Mountain', label: '산맥' }
];

const isPlaceholderName = (name: string) => /위치\s*\d+$|추가 표시\s*\d+$|^loc_\d+$/i.test(name);

export default function TangibleEffectsPanel({
  reputation,
  trinketCount,
  familiarLabel,
  companions,
  locations,
  onApply,
  onRetire
}: {
  reputation: number;
  trinketCount: number;
  familiarLabel: string | null;
  companions: Array<{ id: string; label: string }>;
  locations: TangibleLocationOption[];
  onApply: (effect: TangibleEffect) => void;
  onRetire: () => void;
}) {
  const [selected, setSelected] = useState<CellId | null>(null);
  const [locationId, setLocationId] = useState('');
  const [otherId, setOtherId] = useState('');
  const [region, setRegion] = useState('Forest');
  const [amount, setAmount] = useState(1);
  const [loseMode, setLoseMode] = useState<'trinkets' | 'companion'>('trinkets');
  const [companionId, setCompanionId] = useState('');
  const [stat, setStat] = useState<'speed' | 'carry'>('speed');
  const [note, setNote] = useState('');

  const sorted = useMemo(() => [...locations].sort((a, b) => {
    const placeholder = Number(isPlaceholderName(a.name)) - Number(isPlaceholderName(b.name));
    return placeholder || a.name.localeCompare(b.name, 'ko');
  }), [locations]);
  const settlements = sorted.filter(row => row.kind === 'settlement' || row.kind === 'city');
  const byId = useMemo(() => new Map(locations.map(row => [row.id, row])), [locations]);
  const neighbors = locationId ? (byId.get(locationId)?.neighbors || []).map(id => byId.get(id)).filter((row): row is TangibleLocationOption => Boolean(row)) : [];

  const cell = TABLE.flatMap(group => group.cells).find(row => row.id === selected) || null;
  const choose = (id: CellId) => {
    setSelected(current => current === id ? null : id);
    setLocationId('');
    setOtherId('');
    setNote('');
  };

  const locationSelect = (value: string, onChange: (id: string) => void, rows: TangibleLocationOption[], label: string) => (
    <label className="tangible-effects__field">
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)}>
        <option value="">고르세요</option>
        {rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
      </select>
    </label>
  );

  const editor = (): { body: React.ReactNode; effect: TangibleEffect | null } => {
    if (!cell) return { body: null, effect: null };
    switch (cell.id) {
      case 'you-retire':
        return { body: <p>은퇴 절차로 넘어갑니다.</p>, effect: { kind: 'retire' } };
      case 'you-lose':
        return {
          body: <>
            <div className="tangible-effects__segmented" role="radiogroup" aria-label="잃는 것">
              <button type="button" aria-pressed={loseMode === 'trinkets'} onClick={() => setLoseMode('trinkets')}>장신구</button>
              <button type="button" aria-pressed={loseMode === 'companion'} onClick={() => setLoseMode('companion')} disabled={companions.length === 0}>동료</button>
            </div>
            {loseMode === 'trinkets'
              ? <label className="tangible-effects__field"><span>잃는 장신구 (보유 {trinketCount}개)</span><input type="number" min={1} max={Math.max(1, trinketCount)} value={amount} onChange={event => setAmount(Math.max(1, Number(event.target.value) || 1))} /></label>
              : <label className="tangible-effects__field"><span>떠나는 동료</span><select value={companionId} onChange={event => setCompanionId(event.target.value)}><option value="">고르세요</option>{companions.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}</select></label>}
          </>,
          effect: loseMode === 'trinkets'
            ? (trinketCount > 0 ? { kind: 'lose-trinkets', amount: Math.min(amount, trinketCount) } : null)
            : (companionId ? { kind: 'lose-companion', companionId } : null)
        };
      case 'you-stat':
        return {
          body: <div className="tangible-effects__segmented" role="radiogroup" aria-label="늘릴 능력치">
            <button type="button" aria-pressed={stat === 'speed'} onClick={() => setStat('speed')}>속도 +1</button>
            <button type="button" aria-pressed={stat === 'carry'} onClick={() => setStat('carry')}>짐 +1</button>
          </div>,
          effect: { kind: 'stat', stat }
        };
      case 'familiar-end':
        return { body: <p>{familiarLabel ? `${familiarLabel}의 혜택이 사라집니다.` : '등록된 길동무 혜택이 없습니다.'}</p>, effect: familiarLabel ? { kind: 'familiar-end' } : null };
      case 'guild-revert':
      case 'guild-up':
        return { body: <p>현재 Guild Reputation {reputation}.</p>, effect: { kind: 'guild-level', direction: cell.id === 'guild-up' ? 'up' : 'down' } };
      case 'guild-minus':
        return { body: null, effect: { kind: 'reputation', amount: -5 } };
      case 'guild-plus':
        return { body: null, effect: { kind: 'reputation', amount: 5 } };
      case 'map-remove-settlement':
        return { body: locationSelect(locationId, setLocationId, settlements, '사라지는 정착지'), effect: locationId ? { kind: 'remove-settlement', locationId } : null };
      case 'map-remove-path':
        return {
          body: <>
            {locationSelect(locationId, id => { setLocationId(id); setOtherId(''); }, sorted, '경로의 한쪽 끝')}
            {locationId && locationSelect(otherId, setOtherId, neighbors, '이어진 다른 쪽 끝')}
          </>,
          effect: locationId && otherId ? { kind: 'close-path', from: locationId, to: otherId } : null
        };
      case 'map-add-path':
        return {
          body: <>
            {locationSelect(locationId, setLocationId, sorted, '새 경로의 한쪽 끝')}
            {locationSelect(otherId, setOtherId, sorted.filter(row => row.id !== locationId), '다른 쪽 끝')}
          </>,
          effect: locationId && otherId && locationId !== otherId ? { kind: 'add-path', from: locationId, to: otherId } : null
        };
      case 'map-region':
        return {
          body: <>
            {locationSelect(locationId, setLocationId, settlements, '지역이 바뀌는 정착지')}
            <label className="tangible-effects__field"><span>새 지역</span><select value={region} onChange={event => setRegion(event.target.value)}>{REGIONS.map(row => <option key={row.id} value={row.id}>{row.label}</option>)}</select></label>
          </>,
          effect: locationId ? { kind: 'change-region', locationId, region } : null
        };
      case 'beasts-location-ban':
        return { body: locationSelect(locationId, setLocationId, settlements, '출입이 막히는 곳'), effect: locationId ? { kind: 'location-ban', locationId } : null };
      default:
        return {
          body: <label className="tangible-effects__field tangible-effects__field--wide"><span>일어난 일</span><textarea rows={2} value={note} onChange={event => setNote(event.target.value)} placeholder="예: 철제 가마솥을 선물받았다" /></label>,
          effect: note.trim() ? { kind: 'record', title: cell.label, text: `${cell.detail}\n${note.trim()}` } : null
        };
    }
  };

  const { body, effect } = editor();

  return (
    <div className="tangible-effects">
      <p className="tangible-effects__intro">여정의 결말이 나, 길동무, 길드, 숲 전체에 남긴 흔적을 고릅니다. 표는 예시이며, 표에 없는 결과는 맨 아래에 적어 두세요.</p>
      {TABLE.map(group => (
        <section key={group.subject} className="tangible-effects__group">
          <h5>{group.subject}</h5>
          <div className="tangible-effects__cells">
            {group.cells.map(row => (
              <button
                key={row.id}
                type="button"
                className={`tangible-effects__cell tangible-effects__cell--${row.tone}`}
                aria-pressed={selected === row.id}
                onClick={() => choose(row.id)}
              >
                <small>{TONE_LABEL[row.tone]}</small>
                <span>{row.label}</span>
              </button>
            ))}
          </div>
          {cell && group.cells.some(row => row.id === cell.id) && (
            <div className="tangible-effects__editor">
              <p>{cell.detail}{cell.automatic ? '' : ' 앱은 이 결과를 일지에 기록합니다.'}</p>
              {body}
              <button
                type="button"
                className="btn-cozy-primary"
                disabled={!effect}
                onClick={() => {
                  if (!effect) return;
                  if (effect.kind === 'retire') onRetire();
                  else onApply(effect);
                  setSelected(null);
                }}
              >{cell.automatic ? '이 결과 적용' : '일지에 기록'}</button>
            </div>
          )}
        </section>
      ))}
      <section className="tangible-effects__group">
        <h5>표에 없는 결과</h5>
        <div className="tangible-effects__editor">
          <label className="tangible-effects__field tangible-effects__field--wide"><span>직접 정한 영구적 결과</span><textarea rows={2} value={selected ? '' : note} disabled={Boolean(selected)} onChange={event => setNote(event.target.value)} placeholder="예: Odoak의 약제사 모임에 초대받았다" /></label>
          <button type="button" className="btn-cozy-secondary" disabled={Boolean(selected) || !note.trim()} onClick={() => { onApply({ kind: 'record', title: '직접 정한 결과', text: note.trim() }); setNote(''); }}>일지에 기록</button>
        </div>
      </section>
    </div>
  );
}
