import { lazy, Suspense, useRef, useState } from 'react';
import type { ManualEffectDraft } from '../rules';
import { isPrintedResolutionInputSatisfied } from '../rules/printedEffects';
import { ENCOUNTERS } from '../rules/data/encounters';
import {
  patchManualEffectDraft,
  setManualEffectActionSelected,
  setManualEffectActionTarget,
  setManualEffectInput,
  type ManualEffectDraftUpdater
} from '../manualEffectDraftState';
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

type ManualEffectRecordText = Pick<ManualEffectDraft, 'resultSummary' | 'journalNote' | 'overrideReason'>;

const recordTextFor = (draft: ManualEffectDraft): ManualEffectRecordText => ({
  resultSummary: draft.resultSummary,
  journalNote: draft.journalNote,
  overrideReason: draft.overrideReason
});

export default function ManualEffectPanel({
  draft,
  inventoryItems = [],
  timers = [],
  mapLocations = [],
  currentLocation = null,
  onChange,
  onDefer,
  onResolve
}: {
  draft: ManualEffectDraft;
  inventoryItems?: Array<{ id: string; name: string }>;
  timers?: Array<{ id: string; label: string }>;
  mapLocations?: Array<{ id: string; name: string; region?: string; kind?: string }>;
  currentLocation?: { id: string; name: string; region?: string; kind?: string } | null;
  onChange: (updater: ManualEffectDraftUpdater) => void;
  onDefer: (recordText?: ManualEffectRecordText) => void;
  onResolve: (override: boolean, recordText?: ManualEffectRecordText) => void;
}) {
  // Keep free-form judgement notes local while they are being typed. Updating
  // the campaign state on every keystroke re-renders the whole app (and queues
  // a save), which makes long-running campaigns feel like a frozen textarea.
  // The parent receives the text on blur or when the player commits/defer the
  // manual result, so gameplay state and persistence still use the final text.
  // App keys this panel by effect id, so a new pending effect gets a fresh
  // record draft without synchronously resetting state in an effect.
  const [recordText, setRecordText] = useState<ManualEffectRecordText>(() => recordTextFor(draft));
  const recordTextRef = useRef(recordText);
  const updateRecordText = (key: keyof ManualEffectRecordText, value: string) => {
    const next = { ...recordTextRef.current, [key]: value };
    recordTextRef.current = next;
    setRecordText(next);
  };
  const commitRecordText = () => {
    const next = recordTextRef.current;
    if (next.resultSummary === draft.resultSummary
      && next.journalNote === draft.journalNote
      && next.overrideReason === draft.overrideReason) return;
    onChange(patchManualEffectDraft(next));
  };
  const updateInput = (id: string, value: string | number | boolean) => onChange(setManualEffectInput(id, value));
  const mapLocationFor = (key: string, value: string): { id: string; name: string } | null => {
    const selectedId = draft.mapTargetIds?.[key];
    return mapLocations.find(location => location.id === selectedId)
      || mapLocations.find(location => location.id === value)
      || mapLocations.find(location => location.name === value)
      || null;
  };
  const canMarkCurrentLocation = (text: string): boolean => {
    // A current-place shortcut is only safe for a printed note/mark. Delivery
    // addresses, path construction, removal, movement, and "last seen"
    // directions all require a different location chosen by the player.
    if (/(?:4\s*(?:paths?|경로)|last\s+saw|previous(?:ly)?|nearest\s+settlement|move\s+(?:yourself\s+)?to|connect|remove|path|route|다른\s+위치|네\s*갈래|이전\s+위치|가까운\s+정착지|이동|연결|제거|경로)/iu.test(text)) return false;
    if (/(?:wild\s+(?:meadow|bog|forest)|야생\s*(?:초원|늪지|숲))/iu.test(text)) {
      return currentLocation?.kind === 'wild' && ['Meadow', 'Bog', 'Forest'].includes(currentLocation.region || '');
    }
    return true;
  };
  const updateMapTarget = (key: string, value: string, locationId: string | undefined, targetKind: 'input' | 'action') => onChange(current => {
    const next = targetKind === 'input'
      ? setManualEffectInput(key, value)(current)
      : setManualEffectActionTarget(key, value)(current);
    const mapTargetIds = { ...(next.mapTargetIds || {}) };
    if (locationId) mapTargetIds[key] = locationId;
    else delete mapTargetIds[key];
    return { ...next, mapTargetIds };
  });
  const mapTargetControls = (
    key: string,
    value: string,
    label: string,
    contextText: string,
    targetKind: 'input' | 'action',
    allowCurrentShortcut = true
  ) => {
    const selected = mapLocationFor(key, value);
    const canUseCurrent = Boolean(allowCurrentShortcut && currentLocation && canMarkCurrentLocation(contextText));
    return <div className="manual-effect__map-target">
      <div className="manual-effect__map-target-actions">
        {canUseCurrent && <button
          type="button"
          className="manual-effect__map-current"
          onClick={() => updateMapTarget(key, currentLocation!.name, currentLocation!.id, targetKind)}
        >이 장소에 표기 · {currentLocation!.name}</button>}
        <select
          aria-label={`${label} 지도 위치 선택`}
          value={selected?.id || ''}
          onChange={event => {
            const option = mapLocations.find(location => location.id === event.target.value);
            updateMapTarget(key, option?.name || '', option?.id, targetKind);
          }}
        >
          <option value="">기존 지도 위치에서 선택</option>
          {mapLocations.map(location => <option key={location.id} value={location.id}>{location.name}{location.region ? ` · ${location.region}` : ''}</option>)}
        </select>
      </div>
      <input
        aria-label={`${label} 지도 위치 이름`}
        value={selected?.name || value}
        onChange={event => updateMapTarget(key, event.target.value, undefined, targetKind)}
        placeholder="지도에 남길 위치 이름"
      />
    </div>;
  };
  const requiredComplete = draft.inputFields.every(field =>
    !field.required || isPrintedResolutionInputSatisfied(field, draft.inputValues[field.id])
  );
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
  const actionTarget = (action: ManualEffectDraft['actionTemplates'][number]): string => {
    if (action.fixedTarget) return action.fixedTarget;
    if (action.targetInputId) return String(draft.inputValues[action.targetInputId] ?? '');
    return draft.actionTargets[action.id] || '';
  };
  const actionTargetsComplete = selectedActions.every(action =>
    action.targetType !== 'inventory-item'
    && action.targetType !== 'location'
    && action.targetType !== 'free-text'
      ? true
      : Boolean(actionTarget(action).trim())
  );
  const canResolve = requiredComplete && actionTargetsComplete && recordText.resultSummary.trim().length > 0;
  const hasChoiceField = draft.inputFields.some(field => field.type === 'choice');

  const localizedOption = (option: string, optionIndex: number, options: string[]): string => {
    const normalizedOption = normalizeChoiceHeading(option);
    const usesTopLevelEncounterChoiceOrder = options.length === draft.choices.length
      && options.every((candidate, index) => candidate === draft.choices[index]);
    const matchedChoice = encounter?.choices.find(choice =>
      choice.label === option || normalizeChoiceHeading(choice.label) === normalizedOption
    ) || (usesTopLevelEncounterChoiceOrder && encounter?.choices.length === options.length
      ? encounter.choices[optionIndex]
      : undefined);
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
                    onClick={() => {
                      if (selected && field.required) return;
                      updateInput(field.id, selected ? '' : option);
                    }}
                  >{localizedOption(option, optionIndex, options)}</button>;
                })}
              </div>
              {!field.required && <small>선택한 항목을 다시 누르면 비울 수 있습니다.</small>}
            </fieldset>;
          }
          if (field.type === 'number') return <label key={field.id}><span>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</span><input type="number" value={typeof value === 'number' ? value : ''} onChange={event => updateInput(field.id, event.target.value === '' ? '' : Number(event.target.value))} />{field.helpText && <small>{localizeManualEffectValue(field.helpText)}</small>}</label>;
          if (field.type === 'condition') return <label key={field.id} className="manual-effect__check"><input type="checkbox" checked={value === true} onChange={event => updateInput(field.id, event.target.checked)} /><span>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</span></label>;
          if (field.type === 'target') return <label key={field.id} className="manual-effect__target-field"><span>{localizeManualEffectValue(field.label)}{field.required ? ' *' : ''}</span>{mapTargetControls(field.id, String(value ?? ''), localizeManualEffectValue(field.label), `${field.label} ${field.helpText || ''}`, 'input')}{field.helpText && <small>{localizeManualEffectValue(field.helpText)}</small>}</label>;
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
        const target = actionTarget(action);
        const targetOwnedByInput = Boolean(action.targetInputId);
        return <div key={action.id} className={`manual-effect__action-row${selected ? ' is-selected' : ''}`}>
          <label className="manual-effect__check"><input type="checkbox" checked={selected} disabled={action.required} onChange={event => onChange(setManualEffectActionSelected(action.id, event.target.checked))} /><span>{localizeManualEffectValue(action.label)}{action.required ? ' · 필수' : ''}</span></label>
          <small>{localizeManualEffectLine(action.sourceText)}</small>
          {selected && action.fixedTarget && <small className="manual-effect__fixed-target">{localizeManualEffectValue(action.fixedTarget)}</small>}
          {selected && action.targetInputId && target && <small className="manual-effect__fixed-target">{localizeManualEffectValue(target)}</small>}
          {selected && !targetOwnedByInput && action.targetType === 'inventory-item' && <select aria-label={`${localizeManualEffectValue(action.label)} 대상`} value={target} onChange={event => onChange(setManualEffectActionTarget(action.id, event.target.value))}><option value="">가방에서 선택</option>{inventoryItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
          {selected && action.targetType === 'timer' && <select aria-label={`${localizeManualEffectValue(action.label)} 대상`} value={target} onChange={event => onChange(setManualEffectActionTarget(action.id, event.target.value))}><option value="">모든 활성 타이머</option>{timers.map(timer => <option key={timer.id} value={timer.id}>{timer.label}</option>)}</select>}
          {selected && !targetOwnedByInput && action.targetType === 'location' && mapTargetControls(action.id, target, localizeManualEffectValue(action.label), `${action.label} ${action.sourceText}`, 'action', action.kind === 'record-map-change')}
          {selected && !targetOwnedByInput && action.targetType === 'free-text' && <input aria-label={`${localizeManualEffectValue(action.label)} 대상 또는 결과`} value={target} onChange={event => onChange(setManualEffectActionTarget(action.id, event.target.value))} placeholder="원문이 지정한 대상이나 결과" />}
        </div>;
      })}{selectedActions.length > 0 && <div className="manual-effect__preview"><strong>적용할 변화</strong><ul>{selectedActions.map(action => { const target = actionTarget(action); return <li key={action.id}>{localizeManualEffectValue(action.label)}{target ? ` · ${target}` : ''}</li>; })}</ul></div>}</div>
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
        <label><span>판정 결과 요약 *</span><textarea value={recordText.resultSummary} onChange={event => updateRecordText('resultSummary', event.target.value)} onBlur={commitRecordText} rows={3} placeholder="무엇을 골랐고, 어떤 일이 일어났나요?" /></label>
        <label><span>저널 기록 <small>선택 · 비우면 판정 결과 요약을 그대로 기록합니다</small></span><textarea value={recordText.journalNote} onChange={event => updateRecordText('journalNote', event.target.value)} onBlur={commitRecordText} rows={4} placeholder="이 장면을 더 자세히 기억하고 싶을 때 적어 두세요." /></label>
      </div>

      <details className="manual-effect__override">
        <summary>원문과 다르게 처리해야 하나요?</summary>
        <label><span>예외 처리 사유</span><textarea value={recordText.overrideReason} onChange={event => updateRecordText('overrideReason', event.target.value)} onBlur={commitRecordText} rows={2} placeholder="원문과 다른 처리를 선택한 이유" /></label>
      </details>

      <div className="manual-effect__actions"><button type="button" onClick={() => onDefer(recordTextRef.current)}>잠시 덮어두기</button><button type="button" className="btn-cozy-primary" disabled={!canResolve} onClick={() => onResolve(false, recordTextRef.current)}>이 결과 적용하고 기록</button><button type="button" className="btn-cozy-danger" disabled={!canResolve || !recordText.overrideReason.trim()} onClick={() => onResolve(true, recordTextRef.current)}>원문과 다르게 기록</button></div>
    </section>
  </section>;
}
