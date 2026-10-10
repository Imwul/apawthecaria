import { useId } from 'react';
import type { CampaignContinuityState } from '../campaignContinuity';
import type { RulebookReferenceRequest } from '../rulebook/types';
import { getQuickRulesPresentation, QUICK_RULES, quickRuleRequest, type QuickRule } from '../quickRules';

export interface QuickRulesProps {
  state: CampaignContinuityState;
  onOpenReference: (request: RulebookReferenceRequest) => void;
}

export default function QuickRules({ state, onOpenReference }: QuickRulesProps) {
  const id = useId();
  const presentation = getQuickRulesPresentation(state);
  const relevant = presentation.relevantIds.map(ruleId => QUICK_RULES.find(rule => rule.id === ruleId)!);
  const remaining = QUICK_RULES.filter(rule => !presentation.relevantIds.includes(rule.id));
  const ruleButton = (rule: QuickRule) => <button key={rule.id} type="button" className="quick-rules__rule"
    onClick={() => onOpenReference(quickRuleRequest(rule, presentation.context))}>
    <span className="quick-rules__label"><strong>{rule.label}</strong><span>p.{rule.page} ↗</span></span>
    <span className="quick-rules__summary">{rule.summary}</span>
  </button>;
  return <section className={`quick-rules${presentation.urgent ? ' quick-rules--urgent' : ''}`} aria-labelledby={`${id}-title`}>
    <header className="quick-rules__heading"><h2 id={`${id}-title`}>지금 참고할 규칙</h2><span>한 번 눌러 절차 확인</span></header>
    <p className="quick-rules__context">{presentation.context}</p>
    <div className="quick-rules__list">{relevant.map(ruleButton)}</div>
    <details className="quick-rules__more"><summary>다른 반복 규칙 {remaining.length}개</summary>
      <div className="quick-rules__list">{remaining.map(ruleButton)}</div>
    </details>
  </section>;
}
