import type { CSSProperties } from 'react';
import { formatRuleTag, getTagTooltip } from '../localization/ruleTagsKo';
import { ruleTagPalette, splitRuleTagText } from '../ruleTagPresentation';

export function RuleTagBadge({ tag, value, minimum = false }: { tag: string; value?: number | string; minimum?: boolean }) {
  const colors = ruleTagPalette(tag);
  const style = { '--tag-paper': colors.bg, '--tag-ink': colors.text, '--tag-edge': colors.border } as CSSProperties;
  return <span className="rule-tag" data-rule-tag={formatRuleTag(tag)} style={style} title={getTagTooltip(tag)}>
    <span>{formatRuleTag(tag)}</span>{value !== undefined && ' '}{value !== undefined && <span className="rule-tag__value">{minimum ? '≥ ' : ''}{value}</span>}
  </span>;
}

export function RuleTagText({ text }: { text: string }) {
  return <span className="rule-tag-list">{splitRuleTagText(text).map((part, index) => 'tag' in part
    ? <RuleTagBadge key={index} tag={part.tag} value={part.value} minimum={part.minimum} />
    : <span key={index} className="rule-tag-list__join">{part.text}</span>)}</span>;
}

export function RuleTagValues({ values }: { values: readonly { tag: string; value: number }[] }) {
  return <span className="rule-tag-list">{values.map((value, index) => <RuleTagBadge key={`${value.tag}:${index}`} tag={value.tag} value={value.value} />)}</span>;
}
