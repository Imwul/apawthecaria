import { BARROW_DELVE_BY_ID, REAGENT_BY_ID, TOOL_BY_ID, type BarrowDelveId } from '../rules';
import {
  localizeBehemothClass,
  localizeCanonicalToolName,
  localizeInventoryItemName
} from '../localization/gameplayKo';
import { localizeGameplayMessage } from '../localization/engineMessagesKo';

const delveStepLabels: Record<string, string> = {
  ready: '입구',
  challenge: '도전',
  'awaiting-choice': '선택 대기',
  resolved: '귀환'
};

const delveNameLabels: Record<string, string> = {
  'Uneasy Sleep': '불안한 잠',
  'Collapsed Entrance': '무너진 입구',
  'The Bellies of Many': '수많은 허기',
  'Inside Job': '내부 소행',
  'Potent Poison': '맹독',
  'Pilfer Unnoticed': '들키지 않고 훔치기',
  'Building Trust': '신뢰 쌓기',
  'Suitable Furnishings': '알맞은 가구'
};

const challengeLabels: Record<string, string> = {
  'Soporific Incense': '수면 향',
  'Invigorating Tea': '활력 차',
  'Silent Service': '조용한 시중',
  'Nefarious Concoction': '사악한 조제물',
  'Potent Poison': '맹독',
  'Steal Everything': '모조리 훔치기',
  'The Strength of a Union': '연대의 힘',
  'Making a House into a Home': '집을 보금자리로'
};

const selectedItemLabel = (item: any): string => {
  if (typeof item === 'string') {
    const reagent = REAGENT_BY_ID.get(item);
    const tool = TOOL_BY_ID.get(item);
    if (reagent) return reagent.canonicalName;
    if (tool) return localizeCanonicalToolName(tool.canonicalName);
    return localizeInventoryItemName(item);
  }
  const reagent = REAGENT_BY_ID.get(item?.reagentId);
  const preparation = reagent?.preparations.find(row => row.id === item?.preparationId);
  if (reagent && preparation) {
    return localizeInventoryItemName(`${reagent.canonicalName} (${preparation.name}, ${preparation.method})`);
  }
  return localizeInventoryItemName(item?.itemId || '이름 없는 영약재');
};

const rewardToolLabel = (toolId: string): string => {
  const tool = TOOL_BY_ID.get(toolId);
  return localizeCanonicalToolName(tool?.canonicalName || toolId);
};

export function BarrowPanel({ delve }: { delve: any }) {
  if (!delve) return null;
  const legacyIds: Record<string, BarrowDelveId> = {
    UneasySleep: 'uneasy-sleep', CollapsedEntrance: 'collapsed-entrance', BelliesOfMany: 'bellies-of-many',
    InsideJob: 'inside-job', PotentPoison: 'potent-poison', StealEverything: 'pilfer-unnoticed',
    BuildingTrust: 'building-trust', SuitableFurnishings: 'suitable-furnishings'
  };
  const delveId = (delve.delveId || legacyIds[delve.challengeType]) as BarrowDelveId | undefined;
  const definition = delveId ? BARROW_DELVE_BY_ID.get(delveId) : null;
  const requirements = delve.requirements || definition?.requiredTags.map(row => `${row.tag} ${row.value}${row.count ? ` x${row.count}` : ''}`) || [];
  const cards = delve.cards || (delve.cardsDrawn || []).map((value: string) => ({ value }));
  const selected = delve.selectedItems || delve.reagentsGathered || [];
  const step = delve.currentStep || (delve.challengeType ? 'challenge' : 'ready');
  const progress = delve.progress ?? delve.points ?? 0;
  const timer = delve.timer ?? definition?.initialTimer ?? 0;
  const unresolved = delve.unresolvedChoices || [];
  const reward = delve.reward || {};
  return <section className="barrow-panel barrow-field-note" aria-labelledby="barrow-heading" data-delve={delveId}>
    <header className="barrow-field-note__header">
      <div>
        <span className="status-label status-label--unresolved">고분 탐사 기록</span>
        <h2 id="barrow-heading">{delveNameLabels[definition?.name || ''] || definition?.name || delve.behemothName || '고분 탐사'}</h2>
        <p>{challengeLabels[definition?.challenge || ''] || definition?.challenge || delve.behemothName} · {localizeBehemothClass(definition?.behemothClass || delve.behemothClass)} · 원문 p.{definition?.sourcePage || delve.sourcePage || '116–125'}</p>
      </div>
      <div className="barrow-field-note__suit" aria-label="도전 문양">{delve.challengeSuit || delve.suit || '·'}</div>
    </header>

    <ol className="barrow-steps" aria-label="고분 진행 단계">
      {['ready', 'challenge', 'awaiting-choice', 'resolved'].map((row, index) => <li key={row} className={row === step ? 'is-current' : index < ['ready', 'challenge', 'awaiting-choice', 'resolved'].indexOf(step) ? 'is-done' : ''}><span>{index + 1}</span>{row === 'ready' ? '입구' : row === 'challenge' ? '도전' : row === 'awaiting-choice' ? '선택' : '귀환'}</li>)}
    </ol>

    <div className="barrow-field-note__ledger">
      <dl>
        <div><dt>현재 단계</dt><dd>{delveStepLabels[step] || step}</dd></div>
        <div><dt>진행도</dt><dd>{progress}</dd></div>
        <div><dt>타이머</dt><dd>{timer}</dd></div>
        <div><dt>후퇴 비용</dt><dd>{delve.fleeState?.costDays ?? 1}일 · 다음 속도 {delve.fleeState?.nextMoveSpeed ?? 1}</dd></div>
      </dl>
      <div className="barrow-field-note__column"><span>뽑은 카드</span><strong>{cards.length ? cards.map((card: any) => `${card.suit || ''}${card.ruleValue ?? card.value ?? ''}`).join(' · ') : '아직 없음'}</strong></div>
      <div className="barrow-field-note__column"><span>선택한 영약재와 도구</span><strong>{selected.length ? selected.map(selectedItemLabel).join(' · ') : '아직 없음'}</strong></div>
      <div className="barrow-field-note__column"><span>보상</span><strong>{reward.trinkets ? `장신구 ${reward.trinkets}` : ''}{reward.reputation ? ` · 명성 ${reward.reputation}` : ''}{reward.toolId ? ` · ${rewardToolLabel(reward.toolId)}` : ''}{!reward.trinkets && !reward.reputation && !reward.toolId ? '도전 결과에 따라 기록' : ''}</strong></div>
      <div className="barrow-field-note__column"><span>지도 결과</span><strong>{delve.removedFromMap ? '고분이 지도에서 사라짐' : '해결 전까지 현재 위치 유지'}</strong></div>
    </div>

    {requirements.length > 0 && <div className="barrow-requirements"><span>필요한 처방</span><ul>{requirements.map((row: string) => <li key={row}>{row}</li>)}</ul></div>}
    {unresolved.length > 0 && <div className="barrow-unresolved"><span>선택 필요</span>{unresolved.map(localizeGameplayMessage).join(' · ')}</div>}
    <p className="barrow-panel__note">새로고침해도 이 단계가 저장됩니다. 도전을 시작한 뒤에는 현재 판정 결과 또는 원문의 후퇴 절차로만 탐사를 마칠 수 있습니다.</p>
  </section>;
}
