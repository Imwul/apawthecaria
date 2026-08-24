import { lazy, Suspense } from 'react';
import type { ManualEffectDraft } from '../rules';
import { ENCOUNTERS } from '../rules/data/encounters';
import {
  localizeEncounterDisplayText,
  localizeEncounterTitle,
  localizeManualEffectLine,
  localizeManualEffectOption,
  localizeManualEffectText,
  localizeManualEffectTrigger,
  localizeManualEffectValue
} from '../localization/manualEffectKo';

const RulebookSourceContext = lazy(() => import('./RulebookSourceContext'));

const normalizeChoiceHeading = (value: string): string => {
  const heading = value.split(/\s+[—–-]\s+/u, 1)[0] || value;
  return heading.toLowerCase().replace(/[^a-z0-9가-힣]+/gu, ' ').trim();
};

const manualReason = (draft: ManualEffectDraft): string => {
  if (draft.ownerType === 'encounter') {
    return draft.choices.length > 0
      ? '이 장면의 선택과 서사적 결과는 원문이 플레이어에게 맡깁니다. 앱이 결론을 추측하지 않고, 당신이 고른 결과만 캠페인에 반영하기 위해 이 단계가 열렸습니다.'
      : '이 장면은 원문을 읽고 직접 판단하거나 묘사해야 합니다. 앱은 답을 대신 만들지 않고, 당신이 정한 결과와 실제로 바뀐 값만 기록합니다.';
  }
  return '이 효과는 원문이 조건이나 결과를 플레이어에게 맡깁니다. 아래에서 실제로 일어난 결과를 고르면 앱은 확인한 변화만 캠페인에 반영합니다.';
};

export default function ManualEffectPanel({
  draft,
  inventoryItems = [],
  timers = [],
  onChange,
  onDefer,
  onResolve
}: {
  draft: ManualEffectDraft;
  inventoryItems?: Array<{ id: string; name: string }>;
  timers?: Array<{ id: string; label: string }>;
  onChange: (draft: ManualEffectDraft) => void;
  onDefer: () => void;
  onResolve: (override: boolean) => void;
}) {
  const update = (patch: Partial<ManualEffectDraft>) => onChange({ ...draft, ...patch });
  const updateInput = (id: string, value: string | number | boolean) => update({ inputValues: { ...draft.inputValues, [id]: value } });
  const requiredComplete = draft.inputFields.every(field => !field.required || draft.inputValues[field.id] === true || String(draft.inputValues[field.id] ?? '').trim().length > 0);
  const selectedActions = draft.actionTemplates.filter(action => draft.selectedActionIds.includes(action.id));
  const encounter = draft.ownerType === 'encounter'
    ? ENCOUNTERS.find(candidate => candidate.id === draft.ownerId)
    : undefined;
  const localizedPrintedText = draft.ownerType === 'encounter'
    ? localizeEncounterDisplayText(draft.summary, draft.printedText, draft.ownerId)
    : localizeManualEffectText(draft.summary, draft.printedText);
  const localizedSummary = draft.ownerType === 'encounter'
    ? localizeEncounterTitle(draft.summary, draft.ownerId)
    : localizeManualEffectValue(draft.summary);
  const localizedResolutionInstruction = draft.summary
    ? localizeManualEffectValue(draft.resolutionInstruction).replaceAll(draft.summary, localizedSummary)
    : localizeManualEffectValue(draft.resolutionInstruction);
  const hasLocalizedPrintedText = localizedPrintedText !== draft.printedText;
  const savedSourceLabel = /[가-힣]/u.test(draft.printedText) ? '저장 당시 문구 보기' : '영문 원문 보기';
  const actionTargetsComplete = selectedActions.every(action =>
    action.targetType !== 'inventory-item'
    && action.targetType !== 'location'
    && action.targetType !== 'free-text'
      ? true
      : Boolean(draft.actionTargets[action.id]?.trim())
  );
  const canResolve = requiredComplete && actionTargetsComplete && draft.resultSummary.trim().length > 0;
  const hasChoiceField = draft.inputFields.some(field => field.type === 'choice');

  const localizedOption = (option: string, optionIndex: number, options: string[]): string => {
    const normalizedOption = normalizeChoiceHeading(option);
    const matchedChoice = encounter?.choices.find(choice =>
      choice.label === option || normalizeChoiceHeading(choice.label) === normalizedOption
    ) || (encounter?.choices.length === options.length ? encounter.choices[optionIndex] : undefined);
    return localizeManualEffectOption(option, encounter ? draft.ownerId : undefined, matchedChoice?.id);
  };

  return <section className="manual-effect" aria-labelledby="manual-effect-title">
    <header className="manual-effect__header">
      <span className="status-label status-label--manual">플레이어 판단이 필요한 장면</span>
      <h2 id="manual-effect-title">{localizedSummary}</h2>
      <p>{draft.ruleIds.join(' · ')} · 원문 p.{draft.sourcePage} · {localizeManualEffectTrigger(draft.trigger)}</p>
    </header>

    <aside className="manual-effect__why" aria-labelledby="manual-effect-why-title">
      <h3 id="manual-effect-why-title">왜 직접 고르나요?</h3>
      <p>{manualReason(draft)}</p>
    </aside>

    <section className="manual-effect__stage manual-effect__stage--scene" aria-labelledby="manual-effect-scene-title">
      <div className="manual-effect__stage-heading">
        <span aria-hidden="true">1</span>
        <div>
          <h3 id="manual-effect-scene-title">장면을 읽고 고르기</h3>
          <p>원문 장면을 떠올리고, 실제로 택한 분기와 서사적 답을 남기세요.</p>
        </div>
      </div>

      <div className="manual-effect__source">
        <h4>{hasLocalizedPrintedText ? '장면' : '원문 장면'}</h4>
        <p>{localizedPrintedText}</p>
        {hasLocalizedPrintedText && <details><summary>{savedSourceLabel}</summary><p>{draft.printedText}</p></details>}
      </div>

      <div className="manual-effect__resolve">
        <h4>이 장면에서 할 일</h4>
        <p>{localizedResolutionInstruction}</p>
      </div>

      {draft.mandatoryConditions.length > 0 && <div className="manual-effect__conditions"><h4>먼저 확인</h4><ul>{draft.mandatoryConditions.map((row, index) => <li key={`${index}:${row}`}>{localizeManualEffectLine(row)}</li>)}</ul></div>}

      <div className="manual-effect__fields">
        <h4>내가 정한 결과</h4>
        {draft.inputFields.map(field => {
          const value = draft.inputValues[field.id];
          if (field.type === 'choice') {
            const options = field.options || [];
            return <fieldset key={field.id} className="manual-effect__choice-field">
              <legend>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</legend>
              <div className="manual-effect__choice-list">
                {options.map((option, optionIndex) => {
                  const selected = value === option;
                  return <button
                    key={option}
                    type="button"
                    className={`manual-effect__choice-option${selected ? ' is-selected' : ''}`}
                    aria-pressed={selected}
                    onClick={() => updateInput(field.id, selected ? '' : option)}
                  >{localizedOption(option, optionIndex, options)}</button>;
                })}
              </div>
              {!field.required && <small>선택한 항목을 다시 누르면 비울 수 있습니다.</small>}
            </fieldset>;
          }
          if (field.type === 'number') return <label key={field.id}><span>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</span><input type="number" value={typeof value === 'number' ? value : ''} onChange={event => updateInput(field.id, event.target.value === '' ? '' : Number(event.target.value))} />{field.helpText && <small>{localizeManualEffectValue(field.helpText)}</small>}</label>;
          if (field.type === 'condition') return <label key={field.id} className="manual-effect__check"><input type="checkbox" checked={value === true} onChange={event => updateInput(field.id, event.target.checked)} /><span>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</span></label>;
          return <label key={field.id}><span>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</span>{field.type === 'free-text' ? <textarea rows={3} value={String(value ?? '')} onChange={event => updateInput(field.id, event.target.value)} placeholder={field.helpText ? localizeManualEffectValue(field.helpText) : undefined} /> : <input value={String(value ?? '')} onChange={event => updateInput(field.id, event.target.value)} placeholder={field.helpText ? localizeManualEffectValue(field.helpText) : undefined} />}{field.helpText && field.type === 'free-text' && <small>{localizeManualEffectValue(field.helpText)}</small>}</label>;
        })}
        {!hasChoiceField && draft.choices.length > 0 && <div className="manual-effect__choice-reference"><strong>원문 선택지</strong><ul>{draft.choices.map((option, optionIndex) => <li key={option}>{localizedOption(option, optionIndex, draft.choices)}</li>)}</ul></div>}
      </div>

      <Suspense fallback={<p className="manual-effect__context-loading">원문 맥락을 준비하는 중...</p>}>
        <RulebookSourceContext ownerId={draft.ownerId} page={draft.sourcePage} />
      </Suspense>
    </section>

    <section className="manual-effect__stage manual-effect__stage--changes" aria-labelledby="manual-effect-changes-title">
      <div className="manual-effect__stage-heading">
        <span aria-hidden="true">2</span>
        <div>
          <h3 id="manual-effect-changes-title">바뀌는 값 확인하기</h3>
          <p>장면에서 실제로 일어난 변화만 골라 적용하세요. 고르지 않은 변화는 저장되지 않습니다.</p>
        </div>
      </div>

      {draft.actionTemplates.length > 0 ? <div className="manual-effect__canonical">{draft.actionTemplates.map(action => {
        const selected = draft.selectedActionIds.includes(action.id);
        const target = draft.actionTargets[action.id] || '';
        return <div key={action.id} className={`manual-effect__action-row${selected ? ' is-selected' : ''}`}>
          <label className="manual-effect__check"><input type="checkbox" checked={selected} onChange={event => update({ selectedActionIds: event.target.checked ? [...draft.selectedActionIds, action.id] : draft.selectedActionIds.filter(id => id !== action.id) })} /><span>{localizeManualEffectValue(action.label)}</span></label>
          <small>{localizeManualEffectLine(action.sourceText)}</small>
          {selected && action.targetType === 'inventory-item' && <select aria-label={`${localizeManualEffectValue(action.label)} 대상`} value={target} onChange={event => update({ actionTargets: { ...draft.actionTargets, [action.id]: event.target.value } })}><option value="">가방에서 선택</option>{inventoryItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
          {selected && action.targetType === 'timer' && <select aria-label={`${localizeManualEffectValue(action.label)} 대상`} value={target} onChange={event => update({ actionTargets: { ...draft.actionTargets, [action.id]: event.target.value } })}><option value="">모든 활성 타이머</option>{timers.map(timer => <option key={timer.id} value={timer.id}>{timer.label}</option>)}</select>}
          {selected && (action.targetType === 'location' || action.targetType === 'free-text') && <input aria-label={`${localizeManualEffectValue(action.label)} 대상 또는 결과`} value={target} onChange={event => update({ actionTargets: { ...draft.actionTargets, [action.id]: event.target.value } })} placeholder="원문이 지정한 대상이나 결과" />}
        </div>;
      })}{selectedActions.length > 0 && <div className="manual-effect__preview"><strong>적용할 변화</strong><ul>{selectedActions.map(action => <li key={action.id}>{localizeManualEffectValue(action.label)}{draft.actionTargets[action.id] ? ` · ${draft.actionTargets[action.id]}` : ''}</li>)}</ul></div>}</div>
        : <p className="manual-effect__no-change">이 판정은 앱의 수치를 자동으로 바꾸지 않습니다. 아래에 장면의 결과만 기록하면 됩니다.</p>}

      {draft.followUpRequirements.length > 0 && <div className="manual-effect__follow-up"><h4>이어서 확인할 판정</h4><ul>{draft.followUpRequirements.map((row, index) => <li key={`${index}:${row}`}>{localizeManualEffectLine(row)}</li>)}</ul><p>지금 완료 내용을 입력하지 않으면 별도의 미해결 후속 판정으로 저장됩니다.</p></div>}
    </section>

    <section className="manual-effect__stage manual-effect__stage--record" aria-labelledby="manual-effect-record-title">
      <div className="manual-effect__stage-heading">
        <span aria-hidden="true">3</span>
        <div>
          <h3 id="manual-effect-record-title">결과를 기록하기</h3>
          <p>나중에 캠페인을 이어도 이 장면을 기억할 수 있도록 짧게 남기세요.</p>
        </div>
      </div>

      <div className="manual-effect__record-fields">
        <label><span>판정 결과 요약 *</span><textarea value={draft.resultSummary} onChange={event => update({ resultSummary: event.target.value })} rows={3} placeholder="무엇을 골랐고, 어떤 일이 일어났나요?" /></label>
        <label><span>저널 기록 <small>선택 · 비우면 판정 결과 요약을 그대로 기록합니다</small></span><textarea value={draft.journalNote} onChange={event => update({ journalNote: event.target.value })} rows={4} placeholder="이 장면을 더 자세히 기억하고 싶을 때 적어 두세요." /></label>
      </div>

      <details className="manual-effect__override">
        <summary>원문과 다르게 처리해야 하나요?</summary>
        <label><span>예외 처리 사유</span><textarea value={draft.overrideReason} onChange={event => update({ overrideReason: event.target.value })} rows={2} placeholder="원문과 다른 처리를 선택한 이유" /></label>
      </details>

      <div className="manual-effect__actions"><button type="button" onClick={onDefer}>잠시 덮어두기</button><button type="button" className="btn-cozy-primary" disabled={!canResolve} onClick={() => onResolve(false)}>이 결과 적용하고 기록</button><button type="button" className="btn-cozy-danger" disabled={!canResolve || !draft.overrideReason.trim()} onClick={() => onResolve(true)}>원문과 다르게 기록</button></div>
    </section>
  </section>;
}
