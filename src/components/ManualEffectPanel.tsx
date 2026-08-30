import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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
      ? '원문이 플레이어에게 맡긴 선택입니다. 실제로 고른 결과만 확인하면 앱이 연결된 변화를 기록합니다.'
      : '원문이 판단이나 묘사를 플레이어에게 맡긴 장면입니다. 정해진 답을 요구하지 않으며, 확인한 결과만 기록합니다.';
  }
  return '이 효과는 원문이 조건이나 결과를 플레이어에게 맡깁니다. 아래에서 실제로 일어난 결과를 고르면 앱은 확인한 변화만 캠페인에 반영합니다.';
};

type ManualEffectRecordText = Pick<ManualEffectDraft, 'resultSummary' | 'journalNote' | 'overrideReason'>;

const recordTextFor = (draft: ManualEffectDraft): ManualEffectRecordText => ({
  resultSummary: draft.resultSummary,
  journalNote: draft.journalNote,
  overrideReason: draft.overrideReason
});

const isGameplayRequiredField = (field: ManualEffectDraft['inputFields'][number]): boolean => (
  field.required && field.type !== 'free-text'
);

/**
 * A text field inside this panel must not write the whole campaign on every
 * keystroke. Keep the composition local and persist it when the player leaves
 * the field. This prevents Korean IME composition from being interrupted by a
 * parent render/save cycle and avoids a delayed campaign save while the player
 * is still composing a sentence.
 */
function BufferedTextControl({
  value,
  onCommit,
  multiline = false,
  rows,
  ...props
}: {
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  rows?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>
  & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'onBlur'>) {
  const [localValue, setLocalValue] = useState(value);
  const localValueRef = useRef(value);
  const editingRef = useRef(false);

  useEffect(() => {
    if (editingRef.current || value === localValueRef.current) return;
    localValueRef.current = value;
    setLocalValue(value);
  }, [value]);

  const update = (next: string) => {
    localValueRef.current = next;
    setLocalValue(next);
  };
  const commit = () => {
    editingRef.current = false;
    if (localValueRef.current !== value) onCommit(localValueRef.current);
  };
  const common = {
    ...props,
    value: localValue,
    onFocus: () => { editingRef.current = true; },
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(event.target.value),
    onBlur: commit
  };

  return multiline
    ? <textarea {...common} rows={rows} />
    : <input {...common} />;
}

const actionTargetFor = (
  draft: ManualEffectDraft,
  action: ManualEffectDraft['actionTemplates'][number]
): string => {
  if (action.fixedTarget) return action.fixedTarget;
  if (action.targetInputId) return String(draft.inputValues[action.targetInputId] ?? '');
  return draft.actionTargets[action.id] || '';
};

/**
 * Structured decisions already say what happened.  Requiring the player to
 * type the same information again adds no gameplay value, so use it as the
 * default record while keeping genuinely narrative outcomes writable.
 */
const buildManualEffectStructuredSummary = (
  draft: ManualEffectDraft,
  describeTarget: (action: ManualEffectDraft['actionTemplates'][number], target: string) => string = (_action, target) => target
): string => {
  const choices = draft.inputFields.flatMap(field => {
    if (field.type !== 'choice') return [];
    const value = draft.inputValues[field.id];
    return typeof value === 'string' && value.trim()
      ? [`${localizeManualEffectValue(field.label)} · ${localizeManualEffectValue(value)}`]
      : [];
  });
  const actions = draft.actionTemplates.flatMap(action => {
    if (!draft.selectedActionIds.includes(action.id)) return [];
    const target = actionTargetFor(draft, action);
    const readableTarget = target ? describeTarget(action, target) : '';
    return [`${localizeManualEffectValue(action.label)}${readableTarget ? ` · ${localizeManualEffectValue(readableTarget)}` : ''}`];
  });
  const confirmations = draft.inputFields.flatMap(field => (
    field.type === 'condition' && draft.inputValues[field.id] === true
      ? [localizeManualEffectValue(field.label)]
      : []
  ));
  return [
    choices.length > 0 ? `선택 · ${choices.join(' / ')}` : '',
    actions.length > 0 ? `변화 · ${actions.join(' / ')}` : '',
    confirmations.length > 0 ? `확인 · ${confirmations.join(' / ')}` : ''
  ].filter(Boolean).join('\n');
};

/**
 * Keep the free-form record editor outside the large rule/context panel's
 * render path.  A manual judgement can contain a long note; updating the
 * textarea should not re-render every translated option, map selector and
 * rulebook excerpt on each keystroke.
 */
function ManualEffectRecordStage({
  draft,
  canResolve,
  automaticSummary,
  onChange,
  onDefer,
  onResolve
}: {
  draft: ManualEffectDraft;
  canResolve: boolean;
  automaticSummary: string;
  onChange: (updater: ManualEffectDraftUpdater) => void;
  onDefer: (recordText?: ManualEffectRecordText) => void;
  onResolve: (override: boolean, recordText?: ManualEffectRecordText) => void;
}) {
  const [recordText, setRecordText] = useState<ManualEffectRecordText>(() => recordTextFor(draft));
  const [memoryOpen, setMemoryOpen] = useState(() => Boolean(draft.resultSummary.trim() || draft.journalNote.trim()));
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
  const effectiveSummary = recordText.resultSummary.trim() || automaticSummary.trim();
  const canRecordResult = effectiveSummary.length > 0;
  const resolvedRecordText = (): ManualEffectRecordText => ({
    ...recordTextRef.current,
    resultSummary: recordTextRef.current.resultSummary.trim() || automaticSummary.trim()
  });

  return <section className={`manual-effect__stage manual-effect__stage--${'record'}`} aria-labelledby="manual-effect-record-title">
    <div className="manual-effect__stage-heading">
      <span aria-hidden="true">3</span>
      <div>
        <h3 id="manual-effect-record-title">장면 마무리</h3>
        <p>고른 선택지와 적용할 변화는 자동으로 기록됩니다. 장면 메모는 남기고 싶을 때만 쓰세요.</p>
      </div>
    </div>

    <div className="manual-effect__automatic-record" aria-live="polite">
      <strong>자동 기록될 내용</strong>
      <p>{automaticSummary}</p>
    </div>

    <details className="manual-effect__memory" open={memoryOpen} onToggle={event => setMemoryOpen(event.currentTarget.open)}>
      <summary>장면에 메모 덧붙이기 <small>선택 · 쓰지 않아도 진행할 수 있습니다</small></summary>
      <div className="manual-effect__record-fields">
        <label><span>결과 메모</span><textarea value={recordText.resultSummary} onChange={event => updateRecordText('resultSummary', event.target.value)} onBlur={commitRecordText} rows={3} placeholder="자동 기록 대신 남길 짧은 결과" /></label>
        <label><span>저널 기록 <small>선택 · 비우면 판정 결과 요약을 그대로 기록합니다</small></span><textarea value={recordText.journalNote} onChange={event => updateRecordText('journalNote', event.target.value)} onBlur={commitRecordText} rows={4} placeholder="이 장면을 더 자세히 기억하고 싶을 때 적어 두세요." /></label>
      </div>
    </details>

    <details className="manual-effect__override">
      <summary>원문과 다르게 처리해야 하나요?</summary>
      <label><span>예외 처리 사유</span><textarea value={recordText.overrideReason} onChange={event => updateRecordText('overrideReason', event.target.value)} onBlur={commitRecordText} rows={2} placeholder="원문과 다른 처리를 선택한 이유" /></label>
    </details>

    <div className="manual-effect__actions"><button type="button" onClick={() => onDefer(recordTextRef.current)}>나중에 마무리</button><button type="button" className="btn-cozy-primary" disabled={!canResolve || !canRecordResult} onClick={() => onResolve(false, resolvedRecordText())}>선택한 결과 적용</button><button type="button" className="btn-cozy-danger" disabled={!canResolve || !canRecordResult || !recordText.overrideReason.trim()} onClick={() => onResolve(true, resolvedRecordText())}>원문과 다르게 적용</button></div>
  </section>;
}



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
  // The parent receives the text on blur or when the player commits/defers the
  // manual result, so gameplay state and persistence still use the final text.
  // App keys this panel by effect id, so a new pending effect gets a fresh
  // record draft without synchronously resetting state in an effect.
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
      <BufferedTextControl
        aria-label={`${label} 지도 위치 이름`}
        value={selected?.name || value}
        onCommit={next => updateMapTarget(key, next, undefined, targetKind)}
        placeholder="지도에 남길 위치 이름"
      />
    </div>;
  };
  const requiredComplete = draft.inputFields.every(field =>
    !isGameplayRequiredField(field) || isPrintedResolutionInputSatisfied(field, draft.inputValues[field.id])
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
  const actionTarget = (action: ManualEffectDraft['actionTemplates'][number]): string => actionTargetFor(draft, action);
  const readableActionTarget = (action: ManualEffectDraft['actionTemplates'][number], target: string): string => {
    if (!target) return '';
    if (action.targetType === 'inventory-item') {
      return inventoryItems.find(item => item.id === target)?.name || '선택한 가방 물품';
    }
    if (action.targetType === 'timer') {
      return timers.find(timer => timer.id === target)?.label || '선택한 환자 Timer';
    }
    if (action.targetType === 'location') {
      return mapLocations.find(location => location.id === target || location.name === target)?.name || target;
    }
    return target;
  };
  const inputIsRequired = (field: ManualEffectDraft['inputFields'][number]): boolean => (
    isGameplayRequiredField(field)
    || draft.actionTemplates.some(action =>
      action.required
      && action.targetInputId === field.id
      && action.targetType === 'free-text'
    )
  );
  const actionTargetsComplete = selectedActions.every(action =>
    action.targetType !== 'inventory-item'
    && action.targetType !== 'location'
    && action.targetType !== 'free-text'
      ? true
      : Boolean(actionTarget(action).trim())
  );
  const canResolve = requiredComplete && actionTargetsComplete;
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
      <span className="status-label status-label--manual">직접 고를 장면</span>
      <h2 id="manual-effect-title">{localizedSummary}</h2>
      <p>{draft.ruleIds.join(' · ')} · 원문 p.{draft.sourcePage} · {localizeManualEffectTrigger(draft.trigger)}</p>
      <button type="button" className="manual-effect__defer-top" onClick={() => onDefer()}>닫고 나중에</button>
    </header>

    <details className="manual-effect__why">
      <summary id="manual-effect-why-title">왜 직접 고르나요?</summary>
      <p>{manualReason(draft)}</p>
    </details>

    <section className="manual-effect__stage manual-effect__stage--scene" aria-labelledby="manual-effect-scene-title">
      <div className="manual-effect__stage-heading">
        <span aria-hidden="true">1</span>
        <div>
          <h3 id="manual-effect-scene-title">장면을 읽고 고르기</h3>
          <p>원문 장면을 확인하고, 실제로 택한 분기나 적용에 필요한 대상만 고르세요.</p>
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
          const required = inputIsRequired(field);
          if (field.type === 'choice') {
            const options = field.options || [];
            return <fieldset key={field.id} className="manual-effect__choice-field">
              <legend>{localizeManualEffectValue(field.label)}{required ? ' *' : ''}</legend>
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
              {!required && <small>선택한 항목을 다시 누르면 비울 수 있습니다.</small>}
            </fieldset>;
          }
          if (field.type === 'number') return <label key={field.id}><span>{localizeManualEffectValue(field.label)}{required ? ' *' : ''}</span><input type="number" value={typeof value === 'number' ? value : ''} onChange={event => updateInput(field.id, event.target.value === '' ? '' : Number(event.target.value))} />{field.helpText && <small>{localizeManualEffectValue(field.helpText)}</small>}</label>;
          if (field.type === 'condition') return <label key={field.id} className="manual-effect__check"><input type="checkbox" checked={value === true} onChange={event => updateInput(field.id, event.target.checked)} /><span>{localizeManualEffectValue(field.label)}{required ? ' *' : ''}</span></label>;
          if (field.type === 'target') return <label key={field.id} className="manual-effect__target-field"><span>{localizeManualEffectValue(field.label)}{required ? ' *' : ''}</span>{mapTargetControls(field.id, String(value ?? ''), localizeManualEffectValue(field.label), `${field.label} ${field.helpText || ''}`, 'input')}{field.helpText && <small>{localizeManualEffectValue(field.helpText)}</small>}</label>;
          if (field.type === 'free-text') return <details key={field.id} className="manual-effect__narrative-input" open={required || Boolean(String(value ?? '').trim())}>
            <summary>{localizeManualEffectValue(field.label)} <small>{required ? '· 이 변화에 필요' : '· 선택'}</small></summary>
            <label>
              <span className="sr-only">{localizeManualEffectValue(field.label)}</span>
              <BufferedTextControl
                multiline
                rows={3}
                aria-label={localizeManualEffectValue(field.label)}
                value={String(value ?? '')}
                onCommit={next => updateInput(field.id, next)}
                placeholder={field.helpText ? localizeManualEffectValue(field.helpText) : undefined}
              />
              {required && field.helpText && <small>{localizeManualEffectValue(field.helpText)}</small>}
            </label>
          </details>;
          return <label key={field.id}><span>{localizeManualEffectValue(field.label)}{required ? ' *' : ''}</span><BufferedTextControl
            value={String(value ?? '')}
            onCommit={next => updateInput(field.id, next)}
            placeholder={field.helpText ? localizeManualEffectValue(field.helpText) : undefined}
          /></label>;
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
          {selected && !targetOwnedByInput && action.targetType === 'free-text' && <BufferedTextControl aria-label={`${localizeManualEffectValue(action.label)} 대상 또는 결과`} value={target} onCommit={next => onChange(setManualEffectActionTarget(action.id, next))} placeholder="원문이 지정한 대상이나 결과" />}
        </div>;
      })}{selectedActions.length > 0 && <div className="manual-effect__preview"><strong>적용할 변화</strong><ul>{selectedActions.map(action => { const target = actionTarget(action); const readableTarget = readableActionTarget(action, target); return <li key={action.id}>{localizeManualEffectValue(action.label)}{readableTarget ? ` · ${localizeManualEffectValue(readableTarget)}` : ''}</li>; })}</ul></div>}</div>
         : <p className="manual-effect__no-change">이 판정은 앱의 수치를 자동으로 바꾸지 않습니다. 필요한 선택만 확인한 뒤 진행하세요. 장면 메모는 선택입니다.</p>}

      {draft.followUpRequirements.length > 0 && <div className="manual-effect__follow-up"><h4>이어서 확인할 판정</h4><ul>{draft.followUpRequirements.map((row, index) => <li key={`${index}:${row}`}>{localizeManualEffectLine(row)}</li>)}</ul><p>지금 완료 내용을 입력하지 않으면 별도의 미해결 후속 판정으로 저장됩니다.</p></div>}
    </section>

    {/* The record stage is intentionally isolated from the large context panel. */}
    <ManualEffectRecordStage
      draft={draft}
      canResolve={canResolve}
      automaticSummary={buildManualEffectStructuredSummary(draft, readableActionTarget) || `장면 확인 · ${localizedSummary}`}
      onChange={onChange}
      onDefer={onDefer}
      onResolve={onResolve}
    />
  </section>;
}
