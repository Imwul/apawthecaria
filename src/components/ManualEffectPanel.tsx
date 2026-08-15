import { lazy, Suspense } from 'react';
import { drawDeterministicFollowUpCard, resolveFollowUpCard, resolveFollowUpCardSet, type CardSuit, type ManualEffectDraft } from '../rules';
import {
  localizeManualEffectLine,
  localizeManualEffectOption,
  localizeManualEffectText,
  localizeManualEffectTrigger,
  localizeManualEffectValue
} from '../localization/manualEffectKo';

const RulebookSourceContext = lazy(() => import('./RulebookSourceContext'));

export default function ManualEffectPanel({
  draft,
  inventoryItems = [],
  timers = [],
  locationOptions = [],
  onChange,
  onDefer,
  onResolve
}: {
  draft: ManualEffectDraft;
  inventoryItems?: Array<{ id: string; name: string }>;
  timers?: Array<{ id: string; label: string }>;
  locationOptions?: Array<{ id: string; label: string; detail?: string }>;
  onChange: (draft: ManualEffectDraft) => void;
  onDefer: () => void;
  onResolve: (override: boolean) => void;
}) {
  const update = (patch: Partial<ManualEffectDraft>) => onChange({ ...draft, ...patch });
  const updateInput = (id: string, value: string | number | boolean) => update({ inputValues: { ...draft.inputValues, [id]: value } });
  const cardFields = draft.inputFields.filter(field => field.type === 'card-reference');
  const cardsFromValues = (values: ManualEffectDraft['inputValues']) => Object.fromEntries(cardFields.flatMap(field => {
    const suit = String(values[`${field.id}-suit`] || (field.id === 'follow-up-card' ? values['follow-up-suit'] : '')) as CardSuit;
    const value = Number(values[`${field.id}-value`] || (field.id === 'follow-up-card' ? values['follow-up-value'] : 0));
    return suit && value > 0 ? [[field.id, { suit, value }]] : [];
  }));
  const applyFollowUpCard = (fieldId: string, suit: CardSuit, value: number) => {
    const resolved = resolveFollowUpCard(draft, { suit, value });
    const inputValues = {
      ...draft.inputValues,
      [fieldId]: resolved.label,
      [`${fieldId}-suit`]: suit,
      [`${fieldId}-value`]: value
    };
    if (fieldId === 'follow-up-card') {
      inputValues['follow-up-suit'] = suit;
      inputValues['follow-up-value'] = value;
    }
    inputValues['follow-up-result'] = resolveFollowUpCardSet(draft, cardsFromValues(inputValues)) || resolved.outcome;
    update({ inputValues });
  };
  const clearFollowUpCard = (fieldId: string) => {
    const inputValues = { ...draft.inputValues };
    delete inputValues[fieldId];
    delete inputValues[`${fieldId}-suit`];
    delete inputValues[`${fieldId}-value`];
    inputValues['follow-up-result'] = resolveFollowUpCardSet(draft, cardsFromValues(inputValues));
    update({ inputValues });
  };
  const requiredComplete = draft.inputFields.every(field => !field.required || draft.inputValues[field.id] === true || String(draft.inputValues[field.id] ?? '').trim().length > 0);
  const selectedActions = draft.actionTemplates.filter(action => draft.selectedActionIds.includes(action.id));
  const localizedPrintedText = localizeManualEffectText(draft.summary, draft.printedText);
  const hasLocalizedPrintedText = localizedPrintedText !== draft.printedText;
  const actionTargetsComplete = selectedActions.every(action =>
    action.targetType !== 'inventory-item'
    && action.targetType !== 'location'
    && action.targetType !== 'free-text'
      ? true
      : Boolean(draft.actionTargets[action.id]?.trim())
  );
  const canResolve = requiredComplete && actionTargetsComplete && draft.resultSummary.trim().length > 0 && draft.journalNote.trim().length > 0;

  return <section className="manual-effect" aria-labelledby="manual-effect-title">
    <header>
      <span className="status-label status-label--manual">직접 처리 필요</span>
      <h2 id="manual-effect-title">{draft.summary}</h2>
      <p>{draft.ruleIds.join(' · ')} · 원문 p.{draft.sourcePage} · {localizeManualEffectTrigger(draft.trigger)}</p>
    </header>

    <div className="manual-effect__source">
      <h3>{hasLocalizedPrintedText ? '한국어 효과 안내' : '원문 효과'}</h3>
      <p>{localizedPrintedText}</p>
      {hasLocalizedPrintedText && <details><summary>영문 원문 보기</summary><p>{draft.printedText}</p></details>}
    </div>
    <Suspense fallback={<p className="manual-effect__context-loading">원문 맥락을 준비하는 중...</p>}>
      <RulebookSourceContext ownerId={draft.ownerId} page={draft.sourcePage} />
    </Suspense>
    <div className="manual-effect__resolve"><h3>해야 할 일</h3><p>{localizeManualEffectValue(draft.resolutionInstruction)}</p></div>
    {draft.mandatoryConditions.length > 0 && <div><h3>확인할 조건</h3><ul>{draft.mandatoryConditions.map((row, index) => <li key={`${index}:${row}`}>{localizeManualEffectLine(row)}</li>)}</ul></div>}

    <div className="manual-effect__fields">
      <h3>결과 입력</h3>
      {draft.inputFields.map(field => {
        const value = draft.inputValues[field.id];
        if (field.type === 'choice') return <label key={field.id}><span>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</span><select value={String(value ?? '')} onChange={event => updateInput(field.id, event.target.value)}><option value="">선택하지 않음</option>{(field.options || []).map(option => <option key={option} value={option}>{localizeManualEffectOption(option)}</option>)}</select></label>;
        if (field.type === 'number') return <label key={field.id}><span>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</span><input type="number" value={typeof value === 'number' ? value : ''} onChange={event => updateInput(field.id, Number(event.target.value))} /></label>;
        if (field.type === 'condition') return <label key={field.id} className="manual-effect__check"><input type="checkbox" checked={value === true} onChange={event => updateInput(field.id, event.target.checked)} /><span>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</span></label>;
        if (field.type === 'card-reference') {
          const suit = String(draft.inputValues[`${field.id}-suit`] || (field.id === 'follow-up-card' ? draft.inputValues['follow-up-suit'] : '') || '♥') as CardSuit;
          const cardValue = Number(draft.inputValues[`${field.id}-value`] || (field.id === 'follow-up-card' ? draft.inputValues['follow-up-value'] : 0) || (field.required ? 1 : 0));
          const isLastCard = cardFields.at(-1)?.id === field.id;
          return <fieldset key={field.id} className="manual-effect__card-wizard"><legend>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</legend><p>앱에서 뽑거나 실제 카드의 문양과 값을 선택하세요. Q와 K는 룰북의 M(12)로 판정합니다.</p><div><select aria-label={`${field.label} 문양`} value={suit} onChange={event => applyFollowUpCard(field.id, event.target.value as CardSuit, Math.max(1, cardValue))}>{['♥', '♦', '♣', '♠'].map(row => <option key={row} value={row}>{row}</option>)}</select><select aria-label={`${field.label} 값`} value={cardValue} onChange={event => Number(event.target.value) > 0 ? applyFollowUpCard(field.id, suit, Number(event.target.value)) : clearFollowUpCard(field.id)}>{!field.required && <option value={0}>사용하지 않음</option>}{Array.from({ length: 13 }, (_, index) => index + 1).map(row => <option key={row} value={row}>{row === 1 ? 'A' : row === 11 ? 'J' : row >= 12 ? `M (${row === 12 ? 'Q' : 'K'})` : row}</option>)}</select><button type="button" onClick={() => { const card = drawDeterministicFollowUpCard(`${draft.effectId}:${field.id}:${Date.now()}`); applyFollowUpCard(field.id, card.suit, card.value); }}>카드 뽑기</button></div>{value && <strong>기록된 카드: {String(value)}</strong>}{isLastCard && draft.inputValues['follow-up-result'] && <output>{localizeManualEffectLine(String(draft.inputValues['follow-up-result']))}</output>}</fieldset>;
        }
        return <label key={field.id}><span>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</span>{field.type === 'free-text' ? <textarea rows={3} value={String(value ?? '')} onChange={event => updateInput(field.id, event.target.value)} /> : <input value={String(value ?? '')} onChange={event => updateInput(field.id, event.target.value)} placeholder={field.helpText ? localizeManualEffectValue(field.helpText) : undefined} />}</label>;
      })}
    </div>

    {draft.actionTemplates.length > 0 && <div className="manual-effect__canonical"><h3>앱 상태에 적용할 변화</h3><p>이번에 실제로 발생한 원문 결과만 선택하세요. 적용 전 내용을 확인할 수 있습니다.</p>{draft.actionTemplates.map(action => {
      const selected = draft.selectedActionIds.includes(action.id);
      const target = draft.actionTargets[action.id] || '';
      return <div key={action.id} className="manual-effect__action-row">
        <label className="manual-effect__check"><input type="checkbox" checked={selected} onChange={event => update({ selectedActionIds: event.target.checked ? [...draft.selectedActionIds, action.id] : draft.selectedActionIds.filter(id => id !== action.id) })} /><span>{localizeManualEffectValue(action.label)}</span></label>
        <small>{localizeManualEffectLine(action.sourceText)}</small>
        {selected && action.targetType === 'inventory-item' && <select aria-label={`${localizeManualEffectValue(action.label)} 대상`} value={target} onChange={event => update({ actionTargets: { ...draft.actionTargets, [action.id]: event.target.value } })}><option value="">가방에서 선택</option>{inventoryItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
        {selected && action.targetType === 'timer' && <select aria-label={`${localizeManualEffectValue(action.label)} 대상`} value={target} onChange={event => update({ actionTargets: { ...draft.actionTargets, [action.id]: event.target.value } })}><option value="">모든 활성 타이머</option>{timers.map(timer => <option key={timer.id} value={timer.id}>{timer.label}</option>)}</select>}
        {selected && action.targetType === 'location' && <select aria-label={`${localizeManualEffectValue(action.label)} 지도 대상`} value={target} onChange={event => update({ actionTargets: { ...draft.actionTargets, [action.id]: event.target.value } })}><option value="">지도에서 Location 선택</option>{locationOptions.map(option => <option key={option.id} value={`location:${option.id}`}>{option.label}{option.detail ? ` · ${option.detail}` : ''}</option>)}</select>}
        {selected && action.targetType === 'free-text' && <input aria-label={`${localizeManualEffectValue(action.label)} 대상 또는 결과`} value={target} onChange={event => update({ actionTargets: { ...draft.actionTargets, [action.id]: event.target.value } })} placeholder="원문이 지정한 대상이나 결과" />}
      </div>;
    })}{selectedActions.length > 0 && <div className="manual-effect__preview"><strong>적용 미리보기</strong><ul>{selectedActions.map(action => <li key={action.id}>{localizeManualEffectValue(action.label)}{draft.actionTargets[action.id] ? ` · ${draft.actionTargets[action.id]}` : ''}</li>)}</ul></div>}</div>}

    {draft.followUpRequirements.length > 0 && <div className="manual-effect__follow-up"><h3>후속 판정</h3><ul>{draft.followUpRequirements.map((row, index) => <li key={`${index}:${row}`}>{localizeManualEffectLine(row)}</li>)}</ul><p>지금 완료 내용을 입력하지 않으면 별도의 미해결 후속 판정으로 저장됩니다.</p></div>}
    <label><span>판정 결과 요약 *</span><textarea value={draft.resultSummary} onChange={event => update({ resultSummary: event.target.value })} rows={3} /></label>
    <label><span>저널 기록 *</span><textarea value={draft.journalNote} onChange={event => update({ journalNote: event.target.value })} rows={4} /></label>
    <label><span>예외 처리 사유</span><textarea value={draft.overrideReason} onChange={event => update({ overrideReason: event.target.value })} rows={2} placeholder="원문과 다른 처리를 선택할 때만 작성" /></label>
    <div className="manual-effect__actions"><button type="button" onClick={onDefer}>나중에 처리</button><button type="button" className="btn-cozy-primary" disabled={!canResolve} onClick={() => onResolve(false)}>미리보기대로 적용</button><button type="button" className="btn-cozy-danger" disabled={!canResolve || !draft.overrideReason.trim()} onClick={() => onResolve(true)}>예외로 기록</button></div>
  </section>;
}
