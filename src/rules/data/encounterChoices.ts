import type { EncounterChoice, EncounterDefinition, RuleEffect, StructuredRuleEffect } from '../types';

const implemented = (effect: RuleEffect): StructuredRuleEffect => ({ support: 'implemented', effect });
const leftover = (code: string, description: string): StructuredRuleEffect => ({
  support: 'manual-only',
  effect: { type: 'customEffect', code, description }
});

// A valid printed heading can begin with the one-letter article “A” (for
// example “A Stern Lecture”). Requiring a second non-space character merged
// that branch into the preceding choice and changed the rule shown in the UI.
const CHOICE_SPLIT = /(?:^|[.!?]\s+)([A-Z][A-Za-z0-9'&/! ]{0,43})\s+-\s+/g;

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'choice';

const CONDITIONAL_TIMING = /\b(?:if|unless|when|whenever|after|before|once|until|next|future|following)\b|every ?time|from now on/i;
const MECHANICAL_CHANGE = /\b(?:gain|lose|mark|add|discard|remove|decrease|reduce|increase|pay|trade|spend)\b/i;
const SUIT_BRANCH = /[♥♦♣♠](?:\s*(?:(?:or)|[,/&])\s*[♥♦♣♠])*\s*[-–—]/i;
const sourceClauses = (value: string): string[] => value
  .split(/(?<=[.!?])\s+/)
  .map(row => row.trim())
  .filter(Boolean);

const isKnownPersistentCondition = (value: string): boolean =>
  /every ?time you forage in a bog/i.test(value)
  || /doesn.?t use up one of your paths/i.test(value)
  || /ignore any negative effects from midges until you next move/i.test(value)
  || /ignore the negative effects of an event in this location/i.test(value)
  || /double your speed for your next move/i.test(value)
  || /gain 3 foraging points after completing an encounter in this location, until you next move/i.test(value)
  || /you can redraw an encounter card once until you next move/i.test(value);

const hasUnhandledConditionalMechanicalChange = (value: string): boolean => sourceClauses(value).some(clause =>
  CONDITIONAL_TIMING.test(clause)
  && MECHANICAL_CHANGE.test(clause)
  && !isKnownPersistentCondition(clause)
);

const leftoverMechanical = (body: string): boolean =>
  /draw a card|draw two cards|draw another card|draw 3 cards|abandon your journey|start a new ailment|gain a .{0,40}companion|add a titan|gain a tool|nearest settlement|wound|soaked|discard.{0,20}reagent|lose (?:a |1 |one )?reagent|follow-up|redraw|mark this location|behemoth barrow|path from this location|unconnected nearby|haggl|gain a .{0,40}reagent|add any part|add .{0,40}to your bags|lose either|titan thingamabob|titan rash|titan codex|establish a clinic|honey ?bee companion|increase the rarity|you do not gain foraging points|swap the encounter|create 3 trinkets|end your (?:soar|journey)|cannot forage|cannot gain foraging points/i.test(body)
  || hasUnhandledConditionalMechanicalChange(body);

export const parseMechanicalEffects = (body: string): StructuredRuleEffect[] => {
  const effects: StructuredRuleEffect[] = [];
  // Conditional and delayed rewards remain manual unless a dedicated condition
  // executor below can represent them. Applying them immediately changes the
  // printed outcome (for example, a parcel reward due only on later delivery).
  // Printed suit branches are also conditional. Only the text before the first
  // branch may be applied automatically; otherwise a reward in one branch can be
  // granted before the player has even entered the follow-up card result.
  const firstSuitBranch = body.search(SUIT_BRANCH);
  const unconditionalBody = firstSuitBranch >= 0 ? body.slice(0, firstSuitBranch) : body;
  const immediateBody = sourceClauses(unconditionalBody)
    .filter(clause => !CONDITIONAL_TIMING.test(clause))
    .join(' ');
  const gainRep = [...immediateBody.matchAll(/gain (\d+) reputation/gi)];
  const loseRep = [...immediateBody.matchAll(/lose (\d+) reputation/gi)];
  const decreaseTimers = [...immediateBody.matchAll(/(?:decrease|reduce) timers? by (?:an additional )?(\d+)/gi)];
  const increaseTimers = [...immediateBody.matchAll(/(?:increase|add) (?:(\d+) to (?:your )?next timer|timers? by (\d+))/gi)];
  const days = [...immediateBody.matchAll(/(?:mark (\d+) days?(?: on your calendar)?|add (\d+) days? to your calendar)/gi)];
  const gainForaging = [...immediateBody.matchAll(/gain (\d+) foraging points?/gi)];
  const loseForaging = [...immediateBody.matchAll(/lose (\d+) foraging points?/gi)];
  const trinkets = [...immediateBody.matchAll(/gain (\d+) trinkets?/gi)];
  const loseTrinkets = [...immediateBody.matchAll(/lose (\d+) trinkets?/gi)];
  const payTrinkets = [...immediateBody.matchAll(/(?:pay|trade|spend) (\d+) trinkets?/gi)];

  gainRep.forEach(match => effects.push(implemented({ type: 'modifyReputation', amount: Number(match[1]) })));
  loseRep.forEach(match => effects.push(implemented({ type: 'modifyReputation', amount: -Number(match[1]) })));
  decreaseTimers.forEach(match => effects.push(implemented({ type: 'modifyTimer', amount: -Number(match[1]), target: 'all' })));
  increaseTimers.forEach(match => {
    const amount = Number(match[1] || match[2]);
    if (Number.isFinite(amount)) effects.push(implemented({ type: 'modifyTimer', amount, target: 'all' }));
  });
  days.forEach(match => {
    const amount = Number(match[1] || match[2]);
    if (Number.isFinite(amount)) effects.push(implemented({ type: 'markDays', amount }));
  });
  gainForaging.forEach(match => effects.push(implemented({ type: 'modifyForagingPoints', amount: Number(match[1]) })));
  loseForaging.forEach(match => effects.push(implemented({ type: 'modifyForagingPoints', amount: -Number(match[1]) })));
  if (/gain (?:a |1 |an )?(?:[\w'-]+ )?trinket(?!s)/i.test(immediateBody) && trinkets.length === 0) {
    effects.push(implemented({ type: 'modifyTrinkets', amount: 1 }));
  }
  trinkets.forEach(match => effects.push(implemented({ type: 'modifyTrinkets', amount: Number(match[1]) })));
  loseTrinkets.forEach(match => effects.push(implemented({ type: 'modifyTrinkets', amount: -Number(match[1]) })));
  payTrinkets.forEach(match => effects.push(implemented({ type: 'modifyTrinkets', amount: -Number(match[1]) })));
  if (/leave a trinket|trade a trinket(?!s)/i.test(immediateBody) && payTrinkets.length === 0) {
    effects.push(implemented({ type: 'modifyTrinkets', amount: -1 }));
  }
  if (/\bmark a day\b/i.test(immediateBody) && days.length === 0) {
    effects.push(implemented({ type: 'markDays', amount: 1 }));
  }
  if (/every ?time you forage in a bog/i.test(body)) {
    effects.push(implemented({ type: 'addCondition', conditionId: 'forage-bonus:Bog:1' }));
  }
  if (/doesn.?t use up one of your paths/i.test(body)) {
    effects.push(implemented({ type: 'addCondition', conditionId: 'free-path:current' }));
  }
  if (/ignore any negative effects from midges until you next move/i.test(body)) {
    effects.push(implemented({ type: 'addCondition', conditionId: 'ignore-midges-until-move' }));
  }
  if (/ignore the negative effects of an event in this location/i.test(body)) {
    effects.push(implemented({ type: 'addCondition', conditionId: 'ignore-negative-here-until-move' }));
  }
  if (/double your speed for your next move/i.test(body)) {
    effects.push(implemented({ type: 'addCondition', conditionId: 'next-move-speed-double' }));
  }
  if (/gain 3 foraging points after completing an encounter in this location, until you next move/i.test(body)) {
    effects.push(implemented({ type: 'addCondition', conditionId: 'location-encounter-fp:3' }));
  }
  if (/you can redraw an encounter card once until you next move/i.test(body)) {
    effects.push(implemented({ type: 'addCondition', conditionId: 'redraw-encounter-once' }));
  }
  return effects;
};

export const leftoverNeeded = leftoverMechanical;

export const splitEncounterChoices = (prompt: string): { description: string; choices: EncounterChoice[] } => {
  const matches = [...prompt.matchAll(CHOICE_SPLIT)];
  if (matches.length === 0) {
    const effects = parseMechanicalEffects(prompt);
    if (leftoverMechanical(prompt)) effects.push(leftover('PRINTED_FOLLOW_UP', prompt.trim()));
    return {
      description: prompt.trim(),
      choices: [{
        id: 'continue',
        label: '기록하고 계속',
        effects
      }]
    };
  }
  const description = prompt.slice(0, matches[0].index).trim();
  const choices = matches.map((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || prompt.length : prompt.length;
    const body = prompt.slice(start, end).replace(/\s+/g, ' ').trim();
    const effects = parseMechanicalEffects(body);
    if (leftoverMechanical(body)) effects.push(leftover('PRINTED_FOLLOW_UP', body));
    return {
      id: slug(match[1]),
      label: `${match[1].trim()} — ${body}`,
      effects
    };
  });
  return { description: description || prompt.trim(), choices };
};

export const enrichEncounterChoices = (encounter: EncounterDefinition): EncounterDefinition => {
  if (encounter.choices.length > 0) return encounter;
  const stripped = encounter.cardKey && encounter.cardKey !== 'A'
    ? encounter.prompt.replace(/\bACE\b[\s\S]*$/i, '').trim()
    : encounter.prompt;
  const { choices } = splitEncounterChoices(stripped);
  return {
    ...encounter,
    prompt: encounter.prompt,
    choices,
    mandatoryEffects: encounter.mandatoryEffects.filter(effect =>
      effect.effect.type !== 'customEffect'
      || (effect.effect.code !== 'ENCOUNTER_PRINTED_TEXT' && effect.effect.code !== 'SOCIAL_PRINTED_TEXT')
    )
  };
};
