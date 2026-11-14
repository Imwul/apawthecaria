import type { JournalTab } from '../sessionNavigation';
import { getPatientTimerProjection } from '../patientTimerProjection';
import { readCalendarClocks } from '../calendarTime';
import { getTreatmentAilmentDefinition } from '../rules/treatableAilments';
import { GUILD_REPUTATION_RANKS, guildReputationRank } from '../localization/guildReputation';
import { localizeLocationName, localizeRegionLabel, localizeSeasonLabel, localizeTravelStyle } from '../localization/gameplayKo';

/* The paper character sheet from the rulebook, kept beside the notebook while you play. */

const RANK_KO: Record<string, string> = { Unknown: '무명', Established: '인정받는', Upstanding: '존경받는', Trusted: '신뢰받는' };

/** One Carry point is a circle split in thirds, like the printed sheet's weight pips. */
function CarryPips({ weight, carry }: { weight: number; carry: number }) {
  const slots = Math.max(carry, Math.ceil(weight - 1e-6), 1);
  const thirds = Math.round(weight * 3);
  const r = 9;
  const slice = (index: number) => {
    const a0 = -Math.PI / 2 + (index * 2 * Math.PI) / 3;
    const a1 = a0 + (2 * Math.PI) / 3;
    return `M${r} ${r}L${r + r * Math.cos(a0)} ${r + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${r + r * Math.cos(a1)} ${r + r * Math.sin(a1)}Z`;
  };
  return <span className="sheet-pips" aria-hidden="true">
    {Array.from({ length: slots }, (_, slot) => <svg key={slot} viewBox={`-1 -1 ${2 * r + 2} ${2 * r + 2}`}
      className={`sheet-pip${slot >= carry ? ' sheet-pip--over' : ''}`}>
      {[0, 1, 2].map(part => <path key={part} d={slice(part)} className={slot * 3 + part < thirds ? 'is-filled' : ''} />)}
      <circle cx={r} cy={r} r={r} />
    </svg>)}
  </span>;
}

export default function CharacterSheet({ state, currentWeight, maxCarry, onNavigate, onOpenPatient, onTrinketInspiration }: {
  // The app state is large and loosely typed at this boundary, like the other journal panels.
  state: any; currentWeight: number; maxCarry: number;
  onNavigate: (tab: JournalTab) => void; onOpenPatient: () => void;
  /** p.56: draw three times on the trinket table for inspiration. */
  onTrinketInspiration?: () => void;
}) {
  const bio = state.bio || {};
  const timers = getPatientTimerProjection(state);
  const calendar = readCalendarClocks(state);
  const journeyOn = Boolean(state.journeyActive || state.journey);
  const limit = Math.max(0, Number(state.calendarMaxDays) || 0);
  const used = Math.max(0, calendar.calendarDays);
  const boxes = Math.min(30, Math.max(limit, used));
  const rank = guildReputationRank(Number(state.reputation) || 0);
  const patient = state.patients?.find((row: { id: string; status?: string }) => row.id === state.activePatientId && row.status === 'active');
  const ailments: string[] = (patient?.ailments || [])
    .filter((row: { status?: string }) => row.status === 'active')
    .map((row: { ailmentId?: string; legacyName?: string }) => getTreatmentAilmentDefinition(row.ailmentId || '')?.displayName || row.legacyName || '병증 확인 중');
  const legacyPatient = !patient && state.activeAilment ? state.activeAilment : null;
  const hoursLeft = timers.shortestHours;
  const over = currentWeight > maxCarry + 1e-6;
  const trinketCount = Array.isArray(state.trinkets) ? state.trinkets.length : 0;

  return <aside className="sheet" aria-label="나의 캐릭터 시트">
    <header className="sheet-who">
      <button type="button" className="sheet-who__name" onClick={() => onNavigate('bio')}>
        <strong>{bio.name || '이름 없는 약제사'}</strong>
        <span>{[bio.animal, localizeTravelStyle(bio.travelStyle || '')].filter(Boolean).join(' · ')}</span>
      </button>
      <button type="button" className="sheet-where" onClick={() => onNavigate('map')}>
        {localizeLocationName(state.currentLocationName)} <span>{localizeRegionLabel(state.currentRegion)} · {localizeSeasonLabel(state.currentSeason)}</span>
      </button>
    </header>

    <div className="sheet-stats">
      <div className="sheet-box sheet-box--speed">
        <span className="sheet-label">속도</span>
        <strong>{bio.speed ?? '–'}</strong>
        {bio.canFly ? <small>활공 가능</small> : null}
      </div>
      <button type="button" className={`sheet-box sheet-box--carry${over ? ' is-over' : ''}`} onClick={() => onNavigate('bio')}
        aria-label={`배낭 ${currentWeight.toFixed(2).replace(/\.?0+$/, '')} / ${maxCarry}${over ? ', 한도 초과' : ''}`}>
        <span className="sheet-label">배낭 <b>{Number(currentWeight.toFixed(2))} / {maxCarry}</b></span>
        <CarryPips weight={currentWeight} carry={maxCarry} />
        {over ? <small>무거워서 1경로만 이동해요</small> : null}
      </button>
      <div className="sheet-box sheet-box--trinkets">
        <span className="sheet-label">장신구</span>
        <strong>{trinketCount}</strong>
        {onTrinketInspiration && trinketCount > 0 && <button type="button" className="sheet-trinket-draw" onClick={onTrinketInspiration} title="장신구 영감표 (p.56)에서 세 번 뽑아 어떤 물건인지 정합니다">어떤 물건?</button>}
      </div>
    </div>

    {(patient || legacyPatient) && <button type="button" className={`sheet-patient${hoursLeft === 0 ? ' is-urgent' : ''}`} onClick={onOpenPatient}>
      <span className="sheet-label">지금 돌보는 환자</span>
      <strong>{patient?.name || legacyPatient?.patientName || '이름 없는 환자'}</strong>
      {ailments.length > 0 && <span className="sheet-patient__ailments">{ailments.join(', ')}</span>}
      <span className="sheet-patient__clock">
        {hoursLeft === null ? '기한 확인 필요' : `${hoursLeft}시간 남음`}
        {hoursLeft !== null && hoursLeft > 0 && <span className="sheet-hours" aria-hidden="true">{Array.from({ length: Math.min(hoursLeft, 14) }, (_, i) => <i key={i} />)}</span>}
      </span>
    </button>}

    <section className="sheet-journey" aria-label="여정">
      <h3 className="sheet-heading">여정</h3>
      {journeyOn ? <dl>
        <div><dt>목적지</dt><dd><button type="button" className="sheet-link" onClick={() => onNavigate('map')}>{localizeLocationName(state.journeyDestination) || '미정'}</button></dd></div>
        {state.journeyGoalTitle ? <div><dt>목표</dt><dd>{state.journeyGoalTitle}</dd></div> : null}
      </dl> : <p className="sheet-empty">아직 떠나지 않았어요.</p>}
      <div className="sheet-calendar" role="img" aria-label={journeyOn
        ? `달력 ${used}일째${limit ? `, 기한 ${limit}일` : ''}${limit && used > limit ? `, ${used - limit}일 늦음` : ''}`
        : `지금까지 ${calendar.cumulativeDays}일`}>
        <span className="sheet-calendar__title">달력</span>
        {journeyOn && boxes > 0 ? <span className="sheet-calendar__grid">
          {Array.from({ length: boxes }, (_, i) => <i key={i} className={`${i < used ? 'is-marked' : ''}${limit && i >= limit ? ' is-late' : ''}`} />)}
        </span> : <span className="sheet-calendar__note">총 {calendar.cumulativeDays}일 지남</span>}
      </div>
    </section>

    <section className="sheet-familiar" aria-label="길동무">
      <h3 className="sheet-heading">길동무</h3>
      <strong>{bio.familiarName || '아직 없음'}</strong>
      {bio.familiarAnimal ? <span>{bio.familiarAnimal}</span> : null}
      {bio.familiarBenefit ? <p>{bio.familiarBenefit}</p> : null}
    </section>

    <section className="sheet-guild" aria-label="길드 명성">
      <h3 className="sheet-heading">길드 명성 <b>{state.reputation ?? 0}</b></h3>
      <ul>
        {[...GUILD_REPUTATION_RANKS].reverse().map(row => <li key={row.label} className={row.label === rank ? 'is-current' : ''}>
          <span aria-hidden="true">{row.label === rank ? '☑' : '☐'}</span> {RANK_KO[row.label]} <small>{row.minimum}+</small>
        </li>)}
      </ul>
    </section>
  </aside>;
}
